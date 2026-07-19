# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where players compete for points. Early-stage Next.js app. Uses Spec Driven Design via `/spec` and `/spec-impl` skills.

## Commands

```bash
npm run dev      # dev server (localhost:3000)
npm run build    # production build
npm run lint     # ESLint v9
npm run start    # production server (after build)
```

## Stack & Versions

| Package | Version | Notes |
|---|---|---|
| Next.js | 16.2.10 | **Breaking changes** — read `node_modules/next/dist/docs/` before writing any Next.js code |
| React | 19.2.4 | Server Components default in App Router |
| Tailwind CSS | 4.x | `@import "tailwindcss"` syntax, `@theme inline` for CSS vars — NOT v3 `@tailwind` directives |
| TypeScript | 5.x | Strict mode |

## Architecture

- **Router**: App Router only (`app/` directory). No Pages Router.
- **Layouts**: `app/layout.tsx` is the root layout with Geist fonts and full-height flex body.
- **Styling**: Tailwind v4 configured via `postcss.config.mjs`. Custom design tokens defined with `@theme inline` in `globals.css`, not `tailwind.config`.
- **Fonts**: Geist Sans + Geist Mono via `next/font/google`, exposed as CSS variables `--font-geist-sans` / `--font-geist-mono`.

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
