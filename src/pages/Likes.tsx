import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import { useAuth } from "../context/AuthContext";
import { Heart, Play } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";
import type { QueueItem } from "../types";

export default function Likes() {
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
      .from("user_likes")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        setItems(data ?? []);
        setLoading(false);
      });
  }, [user]);

  if (!user) {
    return (
      <div className="flex h-full flex-col items-center justify-center px-4 text-center">
        <Heart className="mb-4 text-ink-400" size={48} />
        <h2 className="mb-2 text-lg font-bold text-ink-50">Sign in to see your liked songs</h2>
        <p className="mb-4 text-sm text-ink-400">Like songs while listening to build your collection.</p>
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
      <div className="mb-6 flex items-center gap-3">
        <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-mint-500/10">
          <Heart className="text-mint-500" size={28} fill="currentColor" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-ink-50 sm:text-3xl">Liked Songs</h1>
          <p className="text-sm text-ink-400">{items.length} songs</p>
        </div>
      </div>

      {items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <Heart className="mb-4 text-ink-400" size={48} />
          <p className="text-sm text-ink-400">No liked songs yet. Tap the heart icon while playing to like a song.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {items.map((item, i) => (
            <div
              key={item.id}
              onClick={() => playTrack({ videoId: item.video_id, title: item.title, artist: item.artist, thumbnail: item.thumbnail } as any, queueItems)}
              className="group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition hover:bg-base-700"
            >
              <span className="w-6 text-center text-xs text-ink-400 group-hover:hidden">{i + 1}</span>
              <Play size={14} className="absolute hidden text-mint-500 group-hover:block" />
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
                {item.thumbnail && <img src={item.thumbnail} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-50">{item.title}</p>
                <p className="truncate text-xs text-ink-400">{item.artist}</p>
              </div>
              <Heart size={14} className="shrink-0 text-mint-500" fill="currentColor" />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
