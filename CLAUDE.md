# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where players compete for points on retro arcade games. Next.js app backed by Supabase. Built with Spec Driven Design: each feature is a numbered spec in `specs/`, authored with `/spec` and implemented with `/spec-impl`.

Currently integrated games: **Asteroids, Tetris, Arkanoid, Snake** (canvas/JS vanilla, hosted in `public/games/<slug>/`). Each has a library card, detail page, playable page, and Supabase-backed leaderboard.

## Stack & Versions

| Package      | Version                                             | Notes                                                                                        |
| ------------ | --------------------------------------------------- | -------------------------------------------------------------------------------------------- |
| Next.js      | 16.2.10                                             | **Breaking changes** — read `node_modules/next/dist/docs/` before writing any Next.js code   |
| React        | 19.2.4                                              | Server Components default in App Router                                                      |
| Tailwind CSS | 4.x                                                 | `@import "tailwindcss"` syntax, `@theme inline` for CSS vars — NOT v3 `@tailwind` directives |
| TypeScript   | 5.x                                                 | Strict mode                                                                                  |
| Supabase     | `@supabase/ssr` 0.12, `@supabase/supabase-js` 2.110 | SSR auth + Postgres (games, scores, RLS)                                                     |
| Resend       | 6.x                                                 | Contact form email (`app/api/contact/route.ts`)                                              |

## Skills

- **`/frontend-design`** — use always when designing/reshaping UI.
- **`/spec`** — author a numbered spec in `specs/`.
- **`/spec-impl`** — implement a spec step by step (mark each check, don't skip steps without explicit OK).
- **`/add-game`** — generate a spec to integrate a new canvas/JS game with leaderboard + platform HUD, following the Asteroids pattern. Produces a spec, does not write code.

## Agents

- **`game-planner`** — upstream de `/add-game`. Sugiere el próximo juego retro que encaja con la plataforma, sin repetir sugerencias previas. Mantiene historial en `references/suggested_games.md`.
- **`game-jam`** — dado un TEMA, elige un juego retro autónomamente y genera 2 specs completos en `specs/game-jam/{game-id}/` (mecánica + plataforma/leaderboard). Lee historial para no repetir.
- **`skin-designer`** — dado el slug de un juego, implementa directamente ≥3 skins (`classic`, `retro`, `neon` + extras) en `game.js` y añade el selector en `play/page.tsx`. Mantiene estado en `references/game_with_thene.md`. Aplica cambios reales, no genera specs.
- **`game-performance`** — dado el slug de un juego, audita su rendimiento contra el patrón del spec 12 (offscreen canvas, dirty flag, indexación O(1), cero allocations/useState por frame, cleanup de RAF/timers) y aplica los arreglos directamente en el archivo del juego. 1 juego por run. Aplica cambios reales, no genera specs.

## MCP

- **supabase** (`.mcp.json`) — HTTP server for the linked project. Use `list_tables` before schema changes; `get_logs`/`get_advisors` before debugging fixes.

## Architecture

- **Router**: App Router only (`app/` directory). No Pages Router.
- **Root layout** (`app/layout.tsx`): wraps everything in `UserProvider`, renders global `Nav` + footer, and the `av-bg` / `av-noise` background layers.
- **Fonts**: retro pixel `Press_Start_2P` (`--font-pixel`) + `JetBrains_Mono` (`--font-mono`) via `next/font/google`. **Not Geist.**
- **Styling**: Tailwind v4 via `postcss.config.mjs`. Design tokens + retro utility classes (`av-*`, `cover-*`, `btn`, `pixel`, `mono`) live in `globals.css` (`@theme inline`), not `tailwind.config`.

### Supabase

- Clients in `utils/supabase/`: `client.ts` (browser) and `server.ts` (Server Components / route handlers).
- **`proxy.ts`** (repo root) is the Next.js 16 middleware — renamed from `middleware.ts` for 16 compatibility. Refreshes the auth session on every request.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` (see `.env.template`).
- **Data model**: `games` (slug, best_score, stats) and `scores` (game_id, player_name, score) tables with RLS; RPC `increment_game_stats(p_game_id, p_score)`.
- Reads use the server client (Server Components); score inserts use the browser client from play pages.

### Games & pages

- **Game code**: `public/games/<slug>/game.js` (+ optional `levels.js`, `assets/`, sprite sheets). Served statically, loaded via `<script>` in the play page.
- **Routes**: `/games` (library grid), `/games/<slug>` (detail + leaderboard), `/games/<slug>/play` (canvas + HUD + score save). `/hall` is the salón de la fama (global leaderboard). `/auth` login, `/about`, contact via `/api/contact`.
- **Integration contract** (React ↔ canvas via `window`, applied by `/add-game`): `game.js` wrapped in an IIFE; loop reads `window.gamePaused`; each tick writes `window.gameState = { score, lives, level, gameOver }`; game over fires `CustomEvent("gameOver", { detail: { score } })` once (flag-guarded). Canvas must have `id="canvas"`.
- **References**: `references/started-games/` holds raw game sources; `references/templates/` and `references/source-assets/` hold reusable pieces. Play/detail templates: `app/games/asteroids/play/page.tsx` and `app/games/asteroids/page.tsx`.

## Critical: Next.js 16 Differences

Next.js 16 has breaking API changes from versions in Claude's training data. Before writing routing, data-fetching, image, metadata, or server action code, read the relevant guide:

```
node_modules/next/dist/docs/01-app/      # App Router guides + API reference
node_modules/next/dist/docs/index.md     # overview
```

## Tailwind v4 Differences

- CSS entry: `@import "tailwindcss"` (not `@tailwind base/components/utilities`)
- Custom tokens: `@theme inline { --color-*: ...; }` block in CSS (not `tailwind.config.js` `theme.extend`)
- No `tailwind.config.ts` file needed for basic setup
