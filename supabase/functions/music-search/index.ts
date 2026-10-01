// BytesMusic music search edge function
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

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
      return new Response(JSON.stringify({ results: [] }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (query.length > 200) {
      return new Response(JSON.stringify({ error: "Search query is too long." }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Use YouTube Innertube API (no key required) for music search
    const innertubeRes = await fetch(
      "https://www.youtube.com/youtubei/v1/search?key=AIzaSyAO_FJ2SlqU8Q4STEHLGCilw_Y9_11qcW8&prettyPrint=false",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          context: {
            client: {
              clientName: "WEB_REMIX",
              clientVersion: "1.20240401.01.00",
            },
          },
          query: query,
          params: "EgWKAQIIAWoKEAMQBBAFEAkYBA%3D%3D",
        }),
      }
    );

    if (!innertubeRes.ok) throw new Error("Search request failed");

    const innertubeData = await innertubeRes.json();
    const contents =
      innertubeData?.contents?.tabbedSearchResultsRenderer?.tabs?.[0]?.tabRenderer?.content
        ?.sectionListRenderer?.contents ?? [];

    const results: { videoId: string; title: string; artist: string; duration: string; thumbnail: string }[] = [];

    for (const section of contents) {
      const items = section?.musicShelfRenderer?.contents ?? [];
      for (const item of items) {
        const song = item?.musicResponsiveListItemRenderer;
        if (!song) continue;

        const overlay =
          song?.thumbnailOverlay?.musicItemThumbnailOverlayRenderer?.content?.musicPlayButtonRenderer
            ?.playNavigationEndpoint?.watchEndpoint;
        const videoId = overlay?.videoId;
        if (!videoId) continue;

        const title =
          song?.flexColumns?.[0]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs?.[0]?.text ??
          "Unknown";
        const artistRuns =
          song?.flexColumns?.[1]?.musicResponsiveListItemFlexColumnRenderer?.text?.runs ?? [];
        const artist =
          artistRuns
            .filter((r: any) => r?.text)
            .map((r: any) => r.text)
            .join(" ")
            .trim() || "Unknown";
        const thumbnail =
          song?.thumbnail?.musicThumbnailRenderer?.thumbnail?.thumbnails?.pop()?.url ?? "";
        const duration =
          song?.fixedColumns?.[0]?.musicResponsiveListItemFixedColumnRenderer?.text?.simpleText ?? "";

        results.push({ videoId, title, artist, duration, thumbnail });
      }
    }

    return new Response(JSON.stringify({ results: results.slice(0, 25) }), {
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
