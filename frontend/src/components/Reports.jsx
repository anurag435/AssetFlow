import { useState, useRef, useEffect } from "react";
import { ChevronDown, Download, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

export default function ReportsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [meRes, sumRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/reports/summary`, { withCredentials: true }),
        ]);
        if (cancelled) return;
        setUser(meRes.data.user);
        setSummary(sumRes.data);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) return navigate("/");
        setError("Couldn't load reports.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navigate]);

  function exportReport() {
    if (!summary) return;
    const blob = new Blob([JSON.stringify(summary, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `assetflow-report-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar />
        <div className="flex-1 min-w-0 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Reports &amp; Analytics</h1>
            <ProfileMenu userName={user?.name || "..."} role={user?.role} />
          </div>

          {error && <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 text-sm text-[#F0555F]">{error}</div>}

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-[#8C99A6] text-sm py-20"><Loader2 size={16} className="animate-spin" /> Loading...</div>
          ) : summary && (
            <>
              <div className="grid grid-cols-2 gap-4 mt-5">
                <ChartCard title="Utilization by department">
                  {summary.utilizationByDept.length ? <BarChart data={summary.utilizationByDept} /> : <EmptyNote text="No department-assigned assets yet." />}
                </ChartCard>
                <ChartCard title="Maintenance frequency (last 8 weeks)">
                  {summary.maintenanceTrend.length ? <LineChart data={summary.maintenanceTrend} /> : <EmptyNote text="No maintenance requests yet." />}
                </ChartCard>
              </div>

              <div className="grid grid-cols-2 gap-8 mt-7">
                <ListSection title="Most used assets" items={summary.mostUsedAssets.map((a) => `${a.label} · ${a.uses} uses`)} />
                <ListSection title="Idle assets" items={summary.idleAssets.map((a) => `${a.label} · unused ${a.idleDays} days`)} />
              </div>

              <div className="mt-6 pt-5 border-t border-[#232C36]">
                <ListSection title="Assets due for attention" items={summary.attentionItems} />
              </div>

              <div className="mt-5">
                <button onClick={exportReport} className="flex items-center gap-2 h-9 px-4 rounded-md text-sm border border-[#F0555F]/40 text-[#F0989E] hover:bg-[#F0555F]/8 transition-all active:scale-[0.97]">
                  <Download size={14} /> Export report
                </button>
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
      `}</style>
    </div>
  );
}

function EmptyNote({ text }) { return <p className="text-xs text-[#8C99A6] py-6 text-center">{text}</p>; }

function ChartCard({ title, children }) {
  return (
    <div className="rounded-xl border border-[#2C5C8A]/50 bg-[#12253A] px-5 py-4">
      <p className="text-sm text-[#BFD4E8]">{title}</p>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function BarChart({ data }) {
  const max = Math.max(...data.map((d) => d.value), 1);
  const width = 280, height = 110, barGap = 14;
  const barWidth = (width - barGap * (data.length - 1)) / data.length;
  return (
    <svg viewBox={`0 0 ${width} ${height + 18}`} className="w-full h-auto">
      <line x1="0" y1={height} x2={width} y2={height} stroke="#3A5B7D" strokeWidth="1" />
      {data.map((d, i) => {
        const barHeight = (d.value / max) * (height - 8);
        const x = i * (barWidth + barGap), y = height - barHeight;
        return (
          <g key={d.dept}>
            <rect x={x} y={y} width={barWidth} height={barHeight} rx="2" fill="#B8862E" />
            <text x={x + barWidth / 2} y={height + 13} textAnchor="middle" fontSize="8" fill="#8FAECB" fontFamily="Inter, sans-serif">{d.dept}</text>
          </g>
        );
      })}
    </svg>
  );
}

function LineChart({ data }) {
  const width = 280, height = 110;
  const max = Math.max(...data), min = Math.min(...data), range = max - min || 1;
  const points = data.map((v, i) => [(i / (data.length - 1 || 1)) * width, height - ((v - min) / range) * (height - 10) - 5]);
  const path = points.map(([x, y], i) => `${i === 0 ? "M" : "L"}${x},${y}`).join(" ");
  return (
    <svg viewBox={`0 0 ${width} ${height + 4}`} className="w-full h-auto">
      <line x1="0" y1={height} x2={width} y2={height} stroke="#3A5B7D" strokeWidth="1" />
      <path d={path} fill="none" stroke="#E0637A" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
      {points.map(([x, y], i) => <circle key={i} cx={x} cy={y} r="2.5" fill="#E0637A" />)}
    </svg>
  );
}

function ListSection({ title, items }) {
  return (
    <section>
      <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-base mb-2">{title}</h2>
      <div className="space-y-1">
        {items.length === 0 ? <p className="text-sm text-[#8C99A6]">Nothing to show.</p> : items.map((line, i) => (
          <p key={i} className="text-sm text-[#8C99A6] leading-relaxed px-2 py-1 -mx-2 rounded-md transition-colors hover:bg-[#10161D] hover:text-[#C7D0D9] cursor-default">{line}</p>
        ))}
      </div>
    </section>
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