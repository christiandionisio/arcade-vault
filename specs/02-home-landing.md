---
spec: 02-home-landing
title: Home Landing Page — Arcade Vault
state: implementado
date: 2026-07-24
objective: Crear la landing page en `/` basada en el template home.jsx y mover la biblioteca a `/games`.
dependencies: 01-mvp-visual
---

## Alcance

**Dentro:**
- Nueva ruta `/` → `app/page.tsx` reemplazada con la home landing page
- Mover biblioteca actual de `app/page.tsx` → `app/games/page.tsx`
- Secciones de la home: Hero, ¿Por qué Arcade Vault?, Juegos disponibles (mini-rail 6 juegos), Stats, Actividad en vivo (datos mock), Pricing, CTA final
- Componente `FloatingSilhouettes` (SVGs decorativos pixel art en el hero)
- Hook `useReveal` con `IntersectionObserver` para animaciones scroll
- Estilos home (`.home`, `.home-hero`, `.home-silos`, `.home-section`, `.mini-rail`, etc.) añadidos a `app/globals.css`
- Nav actualizado: añadir enlace "INICIO" → `/` y cambiar enlace biblioteca a "JUEGOS" → `/games`

**Fuera:**
- Página `/about`
- Datos reales de actividad en vivo (quedan hardcodeados)
- Lógica de juego o puntuaciones reales
- Cualquier cambio a rutas existentes distintas de `app/page.tsx` y Nav

## Plan de implementación

1. **`app/games/page.tsx`** — mover contenido actual de `app/page.tsx` (biblioteca) a esta nueva ruta; ajustar enlaces internos de `/` → `/games` donde aplique
2. **`app/globals.css`** — añadir estilos home del template (`styles.css` líneas 930–1069: `.home`, `.home-hero`, `.home-silos`, `.home-section`, `.mini-rail`, `.home-stats`, `.home-final`, `.reveal`, `.feature-card`, `.mini-card`, etc.)
3. **`app/page.tsx`** — reemplazar con componente Home: Hero + FloatingSilhouettes + useReveal hook + secciones Why/Mini-rail/Stats/Actividad/Pricing/CTA final; navegación via `next/navigation` (`useRouter`)
4. **`components/Nav.tsx`** — añadir enlace "INICIO" → `/`; cambiar enlace biblioteca a "JUEGOS" → `/games`
5. **Verificación con Playwright MCP** — navegar a `/`, capturar screenshot completo en `.playwright-screenshoots/home.png`; navegar a `/games`, capturar `.playwright-screenshoots/games.png`; verificar que Nav muestra ambos enlaces

## Criterios de aceptación

- [x] `/` carga la landing page con hero, eyebrow "▸ INSERTA UNA MONEDA_", título de 3 líneas y dos CTAs
- [x] FloatingSilhouettes (8 SVGs pixel art) visibles y animados en el hero
- [x] Scroll revela secciones con animación `.reveal` (IntersectionObserver)
- [x] Sección "¿POR QUÉ ARCADE VAULT?" muestra 4 feature cards con íconos pixel SVG
- [x] Mini-rail muestra exactamente 6 juegos (GAMES.slice(0,6)); click en card navega a `/games/[id]`
- [x] Botón "VER TODOS LOS JUEGOS →" navega a `/games`
- [x] Sección Stats muestra 3 bloques: "12+", "MILES", "GLOBAL"
- [x] Sección "ACTIVIDAD EN VIVO" muestra ticker de 7 scores y top 5 jugadores hardcodeados
- [x] Botón "VER SALÓN →" navega a `/hall`
- [x] Sección PRICING muestra card "$0 / SIEMPRE" y FAQ con 3 preguntas
- [x] Botón "EMPEZAR GRATIS →" navega a `/auth`
- [x] Sección final "¿LISTO PARA JUGAR?" visible; botón "INSERTAR MONEDA →" navega a `/games`
- [x] `/games` sirve la biblioteca (grid de juegos) sin regresión visual
- [x] Nav muestra enlace "INICIO" activo en `/` y "JUEGOS" activo en `/games`
- [x] Screenshot `.playwright-screenshoots/home.png` capturado y no vacío
- [x] Screenshot `.playwright-screenshoots/games.png` capturado y no vacío

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Razón |
|---|---|---|---|
| Ruta biblioteca | `/games` | Mantener en `/` | Home landing necesita `/`; `/games` es más semántico |
| Nav enlace home | Añadir "INICIO" → `/` | Solo actualizar enlace biblioteca | Mejor navegabilidad; usuario puede volver a landing |
| Datos actividad en vivo | Hardcodeados mock | Derivar de `seededScores` | MVP visual; sin lógica real en este spec |
| CSS home | Añadir a `globals.css` | Archivo `home.css` separado | Todo el CSS del proyecto ya vive en `globals.css` |
| Sección Pricing | Incluida | Omitida | Completa la landing; refuerza mensaje "100% gratis" |
| Verificación | Playwright MCP + screenshots | Solo revisión manual | Evidencia visual trazable en `.playwright-screenshoots/` |
| Página /about | Fuera de scope | Incluir del template | Usuario explícitamente la excluyó |

## Riesgos identificados

- **Regresión en `/games`**: mover `app/page.tsx` → `app/games/page.tsx` puede romper imports relativos internos. Verificar paths al mover.
- **`useReveal` en App Router**: `IntersectionObserver` requiere cliente. El componente home debe ser `"use client"` o el hook debe vivir en un subcomponente client.
- **CSS colisiones**: añadir ~140 líneas a `globals.css` puede solapar clases existentes (`.reveal`, `.stat-block`, `.mini-card`). Revisar antes de añadir.
- **Nav `active` state**: detectar ruta activa en Next.js App Router requiere `usePathname()` (client component). Verificar que Nav ya lo implementa o añadirlo.
