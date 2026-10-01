import { Play, Heart } from "lucide-react";
import type { Song } from "../types";
import { usePlayer, getThumbnail, getTitle, getArtist } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { useState, useEffect } from "react";

export function SongCard({ song, queue }: { song: Song; queue?: Song[] }) {
  const { playTrack } = usePlayer();
  const { user } = useAuth();
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!user || !song.video_id) return;
    supabase
      .from("user_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", song.video_id)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [user, song.video_id]);

  const toggleLike = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!user || !song.video_id) return;
    if (liked) {
      await supabase.from("user_likes").delete().eq("user_id", user.id).eq("video_id", song.video_id);
      setLiked(false);
    } else {
      await supabase.from("user_likes").insert({
        user_id: user.id,
        song_id: song.id,
        video_id: song.video_id,
        title: song.title,
        artist: song.artist?.name ?? "",
        thumbnail: song.cover_url ?? "",
      });
      setLiked(true);
    }
  };

  return (
    <div
      onClick={() => playTrack(song, queue)}
      className="group card card-hover cursor-pointer p-3"
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-base-700">
        {song.cover_url ? (
          <img
            src={song.cover_url}
            alt={song.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : song.video_id ? (
          <img
            src={`https://i.ytimg.com/vi/${song.video_id}/mqdefault.jpg`}
            alt={song.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-400">
            <Play size={32} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-500 text-base-900">
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </div>
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-semibold text-ink-50">{song.title}</h3>
          <p className="truncate text-xs text-ink-400">{song.artist?.name ?? "Unknown artist"}</p>
        </div>
        {user && song.video_id && (
          <button
            onClick={toggleLike}
            className={`shrink-0 transition ${liked ? "text-mint-500" : "text-ink-400 hover:text-mint-400"}`}
          >
            <Heart size={14} fill={liked ? "currentColor" : "none"} />
          </button>
        )}
      </div>
    </div>
  );
}

export function SongRow({ song, index, queue }: { song: Song; index?: number; queue?: Song[] }) {
  const { playTrack, currentTrack, isPlaying } = usePlayer();
  const isActive = currentTrack && "id" in currentTrack && currentTrack.id === song.id;

  return (
    <div
      onClick={() => playTrack(song, queue)}
      className={`group flex cursor-pointer items-center gap-3 rounded-lg p-2 transition ${
        isActive ? "bg-mint-500/10" : "hover:bg-base-700"
      }`}
    >
      <div className="flex w-6 shrink-0 items-center justify-center">
        {isActive && isPlaying ? (
          <div className="flex items-end gap-0.5">
            <span className="h-3 w-0.5 animate-pulse rounded-full bg-mint-500" />
            <span className="h-4 w-0.5 animate-pulse rounded-full bg-mint-500" style={{ animationDelay: "0.2s" }} />
            <span className="h-2 w-0.5 animate-pulse rounded-full bg-mint-500" style={{ animationDelay: "0.4s" }} />
          </div>
        ) : (
          <span className="text-xs text-ink-400 group-hover:hidden">
            {index !== undefined ? index + 1 : ""}
          </span>
        )}
        <Play
          size={14}
          className={`absolute hidden text-mint-500 group-hover:block ${index !== undefined ? "" : ""}`}
        />
      </div>
      <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded">
        {song.cover_url ? (
          <img src={song.cover_url} alt="" className="h-full w-full object-cover" />
        ) : song.video_id ? (
          <img src={`https://i.ytimg.com/vi/${song.video_id}/default.jpg`} alt="" className="h-full w-full object-cover" />
        ) : null}
      </div>
      <div className="min-w-0 flex-1">
        <p className={`truncate text-sm font-medium ${isActive ? "text-mint-400" : "text-ink-50"}`}>
          {song.title}
        </p>
        <p className="truncate text-xs text-ink-400">{song.artist?.name ?? "Unknown"}</p>
      </div>
      <span className="shrink-0 text-xs text-ink-400">{song.duration ?? ""}</span>
    </div>
  );
}

export function SearchTrackCard({ track, queue }: { track: import("../types").SearchTrack; queue?: import("../types").SearchTrack[] }) {
  const { playTrack } = usePlayer();

  return (
    <div
      onClick={() => playTrack(track, queue)}
      className="group card card-hover cursor-pointer p-3"
    >
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-base-700">
        {track.thumbnail ? (
          <img
            src={track.thumbnail}
            alt={track.title}
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-400">
            <Play size={32} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-500 text-base-900">
            <Play size={20} fill="currentColor" className="ml-0.5" />
          </div>
        </div>
      </div>
      <h3 className="truncate text-sm font-semibold text-ink-50">{track.title}</h3>
      <p className="truncate text-xs text-ink-400">{track.artist}</p>
      <p className="mt-1 text-xs text-ink-400">{track.duration}</p>
    </div>
  );
}
