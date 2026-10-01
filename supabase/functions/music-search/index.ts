// BytesMusic music search edge function
// Searches the BytesMusic database (songs, artists, albums) directly
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "npm:@supabase/supabase-js@2.45.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q")?.trim();

    if (!query) {
      return new Response(JSON.stringify({ results: [], artists: [], albums: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (query.length > 200) {
      return new Response(JSON.stringify({ error: "Search query is too long." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? Deno.env.get("SUPABASE_ANON_KEY") ?? "";
    const supabase = createClient(supabaseUrl, supabaseKey);

    const pattern = `%${query}%`;

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

    return new Response(JSON.stringify({
      results: songsRes.data ?? [],
      artists: artistsRes.data ?? [],
      albums: albumsRes.data ?? [],
    }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(
      JSON.stringify({ error: "Search failed. Please try again." }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
