import { useEffect, useState, useCallback } from "react";
import { supabase } from "../../lib/supabase";
import type { HomepageSection, HeroSlide, Song } from "../../types";
import { Plus, CreditCard as Edit2, Trash2, X, Eye, EyeOff, ArrowUp, ArrowDown, Image as ImageIcon, Save, Music, Flame, Star, Sparkles, TrendingUp } from "lucide-react";

const SECTION_ICONS: Record<string, typeof Flame> = {
  trending: Flame,
  featured: Star,
  new_release: Sparkles,
  new_releases: Sparkles,
  popular: TrendingUp,
};

const SECTION_KEYS = ["trending", "featured", "new_release", "popular"];

export default function AdminHomepage() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [allSongs, setAllSongs] = useState<Song[]>([]);
  const [sectionSongs, setSectionSongs] = useState<Record<string, Song[]>>({});
  const [loading, setLoading] = useState(true);
  const [editingSection, setEditingSection] = useState<HomepageSection | null>(null);
  const [showHeroModal, setShowHeroModal] = useState(false);
  const [editingHero, setEditingHero] = useState<HeroSlide | null>(null);
  const [activeSectionKey, setActiveSectionKey] = useState<string>("trending");
  const [showAddSongModal, setShowAddSongModal] = useState(false);

  const fetchData = useCallback(async () => {
    setLoading(true);
    const [{ data: secs }, { data: slides }, { data: songs }] = await Promise.all([
      supabase.from("homepage_sections").select("*").order("display_order"),
      supabase.from("hero_slides").select("*").order("display_order"),
      supabase.from("songs").select("*, artist:artists(*)").order("section_order", { ascending: true }),
    ]);
    setSections(secs ?? []);
    setHeroSlides(slides ?? []);
    const allSongsData = songs ?? [];
    setAllSongs(allSongsData);

    const bySection: Record<string, Song[]> = {};
    for (const key of SECTION_KEYS) {
      bySection[key] = allSongsData.filter((s) => s.section === key);
    }
    setSectionSongs(bySection);
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

  // Section song management
  const moveSongInSection = async (song: Song, direction: "up" | "down") => {
    const sectionKey = song.section ?? activeSectionKey;
    const songs = [...(sectionSongs[sectionKey] ?? [])].sort((a, b) => a.section_order - b.section_order);
    const idx = songs.findIndex((s) => s.id === song.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= songs.length) return;
    const swapSong = songs[swapIdx];

    await Promise.all([
      supabase.from("songs").update({ section_order: swapSong.section_order }).eq("id", song.id),
      supabase.from("songs").update({ section_order: song.section_order }).eq("id", swapSong.id),
    ]);
    fetchData();
  };

  const removeSongFromSection = async (song: Song) => {
    await supabase.from("songs").update({ section: null, section_order: 0 }).eq("id", song.id);
    fetchData();
  };

  const togglePublish = async (song: Song) => {
    await supabase.from("songs").update({ is_published: !song.is_published }).eq("id", song.id);
    fetchData();
  };

  const addSongToSection = async (songId: string, sectionKey: string) => {
    const sectionSongList = sectionSongs[sectionKey] ?? [];
    const maxOrder = sectionSongList.reduce((max, s) => Math.max(max, s.section_order), -1);
    await supabase.from("songs").update({ section: sectionKey, section_order: maxOrder + 1, is_published: true }).eq("id", songId);
    setShowAddSongModal(false);
    fetchData();
  };

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
      </div>
    );
  }

  const musicSections = sections.filter((s) => SECTION_KEYS.includes(s.section_key));
  const currentSectionSongs = [...(sectionSongs[activeSectionKey] ?? [])].sort((a, b) => a.section_order - b.section_order);
  const songsNotInCurrentSection = allSongs.filter((s) => s.section !== activeSectionKey);

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

      {/* Music Section Song Management */}
      <div className="mb-8">
        <h2 className="mb-4 text-lg font-bold text-ink-50">Homepage Song Sections</h2>

        {/* Section tabs */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-base-600 bg-base-800 p-1 scrollbar-hide">
          {musicSections.map((section) => {
            const Icon = SECTION_ICONS[section.section_key] ?? Music;
            const isActive = activeSectionKey === section.section_key;
            return (
              <button
                key={section.id}
                onClick={() => setActiveSectionKey(section.section_key)}
                className={`flex shrink-0 items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition ${
                  isActive ? "bg-mint-500/10 text-mint-400" : "text-ink-300 hover:bg-base-700 hover:text-ink-100"
                }`}
              >
                <Icon size={14} />
                {section.title}
                <span className="text-xs text-ink-400">({(sectionSongs[section.section_key] ?? []).length})</span>
              </button>
            );
          })}
        </div>

        {/* Songs in the active section */}
        <div className="card p-4">
          <div className="mb-3 flex items-center justify-between">
            <h3 className="text-sm font-bold text-ink-50">
              Songs in {musicSections.find((s) => s.section_key === activeSectionKey)?.title ?? activeSectionKey}
            </h3>
            <button
              onClick={() => setShowAddSongModal(true)}
              className="btn-secondary text-xs"
              disabled={songsNotInCurrentSection.length === 0}
            >
              <Plus size={14} /> Add song to section
            </button>
          </div>

          {currentSectionSongs.length === 0 ? (
            <div className="flex flex-col items-center py-8 text-center">
              <Music className="mb-3 text-ink-400" size={28} />
              <p className="text-sm text-ink-400">No songs in this section yet. Use "Add song to section" to populate it.</p>
            </div>
          ) : (
            <div className="space-y-1">
              {currentSectionSongs.map((song, idx, arr) => (
                <div key={song.id} className="group flex items-center gap-3 rounded-lg border border-base-600 bg-base-800 p-3 transition hover:border-mint-700/50">
                  <div className="flex flex-col">
                    <button
                      onClick={() => moveSongInSection(song, "up")}
                      disabled={idx === 0}
                      className="text-ink-400 hover:text-mint-400 disabled:opacity-30"
                    >
                      <ArrowUp size={14} />
                    </button>
                    <button
                      onClick={() => moveSongInSection(song, "down")}
                      disabled={idx === arr.length - 1}
                      className="text-ink-400 hover:text-mint-400 disabled:opacity-30"
                    >
                      <ArrowDown size={14} />
                    </button>
                  </div>
                  <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-base-700">
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
                  <span className="text-xs text-ink-400">#{song.section_order}</span>
                  {song.is_published ? (
                    <span className="badge bg-success-500/10 text-success-500">Published</span>
                  ) : (
                    <span className="badge bg-ink-500/20 text-ink-300">Draft</span>
                  )}
                  <div className="flex gap-1 opacity-0 transition group-hover:opacity-100">
                    <button onClick={() => togglePublish(song)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-mint-400" title={song.is_published ? "Unpublish" : "Publish"}>
                      {song.is_published ? <Eye size={14} /> : <EyeOff size={14} />}
                    </button>
                    <button onClick={() => removeSongFromSection(song)} className="rounded p-2 text-ink-300 hover:bg-base-700 hover:text-danger-500" title="Remove from section">
                      <X size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Homepage Sections ordering */}
      <div>
        <h2 className="mb-4 text-lg font-bold text-ink-50">All Homepage Sections</h2>
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

      {/* Add Song to Section Modal */}
      {showAddSongModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4" onClick={() => setShowAddSongModal(false)}>
          <div className="card w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 animate-slide-up" onClick={(e) => e.stopPropagation()}>
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold text-ink-50">Add song to {musicSections.find((s) => s.section_key === activeSectionKey)?.title}</h2>
              <button onClick={() => setShowAddSongModal(false)} className="text-ink-400 hover:text-mint-400"><X size={20} /></button>
            </div>
            <div className="space-y-1">
              {songsNotInCurrentSection.length === 0 ? (
                <p className="py-4 text-center text-sm text-ink-400">All songs are already in this section, or no songs exist yet.</p>
              ) : (
                songsNotInCurrentSection.map((song) => (
                  <div key={song.id} className="group flex items-center gap-3 rounded-lg border border-base-600 bg-base-800 p-3 transition hover:border-mint-700/50">
                    <div className="h-9 w-9 shrink-0 overflow-hidden rounded bg-base-700">
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
                      <span className="badge bg-base-700 text-ink-300">{song.section}</span>
                    )}
                    <button
                      onClick={() => addSongToSection(song.id, activeSectionKey)}
                      className="rounded-lg bg-mint-500/20 px-3 py-1.5 text-xs font-medium text-mint-400 transition hover:bg-mint-500/30"
                    >
                      <Plus size={12} className="mr-1 inline" /> Add
                    </button>
                  </div>
                ))
              )}
            </div>
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
