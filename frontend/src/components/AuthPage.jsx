import { useState, useEffect } from "react";
import axios from "axios";
import { Mail, Lock, User, Eye, EyeOff, ArrowRight, Loader2, CircleCheck, Building2, ChevronDown, AlertCircle } from "lucide-react";
import { BASE_URL } from "../utils/constant";
import { useNavigate } from 'react-router-dom'


const lifecycle = [
  { label: "Available", color: "#29D8AA" },
  { label: "Allocated", color: "#4C9FFE" },
  { label: "Reserved", color: "#8B7CF6" },
  { label: "Maintenance", color: "#F0B429" },
  { label: "Retired", color: "#F0555F" },
];

const emptyForm = { name: "", email: "", department: "", password: "", confirm: "" };

export default function AuthPage({ onLogin, onSignup }) {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [departments, setDepartments] = useState([]);
  const [departmentsLoading, setDepartmentsLoading] = useState(true);
  const navigate = useNavigate();

  const isSignup = mode === "signup";

  // Departments are created by an Admin (Org Setup screen), so we fetch the real
  // list instead of hardcoding names — this endpoint is public since signup
  // happens before the user has a token/session.
  useEffect(() => {
    let cancelled = false;
    async function fetchDepartments() {
      try {
        const { data } = await axios.get(`${BASE_URL}/api/departments`);
        if (!cancelled) setDepartments(data.filter((d) => d.status === "Active"));
      } catch (err) {
        // Non-fatal — if this fails, the dropdown just stays empty and the user
        // can still sign up without picking a department.
        console.error("Failed to load departments:", err);
      } finally {
        if (!cancelled) setDepartmentsLoading(false);
      }
    }
    fetchDepartments();
    return () => { cancelled = true; };
  }, []);

  function updateField(key, value) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validate() {
    const errs = {};

    if (!form.email.trim()) {
      errs.email = "Enter your email.";
    } else if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      errs.email = "Enter a valid email.";
    }

    if (isSignup && !form.name.trim()) errs.name = "Enter your full name.";
    // Department is optional at signup (backend allows null) — admin can assign it later.

    if (!form.password) {
      errs.password = "Enter your password.";
    } else if (isSignup && form.password.length < 8) {
      errs.password = "Use at least 8 characters.";
    }

    if (isSignup && form.confirm !== form.password) errs.confirm = "Passwords don't match.";

    setErrors(errs);
    return Object.keys(errs).length === 0;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      if (isSignup) {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/signup`,
          {
            name: form.name,
            email: form.email,
            department: form.department || undefined, // backend expects a Department _id or nothing
            password: form.password,
          },
          { withCredentials: true }
        );
        await onSignup?.(data);
      } else {
        const { data } = await axios.post(
          `${BASE_URL}/api/auth/login`,
          { email: form.email, password: form.password },
          { withCredentials: true }
        );
        await onLogin?.(data);
      }
      navigate("/dashboard");
    } catch (err) {
      const message =
        err.response?.data?.message ||
        "Something went wrong. Please check your details and try again.";
      setServerError(message);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  function switchMode(next) {
    setMode(next);
    setErrors({});
    setServerError("");
  }

  return (
    <div className="min-h-screen flex bg-[#0A0E13] font-['Inter']">
      <style>{`
        @keyframes flowDash { to { stroke-dashoffset: -24; } }
        .flow-line { stroke-dasharray: 4 6; animation: flowDash 1.4s linear infinite; }
        @keyframes fadeUp { from { opacity: 0; transform: translateY(6px); } to { opacity: 1; transform: translateY(0); } }
        .fade-up { animation: fadeUp .35s ease both; }
      `}</style>

      <BrandPanel />

      <div className="flex-1 flex items-center justify-center px-5 py-10 sm:px-6 sm:py-12">
        <div className="w-full max-w-md fade-up">
          <div className="lg:hidden flex items-center gap-2 mb-10 justify-center">
            <LogoMark size="sm" />
            <span className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-base">AssetFlow</span>
          </div>

          <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-2xl">
            {isSignup ? "Create your account" : "Sign in"}
          </h2>
          <p className="text-[#8C99A6] text-sm mt-1.5">
            {isSignup
              ? "Takes a minute. An admin sets your role afterward."
              : "Enter your work email and password to continue."}
          </p>

          <div className="mt-6 grid grid-cols-2 p-1 rounded-lg bg-[#10161D] border border-[#232C36]">
            <button
              type="button"
              onClick={() => switchMode("login")}
              className={`py-2 text-sm rounded-md transition-colors ${!isSignup ? "bg-[#171F27] text-[#ECF1F5] font-medium" : "text-[#8C99A6] hover:text-[#ECF1F5]"
                }`}
            >
              Sign in
            </button>
            <button
              type="button"
              onClick={() => switchMode("signup")}
              className={`py-2 text-sm rounded-md transition-colors ${isSignup ? "bg-[#171F27] text-[#ECF1F5] font-medium" : "text-[#8C99A6] hover:text-[#ECF1F5]"
                }`}
            >
              Create account
            </button>
          </div>

          <form onSubmit={handleSubmit} noValidate className="mt-6 space-y-4">
            {serverError && (
              <div className="flex items-start gap-2.5 rounded-lg bg-[#F0555F]/8 border border-[#F0555F]/30 px-3 py-2.5">
                <AlertCircle size={16} className="text-[#F0555F] mt-0.5 shrink-0" />
                <p className="text-xs text-[#F0555F] leading-relaxed">{serverError}</p>
              </div>
            )}

            {isSignup && (
              <Field
                icon={<User size={16} />}
                label="Full name"
                placeholder="Priya Shah"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                error={errors.name}
              />
            )}

            <Field
              icon={<Mail size={16} />}
              label="Work email"
              type="email"
              placeholder="name@company.com"
              value={form.email}
              onChange={(e) => updateField("email", e.target.value)}
              error={errors.email}
            />

            {isSignup && (
              <SelectField
                icon={<Building2 size={16} />}
                label="Department (optional)"
                value={form.department}
                onChange={(e) => updateField("department", e.target.value)}
                error={errors.department}
                options={departments.map((d) => ({ value: d._id, label: d.name }))}
                placeholder={departmentsLoading ? "Loading departments..." : "Select your department"}
                disabled={departmentsLoading}
              />
            )}

            <Field
              icon={<Lock size={16} />}
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="••••••••"
              value={form.password}
              onChange={(e) => updateField("password", e.target.value)}
              error={errors.password}
              trailing={
                <button type="button" tabIndex={-1} onClick={() => setShowPassword((v) => !v)} className="text-[#8C99A6] hover:text-[#ECF1F5]">
                  {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              }
            />

            {isSignup && (
              <Field
                icon={<Lock size={16} />}
                label="Confirm password"
                type={showConfirm ? "text" : "password"}
                placeholder="••••••••"
                value={form.confirm}
                onChange={(e) => updateField("confirm", e.target.value)}
                error={errors.confirm}
                trailing={
                  <button type="button" tabIndex={-1} onClick={() => setShowConfirm((v) => !v)} className="text-[#8C99A6] hover:text-[#ECF1F5]">
                    {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                }
              />
            )}

            {!isSignup ? (
              <div className="flex items-center justify-between text-sm pt-1">
                <span />
                <button
                  type="button"
                  className="text-[#4C9FFE] hover:underline"
                  onClick={async () => {
                    if (!form.email.trim()) {
                      setErrors({ email: "Enter your email first." });
                      return;
                    }
                    try {
                      await axios.post(`${BASE_URL}/api/auth/forgot-password`, { email: form.email });
                      setServerError(""); // clear any prior error
                      alert("If that email exists, a reset link has been sent.");
                    } catch (err) {
                      setServerError("Couldn't send reset email right now. Try again shortly.");
                    }
                  }}
                >
                  Forgot password
                </button>
              </div>
            ) : (
              <div className="flex items-start gap-2.5 rounded-lg bg-[#29D8AA]/6 border border-[#29D8AA]/25 px-3 py-2.5">
                <CircleCheck size={16} className="text-[#29D8AA] mt-0.5 shrink-0" />
                <p className="text-xs text-[#9FE1CB] leading-relaxed">
                  This creates an <span className="font-medium">employee</span> account only — Department Head and Asset Manager roles are set later by an admin.
                </p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 h-11 rounded-lg bg-[#29D8AA] hover:bg-[#25c299] disabled:opacity-70 text-[#04342C] font-medium text-sm flex items-center justify-center gap-2 transition-colors"
            >
              {loading ? <Loader2 size={16} className="animate-spin" /> : <>{isSignup ? "Create account" : "Sign in"} <ArrowRight size={16} /></>}
            </button>
          </form>

          <p className="text-center text-sm text-[#8C99A6] mt-6">
            {isSignup ? (
              <>
                Already have an account?{" "}
                <button className="text-[#ECF1F5] font-medium hover:text-[#29D8AA]" onClick={() => switchMode("login")}>
                  Sign in
                </button>
              </>
            ) : (
              <>
                New here?{" "}
                <button className="text-[#ECF1F5] font-medium hover:text-[#29D8AA]" onClick={() => switchMode("signup")}>
                  Create an account
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}

function LogoMark({ size = "md" }) {
  const dims = size === "sm" ? "w-8 h-8 text-xs" : "w-9 h-9 text-sm";
  return (
    <div className={`${dims} rounded-md bg-[#29D8AA]/10 border border-[#29D8AA]/40 flex items-center justify-center`}>
      <span className="text-[#29D8AA] font-['Space_Grotesk'] font-semibold">AF</span>
    </div>
  );
}

function BrandPanel() {
  return (
    <div className="hidden lg:flex lg:w-[44%] relative flex-col justify-between p-12 border-r border-[#232C36] overflow-hidden">
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{
          backgroundImage: "linear-gradient(#ECF1F5 1px, transparent 1px), linear-gradient(90deg, #ECF1F5 1px, transparent 1px)",
          backgroundSize: "36px 36px",
        }}
      />

      <div className="relative flex items-center gap-3">
        <LogoMark />
        <span className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-lg tracking-tight">AssetFlow</span>
      </div>

      <div className="relative">
        <h1 className="text-[#ECF1F5] font-['Space_Grotesk'] font-semibold text-[34px] leading-[1.15] tracking-tight max-w-sm">
          Know where every asset is. Always.
        </h1>
        <p className="text-[#8C99A6] text-sm mt-4 max-w-xs leading-relaxed">
          One system of record for allocation, bookings, maintenance and audits — across every department.
        </p>

        <div className="mt-12">
          <p className="text-[10px] uppercase tracking-[0.14em] text-[#8C99A6] mb-4 font-['JetBrains_Mono']">Asset lifecycle</p>
          <div className="flex items-center">
            {lifecycle.map((node, i) => (
              <div key={node.label} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full" style={{ background: node.color, boxShadow: `0 0 0 3px ${node.color}22` }} />
                  <span className="text-[10px] text-[#8C99A6] whitespace-nowrap font-['JetBrains_Mono']">{node.label}</span>
                </div>
                {i < lifecycle.length - 1 && (
                  <svg width="26" height="2" className="mx-1 -mt-4">
                    <line x1="0" y1="1" x2="26" y2="1" stroke="#3A4551" strokeWidth="1.5" className="flow-line" />
                  </svg>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="relative flex gap-8 pt-8 border-t border-[#232C36]">
        {[["128", "assets tracked"], ["9", "active bookings"], ["3.4h", "avg. approval time"]].map(([value, label]) => (
          <div key={label}>
            <p className="text-[#ECF1F5] font-['JetBrains_Mono'] text-xl font-medium">{value}</p>
            <p className="text-[#8C99A6] text-xs mt-1">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

function Field({ icon, label, error, trailing, ...inputProps }) {
  return (
    <label className="block">
      <span className="text-xs text-[#8C99A6] mb-1.5 block">{label}</span>
      <div
        className={`flex items-center gap-2.5 h-11 px-3 rounded-lg bg-[#10161D] border transition-colors ${error ? "border-[#F0555F]/60" : "border-[#232C36] focus-within:border-[#29D8AA]/50"
          }`}
      >
        <span className="text-[#8C99A6]">{icon}</span>
        <input {...inputProps} className="flex-1 bg-transparent outline-none text-[#ECF1F5] text-sm placeholder:text-[#4A5460]" />
        {trailing}
      </div>
      {error && <span className="text-xs text-[#F0555F] mt-1 block">{error}</span>}
    </label>
  );
}

function SelectField({ icon, label, error, options, placeholder, disabled, ...selectProps }) {
  return (
    <label className="block">
      <span className="text-xs text-[#8C99A6] mb-1.5 block">{label}</span>
      <div
        className={`flex items-center gap-2.5 h-11 px-3 rounded-lg bg-[#10161D] border transition-colors ${error ? "border-[#F0555F]/60" : "border-[#232C36] focus-within:border-[#29D8AA]/50"
          } ${disabled ? "opacity-60" : ""}`}
      >
        <span className="text-[#8C99A6]">{icon}</span>
        <select
          {...selectProps}
          disabled={disabled}
          className={`flex-1 bg-transparent outline-none text-sm appearance-none ${selectProps.value ? "text-[#ECF1F5]" : "text-[#4A5460]"
            }`}
        >
          <option value="" className="bg-[#10161D] text-[#4A5460]">
            {placeholder}
          </option>
          {options.map((opt) => (
            <option key={opt.value} value={opt.value} className="bg-[#10161D] text-[#ECF1F5]">
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown size={16} className="text-[#8C99A6] shrink-0" />
      </div>
      {error && <span className="text-xs text-[#F0555F] mt-1 block">{error}</span>}
    </label>
  );
}

