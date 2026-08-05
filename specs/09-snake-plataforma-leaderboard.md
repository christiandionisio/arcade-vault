# SPEC 09 — Integración de Snake: plataforma + leaderboard

> **Estado:** Implementado
> **Depende de:** 04-supabase-setup, 06-leaderboard-games-table
> **Fecha:** 2026-08-05
> **Objetivo:** Integrar el juego Snake (canvas/JS vanilla) en Arcade Vault con HUD, guardado de scores en Supabase y leaderboard en la página del juego.

## Alcance

**Dentro:**

- Copiar `game.js`, `snake-assets/sprites.js`, `snake-assets/fruits.png` → `public/games/snake/`
- Parchar `public/games/snake/game.js` (4 ediciones):
  - Envolver todo el archivo en IIFE
  - Check de pausa al inicio de `loop()`: `window.gamePaused`
  - Escribir `window.gameState` al final de cada tick del loop
  - Disparar evento `gameOver` una sola vez via `gameOverFired` flag
- Ajustar ruta de imagen: `atlas.sources.fruits` → `/games/snake/snake-assets/fruits.png`
- `app/games/snake/play/page.tsx`: HUD de plataforma, canvas 600×600, listener `gameOver`, modal de nombre, INSERT en `scores`, RPC `increment_game_stats`
- `app/games/snake/page.tsx`: datos desde Supabase, leaderboard top 10
- Insertar fila en tabla `games` vía Supabase MCP
- Añadir `snake` en `COVER_MAP` y `COLOR_MAP` de `app/games/page.tsx`

**Fuera de scope:**

- Autenticación — sin auth en este spec
- Anti-cheat / validación de scores en servidor
- Controles táctiles / mobile
- Otros juegos distintos de `snake`
- Paginación del leaderboard (solo top 10)

## Modelo de datos

Tablas `games` y `scores`, y RPC `increment_game_stats` ya existen (specs 04/06).

### Fila a insertar

```sql
INSERT INTO games (slug, name, description_short, description_long, category)
VALUES (
  'snake',
  'Snake',
  'Guía la serpiente, come frutas y no te choques. ¡Cada fruta sube la velocidad!',
  'Snake es el clásico juego de habilidad y reflejos. Controla la serpiente con las flechas o WASD, recoge frutas del atlas para ganar puntos y crece. Cada 5 frutas sube un nivel y la velocidad aumenta. ¿Hasta qué longitud aguantas sin chocarte con las paredes o contigo mismo?',
  'arcade'
);
```

### Tipos de `window` usados en play page

```ts
type GameState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};
type Win = Window & { gamePaused?: boolean; gameState?: GameState };
```

`lives` no es un concepto del juego — vale `1` mientras la serpiente vive, `0` en game over.
`level` sube 1 cada 5 frutas comidas. `gameOver` es `true` al chocar con pared o con sí misma.

## Plan de implementación

1. **Copiar archivos del juego** → `public/games/snake/`
   - `references/started-games/05-snake/game.js`
   - `references/started-games/05-snake/snake-assets/sprites.js`
   - `references/started-games/05-snake/snake-assets/fruits.png`
   - Mantener estructura: `snake-assets/` bajo `public/games/snake/snake-assets/`

2. **Parchar `public/games/snake/game.js`** (5 ediciones):
   - Envolver **todo** el archivo en IIFE: `(function () { "use strict"; ... })();` — eliminar `"use strict";` suelto del inicio, cerrar IIFE al final
   - Ajustar ruta de imagen: reemplazar `atlas.sources.fruits` por el literal `'/games/snake/snake-assets/fruits.png'`
   - Al inicio de `loop()`: añadir check de pausa (`window.gamePaused`)
   - Al final de cada tick del loop (dentro de `draw()`): ya existe `window.gameState = { score, lives: isGameOver ? 0 : 1, level, gameOver: isGameOver }` — verificar que está presente
   - En condición de game over: `gameOverFired` ya declarado y usado — verificar flag correcto

3. **Crear `app/games/snake/play/page.tsx`** — copiar `app/games/asteroids/play/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"snake"`
   - Canvas: `width={600} height={600}`
   - `useEffect` con script nativo para `sprites.js` (carga primero) y luego `game.js`:
     ```ts
     useEffect(() => {
       const sprites = document.createElement("script");
       sprites.src = "/games/snake/snake-assets/sprites.js";
       document.body.appendChild(sprites);
       const game = document.createElement("script");
       game.src = "/games/snake/game.js";
       sprites.onload = () => document.body.appendChild(game);
       return () => {
         document.body.removeChild(sprites);
         if (document.body.contains(game)) document.body.removeChild(game);
       };
     }, []);
     ```

4. **Crear `app/games/snake/page.tsx`** — copiar `app/games/asteroids/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"snake"`
   - Ruta de navegación a `/games/snake`

