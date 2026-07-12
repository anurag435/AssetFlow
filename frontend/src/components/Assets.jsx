import { useState, useRef, useEffect, useMemo } from "react";
import { LogOut, ChevronDown, Search, Plus } from "lucide-react";

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

const statusColors = {
  Available: "#29D8AA",
  Allocated: "#4C9FFE",
  Reserved: "#8B7CF6",
  Maintenance: "#F0B429",
  Lost: "#F0555F",
  Retired: "#8C99A6",
};

 
const allAssets = [
  { tag: "AF-0012", name: "Dell Laptop", category: "Electronics", status: "Allocated", location: "Bengaluru", department: "IT" },
  { tag: "AF-0062", name: "Projector", category: "Electronics", status: "Maintenance", location: "HQ floor 2", department: "Facilities" },
  { tag: "AF-0201", name: "Office chair", category: "Furniture", status: "Available", location: "Warehouse", department: "Facilities" },
  { tag: "AF-0033", name: "Site Camera", category: "Electronics", status: "Reserved", location: "Field Ops site", department: "Field Ops" },
  { tag: "AF-0088", name: "Forklift", category: "Vehicles", status: "Available", location: "Warehouse", department: "Field Ops" },
  { tag: "AF-0020", name: "Conference table", category: "Furniture", status: "Lost", location: "HQ floor 1", department: "Engineering" },
];

const categoryOptions = ["Electronics", "Furniture", "Vehicles"];
const statusOptions = ["Available", "Allocated", "Reserved", "Maintenance", "Lost", "Retired"];
const departmentOptions = ["IT", "Facilities", "Field Ops", "Engineering"];

export default function AssetsPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Assets");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null);
  const [department, setDepartment] = useState(null);

  function goTo(item) {
    setActiveNav(item);
    onNavigate?.(item);
  }

  const filtered = useMemo(() => {
    return allAssets.filter((a) => {
      const matchesQuery =
        !query.trim() ||
        a.tag.toLowerCase().includes(query.toLowerCase()) ||
        a.name.toLowerCase().includes(query.toLowerCase());
      const matchesCategory = !category || a.category === category;
      const matchesStatus = !status || a.status === status;
      const matchesDepartment = !department || a.department === department;
      return matchesQuery && matchesCategory && matchesStatus && matchesDepartment;
    });
  }, [query, category, status, department]);

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar active={activeNav} onSelect={goTo} />

        <div className="flex-1 min-w-0 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Assets</h1>
            <ProfileMenu userName={userName} onLogout={onLogout} />
          </div>

          <div className="flex items-center gap-3 mt-5 fade-up" style={{ animationDelay: "40ms" }}>
            <div className="flex-1 flex items-center gap-2.5 h-10 px-3.5 rounded-lg bg-[#10161D] border border-[#232C36] focus-within:border-[#29D8AA]/50 transition-colors">
              <Search size={15} className="text-[#8C99A6] shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by tag, serial, or QR code.."
                className="flex-1 bg-transparent outline-none text-[#ECF1F5] text-sm placeholder:text-[#4A5460]"
              />
            </div>
            <button className="flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm border border-[#29D8AA]/60 text-[#29D8AA] transition-all active:scale-[0.97] hover:bg-[#29D8AA]/[0.08] shrink-0">
              <Plus size={14} />
              Register Asset
            </button>
          </div>

          <div className="flex items-center gap-2.5 mt-3 fade-up" style={{ animationDelay: "80ms" }}>
            <FilterDropdown label="Category" value={category} onChange={setCategory} options={categoryOptions} />
            <FilterDropdown label="Status" value={status} onChange={setStatus} options={statusOptions} />
            <FilterDropdown label="Department" value={department} onChange={setDepartment} options={departmentOptions} />
          </div>

          <div className="mt-4 rounded-lg border border-[#232C36] overflow-hidden fade-up" style={{ animationDelay: "120ms" }}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-[#232C36] bg-[#10161D]">
                  {["Tag", "Name", "Category", "Status", "Location"].map((col) => (
                    <th key={col} className="text-left text-[#8C99A6] font-normal px-4 py-2.5">
                      {col}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#232C36]">
                {filtered.map((a) => (
                  <tr key={a.tag} className="transition-colors hover:bg-[#10161D] cursor-default">
                    <td className="px-4 py-2.5 text-[#ECF1F5] font-['JetBrains_Mono'] text-xs">{a.tag}</td>
                    <td className="px-4 py-2.5 text-[#ECF1F5]">{a.name}</td>
                    <td className="px-4 py-2.5 text-[#8C99A6]">{a.category}</td>
                    <td className="px-4 py-2.5">
                      <StatusBadge status={a.status} />
                    </td>
                    <td className="px-4 py-2.5 text-[#8C99A6]">{a.location}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#8C99A6]">
                      No assets match this search.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
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

function FilterDropdown({ label, value, onChange, options }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-1.5 h-9 px-3.5 rounded-md text-sm border transition-colors ${
          value ? "border-[#29D8AA]/60 text-[#29D8AA] bg-[#29D8AA]/[0.06]" : "border-[#3A4551] text-[#ECF1F5] hover:bg-[#171F27]"
        }`}
      >
        {value || label}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="menu-in absolute left-0 mt-2 w-40 rounded-lg border border-[#232C36] bg-[#10161D] shadow-lg shadow-black/40 overflow-hidden z-10">
          {value && (
            <button
              onClick={() => {
                onChange(null);
                setOpen(false);
              }}
              className="w-full text-left px-3.5 py-2 text-sm text-[#8C99A6] hover:bg-[#171F27] transition-colors border-b border-[#232C36]"
            >
              Clear filter
            </button>
          )}
          {options.map((opt) => (
            <button
              key={opt}
              onClick={() => {
                onChange(opt);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-sm transition-colors hover:bg-[#171F27] ${
                opt === value ? "text-[#29D8AA]" : "text-[#ECF1F5]"
              }`}
            >
              {opt}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function StatusBadge({ status }) {
  const color = statusColors[status] || "#8C99A6";
  return (
    <span
      className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs border"
      style={{ borderColor: `${color}55`, color }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: color }} />
      {status}
    </span>
  );
}