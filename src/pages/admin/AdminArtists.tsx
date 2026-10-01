import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { Artist } from "../../types";
import { Plus, Search, CreditCard as Edit2, Trash2, X, Mic as Mic2 } from "lucide-react";

export default function AdminArtists() {
  const [artists, setArtists] = useState<Artist[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Artist | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    let query = supabase.from("artists").select("*").order("name");
    if (search) query = query.ilike("name", `%${search}%`);
    const { data } = await query;
    setArtists(data ?? []);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const timer = setTimeout(fetchData, 300);
    return () => clearTimeout(timer);
  }, [fetchData]);

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this artist? Songs will remain but lose the artist link.")) return;
    await supabase.from("artists").delete().eq("id", id);
    fetchData();
  };

  const handleSave = async (formData: any) => {
    const payload = {
      name: formData.name,
      bio: formData.bio || null,
      image_url: formData.image_url || null,
    };
    if (editing) {
      await supabase.from("artists").update(payload).eq("id", editing.id);
    } else {
      await supabase.from("artists").insert(payload);
    }
    setShowModal(false);
    setEditing(null);
    fetchData();
  };

  return (
    <div className="animate-fade-in p-6">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-ink-50">Artists</h1>
          <p className="text-sm text-ink-400">{artists.length} artists</p>
        </div>
        <button onClick={() => { setEditing(null); setShowModal(true); }} className="btn-primary">
          <Plus size={16} /> Add Artist
        </button>
      </div>

      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-ink-400" size={18} />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search artists…" className="input-field pl-11" />
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
        </div>
      ) : artists.length === 0 ? (
        <div className="card flex flex-col items-center p-12 text-center">
          <Mic2 className="mb-3 text-ink-400" size={32} />
          <p className="text-sm text-ink-400">No artists yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {artists.map((artist) => (
            <div key={artist.id} className="group card card-hover flex items-center gap-3 p-4">
              <div className="h-12 w-12 shrink-0 overflow-hidden rounded-full bg-base-700">
                {artist.image_url && <img src={artist.image_url} alt="" className="h-full w-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink-50">{artist.name}</p>
                <p className="truncate text-xs text-ink-400">{artist.bio ?? "No bio"}</p>
              </div>
              <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                <button onClick={() => { setEditing(artist); setShowModal(true); }} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400">
                  <Edit2 size={14} />
                </button>
                <button onClick={() => handleDelete(artist.id)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-danger-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {showModal && <ArtistModal artist={editing} onSave={handleSave} onClose={() => { setShowModal(false); setEditing(null); }} />}
    </div>
  );
}

function ArtistModal({ artist, onSave, onClose }: { artist: Artist | null; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    name: artist?.name ?? "",
    bio: artist?.bio ?? "",
    image_url: artist?.image_url ?? "",
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={onClose}>
      <div className="card w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-50">{artist ? "Edit Artist" : "Add Artist"}</h2>
          <button onClick={onClose} className="text-ink-400 hover:text-mint-400"><X size={20} /></button>
        </div>
        <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Name *</label>
            <input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input-field" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Bio</label>
            <textarea value={form.bio} onChange={(e) => setForm({ ...form, bio: e.target.value })} rows={3} className="input-field resize-none" />
          </div>
          <div>
            <label className="mb-1 block text-sm font-medium text-ink-200">Image URL</label>
            <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" className="input-field" />
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
            <button type="submit" className="btn-primary">{artist ? "Save" : "Create"}</button>
          </div>
        </form>
      </div>
    </div>
  );
}
