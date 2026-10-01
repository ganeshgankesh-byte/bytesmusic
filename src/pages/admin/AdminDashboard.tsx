import { useEffect, useState } from "react";
import { supabase } from "../../lib/supabase";
import { Music, Mic as Mic2, Disc3, ListMusic, Users, TrendingUp, Eye, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    songs: 0,
    artists: 0,
    albums: 0,
    playlists: 0,
    users: 0,
    trending: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [songs, artists, albums, playlists, trending] = await Promise.all([
        supabase.from("songs").select("*"),
        supabase.from("artists").select("*"),
        supabase.from("albums").select("*"),
        supabase.from("playlists").select("*"),
        supabase.from("songs").select("*").eq("section", "trending"),
      ]);

      const { count } = await supabase.from("user_history").select("*", { count: "exact", head: true });

      setStats({
        songs: songs.data?.length ?? 0,
        artists: artists.data?.length ?? 0,
        albums: albums.data?.length ?? 0,
        playlists: playlists.data?.length ?? 0,
        users: 0,
        trending: trending.data?.length ?? 0,
      });
      setLoading(false);
    })();
  }, []);

  const cards = [
    { label: "Total Songs", value: stats.songs, icon: Music, link: "/admin/songs", color: "text-mint-500" },
    { label: "Artists", value: stats.artists, icon: Mic2, link: "/admin/artists", color: "text-mint-400" },
    { label: "Albums", value: stats.albums, icon: Disc3, link: "/admin/albums", color: "text-mint-300" },
    { label: "Playlists", value: stats.playlists, icon: ListMusic, link: "/admin/playlists", color: "text-mint-500" },
    { label: "Trending", value: stats.trending, icon: TrendingUp, link: "/admin/songs", color: "text-warning-500" },
    { label: "Plays", value: stats.users, icon: Eye, link: "/admin", color: "text-mint-600" },
  ];

  return (
    <div className="animate-fade-in p-6">
      <h1 className="mb-2 text-2xl font-bold text-ink-50">Dashboard</h1>
      <p className="mb-8 text-sm text-ink-400">Overview of your BytesMusic platform</p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
          {cards.map((card) => (
            <Link
              key={card.label}
              to={card.link}
              className="card card-hover group p-4"
            >
              <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-base-700">
                <card.icon className={card.color} size={20} />
              </div>
              <p className="text-2xl font-bold text-ink-50">{card.value}</p>
              <p className="text-xs text-ink-400">{card.label}</p>
            </Link>
          ))}
        </div>
      )}

      <div className="mt-8 grid gap-4 lg:grid-cols-2">
        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-ink-50">Quick Actions</h3>
          <div className="flex flex-wrap gap-2">
            <Link to="/admin/songs" className="btn-secondary text-xs">Manage Songs</Link>
            <Link to="/admin/artists" className="btn-secondary text-xs">Add Artist</Link>
            <Link to="/admin/homepage" className="btn-secondary text-xs">Edit Homepage</Link>
            <Link to="/admin/playlists" className="btn-secondary text-xs">Create Playlist</Link>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-3 text-sm font-bold text-ink-50">Platform Status</h3>
          <div className="space-y-2 text-sm">
            <div className="flex items-center justify-between">
              <span className="text-ink-400">Database</span>
              <span className="flex items-center gap-1.5 text-mint-500">
                <span className="h-2 w-2 rounded-full bg-mint-500" /> Connected
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-400">Admin Access</span>
              <span className="text-mint-500">technoproboizz@gmail.com</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-ink-400">Homepage Sections</span>
              <span className="text-ink-200">8 active</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
