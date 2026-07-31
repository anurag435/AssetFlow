import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

export default function DashPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [kpis, setKpis] = useState([]);
  const [overdueCount, setOverdueCount] = useState(0);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;

    async function loadDashboard() {
      setLoading(true);
      setError("");
      try {
        const [meRes, summaryRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/dashboard`, { withCredentials: true }),
        ]);

        if (cancelled) return;
        setUser(meRes.data.user);
        setKpis(summaryRes.data.kpis);
        setOverdueCount(summaryRes.data.overdueReturns);
        setRecentActivity(summaryRes.data.recentActivity);
      } catch (err) {
        if (cancelled) return;
        // Session expired or invalid — bounce back to login
        if (err.response?.status === 401) {
          navigate("/");
          return;
        }
        setError("Couldn't load dashboard data. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadDashboard();
    return () => { cancelled = true; };
  }, [navigate]);

  function goTo(path) {
    navigate(path);
  }

  async function handleLogout() {
    try {
      await axios.post(`${BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      navigate("/");
    }
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:rounded-2xl border-0 sm:border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar />

        <div className="flex-1 min-w-0 p-4 pt-20 sm:p-8 sm:pt-20 md:pt-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-lg sm:text-xl">Today's Overview</h1>
            <ProfileMenu userName={user?.name || "..."} role={user?.role} onLogout={handleLogout} />
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5">
              <span className="text-sm text-[#F0555F]">{error}</span>
            </div>
          )}

          {loading ? (
            <div className="flex items-center justify-center gap-2 text-[#8C99A6] text-sm py-20">
              <Loader2 size={16} className="animate-spin" /> Loading dashboard...
            </div>
          ) : (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5 mt-5">
                {kpis.map((kpi, i) => (
                  <KpiCard key={kpi.label} label={kpi.label} value={kpi.value} delay={i * 40} />
                ))}
              </div>

              {overdueCount > 0 && (
                <div
                  className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 fade-up transition-colors hover:bg-[#F0555F]/10 cursor-default"
                  style={{ animationDelay: "260ms" }}
                >
                  <span className="text-sm text-[#F0555F]">
                    {overdueCount} asset{overdueCount === 1 ? "" : "s"} overdue for return — flagged for follow-up
                  </span>
                </div>
              )}

              <div className="flex items-center flex-wrap gap-3 mt-4 fade-up" style={{ animationDelay: "310ms" }}>
                <ActionButton label="+ register asset" primary onClick={() => goTo("/assets")} />
                <ActionButton label="Book resource" onClick={() => goTo("/resource-booking")} />
                <ActionButton label="Raise requests" onClick={() => goTo("/maintenance")} />
              </div>

              <section className="mt-7 fade-up" style={{ animationDelay: "360ms" }}>
                <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-lg">Recent Activity</h2>
                <div className="mt-2.5 space-y-1">
                  {recentActivity.length === 0 ? (
                    <p className="text-sm text-[#8C99A6] px-2 py-1 -mx-2">No recent activity yet.</p>
                  ) : (
                    recentActivity.map((line, i) => (
                      <p
                        key={i}
                        className="text-sm text-[#8C99A6] leading-relaxed px-2 py-1 -mx-2 rounded-md transition-colors hover:bg-[#10161D] hover:text-[#C7D0D9] cursor-default"
                      >
                        {line}
                      </p>
                    ))
                  )}
                </div>
              </section>
            </>
          )}
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

function ProfileMenu({ userName, role, onLogout }) {
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

  // Role comes back from the API as e.g. "assetManager" — make it readable
  const roleLabel = role
    ? role.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase())
    : "Employee";

  return (
    <div className="relative" ref={menuRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-[#232C36] transition-colors hover:border-[#4C9FFE]/50 hover:bg-[#10161D]"
      >
        <span className="w-6 h-6 rounded-full bg-[#171F27] border border-[#232C36] flex items-center justify-center text-[11px] text-[#ECF1F5] font-medium">
          {userName.charAt(0).toUpperCase()}
        </span>
        <span className="text-xs text-[#8C99A6]">{userName}</span>
        <ChevronDown size={13} className={`text-[#8C99A6] transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="menu-in absolute right-0 mt-2 w-44 rounded-lg border border-[#232C36] bg-[#10161D] shadow-lg shadow-black/40 overflow-hidden z-10">
          <div className="px-3.5 py-2.5 border-b border-[#232C36]">
            <p className="text-sm text-[#ECF1F5] font-medium truncate">{userName}</p>
            <p className="text-xs text-[#8C99A6] mt-0.5">{roleLabel}</p>
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
