import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";
import type { Song, Artist, Album, Playlist, HomepageSection, HeroSlide } from "../types";
import { SongCard } from "../components/SongCard";
import { Play } from "lucide-react";

export default function Home() {
  const [sections, setSections] = useState<HomepageSection[]>([]);
  const [songsBySection, setSongsBySection] = useState<Record<string, Song[]>>({});
  const [artists, setArtists] = useState<Artist[]>([]);
  const [albums, setAlbums] = useState<Album[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [heroSlides, setHeroSlides] = useState<HeroSlide[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      const [{ data: secs }, { data: slides }] = await Promise.all([
        supabase.from("homepage_sections").select("*").eq("is_active", true).order("display_order"),
        supabase.from("hero_slides").select("*").eq("is_active", true).order("display_order"),
      ]);

      const activeSections = secs ?? [];
      setSections(activeSections);
      setHeroSlides(slides ?? []);

      const sectionSongMap: Record<string, Song[]> = {};
      await Promise.all(
        activeSections
          .filter((s) => ["trending", "featured", "new_releases", "popular"].includes(s.section_key))
          .map(async (s) => {
            const sectionField =
              s.section_key === "new_releases" ? "new_release" : s.section_key === "trending" ? "trending" : s.section_key;
            const { data } = await supabase
              .from("songs")
              .select("*, artist:artists(*)")
              .eq("section", sectionField)
              .eq("is_published", true)
              .order("section_order")
              .limit(12);
            sectionSongMap[s.section_key] = data ?? [];
          })
      );
      setSongsBySection(sectionSongMap);

      const [{ data: art }, { data: alb }, { data: pl }] = await Promise.all([
        supabase.from("artists").select("*").order("created_at", { ascending: false }).limit(8),
        supabase.from("albums").select("*, artist:artists(*)").order("created_at", { ascending: false }).limit(8),
        supabase.from("playlists").select("*").order("created_at", { ascending: false }).limit(8),
      ]);
      setArtists(art ?? []);
      setAlbums(alb ?? []);
      setPlaylists(pl ?? []);

      setLoading(false);
    })();
  }, []);

  if (loading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-3 h-8 w-8 animate-spin rounded-full border-2 border-mint-500 border-t-transparent" />
          <p className="text-sm text-ink-400">Loading BytesMusic…</p>
        </div>
      </div>
    );
  }

  const hasNoContent =
    Object.values(songsBySection).every((s) => s.length === 0) &&
    artists.length === 0 &&
    albums.length === 0 &&
    playlists.length === 0;

  return (
    <div className="animate-fade-in">
      {/* Hero */}
      {sections.find((s) => s.section_key === "hero") && (
        <section className="relative mb-8 overflow-hidden">
          <div className="relative h-64 sm:h-80 lg:h-96">
            {heroSlides.length > 0 ? (
              <div className="relative h-full w-full">
                <img
                  src={heroSlides[0].image_url ?? ""}
                  alt=""
                  className="h-full w-full object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-base-900 via-base-900/60 to-transparent" />
                <div className="absolute bottom-0 left-0 p-6 sm:p-8 lg:p-10">
                  <h1 className="mb-2 text-3xl font-bold text-ink-50 sm:text-4xl lg:text-5xl">
                    {heroSlides[0].title}
                  </h1>
                  <p className="mb-4 max-w-lg text-sm text-ink-200 sm:text-base">
                    {heroSlides[0].subtitle}
                  </p>
                </div>
              </div>
            ) : (
              <div className="relative flex h-full flex-col items-center justify-center bg-gradient-to-br from-base-800 via-base-700 to-base-800">
                <div className="absolute inset-0 opacity-20" style={{
                  backgroundImage: "radial-gradient(circle at 30% 50%, rgba(255,255,255,0.08), transparent 50%), radial-gradient(circle at 70% 50%, rgba(255,255,255,0.04), transparent 50%)"
                }} />
                <div className="relative z-10 text-center">
                  <h1 className="mb-2 text-3xl font-bold text-ink-50 sm:text-4xl lg:text-5xl">
                    Welcome to <span className="text-mint-500">BytesMusic</span>
                  </h1>
                  <p className="text-sm text-ink-300 sm:text-base">Open music. Your way.</p>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      <div className="px-4 sm:px-6 lg:px-8">
        {hasNoContent && (
          <div className="card flex flex-col items-center justify-center p-12 text-center">
            <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-mint-500/10">
              <Play className="text-mint-500" size={28} />
            </div>
            <h2 className="mb-2 text-lg font-bold text-ink-50">No content yet</h2>
            <p className="max-w-md text-sm text-ink-400">
              The admin hasn't added any songs, artists, or playlists yet. Check back soon!
            </p>
          </div>
        )}

        {sections
          .filter((s) => s.section_key !== "hero")
          .map((section) => {
            if (["trending", "featured", "new_releases", "popular"].includes(section.section_key)) {
              const songs = songsBySection[section.section_key] ?? [];
              if (songs.length === 0) return null;
              return (
                <section key={section.id} className="mb-10">
                  <div className="mb-4">
                    <h2 className="section-title">{section.title}</h2>
                    {section.subtitle && <p className="mt-1 text-sm text-ink-400">{section.subtitle}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {songs.map((song) => (
                      <SongCard key={song.id} song={song} queue={songs} />
                    ))}
                  </div>
                </section>
              );
            }

            if (section.section_key === "featured_artists") {
              if (artists.length === 0) return null;
              return (
                <section key={section.id} className="mb-10">
                  <div className="mb-4">
                    <h2 className="section-title">{section.title}</h2>
                    {section.subtitle && <p className="mt-1 text-sm text-ink-400">{section.subtitle}</p>}
                  </div>
                  <div className="flex gap-4 overflow-x-auto scrollbar-hide pb-2">
                    {artists.map((artist) => (
                      <div key={artist.id} className="shrink-0 w-36 text-center sm:w-40">
                        <div className="mx-auto mb-3 h-28 w-28 overflow-hidden rounded-full bg-base-700 sm:h-32 sm:w-32">
                          {artist.image_url && (
                            <img src={artist.image_url} alt={artist.name} className="h-full w-full object-cover" />
                          )}
                        </div>
                        <h3 className="truncate text-sm font-semibold text-ink-50">{artist.name}</h3>
                        <p className="truncate text-xs text-ink-400">Artist</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (section.section_key === "featured_albums") {
              if (albums.length === 0) return null;
              return (
                <section key={section.id} className="mb-10">
                  <div className="mb-4">
                    <h2 className="section-title">{section.title}</h2>
                    {section.subtitle && <p className="mt-1 text-sm text-ink-400">{section.subtitle}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {albums.map((album) => (
                      <div key={album.id} className="card card-hover group cursor-pointer p-3">
                        <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-base-700">
                          {album.cover_url ? (
                            <img src={album.cover_url} alt={album.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-400">
                              <Play size={28} />
                            </div>
                          )}
                        </div>
                        <h3 className="truncate text-sm font-semibold text-ink-50">{album.title}</h3>
                        <p className="truncate text-xs text-ink-400">{album.artist?.name ?? "Unknown"}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            if (section.section_key === "playlists") {
              if (playlists.length === 0) return null;
              return (
                <section key={section.id} className="mb-10">
                  <div className="mb-4">
                    <h2 className="section-title">{section.title}</h2>
                    {section.subtitle && <p className="mt-1 text-sm text-ink-400">{section.subtitle}</p>}
                  </div>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
                    {playlists.map((pl) => (
                      <div key={pl.id} className="card card-hover group cursor-pointer p-3">
                        <div className="relative mb-3 aspect-square w-full overflow-hidden rounded-lg bg-base-700">
                          {pl.cover_url ? (
                            <img src={pl.cover_url} alt={pl.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                          ) : (
                            <div className="flex h-full w-full items-center justify-center text-ink-400">
                              <Play size={28} />
                            </div>
                          )}
                        </div>
                        <h3 className="truncate text-sm font-semibold text-ink-50">{pl.title}</h3>
                        <p className="truncate text-xs text-ink-400">{pl.description ?? "Playlist"}</p>
                      </div>
                    ))}
                  </div>
                </section>
              );
            }

            return null;
          })}
      </div>
    </div>
  );
}
