import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { HomepageSection, HeroSlide } from "../../types";
import { Plus, CreditCard as Edit2, Trash2, X, Eye, EyeOff, ArrowUp, ArrowDown, Image as ImageIcon, Save } from "lucide-react";

export default function AdminHomepage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [editingHero, setEditingHero] = useState<HeroSlide | null>(null);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: secs }, { data: slides }] = await Promise.all([
      supabase.from("homepage_sections").select("*").order("display_order"),
      supabase.from("hero_slides").select("*").order("display_order"),
    ]);
    setSections(secs ?? []);
    setHeroSlides(slides ?? []);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const toggleSectionActive = async (section: HomepageSection) => {
    await supabase.from("homepage_sections").update({ is_active: !section.is_active }).eq("id", section.id);
    fetchData();
  };

  const moveSection = async (section: HomepageSection, direction: "up" | "down") => {
    const sorted = [...sections].sort((a, b) => a.display_order - b.display_order);
    const idx = sorted.findIndex((s) => s.id === section.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= sorted.length) return;
    const swapSection = sorted[swapIdx];
    await Promise.all([
      supabase.from("homepage_sections").update({ display_order: swapSection.display_order }).eq("id", section.id),
      supabase.from("homepage_sections").update({ display_order: section.display_order }).eq("id", swapSection.id),
    ]);
    fetchData();
  };

  const saveSection = async (formData: any) => {
    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      is_active: formData.is_active,
    };
    if (editingSection) {
      await supabase.from("homepage_sections").update(payload).eq("id", editingSection.id);
    }
    setEditingSection(null);
    fetchData();
  };

  const saveHero = async (formData: any) => {
    const payload = {
      title: formData.title,
      subtitle: formData.subtitle || null,
      image_url: formData.image_url || null,
      link_url: formData.link_url || null,
      is_active: formData.is_active,
      display_order: Number(formData.display_order) || 0,
    };
    if (editingHero) {
      await supabase.from("hero_slides").update(payload).eq("id", editingHero.id);
    } else {
      await supabase.from("hero_slides").insert(payload);
    }
    setShowHeroModal(false);
    setEditingHero(null);
    fetchData();
  };

  const deleteHero = async (id: string) => {
    if (!confirm("Delete this hero slide?")) return;
    await supabase.from("hero_slides").delete().eq("id", id);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="animate-fade-in p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-ink-50">Homepage Control</h1>
        <p className="text-sm text-ink-400">Manage what appears on the BytesMusic homepage and in what order</p>
      </div>

      {/* Hero Slides */}
      <div className="mb-8">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-lg font-bold text-ink-50">Hero / Banner Slides</h2>
          <button onClick={() => { setEditingHero(null); setShowHeroModal(true); }} className="btn-secondary text-xs">
            <Plus size={14} /> Add Slide
          </button>
        </div>

        {heroSlides.length === 0 ? (
          <div className="card flex flex-col items-center p-8 text-center">
            <ImageIcon className="mb-3 text-ink-400" size={28} />
            <p className="text-sm text-ink-400">No hero slides yet. Add one to show a banner on the homepage.</p>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {heroSlides.map((slide) => (
              <div key={slide.id} className="group card overflow-hidden">
                <div className="relative h-32 overflow-hidden bg-base-700">
                  {slide.image_url && <img src={slide.image_url} alt="" className="h-full w-full object-cover" />}
                  <div className="absolute inset-0 bg-gradient-to-t from-base-900/80 to-transparent" />
                  <div className="absolute bottom-2 left-3">
                    <p className="text-sm font-bold text-ink-50">{slide.title}</p>
                    <p className="text-xs text-ink-300">{slide.subtitle}</p>
                  </div>
                  <div className="absolute right-2 top-2 flex gap-1">
                    <button
                      onClick={() => { setEditingHero(slide); setShowHeroModal(true); }}
                      className="rounded bg-base-900/80 p-1.5 text-ink-200 hover:text-mint-400"
                    >
                      <Edit2 size={12} />
                    </button>
                    <button
                      onClick={() => deleteHero(slide.id)}
                      className="rounded bg-base-900/80 p-1.5 text-ink-200 hover:text-danger-500"
                    >
                      <Trash2 size={12} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Homepage Sections */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-ink-50">Homepage Sections</h2>
        <div className="space-y-2">
          {[...sections].sort((a, b) => a.display_order - b.display_order).map((section, idx, arr) => (
            <div key={section.id} className="group card flex items-center gap-3 p-4">
              <div className="flex flex-col">
                <button
                  onClick={() => moveSection(section, "up")}
                  disabled={idx === 0}
                  className="text-ink-400 hover:text-mint-400 disabled:opacity-30"
                >
                  <ArrowUp size={14} />
                </button>
                <button
                  onClick={() => moveSection(section, "down")}
                  disabled={idx === arr.length - 1}
                  className="text-ink-400 hover:text-mint-400 disabled:opacity-30"
                >
                  <ArrowDown size={14} />
                </button>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-base-700 text-xs font-bold text-mint-500">
                {section.display_order}
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-ink-50">{section.title}</p>
                <p className="text-xs text-ink-400">
                  <span className="font-mono">{section.section_key}</span>
                  {section.subtitle && ` · ${section.subtitle}`}
                </p>
              </div>
              <span className={`badge ${section.is_active ? "bg-success-500/10 text-success-500" : "bg-ink-500/20 text-ink-300"}`}>
                {section.is_active ? "Active" : "Hidden"}
              </span>
              <div className="flex gap-1">
                <button onClick={() => toggleSectionActive(section)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400">
                  {section.is_active ? <Eye size={14} /> : <EyeOff size={14} />}
                </button>
                <button onClick={() => setEditingSection(section)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400">
                  <Edit2 size={14} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Edit Section Modal */}
      {editingSection && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setEditingSection(null)}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-50">Edit Section</h2>
              <button onClick={() => setEditingSection(null)} className="text-ink-400 hover:text-mint-400"><X size={20} /></button>
            </div>
            <SectionForm section={editingSection} onSave={saveSection} onClose={() => setEditingSection(null)} />
          </div>
        </div>
      )}

      {/* Hero Modal */}
      {showHeroModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => { setShowHeroModal(false); setEditingHero(null); }}>
          <div className="card w-full max-w-md p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-50">{editingHero ? "Edit Hero Slide" : "Add Hero Slide"}</h2>
              <button onClick={() => { setShowHeroModal(false); setEditingHero(null); }} className="text-ink-400 hover:text-mint-400"><X size={20} /></button>
            </div>
            <HeroForm hero={editingHero} onSave={saveHero} onClose={() => { setShowHeroModal(false); setEditingHero(null); }} />
          </div>
        </div>
      )}
    </div>
  );
}

function SectionForm({ section, onSave, onClose }: { section: HomepageSection; onSave: (d: any) => void; onClose: () => void }) {
  const [title, setTitle] = useState(section.title);
  const [subtitle, setSubtitle] = useState(section.subtitle ?? "");
  const [isActive, setIsActive] = useState(section.is_active);

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave({ title, subtitle, is_active: isActive }); }} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-200">Title</label>
        <input required value={title} onChange={(e) => setTitle(e.target.value)} className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-200">Subtitle</label>
        <input value={subtitle} onChange={(e) => setSubtitle(e.target.value)} className="input-field" />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} className="h-4 w-4 accent-mint-500" />
        <span className="text-sm text-ink-200">Visible on homepage</span>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary"><Save size={14} /> Save</button>
      </div>
    </form>
  );
}

