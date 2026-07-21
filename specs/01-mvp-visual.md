---
spec: 01-mvp-visual
title: MVP Visual — Arcade Vault
state: implementado
date: 2026-07-19
objective: Implementar las 5 pantallas visuales de Arcade Vault en Next.js App Router sin lógica de juego real.
dependencies: ninguna
---

## Alcance

**Dentro:**
- 5 rutas: `/` (Biblioteca), `/games/[id]` (Detalle), `/games/[id]/play` (Reproductor), `/auth`, `/hall`
- Componente `Nav` persistente con mobile panel y backdrop
- Datos mock en `app/data/games.ts` (8 juegos, categorías, `seededScores`)
- Elementos de fondo (`.av-bg`, `.av-noise`) en root layout
- Estado de usuario en `localStorage` (`av_user`) vía React context
- Modal "Fin de juego" en Reproductor con score simulado

**Fuera:**
- Lógica real de juego
- Backend, base de datos, autenticación real
- Guardado real de scores (localStorage como simulación)
- Rutas de API
- Tests

## Modelo de datos

Archivo `app/data/games.ts`:

```typescript
type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;   // clase CSS para cover art
  color: string;
  best: number;
  plays: string;
}

type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export const GAMES: Game[]
export const CATS: string[]   // ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"]
export function seededScores(seed: number, count?: number): ScoreRow[]
```

Estado runtime (no en archivo):
- `av_user` en `localStorage` → `{ name: string } | null`
- `av_scores` en `localStorage` → array de entradas de partida

## Plan de implementación

1. **`app/data/games.ts`** — exportar `GAMES`, `CATS`, `seededScores` tipados
2. **`app/layout.tsx`** — añadir `.av-bg` y `.av-noise` divs; footer; envolver con `UserProvider`
3. **`components/UserProvider.tsx`** — context client para `user` + `localStorage`
4. **`components/Nav.tsx`** — client component; recibe `user` y callbacks; mobile panel con backdrop
5. **`app/page.tsx`** — Biblioteca: hero + search/filter + grid de GameCards; navega a `/games/[id]`
6. **`app/games/[id]/page.tsx`** — Detalle: cover, stats, leaderboard; botón "Jugar" → `/games/[id]/play`
7. **`app/games/[id]/play/page.tsx`** — Reproductor: HUD visual + pantalla CRT + modal fin de juego
8. **`app/auth/page.tsx`** — formulario login/registro; tabs; botones sociales decorativos
9. **`app/hall/page.tsx`** — Salón de la Fama: pódium + tabla filtrada por juego

## Criterios de aceptación

- [x] `/` carga con hero, buscador, chips de categoría y grid de 8 juegos
- [x] Filtro por categoría y búsqueda por nombre funcionan sin recarga
- [x] Click en card o "JUGAR" navega a `/games/[id]`
- [x] `/games/[id]` muestra cover, stats, leaderboard de 10 entradas y botón "JUGAR AHORA"
- [x] `/games/[id]/play` muestra HUD con jugador/puntuación/vidas/nivel y pantalla CRT animada
- [x] Botón PAUSA muestra overlay "EN PAUSA"; REANUDAR lo cierra
- [x] Botón FIN abre modal con puntuación, input de nombre y "GUARDAR PUNTUACIÓN"
- [x] Después de guardar aparece toast `▸ PUNTUACIÓN GUARDADA_`
- [x] `/auth` muestra tabs Login/Registro; formulario cambia campos según tab activo
- [x] Login guarda `av_user` en localStorage; Nav muestra nombre del usuario
- [x] "JUGAR COMO INVITADO" navega a `/` sin guardar sesión
- [x] Sign out borra `av_user` y Nav vuelve a mostrar "Iniciar Sesión"
- [x] `/hall` muestra pódium top 3 y tabla de 12 entradas; tabs cambian el juego activo
- [x] Usuario logueado ve su fila marcada en amarillo en `/hall`
- [x] Nav es sticky, responsive; hamburger abre panel lateral en mobile
- [x] `.av-bg` y `.av-noise` visibles en todas las rutas

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Razón |
|---|---|---|---|
| Routing | App Router, rutas reales `/games/[id]` | Hash routing del template | Canónico Next.js; URLs limpias |
| Estilos | `globals.css` existente (ya migrado) + Tailwind v4 | Reescribir en Tailwind puro | CSS ya listo; evita riesgo de regresión visual |
| Fuentes | Press Start 2P + JetBrains Mono (ya en layout.tsx) | Geist del boilerplate | Identidad retro del diseño |
| Datos mock | `app/data/games.ts` tipado | Inline en cada componente | Separación limpia; fácil de reemplazar con API |
| Estado usuario | Context + localStorage | Server session / cookies | Sin backend; MVP visual |
| Juego real | Visual shell CSS animada | Implementar lógica real | Fuera de scope explícito |
| Score en reproductor | Simulado (setInterval fijo) | Score real | Fuera de scope explícito |
