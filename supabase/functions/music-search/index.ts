// BytesMusic music search edge function
// 1. Searches the BytesMusic database (songs, artists, albums)
// 2. Searches YouTube via the official YouTube Data API v3 (server-side only)
// The YouTube API key is read from the YOUTUBE_API_KEY secret — never exposed to the frontend.
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

interface YouTubeResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

async function searchYouTube(query: string): Promise<YouTubeResult[]> {
  const apiKey = Deno.env.get("YOUTUBE_API_KEY");
  if (!apiKey) return [];

  const url =
    `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10` +
    `&maxResults=15&q=${encodeURIComponent(query)}&key=${apiKey}`;

  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.text();
    console.error(`YouTube API error ${res.status}: ${body}`);
    return [];
  }

  const data = await res.json();
  return (data.items ?? [])
    .filter((item: any) => item.id?.videoId)
    .map((item: any) => ({
      videoId: item.id.videoId as string,
      title: item.snippet?.title ?? "Unknown",
      channel: item.snippet?.channelTitle ?? "Unknown",
      thumbnail:
        item.snippet?.thumbnails?.medium?.url ??
        item.snippet?.thumbnails?.default?.url ??
        "",
    }));
}

async function searchLocalDb(supabase: any, pattern: string) {
  const [songsRes, artistsRes, albumsRes] = await Promise.all([
    supabase
      .from("songs")
      .select("*, artist:artists(*)")
      .ilike("title", pattern)
      .eq("is_published", true)
      .order("plays", { ascending: false })
      .limit(25),
    supabase
      .from("artists")
      .select("*")
      .ilike("name", pattern)
      .limit(10),
    supabase
      .from("albums")
      .select("*, artist:artists(*)")
      .ilike("title", pattern)
      .limit(10),
  ]);

  return {
    songs: songsRes.data ?? [],
    artists: artistsRes.data ?? [],
    albums: albumsRes.data ?? [],
  };
}

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim();

    if (!query) {
      return new Response(
        JSON.stringify({ songs: [], artists: [], albums: [], youtube: [] }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    if (query.length > 200) {
      return new Response(
        JSON.stringify({ error: "Search query is too long." }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey =
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ??
      Deno.env.get("SUPABASE_ANON_KEY") ??
      "";
    const supabase = createClient(supabaseUrl, supabaseKey);
    const pattern = `%${query}%`;

    // Run local DB search and YouTube search in parallel.
    // If YouTube fails (quota, network, missing key), local results still return.
    const [localResults, youtubeResults] = await Promise.all([
      searchLocalDb(supabase, pattern),
      searchYouTube(query).catch((err) => {
        console.error("YouTube search failed:", err);
        return [] as YouTubeResult[];
      }),
    ]);

    return new Response(
      JSON.stringify({
        songs: localResults.songs,
        artists: localResults.artists,
        albums: localResults.albums,
        youtube: youtubeResults,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Search failed. Please try again." }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
