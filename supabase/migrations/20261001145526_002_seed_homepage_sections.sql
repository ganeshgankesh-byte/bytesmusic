/*
# Seed Default Homepage Sections

Inserts the 8 default homepage sections with display ordering.
These control what appears on the BytesMusic homepage and in what order.
*/

INSERT INTO homepage_sections (section_key, title, subtitle, is_active, display_order, config) VALUES
  ('hero', 'Welcome to BytesMusic', 'Open music. Your way.', true, 0, '{}'::jsonb),
  ('trending', 'Trending Songs', 'What everyone is listening to right now', true, 1, '{}'::jsonb),
  ('featured', 'Featured Songs', 'Hand-picked tracks by our editors', true, 2, '{}'::jsonb),
  ('new_releases', 'New Releases', 'Fresh drops from around the world', true, 3, '{}'::jsonb),
  ('popular', 'Popular Songs', 'The most played tracks on BytesMusic', true, 4, '{}'::jsonb),
  ('featured_artists', 'Featured Artists', 'Discover artists you should know', true, 5, '{}'::jsonb),
  ('featured_albums', 'Featured Albums', 'Curated album picks', true, 6, '{}'::jsonb),
  ('playlists', 'Playlists', 'Curated playlists for every mood', true, 7, '{}'::jsonb)
ON CONFLICT (section_key) DO NOTHING;
