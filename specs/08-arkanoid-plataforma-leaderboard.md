# SPEC 08 — Integración de Arkanoid: plataforma + leaderboard

> **Estado:** Aprobado
> **Depende de:** 04-supabase-setup, 06-leaderboard-games-table
> **Fecha:** 2026-08-05
> **Objetivo:** Integrar el juego Arkanoid (canvas/JS vanilla) en Arcade Vault con HUD, guardado de scores en Supabase y leaderboard en la página del juego.

## Alcance

**Dentro:**

- Copiar `game.js`, `levels.js`, `assets/spritesheet.js`, `assets/spritesheet-breakout.png`,
  `assets/sounds/ball-bounce.mp3`, `assets/sounds/break-sound.mp3` → `public/games/arkanoid/`
- Parchar `public/games/arkanoid/game.js` (6 ediciones):
  - Renombrar canvas: `getElementById('game')` → `getElementById('canvas')`
  - Ajustar rutas de audio: `'assets/sounds/...'` → `'/games/arkanoid/assets/sounds/...'`
  - Envolver todo el archivo en IIFE
  - Check de pausa al inicio de `loop()`: `window.gamePaused`
  - Escribir `window.gameState` al final de cada tick del loop
  - Disparar evento `gameOver` una sola vez (en `gameover` **y** `win`) via `gameOverFired` flag
- `app/games/arkanoid/play/page.tsx`: HUD de plataforma, canvas 800×600, listener `gameOver`,
  modal de nombre, INSERT en `scores`, RPC `increment_game_stats`
- `app/games/arkanoid/page.tsx`: datos desde Supabase, leaderboard top 10
- Insertar fila en tabla `games` vía Supabase MCP
- Añadir `arkanoid` en `COVER_MAP` y `COLOR_MAP` de `app/games/page.tsx`

**Fuera de scope:**

- Autenticación — sin auth en este spec
- Anti-cheat / validación de scores en servidor
- Controles táctiles / mobile
- Otros juegos distintos de `arkanoid`
- Paginación del leaderboard (solo top 10)

## Modelo de datos

Tablas `games` y `scores`, y RPC `increment_game_stats` ya existen (specs 04/06).

### Fila a insertar

