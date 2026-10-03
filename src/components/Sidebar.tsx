import { NavLink, Link } from "react-router-dom";
import { Chrome as Home, Search, Clock, Heart, Music2, X, LogOut } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/history", label: "History", icon: Clock },
  { to: "/likes", label: "Liked", icon: Heart },
];

export default function Sidebar({
  mobileOpen,
  onClose,
  collapsed,
}: {
  mobileOpen: boolean;
  onClose: () => void;
  collapsed: boolean;
}) {
  const { user, signOut } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] flex-col border-r border-base-600 bg-base-800 transition-all duration-300 lg:static lg:top-0 lg:h-auto lg:translate-x-0 ${
          collapsed ? "w-16" : "w-60"
        }`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-mono text-sm font-bold text-mint-500">Menu</span>
          <button onClick={onClose} className="text-ink-300 hover:text-mint-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-2 lg:p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center rounded-lg text-sm font-medium transition-all ${
                  collapsed ? "justify-center p-2.5 lg:justify-center" : "gap-3 px-3 py-2.5"
                } ${
                  isActive
                    ? "bg-mint-500/10 text-mint-400"
                    : "text-ink-300 hover:bg-base-700 hover:text-ink-100"
                }`
              }
            >
              <item.icon size={18} className="shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-base-600 p-2 lg:p-3">
          {user ? (
            <div className="space-y-2">
              {!collapsed && (
                <div className="truncate px-3 text-xs text-ink-400">{user.email}</div>
              )}
              <button
                onClick={signOut}
                title="Sign out"
                className={`flex w-full items-center rounded-lg text-sm font-medium text-ink-300 transition hover:bg-base-700 hover:text-danger-500 ${
                  collapsed ? "justify-center p-2.5" : "gap-3 px-3 py-2.5"
                }`}
              >
                <LogOut size={18} className="shrink-0" />
                {!collapsed && <span>Sign out</span>}
              </button>
            </div>
          ) : (
            <Link
              to="/login"
              onClick={onClose}
              className={`flex w-full items-center rounded-lg text-sm font-medium transition ${
                collapsed ? "justify-center p-2.5 text-mint-400 hover:bg-base-700" : "px-3 py-2.5 text-mint-400 hover:bg-base-700"
              }`}
            >
              {collapsed ? <Music2 size={18} /> : "Sign in"}
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
