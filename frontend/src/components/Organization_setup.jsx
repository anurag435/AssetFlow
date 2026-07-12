import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Plus } from "lucide-react";

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

const tabs = ["Departments", "Categories", "Employee"];

const departments = [
  { name: "Engineering", head: "aditi rao", parent: "--", status: "Active" },
  { name: "Facilities", head: "rohan mehta", parent: "--", status: "Active" },
  { name: "Field ops (east)", head: "sana iqbal", parent: "Field Ops", status: "Inactive" },
];

const categories = [
  { name: "Electronics", extraField: "Warranty period", assetsCount: 62 },
  { name: "Furniture", extraField: "--", assetsCount: 41 },
  { name: "Vehicles", extraField: "Registration expiry", assetsCount: 8 },
];

const employees = [
  { name: "Priya Shah", email: "priya.shah@company.com", department: "IT", role: "Employee", status: "Active" },
  { name: "Aditi Rao", email: "aditi.rao@company.com", department: "Engineering", role: "Department Head", status: "Active" },
  { name: "Rohan Mehta", email: "rohan.mehta@company.com", department: "Facilities", role: "Asset Manager", status: "Active" },
];

export default function OrgSetupPage({ userName = "Priya", onNavigate, onLogout }) {
  const [activeNav, setActiveNav] = useState("Organization setup");
  const [activeTab, setActiveTab] = useState("Departments");

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
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Organization setup</h1>
            <ProfileMenu userName={userName} onLogout={onLogout} />
          </div>

          <div className="flex items-center gap-2.5 mt-5 fade-up" style={{ animationDelay: "40ms" }}>
            {tabs.map((tab) => (
              <TabButton key={tab} label={tab} active={tab === activeTab} onClick={() => setActiveTab(tab)} />
            ))}
            <button className="ml-auto flex items-center gap-1.5 h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] transition-all active:scale-[0.97] hover:bg-[#29D8AA]/[0.08]">
              <Plus size={14} />
              Add
            </button>
          </div>

          <div className="mt-5 fade-up" style={{ animationDelay: "90ms" }}>
            {activeTab === "Departments" && <DepartmentsTable />}
            {activeTab === "Categories" && <CategoriesTable />}
            {activeTab === "Employee" && <EmployeeTable />}
          </div>

          <p className="text-sm text-[#8C99A6] mt-6 fade-up" style={{ animationDelay: "140ms" }}>
            {activeTab === "Departments" && "Editing a department here also drives the picklist in Screen 4 & 5"}
            {activeTab === "Categories" && "Category fields shown here also drive the Register Asset form in Screen 4"}
            {activeTab === "Employee" && "Promoting an employee here is the only place Department Head / Asset Manager roles are assigned"}
          </p>
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
            <p className="text-xs text-[#8C99A6] mt-0.5">Admin</p>
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

function TabButton({ label, active, onClick }) {
  return (
    <button
      onClick={onClick}
      className={`h-9 px-4 rounded-md text-sm transition-all active:scale-[0.97] border ${
        active
          ? "border-[#29D8AA]/60 text-[#29D8AA] bg-[#29D8AA]/[0.06]"
          : "border-[#3A4551] text-[#ECF1F5] hover:bg-[#171F27]"
      }`}
    >
      {label}
    </button>
  );
}

function StatusBadge({ status }) {
  const isActive = status === "Active";
  return (
    <span
      className={`inline-block px-2.5 py-0.5 rounded-full text-xs border ${
        isActive ? "border-[#29D8AA]/50 text-[#29D8AA]" : "border-[#8C99A6]/40 text-[#8C99A6]"
      }`}
    >
      {status}
    </span>
  );
}

function TableShell({ head, rows }) {
  return (
    <div className="rounded-lg border border-[#232C36] overflow-hidden">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-[#232C36] bg-[#10161D]">
            {head.map((col) => (
              <th key={col} className="text-left text-[#8C99A6] font-normal px-4 py-2.5">
                {col}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-[#232C36]">{rows}</tbody>
      </table>
    </div>
  );
}

function DepartmentsTable() {
  return (
    <TableShell
      head={["Department", "Head", "Parent Dept", "Status"]}
      rows={departments.map((d) => (
        <tr key={d.name} className="transition-colors hover:bg-[#10161D]">
          <td className="px-4 py-2.5 text-[#ECF1F5]">{d.name}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{d.head}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{d.parent}</td>
          <td className="px-4 py-2.5">
            <StatusBadge status={d.status} />
          </td>
        </tr>
      ))}
    />
  );
}

function CategoriesTable() {
  return (
    <TableShell
      head={["Category", "Optional field", "Assets"]}
      rows={categories.map((c) => (
        <tr key={c.name} className="transition-colors hover:bg-[#10161D]">
          <td className="px-4 py-2.5 text-[#ECF1F5]">{c.name}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{c.extraField}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{c.assetsCount}</td>
        </tr>
      ))}
    />
  );
}

function EmployeeTable() {
  return (
    <TableShell
      head={["Name", "Email", "Department", "Role", "Status"]}
      rows={employees.map((e) => (
        <tr key={e.email} className="transition-colors hover:bg-[#10161D]">
          <td className="px-4 py-2.5 text-[#ECF1F5]">{e.name}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{e.email}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{e.department}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{e.role}</td>
          <td className="px-4 py-2.5">
            <StatusBadge status={e.status} />
          </td>
        </tr>
      ))}
    />
  );
}