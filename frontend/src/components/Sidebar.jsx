import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";

// Single source of truth for sidebar nav + routing.
// Every page imports THIS instead of keeping its own copy.
const navItems = [
  { label: "Dashboard", path: "/dashboard" },
  { label: "Organization setup", path: "/organization-setup" },
  { label: "Assets", path: "/assets" },
  { label: "Allocation & Transfer", path: "/allocation-transfer" },
  { label: "Resource Booking", path: "/resource-booking" },
  { label: "Maintenance", path: "/maintenance" },
  { label: "Audit", path: "/audit" },
  { label: "Reports", path: "/reports" },
  { label: "Notifications", path: "/notifications" },
];

export default function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const [open, setOpen] = useState(false); // mobile drawer state

  function handleNavigate(path) {
    navigate(path);
    setOpen(false); // mobile pe navigate hote hi drawer close ho jaye
  }

  return (
    <>
      {/* Hamburger button — sirf mobile pe dikhega, fixed top-left */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="md:hidden fixed top-4 left-4 z-50 w-9 h-9 rounded-md border border-[#232C36] bg-[#0A0E13] flex items-center justify-center text-[#ECF1F5] hover:bg-[#171F27] transition-colors"
        aria-label="Toggle menu"
      >
        {open ? <X size={18} /> : <Menu size={18} />}
      </button>

      {/* Overlay — mobile pe drawer khula ho to background dim + click-to-close */}
      {open && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar itself: desktop pe static, mobile pe sliding drawer */}
      <aside
        className={`w-55 shrink-0 border-r border-[#232C36] p-6 bg-[#0A0E13]
          fixed md:static top-0 left-0 h-full z-40
          transition-transform duration-300 ease-in-out
          ${open ? "translate-x-0" : "-translate-x-full"} md:translate-x-0`}
      >
        <h2 className="text-[#ECF1F5] font-['Space_Grotesk'] font-bold text-lg mb-6 mt-10 md:mt-0">
          AssetFlow
        </h2>

        <nav className="space-y-1">
          {navItems.map((item) => {
            const isActive = item.path === location.pathname;
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
                className={`w-full text-left px-2.5 py-1.5 rounded-md text-[13px] transition-colors ${
                  isActive
                    ? "border border-[#29D8AA]/50 text-[#29D8AA] bg-[#29D8AA]/6"
                    : "text-[#8C99A6] hover:text-[#ECF1F5] hover:bg-[#10161D]"
                }`}
              >
                {item.label}
              </button>
            );
          })}
        </nav>
      </aside>
    </>
  );
}