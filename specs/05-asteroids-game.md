---
spec: 05-asteroids-game
title: Integración del juego Asteroids en Arcade Vault
state: Approved
date: 2026-07-27
objective: Integrar el juego Asteroids (canvas + vanilla JS) como juego jugable en la plataforma Next.js, accesible desde la biblioteca existente.
dependencies: 01-mvp-visual, 04-supabase-setup
---

## Alcance

**Dentro:**

- Actualizar entrada `rocas` en `app/data/games.ts`: cambiar `id` a `"asteroids"`
- Copiar `game.js` → `public/games/asteroids/game.js`
- Crear `app/games/asteroids/play/page.tsx` — `"use client"`, canvas 800×600 centrado, carga el script vía Next.js `<Script>`
- Integración visual mínima: fondo negro, juego centrado en pantalla

**Fuera:**

- Guardar puntuación en Supabase — spec posterior
- Pantalla de Game Over integrada con la plataforma
- Convertir `game.js` a componente React
- Autenticación requerida para jugar
- Controles táctiles / mobile

## Plan de implementación

1. **`app/data/games.ts`** — cambiar `id: "rocas"` → `id: "asteroids"` en la entrada ROCAS.

2. **`public/games/asteroids/game.js`** — copiar verbatim desde
   `references/started-games/02-asteroids/game.js`. Sin modificaciones.

3. **`app/games/asteroids/play/page.tsx`** — crear página:
   - `"use client"`
   - Renderiza `<canvas id="canvas" width={800} height={600} />`
   - Carga `/games/asteroids/game.js` vía `<Script src="..." strategy="afterInteractive" />`
   - Fondo negro, canvas centrado (`min-h-screen flex items-center justify-center bg-black`)

4. **Verificación** — `npm run dev`, navegar a `/games/asteroids/play`, comprobar:
   - Canvas visible, nave responde a flechas + espacio
   - Asteroides se fragmentan, score incrementa
   - Sin errores de consola
   - `npm run build` pasa sin errores TypeScript

## Criterios de aceptación

- [ ] `app/data/games.ts` tiene entrada con `id: "asteroids"`
- [ ] `/games/asteroids` muestra página de detalle (ruta dinámica `[id]`)
- [ ] `/games/asteroids/play` carga el juego sin errores de consola
- [ ] Canvas 800×600 centrado sobre fondo negro
- [ ] Controles: flechas rotan/propulsan nave, espacio dispara
- [ ] Asteroides grandes se parten en medianos, medianos en pequeños
- [ ] Score se incrementa al destruir asteroides
- [ ] `npm run build` pasa sin errores TypeScript

## Decisiones tomadas y descartadas

| Decisión          | Elegida                              | Descartada                         | Razón                                                          |
| ----------------- | ------------------------------------ | ---------------------------------- | -------------------------------------------------------------- |
| Carga de game.js  | `public/` + `<Script>`               | Import / conversión a módulo React | Minimal adaptation; sin refactor de 510 líneas                 |
| Ruta de la página | Estática `app/games/asteroids/play/` | Dinámica `app/games/[id]/play/`    | Decisión del usuario; static route toma precedencia en Next.js |
| Scores            | Fuera de scope                       | Guardar en Supabase en este spec   | Complejidad merece spec propio                                 |
| Entry en GAMES    | Reutilizar "rocas" cambiando id      | Entrada nueva paralela             | "rocas" ya es el placeholder de Asteroids; evita duplicado     |
