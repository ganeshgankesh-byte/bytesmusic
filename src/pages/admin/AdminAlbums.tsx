import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { Album, Artist } from "../../types";
import { Plus, Search, CreditCard as Edit2, Trash2, X, Disc3 } from "lucide-react";

export default function AdminAlbums() {
  const [albums, setAlbums] = useState<Album[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Album | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("albums").select("*, artist:artists(*)").order("created_at", { ascending: false });
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setAlbums(data ?? []);
    const { data: art } = await supabase.from("artists").select("*").order("name");
    setArtists(art ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this album?")) return;
    await supabase.from("albums").delete().eq("id", id);
    fetchData();
  };

  const handleSave = async (formData: any) => {
    const payload = {
      title: formData.title,
      artist_id: formData.artist_id || null,
      cover_url: formData.cover_url || null,
      release_date: formData.release_date || null,
    };
    if (editing) {
      await supabase.from("albums").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("albums").insert(payload);
    }
    setShowModal(false);
    setEditing(null);
    fetchData();
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Albums</h1>
          <p className="text-sm text-ink-400">{albums.length} albums</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Album
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search albums…" className="input-field pl-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
        </div>
      ) : albums.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Disc3 className="mb-3 text-ink-400" size={32} />
          <p className="text-sm text-ink-400">No albums yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {albums.map((album) => (
            <div key={album.id} className="group card card-hover flex items-center gap-3 p-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded bg-base-700">
                {album.cover_url && <img src={album.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-50">{album.title}</p>
                <p className="truncate text-xs text-ink-400">{album.artist?.name ?? "Unknown"}</p>
              </div>
              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => { setEditing(album); setShowModal(true); }} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(album.id)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-danger-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <AlbumModal album={editing} artists={artists} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}

function AlbumModal({ album, artists, onSave, onClose }: { album: Album | null; artists: Artist[]; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: album?.title ?? "",
    artist_id: album?.artist_id ?? "",
    cover_url: album?.cover_url ?? "",
    release_date: album?.release_date ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-50">{album ? "Edit Album" : "Add Album"}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-mint-400"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Artist</label>
            <select value={form.artist_id} onChange={(e) => setForm({ ...form, artist_id: e.target.value })} className="input-field">
              <option value="">None</option>
              {artists.map((a) => <option key={a.id} value={a.id}>{a.name}</option>)}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Cover URL</label>
            <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Release Date</label>
            <input type="date" value={form.release_date} onChange={(e) => setForm({ ...form, release_date: e.target.value })} className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{album ? "Save" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
