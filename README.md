# 2008-Style Facebook Wall (`wall-demo`)

A nostalgic 2008-style Facebook Wall built with **React 19**, **Next.js 15 (App Router)**, **Tailwind CSS**, **shadcn/ui**, and **Supabase** (with automatic `localStorage` persistence for zero-config local testing).

## Features

- **Working Message Input (280-Character Limit)** with live character counter (`0 / 280`) and keyboard shortcut (`Ctrl+Enter` / `Cmd+Enter`).
- **Image Uploads** via file picker or drag-and-drop, with instant preview, client-side compression, and click-to-zoom lightbox in the feed.
- **Live Reverse-Chronological Feed** (newest first) pre-seeded with the 6 original posts from the Greg Wientjes Wall reference UI.
- **Persistent LocalStorage Mode (Default)** — refreshes keep your shared posts intact, and a **Reset Demo** button in the top `wall` bar restores the initial 6 seed posts anytime.
- **Supabase Ready** — automatically switches to live Supabase Postgres + Storage + Realtime when `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` are configured.

## Getting Started Locally

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser.

## Connecting to Supabase (When Ready)

1. Run the SQL migration in [supabase/schema.sql](./supabase/schema.sql) inside your Supabase SQL Editor.
2. Copy [.env.example](./.env.example) to `.env.local` and fill in your project credentials:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
   NEXT_PUBLIC_STORAGE_BUCKET=wall-images
   ```
3. Restart `npm run dev` — the header badge will automatically switch from **LocalStorage Mode** to **Supabase Live**.
