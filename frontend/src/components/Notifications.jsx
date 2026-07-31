import { useMemo, useState, useRef, useEffect } from "react";
import { ChevronDown, Loader2 } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

const filters = ["All", "Alerts", "Approvals", "Bookings"];
const categoryMap = {
  Alerts: ["OverdueReturn", "AuditDiscrepancy"],
  Approvals: ["AssetAssigned", "MaintenanceApproved", "MaintenanceRejected", "TransferApproved"],
  Bookings: ["BookingConfirmed", "BookingCancelled", "BookingReminder"],
};
const dotColor = {
  OverdueReturn: "bg-[#F0555F] border-[#F0555F]/60", AuditDiscrepancy: "bg-[#F0555F] border-[#F0555F]/60",
  AssetAssigned: "bg-[#29D8AA] border-[#29D8AA]/60", MaintenanceApproved: "bg-[#29D8AA] border-[#29D8AA]/60",
  MaintenanceRejected: "bg-[#29D8AA] border-[#29D8AA]/60", TransferApproved: "bg-[#29D8AA] border-[#29D8AA]/60",
  BookingConfirmed: "bg-[#4C9FFE] border-[#4C9FFE]/60", BookingCancelled: "bg-[#4C9FFE] border-[#4C9FFE]/60",
  BookingReminder: "bg-[#4C9FFE] border-[#4C9FFE]/60",
};

export default function NotificationsPage() {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [filter, setFilter] = useState("All");
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      try {
        const [meRes, notifRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/notifications`, { withCredentials: true }),
        ]);
        if (cancelled) return;
        setUser(meRes.data.user);
        setItems(notifRes.data);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) return navigate("/");
        setError("Couldn't load notifications.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [navigate]);

  const visible = useMemo(
    () => (filter === "All" ? items : items.filter((n) => categoryMap[filter]?.includes(n.type))),
    [items, filter]
  );

  async function toggleRead(id) {
    setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: !n.read } : n))); // optimistic
    try {
      await axios.patch(`${BASE_URL}/api/notifications/${id}/read`, {}, { withCredentials: true });
    } catch (err) {
      setItems((prev) => prev.map((n) => (n._id === id ? { ...n, read: !n.read } : n))); // revert
      setError("Failed to update notification.");
    }
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:rounded-2xl border-0 sm:border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar />
        <div className="flex-1 min-w-0 p-4 pt-20 sm:p-8 sm:pt-20 md:pt-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-lg sm:text-xl">Activity logs &amp; Notifications</h1>
            <ProfileMenu userName={user?.name || "..."} role={user?.role} />
          </div>

          {error && <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5 text-sm text-[#F0555F]">{error}</div>}

          <div className="flex items-center gap-2.5 mt-5 flex-wrap">
            {filters.map((f) => <FilterTab key={f} label={f} active={f === filter} onClick={() => setFilter(f)} />)}
          </div>

          <div className="mt-5 rounded-lg border border-[#232C36] overflow-hidden">
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-[#8C99A6] text-sm py-10"><Loader2 size={16} className="animate-spin" /> Loading...</div>
            ) : visible.length === 0 ? (
              <p className="text-sm text-[#8C99A6] px-4 py-6 text-center">No notifications in this category.</p>
            ) : (
              visible.map((n, i) => (
                <NotificationRow key={n._id} notification={n} last={i === visible.length - 1} onToggle={() => toggleRead(n._id)} />
              ))
            )}
          </div>
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

function FilterTab({ label, active, onClick }) {
  return (
    <button onClick={onClick} className={`h-8 px-4 rounded-md text-sm transition-all active:scale-[0.97] border ${active ? "border-[#29D8AA]/60 text-[#29D8AA] bg-[#29D8AA]/10" : "border-[#3A4551] text-[#8C99A6] hover:text-[#ECF1F5] hover:bg-[#171F27]"}`}>
      {label}
    </button>
  );
}

function NotificationRow({ notification, last, onToggle }) {
  const { message, createdAt, type, read } = notification;
  return (
    <button onClick={onToggle} className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors hover:bg-[#10161D] ${!last ? "border-b border-[#232C36]" : ""}`}>
      <span className={`w-3 h-3 rounded-sm border shrink-0 ${read ? "bg-transparent border-[#3A4551]" : dotColor[type] || "bg-[#8C99A6] border-[#8C99A6]/60"}`} />
      <span className={`flex-1 text-sm ${read ? "text-[#8C99A6]" : "text-[#ECF1F5]"}`}>{message}</span>
      <span className="text-xs text-[#4A5460] font-['JetBrains_Mono'] shrink-0">{timeAgo(createdAt)}</span>
    </button>
  );
}

function timeAgo(iso) {
  const diff = (Date.now() - new Date(iso)) / 1000;
  if (diff < 60) return "now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
  return `${Math.floor(diff / 86400)}d ago`;
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