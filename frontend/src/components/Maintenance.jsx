import { useState, useRef, useEffect } from "react";
import { ChevronDown, ChevronRight, X, Loader2, Plus } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

const stages = ["Pending", "Approved", "Technician Assigned", "In Progress", "Resolved"];

const nextAction = {
  Pending: { endpoint: "approve", label: "Approve" },
  Approved: { endpoint: "assign-technician", label: "Assign technician", needsInput: "technician" },
  "Technician Assigned": { endpoint: "start", label: "Start work" },
  "In Progress": { endpoint: "resolve", label: "Resolve", needsInput: "resolutionNotes" },
};

export default function MaintenancePage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [requests, setRequests] = useState([]);
  const [assets, setAssets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [meRes, reqRes, assetsRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/maintenance`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/assets`, { withCredentials: true }),
        ]);
        if (cancelled) return;
        setUser(meRes.data.user);
        setRequests(reqRes.data);
        setAssets(assetsRes.data.assets);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) return navigate("/");
        setError("Couldn't load maintenance requests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navigate]);

  async function advance(req) {
    const action = nextAction[req.status];
    if (!action) return;

    let body = {};
    if (action.needsInput === "technician") {
      const technician = window.prompt("Technician name:");
      if (!technician) return;
      body = { technician };
    } else if (action.needsInput === "resolutionNotes") {
      const resolutionNotes = window.prompt("Resolution notes (optional):") || "";
      body = { resolutionNotes };
    }

    setBusyId(req._id);
    setError("");
    try {
      const res = await axios.patch(`${BASE_URL}/api/maintenance/${req._id}/${action.endpoint}`, body, { withCredentials: true });
      setRequests((prev) => prev.map((r) => (r._id === req._id ? res.data : r)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update request.");
    } finally {
      setBusyId(null);
    }
  }

  async function reject(req) {
    const rejectionReason = window.prompt("Reason for rejecting this request:");
    if (rejectionReason === null) return;
    setBusyId(req._id);
    setError("");
    try {
      const res = await axios.patch(`${BASE_URL}/api/maintenance/${req._id}/reject`, { rejectionReason }, { withCredentials: true });
      setRequests((prev) => prev.map((r) => (r._id === req._id ? res.data : r)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to reject request.");
    } finally {
      setBusyId(null);
    }
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E13] font-['Inter'] flex fade-in">
      <Sidebar />
      <div className="flex-1 min-w-0 w-full p-4 pt-20 sm:p-8 sm:pt-20 md:pt-8 flex flex-col">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-lg sm:text-xl">Maintenance</h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/8 transition-all active:scale-[0.97]">
              {formOpen ? <X size={14} /> : <Plus size={14} />} Raise request
            </button>
            <ProfileMenu userName={user?.name || "..."} role={user?.role} />
          </div>
        </div>

        {error && <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 text-sm text-[#F0555F]">{error}</div>}

        {formOpen && (
          <RaiseRequestForm
            assets={assets}
            onCreated={(reqObj) => { setRequests((prev) => [reqObj, ...prev]); setFormOpen(false); }}
            onCancel={() => setFormOpen(false)}
          />
        )}

        {loading ? (
          <div className="flex-1 flex items-center justify-center text-[#8C99A6] text-sm gap-2"><Loader2 size={16} className="animate-spin" /> Loading...</div>
        ) : (
          <div className="mt-6 flex-1 flex gap-4 overflow-x-auto pb-2 md:grid md:grid-cols-5 md:overflow-visible md:pb-0">
            {stages.map((stage) => (
              <Column
                key={stage}
                stage={stage}
                cards={requests.filter((r) => r.status === stage)}
                onAdvance={advance}
                onReject={reject}
                busyId={busyId}
              />
            ))}
          </div>
        )}

        <p className="text-sm text-[#8C99A6] mt-6 pt-5 border-t border-[#232C36]">
          Approving a card moves the asset to Under Maintenance; resolving returns it to Available.
        </p>
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .4s ease both; }
        @keyframes menuIn { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .menu-in { animation: menuIn .15s ease both; transform-origin: top right; }
        @keyframes panelIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .panel-in { animation: panelIn .2s ease both; }
      `}</style>
    </div>
  );
}

function RaiseRequestForm({ assets, onCreated, onCancel }) {
  const [assetId, setAssetId] = useState("");
  const [issueDescription, setIssueDescription] = useState("");
  const [priority, setPriority] = useState("Medium");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!assetId || !issueDescription.trim()) { setFormError("Asset and issue description are required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await axios.post(`${BASE_URL}/api/maintenance`, { assetId, issueDescription: issueDescription.trim(), priority }, { withCredentials: true });
      onCreated(res.data);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to raise request.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel-in mt-4 rounded-lg border border-[#232C36] bg-[#10161D] p-5 max-w-xl">
      <p className="text-sm font-medium text-[#ECF1F5] mb-3">Raise maintenance request</p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <label className="block">
          <span className="text-xs text-[#8C99A6] mb-1.5 block">Asset</span>
          <select value={assetId} onChange={(e) => setAssetId(e.target.value)} className="w-full h-9 px-3 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60">
            <option value="">-- select --</option>
            {assets.map((a) => <option key={a._id} value={a._id}>{a.assetTag} - {a.name}</option>)}
          </select>
        </label>
        <label className="block">
          <span className="text-xs text-[#8C99A6] mb-1.5 block">Priority</span>
          <select value={priority} onChange={(e) => setPriority(e.target.value)} className="w-full h-9 px-3 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60">
            {["Low", "Medium", "High", "Critical"].map((p) => <option key={p} value={p}>{p}</option>)}
          </select>
        </label>
      </div>
      <label className="block mt-3">
        <span className="text-xs text-[#8C99A6] mb-1.5 block">Issue description</span>
        <textarea value={issueDescription} onChange={(e) => setIssueDescription(e.target.value)} rows={3} className="w-full px-3 py-2 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60 resize-none" />
      </label>
      {formError && <p className="text-xs text-[#F0555F] mt-2">{formError}</p>}
      <div className="flex items-center gap-2 mt-3">
        <button type="submit" disabled={saving} className="h-9 px-4 rounded-md bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-50 text-[#04342C] text-sm font-medium flex items-center gap-2">
          {saving && <Loader2 size={13} className="animate-spin" />} Submit
        </button>
        <button type="button" onClick={onCancel} className="h-9 px-4 rounded-md border border-[#3A4551] text-[#8C99A6] text-sm hover:bg-[#171F27]">Cancel</button>
      </div>
    </form>
  );
}

function Column({ stage, cards, onAdvance, onReject, busyId }) {
  const isResolved = stage === "Resolved";
  return (
    <div className="flex flex-col shrink-0 w-[78vw] sm:w-64 md:w-auto">
      <div className="flex items-center justify-between px-1 pb-3 border-b border-[#232C36]">
        <span className="text-sm text-[#8C99A6]">{stage}</span>
        <span className="text-xs text-[#4A5460] font-['JetBrains_Mono']">{cards.length}</span>
      </div>
      <div className="mt-3 space-y-3">
        {cards.map((card) => (
          <Card key={card._id} card={card} resolved={isResolved} onAdvance={onAdvance} onReject={onReject} busy={busyId === card._id} />
        ))}
      </div>
    </div>
  );
}

function Card({ card, resolved, onAdvance, onReject, busy }) {
  const isLastStage = card.status === "Resolved";
  const canReject = card.status === "Pending";
  const action = nextAction[card.status];

  return (
    <div className={`group relative rounded-lg border px-3 py-2.5 transition-colors ${resolved ? "border-[#29D8AA]/50 bg-[#29D8AA]/6 hover:bg-[#29D8AA]/10" : "border-[#232C36] bg-[#10161D] hover:bg-[#171F27]"}`}>
      {canReject && (
        <button onClick={() => onReject(card)} disabled={busy} className="absolute top-1.5 right-1.5 text-[#4A5460] hover:text-[#F0555F] opacity-0 group-hover:opacity-100 transition-opacity disabled:opacity-30">
          <X size={12} />
        </button>
      )}
      <p className={`text-xs font-['JetBrains_Mono'] ${resolved ? "text-[#7EE8CB]" : "text-[#8C99A6]"}`}>{card.asset?.assetTag}</p>
      <p className={`text-sm mt-1 leading-snug ${resolved ? "text-[#7EE8CB]" : "text-[#ECF1F5]"}`}>{card.issueDescription}</p>
      {card.technician && <p className={`text-xs mt-0.5 ${resolved ? "text-[#5FBFA0]" : "text-[#8C99A6]"}`}>tech: {card.technician}</p>}
      {!isLastStage && action && (
        <button onClick={() => onAdvance(card)} disabled={busy} className="mt-2 flex items-center gap-1 text-xs text-[#29D8AA] opacity-0 group-hover:opacity-100 transition-opacity hover:underline disabled:opacity-40">
          {busy ? <Loader2 size={11} className="animate-spin" /> : <ChevronRight size={12} />} {action.label}
        </button>
      )}
    </div>
  );
}

function ProfileMenu({ userName, role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  useEffect(() => {
    function onClick(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false); }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);
  async function logout() {
    setOpen(false);
    try { await axios.post(`${BASE_URL}/api/auth/logout`, {}, { withCredentials: true }); } finally { navigate("/"); }
  }
  const roleLabel = role ? role.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase()) : "Employee";
  return (
    <div className="relative" ref={ref}>
      <button onClick={() => setOpen((v) => !v)} className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#232C36] hover:border-[#4C9FFE]/50 hover:bg-[#10161D] transition-colors">
        <span className="w-6 h-6 rounded-full bg-[#171F27] border border-[#232C36] flex items-center justify-center text-[11px] text-[#ECF1F5] font-medium">{userName.charAt(0).toUpperCase()}</span>
        <span className="text-xs text-[#8C99A6]">{userName}</span>
        <ChevronDown size={13} className={`text-[#8C99A6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
        <div className="menu-in absolute right-0 mt-2 w-44 rounded-lg border border-[#232C36] bg-[#10161D] shadow-lg shadow-black/40 overflow-hidden z-10">
          <div className="px-3.5 py-2.5 border-b border-[#232C36]">
            <p className="text-sm text-[#ECF1F5] font-medium truncate">{userName}</p>
            <p className="text-xs text-[#8C99A6] mt-0.5">{roleLabel}</p>
          </div>
          <button onClick={logout} className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-[#F0555F] hover:bg-[#F0555F]/8 transition-colors">Log out</button>
        </div>
      )}
    </div>
  );
}