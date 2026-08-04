---
spec: 07-tetris-plataforma-leaderboard
title: Integración de Tetris: plataforma + leaderboard
state: Aprobado
date: 2026-08-04
objective: Integrar el juego Tetris (canvas/JS vanilla) en Arcade Vault con HUD, guardado de scores en Supabase y leaderboard en la página del juego.
dependencies: 04-supabase-setup, 06-leaderboard-games-table
---

## Alcance

**Dentro:**

- Copiar `game.js` → `public/games/tetris/`
- Parchar `public/games/tetris/game.js` (4 ediciones):
  - Renombrar canvas: `getElementById('board')` → `getElementById('canvas')`
  - Pausa de plataforma: check `window.gamePaused` al inicio de `loop()`
  - HUD state: escribir `window.gameState` al final de cada tick
  - Evento `gameOver` una sola vez via `gameOverFired` flag
- `app/games/tetris/play/page.tsx`: HUD de plataforma, canvas principal (300×600) + canvas de siguiente pieza (120×120), listener `gameOver`, modal de nombre, INSERT en `scores`, RPC `increment_game_stats`
- `app/games/tetris/page.tsx`: datos desde Supabase, leaderboard top 10
- Insertar fila en tabla `games` vía Supabase MCP
- Añadir `tetris` en `COVER_MAP` y `COLOR_MAP` de `app/games/page.tsx`

**Fuera de scope:**

- Autenticación — sin auth en este spec
- Anti-cheat / validación de scores en servidor
- Controles táctiles / mobile
- Otros juegos distintos de `tetris`
- Paginación del leaderboard (solo top 10)

## Modelo de datos

### Fila a insertar en `games`

```sql
INSERT INTO games (slug, name, description_short, description_long, category)
VALUES (
  'tetris',
  'Tetris',
  'Encaja piezas que caen. Limpia líneas. Sobrevive.',
  'Piezas de distintas formas caen desde la cima. Encájalas para completar líneas y hacerlas desaparecer. El ritmo se acelera con cada nivel. La partida termina cuando las piezas alcanzan el techo.',
  'puzzle'
);
```

### Tipos de `window` usados en play page

```ts
type GameState = {
  score: number;
  lives: string | number; // Tetris no tiene vidas — mostrar '-'
  level: number;
  gameOver: boolean;
};
type Win = Window & { gamePaused?: boolean; gameState?: GameState };
```

> **Nota:** `lives` se fija a `'-'` — Tetris termina cuando las piezas alcanzan el techo, no por vidas.

## Plan de implementación

1. **Copiar archivos del juego** → `public/games/tetris/`
   - Fuente: `references/started-games/03-tetris/game.js`
   - Sin archivos extra (no hay assets ni JS adicionales)

2. **Parchar `public/games/tetris/game.js`** (4 ediciones quirúrgicas):
   - Renombrar canvas: `document.getElementById('board')` → `document.getElementById('canvas')`
   - Al inicio de `loop(ts)`: añadir check de pausa
     ```js
     if (window.gamePaused) {
       animId = requestAnimationFrame(loop);
       return;
     }
     ```
   - Al final del tick (antes de `draw()` y del `requestAnimationFrame` final): escribir estado HUD
     ```js
     window.gameState = { score, lives: "-", level, gameOver };
     ```
   - Declarar `let gameOverFired = false;` al inicio del archivo; resetear en `init()`: `gameOverFired = false;`; disparar en `endGame()` antes de `cancelAnimationFrame`:
     ```js
     if (!gameOverFired) {
       gameOverFired = true;
       window.dispatchEvent(new CustomEvent("gameOver", { detail: { score } }));
     }
     ```

3. **Crear `app/games/tetris/play/page.tsx`** — copiar `app/games/asteroids/play/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"tetris"`
   - `<Script src="/games/asteroids/game.js">` → `<Script src="/games/tetris/game.js">`
   - Canvas principal: `<canvas id="canvas" width={300} height={600} />`
   - Añadir segundo canvas para pieza siguiente: `<canvas id="next-canvas" width={120} height={120} />`

4. **Crear `app/games/tetris/page.tsx`** — copiar `app/games/asteroids/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"tetris"`
   - Ruta de navegación a `/games/tetris`

5. **Insertar fila en tabla `games` vía Supabase MCP** — usar `mcp__supabase__execute_sql`:

   ```sql
   INSERT INTO games (slug, name, description_short, description_long, category)
   VALUES ('tetris', 'Tetris', 'Encaja piezas que caen. Limpia líneas. Sobrevive.',
   'Piezas de distintas formas caen desde la cima. Encájalas para completar líneas y hacerlas desaparecer. El ritmo se acelera con cada nivel. La partida termina cuando las piezas alcanzan el techo.',
   'puzzle');
   ```

