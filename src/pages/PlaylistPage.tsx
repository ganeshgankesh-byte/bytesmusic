import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { supabase } from "../lib/supabase";
import type { Playlist, Song } from "../types";
import { SongRow } from "../components/SongCard";
import { ArrowLeft, Play } from "lucide-react";
import { usePlayer } from "../context/PlayerContext";

export default function PlaylistPage() {
  const { id } = useParams();
  const { playTrack } = usePlayer();
  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: pl }, { data: plSongs }] = await Promise.all([
        supabase.from("playlists").select("*").eq("id", id).maybeSingle(),
        supabase
          .from("playlist_songs")
          .select("*, song:songs(*, artist:artists(*))")
          .eq("playlist_id", id)
          .order("position"),
      ]);

      setPlaylist(pl);
      setSongs((plSongs ?? []).map((ps: any) => ps.song).filter(Boolean));
      setLoading(false);
    })();
  }, [id]);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
      </div>
    );
  }

  if (!playlist) {
    return (
      <div className="flex h-full flex-col items-center justify-center">
        <p className="text-sm text-ink-400">Playlist not found</p>
        <Link to="/" className="mt-4 btn-secondary">Back home</Link>
      </div>
    );
  }

  return (
    <div className="animate-fade-in px-4 pt-6 sm:px-6 lg:px-8">
      <Link to="/" className="mb-4 inline-flex items-center gap-2 text-sm text-ink-400 hover:text-mint-400">
        <ArrowLeft size={16} /> Back
      </Link>

      <div className="mb-8 flex flex-col items-center gap-4 sm:flex-row sm:items-end">
        <div className="h-40 w-40 shrink-0 overflow-hidden rounded-xl bg-base-700">
          {playlist.cover_url && <img src={playlist.cover_url} alt="" className="h-full w-full object-cover" />}
        </div>
        <div>
          <p className="mb-1 text-xs uppercase tracking-wide text-ink-400">Playlist</p>
          <h1 className="mb-2 text-3xl font-bold text-ink-50">{playlist.title}</h1>
          <p className="text-sm text-ink-400">{playlist.description ?? `${songs.length} songs`}</p>
        </div>
      </div>

      {songs.length > 0 && (
        <button
          onClick={() => playTrack(songs[0], songs)}
          className="mb-6 btn-primary"
        >
          <Play size={16} fill="currentColor" /> Play all
        </button>
      )}

      {songs.length === 0 ? (
        <p className="py-12 text-center text-sm text-ink-400">This playlist has no songs yet.</p>
      ) : (
        <div className="space-y-1">
          {songs.map((song, i) => (
            <SongRow key={song.id} song={song} index={i} queue={songs} />
          ))}
        </div>
      )}
    </div>
  );
}