5. **Insertar fila en tabla `games` vía Supabase MCP** — usar `mcp__supabase__execute_sql`:

   ```sql
   INSERT INTO games (slug, name, description_short, description_long, category)
   VALUES ('snake', 'Snake', 'Guía la serpiente, come frutas y no te choques. ¡Cada fruta sube la velocidad!', 'Snake es el clásico juego de habilidad y reflejos. Controla la serpiente con las flechas o WASD, recoge frutas del atlas para ganar puntos y crece. Cada 5 frutas sube un nivel y la velocidad aumenta. ¿Hasta qué longitud aguantas sin chocarte con las paredes o contigo mismo?', 'arcade');
   ```

6. **Añadir `snake` en `app/games/page.tsx`**:

   ```ts
   COVER_MAP: { ..., "snake": "cover-snake" }
   COLOR_MAP: { ..., "snake": "#2d5a2d" }
   ```

   Crear clase `cover-snake` en `globals.css` con estilo coherente al tema verde del juego.

7. **Verificación**
   - `npm run build` sin errores TypeScript
   - `npm run dev`, navegar a `/games` → Snake aparece en la lista
   - `/games/snake` → página de detalle con leaderboard vacío
   - `/games/snake/play` → canvas 600×600 visible, serpiente se mueve con flechas/WASD, HUD lee score/nivel
   - Jugar hasta game over → modal de nombre → guardar → score en `/games/snake` y en `/hall`
   - Rejugar sin refresh: salir con FIN, volver a entrar → canvas activo, sin pantalla negra, sin `SyntaxError` en consola

## Criterios de aceptación

- [ ] `public/games/snake/game.js` existe con los 4 parches del contrato (IIFE, pausa, gameState, gameOver event)
- [ ] `public/games/snake/snake-assets/sprites.js` y `fruits.png` existen y cargan sin 404
- [ ] Al llegar a game over en `/games/snake/play`, se emite evento custom `gameOver` una sola vez
- [ ] Prompt/modal de nombre aparece tras game over
- [ ] Score se inserta en `scores` con `player_name` y `game_id` correctos
- [ ] `games.matches_played` se incrementa tras cada partida guardada
- [ ] `games.best_score` se actualiza si el score nuevo supera el anterior
- [ ] `/games/snake` muestra sección leaderboard con top 10
- [ ] Leaderboard ordenado por `score DESC`, desempate `created_at ASC`
- [ ] `/games` lista Snake (leído desde Supabase)
- [ ] `/hall` muestra scores de Snake en tab "TODOS" y en su tab específico
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] HUD visible en play: JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, botones PAUSA y FIN
- [ ] Canvas 600×600 dentro del área `crt-screen`, controles funcionan (flechas y WASD)
- [ ] Rejugar sin refresh: salir con FIN, volver a entrar → canvas activo, sin pantalla negra, sin `SyntaxError` en consola
- [ ] `sprites.js` carga antes que `game.js` (orden de scripts garantizado)

## Decisiones tomadas y descartadas

| Decisión                        | Elegida                                                         | Descartada                                      | Razón                                                                                                                                 |
| ------------------------------- | --------------------------------------------------------------- | ----------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------- |
| Auth para scores                | Sin auth, nombre libre                                          | Requerir sesión activa                          | Auth no implementada; no bloquea leaderboard                                                                                          |
| Trigger game over               | Evento custom `gameOver`                                        | Polling de `window.gameState`                   | Más limpio; evita polling en el componente React                                                                                      |
| `best_score` / `matches_played` | Desnormalizado + RPC                                            | Derivado con COUNT/MAX                          | Queries simples; actualización atómica via RPC                                                                                        |
| Scope del leaderboard           | Sección en página del juego                                     | Página `/leaderboard` dedicada                  | Consistente con patrón Asteroids/Arkanoid                                                                                             |
| Carga de scripts                | `useEffect` + script nativo, sprites primero                    | `<Script>` de next/script                       | Next.js deduplica `<Script>`; nativo fuerza re-ejecución. `sprites.js` debe cargar antes que `game.js` (expone `window.SPRITE_ATLAS`) |
| Scope de variables en game.js   | IIFE envuelve todo el archivo                                   | Variables en scope global                       | Sin IIFE, `const`/`let` en scope global lanza `SyntaxError` al rejugar                                                                |
| Vidas en HUD                    | `lives: isGameOver ? 0 : 1`                                     | Omitir campo `lives`                            | El HUD de plataforma siempre muestra VIDAS; snake es one-life, se representa como 1→0                                                 |
| Ruta de imagen `fruits.png`     | Path absoluto `/games/snake/snake-assets/fruits.png` en game.js | Path relativo via `SPRITE_ATLAS.sources.fruits` | Path relativo falla cuando la página sirve desde `/games/snake/play`; absoluto funciona en ambos contextos                            |
| Dimensiones canvas              | 600×600                                                         | 800×600 (estándar otros juegos)                 | Grid 20×20 con CELL=30 da exactamente 600×600; forzar 800×600 rompería el grid                                                        |

## Riesgos

- **Orden de carga de scripts**: `game.js` usa `window.SPRITE_ATLAS` que expone `sprites.js`. Si `game.js` se ejecuta antes que `sprites.js` cargue, el juego crashea silenciosamente (canvas negro). El `useEffect` de la play page debe garantizar que `sprites.onload` dispare antes de agregar `game.js` al DOM (ver paso 3 del plan).
