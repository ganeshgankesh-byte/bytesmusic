/*
# BytesMusic Core Schema — Songs, Artists, Albums, Playlists, Homepage CMS

## Overview
Creates the full content-management schema for BytesMusic. The admin (technoproboizz@gmail.com only)
manages all content via the admin panel. Homepage sections are admin-controlled through
the `homepage_sections` table.

## New Tables

1. `artists` — Music artists
   - id (uuid PK)
   - name (text, unique, not null)
   - bio (text)
   - image_url (text)
   - created_at (timestamptz)

2. `albums` — Music albums
   - id (uuid PK)
   - title (text, not null)
   - artist_id (uuid FK → artists)
   - cover_url (text)
   - release_date (date)
   - created_at (timestamptz)

3. `songs` — Individual songs / tracks
   - id (uuid PK)
   - title (text, not null)
   - artist_id (uuid FK → artists)
   - album_id (uuid FK → albums, nullable)
   - video_id (text) — YouTube video ID for playback
   - cover_url (text)
   - audio_url (text) — optional direct audio URL
   - duration (text)
   - plays (integer, default 0)
   - section (text) — 'trending' | 'featured' | 'new_release' | 'popular' | NULL
   - section_order (integer, default 0) — ordering within homepage section
   - is_published (boolean, default true)
   - created_at (timestamptz)

4. `playlists` — Curated playlists
   - id (uuid PK)
   - title (text, not null)
   - description (text)
   - cover_url (text)
   - created_at (timestamptz)

5. `playlist_songs` — Join table: playlist ↔ songs (with order)
   - id (uuid PK)
   - playlist_id (uuid FK → playlists, CASCADE)
   - song_id (uuid FK → songs, CASCADE)
   - position (integer, default 0)

6. `homepage_sections` — Admin-controlled homepage layout
   - id (uuid PK)
   - section_key (text, unique) — 'trending' | 'featured' | 'new_releases' | 'popular' | 'featured_artists' | 'featured_albums' | 'playlists' | 'hero'
   - title (text, not null) — display title
   - subtitle (text)
   - is_active (boolean, default true)
   - display_order (integer, default 0)
   - config (jsonb) — section-specific config (e.g. hero image/text)

7. `hero_slides` — Hero/banner carousel slides
   - id (uuid PK)
   - title (text, not null)
   - subtitle (text)
   - image_url (text)
   - link_url (text)
   - display_order (integer, default 0)
   - is_active (boolean, default true)
   - created_at (timestamptz)

8. `user_history` — Listening history per user
   - id (uuid PK)
   - user_id (uuid FK → auth.users, CASCADE)
   - song_id (uuid FK → songs, CASCADE)
   - video_id (text)
   - title (text)
   - artist (text)
   - thumbnail (text)
   - created_at (timestamptz)

9. `user_likes` — Liked songs per user
   - id (uuid PK)
   - user_id (uuid FK → auth.users, CASCADE)
   - song_id (uuid FK → songs, CASCADE)
   - video_id (text)
   - title (text)
   - artist (text)
   - thumbnail (text)
   - created_at (timestamptz)
   - UNIQUE(user_id, song_id)

10. `admin_config` — Key-value config (admin email, etc.)
    - key (text PK)
    - value (text)

## Security (RLS)
- `artists`, `albums`, `songs`, `playlists`, `playlist_songs`, `homepage_sections`, `hero_slides`:
  - SELECT: public (anon + authenticated) — all site visitors see published content
  - INSERT/UPDATE/DELETE: authenticated only, must be admin (technoproboizz@gmail.com)
- `user_history`, `user_likes`: owner-scoped (auth.uid() = user_id)
- `admin_config`: SELECT authenticated admin only; INSERT/UPDATE/DELETE admin only

Admin checks use a SECURITY DEFINER function `is_admin()` that compares
auth.jwt() -> email >> to the admin email stored in admin_config, plus a hardcoded fallback.
*/

-- ─── Admin config ───
CREATE TABLE IF NOT EXISTS admin_config (
  key text PRIMARY KEY,
  value text NOT NULL
);

INSERT INTO admin_config (key, value) VALUES ('admin_email', 'technoproboizz@gmail.com')
ON CONFLICT (key) DO NOTHING;

-- ─── is_admin() function ───
CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (auth.jwt() -> 'email' ->> 'verified_email') = (
      SELECT value FROM admin_config WHERE key = 'admin_email'
    ),
    false
  );
$$;

-- ─── Artists ───
CREATE TABLE IF NOT EXISTS artists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  bio text,
  image_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE artists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_artists" ON artists;
CREATE POLICY "public_read_artists" ON artists FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_artists" ON artists;
CREATE POLICY "admin_insert_artists" ON artists FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_artists" ON artists;
CREATE POLICY "admin_update_artists" ON artists FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_artists" ON artists;
CREATE POLICY "admin_delete_artists" ON artists FOR DELETE
  TO authenticated USING (is_admin());

-- ─── Albums ───
CREATE TABLE IF NOT EXISTS albums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  cover_url text,
  release_date date,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE albums ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_albums" ON albums;
CREATE POLICY "public_read_albums" ON albums FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_albums" ON albums;
CREATE POLICY "admin_insert_albums" ON albums FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_albums" ON albums;
CREATE POLICY "admin_update_albums" ON albums FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_albums" ON albums;
CREATE POLICY "admin_delete_albums" ON albums FOR DELETE
  TO authenticated USING (is_admin());

