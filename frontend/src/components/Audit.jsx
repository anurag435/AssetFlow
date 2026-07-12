import { useState, useRef, useEffect } from "react";
import { ChevronDown, ClipboardCheck, Loader2, Plus, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

export default function AuditPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [cycles, setCycles] = useState([]);
  const [cycleId, setCycleId] = useState("");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [itemsLoading, setItemsLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const cycle = cycles.find((c) => c._id === cycleId);
  const flaggedCount = items.filter((i) => i.result === "Missing" || i.result === "Damaged").length;

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [meRes, cyclesRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/audits`, { withCredentials: true }),
        ]);
        if (cancelled) return;
        setUser(meRes.data.user);
        setCycles(cyclesRes.data);
        if (cyclesRes.data.length) setCycleId(cyclesRes.data[0]._id);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) return navigate("/");
        setError("Couldn't load audit cycles.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    if (!cycleId) return;
    let cancelled = false;
    async function loadItems() {
      setItemsLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/audits/${cycleId}/items`, { withCredentials: true });
        if (!cancelled) setItems(res.data);
      } catch (err) {
        if (!cancelled) setError("Couldn't load audit items.");
      } finally {
        if (!cancelled) setItemsLoading(false);
      }
    }
    loadItems();
    return () => { cancelled = true; };
  }, [cycleId]);

  async function activateCycle() {
    setBusy(true);
    try {
      const res = await axios.patch(`${BASE_URL}/api/audits/${cycleId}/activate`, {}, { withCredentials: true });
      setCycles((prev) => prev.map((c) => (c._id === cycleId ? res.data : c)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to activate cycle.");
    } finally {
      setBusy(false);
    }
  }

  async function setResult(itemId, result) {
    try {
      const res = await axios.patch(`${BASE_URL}/api/audits/items/${itemId}`, { result }, { withCredentials: true });
      setItems((prev) => prev.map((i) => (i._id === itemId ? res.data : i)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to record result.");
    }
  }

  async function closeCycle() {
    setBusy(true);
    try {
      const res = await axios.patch(`${BASE_URL}/api/audits/${cycleId}/close`, {}, { withCredentials: true });
      setCycles((prev) => prev.map((c) => (c._id === cycleId ? res.data.cycle : c)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to close cycle.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar />
        <div className="flex-1 min-w-0 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Asset Audit</h1>
            <div className="flex items-center gap-3">
              <button onClick={() => setFormOpen((v) => !v)} className="flex items-center gap-1.5 h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/8 transition-all active:scale-[0.97]">
                {formOpen ? <X size={14} /> : <Plus size={14} />} New cycle
              </button>
              <ProfileMenu userName={user?.name || "..."} role={user?.role} />
            </div>
          </div>

          {error && <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 text-sm text-[#F0555F]">{error}</div>}

          {formOpen && (
            <NewCycleForm onCreated={(c) => { setCycles((prev) => [c, ...prev]); setCycleId(c._id); setFormOpen(false); }} onCancel={() => setFormOpen(false)} />
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-[#8C99A6] text-sm py-20"><Loader2 size={16} className="animate-spin" /> Loading...</div>
          ) : cycles.length === 0 ? (
            <p className="mt-6 text-sm text-[#8C99A6]">No audit cycles yet — create one above.</p>
          ) : (
            <>
              <div className="mt-5">
                <select value={cycleId} onChange={(e) => setCycleId(e.target.value)} className="h-10 px-3 rounded-md bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50">
                  {cycles.map((c) => <option key={c._id} value={c._id}>{c.name} ({c.status})</option>)}
                </select>
              </div>

              {cycle && (
                <div className="mt-3 rounded-lg border border-[#F0B429]/35 bg-[#3A2A12] px-4 py-3">
                  <p className="text-sm text-[#F0D9A6]">{cycle.name}</p>
                  <p className="text-xs text-[#C7B182] mt-1">Auditors: {cycle.auditors?.map((a) => a.name).join(", ") || "--"} · Status: {cycle.status}</p>
                </div>
              )}

              {cycle?.status === "Draft" && (
                <button onClick={activateCycle} disabled={busy} className="mt-3 h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/8 disabled:opacity-50 flex items-center gap-2">
                  {busy && <Loader2 size={13} className="animate-spin" />} Activate cycle
                </button>
              )}

              {itemsLoading ? (
                <div className="mt-5 flex items-center gap-2 text-sm text-[#8C99A6]"><Loader2 size={14} className="animate-spin" /> Loading items...</div>
              ) : (
                <div className="mt-5 rounded-lg border border-[#232C36] overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-[#232C36] bg-[#10161D]">
                        <th className="text-left text-[#8C99A6] font-normal px-4 py-2.5">Asset</th>
                        <th className="text-left text-[#8C99A6] font-normal px-4 py-2.5">Location</th>
                        <th className="text-left text-[#8C99A6] font-normal px-4 py-2.5">Verification</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#232C36]">
                      {items.length === 0 ? (
                        <tr><td colSpan={3} className="px-4 py-6 text-center text-[#8C99A6]">No items in scope for this cycle.</td></tr>
                      ) : items.map((item) => (
                        <tr key={item._id} className="transition-colors hover:bg-[#10161D]">
                          <td className="px-4 py-2.5 text-[#ECF1F5]">{item.asset?.assetTag} {item.asset?.name}</td>
                          <td className="px-4 py-2.5 text-[#8C99A6]">{item.asset?.location || "--"}</td>
                          <td className="px-4 py-2.5">
                            <VerificationSelect value={item.result} disabled={cycle?.status !== "Active"} onChange={(r) => setResult(item._id, r)} />
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {flaggedCount > 0 && (
                <div className="mt-5 rounded-lg border border-[#F0B429]/40 bg-[#3A2E0E] px-4 py-2.5">
                  <span className="text-sm text-[#F0D9A6]">{flaggedCount} asset{flaggedCount > 1 ? "s" : ""} flagged</span>
                </div>
              )}

              <div className="mt-5">
                {cycle?.status === "Closed" ? (
                  <span className="inline-flex items-center gap-1.5 text-sm text-[#8C99A6]"><ClipboardCheck size={14} className="text-[#29D8AA]" /> Audit cycle closed — asset statuses updated</span>
                ) : cycle?.status === "Active" ? (
                  <button onClick={closeCycle} disabled={busy} className="h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/8 disabled:opacity-50 flex items-center gap-2">
                    {busy && <Loader2 size={13} className="animate-spin" />} Close audit cycle
                  </button>
                ) : null}
              </div>
            </>
          )}
        </div>
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

function NewCycleForm({ onCreated, onCancel }) {
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [scopeLocation, setScopeLocation] = useState("");
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  async function submit(e) {
    e.preventDefault();
    if (!name.trim() || !startDate || !endDate) { setFormError("Name, start and end dates are required."); return; }
    setSaving(true);
    setFormError("");
    try {
      const res = await axios.post(`${BASE_URL}/api/audits`, { name: name.trim(), startDate, endDate, scopeLocation: scopeLocation.trim() || undefined }, { withCredentials: true });
      onCreated(res.data.cycle);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to create cycle.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={submit} className="panel-in mt-4 rounded-lg border border-[#232C36] bg-[#10161D] p-5 max-w-xl">
      <p className="text-sm font-medium text-[#ECF1F5] mb-3">New audit cycle</p>
      <div className="grid grid-cols-2 gap-3">
        <label className="block col-span-2">
          <span className="text-xs text-[#8C99A6] mb-1.5 block">Name</span>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Q3 audit: Engineering dept" className="w-full h-9 px-3 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60" />
        </label>
        <label className="block">
          <span className="text-xs text-[#8C99A6] mb-1.5 block">Start date</span>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full h-9 px-3 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60" />
        </label>
        <label className="block">
          <span className="text-xs text-[#8C99A6] mb-1.5 block">End date</span>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full h-9 px-3 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60" />
        </label>
        <label className="block col-span-2">
          <span className="text-xs text-[#8C99A6] mb-1.5 block">Location scope (optional)</span>
          <input value={scopeLocation} onChange={(e) => setScopeLocation(e.target.value)} placeholder="e.g. HQ floor 2" className="w-full h-9 px-3 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60" />
        </label>
      </div>
      {formError && <p className="text-xs text-[#F0555F] mt-2">{formError}</p>}
      <div className="flex items-center gap-2 mt-3">
        <button type="submit" disabled={saving} className="h-9 px-4 rounded-md bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-50 text-[#04342C] text-sm font-medium flex items-center gap-2">
          {saving && <Loader2 size={13} className="animate-spin" />} Create
        </button>
        <button type="button" onClick={onCancel} className="h-9 px-4 rounded-md border border-[#3A4551] text-[#8C99A6] text-sm hover:bg-[#171F27]">Cancel</button>
      </div>
    </form>
  );
}

function VerificationSelect({ value, onChange, disabled }) {
  const styles = { Pending: "border-[#8C99A6]/50 text-[#8C99A6]", Verified: "border-[#29D8AA]/50 text-[#29D8AA]", Missing: "border-[#F0555F]/50 text-[#F0555F]", Damaged: "border-[#F0B429]/50 text-[#F0B429]" };
  return (
    <div className="relative inline-block">
      <select value={value} disabled={disabled} onChange={(e) => onChange(e.target.value)} className={`appearance-none px-2.5 py-0.5 pr-6 rounded-full text-xs bg-transparent outline-none cursor-pointer border disabled:cursor-default disabled:opacity-80 ${styles[value]}`}>
        {["Pending", "Verified", "Missing", "Damaged"].map((s) => <option key={s} value={s} className="bg-[#10161D] text-[#ECF1F5]">{s}</option>)}
      </select>
      <ChevronDown size={11} className="absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none" />
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