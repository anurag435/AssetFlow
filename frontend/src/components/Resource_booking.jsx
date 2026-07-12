import { useMemo, useRef, useEffect, useState } from "react";
import { ChevronDown, Plus, AlertCircle, X, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

const startHour = 9, endHour = 17, rowHeight = 64;

export default function ResourceBookingPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [resources, setResources] = useState([]);
  const [resourceId, setResourceId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [bookings, setBookings] = useState([]);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ start: "", end: "", purpose: "" });
  const [conflict, setConflict] = useState(null);
  const [loading, setLoading] = useState(true);
  const [bookingsLoading, setBookingsLoading] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [meRes, resRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/assets`, { params: { isBookable: true }, withCredentials: true }),
        ]);
        if (cancelled) return;
        setUser(meRes.data.user);
        setResources(resRes.data.assets);
        if (resRes.data.assets.length) setResourceId(resRes.data.assets[0]._id);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) return navigate("/");
        setError("Couldn't load bookable resources.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navigate]);

  useEffect(() => {
    if (!resourceId) return;
    let cancelled = false;
    async function loadBookings() {
      setBookingsLoading(true);
      try {
        const res = await axios.get(`${BASE_URL}/api/bookings`, { params: { assetId: resourceId }, withCredentials: true });
        if (!cancelled) setBookings(res.data);
      } catch (err) {
        if (!cancelled) setError("Couldn't load bookings.");
      } finally {
        if (!cancelled) setBookingsLoading(false);
      }
    }
    loadBookings();
    return () => { cancelled = true; };
  }, [resourceId]);

  const dayBookings = useMemo(
    () => bookings.filter((b) => b.status !== "Cancelled" && new Date(b.startTime).toISOString().slice(0, 10) === date),
    [bookings, date]
  );
  const hours = useMemo(() => { const l = []; for (let h = startHour; h <= endHour; h++) l.push(h); return l; }, []);

  function toMinutes(t) { const [h, m] = t.split(":").map(Number); return h * 60 + m; }
  function overlaps(aS, aE, bS, bE) { return aS < bE && bS < aE; }

  function findConflict(start, end) {
    if (!start || !end) return null;
    const s = toMinutes(start), e = toMinutes(end);
    if (e <= s) return { reason: "End time must be after start time." };
    const clash = dayBookings.find((b) => {
      const bs = new Date(b.startTime), be = new Date(b.endTime);
      return overlaps(s, e, bs.getHours() * 60 + bs.getMinutes(), be.getHours() * 60 + be.getMinutes());
    });
    if (clash) return { reason: `Requested ${formatRange(start, end)} — conflict, slot is unavailable.` };
    return null;
  }

  function updateForm(key, value) {
    const next = { ...form, [key]: value };
    setForm(next);
    setConflict(findConflict(next.start, next.end));
  }

  async function submitBooking(e) {
    e.preventDefault();
    const c = findConflict(form.start, form.end);
    if (c) { setConflict(c); return; }
    if (!form.start || !form.end) return;

    setSubmitting(true);
    setError("");
    try {
      const startTime = new Date(`${date}T${form.start}:00`);
      const endTime = new Date(`${date}T${form.end}:00`);
      const res = await axios.post(
        `${BASE_URL}/api/bookings`,
        { assetId: resourceId, startTime: startTime.toISOString(), endTime: endTime.toISOString(), purpose: form.purpose.trim() || undefined },
        { withCredentials: true }
      );
      setBookings((prev) => [...prev, res.data]);
      setForm({ start: "", end: "", purpose: "" });
      setConflict(null);
      setFormOpen(false);
    } catch (err) {
      setConflict({ reason: err.response?.data?.message || "Failed to create booking." });
    } finally {
      setSubmitting(false);
    }
  }

  async function cancelBooking(id) {
    try {
      const res = await axios.patch(`${BASE_URL}/api/bookings/${id}/cancel`, {}, { withCredentials: true });
      setBookings((prev) => prev.map((b) => (b._id === id ? res.data : b)));
    } catch (err) {
      setError(err.response?.data?.message || "Failed to cancel booking.");
    }
  }

  function blockStyle(startTime, endTime) {
    const s = new Date(startTime), e = new Date(endTime);
    const top = ((s.getHours() * 60 + s.getMinutes() - startHour * 60) / 60) * rowHeight;
    const height = ((e - s) / 60000 / 60) * rowHeight;
    return { top, height: Math.max(height, 28) };
  }

  if (loading) {
    return <div className="min-h-screen w-full bg-[#0A0E13] flex items-center justify-center"><Loader2 size={20} className="animate-spin text-[#8C99A6]" /></div>;
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E13] font-['Inter'] flex fade-in">
      <Sidebar />
      <div className="flex-1 min-w-0 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Resource Booking</h1>
          <ProfileMenu userName={user?.name || "..."} role={user?.role} />
        </div>

        {error && <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 text-sm text-[#F0555F]">{error}</div>}

        {resources.length === 0 ? (
          <p className="mt-6 text-sm text-[#8C99A6]">No bookable resources found. Mark an asset as bookable in Assets to see it here.</p>
        ) : (
          <>
            <div className="flex gap-3 mt-6 max-w-3xl">
              <div className="flex-1">
                <span className="text-xs text-[#8C99A6] mb-1.5 block">Resource</span>
                <div className="relative">
                  <select value={resourceId} onChange={(e) => setResourceId(e.target.value)} className="w-full h-10 px-3 pr-9 rounded-md bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none appearance-none focus:border-[#29D8AA]/50">
                    {resources.map((r) => <option key={r._id} value={r._id}>{r.name} ({r.assetTag})</option>)}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C99A6] pointer-events-none" />
                </div>
              </div>
              <div>
                <span className="text-xs text-[#8C99A6] mb-1.5 block">Date</span>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="h-10 px-3 rounded-md bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50" />
              </div>
            </div>

            <div className="mt-5 max-w-3xl rounded-lg border border-[#232C36] overflow-hidden relative">
              {bookingsLoading && (
                <div className="absolute inset-0 bg-[#0A0E13]/60 flex items-center justify-center z-10"><Loader2 size={18} className="animate-spin text-[#8C99A6]" /></div>
              )}
              <div className="relative bg-[#10161D]" style={{ height: (endHour - startHour) * rowHeight }}>
                {hours.map((h, i) => (
                  <div key={h} className="absolute left-0 right-0 border-t border-[#232C36]" style={{ top: i * rowHeight }}>
                    <span className="inline-block w-16 -translate-y-2 text-xs text-[#8C99A6] font-['JetBrains_Mono'] pl-3">{formatHour(h)}</span>
                  </div>
                ))}
                {dayBookings.map((b) => {
                  const style = blockStyle(b.startTime, b.endTime);
                  return (
                    <div key={b._id} className="group absolute left-16 right-3 rounded-md bg-[#29D8AA]/12 border border-[#29D8AA]/40 px-3 py-1.5 overflow-hidden hover:bg-[#29D8AA]/18 transition-colors" style={{ top: style.top, height: style.height }}>
                      <p className="text-xs font-medium text-[#7EE8CB]">
                        {b.bookedBy?.name || "Booked"} · {formatRange(new Date(b.startTime).toTimeString().slice(0, 5), new Date(b.endTime).toTimeString().slice(0, 5))}
                      </p>
                      <button onClick={() => cancelBooking(b._id)} className="absolute top-1 right-1 text-[#4A5460] hover:text-[#F0555F] opacity-0 group-hover:opacity-100 transition-opacity">
                        <X size={12} />
                      </button>
                    </div>
                  );
                })}
                {form.start && form.end && conflict && (
                  <div className="absolute left-16 right-3 rounded-md border border-dashed border-[#F0555F]/70 bg-[#F0555F]/6 px-3 py-1.5" style={blockStyle(`${date}T${form.start}:00`, `${date}T${form.end}:00`)}>
                    <p className="text-xs text-[#F0989E]">{conflict.reason}</p>
                  </div>
                )}
              </div>
            </div>

            {!formOpen ? (
              <button onClick={() => setFormOpen(true)} className="mt-5 flex items-center gap-1.5 h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/8 transition-all active:scale-[0.97]">
                <Plus size={14} /> Book a slot
              </button>
            ) : (
              <form onSubmit={submitBooking} className="mt-5 max-w-3xl rounded-lg border border-[#232C36] bg-[#10161D] p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-medium text-[#ECF1F5]">New booking</p>
                  <button type="button" onClick={() => setFormOpen(false)} className="text-[#8C99A6] hover:text-[#ECF1F5]"><X size={16} /></button>
                </div>
                <div className="grid grid-cols-3 gap-3">
                  <TimeField label="Start" value={form.start} onChange={(v) => updateForm("start", v)} />
                  <TimeField label="End" value={form.end} onChange={(v) => updateForm("end", v)} />
                  <div>
                    <span className="text-xs text-[#8C99A6] mb-1.5 block">Purpose</span>
                    <input value={form.purpose} onChange={(e) => updateForm("purpose", e.target.value)} placeholder="Optional" className="w-full h-10 px-3 rounded-md bg-[#0A0E13] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50 placeholder:text-[#4A5460]" />
                  </div>
                </div>
                {conflict && <div className="mt-3 flex items-start gap-2 text-xs text-[#F0989E]"><AlertCircle size={14} className="mt-0.5 shrink-0" />{conflict.reason}</div>}
                <button type="submit" disabled={!!conflict || !form.start || !form.end || submitting} className="mt-4 h-9 px-5 rounded-md bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-40 disabled:cursor-not-allowed text-[#04342C] text-sm font-medium transition-colors active:scale-[0.97] flex items-center gap-2">
                  {submitting && <Loader2 size={13} className="animate-spin" />} Confirm booking
                </button>
              </form>
            )}
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

function TimeField({ label, value, onChange }) {
  return (
    <div>
      <span className="text-xs text-[#8C99A6] mb-1.5 block">{label}</span>
      <input type="time" value={value} onChange={(e) => onChange(e.target.value)} className="w-full h-10 px-3 rounded-md bg-[#0A0E13] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50" />
    </div>
  );
}
function formatHour(h) { const p = h >= 12 ? "PM" : "AM"; const h12 = h % 12 === 0 ? 12 : h % 12; return `${h12}:00 ${p}`; }
function formatRange(s, e) { return `${to12h(s)} to ${to12h(e)}`; }
function to12h(t) { const [h, m] = t.split(":").map(Number); const p = h >= 12 ? "PM" : "AM"; const h12 = h % 12 === 0 ? 12 : h % 12; return `${h12}:${String(m).padStart(2, "0")} ${p}`; }

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