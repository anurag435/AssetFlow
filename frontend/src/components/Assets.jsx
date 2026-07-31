import { useState, useRef, useEffect, useCallback } from "react";
import { ChevronDown, Search, Plus, Loader2, X } from "lucide-react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "../utils/constant";
import Sidebar from "../components/Sidebar";

const statusColors = {
  Available: "#29D8AA",
  Allocated: "#4C9FFE",
  Reserved: "#8B7CF6",
  "Under Maintenance": "#F0B429",
  Lost: "#F0555F",
  Retired: "#8C99A6",
  Disposed: "#8C99A6",
};

const statusOptions = ["Available", "Allocated", "Reserved", "Under Maintenance", "Lost", "Retired", "Disposed"];
const conditionOptions = ["New", "Good", "Fair", "Poor", "Damaged"];

export default function AssetsPage() {
  const navigate = useNavigate();

  const [user, setUser] = useState(null);
  const [assets, setAssets] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);

  const [query, setQuery] = useState("");
  const [category, setCategory] = useState(null);
  const [status, setStatus] = useState(null);
  const [department, setDepartment] = useState(null);

  const [loading, setLoading] = useState(true);
  const [tableLoading, setTableLoading] = useState(false);
  const [error, setError] = useState("");
  const [formOpen, setFormOpen] = useState(false);

  // Initial load: user + reference data + first asset page
  useEffect(() => {
    let cancelled = false;

    async function loadInitial() {
      setLoading(true);
      setError("");
      try {
        const [meRes, catRes, deptRes, assetsRes] = await Promise.all([
          axios.get(`${BASE_URL}/api/auth/me`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/categories`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/departments`, { withCredentials: true }),
          axios.get(`${BASE_URL}/api/assets`, { withCredentials: true }),
        ]);

        if (cancelled) return;
        setUser(meRes.data.user);
        setCategories(catRes.data);
        setDepartments(deptRes.data);
        setAssets(assetsRes.data.assets);
      } catch (err) {
        if (cancelled) return;
        if (err.response?.status === 401) {
          navigate("/");
          return;
        }
        setError("Couldn't load assets. Refresh to try again.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    loadInitial();
    return () => { cancelled = true; };
  }, [navigate]);

  // Re-fetch from the server whenever a filter changes (backend does the filtering)
  const fetchFiltered = useCallback(async () => {
    setTableLoading(true);
    try {
      const params = {};
      if (query.trim()) params.q = query.trim();
      if (category) params.category = category;
      if (status) params.status = status;
      if (department) params.department = department;

      const res = await axios.get(`${BASE_URL}/api/assets`, { params, withCredentials: true });
      setAssets(res.data.assets);
    } catch (err) {
      if (err.response?.status === 401) {
        navigate("/");
        return;
      }
      setError("Couldn't apply filters. Try again.");
    } finally {
      setTableLoading(false);
    }
  }, [query, category, status, department, navigate]);

  // Debounce the search box; filter dropdowns re-fetch immediately
  useEffect(() => {
    if (loading) return; // skip firing during initial load
    const timeout = setTimeout(fetchFiltered, 350);
    return () => clearTimeout(timeout);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  useEffect(() => {
    if (loading) return;
    fetchFiltered();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [category, status, department]);

  return (
    <div className="min-h-screen bg-[#060a10] font-['Inter'] flex items-center justify-center p-0 sm:p-6">
      <div className="w-full sm:rounded-2xl border-0 sm:border border-[#232C36] bg-[#0A0E13] overflow-hidden flex fade-in">
        <Sidebar />

        <div className="flex-1 min-w-0 p-4 pt-20 sm:p-8 sm:pt-20 md:pt-8">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-lg sm:text-xl">Assets</h1>
            <ProfileMenu userName={user?.name || "..."} role={user?.role} />
          </div>

          {error && (
            <div className="mt-4 rounded-lg border border-[#F0555F]/50 bg-[#F0555F]/6 px-4 py-2.5">
              <span className="text-sm text-[#F0555F]">{error}</span>
            </div>
          )}

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 mt-5 fade-up" style={{ animationDelay: "40ms" }}>
            <div className="flex-1 flex items-center gap-2.5 h-10 px-3.5 rounded-lg bg-[#10161D] border border-[#232C36] focus-within:border-[#29D8AA]/50 transition-colors">
              <Search size={15} className="text-[#8C99A6] shrink-0" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by tag, name, or serial number.."
                className="flex-1 bg-transparent outline-none text-[#ECF1F5] text-sm placeholder:text-[#4A5460]"
              />
              {tableLoading && <Loader2 size={14} className="animate-spin text-[#8C99A6] shrink-0" />}
            </div>
            <button
              onClick={() => setFormOpen((v) => !v)}
              className="flex items-center gap-1.5 h-10 px-4 rounded-lg text-sm border border-[#29D8AA]/60 text-[#29D8AA] transition-all active:scale-[0.97] hover:bg-[#29D8AA]/[0.08] shrink-0"
            >
              {formOpen ? <X size={14} /> : <Plus size={14} />}
              {formOpen ? "Cancel" : "Register Asset"}
            </button>
          </div>

          <div className="flex items-center gap-2.5 mt-3 fade-up flex-wrap" style={{ animationDelay: "80ms" }}>
            <FilterDropdown
              label="Category"
              value={category}
              displayValue={categories.find((c) => c._id === category)?.name}
              onChange={setCategory}
              options={categories.map((c) => ({ value: c._id, label: c.name }))}
            />
            <FilterDropdown
              label="Status"
              value={status}
              displayValue={status}
              onChange={setStatus}
              options={statusOptions.map((s) => ({ value: s, label: s }))}
            />
            <FilterDropdown
              label="Department"
              value={department}
              displayValue={departments.find((d) => d._id === department)?.name}
              onChange={setDepartment}
              options={departments.map((d) => ({ value: d._id, label: d.name }))}
            />
          </div>

          {formOpen && (
            <RegisterAssetForm
              categories={categories}
              departments={departments}
              onCreated={(asset) => {
                setAssets((prev) => [asset, ...prev]);
                setFormOpen(false);
              }}
              onCancel={() => setFormOpen(false)}
            />
          )}

          <div className="mt-4 rounded-lg border border-[#232C36] overflow-hidden fade-up" style={{ animationDelay: "120ms" }}>
            <div className="overflow-x-auto">
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
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-10 text-center">
                      <span className="inline-flex items-center gap-2 text-sm text-[#8C99A6]">
                        <Loader2 size={16} className="animate-spin" /> Loading assets...
                      </span>
                    </td>
                  </tr>
                ) : assets.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-sm text-[#8C99A6]">
                      No assets match this search.
                    </td>
                  </tr>
                ) : (
                  assets.map((a) => (
                    <tr key={a._id} className="transition-colors hover:bg-[#10161D] cursor-default">
                      <td className="px-4 py-2.5 text-[#ECF1F5] font-['JetBrains_Mono'] text-xs">{a.assetTag}</td>
                      <td className="px-4 py-2.5 text-[#ECF1F5]">{a.name}</td>
                      <td className="px-4 py-2.5 text-[#8C99A6]">{a.category?.name || "--"}</td>
                      <td className="px-4 py-2.5">
                        <StatusBadge status={a.status} />
                      </td>
                      <td className="px-4 py-2.5 text-[#8C99A6]">{a.location || "--"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            </div>
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
        @keyframes panelIn { from { opacity: 0; transform: translateY(-6px); } to { opacity: 1; transform: translateY(0); } }
        .panel-in { animation: panelIn .2s ease both; }
      `}</style>
    </div>
  );
}

function RegisterAssetForm({ categories, departments, onCreated, onCancel }) {
  const [form, setForm] = useState({
    name: "",
    category: "",
    serialNumber: "",
    acquisitionDate: "",
    acquisitionCost: "",
    condition: "Good",
    location: "",
    department: "",
    isBookable: false,
  });
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  function update(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name.trim() || !form.category) {
      setFormError("Name and category are required.");
      return;
    }
    setSaving(true);
    setFormError("");
    try {
      const res = await axios.post(
        `${BASE_URL}/api/assets`,
        {
          name: form.name.trim(),
          category: form.category,
          serialNumber: form.serialNumber.trim() || undefined,
          acquisitionDate: form.acquisitionDate || undefined,
          acquisitionCost: form.acquisitionCost ? Number(form.acquisitionCost) : undefined,
          condition: form.condition,
          location: form.location.trim() || undefined,
          department: form.department || undefined,
          isBookable: form.isBookable,
        },
        { withCredentials: true }
      );
      onCreated(res.data);
    } catch (err) {
      setFormError(err.response?.data?.message || "Failed to register asset.");
    } finally {
      setSaving(false);
    }
  }

  const inputClass =
    "w-full h-9 px-3 rounded-md bg-[#0A0E13] border border-[#3A4551] text-sm text-[#ECF1F5] outline-none focus:border-[#4C9FFE]/60 placeholder:text-[#4A5460]";

  return (
    <form
      onSubmit={handleSubmit}
      className="panel-in mt-3 rounded-lg border border-[#232C36] bg-[#10161D] p-5"
    >
      <p className="text-sm font-medium text-[#ECF1F5] mb-3">Register new asset</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <Field label="Name *">
          <input className={inputClass} value={form.name} onChange={(e) => update("name", e.target.value)} placeholder="e.g. Dell Laptop" />
        </Field>
        <Field label="Category *">
          <select className={inputClass} value={form.category} onChange={(e) => update("category", e.target.value)}>
            <option value="">-- select --</option>
            {categories.map((c) => (
              <option key={c._id} value={c._id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Serial number">
          <input className={inputClass} value={form.serialNumber} onChange={(e) => update("serialNumber", e.target.value)} placeholder="Optional" />
        </Field>

        <Field label="Acquisition date">
          <input type="date" className={inputClass} value={form.acquisitionDate} onChange={(e) => update("acquisitionDate", e.target.value)} />
        </Field>
        <Field label="Acquisition cost">
          <input type="number" min="0" className={inputClass} value={form.acquisitionCost} onChange={(e) => update("acquisitionCost", e.target.value)} placeholder="0" />
        </Field>
        <Field label="Condition">
          <select className={inputClass} value={form.condition} onChange={(e) => update("condition", e.target.value)}>
            {conditionOptions.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </Field>

        <Field label="Location">
          <input className={inputClass} value={form.location} onChange={(e) => update("location", e.target.value)} placeholder="e.g. Bengaluru HQ" />
        </Field>
        <Field label="Department">
          <select className={inputClass} value={form.department} onChange={(e) => update("department", e.target.value)}>
            <option value="">-- none --</option>
            {departments.map((d) => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Bookable resource">
          <label className="flex items-center gap-2 h-9">
            <input
              type="checkbox"
              checked={form.isBookable}
              onChange={(e) => update("isBookable", e.target.checked)}
              className="w-4 h-4 accent-[#29D8AA]"
            />
            <span className="text-sm text-[#8C99A6]">Yes, allow time-slot booking</span>
          </label>
        </Field>
      </div>

      {formError && <p className="text-xs text-[#F0555F] mt-3">{formError}</p>}

      <div className="flex items-center gap-2 mt-4">
        <button
          type="submit"
          disabled={saving}
          className="h-9 px-4 rounded-md bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-50 text-[#04342C] text-sm font-medium transition-colors active:scale-[0.97] flex items-center gap-2"
        >
          {saving && <Loader2 size={13} className="animate-spin" />}
          Register asset
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="h-9 px-4 rounded-md border border-[#3A4551] text-[#8C99A6] text-sm hover:bg-[#171F27] transition-colors"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

function Field({ label, children }) {
  return (
    <label className="block">
      <span className="text-xs text-[#8C99A6] mb-1.5 block">{label}</span>
      {children}
    </label>
  );
}

function ProfileMenu({ userName, role }) {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);
  const menuRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(e) {
      if (menuRef.current && !menuRef.current.contains(e.target)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  async function handleLogout() {
    setOpen(false);
    try {
      await axios.post(`${BASE_URL}/api/auth/logout`, {}, { withCredentials: true });
    } catch (err) {
      console.error("Logout request failed:", err);
    } finally {
      navigate("/");
    }
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
            Log out
          </button>
        </div>
      )}
    </div>
  );
}

function FilterDropdown({ label, value, displayValue, onChange, options }) {
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
        {displayValue || label}
        <ChevronDown size={13} className={`transition-transform ${open ? "rotate-180" : ""}`} />
      </button>

      {open && (
        <div className="menu-in absolute left-0 mt-2 w-44 max-h-64 overflow-y-auto rounded-lg border border-[#232C36] bg-[#10161D] shadow-lg shadow-black/40 z-10">
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
              key={opt.value}
              onClick={() => {
                onChange(opt.value);
                setOpen(false);
              }}
              className={`w-full text-left px-3.5 py-2 text-sm transition-colors hover:bg-[#171F27] ${
                opt.value === value ? "text-[#29D8AA]" : "text-[#ECF1F5]"
              }`}
            >
              {opt.label}
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