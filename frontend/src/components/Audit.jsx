import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, ClipboardCheck } from "lucide-react";

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

const auditCycle = {
  title: "Q3 audit: Engineering dept — 1–15 Jul",
  auditors: "A. Rao, S. Iqbal",
};

const auditItems = [
  { asset: "AF-003 Dell laptop", location: "Desk E12", status: "Verified" },
  { asset: "AF-9921 Office chair", location: "Desk E14", status: "Missing" },
  { asset: "AF-9838 Monitor", location: "Desk E15", status: "Damaged" },
];

export default function AuditPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Audit");
  const [items, setItems] = useState(auditItems);
  const [closed, setClosed] = useState(false);

  const flaggedCount = items.filter((i) => i.status !== "Verified").length;

  function goTo(item) {
    setActiveNav(item);
    onNavigate?.(item);
  }

  function setStatus(asset, status) {
    if (closed) return;
    setItems((prev) => prev.map((i) => (i.asset === asset ? { ...i, status } : i)));
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar active={activeNav} onSelect={goTo} />

        <div className="flex-1 min-w-0 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Asset Audit</h1>
            <ProfileMenu userName={userName} onLogout={onLogout} />
          </div>

          <div
            className="mt-5 rounded-lg border border-[#F0B429]/35 bg-[#3A2A12] px-4 py-3 fade-up"
            style={{ animationDelay: "40ms" }}
          >
            <p className="text-sm text-[#F0D9A6]">{auditCycle.title}</p>
            <p className="text-xs text-[#C7B182] mt-1">Auditors: {auditCycle.auditors}</p>
          </div>

          <div className="mt-5 rounded-lg border border-[#232C36] overflow-hidden fade-up" style={{ animationDelay: "90ms" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#232C36] bg-[#10161D]">
                  <th className="text-left text-[#8C99A6] font-normal px-4 py-2.5">Asset</th>
                  <th className="text-left text-[#8C99A6] font-normal px-4 py-2.5">Expected location</th>
                  <th className="text-left text-[#8C99A6] font-normal px-4 py-2.5">Verification</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232C36]">
                {items.map((item) => (
                  <tr key={item.asset} className="transition-colors hover:bg-[#10161D]">
                    <td className="px-4 py-2.5 text-[#ECF1F5]">{item.asset}</td>
                    <td className="px-4 py-2.5 text-[#8C99A6]">{item.location}</td>
                    <td className="px-4 py-2.5">
                      <VerificationSelect
                        value={item.status}
                        disabled={closed}
                        onChange={(status) => setStatus(item.asset, status)}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {flaggedCount > 0 && (
            <div
              className="mt-5 rounded-lg border border-[#F0B429]/40 bg-[#3A2E0E] px-4 py-2.5 fade-up transition-colors hover:bg-[#453711] cursor-default"
              style={{ animationDelay: "140ms" }}
            >
              <span className="text-sm text-[#F0D9A6]">
                {flaggedCount} asset{flaggedCount > 1 ? "s" : ""} flagged — discrepancy report generated automatically
              </span>
            </div>
          )}

          <div className="mt-5 fade-up" style={{ animationDelay: "190ms" }}>
            {!closed ? (
              <ActionButton label="Close audit cycle" primary onClick={() => setClosed(true)} />
            ) : (
              <span className="inline-flex items-center gap-1.5 text-sm text-[#8C99A6]">
                <ClipboardCheck size={14} className="text-[#29D8AA]" />
                Audit cycle closed — asset statuses updated
              </span>
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

function VerificationSelect({ value, onChange, disabled }) {
  const styles = {
    Verified: "border-[#29D8AA]/50 text-[#29D8AA]",
    Missing: "border-[#F0555F]/50 text-[#F0555F]",
    Damaged: "border-[#F0B429]/50 text-[#F0B429]",
  };

  return (
    <div className="relative inline-block">
      <select
        value={value}
        disabled={disabled}
        onChange={(e) => onChange(e.target.value)}
        className={`appearance-none px-2.5 py-0.5 pr-6 rounded-full text-xs bg-transparent outline-none cursor-pointer border disabled:cursor-default disabled:opacity-80 ${styles[value]}`}
      >
        <option value="Verified" className="bg-[#10161D] text-[#ECF1F5]">Verified</option>
        <option value="Missing" className="bg-[#10161D] text-[#ECF1F5]">Missing</option>
        <option value="Damaged" className="bg-[#10161D] text-[#ECF1F5]">Damaged</option>
      </select>
      <ChevronDown size={11} className={`absolute right-1.5 top-1/2 -translate-y-1/2 pointer-events-none ${styles[value].split(" ")[1]}`} />
    </div>
  );
}

function ActionButton({ label, primary, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-md text-sm transition-all active:scale-[0.97] border ${
        primary
          ? "border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/[0.08]"
          : "border-[#3A4551] text-[#ECF1F5] hover:bg-[#171F27]"
      }`}
    >
      {label}
    </button>
  );
}