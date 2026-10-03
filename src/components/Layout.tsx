import { Outlet, Link } from "react-router-dom";
import Sidebar from "./Sidebar";
import PlayerBar from "./PlayerBar";
import { useAuth } from "../context/AuthContext";
import { Music2, Menu, X, PanelLeftClose, PanelLeft, Shield, ChevronDown, LogOut } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export default function Layout() {
  const { user, isAdmin, signOut } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <div className="flex h-screen flex-col bg-base-900">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-base-600 bg-base-800/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          {/* Mobile: toggle slide-in sidebar */}
          <button
            className="rounded-lg p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400 lg:hidden"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
          {/* Desktop: toggle collapse sidebar */}
          <button
            className="hidden rounded-lg p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400 lg:block"
            onClick={() => setSidebarCollapsed((c) => !c)}
            title={sidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            {sidebarCollapsed ? <PanelLeft size={20} /> : <PanelLeftClose size={20} />}
          </button>
          <Link to="/" className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-mint-500/10">
              <Music2 className="text-mint-500" size={20} />
            </div>
            <span className="font-mono text-lg font-bold tracking-tight text-ink-50">
              Bytes<span className="text-mint-500">Music</span>
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-3">
          {user ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setProfileOpen((o) => !o)}
                className="flex items-center gap-2 rounded-full border border-base-500 bg-base-700 px-3 py-1.5 text-sm text-ink-200 transition hover:border-mint-700"
              >
                <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-500 text-xs font-bold text-base-900">
                  {user.email?.[0]?.toUpperCase()}
                </span>
                <span className="hidden max-w-[120px] truncate sm:inline">{user.email}</span>
                <ChevronDown size={14} className={`text-ink-400 transition ${profileOpen ? "rotate-180" : ""}`} />
              </button>

              {profileOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 w-56 overflow-hidden rounded-xl border border-base-600 bg-base-800 shadow-2xl animate-slide-up">
                  <div className="border-b border-base-600 px-4 py-3">
                    <p className="truncate text-xs text-ink-400">Signed in as</p>
                    <p className="truncate text-sm font-medium text-ink-100">{user.email}</p>
                  </div>
                  <div className="p-1.5">
                    {isAdmin && (
                      <Link
                        to="/admin"
                        onClick={() => setProfileOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-mint-400 transition hover:bg-mint-500/10"
                      >
                        <Shield size={16} />
                        Admin Panel
                      </Link>
                    )}
                    <Link
                      to="/history"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-base-700 hover:text-ink-100"
                    >
                      Listening History
                    </Link>
                    <Link
                      to="/likes"
                      onClick={() => setProfileOpen(false)}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-ink-300 transition hover:bg-base-700 hover:text-ink-100"
                    >
                      Liked Songs
                    </Link>
                    <div className="my-1.5 border-t border-base-600" />
                    <button
                      onClick={() => { setProfileOpen(false); signOut(); }}
                      className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-danger-500 transition hover:bg-danger-500/10"
                    >
                      <LogOut size={16} />
                      Sign out
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <Link to="/login" className="btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar
          mobileOpen={mobileNavOpen}
          onClose={() => setMobileNavOpen(false)}
          collapsed={sidebarCollapsed}
        />
        <main className="flex-1 overflow-y-auto pb-32">
          <Outlet />
        </main>
      </div>

      <PlayerBar />
    </div>
  );
}
