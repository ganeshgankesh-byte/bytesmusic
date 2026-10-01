import { useEffect, useState, useCallback } from "react";
import { Search as SearchIcon, X } from "lucide-react";
import type { SearchTrack } from "../types";
import { SearchTrackCard } from "../components/SongCard";

const API_BASE = import.meta.env.VITE_SUPABASE_URL;

export default function Search() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchTrack[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const doSearch = useCallback(async (q: string) => {
    if (!q.trim()) {
      setResults([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${API_BASE}/functions/v1/music-search?q=${encodeURIComponent(q)}`,
        {
          headers: {
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          },
        }
      );
      if (!res.ok) throw new Error("Search failed");
      const data = await res.json();
      setResults(data.results ?? []);
    } catch {
      setError("Search is temporarily unavailable. Please try again.");
      setResults([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => doSearch(query), 400);
    return () => clearTimeout(timer);
  }, [query, doSearch]);

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

      {!loading && !error && query && results.length === 0 && (
        <p className="py-12 text-center text-sm text-ink-400">No results found for "{query}"</p>
      )}

      {!loading && !error && results.length > 0 && (
        <>
          <p className="mb-4 text-sm text-ink-400">{results.length} results</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {results.map((track) => (
              <SearchTrackCard key={track.videoId} track={track} queue={results} />
            ))}
          </div>
        </>
      )}

      {!query && !loading && (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <SearchIcon className="mb-4 text-ink-400" size={48} />
          <p className="text-sm text-ink-400">Start typing to search the music catalog</p>
        </div>
      )}
    </div>
  );
}
