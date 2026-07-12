import { useState, useRef, useEffect } from "react";
import { ChevronDown, AlertTriangle, ArrowRight, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

export default function AllocationPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [selectedId, setSelectedId] = useState("");
  const [history, setHistory] = useState([]);
  const [currentAllocation, setCurrentAllocation] = useState(null);

  const [loading, setLoading] = useState(true);
  const [detailLoading, setDetailLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [holderUser, setHolderUser] = useState("");
  const [expectedReturnDate, setExpectedReturnDate] = useState("");
  const [toDept, setToDept] = useState("");
  const [reason, setReason] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const asset = assets.find((a) => a._id === selectedId);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [meRes, assetsRes, usersRes, deptRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/assets`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/users`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/departments`, { withCredentials: true }),
        ]);
        if (cancelled) return;
        setUser(meRes.data.user);
        setAssets(assetsRes.data.assets);
        setEmployees(usersRes.data);
        setDepartments(deptRes.data);
        if (assetsRes.data.assets.length) setSelectedId(assetsRes.data.assets[0]._id);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) return navigate("/");
        setError("Couldn't load allocation data.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    async function loadDetail() {
      setDetailLoading(true);
      setSuccess("");
      setHolderUser(""); setExpectedReturnDate(""); setToDept(""); setReason("");
      try {
        const res = await axios.get(`${BASE_URL}/api/assets/${selectedId}/history`, { withCredentials: true });
        if (cancelled) return;
        setHistory(res.data.allocations);
        setCurrentAllocation(res.data.allocations.find((a) => a.status === "Active") || null);
      } catch (err) {
        if (!cancelled) setError("Couldn't load asset history.");
      } finally {
        if (!cancelled) setDetailLoading(false);
      }
    }
    loadDetail();
    return () => { cancelled = true; };
  }, [selectedId]);

  const isTaken = asset?.status === "Allocated";

  async function handleAllocate(e) {
    e.preventDefault();
    if (!holderUser) return;
    setSubmitting(true);
    setError("");
    try {
      await axios.post(
        `${BASE_URL}/api/allocations`,
        { assetId: selectedId, holderUser, expectedReturnDate: expectedReturnDate || undefined },
        { withCredentials: true }
      );
      setSuccess("Asset allocated successfully.");
      setAssets((prev) => prev.map((a) => (a._id === selectedId ? { ...a, status: "Allocated" } : a)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to allocate asset.");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleTransferRequest(e) {
    e.preventDefault();
    if (!reason.trim()) return;
    setSubmitting(true);
    setError("");
    try {
      await axios.post(
        `${BASE_URL}/api/transfers`,
        { assetId: selectedId, toHolderDepartment: toDept || undefined, reason: reason.trim() },
        { withCredentials: true }
      );
      setSuccess(`Request submitted — pending approval.`);
      setReason(""); setToDept("");
    } catch (err) {
      setError(err.response?.data?.message || "Failed to request transfer.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen w-full bg-[#0A0E13] flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-[#8C99A6]" />
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E13] font-['Inter'] flex fade-in">
      <Sidebar />
      <div className="flex-1 min-w-0 p-8 max-w-[560px]">
        <div className="flex items-center justify-between">
          <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Allocation &amp; Transfer</h1>
          <ProfileMenu userName={user?.name || "..."} role={user?.role} />
        </div>

        {error && <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 text-sm text-[#F0555F]">{error}</div>}
        {success && <div className="mt-4 rounded-lg border border-[#29D8AA]/40 bg-[#29D8AA]/6 px-4 py-2.5 text-sm text-[#29D8AA]">{success}</div>}

        <div className="mt-6">
          <label className="block">
            <span className="text-xs text-[#8C99A6] mb-1.5 block">Asset</span>
            <div className="relative">
              <select
                value={selectedId}
                onChange={(e) => setSelectedId(e.target.value)}
                className="w-full appearance-none h-11 px-3 rounded-lg bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50"
              >
                {assets.map((a) => (
                  <option key={a._id} value={a._id}>{a.assetTag} - {a.name}</option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C99A6] pointer-events-none" />
            </div>
          </label>
        </div>

        {detailLoading ? (
          <div className="mt-4 flex items-center gap-2 text-sm text-[#8C99A6]"><Loader2 size={14} className="animate-spin" /> Loading asset...</div>
        ) : asset && (
          <>
            {isTaken ? (
              <div className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#F0555F]/10 border border-[#F0555F]/40 px-4 py-3">
                <AlertTriangle size={16} className="text-[#F0555F] mt-0.5 shrink-0" />
                <p className="text-sm text-[#F5A7AC] leading-relaxed">
                  Already allocated to <span className="font-medium text-[#F0555F]">{currentAllocation?.holderUser?.name || currentAllocation?.holderDepartment?.name || "someone"}</span>
                  <br />Direct re-allocation is blocked — submit a transfer request below.
                </p>
              </div>
            ) : (
              <div className="mt-4 rounded-lg bg-[#29D8AA]/6 border border-[#29D8AA]/25 px-4 py-3">
                <p className="text-sm text-[#9FE1CB]">This asset is currently <span className="font-medium">{asset.status}</span> — allocate it directly below.</p>
              </div>
            )}

            {!isTaken && asset.status === "Available" && (
              <form onSubmit={handleAllocate} className="mt-6">
                <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-medium text-base">Allocate this asset</h2>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <label className="block">
                    <span className="text-xs text-[#8C99A6] mb-1.5 block">Assign to</span>
                    <select value={holderUser} onChange={(e) => setHolderUser(e.target.value)} className="w-full h-11 px-3 rounded-lg bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50">
                      <option value="">Select employee...</option>
                      {employees.map((e) => <option key={e._id} value={e._id}>{e.name}</option>)}
                    </select>
                  </label>
                  <label className="block">
                    <span className="text-xs text-[#8C99A6] mb-1.5 block">Expected return</span>
                    <input type="date" value={expectedReturnDate} onChange={(e) => setExpectedReturnDate(e.target.value)} className="w-full h-11 px-3 rounded-lg bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50" />
                  </label>
                </div>
                <button type="submit" disabled={submitting || !holderUser} className="mt-4 h-10 px-5 rounded-lg bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-40 text-[#04342C] font-medium text-sm flex items-center gap-2 transition-all active:scale-[0.98]">
                  {submitting && <Loader2 size={14} className="animate-spin" />} Allocate <ArrowRight size={15} />
                </button>
              </form>
            )}

            {isTaken && (
              <form onSubmit={handleTransferRequest} className="mt-6">
                <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-medium text-base">Transfer Request</h2>
                <p className="text-xs text-[#8C99A6] mt-1">Requested by you ({user?.name}) — approval routes to the receiving department's head.</p>
                <div className="grid grid-cols-2 gap-4 mt-3">
                  <label className="block">
                    <span className="text-xs text-[#8C99A6] mb-1.5 block">Currently held by</span>
                    <div className="h-11 px-3 rounded-lg bg-[#10161D] border border-[#232C36] flex items-center text-sm text-[#8C99A6]">
                      {currentAllocation?.holderUser?.name || currentAllocation?.holderDepartment?.name || "--"}
                    </div>
                  </label>
                  <label className="block">
                    <span className="text-xs text-[#8C99A6] mb-1.5 block">To department</span>
                    <select value={toDept} onChange={(e) => setToDept(e.target.value)} className="w-full h-11 px-3 rounded-lg bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50">
                      <option value="">-- select --</option>
                      {departments.map((d) => <option key={d._id} value={d._id}>{d.name}</option>)}
                    </select>
                  </label>
                </div>
                <label className="block mt-4">
                  <span className="text-xs text-[#8C99A6] mb-1.5 block">Reason</span>
                  <textarea value={reason} onChange={(e) => setReason(e.target.value)} rows={4} placeholder="Why is this transfer needed?" className="w-full px-3 py-2.5 rounded-lg bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50 resize-none placeholder:text-[#4A5460]" />
                </label>
                <button type="submit" disabled={submitting || !reason.trim()} className="mt-4 h-10 px-5 rounded-lg bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-40 text-[#04342C] font-medium text-sm flex items-center gap-2 transition-all active:scale-[0.98]">
                  {submitting && <Loader2 size={14} className="animate-spin" />} Submit Request <ArrowRight size={15} />
                </button>
              </form>
            )}

            <section className="mt-8">
              <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-medium text-base pb-2.5 border-b border-[#232C36]">Allocation history</h2>
              <div className="mt-2.5 space-y-1.5">
                {history.length === 0 && <p className="text-sm text-[#8C99A6]">No history yet for this asset.</p>}
                {history.map((h) => (
                  <p key={h._id} className="text-sm text-[#8C99A6] leading-relaxed">
                    <span className="font-['JetBrains_Mono'] text-xs text-[#5A6570] mr-2">
                      {new Date(h.allocatedDate).toLocaleDateString()}
                    </span>
                    {h.status === "Active" ? "Allocated to" : "Was held by"} {h.holderUser?.name || h.holderDepartment?.name || "unknown"}
                    {h.status === "Returned" && ` — returned ${new Date(h.actualReturnDate).toLocaleDateString()}`}
                  </p>
                ))}
              </div>
            </section>
          </>
        )}
      </div>
      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .4s ease both; }
        @keyframes menuIn { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .menu-in { animation: menuIn .15s ease both; transform-origin: top right; }
      `}</style>
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