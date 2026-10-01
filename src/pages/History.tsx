import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Clock, Play } from "lucide-react";
import { usePlayer, getThumbnail } from "../context/PlayerContext";
import type { QueueItem } from "../types";

export default function History() {
  const { user } = useAuth();
  const { playTrack } = usePlayer();
  const [items, setItems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    supabase
      .from("user_history")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(100)
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Clock className="mb-4 text-ink-400" size={48} />
        <h2 className="mb-2 text-lg font-bold text-ink-50">Sign in to see your history</h2>
        <p className="mb-4 text-sm text-ink-400">Your listening history is saved when you're signed in.</p>
        <Link to="/login" className="btn-primary">Sign in</Link>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
      </div>
    );
  }

  const queueItems: QueueItem[] = items.map((item) => ({
    videoId: item.video_id,
    title: item.title,
    artist: item.artist,
    thumbnail: item.thumbnail,
  })) as any;

  return (
    <div className="animate-fade-in px-4 pt-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-50 sm:text-3xl">Listening History</h1>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Clock className="mb-4 text-ink-400" size={48} />
          <p className="text-sm text-ink-400">No listening history yet. Play some music!</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => playTrack({ videoId: item.video_id, title: item.title, artist: item.artist, thumbnail: item.thumbnail } as any, queueItems)}
              className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-base-700"
            >
              <span className="w-6 text-center text-xs text-ink-400">{i + 1}</span>
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                {item.thumbnail && <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-50">{item.title}</p>
                <p className="truncate text-xs text-ink-400">{item.artist}</p>
              </div>
              <span className="shrink-0 text-xs text-ink-400">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
