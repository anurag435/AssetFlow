import { useRef, useEffect, useState } from "react";
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
  ChevronRight,
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

const stages = ["Pending", "Approved", "Technician assigned", "In progress", "Resolved"];

const initialRequests = [
  { id: "AF-0062", title: "Projector bulb not turning on", meta: "", stage: "Pending" },
  { id: "AF-003", title: "AC unit", meta: "noisy compressor", stage: "Approved" },
  { id: "AF-0078", title: "Forklift", meta: "tech: R Varma", stage: "Technician assigned" },
  { id: "AF-897", title: "Printer jam", meta: "parts ordered", stage: "In progress" },
  { id: "AF-873", title: "Chair repair", meta: "resolved 7 Jul", stage: "Resolved" },
];

export default function MaintenancePage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Maintenance");
  const [requests, setRequests] = useState(initialRequests);

  function goTo(item) {
    setActiveNav(item);
    onNavigate?.(item);
  }

  function advance(id) {
    setRequests((prev) =>
      prev.map((r) => {
        if (r.id !== id) return r;
        const idx = stages.indexOf(r.stage);
        if (idx === -1 || idx === stages.length - 1) return r;
        return { ...r, stage: stages[idx + 1] };
      })
    );
  }

  function removeRequest(id) {
    setRequests((prev) => prev.filter((r) => r.id !== id));
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E13] font-['Inter'] flex fade-in">
      <Sidebar active={activeNav} onSelect={goTo} />

      <div className="flex-1 min-w-0 p-8 flex flex-col">
        <div className="flex items-center justify-between">
          <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Maintenance</h1>
          <ProfileMenu userName={userName} onLogout={onLogout} />
        </div>

        <div className="mt-6 flex-1 grid grid-cols-5 gap-4 fade-up" style={{ animationDelay: "40ms" }}>
          {stages.map((stage) => (
            <Column
              key={stage}
              stage={stage}
              cards={requests.filter((r) => r.stage === stage)}
              onAdvance={advance}
              onRemove={removeRequest}
            />
          ))}
        </div>

        <p className="text-sm text-[#8C99A6] mt-6 pt-5 border-t border-[#232C36] fade-up" style={{ animationDelay: "90ms" }}>
          Approving a card moves the asset to Under Maintenance; resolving returns it to Available.
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

function Column({ stage, cards, onAdvance, onRemove }) {
  const isResolved = stage === "Resolved";
  return (
    <div className="flex flex-col">
      <div className="flex items-center justify-between px-1 pb-3 border-b border-[#232C36]">
        <span className="text-sm text-[#8C99A6]">{stage}</span>
        <span className="text-xs text-[#4A5460] font-['JetBrains_Mono']">{cards.length}</span>
      </div>

      <div className="mt-3 space-y-3">
        {cards.map((card) => (
          <Card key={card.id} card={card} resolved={isResolved} onAdvance={onAdvance} onRemove={onRemove} />
        ))}
      </div>
    </div>
  );
}

function Card({ card, resolved, onAdvance, onRemove }) {
  const isLastStage = card.stage === "Resolved";

  return (
    <div
      className={`group relative rounded-lg border px-3 py-2.5 transition-colors ${
        resolved
          ? "border-[#29D8AA]/50 bg-[#29D8AA]/[0.06] hover:bg-[#29D8AA]/[0.1]"
          : "border-[#232C36] bg-[#10161D] hover:bg-[#171F27]"
      }`}
    >
      <button
        onClick={() => onRemove(card.id)}
        className="absolute top-1.5 right-1.5 text-[#4A5460] hover:text-[#F0555F] opacity-0 group-hover:opacity-100 transition-opacity"
        aria-label="Dismiss"
      >
        <X size={12} />
      </button>

      <p className={`text-xs font-['JetBrains_Mono'] ${resolved ? "text-[#7EE8CB]" : "text-[#8C99A6]"}`}>{card.id}</p>
      <p className={`text-sm mt-1 leading-snug ${resolved ? "text-[#7EE8CB]" : "text-[#ECF1F5]"}`}>{card.title}</p>
      {card.meta && (
        <p className={`text-xs mt-0.5 ${resolved ? "text-[#5FBFA0]" : "text-[#8C99A6]"}`}>{card.meta}</p>
      )}

      {!isLastStage && (
        <button
          onClick={() => onAdvance(card.id)}
          className="mt-2 flex items-center gap-1 text-xs text-[#29D8AA] opacity-0 group-hover:opacity-100 transition-opacity hover:underline"
        >
          Move forward
          <ChevronRight size={12} />
        </button>
      )}
    </div>
  );
}

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