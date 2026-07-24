import { useEffect, useState } from "react";
import { NavLink, Link, Outlet, useLocation } from "react-router-dom";
import {
  BarChart3,
  ExternalLink,
  LayoutDashboard,
  Library,
  LogOut,
  Menu,
  Settings as SettingsIcon,
  Tag,
  UploadCloud,
  X,
} from "lucide-react";
import ThemeSelector from "../components/ThemeSelector";
import { useAuth } from "./AuthContext";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/media", label: "Media", icon: Library },
  { to: "/admin/upload", label: "Upload", icon: UploadCloud },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
  { to: "/admin/tags", label: "Tags", icon: Tag },
  { to: "/admin/settings", label: "Settings", icon: SettingsIcon },
];

function AdminLogo() {
  return (
    <Link to="/admin" className="flex items-center space-x-2">
      <svg
        className="w-8 h-8"
        viewBox="0 0 32 32"
        fill="none"
        style={{ color: "var(--accent-primary)" }}
      >
        <circle cx="16" cy="16" r="10" fill="currentColor" opacity="0.15" />
        <path d="M13 11L21 16L13 21V11Z" fill="currentColor" />
        <path
          d="M16 2C8.3 2 2 8.3 2 16"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
        <path
          d="M30 16c0 7.7-6.3 14-14 14"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          opacity="0.4"
        />
      </svg>
      <span className="logo-text text-base theme-text-primary">
        On<span className="middle-dot"> · </span>Play
      </span>
      <span
        className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded"
        style={{
          background: "var(--btn-orange-bg)",
          color: "var(--btn-orange-text)",
        }}
      >
        Admin
      </span>
    </Link>
  );
}

function SidebarNav({ onNavigate }: { onNavigate?: () => void }) {
  const { logout } = useAuth();

  return (
    <div className="flex flex-col h-full">
      <nav className="flex-1 px-3 py-4 space-y-1">
        {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            className={({ isActive }) =>
              `flex items-center space-x-3 px-3 py-2.5 rounded-lg transition-colors min-h-[44px] ${
                isActive
                  ? "bg-white/10 theme-text-primary border-l-2"
                  : "theme-nav-link hover:bg-white/5"
              }`
            }
            style={({ isActive }) =>
              isActive
                ? { borderLeftColor: "var(--accent-primary)" }
                : undefined
            }
          >
            <Icon className="w-5 h-5" />
            <span className="text-sm font-medium">{label}</span>
          </NavLink>
        ))}
      </nav>

      <div
        className="px-3 py-4 space-y-2 border-t"
        style={{ borderColor: "var(--card-border)" }}
      >
        <ThemeSelector />
        <Link
          to="/"
          onClick={onNavigate}
          className="flex items-center space-x-3 px-3 py-2.5 rounded-lg theme-nav-link hover:bg-white/5 transition-colors min-h-[44px]"
        >
          <ExternalLink className="w-5 h-5" />
          <span className="text-sm font-medium">View site</span>
        </Link>
        <button
          onClick={() => {
            onNavigate?.();
            logout();
          }}
          className="w-full flex items-center space-x-3 px-3 py-2.5 rounded-lg theme-nav-link hover:bg-white/5 transition-colors min-h-[44px]"
        >
          <LogOut className="w-5 h-5" />
          <span className="text-sm font-medium">Log out</span>
        </button>
      </div>
    </div>
  );
}

export default function AdminLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    setDrawerOpen(false);
  }, [location.pathname]);

  const pageTitle =
    NAV_ITEMS.find(({ to, end }) =>
      end
        ? location.pathname === to
        : location.pathname.startsWith(to) && to !== "/admin",
    )?.label ??
    (location.pathname.startsWith("/admin/analytics")
      ? "Analytics"
      : "Dashboard");

  return (
    <div
      className="min-h-dvh theme-bg"
      style={{
        paddingBottom: "calc(var(--mini-player-height, 0px) + 1rem)",
      }}
    >
      {/* Desktop sidebar */}
      <aside
        className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 theme-nav border-r z-40"
        style={{ borderColor: "var(--card-border)" }}
      >
        <div
          className="px-4 py-4 border-b"
          style={{ borderColor: "var(--card-border)" }}
        >
          <AdminLogo />
        </div>
        <SidebarNav />
      </aside>

      {/* Mobile top bar */}
      <header
        className="md:hidden theme-nav sticky top-0 z-50 border-b"
        style={{
          paddingTop: "env(safe-area-inset-top)",
          borderColor: "var(--card-border)",
        }}
      >
        <div className="flex items-center justify-between px-3 h-14">
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-2 rounded-lg theme-btn-secondary min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5 theme-text-primary" />
          </button>
          <span className="theme-text-primary font-semibold">{pageTitle}</span>
          <div className="w-[44px]" />
        </div>
      </header>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="md:hidden fixed inset-0 z-[150]">
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => setDrawerOpen(false)}
          />
          <div
            className="absolute inset-y-0 left-0 w-72 max-w-[85vw] theme-nav flex flex-col"
            style={{ paddingTop: "env(safe-area-inset-top)" }}
          >
            <div
              className="flex items-center justify-between px-4 py-4 border-b"
              style={{ borderColor: "var(--card-border)" }}
            >
              <AdminLogo />
              <button
                onClick={() => setDrawerOpen(false)}
                className="p-2 rounded-lg theme-btn-secondary min-w-[44px] min-h-[44px] flex items-center justify-center"
                aria-label="Close menu"
              >
                <X className="w-5 h-5 theme-text-primary" />
              </button>
            </div>
            <SidebarNav onNavigate={() => setDrawerOpen(false)} />
          </div>
        </div>
      )}

      {/* Main content */}
      <main className="md:pl-60">
        <div className="container mx-auto px-4 sm:px-6 py-6 max-w-6xl">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
