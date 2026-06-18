# fuckspotify

A local-first music player built with React, Vite, and Express. It currently supports search and playback through JioSaavn, synced lyrics through LRCLIB, playlists and favorites in local storage, a live radio stream, Media Session controls, and PWA installation.

## Requirements

- Node.js 20 or newer
- npm

## Local development

Install both workspaces:

```bash
npm install
npm install --prefix api
```

Start the API in one terminal:

```bash
npm run dev:api
```

Start the frontend in another terminal:

```bash
npm run dev
```

Open `http://localhost:5173`. Vite proxies `/api` requests to the API at `http://localhost:3001`.

## Quality checks

```bash
npm run check
```

This runs ESLint, the Node test suite, and a production Vite build.

## Configuration

The API accepts these optional environment variables:

- `PORT`: standalone API port, default `3001`.
- `CORS_ORIGIN`: comma-separated allowed browser origins. Defaults to the two local Vite origins.
- `VERCEL`: set automatically by Vercel; prevents the serverless function from opening a standalone listener.

## Structure

- `src/App.jsx`: application views and player orchestration.
- `src/lib/player.js`: tested pure player and lyrics helpers.
- `api/index.js`: search, audio, playlist-import, and lyrics endpoints.
- `tests/`: player unit tests and API validation tests.

Favorites, playlists, and the last selected track are stored in the browser. There is no user account or cloud synchronization yet.