-- ─── Songs ───
CREATE TABLE IF NOT EXISTS songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  artist_id uuid REFERENCES artists(id) ON DELETE SET NULL,
  album_id uuid REFERENCES albums(id) ON DELETE SET NULL,
  video_id text,
  cover_url text,
  audio_url text,
  duration text,
  plays integer DEFAULT 0,
  section text,
  section_order integer DEFAULT 0,
  is_published boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_songs" ON songs;
CREATE POLICY "public_read_songs" ON songs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_songs" ON songs;
CREATE POLICY "admin_insert_songs" ON songs FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_songs" ON songs;
CREATE POLICY "admin_update_songs" ON songs FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_songs" ON songs;
CREATE POLICY "admin_delete_songs" ON songs FOR DELETE
  TO authenticated USING (is_admin());

-- ─── Playlists ───
CREATE TABLE IF NOT EXISTS playlists (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  cover_url text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE playlists ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_playlists" ON playlists;
CREATE POLICY "public_read_playlists" ON playlists FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_playlists" ON playlists;
CREATE POLICY "admin_insert_playlists" ON playlists FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_playlists" ON playlists;
CREATE POLICY "admin_update_playlists" ON playlists FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_playlists" ON playlists;
CREATE POLICY "admin_delete_playlists" ON playlists FOR DELETE
  TO authenticated USING (is_admin());

-- ─── Playlist songs (join) ───
CREATE TABLE IF NOT EXISTS playlist_songs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  playlist_id uuid REFERENCES playlists(id) ON DELETE CASCADE,
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE,
  position integer DEFAULT 0
);
ALTER TABLE playlist_songs ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_playlist_songs" ON playlist_songs;
CREATE POLICY "public_read_playlist_songs" ON playlist_songs FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_playlist_songs" ON playlist_songs;
CREATE POLICY "admin_insert_playlist_songs" ON playlist_songs FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_playlist_songs" ON playlist_songs;
CREATE POLICY "admin_update_playlist_songs" ON playlist_songs FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_playlist_songs" ON playlist_songs;
CREATE POLICY "admin_delete_playlist_songs" ON playlist_songs FOR DELETE
  TO authenticated USING (is_admin());

-- ─── Homepage sections ───
CREATE TABLE IF NOT EXISTS homepage_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  section_key text UNIQUE NOT NULL,
  title text NOT NULL,
  subtitle text,
  is_active boolean DEFAULT true,
  display_order integer DEFAULT 0,
  config jsonb DEFAULT '{}'::jsonb
);
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_homepage_sections" ON homepage_sections;
CREATE POLICY "public_read_homepage_sections" ON homepage_sections FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_homepage_sections" ON homepage_sections;
CREATE POLICY "admin_insert_homepage_sections" ON homepage_sections FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_homepage_sections" ON homepage_sections;
CREATE POLICY "admin_update_homepage_sections" ON homepage_sections FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_homepage_sections" ON homepage_sections;
CREATE POLICY "admin_delete_homepage_sections" ON homepage_sections FOR DELETE
  TO authenticated USING (is_admin());

-- ─── Hero slides ───
CREATE TABLE IF NOT EXISTS hero_slides (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  subtitle text,
  image_url text,
  link_url text,
  display_order integer DEFAULT 0,
  is_active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE hero_slides ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "public_read_hero_slides" ON hero_slides;
CREATE POLICY "public_read_hero_slides" ON hero_slides FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "admin_insert_hero_slides" ON hero_slides;
CREATE POLICY "admin_insert_hero_slides" ON hero_slides FOR INSERT
  TO authenticated WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_update_hero_slides" ON hero_slides;
CREATE POLICY "admin_update_hero_slides" ON hero_slides FOR UPDATE
  TO authenticated USING (is_admin()) WITH CHECK (is_admin());

DROP POLICY IF EXISTS "admin_delete_hero_slides" ON hero_slides;
CREATE POLICY "admin_delete_hero_slides" ON hero_slides FOR DELETE
  TO authenticated USING (is_admin());

-- ─── User history ───
CREATE TABLE IF NOT EXISTS user_history (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE,
  video_id text,
  title text,
  artist text,
  thumbnail text,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE user_history ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_history" ON user_history;
CREATE POLICY "select_own_history" ON user_history FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_history" ON user_history;
CREATE POLICY "insert_own_history" ON user_history FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_history" ON user_history;
CREATE POLICY "delete_own_history" ON user_history FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── User likes ───
CREATE TABLE IF NOT EXISTS user_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid() REFERENCES auth.users(id) ON DELETE CASCADE,
  song_id uuid REFERENCES songs(id) ON DELETE CASCADE,
  video_id text,
  title text,
  artist text,
  thumbnail text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(user_id, song_id)
);
ALTER TABLE user_likes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "select_own_likes" ON user_likes;
CREATE POLICY "select_own_likes" ON user_likes FOR SELECT
  TO authenticated USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "insert_own_likes" ON user_likes;
CREATE POLICY "insert_own_likes" ON user_likes FOR INSERT
  TO authenticated WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "delete_own_likes" ON user_likes;
CREATE POLICY "delete_own_likes" ON user_likes FOR DELETE
  TO authenticated USING (auth.uid() = user_id);

-- ─── Indexes ───
CREATE INDEX IF NOT EXISTS idx_songs_section ON songs(section) WHERE section IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_songs_artist ON songs(artist_id);
CREATE INDEX IF NOT EXISTS idx_playlist_songs_playlist ON playlist_songs(playlist_id);
CREATE INDEX IF NOT EXISTS idx_user_history_user ON user_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_likes_user ON user_likes(user_id);
CREATE INDEX IF NOT EXISTS idx_homepage_sections_order ON homepage_sections(display_order);
CREATE INDEX IF NOT EXISTS idx_hero_slides_order ON hero_slides(display_order);
