import { useState, useRef, useEffect } from "react";
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


const kpis = [
  { label: "Available", value: 128 },
  { label: "Allocated", value: 76 },
  { label: "Maintenance today", value: 4 },
  { label: "Active bookings", value: 9 },
  { label: "Pending transfers", value: 3 },
  { label: "Upcoming returns", value: 12 },
];

const recentActivity = [
  "Laptop AF-0114 - allocated to Priya shah - IT dept",
  "Room B2 - booking confirmed - 2:00 to 3:00 PM",
  "Projector AF-0062 - maintenance resolved",
];

const overdueCount = 3;

export default function DashPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Dashboard");

  function goTo(item) {
    setActiveNav(item);
    onNavigate?.(item);
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar active={activeNav} onSelect={goTo} />

        <div className="flex-1 min-w-0 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Today's Overview</h1>
            <ProfileMenu userName={userName} onLogout={onLogout} />
          </div>

          <div className="grid grid-cols-3 gap-3.5 mt-5">
            {kpis.map((kpi, i) => (
              <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} delay={i * 40} />
            ))}
          </div>

          <div
            className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 fade-up transition-colors hover:bg-[#F0555F]/10 cursor-default"
            style={{ animationDelay: "260ms" }}
          >
            <span className="text-sm text-[#F0555F]">
              {overdueCount} assets overdue for return - flagged for follow-up
            </span>
          </div>

          <div className="flex items-center gap-3 mt-4 fade-up" style={{ animationDelay: "310ms" }}>
            <ActionButton label="+ register asset" primary onClick={() => goTo("Assets")} />
            <ActionButton label="Book resource" onClick={() => goTo("Resource Booking")} />
            <ActionButton label="Raise requests" onClick={() => goTo("Maintenance")} />
          </div>

          <section className="mt-7 fade-up" style={{ animationDelay: "360ms" }}>
            <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-lg">Recent Acivity</h2>
            <div className="mt-2.5 space-y-1">
              {recentActivity.map((line, i) => (
                <p
                  key={i}
                  className="text-sm text-[#8C99A6] leading-relaxed px-2 py-1 -mx-2 rounded-md transition-colors hover:bg-[#10161D] hover:text-[#C7D0D9] cursor-default"
                >
                  {line}
                </p>
              ))}
            </div>
          </section>
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

function Sidebar({ active, onSelect }) {
  return (
    <aside className="w-55 shrink-0 border-r border-[#232C36] p-6">
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
                  ? "border border-[#29D8AA]/50 text-[#29D8AA] bg-[#29D8AA]/6"
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
            className="w-full flex items-center gap-2 px-3.5 py-2.5 text-sm text-[#F0555F] hover:bg-[#F0555F]/8 transition-colors"
          >
            <LogOut size={14} />
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function KpiCard({ label, value, delay = 0 }) {
  return (
    <div
      className="rounded-lg border border-[#3A4551] px-4 py-3 fade-up transition-colors hover:border-[#4C9FFE]/50"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-[#ECF1F5] text-sm">{label}</p>
      <p className="text-[#8C99A6] text-sm mt-1.5">{value}</p>
    </div>
  );
}

function ActionButton({ label, primary, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-md text-sm transition-all active:scale-[0.97] border ${
        primary
          ? "border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/8"
          : "border-[#3A4551] text-[#ECF1F5] hover:bg-[#171F27]"
      }`}
    >
      {label}
    </button>
  );
}