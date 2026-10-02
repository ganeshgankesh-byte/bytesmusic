import { Play, Pause, SkipForward, SkipBack, Volume2, VolumeX, Shuffle, Repeat, Repeat1, List, X, Heart, Youtube, AlertCircle } from "lucide-react";
import { usePlayer, getThumbnail, getTitle, getArtist, isYouTubeSource } from "../context/PlayerContext";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import { isSong, isYouTubeResult } from "../types";
import { useState, useEffect } from "react";

export default function PlayerBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    isShuffled,
    repeatMode,
    playerReady,
    playbackError,
    togglePlay,
    next,
    prev,
    setVolume,
    toggleMute,
    toggleShuffle,
    cycleRepeat,
    queue,
    currentIndex,
    removeFromQueue,
    dismissError,
  } = usePlayer();
  const { user } = useAuth();
  const [showQueue, setShowQueue] = useState(false);
  const [liked, setLiked] = useState(false);

  useEffect(() => {
    if (!currentTrack || !user) {
      setLiked(false);
      return;
    }
    const vid = isSong(currentTrack) ? currentTrack.video_id : (currentTrack as any).videoId;
    if (!vid) return;
    supabase
      .from("user_likes")
      .select("id")
      .eq("user_id", user.id)
      .eq("video_id", vid)
      .maybeSingle()
      .then(({ data }) => setLiked(!!data));
  }, [currentTrack, user]);

  const toggleLike = async () => {
    if (!currentTrack || !user) return;
    const vid = isSong(currentTrack) ? currentTrack.video_id : (currentTrack as any).videoId;
    if (!vid) return;

    if (liked) {
      await supabase.from("user_likes").delete().eq("user_id", user.id).eq("video_id", vid);
      setLiked(false);
    } else {
      await supabase.from("user_likes").insert({
        user_id: user.id,
        video_id: vid,
        song_id: isSong(currentTrack) ? currentTrack.id : null,
        title: getTitle(currentTrack),
        artist: getArtist(currentTrack),
        thumbnail: getThumbnail(currentTrack),
      });
      setLiked(true);
    }
  };

  if (!currentTrack) {
    return (
      <footer className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center justify-center border-t border-base-600 bg-base-800/95 px-4 backdrop-blur-md">
        <p className="text-sm text-ink-400">Select a song to start playing</p>
      </footer>
    );
  }

  const thumb = getThumbnail(currentTrack);
  const title = getTitle(currentTrack);
  const artist = getArtist(currentTrack);
  const fromYouTube = currentTrack ? isYouTubeResult(currentTrack) : false;

  return (
    <>
      {playbackError && (
        <div className="fixed bottom-16 left-0 right-0 z-30 flex items-center gap-3 border-t border-danger-500/30 bg-danger-500/10 px-4 py-2 backdrop-blur-md">
          <AlertCircle className="shrink-0 text-danger-500" size={16} />
          <p className="flex-1 truncate text-xs text-danger-500">{playbackError}</p>
          <button
            onClick={next}
            className="shrink-0 rounded-lg bg-danger-500/20 px-2 py-1 text-xs font-medium text-danger-500 transition hover:bg-danger-500/30"
          >
            Skip
          </button>
          <button
            onClick={dismissError}
            className="shrink-0 text-danger-500 transition hover:text-danger-400"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {showQueue && (
        <div className="fixed bottom-16 right-4 z-30 w-80 max-w-[calc(100vw-2rem)] rounded-xl border border-base-600 bg-base-800 shadow-2xl animate-slide-up">
          <div className="flex items-center justify-between border-b border-base-600 p-3">
            <h3 className="text-sm font-bold text-ink-50">Up Next</h3>
            <button onClick={() => setShowQueue(false)} className="text-ink-400 hover:text-mint-400">
              <X size={16} />
            </button>
          </div>
          <div className="max-h-60 overflow-y-auto p-2">
            {queue.length === 0 ? (
              <p className="p-4 text-center text-xs text-ink-400">Queue is empty</p>
            ) : (
              queue.map((track, i) => (
                <div
                  key={i}
                  className={`group flex items-center gap-2 rounded-lg p-2 transition ${
                    i === currentIndex ? "bg-mint-500/10" : "hover:bg-base-700"
                  }`}
                >
                  <img
                    src={getThumbnail(track) || ""}
                    alt=""
                    className="h-10 w-10 rounded object-cover"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-xs font-medium text-ink-100">{getTitle(track)}</p>
                    <p className="truncate text-xs text-ink-400">{getArtist(track)}</p>
                  </div>
                  {i === currentIndex && (
                    <div className="flex items-center gap-0.5">
                      <span className="h-2 w-2 animate-pulse rounded-full bg-mint-500" />
                    </div>
                  )}
                  <button
                    onClick={() => removeFromQueue(i)}
                    className="text-ink-400 opacity-0 transition hover:text-danger-500 group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      <footer className="fixed bottom-0 left-0 right-0 z-20 flex h-16 items-center gap-4 border-t border-base-600 bg-base-800/95 px-4 backdrop-blur-md">
        {/* Track info */}
        <div className="flex min-w-0 flex-1 items-center gap-3">
          {thumb && (
            <img src={thumb} alt="" className="h-11 w-11 rounded-lg object-cover" />
          )}
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="truncate text-sm font-medium text-ink-50">{title}</p>
              {fromYouTube && (
                <span className="flex shrink-0 items-center gap-0.5 rounded bg-red-500/15 px-1 py-0.5 text-[9px] font-bold text-red-400">
                  <Youtube size={9} />
                  YT
                </span>
              )}
            </div>
            <p className="truncate text-xs text-ink-400">{artist}</p>
          </div>
          {user && (
            <button
              onClick={toggleLike}
              className={`ml-2 shrink-0 transition ${liked ? "text-mint-500" : "text-ink-400 hover:text-mint-400"}`}
            >
              <Heart size={16} fill={liked ? "currentColor" : "none"} />
            </button>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-2 sm:gap-3">
          <button
            onClick={toggleShuffle}
            className={`hidden rounded-lg p-2 transition sm:block ${
              isShuffled ? "text-mint-500" : "text-ink-400 hover:text-ink-100"
            }`}
          >
            <Shuffle size={16} />
          </button>
          <button onClick={prev} className="rounded-lg p-2 text-ink-200 transition hover:text-mint-400">
            <SkipBack size={18} />
          </button>
          <button
            onClick={togglePlay}
            disabled={!playerReady}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-mint-500 text-base-900 transition hover:bg-mint-400 active:scale-95 disabled:opacity-50"
          >
            {isPlaying ? <Pause size={18} fill="currentColor" /> : <Play size={18} fill="currentColor" className="ml-0.5" />}
          </button>
          <button onClick={next} className="rounded-lg p-2 text-ink-200 transition hover:text-mint-400">
            <SkipForward size={18} />
          </button>
          <button
            onClick={cycleRepeat}
            className={`hidden rounded-lg p-2 transition sm:block ${
              repeatMode !== "off" ? "text-mint-500" : "text-ink-400 hover:text-ink-100"
            }`}
          >
            {repeatMode === "one" ? <Repeat1 size={16} /> : <Repeat size={16} />}
          </button>
        </div>

        {/* Volume + queue */}
        <div className="flex flex-1 items-center justify-end gap-2">
          <button
            onClick={() => setShowQueue((s) => !s)}
            className={`rounded-lg p-2 transition ${showQueue ? "text-mint-500" : "text-ink-400 hover:text-ink-100"}`}
          >
            <List size={18} />
          </button>
          <div className="hidden items-center gap-2 md:flex">
            <button onClick={toggleMute} className="text-ink-400 transition hover:text-mint-400">
              {isMuted || volume === 0 ? <VolumeX size={18} /> : <Volume2 size={18} />}
            </button>
            <input
              type="range"
              min={0}
              max={100}
              value={isMuted ? 0 : volume}
              onChange={(e) => setVolume(Number(e.target.value))}
              className="h-1 w-24 cursor-pointer appearance-none rounded-full bg-base-500 accent-mint-500"
            />
          </div>
        </div>
      </footer>
    </>
  );
}
