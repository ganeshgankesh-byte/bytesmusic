# BytesMusic

### A modern open-source music platform with a full admin CMS.

**BytesMusic** is a modern web music platform built with React, Vite, and Supabase. It features music search, playback, queuing, history, likes, and a complete admin panel for managing all site content.

> **Search music. Play it. Build a queue. Keep your history. Discover more.**

---

## Features

### Music discovery
- Search the YouTube Music catalog via a serverless edge function
- Supports international music — Hindi, Punjabi, Tamil, Telugu, English, and more
- No Google Cloud API key required

### Playback
- YouTube's official embedded player
- Play songs directly from search results or admin-curated content
- Previous / next controls
- Persistent bottom player bar
- Volume control
- Shuffle
- Repeat (off / all / one)
- Up Next queue

### Personal library
- Like songs
- Listening history
- Queue management
- Account system via Supabase Auth (email/password)

### Admin Panel (CMS)
- Secure admin panel at `/admin`
- Only `technoproboizz@gmail.com` has admin access
- Admin enforced at the database level via RLS policies and a `is_admin()` SQL function
- Manage songs, artists, albums, and playlists
- Add, edit, delete, search and filter all content
- Control homepage sections: Trending, Featured, New Releases, Popular, Featured Artists, Featured Albums, Playlists
- Manage hero/banner slides
- Reorder homepage sections
- Toggle section visibility
- Dashboard with platform statistics

---

## Design

BytesMusic features a deep green/black interface with neon mint accents, minimal typography, and a YouTube Music-inspired information architecture.

---

## Architecture

```text
┌──────────────────────────────┐
│       BytesMusic UI          │
│    React + Vite + Tailwind   │
└──────────────┬───────────────┘
               │
               ▼
┌──────────────────────────────┐
│        Supabase              │
│   Auth + Database + RLS      │
│   + Edge Functions           │
└──────┬──────────┬────────────┘
       │          │
       ▼          ▼
┌──────────────┐ ┌──────────────┐
│  YouTube     │ │  Supabase    │
│  Embedded    │ │  Postgres    │
│  Player      │ │  CMS tables  │
└──────────────┘ └──────────────┘
```

BytesMusic does **not** download, extract, or re-host YouTube audio.

---

## Getting Started

### Requirements

- Node.js 18+
- A modern browser

### 1. Install dependencies

```bash
npm install
```

### 2. Start the dev server

```bash
npm run dev
```

### 3. Open the app

```
http://localhost:5173
```

---

## Admin Access

The admin panel is at `/admin`. Only the email `technoproboizz@gmail.com` can access it.

1. Create an account with the email `technoproboizz@gmail.com`
2. Navigate to `/admin`
3. Manage all site content from the admin dashboard

Admin access is enforced at three levels:
- **Frontend**: React router guard checks `user.email === admin_email`
- **Database RLS**: All CMS tables have INSERT/UPDATE/DELETE policies that call `is_admin()`
- **SQL function**: `is_admin()` compares the authenticated user's JWT email against the admin email stored in `admin_config`

---

## Project Structure

```text
BytesMusic/
├── src/
│   ├── components/
│   │   ├── Layout.tsx
│   │   ├── Sidebar.tsx
│   │   ├── PlayerBar.tsx
│   │   └── SongCard.tsx
│   ├── context/
│   │   ├── AuthContext.tsx
│   │   └── PlayerContext.tsx
│   ├── lib/
│   │   └── supabase.ts
│   ├── pages/
│   │   ├── Home.tsx
│   │   ├── Search.tsx
│   │   ├── History.tsx
│   │   ├── Likes.tsx
│   │   ├── Login.tsx
│   │   ├── Register.tsx
│   │   ├── PlaylistPage.tsx
│   │   ├── NotFound.tsx
│   │   └── admin/
│   │       ├── AdminLayout.tsx
│   │       ├── AdminDashboard.tsx
│   │       ├── AdminSongs.tsx
│   │       ├── AdminArtists.tsx
│   │       ├── AdminAlbums.tsx
│   │       ├── AdminPlaylists.tsx
│   │       ├── AdminUsers.tsx
│   │       └── AdminHomepage.tsx
│   ├── types/
│   │   └── index.ts
│   ├── App.tsx
│   ├── main.tsx
│   └── index.css
├── supabase/
│   ├── config.toml
│   └── functions/
│       └── music-search/
│           └── index.ts
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── vite.config.ts
├── tsconfig.json
├── tailwind.config.js
└── postcss.config.js
```

---

## Security

- All CMS tables (songs, artists, albums, playlists, homepage_sections, hero_slides) are publicly readable but admin-only for writes
- `is_admin()` SQL function checks the authenticated user's email against the admin email in `admin_config`
- RLS policies on every table enforce ownership and admin checks at the database level
- User history and likes are owner-scoped via `auth.uid()`

---

## Important

BytesMusic is an independent open-source project.

It is **not affiliated with, endorsed by, or sponsored by YouTube or Google**.

YouTube playback is provided through YouTube's official embedded player.

BytesMusic does not:

- Download YouTube audio
- Re-host YouTube audio
- Circumvent YouTube playback restrictions
- Provide DRM bypass functionality

---

## License

Released under the [MIT License](LICENSE).

---

<p align="center">
  <strong>BytesMusic</strong><br>
  Open music. Your way.
</p>