6. **Añadir `tetris` en `app/games/page.tsx`**:

   ```ts
   COVER_MAP: { asteroids: "cover-rocas", tetris: "cover-tetris" }
   COLOR_MAP: { asteroids: "#c7d0e0", tetris: "#4dd0e1" }
   ```

   Crear clase `cover-tetris` en el CSS global si no existe.

7. **Verificación**
   - `npm run build` sin errores TypeScript
   - `npm run dev`, navegar a `/games` → Tetris aparece en la lista
   - Navegar a `/games/tetris` → página de detalle con leaderboard vacío
   - Navegar a `/games/tetris/play` → canvas visible, piezas caen, canvas de siguiente pieza visible
   - Jugar hasta game over → modal de nombre aparece → guardar → score en leaderboard de `/games/tetris` y en `/hall`

## Criterios de aceptación

- [ ] `public/games/tetris/game.js` existe y tiene los 4 parches del contrato
- [ ] Canvas principal usa `id="canvas"` (renombrado desde `id="board"`)
- [ ] Al llegar a game over en `/games/tetris/play`, se emite evento custom `gameOver` una sola vez
- [ ] Prompt/modal de nombre aparece tras game over
- [ ] Score se inserta en `scores` con `player_name` y `game_id` correctos
- [ ] `games.matches_played` se incrementa tras cada partida guardada
- [ ] `games.best_score` se actualiza si el score nuevo supera el anterior
- [ ] `/games/tetris` muestra sección leaderboard con top 10
- [ ] Leaderboard ordenado por `score DESC`, desempate `created_at ASC`
- [ ] `/games` lista Tetris (leído desde Supabase)
- [ ] `/hall` muestra scores de Tetris en tab "TODOS" y en su tab específico
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] HUD de plataforma visible en play: JUGADOR, PUNTUACIÓN, VIDAS (`-`), NIVEL, botones PAUSA y FIN
- [ ] Canvas principal (300×600) y canvas de siguiente pieza (120×120) visibles dentro del área `crt-screen`
- [ ] Piezas caen, rotan, se encajan; líneas completas desaparecen; nivel sube cada 10 líneas

## Decisiones tomadas y descartadas

| Decisión                        | Elegida                            | Descartada                         | Razón                                                               |
| ------------------------------- | ---------------------------------- | ---------------------------------- | ------------------------------------------------------------------- |
| Auth para scores                | Sin auth, nombre libre             | Requerir sesión activa             | Auth no implementada; no bloquea leaderboard                        |
| Trigger game over               | Evento custom `gameOver`           | Polling de `window.gameState`      | Más limpio; evita polling en el componente React                    |
| `best_score` / `matches_played` | Desnormalizado + RPC               | Derivado con COUNT/MAX             | Queries simples; actualización atómica via RPC                      |
| Scope del leaderboard           | Sección en página del juego        | Página `/leaderboard` dedicada     | Consistente con patrón Asteroids                                    |
| Canvas id                       | Renombrar `board` → `canvas`       | Mantener `board` y adaptar React   | El contrato de integración requiere `id="canvas"` hardcoded         |
| Vidas en HUD                    | Mostrar `'-'`                      | Mostrar `0` o ocultar el campo     | Tetris no tiene vidas; `'-'` comunica ausencia sin romper el HUD    |
| Canvas de siguiente pieza       | Incluir `next-canvas` en play page | Omitirlo                           | Sin él la función `drawNext()` falla en runtime                     |
| Pausa de plataforma             | `window.gamePaused` en `loop()`    | Reutilizar `togglePause()` interno | El botón PAUSA de la plataforma necesita control externo via window |

## Riesgos

- **`next-canvas` ausente en play page**: Si se omite, `drawNext()` lanza excepción en runtime y rompe el loop. Mitigado: el plan lo incluye explícitamente en el paso 3.

- **Doble canal de pausa**: El juego tiene tecla `P` → `togglePause()` que llama `cancelAnimationFrame(animId)`, matando el RAF loop. Si el usuario usa `P` además del botón de plataforma, el loop muere y `window.gamePaused` deja de funcionar. Mitigación aceptable en este spec: el botón FIN de la plataforma sirve de salida; pausa via `P` queda como comportamiento no garantizado.

- **Doble emisión de `gameOver`**: `endGame()` puede llamarse desde `spawn()` en condiciones de borde. El flag `gameOverFired` lo previene.
