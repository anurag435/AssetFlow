import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Download } from "lucide-react";

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

const utilization = [
  { dept: "Eng", value: 62 },
  { dept: "Facilities", value: 88 },
  { dept: "IT", value: 74 },
  { dept: "HR", value: 40 },
  { dept: "Field Ops", value: 52 },
  { dept: "Finance", value: 35 },
];

const maintenanceTrend = [18, 22, 19, 27, 24, 31, 29, 36];

const mostUsed = [
  "Room B2 · 34 bookings this month",
  "Van AF-343 · 21 trips this month",
  "Projector AF-335 · 18 uses",
];

const idleAssets = ["Camera AF-0301 · unused 60+ days", "Chair AF-0410 · unused 45 days"];

const dueForAttention = ["Forklift AF-0087 · service due in 5 days", "Laptop AF-0020 · 4 years old · nearing retirement"];

export default function ReportsPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Reports");

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
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Reports &amp; Analytics</h1>
            <ProfileMenu userName={userName} onLogout={onLogout} />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-5">
            <ChartCard title="Utilization by department" delay={40}>
              <BarChart data={utilization} />
            </ChartCard>
            <ChartCard title="Maintenance frequency" delay={90}>
              <LineChart data={maintenanceTrend} />
            </ChartCard>
          </div>

          <div className="grid grid-cols-2 gap-8 mt-7 fade-up" style={{ animationDelay: "140ms" }}>
            <ListSection title="Most used assets" items={mostUsed} />
            <ListSection title="Idle assets" items={idleAssets} />
          </div>

          <div className="mt-6 pt-5 border-t border-[#232C36] fade-up" style={{ animationDelay: "190ms" }}>
            <ListSection title="Assets due for maintenance / nearing retirement" items={dueForAttention} />
          </div>

          <div className="mt-5 fade-up" style={{ animationDelay: "240ms" }}>
            <button className="flex items-center gap-2 h-9 px-4 rounded-md text-sm border border-[#F0555F]/40 text-[#F0989E] transition-all active:scale-[0.97] hover:bg-[#F0555F]/[0.08]">
              <Download size={14} />
              Export report
            </button>
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

function ChartCard({ title, delay, children }) {
  return (
    <div
      className="rounded-xl border border-[#2C5C8A]/50 bg-[#12253A] px-5 py-4 fade-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <p className="text-sm text-[#BFD4E8]">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value));
  const width = 280;
  const height = 110;
  const barGap = 14;
  const barWidth = (width - barGap * (data.length - 1)) / data.length;

  return (
    <svg viewBox={`0 0 ${width} ${height + 18}`} className="w-full h-auto">
      <line x1="0" y1={height} x2={width} y2={height} stroke="#3A5B7D" strokeWidth="1" />
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - 8);
        const x = i * (barWidth + barGap);
        const y = height - barHeight;
        return (
          <g key={d.dept}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="2" fill="#B8862E" />
            <text
              x={x + barWidth / 2}
              y={height + 13}
              textAnchor="middle"
              fontSize="8"
              fill="#8FAECB"
              fontFamily="Inter, sans-serif"
            >
              {d.dept}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data }) {
  const width = 280;
  const height = 110;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;

  const points = data.map((v, i) => {
    const x = (i / (data.length - 1)) * width;
    const y = height - ((v - min) / range) * (height - 10) - 5;
    return [x, y];
  });

  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");

  return (
    <svg viewBox={`0 0 ${width} ${height + 4}`} className="w-full h-auto">
      <line x1="0" y1={height} x2={width} y2={height} stroke="#3A5B7D" strokeWidth="1" />
      <path d={path} fill="none" stroke="#E0637A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], i) => (
        <circle key={i} cx={x} cy={y} r="2.5" fill="#E0637A" />
      ))}
    </svg>
  );
}

function ListSection({ title, items }) {
  return (
    <section>
      <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-base mb-2">{title}</h2>
      <div className="space-y-1">
        {items.map((line, i) => (
          <p
            key={i}
            className="text-sm text-[#8C99A6] leading-relaxed px-2 py-1 -mx-2 rounded-md transition-colors hover:bg-[#10161D] hover:text-[#C7D0D9] cursor-default"
          >
            {line}
          </p>
        ))}
      </div>
    </section>
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