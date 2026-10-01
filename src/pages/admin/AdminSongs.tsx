import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { Song, Artist, Album } from "../../types";
import { Plus, Search, CreditCard as Edit2, Trash2, X, Music } from "lucide-react";

const SECTIONS = [
  { value: "", label: "None" },
  { value: "trending", label: "Trending" },
  { value: "featured", label: "Featured" },
  { value: "new_release", label: "New Releases" },
  { value: "popular", label: "Popular" },
];

export default function AdminSongs() {
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sectionFilter, setSectionFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Song | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("songs").select("*, artist:artists(*), album:albums(*)").order("created_at", { ascending: false });
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setSongs(data ?? []);

    const [{ data: art }, { data: alb }] = await Promise.all([
      supabase.from("artists").select("*").order("name"),
      supabase.from("albums").select("*").order("title"),
    ]);
    setArtists(art ?? []);
    setAlbums(alb ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const filteredSongs = sectionFilter ? songs.filter((s) => s.section === sectionFilter) : songs;

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this song? This cannot be undone.")) return;
    await supabase.from("songs").delete().eq("id", id);
    fetchData();
  };

  const handleSave = async (formData: any) => {
    const payload = {
      title: formData.title,
      artist_id: formData.artist_id || null,
      album_id: formData.album_id || null,
      video_id: formData.video_id || null,
      cover_url: formData.cover_url || null,
      audio_url: formData.audio_url || null,
      duration: formData.duration || null,
      section: formData.section || null,
      section_order: Number(formData.section_order) || 0,
      is_published: formData.is_published,
    };

    if (editing) {
      await supabase.from("songs").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("songs").insert(payload);
    }
    setShowModal(false);
    setEditing(null);
    fetchData();
  };

  const openEdit = (song: Song) => {
    setEditing(song);
    setShowModal(true);
  };

  const openCreate = () => {
    setEditing(null);
    setShowModal(true);
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Songs</h1>
          <p className="text-sm text-ink-400">{filteredSongs.length} songs</p>
        </div>
        <button onClick={openCreate} className="btn-primary">
          <Plus size={16} /> Add Song
        </button>
      </div>

      <div className="mb-4 flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search songs…"
            className="input-field pl-11"
          />
        </div>
        <select
          value={sectionFilter}
          onChange={(e) => setSectionFilter(e.target.value)}
          className="input-field w-auto"
        >
          <option value="">All sections</option>
          {SECTIONS.filter((s) => s.value).map((s) => (
            <option key={s.value} value={s.value}>{s.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="card flex flex-col items-center justify-center p-12 text-center">
          <Music className="mb-3 text-ink-400" size={32} />
          <p className="text-sm text-ink-400">No songs found. Click "Add Song" to create one.</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filteredSongs.map((song) => (
            <div key={song.id} className="group flex items-center gap-3 rounded-lg border border-base-600 bg-base-800 p-3 transition hover:border-mint-700/50">
              <div className="h-10 w-10 shrink-0 overflow-hidden rounded bg-base-700">
                {song.cover_url ? (
                  <img src={song.cover_url} alt="" className="h-full w-full object-cover" />
                ) : song.video_id ? (
                  <img src={`https://i.ytimg.com/vi/${song.video_id}/default.jpg`} alt="" className="h-full w-full object-cover" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-ink-50">{song.title}</p>
                <p className="truncate text-xs text-ink-400">{song.artist?.name ?? "Unknown"}</p>
              </div>
              {song.section && (
                <span className="badge bg-mint-500/10 text-mint-400">{SECTIONS.find((s) => s.value === song.section)?.label ?? song.section}</span>
              )}
              {song.is_published ? (
                <span className="badge bg-success-500/10 text-success-500">Published</span>
              ) : (
                <span className="badge bg-ink-500/20 text-ink-300">Draft</span>
              )}
              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => openEdit(song)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(song.id)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-danger-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && (
        <SongModal
          song={editing}
          artists={artists}
          albums={albums}
          onSave={handleSave}
          onClose={() => { setShowModal(false); setEditing(null); }}
        />
      )}
    </div>
  );
}

function SongModal({ song, artists, albums, onSave, onClose }: {
  song: Song | null;
  artists: Artist[];
  albums: Album[];
  onSave: (data: any) => void;
  onClose: () => void;
}) {
  const [form, setForm] = useState({
    title: song?.title ?? "",
    artist_id: song?.artist_id ?? "",
    album_id: song?.album_id ?? "",
    video_id: song?.video_id ?? "",
    cover_url: song?.cover_url ?? "",
    audio_url: song?.audio_url ?? "",
    duration: song?.duration ?? "",
    section: song?.section ?? "",
    section_order: song?.section_order ?? 0,
    is_published: song?.is_published ?? true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-lg max-h-[90vh] overflow-y-auto p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-50">{song ? "Edit Song" : "Add Song"}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-mint-400"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-200">Artist</label>
              <select value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} className="input-field">
                <option value="">None</option>
                {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-200">Album</label>
              <select value={form.album_id} onChange={(e) => setForm({ ...form, album_id: e.target.value })} className="input-field">
                <option value="">None</option>
                {albums.map((a) => <option key={a.id} value={a.id}>{a.title}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">YouTube Video ID</label>
            <input value={form.video_id} onChange={(e) => setForm({ ...form, video_id: e.target.value })} placeholder="dQw4w9WgXcQ" className="input-field font-mono text-xs" />
            <p className="mt-1 text-xs text-ink-400">Used for playback via YouTube embed</p>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Cover Image URL</label>
            <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" className="input-field" />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Audio URL (optional)</label>
            <input value={form.audio_url} onChange={(e) => setForm({ ...form, audio_url: e.target.value })} placeholder="https://…" className="input-field" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-200">Duration</label>
              <input value={form.duration} onChange={(e) => setForm({ ...form, duration: e.target.value })} placeholder="3:45" className="input-field" />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium text-ink-200">Homepage Section</label>
              <select value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="input-field">
                {SECTIONS.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Section Order</label>
            <input type="number" value={form.section_order} onChange={(e) => setForm({ ...form, section_order: Number(e.target.value) })} className="input-field" />
            <p className="mt-1 text-xs text-ink-400">Lower numbers appear first</p>
          </div>

          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.is_published} onChange={(e) => setForm({ ...form, is_published: e.target.checked })} className="h-4 w-4 accent-mint-500" />
            <span className="text-sm text-ink-200">Published (visible on site)</span>
          </label>

          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{song ? "Save Changes" : "Create Song"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
