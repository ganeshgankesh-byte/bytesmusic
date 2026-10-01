import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { Playlist, Song } from "../../types";
import { Plus, Search, CreditCard as Edit2, Trash2, X, ListMusic, ChevronRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminPlaylists() {
  const navigate = useNavigate();
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Playlist | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("playlists").select("*").order("created_at", { ascending: false });
    if (search) query = query.ilike("title", `%${search}%`);
    const { data } = await query;
    setPlaylists(data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this playlist?")) return;
    await supabase.from("playlists").delete().eq("id", id);
    fetchData();
  };

  const handleSave = async (formData: any) => {
    const payload = {
      title: formData.title,
      description: formData.description || null,
      cover_url: formData.cover_url || null,
    };
    if (editing) {
      await supabase.from("playlists").update(payload).eq("id", editing.id);
    } else {
      const { data } = await supabase.from("playlists").insert(payload).select().single();
      if (data) navigate(`/admin/playlists?edit=${data.id}`);
    }
    setShowModal(false);
    setEditing(null);
    fetchData();
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Playlists</h1>
          <p className="text-sm text-ink-400">{playlists.length} playlists</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Playlist
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search playlists…" className="input-field pl-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
        </div>
      ) : playlists.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <ListMusic className="mb-3 text-ink-400" size={32} />
          <p className="text-sm text-ink-400">No playlists yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {playlists.map((pl) => (
            <div key={pl.id} className="group card card-hover p-4">
              <div className="mb-3 aspect-square w-full overflow-hidden rounded-lg bg-base-700">
                {pl.cover_url && <img src={pl.cover_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-ink-50">{pl.title}</p>
                  <p className="truncate text-xs text-ink-400">{pl.description ?? "Playlist"}</p>
                </div>
                <div className="flex shrink-0 gap-1 opacity-0 transition group-hover:opacity-100">
                  <button onClick={() => { setEditing(pl); setShowModal(true); }} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400">
                    <Edit2 size={14} />
                  </button>
                  <button onClick={() => handleDelete(pl.id)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-danger-500">
                    <Trash2 size={14} />
                  </button>
                </div>
              </div>
              <button onClick={() => navigate(`/playlist/${pl.id}`)} className="mt-3 flex w-full items-center justify-center gap-1 text-xs text-mint-500 hover:text-mint-400">
                View playlist <ChevronRight size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {showModal && <PlaylistModal playlist={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}

function PlaylistModal({ playlist, onSave, onClose }: { playlist: Playlist | null; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: playlist?.title ?? "",
    description: playlist?.description ?? "",
    cover_url: playlist?.cover_url ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-50">{playlist ? "Edit Playlist" : "Add Playlist"}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-mint-400"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Title *</label>
            <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Description</label>
            <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} rows={2} className="input-field resize-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Cover URL</label>
            <input value={form.cover_url} onChange={(e) => setForm({ ...form, cover_url: e.target.value })} placeholder="https://…" className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{playlist ? "Save" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
