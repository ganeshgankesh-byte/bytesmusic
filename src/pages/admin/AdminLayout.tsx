import { Outlet, NavLink, Link, useNavigate } from "react-router-dom";
import { Music2, LayoutDashboard, Music, Mic as Mic2, Disc3, ListMusic, Users, Chrome as Home, LogOut } from "lucide-react";
import { useAuth } from "../../context/AuthContext";

const adminNav = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/songs", label: "Songs", icon: Music, end: false },
  { to: "/admin/artists", label: "Artists", icon: Mic2, end: false },
  { to: "/admin/albums", label: "Albums", icon: Disc3, end: false },
  { to: "/admin/playlists", label: "Playlists", icon: ListMusic, end: false },
  { to: "/admin/users", label: "Users", icon: Users, end: false },
  { to: "/admin/homepage", label: "Homepage", icon: Home, end: false },
];

export default function AdminLayout() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate("/login");
  };

  return (
    <div className="flex h-screen flex-col bg-base-900">
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-base-600 bg-base-800 px-4">
        <Link to="/admin" className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/10">
            <Music2 className="text-mint-500" size={20} />
          </div>
          <span className="font-mono text-lg font-bold tracking-tight text-ink-50">
            Bytes<span className="text-mint-500">Music</span>
            <span className="ml-2 text-xs font-normal text-ink-400">Admin</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link to="/" className="btn-ghost text-xs">View site →</Link>
          <div className="flex items-center gap-2 rounded-full border border-base-500 bg-base-700 px-3 py-1.5">
            <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-500 text-xs font-bold text-base-900">
              {user?.email?.[0]?.toUpperCase()}
            </span>
            <span className="hidden max-w-[140px] truncate text-xs text-ink-200 sm:inline">{user?.email}</span>
          </div>
          <button onClick={handleSignOut} className="btn-ghost text-xs">
            <LogOut size={14} /> Sign out
          </button>
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <aside className="hidden w-56 shrink-0 border-r border-base-600 bg-base-800 md:block">
          <nav className="flex flex-col gap-1 p-3">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition ${
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
        </aside>

        {/* Mobile nav */}
        <div className="absolute left-0 top-14 z-30 w-full border-b border-base-600 bg-base-800 md:hidden">
          <div className="flex gap-1 overflow-x-auto p-2 scrollbar-hide">
            {adminNav.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  `flex shrink-0 items-center gap-2 rounded-lg px-3 py-2 text-xs font-medium transition ${
                    isActive
                      ? "bg-mint-500/10 text-mint-400"
                      : "text-ink-300 hover:bg-base-700"
                  }`
                }
              >
                <item.icon size={14} />
                {item.label}
              </NavLink>
            ))}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto pt-14 md:pt-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