```sql
INSERT INTO games (slug, name, description_short, description_long, category)
VALUES (
  'arkanoid',
  'Arkanoid',
  'Rompe bloques con la paleta y la pelota. ¿Puedes completar los 5 niveles?',
  'Arkanoid es el clásico juego de romper bloques. Controla la paleta con el ratón, devuelve la pelota y destruye todos los bloques de cada nivel. Cinco niveles con velocidad creciente y explosiones animadas. ¿Llegarás al final sin perder las 3 vidas?',
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

`level` corresponde a `currentLevel` en `game.js`. `gameOver` es `true` cuando
`gameState === 'gameover' || gameState === 'win'`.

## Plan de implementación

1. **Copiar archivos del juego** → `public/games/arkanoid/`
   - `references/started-games/04-arkanoid/game.js`
   - `references/started-games/04-arkanoid/levels.js`
   - `references/started-games/04-arkanoid/assets/spritesheet.js`
   - `references/started-games/04-arkanoid/assets/spritesheet-breakout.png`
   - `references/started-games/04-arkanoid/assets/sounds/ball-bounce.mp3`
   - `references/started-games/04-arkanoid/assets/sounds/break-sound.mp3`
   - Mantener estructura de carpetas: `assets/sounds/` y `assets/spritesheet.js` bajo `public/games/arkanoid/assets/`

2. **Parchar `public/games/arkanoid/game.js`** (6 ediciones):
   - Renombrar canvas: `getElementById('game')` → `getElementById('canvas')`
   - Ajustar rutas de audio:
     - `'assets/sounds/ball-bounce.mp3'` → `'/games/arkanoid/assets/sounds/ball-bounce.mp3'`
     - `'assets/sounds/break-sound.mp3'` → `'/games/arkanoid/assets/sounds/break-sound.mp3'`
   - Envolver **todo** el archivo en IIFE: `(function () { "use strict"; ... })();`
   - Al inicio de `loop()`: añadir check de pausa
     ```js
     if (window.gamePaused) {
       requestAnimationFrame(loop);
       return;
     }
     ```
   - Al final de cada tick en `loop()`: escribir estado HUD
     ```js
     window.gameState = {
       score,
       lives,
       level: currentLevel,
       gameOver: gameState === "gameover" || gameState === "win",
     };
     ```
   - Declarar `let gameOverFired = false;` al inicio del archivo (dentro de IIFE);
     resetear en `loadLevel()`: `gameOverFired = false;`;
     disparar en la condición de game over (`gameState = 'gameover'`) y win (`gameState = 'win'`):
     ```js
     if (!gameOverFired) {
       gameOverFired = true;
       window.dispatchEvent(new CustomEvent("gameOver", { detail: { score } }));
     }
     ```

3. **Crear `app/games/arkanoid/play/page.tsx`** — copiar `app/games/asteroids/play/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"arkanoid"`
   - Dimensiones del canvas: `width={800} height={600}`
   - Cargar scripts en orden via un único `useEffect` con `onload` encadenado:
     ```ts
     useEffect(() => {
       const spritesheetScript = document.createElement("script");
       spritesheetScript.src = "/games/arkanoid/assets/spritesheet.js";
       spritesheetScript.onload = () => {
         const levelsScript = document.createElement("script");
         levelsScript.src = "/games/arkanoid/levels.js";
         levelsScript.onload = () => {
           const gameScript = document.createElement("script");
           gameScript.src = "/games/arkanoid/game.js";
           document.body.appendChild(gameScript);
         };
         document.body.appendChild(levelsScript);
       };
       document.body.appendChild(spritesheetScript);
       return () => {
         // cleanup: remover los scripts añadidos
         document
           .querySelectorAll('script[src^="/games/arkanoid/"]')
           .forEach((s) => s.parentNode?.removeChild(s));
       };
     }, []);
     ```

4. **Crear `app/games/arkanoid/page.tsx`** — copiar `app/games/asteroids/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"arkanoid"`
   - Ruta de navegación a `/games/arkanoid`

5. **Insertar fila en tabla `games` vía Supabase MCP** — usar `mcp__supabase__execute_sql`:

   ```sql
   INSERT INTO games (slug, name, description_short, description_long, category)
   VALUES (
     'arkanoid',
     'Arkanoid',
     'Rompe bloques con la paleta y la pelota. ¿Puedes completar los 5 niveles?',
     'Arkanoid es el clásico juego de romper bloques. Controla la paleta con el ratón, devuelve la pelota y destruye todos los bloques de cada nivel. Cinco niveles con velocidad creciente y explosiones animadas. ¿Llegarás al final sin perder las 3 vidas?',
     'arcade'
   );
   ```

6. **Añadir `arkanoid` en `app/games/page.tsx`**:

   ```ts
   COVER_MAP: { ..., arkanoid: 'cover-arkanoid' }
   COLOR_MAP: { ..., arkanoid: '#e84545' }
   ```

7. **Verificación**
   - `npm run build` sin errores TypeScript
   - `npm run dev`, navegar a `/games` → Arkanoid aparece en la lista
   - Navegar a `/games/arkanoid` → página de detalle con leaderboard vacío
   - Navegar a `/games/arkanoid/play` → canvas visible, paleta responde al ratón, sprites cargan
   - Jugar hasta perder o completar → modal de nombre aparece → guardar → score en leaderboard de `/games/arkanoid` y en `/hall`
   - Rejugar sin refresh: salir con FIN, volver a entrar → canvas activo, sin `SyntaxError` en consola

## Criterios de aceptación

- [ ] `public/games/arkanoid/game.js` existe y tiene los 6 parches del contrato
- [ ] `public/games/arkanoid/assets/` contiene `spritesheet.js`, `spritesheet-breakout.png` y carpeta `sounds/`
- [ ] Al perder todas las vidas o completar el juego, se emite evento custom `gameOver` una sola vez
- [ ] Prompt/modal de nombre aparece tras game over
- [ ] Score se inserta en `scores` con `player_name` y `game_id` correctos
- [ ] `games.matches_played` se incrementa tras cada partida guardada
- [ ] `games.best_score` se actualiza si el score nuevo supera el anterior
- [ ] `/games/arkanoid` muestra sección leaderboard con top 10
- [ ] Leaderboard ordenado por `score DESC`, desempate `created_at ASC`
- [ ] `/games` lista Arkanoid (leído desde Supabase)
- [ ] `/hall` muestra scores de Arkanoid en tab "TODOS" y en su tab específico
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] HUD de plataforma visible en play: JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, botones PAUSA y FIN
- [ ] Canvas 800×600 dentro del área `crt-screen`, paleta responde al ratón, sprites cargan correctamente
- [ ] Rejugar sin refresh: salir con FIN, volver a entrar → canvas activo, sin pantalla negra, sin `SyntaxError` en consola
- [ ] Rutas de audio apuntan a `/games/arkanoid/assets/sounds/` (sin 404 en Network)

## Decisiones tomadas y descartadas

| Decisión                        | Elegida                                                             | Descartada                     | Razón                                                                                              |
| ------------------------------- | ------------------------------------------------------------------- | ------------------------------ | -------------------------------------------------------------------------------------------------- |
| Auth para scores                | Sin auth, nombre libre                                              | Requerir sesión activa         | Auth no implementada; no bloquea leaderboard                                                       |
| Trigger game over               | Evento custom `gameOver`                                            | Polling de `window.gameState`  | Más limpio; evita polling en el componente React                                                   |
| `best_score` / `matches_played` | Desnormalizado + RPC                                                | Derivado con COUNT/MAX         | Queries simples; actualización atómica via RPC                                                     |
| Scope del leaderboard           | Sección en página del juego                                         | Página `/leaderboard` dedicada | Consistente con patrón Asteroids                                                                   |
| Carga de game.js                | `useEffect` + script nativo                                         | `<Script>` de next/script      | Next.js deduplica `<Script>` entre navegaciones; script nativo fuerza re-ejecución en cada montaje |
| Scope de variables en game.js   | IIFE envuelve todo el archivo                                       | Variables en scope global      | Sin IIFE, `const X` en scope global lanza `SyntaxError` al rejugar                                 |
| Condición gameOver              | `gameover` **y** `win` disparan el evento                           | Solo `gameover`                | El score final es válido en ambos casos; el jugador merece guardar al completar                    |
| Orden de carga de scripts       | `spritesheet.js` → `levels.js` → `game.js` encadenados con `onload` | Tres `useEffect` separados     | `game.js` depende de ambos; `onload` encadenado garantiza orden de ejecución                       |
| Rutas de audio                  | Absolutas `/games/arkanoid/assets/sounds/`                          | Relativas `assets/sounds/`     | Rutas relativas no funcionan desde Next.js; assets en `public/` requieren ruta absoluta desde raíz |

## Riesgos

- **Carga asíncrona de scripts dependientes.** `game.js` usa `LEVELS` (de `levels.js`) y
  `loadSpritesheet` (de `assets/spritesheet.js`). Los tres `useEffect` se montan en paralelo —
  no hay garantía de orden de ejecución. Mitigación: cargar con `script.onload` encadenado en
  un solo `useEffect`, no tres separados. Ya reflejado en el paso 3 del plan.

- **Audio bloqueado por política del navegador.** Los navegadores bloquean `new Audio(...).play()`
  sin interacción previa del usuario. En Next.js, el canvas monta antes de cualquier click —
  el primer bounce puede lanzar `NotAllowedError` silencioso. No es un bloqueante del spec
  (el juego funciona sin sonido), pero puede confundir en verificación. Documentado para no
  investigar como bug.
