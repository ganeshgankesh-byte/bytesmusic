import { createContext, useContext, useRef, useState, useCallback, useEffect, type ReactNode } from "react";
import type { QueueItem } from "../types";
import { isSong, isYouTubeResult } from "../types";
import { supabase } from "../lib/supabase";
import { useAuth } from "./AuthContext";

type RepeatMode = "off" | "one" | "all";

interface PlayerContextValue {
  currentTrack: QueueItem | null;
  queue: QueueItem[];
  currentIndex: number;
  isPlaying: boolean;
  volume: number;
  isMuted: boolean;
  isShuffled: boolean;
  repeatMode: RepeatMode;
  playerReady: boolean;
  playbackError: string | null;
  currentTime: number;
  duration: number;
  playTrack: (track: QueueItem, queue?: QueueItem[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  setVolume: (v: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  removeFromQueue: (index: number) => void;
  addToQueue: (track: QueueItem) => void;
  clearQueue: () => void;
  dismissError: () => void;
  seek: (seconds: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | undefined>(undefined);

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: () => void;
  }
}

let ytApiPromise: Promise<void> | null = null;

function loadYouTubeAPI(): Promise<void> {
  if (ytApiPromise) return ytApiPromise;
  ytApiPromise = new Promise((resolve) => {
    if (window.YT && window.YT.Player) {
      resolve();
      return;
    }
    const tag = document.createElement("script");
    tag.src = "https://www.youtube.com/iframe_api";
    const firstScriptTag = document.getElementsByTagName("script")[0];
    firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
    window.onYouTubeIframeAPIReady = () => resolve();
  });
  return ytApiPromise;
}

function getVideoId(track: QueueItem): string | null {
  if (isSong(track)) return track.video_id;
  return (track as any).videoId ?? (track as any).video_id ?? null;
}

function getTitle(track: QueueItem): string {
  if (isSong(track)) return track.title;
  return (track as any).title ?? "Unknown";
}

function getArtist(track: QueueItem): string {
  if (isSong(track)) return track.artist?.name ?? "";
  if (isYouTubeResult(track)) return track.channel;
  return (track as any).artist ?? "";
}

function getThumbnail(track: QueueItem): string {
  if (isSong(track)) {
    if (track.cover_url) return track.cover_url;
    if (track.video_id) return `https://i.ytimg.com/vi/${track.video_id}/mqdefault.jpg`;
    return "";
  }
  if (isYouTubeResult(track)) return track.thumbnail;
  return (track as any).thumbnail ?? (track as any).cover_url ?? "";
}

function isYouTubeSource(track: QueueItem): boolean {
  if (isYouTubeResult(track)) return true;
  if (isSong(track)) return !!track.video_id;
  return true;
}

function formatTime(seconds: number): string {
  if (!seconds || isNaN(seconds) || seconds < 0) return "0:00";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

let playerHostDiv: HTMLDivElement | null = null;

function getPlayerHost(): HTMLDivElement {
  if (playerHostDiv && document.body.contains(playerHostDiv)) return playerHostDiv;
  playerHostDiv = document.createElement("div");
  playerHostDiv.style.cssText = "position:fixed;left:-9999px;top:0;width:1px;height:1px;overflow:hidden;pointer-events:none;";
  document.body.appendChild(playerHostDiv);
  return playerHostDiv;
}

let playerIdCounter = 0;

export function PlayerProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const playerRef = useRef<any>(null);
  const [currentTrack, setCurrentTrack] = useState<QueueItem | null>(null);
  const [queue, setQueue] = useState<QueueItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(-1);
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolumeState] = useState(70);
  const [isMuted, setIsMuted] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");
  const [playerReady, setPlayerReady] = useState(false);
  const [playbackError, setPlaybackError] = useState<string | null>(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);

  // Poll the YT player for current time / duration while playing
  useEffect(() => {
    if (!playerReady || !playerRef.current) return;
    const interval = setInterval(() => {
      try {
        const t = playerRef.current?.getCurrentTime?.() ?? 0;
        const d = playerRef.current?.getDuration?.() ?? 0;
        setCurrentTime(t);
        if (d && d !== duration) setDuration(d);
      } catch {
        /* player may be in a transitional state */
      }
    }, 500);
    return () => clearInterval(interval);
  }, [playerReady, duration]);

  const recordHistory = useCallback(
    async (track: QueueItem) => {
      if (!user) return;
      const vid = getVideoId(track);
      if (!vid) return;
      await supabase.from("user_history").insert({
        user_id: user.id,
        video_id: vid,
        song_id: isSong(track) ? track.id : null,
        title: getTitle(track),
        artist: getArtist(track),
        thumbnail: getThumbnail(track),
      });
    },
    [user]
  );

  const loadAndPlay = useCallback(
    (track: QueueItem, idx: number) => {
      const vid = getVideoId(track);
      if (!vid) {
        setPlaybackError("This track has no video ID and cannot be played.");
        return;
      }

      setCurrentTrack(track);
      setCurrentIndex(idx);
      setPlayerReady(false);
      setPlaybackError(null);
      setCurrentTime(0);
      setDuration(0);

      loadYouTubeAPI().then(() => {
        if (playerRef.current) {
          try {
            playerRef.current.destroy();
          } catch {
            /* ignore */
          }
          playerRef.current = null;
        }

        const host = getPlayerHost();
        host.innerHTML = "";
        const playerId = `yt-player-${++playerIdCounter}`;
        const mountEl = document.createElement("div");
        mountEl.id = playerId;
        host.appendChild(mountEl);

        playerRef.current = new window.YT.Player(playerId, {
          videoId: vid,
          width: "1",
          height: "1",
          playerVars: {
            autoplay: 1,
            controls: 0,
            disablekb: 1,
            modestbranding: 1,
            rel: 0,
            playsinline: 1,
            origin: window.location.origin,
          },
          events: {
            onReady: (e: any) => {
              setPlayerReady(true);
              const d = e.target.getDuration?.() ?? 0;
              if (d) setDuration(d);
              e.target.setVolume(isMuted ? 0 : volume);
              e.target.playVideo();
            },
            onStateChange: (e: any) => {
              if (e.data === window.YT.PlayerState.PLAYING) {
                setIsPlaying(true);
                setPlaybackError(null);
                const d = e.target.getDuration?.() ?? 0;
                if (d) setDuration(d);
              }
              if (e.data === window.YT.PlayerState.PAUSED) setIsPlaying(false);
              if (e.data === window.YT.PlayerState.ENDED) {
                handleEnded();
              }
            },
            onError: (e: any) => {
              const errorCodes: Record<number, string> = {
                2: "Invalid video parameter. This video cannot be played.",
                5: "The YouTube player could not load this video. Please try again.",
                100: "This video was removed or is no longer available on YouTube.",
                101: "The owner of this video does not allow embedded playback.",
                150: "The owner of this video does not allow embedded playback.",
              };
              const msg = errorCodes[e.data] ?? "This video could not be played. It may be restricted or unavailable.";
              setPlaybackError(msg);
              setPlayerReady(false);
              setIsPlaying(false);
            },
          },
        });
      }).catch(() => {
        setPlaybackError("Could not load the YouTube player. Please check your connection and try again.");
      });

      recordHistory(track);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [volume, isMuted, recordHistory]
  );

  const handleEnded = useCallback(() => {
    setQueue((q) => {
      setCurrentIndex((ci) => {
        if (repeatMode === "one") {
          const track = q[ci];
          if (track) loadAndPlay(track, ci);
          return ci;
        }
        let nextIdx = ci + 1;
        if (nextIdx >= q.length) {
          if (repeatMode === "all" && q.length > 0) {
            nextIdx = 0;
          } else {
            setIsPlaying(false);
            return ci;
          }
        }
        if (isShuffled && q.length > 1) {
          nextIdx = Math.floor(Math.random() * q.length);
        }
        const track = q[nextIdx];
        if (track) loadAndPlay(track, nextIdx);
        return nextIdx;
      });
      return q;
    });
  }, [repeatMode, isShuffled, loadAndPlay]);

  const playTrack = useCallback(
    (track: QueueItem, newQueue?: QueueItem[]) => {
      const q = newQueue ?? [track];
      setQueue(q);
      const trackVid = getVideoId(track);
      const idx = q.findIndex((t) => getVideoId(t) === trackVid);
      loadAndPlay(track, idx >= 0 ? idx : 0);
    },
    [loadAndPlay]
  );

  const togglePlay = useCallback(() => {
    if (!playerRef.current) return;
    if (isPlaying) {
      playerRef.current.pauseVideo();
    } else {
      playerRef.current.playVideo();
    }
  }, [isPlaying]);

  const seek = useCallback((seconds: number) => {
    if (!playerRef.current) return;
    try {
      playerRef.current.seekTo(seconds, true);
      setCurrentTime(seconds);
      if (!isPlaying) {
        playerRef.current.playVideo();
      }
    } catch {
      /* ignore */
    }
  }, [isPlaying]);

  const next = useCallback(() => {
    if (queue.length === 0) return;
    let nextIdx = currentIndex + 1;
    if (nextIdx >= queue.length) {
      if (repeatMode === "all") nextIdx = 0;
      else return;
    }
    if (isShuffled && queue.length > 1) {
      nextIdx = Math.floor(Math.random() * queue.length);
    }
    loadAndPlay(queue[nextIdx], nextIdx);
  }, [queue, currentIndex, repeatMode, isShuffled, loadAndPlay]);

  const prev = useCallback(() => {
    if (queue.length === 0 || currentIndex <= 0) return;
    const prevIdx = currentIndex - 1;
    loadAndPlay(queue[prevIdx], prevIdx);
  }, [queue, currentIndex, loadAndPlay]);

  const setVolume = useCallback((v: number) => {
    setVolumeState(v);
    if (playerRef.current) playerRef.current.setVolume(v);
    if (v > 0) setIsMuted(false);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const newMuted = !m;
      if (playerRef.current) {
        playerRef.current.setVolume(newMuted ? 0 : volume);
      }
      return newMuted;
    });
  }, [volume]);

  const toggleShuffle = useCallback(() => setIsShuffled((s) => !s), []);

  const cycleRepeat = useCallback(() => {
    setRepeatMode((m) => (m === "off" ? "all" : m === "all" ? "one" : "off"));
  }, []);

  const removeFromQueue = useCallback(
    (index: number) => {
      setQueue((q) => q.filter((_, i) => i !== index));
      if (index < currentIndex) setCurrentIndex((ci) => ci - 1);
    },
    [currentIndex]
  );

  const addToQueue = useCallback((track: QueueItem) => {
    setQueue((q) => [...q, track]);
  }, []);

  const clearQueue = useCallback(() => {
    setQueue([]);
    setCurrentIndex(-1);
    setCurrentTrack(null);
    setPlaybackError(null);
    setCurrentTime(0);
    setDuration(0);
    if (playerRef.current) {
      try {
        playerRef.current.destroy();
      } catch {
        /* ignore */
      }
      playerRef.current = null;
    }
  }, []);

  const dismissError = useCallback(() => setPlaybackError(null), []);

  return (
    <PlayerContext.Provider
      value={{
        currentTrack,
        queue,
        currentIndex,
        isPlaying,
        volume,
        isMuted,
        isShuffled,
        repeatMode,
        playerReady,
        playbackError,
        currentTime,
        duration,
        playTrack,
        togglePlay,
        next,
        prev,
        setVolume,
        toggleMute,
        toggleShuffle,
        cycleRepeat,
        removeFromQueue,
        addToQueue,
        clearQueue,
        dismissError,
        seek,
      }}
    >
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error("usePlayer must be used within PlayerProvider");
  return ctx;
}

export { getVideoId, getTitle, getArtist, getThumbnail, isYouTubeSource, formatTime };
