# ExploreX

AI-powered travel explorer, planner, and map-based discovery platform.

## Stack

- React + Vite + TypeScript
- Tailwind CSS + shadcn-style UI components
- React Router, React Query, Framer Motion
- Leaflet + MapTiler tiles
- Supabase (Auth + Postgres)
- Wikipedia + OpenStreetMap (Overpass)
- Open-Meteo weather
- Bytez (OpenAI-compatible) via `/api/chat` proxy on Vercel

## Setup

1) Install deps

```bash
npm install
```

2) Create env file

```bash
cp .env.example .env.local
```

Fill:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_MAPTILER_KEY` (optional; enables Street/Satellite/Hybrid/Dark MapTiler tiles)

3) Supabase DB

- Create a Supabase project
- In the SQL editor, run `supabase/schema.sql`
- In Supabase Auth → Providers:
  - Enable Email
  - (Optional) Enable Google OAuth and add redirect URL: `http://localhost:5173`

4) Run dev server

```bash
npm run dev
```

## AI (Bytez recommended)

For production, do **not** ship `VITE_GROQ_API_KEY` (client-side keys are public).
For Bytez, keep `BYTEZ_KEY` server-side.

Local dev also uses `/api/chat` via a Vite dev-server middleware (see `vite.config.ts`), so you can set `BYTEZ_KEY` in `.env.local` and keep the key off the client.

On Vercel, set:
- `BYTEZ_KEY` (server-side)
- plus the `VITE_*` env vars for the client

The app calls `/api/chat` by default (see `api/chat.js`). `api/groq.js` remains as an optional alternative.

## Deploy (Vercel)

- Framework preset: Vite
- Build: `npm run build`
- Output: `dist`

## Internal API endpoints

The UI calls these same-origin endpoints (with in-memory TTL cache, rate limits, and timeouts):

- `GET /api/wiki?place=...` → title, summary, thumbnail, coordinates
- `GET /api/search?query=...` → search suggestions/results
- `GET /api/weather?lat=..&lon=..` → Open-Meteo current + hourly bundle
- `GET /api/nearby?lat=..&lon=..&radius=4500` → Overpass POIs (attractions/parks/temples/historic)

## Maps (Street / Satellite / Hybrid)

The Map page lets you switch base maps. With MapTiler, set `VITE_MAPTILER_KEY` and (optionally) override style IDs:
- `VITE_MAPTILER_STYLE_STREETS` (default `streets`)
- `VITE_MAPTILER_STYLE_SATELLITE` (default `satellite`)
- `VITE_MAPTILER_STYLE_HYBRID` (default `hybrid`)
- `VITE_MAPTILER_STYLE_DARK` (default `darkmatter`)
# ExploreT
