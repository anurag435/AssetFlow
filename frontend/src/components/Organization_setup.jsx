import { useState, useRef, useEffect } from "react";
import { LogOut, ChevronDown, Plus, Loader2, Check, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

const tabs = ["Departments", "Categories", "Employee"];

export default function OrgSetupPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [activeTab, setActiveTab] = useState("Departments");

  const [departments, setDepartments] = useState([]);
  const [categories, setCategories] = useState([]);
  const [employees, setEmployees] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [showAddRow, setShowAddRow] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function loadAll() {
      setLoading(true);
      setError("");
      try {
        const [meRes, deptRes, catRes, userRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/categories`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/users`, { withCredentials: true }),
        ]);

        if (cancelled) return;
        setUser(meRes.data.user);
        setDepartments(deptRes.data);
        setCategories(catRes.data);
        setEmployees(userRes.data);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          navigate("/");
          return;
        }
        // Employee tab route is role-gated (admin/assetManager/departmentHead) —
        // a 403 there shouldn't block departments/categories from loading.
        if (err.response?.status === 403) {
          setError("You don't have permission to view employees.");
        } else {
          setError("Couldn't load organization data. Refresh to try again.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadAll();
    return () => { cancelled = true; };
  }, [navigate]);

  async function handleLogout() {
    try {
      await axios.post(`${BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      navigate("/");
    }
  }

  function switchTab(tab) {
    setActiveTab(tab);
    setShowAddRow(false);
  }

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-6">
      <div className="w-full rounded-2xl border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar />

        <div className="flex-1 min-w-0 p-8">
          <div className="flex items-center justify-between">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-xl">Organization setup</h1>
            <ProfileMenu userName={user?.name || "..."} role={user?.role} onLogout={handleLogout} />
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5">
              <span className="text-sm text-[#F0555F]">{error}</span>
            </div>
          )}

          <div className="flex items-center gap-2.5 mt-5 fade-up" style={{ animationDelay: "40ms" }}>
            {tabs.map((tab) => (
              <TabButton key={tab} label={tab} active={tab === activeTab} onClick={() => switchTab(tab)} />
            ))}
            {activeTab !== "Employee" && (
              <button
                onClick={() => setShowAddRow((v) => !v)}
                className="ml-auto flex items-center gap-1.5 h-9 px-4 rounded-md text-sm border border-[#29D8AA]/60 text-[#29D8AA] transition-all active:scale-[0.97] hover:bg-[#29D8AA]/[0.08]"
              >
                <Plus size={14} className={`transition-transform ${showAddRow ? "rotate-45" : ""}`} />
                {showAddRow ? "Cancel" : "Add"}
              </button>
            )}
          </div>

          <div className="mt-5 fade-up" style={{ animationDelay: "90ms" }}>
            {loading ? (
              <div className="flex items-center justify-center gap-2 text-[#8C99A6] text-sm py-20">
                <Loader2 size={16} className="animate-spin" /> Loading...
              </div>
            ) : (
              <>
                {activeTab === "Departments" && (
                  <DepartmentsTable
                    departments={departments}
                    employees={employees}
                    showAddRow={showAddRow}
                    onAdded={(dept) => {
                      setDepartments((prev) => [dept, ...prev]);
                      setShowAddRow(false);
                    }}
                  />
                )}
                {activeTab === "Categories" && (
                  <CategoriesTable
                    categories={categories}
                    showAddRow={showAddRow}
                    onAdded={(cat) => {
                      setCategories((prev) => [cat, ...prev]);
                      setShowAddRow(false);
                    }}
                  />
                )}
                {activeTab === "Employee" && (
                  <EmployeeTable
                    employees={employees}
                    departments={departments}
                    onUpdated={(updatedUser) =>
                      setEmployees((prev) => prev.map((e) => (e._id === updatedUser._id ? updatedUser : e)))
                    }
                  />
                )}
              </>
            )}
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
        @keyframes rowIn { from { opacity: 0; transform: translateY(-4px); } to { opacity: 1; transform: translateY(0); } }
        .row-in { animation: rowIn .2s ease both; }
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

function TableShell({ head, rows, addRow, emptyLabel }) {
  const isEmpty = rows.length === 0 && !addRow;
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
        <tbody className="divide-y divide-[#232C36]">
          {addRow}
          {isEmpty ? (
            <tr>
              <td colSpan={head.length} className="px-4 py-6 text-center text-[#8C99A6]">
                {emptyLabel}
              </td>
            </tr>
          ) : (
            rows
          )}
        </tbody>
      </table>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Departments
// ---------------------------------------------------------------------------

function DepartmentsTable({ departments, employees, showAddRow, onAdded }) {
  return (
    <TableShell
      head={["Department", "Head", "Parent Dept", "Status"]}
      emptyLabel="No departments yet."
      addRow={showAddRow ? <AddDepartmentRow employees={employees} departments={departments} onAdded={onAdded} /> : null}
      rows={departments.map((d) => (
        <tr key={d._id} className="transition-colors hover:bg-[#10161D]">
          <td className="px-4 py-2.5 text-[#ECF1F5]">{d.name}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{d.head?.name || "--"}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{d.parentDepartment?.name || "--"}</td>
          <td className="px-4 py-2.5">
            <StatusBadge status={d.status} />
          </td>
        </tr>
      ))}
    />
  );
}

function AddDepartmentRow({ employees, departments, onAdded }) {
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [head, setHead] = useState("");
  const [parentDepartment, setParentDepartment] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState("");

  async function handleSave() {
    if (!name.trim() || !code.trim()) {
      setRowError("Name and code are required.");
      return;
    }
    setSaving(true);
    setRowError("");
    try {
      const res = await axios.post(
        `${BASE_URL}/api/departments`,
        { name: name.trim(), code: code.trim(), head: head || undefined, parentDepartment: parentDepartment || undefined },
        { withCredentials: true }
      );
      onAdded(res.data);
    } catch (err) {
      setRowError(err.response?.data?.message || "Failed to create department.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="row-in bg-[#10161D]/60">
      <td className="px-4 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Department name"
          className="w-full bg-[#0A0E13] border border-[#3A4551] rounded-md px-2.5 py-1.5 text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60"
        />
      </td>
      <td className="px-4 py-2">
        <select
          value={head}
          onChange={(e) => setHead(e.target.value)}
          className="w-full bg-[#0A0E13] border border-[#3A4551] rounded-md px-2.5 py-1.5 text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60"
        >
          <option value="">-- none --</option>
          {employees.map((e) => (
            <option key={e._id} value={e._id}>{e.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <select
          value={parentDepartment}
          onChange={(e) => setParentDepartment(e.target.value)}
          className="w-full bg-[#0A0E13] border border-[#3A4551] rounded-md px-2.5 py-1.5 text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60"
        >
          <option value="">-- none --</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2">
        <div className="flex items-center gap-2">
          <input
            value={code}
            onChange={(e) => setCode(e.target.value)}
            placeholder="Code"
            className="w-20 bg-[#0A0E13] border border-[#3A4551] rounded-md px-2.5 py-1.5 text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60 uppercase"
          />
          <RowSaveButton onClick={handleSave} saving={saving} />
        </div>
        {rowError && <p className="text-xs text-[#F0555F] mt-1">{rowError}</p>}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Categories
// ---------------------------------------------------------------------------

function CategoriesTable({ categories, showAddRow, onAdded }) {
  return (
    <TableShell
      head={["Category", "Description", "Custom fields"]}
      emptyLabel="No categories yet."
      addRow={showAddRow ? <AddCategoryRow onAdded={onAdded} /> : null}
      rows={categories.map((c) => (
        <tr key={c._id} className="transition-colors hover:bg-[#10161D]">
          <td className="px-4 py-2.5 text-[#ECF1F5]">{c.name}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">{c.description || "--"}</td>
          <td className="px-4 py-2.5 text-[#8C99A6]">
            {c.customFields?.length ? c.customFields.map((f) => f.label).join(", ") : "--"}
          </td>
        </tr>
      ))}
    />
  );
}

function AddCategoryRow({ onAdded }) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [saving, setSaving] = useState(false);
  const [rowError, setRowError] = useState("");

  async function handleSave() {
    if (!name.trim()) {
      setRowError("Category name is required.");
      return;
    }
    setSaving(true);
    setRowError("");
    try {
      const res = await axios.post(
        `${BASE_URL}/api/categories`,
        { name: name.trim(), description: description.trim() || undefined },
        { withCredentials: true }
      );
      onAdded(res.data);
    } catch (err) {
      setRowError(err.response?.data?.message || "Failed to create category.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <tr className="row-in bg-[#10161D]/60">
      <td className="px-4 py-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Category name"
          className="w-full bg-[#0A0E13] border border-[#3A4551] rounded-md px-2.5 py-1.5 text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60"
        />
      </td>
      <td className="px-4 py-2" colSpan={2}>
        <div className="flex items-center gap-2">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Description (optional)"
            className="flex-1 bg-[#0A0E13] border border-[#3A4551] rounded-md px-2.5 py-1.5 text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60"
          />
          <RowSaveButton onClick={handleSave} saving={saving} />
        </div>
        {rowError && <p className="text-xs text-[#F0555F] mt-1">{rowError}</p>}
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Employees
// ---------------------------------------------------------------------------

const roleOptions = ["employee", "departmentHead", "assetManager", "admin"];

function EmployeeTable({ employees, departments, onUpdated }) {
  return (
    <TableShell
      head={["Name", "Email", "Department", "Role", "Status"]}
      emptyLabel="No employees found."
      rows={employees.map((e) => (
        <EmployeeRow key={e._id} employee={e} departments={departments} onUpdated={onUpdated} />
      ))}
    />
  );
}

function EmployeeRow({ employee, departments, onUpdated }) {
  const [savingField, setSavingField] = useState(null); // "role" | "status" | "department" | null

  async function patchField(field, value) {
    setSavingField(field);
    try {
      const res = await axios.patch(
        `${BASE_URL}/api/users/${employee._id}/${field}`,
        { [field]: value },
        { withCredentials: true }
      );
      onUpdated(res.data);
    } catch (err) {
      console.error(`Failed to update ${field}:`, err.response?.data?.message || err.message);
    } finally {
      setSavingField(null);
    }
  }

  const roleLabel = (r) => r.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

  return (
    <tr className="transition-colors hover:bg-[#10161D]">
      <td className="px-4 py-2.5 text-[#ECF1F5]">{employee.name}</td>
      <td className="px-4 py-2.5 text-[#8C99A6]">{employee.email}</td>
      <td className="px-4 py-2.5">
        <select
          value={employee.department?._id || ""}
          disabled={savingField === "department"}
          onChange={(e) => patchField("department", e.target.value || null)}
          className="bg-transparent border border-transparent hover:border-[#3A4551] rounded-md px-1.5 py-1 text-sm text-[#8C99A6] outline-none focus:border-[#4C9FFE]/60 disabled:opacity-50"
        >
          <option value="">-- none --</option>
          {departments.map((d) => (
            <option key={d._id} value={d._id}>{d.name}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2.5">
        <select
          value={employee.role}
          disabled={savingField === "role"}
          onChange={(e) => patchField("role", e.target.value)}
          className="bg-transparent border border-transparent hover:border-[#3A4551] rounded-md px-1.5 py-1 text-sm text-[#8C99A6] outline-none focus:border-[#4C9FFE]/60 disabled:opacity-50"
        >
          {roleOptions.map((r) => (
            <option key={r} value={r}>{roleLabel(r)}</option>
          ))}
        </select>
      </td>
      <td className="px-4 py-2.5">
        <button
          onClick={() => patchField("status", employee.status === "Active" ? "Inactive" : "Active")}
          disabled={savingField === "status"}
          className="disabled:opacity-50"
        >
          <StatusBadge status={employee.status} />
        </button>
      </td>
    </tr>
  );
}

// ---------------------------------------------------------------------------
// Shared
// ---------------------------------------------------------------------------

function RowSaveButton({ onClick, saving }) {
  return (
    <button
      onClick={onClick}
      disabled={saving}
      className="shrink-0 flex items-center justify-center w-8 h-8 rounded-md border border-[#29D8AA]/60 text-[#29D8AA] hover:bg-[#29D8AA]/[0.08] transition-colors disabled:opacity-50"
    >
      {saving ? <Loader2 size={14} className="animate-spin" /> : <Check size={14} />}
    </button>
  );
}