import { NavLink, Link } from "react-router-dom";
import { Chrome as Home, Search, Clock, Heart, Music2, X } from "lucide-react";
import { useAuth } from "../context/AuthContext";

const navItems = [
  { to: "/", label: "Home", icon: Home },
  { to: "/search", label: "Search", icon: Search },
  { to: "/history", label: "History", icon: Clock },
  { to: "/likes", label: "Liked", icon: Heart },
];

export default function Sidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const { user, signOut } = useAuth();

  return (
    <>
      {mobileOpen && (
        <div className="fixed inset-0 z-30 bg-black/60 lg:hidden" onClick={onClose} />
      )}
      <aside
        className={`${
          mobileOpen ? "translate-x-0" : "-translate-x-full"
        } fixed left-0 top-14 z-40 flex h-[calc(100vh-3.5rem)] w-60 flex-col border-r border-base-600 bg-base-800 transition-transform lg:static lg:top-0 lg:h-auto lg:translate-x-0`}
      >
        <div className="flex items-center justify-between p-4 lg:hidden">
          <span className="font-mono text-sm font-bold text-mint-500">Menu</span>
          <button onClick={onClose} className="text-ink-300 hover:text-mint-400">
            <X size={18} />
          </button>
        </div>

        <nav className="flex flex-col gap-1 p-3">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === "/"}
              onClick={() => onClose()}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  isActive
                    ? "bg-mint-500/10 text-mint-400"
                    : "text-ink-300 hover:bg-base-700 hover:text-ink-100"
                }`
              }
            >
              <item.icon size={18} />
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="mt-auto border-t border-base-600 p-3">
          {user ? (
            <div className="space-y-2">
              <div className="truncate px-3 text-xs text-ink-400">{user.email}</div>
              <button
                onClick={signOut}
                className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-base-700 hover:text-danger-500"
              >
                Sign out
              </button>
            </div>
          ) : (
            <Link to="/login" onClick={onClose} className="btn-secondary w-full">
              Sign in
            </Link>
          )}
        </div>
      </aside>
    </>
  );
}
