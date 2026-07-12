import { useMemo, useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown } from "lucide-react";

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

const filters = ["All", "Alerts", "Approvals", "Bookings"];

const initialNotifications = [
  { id: 1, text: "Laptop AF-0014 assigned to Priya Shah", time: "2m ago", category: "Approvals", read: false },
  { id: 2, text: "Maintenance request AF-0055 approved", time: "18m ago", category: "Approvals", read: true },
  { id: 3, text: "Booking confirmed: Room B2, 2:00 to 3:00 PM", time: "1h ago", category: "Bookings", read: false },
  { id: 4, text: "Transfer approved: AF-0033 to Facilities dept", time: "3h ago", category: "Approvals", read: true },
  { id: 5, text: "Overdue return: AF-0021 was due 3 days ago", time: "1d ago", category: "Alerts", read: true },
  { id: 6, text: "Audit discrepancy flagged: AF-0088 damaged", time: "2d ago", category: "Alerts", read: true },
];

const dotColor = {
  Alerts: "bg-[#F0555F] border-[#F0555F]/60",
  Approvals: "bg-[#29D8AA] border-[#29D8AA]/60",
  Bookings: "bg-[#4C9FFE] border-[#4C9FFE]/60",
};

export default function NotificationsPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Notifications");
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState(initialNotifications);

  function goTo(item) {
    setActiveNav(item);
    onNavigate?.(item);
  }

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((n) => n.category === filter)),
    [items, filter]
  );

  function toggleRead(id) {
    setItems((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar active={activeNav} onSelect={goTo} />

        <div className="flex-1 min-w-0 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Activity logs &amp; Notifications</h1>
            <ProfileMenu userName={userName} onLogout={onLogout} />
          </div>

          <div className="flex items-center gap-2.5 mt-5 fade-up" style={{ animationDelay: "40ms" }}>
            {filters.map((f) => (
              <FilterTab key={f} label={f} active={f === filter} onClick={() => setFilter(f)} />
            ))}
          </div>

          <div className="mt-5 rounded-lg border border-[#232C36] overflow-hidden fade-up" style={{ animationDelay: "90ms" }}>
            {visible.length === 0 ? (
              <p className="text-sm text-[#8C99A6] px-4 py-6 text-center">No notifications in this category.</p>
            ) : (
              visible.map((n, i) => (
                <NotificationRow
                  key={n.id}
                  notification={n}
                  last={i === visible.length - 1}
                  onToggle={() => toggleRead(n.id)}
                />
              ))
            )}
          </div>
        </div>
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

function FilterTab({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-8 px-4 rounded-md text-sm transition-all active:scale-[0.97] border ${
        active
          ? "border-[#29D8AA]/60 text-[#29D8AA] bg-[#29D8AA]/[0.1]"
          : "border-[#3A4551] text-[#8C99A6] hover:text-[#ECF1F5] hover:bg-[#171F27]"
      }`}
    >
      {label}
    </button>
  );
}

function NotificationRow({ notification, last, onToggle }) {
  const { text, time, category, read } = notification;
  return (
    <button
      onClick={onToggle}
      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#10161D] ${
        !last ? "border-b border-[#232C36]" : ""
      }`}
    >
      <span
        className={`w-3 h-3 rounded-sm border shrink-0 ${
          read ? "bg-transparent border-[#3A4551]" : dotColor[category]
        }`}
      />
      <span className={`flex-1 text-sm ${read ? "text-[#8C99A6]" : "text-[#ECF1F5]"}`}>{text}</span>
      <span className="text-xs text-[#4A5460] font-['JetBrains_Mono'] shrink-0">{time}</span>
    </button>
  );
}

function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-[220px] shrink-0 border-r border-[#232C36] p-6">
      <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-bold text-lg mb-6">AssetFlow</h2>

      <nav className="space-y-1">
        {navItems.map((item) => {
          const isActive = item === active;
          return (
            <button
              key={item}
              onClick={() => onSelect(item)}
              className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                isActive
                  ? "border border-[#29D8AA]/50 text-[#29D8AA] bg-[#29D8AA]/[0.06]"
                  : "text-[#8C99A6] hover:text-[#ECF1F5] hover:bg-[#10161D]"
              }`}
            >
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