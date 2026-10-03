import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import PlayerBar from "./PlayerBar";
import { useAuth } from "../context/AuthContext";
import { Link } from "react-router-dom";
import { Music2, Menu, X } from "lucide-react";
import { useState } from "react";

export default function Layout() {
  const { user } = useAuth();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className="flex h-screen flex-col bg-base-900">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-base-600 bg-base-800/80 px-4 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <button
            className="rounded-lg p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400 lg:hidden"
            onClick={() => setMobileNavOpen((o) => !o)}
          >
            {mobileNavOpen ? <X size={20} /> : <Menu size={20} />}
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
            <Link to="/history" className="flex items-center gap-2 rounded-full border border-base-500 bg-base-700 px-3 py-1.5 text-sm text-ink-200 transition hover:border-mint-700">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-mint-500 text-xs font-bold text-base-900">
                {user.email?.[0]?.toUpperCase()}
              </span>
              <span className="hidden max-w-[120px] truncate sm:inline">{user.email}</span>
            </Link>
          ) : (
            <Link to="/login" className="btn-primary">
              Sign in
            </Link>
          )}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar mobileOpen={mobileNavOpen} onClose={() => setMobileNavOpen(false)} />
        <main className="flex-1 overflow-y-auto pb-32">
          <Outlet />
        </main>
      </div>

      <PlayerBar />
    </div>
  );
}