function HeroForm({ hero, onSave, onClose }: { hero: HeroSlide | null; onSave: (d: any) => void; onClose: () => void }) {
  const [form, setForm] = useState({
    title: hero?.title ?? "",
    subtitle: hero?.subtitle ?? "",
    image_url: hero?.image_url ?? "",
    link_url: hero?.link_url ?? "",
    display_order: hero?.display_order ?? 0,
    is_active: hero?.is_active ?? true,
  });

  return (
    <form onSubmit={(e) => { e.preventDefault(); onSave(form); }} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-200">Title *</label>
        <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-200">Subtitle</label>
        <input value={form.subtitle} onChange={(e) => setForm({ ...form, subtitle: e.target.value })} className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-200">Image URL</label>
        <input value={form.image_url} onChange={(e) => setForm({ ...form, image_url: e.target.value })} placeholder="https://…" className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-200">Link URL (optional)</label>
        <input value={form.link_url} onChange={(e) => setForm({ ...form, link_url: e.target.value })} placeholder="/search" className="input-field" />
      </div>
      <div>
        <label className="mb-1 block text-sm font-medium text-ink-200">Display Order</label>
        <input type="number" value={form.display_order} onChange={(e) => setForm({ ...form, display_order: Number(e.target.value) })} className="input-field" />
      </div>
      <label className="flex items-center gap-2">
        <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} className="h-4 w-4 accent-mint-500" />
        <span className="text-sm text-ink-200">Active</span>
      </label>
      <div className="flex justify-end gap-2 pt-2">
        <button type="button" onClick={onClose} className="btn-secondary">Cancel</button>
        <button type="submit" className="btn-primary"><Save size={14} /> Save</button>
      </div>
    </form>
  );
}
