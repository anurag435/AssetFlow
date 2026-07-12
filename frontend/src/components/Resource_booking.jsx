import { useMemo, useRef, useEffect, useState } from "react";
import {
  LayoutDashboard,
  Building2,
  Package,
  ArrowLeftRight,
  CalendarClock,
  Wrench,
  ClipboardCheck,
  BarChart3,
  Bell,
  LogOut,
  ChevronDown,
  Plus,
  AlertCircle,
  X,
} from "lucide-react";

const navItems = [
  "Dashboard",
  "Organization setup",
  "Assets",
  "Allocation & Transfer",
  "Resource Booking",
  "Maintenance",
  "Audit",
  "Reports",
  "Notifications",
];

const resources = ["Conference room B2", "Meeting room A1", "Company car — Innova", "Projector cart 2"];

const startHour = 9;
const endHour = 17;
const rowHeight = 64;

const initialBookings = [
  { id: "b1", resource: "Conference room B2", start: "09:00", end: "10:00", bookedBy: "Procurement Team" },
];

export default function ResourceBookingPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Resource Booking");
  const [bookings, setBookings] = useState(initialBookings);
  const [resource, setResource] = useState(resources[0]);
  const [date, setDate] = useState("2026-07-07");
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState({ start: "", end: "", bookedBy: "" });
  const [conflict, setConflict] = useState(null);

  function goTo(item) {
    setActiveNav(item);
    onNavigate?.(item);
  }

  const dayBookings = useMemo(() => bookings.filter((b) => b.resource === resource), [bookings, resource]);
  const hours = useMemo(() => {
    const list = [];
    for (let h = startHour; h <= endHour; h++) list.push(h);
    return list;
  }, []);

  function toMinutes(t) {
    const [h, m] = t.split(":").map(Number);
    return h * 60 + m;
  }

  function overlaps(aStart, aEnd, bStart, bEnd) {
    return aStart < bEnd && bStart < aEnd;
  }

  function findConflict(start, end) {
    if (!start || !end) return null;
    const s = toMinutes(start);
    const e = toMinutes(end);
    if (e <= s) return { reason: "End time must be after start time." };

    const clash = dayBookings.find((b) => overlaps(s, e, toMinutes(b.start), toMinutes(b.end)));
    if (clash) return { reason: `Requested ${formatRange(start, end)} — conflict, slot is unavailable.` };
    return null;
  }

  function updateForm(key, value) {
    const next = { ...form, [key]: value };
    setForm(next);
    setConflict(findConflict(next.start, next.end));
  }

  function submitBooking(e) {
    e.preventDefault();
    const c = findConflict(form.start, form.end);
    if (c) {
      setConflict(c);
      return;
    }
    if (!form.start || !form.end || !form.bookedBy.trim()) return;

    setBookings((prev) => [
      ...prev,
      { id: crypto.randomUUID(), resource, start: form.start, end: form.end, bookedBy: form.bookedBy.trim() },
    ]);
    setForm({ start: "", end: "", bookedBy: "" });
    setConflict(null);
    setFormOpen(false);
  }

  function blockStyle(start, end) {
    const top = ((toMinutes(start) - startHour * 60) / 60) * rowHeight;
    const height = ((toMinutes(end) - toMinutes(start)) / 60) * rowHeight;
    return { top, height: Math.max(height, 28) };
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E13] font-['Inter'] flex fade-in">
      <Sidebar active={activeNav} onSelect={goTo} />

      <div className="flex-1 min-w-0 p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Resource Booking</h1>
          <ProfileMenu userName={userName} onLogout={onLogout} />
        </div>

        <div className="flex gap-3 mt-6 max-w-3xl fade-up" style={{ animationDelay: "40ms" }}>
          <div className="flex-1">
            <span className="text-xs text-[#8C99A6] mb-1.5 block">Resource</span>
            <div className="relative">
              <select
                value={resource}
                onChange={(e) => setResource(e.target.value)}
                className="w-full h-10 px-3 pr-9 rounded-md bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none appearance-none transition-colors focus:border-[#29D8AA]/50"
              >
                {resources.map((r) => (
                  <option key={r} value={r} className="bg-[#10161D]">
                    {r}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C99A6] pointer-events-none" />
            </div>
          </div>
          <div>
            <span className="text-xs text-[#8C99A6] mb-1.5 block">Date</span>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="h-10 px-3 rounded-md bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none transition-colors focus:border-[#29D8AA]/50"
            />
          </div>
        </div>

        <div className="mt-5 max-w-3xl rounded-lg border border-[#232C36] overflow-hidden fade-up" style={{ animationDelay: "90ms" }}>
          <div className="relative bg-[#10161D]" style={{ height: (endHour - startHour) * rowHeight }}>
            {hours.map((h, i) => (
              <div key={h} className="absolute left-0 right-0 border-t border-[#232C36]" style={{ top: i * rowHeight }}>
                <span className="inline-block w-16 -translate-y-2 text-xs text-[#8C99A6] font-['JetBrains_Mono'] pl-3">
                  {formatHour(h)}
                </span>
              </div>
            ))}

            {dayBookings.map((b) => {
              const style = blockStyle(b.start, b.end);
              return (
                <div
                  key={b.id}
                  className="absolute left-16 right-3 rounded-md bg-[#29D8AA]/[0.12] border border-[#29D8AA]/40 px-3 py-1.5 overflow-hidden transition-colors hover:bg-[#29D8AA]/[0.18]"
                  style={{ top: style.top, height: style.height }}
                >
                  <p className="text-xs font-medium text-[#7EE8CB]">
                    Booked — {b.bookedBy} · {formatRange(b.start, b.end)}
                  </p>
                </div>
              );
            })}

            {form.start && form.end && conflict && (
              <div
                className="absolute left-16 right-3 rounded-md border border-dashed border-[#F0555F]/70 bg-[#F0555F]/[0.06] px-3 py-1.5"
                style={blockStyle(form.start, form.end)}
              >
                <p className="text-xs text-[#F0989E]">{conflict.reason}</p>
              </div>
            )}
          </div>
        </div>

        {!formOpen ? (
          <button
            onClick={() => setFormOpen(true)}
            className="mt-5 flex items-center gap-1.5 h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] transition-all active:scale-[0.97] hover:bg-[#29D8AA]/[0.08] fade-up"
            style={{ animationDelay: "140ms" }}
          >
            <Plus size={14} />
            Book a slot
          </button>
        ) : (
          <form
            onSubmit={submitBooking}
            className="mt-5 max-w-3xl rounded-lg border border-[#232C36] bg-[#10161D] p-5 fade-up"
            style={{ animationDelay: "140ms" }}
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-medium text-[#ECF1F5]">New booking — {resource}</p>
              <button type="button" onClick={() => setFormOpen(false)} className="text-[#8C99A6] hover:text-[#ECF1F5]">
                <X size={16} />
              </button>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <TimeField label="Start" value={form.start} onChange={(v) => updateForm("start", v)} />
              <TimeField label="End" value={form.end} onChange={(v) => updateForm("end", v)} />
              <div>
                <span className="text-xs text-[#8C99A6] mb-1.5 block">Booked by</span>
                <input
                  value={form.bookedBy}
                  onChange={(e) => updateForm("bookedBy", e.target.value)}
                  placeholder="Your name / team"
                  className="w-full h-10 px-3 rounded-md bg-[#0A0E13] border border-[#232C36] text-[#ECF1F5] text-sm outline-none transition-colors focus:border-[#29D8AA]/50 placeholder:text-[#4A5460]"
                />
              </div>
            </div>

            {conflict && (
              <div className="mt-3 flex items-start gap-2 text-xs text-[#F0989E]">
                <AlertCircle size={14} className="mt-0.5 shrink-0" />
                {conflict.reason}
              </div>
            )}

            <button
              type="submit"
              disabled={!!conflict || !form.start || !form.end || !form.bookedBy.trim()}
              className="mt-4 h-9 px-5 rounded-md bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-40 disabled:cursor-not-allowed text-[#04342C] text-sm font-medium transition-colors active:scale-[0.97]"
            >
              Confirm booking
            </button>
          </form>
        )}

        <p className="text-sm text-[#8C99A6] mt-6 fade-up" style={{ animationDelay: "190ms" }}>
          Overlapping requests are rejected automatically — a slot starting right after another ends is fine.
        </p>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .fade-in { animation: fadeIn .4s ease both; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .4s cubic-bezier(0.16, 1, 0.3, 1) both; }
        @keyframes menuIn { from { opacity: 0; transform: translateY(-4px) scale(.98); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .menu-in { animation: menuIn .15s ease both; transform-origin: top right; }
      `}</style>
    </div>
  );
}

const navIcons = {
  Dashboard: LayoutDashboard,
  "Organization setup": Building2,
  Assets: Package,
  "Allocation & Transfer": ArrowLeftRight,
  "Resource Booking": CalendarClock,
  Maintenance: Wrench,
  Audit: ClipboardCheck,
  Reports: BarChart3,
  Notifications: Bell,
};

function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-[220px] shrink-0 border-r border-[#232C36] p-6 min-h-screen">
      <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-bold text-lg mb-6">AssetFlow</h2>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = item === active;
          const Icon = navIcons[item];
          return (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={`w-full flex items-center gap-2 text-left px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                isActive
                  ? "border border-[#29D8AA]/50 text-[#29D8AA] bg-[#29D8AA]/[0.06]"
                  : "text-[#8C99A6] hover:text-[#ECF1F5] hover:bg-[#10161D]"
              }`}
            >
              <Icon size={14} className={isActive ? "text-[#29D8AA]" : "text-[#8C99A6]"} />
              {item}
            </button>
          );
        })}
      </nav>
    </aside>
  );
}

function ProfileMenu({ userName, onLogout }) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  function handleLogout() {
    setOpen(false);
    onLogout?.();
  }

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#232C36] transition-colors hover:border-[#4C9FFE]/50 hover:bg-[#10161D]"
      >
        <span className="w-6 h-6 rounded-full bg-[#171F27] border border-[#232C36] flex items-center justify-center text-[11px] text-[#ECF1F5] font-medium">
          {userName.charAt(0)}
        </span>
        <span className="text-xs text-[#8C99A6]">{userName}</span>
        <ChevronDown size={13} className={`text-[#8C99A6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="menu-in absolute right-0 mt-2 w-44 rounded-lg border border-[#232C36] bg-[#10161D] shadow-lg shadow-black/40 overflow-hidden z-10">
          <div className="px-3.5 py-2.5 border-b border-[#232C36]">
            <p className="text-sm text-[#ECF1F5] font-medium truncate">{userName}</p>
            <p className="text-xs text-[#8C99A6] mt-0.5">Employee</p>
          </div>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-[#F0555F] hover:bg-[#F0555F]/[0.08] transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function TimeField({ label, value, onChange }) {
  return (
    <div>
      <span className="text-xs text-[#8C99A6] mb-1.5 block">{label}</span>
      <input
        type="time"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full h-10 px-3 rounded-md bg-[#0A0E13] border border-[#232C36] text-[#ECF1F5] text-sm outline-none transition-colors focus:border-[#29D8AA]/50"
      />
    </div>
  );
}

function formatHour(h) {
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:00 ${period}`;
}

function formatRange(start, end) {
  return `${to12h(start)} to ${to12h(end)}`;
}

function to12h(t) {
  const [h, m] = t.split(":").map(Number);
  const period = h >= 12 ? "PM" : "AM";
  const hour12 = h % 12 === 0 ? 12 : h % 12;
  return `${hour12}:${String(m).padStart(2, "0")} ${period}`;
}