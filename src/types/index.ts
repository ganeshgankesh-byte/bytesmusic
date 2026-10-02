export interface Artist {
  id: string;
  name: string;
  bio: string | null;
  image_url: string | null;
  created_at: string;
}

export interface Album {
  id: string;
  title: string;
  artist_id: string | null;
  cover_url: string | null;
  release_date: string | null;
  created_at: string;
  artist?: Artist | null;
}

export interface Song {
  id: string;
  title: string;
  artist_id: string | null;
  album_id: string | null;
  video_id: string | null;
  cover_url: string | null;
  audio_url: string | null;
  duration: string | null;
  plays: number;
  section: string | null;
  section_order: number;
  is_published: boolean;
  created_at: string;
  artist?: Artist | null;
  album?: Album | null;
}

export interface Playlist {
  id: string;
  title: string;
  description: string | null;
  cover_url: string | null;
  created_at: string;
}

export interface PlaylistSong {
  id: string;
  playlist_id: string;
  song_id: string;
  position: number;
  song?: Song;
}

export interface HomepageSection {
  id: string;
  section_key: string;
  title: string;
  subtitle: string | null;
  is_active: boolean;
  display_order: number;
  config: Record<string, unknown>;
}

export interface HeroSlide {
  id: string;
  title: string;
  subtitle: string | null;
  image_url: string | null;
  link_url: string | null;
  display_order: number;
  is_active: boolean;
}

export interface SearchTrack {
  videoId: string;
  title: string;
  artist: string;
  duration: string;
  thumbnail: string;
}

export interface YouTubeResult {
  videoId: string;
  title: string;
  channel: string;
  thumbnail: string;
}

export type QueueItem = Song | SearchTrack | YouTubeResult;

export function isSong(item: QueueItem): item is Song {
  return (item as Song).id !== undefined;
}

export function isYouTubeResult(item: QueueItem): item is YouTubeResult {
  return !isSong(item) && (item as YouTubeResult).channel !== undefined;
}
