import { useState, useRef, useEffect, useMemo } from "react";
import { LogOut, ChevronDown, AlertTriangle, ArrowRight } from "lucide-react";

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

const assets = [
  {
    tag: "AF-0114",
    name: "Dell laptop",
    holder: "Priya shah",
    department: "Engineering",
    history: [
      { date: "Mar 12", text: "Allocated to Priya shah - Engineering" },
      { date: "Jan 04", text: "Returned by Arjun Nair - condition: good" },
    ],
  },
  {
    tag: "AF-0062",
    name: "Projector",
    holder: null,
    department: null,
    history: [{ date: "Feb 20", text: "Returned by Facilities - condition: fair" }],
  },
  {
    tag: "AF-0201",
    name: "Office chair",
    holder: null,
    department: null,
    history: [],
  },
];

const employees = ["Arjun Nair", "Sana Iqbal", "Rohan Mehta", "Aditi Rao"];

export default function AllocationPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Allocation & Transfer");
  const [selectedTag, setSelectedTag] = useState(assets[0].tag);
  const [toEmployee, setToEmployee] = useState("");
  const [reason, setReason] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const asset = useMemo(() => assets.find((a) => a.tag === selectedTag), [selectedTag]);
  const isTaken = Boolean(asset?.holder);

  function goTo(item) {
    setActiveNav(item);
    onNavigate?.(item);
  }

  function handleAssetChange(tag) {
    setSelectedTag(tag);
    setToEmployee("");
    setReason("");
    setSubmitted(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    if (!toEmployee.trim() || !reason.trim()) return;
    setSubmitted(true);
  }

  return (
    <div className="min-h-screen w-full bg-[#0A0E13] font-['Inter'] flex fade-in">
      <Sidebar active={activeNav} onSelect={goTo} />

      <div className="flex-1 min-w-0 p-8 max-w-[560px]">
        <div className="flex items-center justify-between">
          <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Allocation &amp; Transfer</h1>
          <ProfileMenu userName={userName} onLogout={onLogout} />
        </div>

        <div className="mt-6 fade-up" style={{ animationDelay: "40ms" }}>
          <label className="block">
            <span className="text-xs text-[#8C99A6] mb-1.5 block">Asset</span>
            <div className="relative">
              <select
                value={selectedTag}
                onChange={(e) => handleAssetChange(e.target.value)}
                className="w-full appearance-none h-11 px-3 rounded-lg bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50 transition-colors"
              >
                {assets.map((a) => (
                  <option key={a.tag} value={a.tag} className="bg-[#10161D]">
                    {a.tag} - {a.name}
                  </option>
                ))}
              </select>
              <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C99A6] pointer-events-none" />
            </div>
          </label>
        </div>

        {isTaken ? (
          <div
            className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#F0555F]/[0.1] border border-[#F0555F]/40 px-4 py-3 fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <AlertTriangle size={16} className="text-[#F0555F] mt-0.5 shrink-0" />
            <p className="text-sm text-[#F5A7AC] leading-relaxed">
              Already allocated to <span className="font-medium text-[#F0555F]">{asset.holder}</span> ({asset.department})
              <br />
              Direct re-allocation is blocked — submit a transfer request below.
            </p>
          </div>
        ) : (
          <div
            className="mt-4 flex items-start gap-2.5 rounded-lg bg-[#29D8AA]/[0.06] border border-[#29D8AA]/25 px-4 py-3 fade-up"
            style={{ animationDelay: "80ms" }}
          >
            <p className="text-sm text-[#9FE1CB] leading-relaxed">
              This asset is currently <span className="font-medium">available</span> — you can allocate it directly instead of
              filing a transfer request.
            </p>
          </div>
        )}

        {isTaken && (
          <form onSubmit={handleSubmit} className="mt-6 fade-up" style={{ animationDelay: "120ms" }}>
            <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-medium text-base">Transfer Request</h2>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <label className="block">
                <span className="text-xs text-[#8C99A6] mb-1.5 block">From</span>
                <div className="h-11 px-3 rounded-lg bg-[#10161D] border border-[#232C36] flex items-center text-sm text-[#8C99A6]">
                  {asset.holder}
                </div>
              </label>

              <label className="block">
                <span className="text-xs text-[#8C99A6] mb-1.5 block">To</span>
                <div className="relative">
                  <select
                    value={toEmployee}
                    onChange={(e) => setToEmployee(e.target.value)}
                    className={`w-full appearance-none h-11 px-3 rounded-lg bg-[#10161D] border text-sm outline-none transition-colors ${
                      toEmployee ? "text-[#ECF1F5] border-[#232C36] focus:border-[#29D8AA]/50" : "text-[#4A5460] border-[#232C36] focus:border-[#29D8AA]/50"
                    }`}
                  >
                    <option value="" disabled className="text-[#4A5460]">
                      Select Employee....
                    </option>
                    {employees
                      .filter((e) => e !== asset.holder)
                      .map((e) => (
                        <option key={e} value={e} className="bg-[#10161D] text-[#ECF1F5]">
                          {e}
                        </option>
                      ))}
                  </select>
                  <ChevronDown size={16} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#8C99A6] pointer-events-none" />
                </div>
              </label>
            </div>

            <label className="block mt-4">
              <span className="text-xs text-[#8C99A6] mb-1.5 block">Reason</span>
              <textarea
                value={reason}
                onChange={(e) => setReason(e.target.value)}
                rows={4}
                placeholder="Why is this transfer needed?"
                className="w-full px-3 py-2.5 rounded-lg bg-[#10161D] border border-[#232C36] text-[#ECF1F5] text-sm outline-none focus:border-[#29D8AA]/50 transition-colors placeholder:text-[#4A5460] resize-none"
              />
            </label>

            {submitted && (
              <p className="text-xs text-[#29D8AA] mt-2">
                Request submitted — pending approval from {asset.department}'s Department Head.
              </p>
            )}

            <button
              type="submit"
              className="mt-4 h-10 px-5 rounded-lg bg-[#29D8AA] hover:bg-[#25c299] text-[#04342C] font-medium text-sm flex items-center gap-2 transition-all active:scale-[0.98]"
            >
              Submit Request
              <ArrowRight size={15} />
            </button>
          </form>
        )}

        <section className="mt-8 fade-up" style={{ animationDelay: "160ms" }}>
          <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-medium text-base pb-2.5 border-b border-[#232C36]">
            Allocation history
          </h2>
          <div className="mt-2.5 space-y-1.5">
            {asset.history.length === 0 && <p className="text-sm text-[#8C99A6]">No history yet for this asset.</p>}
            {asset.history.map((h, i) => (
              <p key={i} className="text-sm text-[#8C99A6] leading-relaxed">
                <span className="font-['JetBrains_Mono'] text-xs text-[#5A6570] mr-2">{h.date}</span>
                {h.text}
              </p>
            ))}
          </div>
        </section>
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
    <aside className="w-[220px] shrink-0 border-r border-[#232C36] p-6 min-h-screen">
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
            <p className="text-xs text-[#8C99A6] mt-0.5">Asset Manager</p>
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