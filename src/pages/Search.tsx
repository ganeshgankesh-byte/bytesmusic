import { useEffect, useState, useCallback, useMemo } from "react";
import { Search as SearchIcon, X, Music2, Mic2, Disc3 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { usePlayer } from "../context/PlayerContext";
import type { Song, Artist, Album } from "../types";

export default function Search() {
  const [query, setQuery] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setSongs([]);
      setArtists([]);
      setAlbums([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const [songsRes, artistsRes, albumsRes] = await Promise.all([
        supabase
          .from("songs")
          .select("*, artist:artists(*)")
          .ilike("title", `%${q}%`)
          .eq("is_published", true)
          .order("plays", { ascending: false })
          .limit(20),
        supabase
          .from("artists")
          .select("*")
          .ilike("name", `%${q}%`)
          .limit(10),
        supabase
          .from("albums")
          .select("*, artist:artists(*)")
          .ilike("title", `%${q}%`)
          .limit(10),
      ]);

      if (songsRes.error) throw songsRes.error;
      if (artistsRes.error) throw artistsRes.error;
      if (albumsRes.error) throw albumsRes.error;

      setSongs(songsRes.data ?? []);
      setArtists(artistsRes.data ?? []);
      setAlbums(albumsRes.data ?? []);
    } catch (err: any) {
      setError(err.message || "Search failed. Please try again.");
      setSongs([]);
      setArtists([]);
      setAlbums([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 300);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

  const hasResults = songs.length > 0 || artists.length > 0 || albums.length > 0;

  return (
    <div className="animate-fade-in px-4 pt-6 sm:px-6 lg:px-8">
      <h1 className="mb-6 text-2xl font-bold text-ink-50 sm:text-3xl">Search</h1>

      <div className="relative mb-6 max-w-2xl">
        <SearchIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-ink-400" size={20} />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search songs, artists, albums…"
          className="input-field pl-12 pr-10"
          autoFocus
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-400 hover:text-mint-400"
          >
            <X size={18} />
          </button>
        )}
      </div>

      {loading && (
        <div className="flex items-center justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
        </div>
      )}

      {error && (
        <div className="card border-danger-500/30 bg-danger-500/5 p-4 text-center">
          <p className="text-sm text-danger-500">{error}</p>
        </div>
      )}

      {!loading && !error && query && !hasResults && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <SearchIcon className="mb-3 text-ink-400" size={40} />
          <p className="text-sm text-ink-400">No results found for "{query}"</p>
          <p className="mt-1 text-xs text-ink-400">Try a different search term, or add content from the admin panel.</p>
        </div>
      )}

      {!loading && !error && hasResults && (
        <div className="space-y-8">
          {/* Songs */}
          {songs.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Music2 className="text-mint-500" size={18} />
                <h2 className="text-lg font-bold text-ink-50">Songs</h2>
                <span className="text-xs text-ink-400">({songs.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {songs.map((song) => (
                  <SongResultCard key={song.id} song={song} queue={songs} />
                ))}
              </div>
            </section>
          )}

          {/* Artists */}
          {artists.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Mic2 className="text-mint-500" size={18} />
                <h2 className="text-lg font-bold text-ink-50">Artists</h2>
                <span className="text-xs text-ink-400">({artists.length})</span>
              </div>
              <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                {artists.map((artist) => (
                  <div key={artist.id} className="shrink-0 w-32 text-center sm:w-36">
                    <div className="mx-auto mb-2 h-24 w-24 overflow-hidden rounded-full bg-base-700 sm:h-28 sm:w-28">
                      {artist.image_url && <img src={artist.image_url} alt={artist.name} className="h-full w-full object-cover" />}
                    </div>
                    <p className="truncate text-sm font-semibold text-ink-50">{artist.name}</p>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* Albums */}
          {albums.length > 0 && (
            <section>
              <div className="mb-3 flex items-center gap-2">
                <Disc3 className="text-mint-500" size={18} />
                <h2 className="text-lg font-bold text-ink-50">Albums</h2>
                <span className="text-xs text-ink-400">({albums.length})</span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                {albums.map((album) => (
                  <div key={album.id} className="card card-hover group cursor-pointer p-3">
                    <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-base-700">
                      {album.cover_url ? (
                        <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="flex h-full w-full items-center justify-center text-ink-400">
                          <Disc3 size={28} />
                        </div>
                      )}
                    </div>
                    <h3 className="truncate text-sm font-semibold text-ink-50">{album.title}</h3>
                    <p className="truncate text-xs text-ink-400">{album.artist?.name ?? "Unknown"}</p>
                  </div>
                ))}
              </div>
            </section>
          )}
        </div>
      )}

      {!query && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="mb-4 text-ink-400" size={48} />
          <p className="text-sm text-ink-400">Search for songs, artists, and albums in the BytesMusic catalog</p>
        </div>
      )}
    </div>
  );
}

function SongResultCard({ song, queue }: { song: Song; queue: Song[] }) {
  const { playTrack } = usePlayer();

  return (
    <div onClick={() => playTrack(song, queue)} className="group card card-hover cursor-pointer p-3">
      <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-base-700">
        {song.cover_url ? (
          <img src={song.cover_url} alt={song.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : song.video_id ? (
          <img src={`https://i.ytimg.com/vi/${song.video_id}/mqdefault.jpg`} alt={song.title} className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105" />
        ) : (
          <div className="flex h-full w-full items-center justify-center text-ink-400">
            <Music2 size={32} />
          </div>
        )}
        <div className="absolute inset-0 flex items-center justify-center bg-black/40 opacity-0 transition-opacity group-hover:opacity-100">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-mint-500 text-base-900">
            <SearchIcon className="hidden" />
            <PlayIcon />
          </div>
        </div>
      </div>
      <h3 className="truncate text-sm font-semibold text-ink-50">{song.title}</h3>
      <p className="truncate text-xs text-ink-400">{song.artist?.name ?? "Unknown artist"}</p>
      {song.duration && <p className="mt-0.5 text-xs text-ink-400">{song.duration}</p>}
    </div>
  );
}

function PlayIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
      <path d="M8 5v14l11-7z" />
    </svg>
  );
}
