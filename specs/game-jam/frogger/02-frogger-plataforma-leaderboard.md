# SPEC — Integración de Frogger: plataforma + leaderboard

> **Estado:** Borrador
> **Depende de:** 04-supabase-setup, 06-leaderboard-games-table, 01-frogger-game
> **Fecha:** 2026-08-09
> **Objetivo:** Integrar el juego Frogger (canvas/JS vanilla) en Arcade Vault con HUD, guardado de scores en Supabase y leaderboard en la página del juego.

## Alcance

**Dentro:**

- Parchar `public/games/frogger/game.js` (4 ediciones del contrato):
  - Verificar IIFE wrapper (implementado en spec 01)
  - Check de pausa al inicio de `loop()`: `window.gamePaused`
  - Escribir `window.gameState` al final de cada tick
  - Disparar evento `gameOver` una sola vez (implementado en spec 01; verificar `gameOverFired` flag)
- `app/games/frogger/play/page.tsx`: HUD de plataforma, canvas 480×560, listener `gameOver`,
  modal de nombre, INSERT en `scores`, RPC `increment_game_stats`
- `app/games/frogger/page.tsx`: datos desde Supabase, leaderboard top 10
- Insertar fila en tabla `games` vía Supabase MCP
- Añadir `frogger` en `COVER_MAP` y `COLOR_MAP` de `app/games/page.tsx`

**Fuera de scope:**

- Autenticación — sin auth en este spec
- Anti-cheat / validación de scores en servidor
- Controles táctiles / mobile
- Otros juegos distintos de `frogger`
- Paginación del leaderboard (solo top 10)

## Modelo de datos

Tablas `games` y `scores`, y RPC `increment_game_stats` ya existen (specs 04/06).

### Fila a insertar

```sql
INSERT INTO games (slug, name, description_short, description_long, category)
VALUES (
  'frogger',
  'Frogger',
  'Cruza la carretera y el río sin morir. ¡Cada nivel más rápido!',
  'Frogger es el clásico arcade de 1981. Guía a tu rana cruzando una carretera llena de coches y un río con troncos y tortugas. Llena los cinco huecos de la orilla opuesta para completar el nivel. Cada nivel aumenta la velocidad del tráfico. ¿Cuántos niveles puedes superar?',
  'maze'
);
```

### Tipos de `window` usados en play page

```ts
type GameState = {
  score: number;
  lives: number; // 3 vidas iniciales; 0 en game over
  level: number; // sube al completar los 5 slots de destino
  gameOver: boolean;
};
type Win = Window & { gamePaused?: boolean; gameState?: GameState };
```

## Plan de implementación

1. **Verificar `public/games/frogger/game.js`** — confirmar que los 4 parches del contrato están presentes (heredados del spec 01). Si falta alguno, aplicarlo ahora. No hay rutas de assets externas que ajustar (el juego usa formas canvas 2D puras).

2. **Crear `app/games/frogger/play/page.tsx`** — copiar `app/games/asteroids/play/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"frogger"` en todos los usos (slug Supabase, rutas, script src, botón FIN)
   - Canvas: `<canvas id="canvas" width={480} height={560} />`
   - Ratio del `crt-screen` de `4/3` → `6/7` para ajustar a la proporción vertical del canvas
   - `useEffect` con script nativo para cargar `game.js`:
     ```ts
     useEffect(() => {
       const script = document.createElement("script");
       script.src = "/games/frogger/game.js";
       document.body.appendChild(script);
       return () => {
         if (document.body.contains(script)) document.body.removeChild(script);
       };
     }, []);
     ```
   - Teclas de juego bloqueadas: `ArrowUp`, `ArrowDown`, `ArrowLeft`, `ArrowRight` (quitar `Space` si no aplica, o mantener el Set completo sin efectos negativos)
   - Texto del `crt-bottom`: `<span className="led">RANA</span><span>FLECHAS</span>`

3. **Crear `app/games/frogger/page.tsx`** — copiar `app/games/asteroids/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"frogger"`
   - Ruta de navegación a `/games/frogger`

4. **Insertar fila en tabla `games` vía Supabase MCP** — usar `mcp__supabase__execute_sql`:

   ```sql
   INSERT INTO games (slug, name, description_short, description_long, category)
   VALUES (
     'frogger',
     'Frogger',
     'Cruza la carretera y el río sin morir. ¡Cada nivel más rápido!',
     'Frogger es el clásico arcade de 1981. Guía a tu rana cruzando una carretera llena de coches y un río con troncos y tortugas. Llena los cinco huecos de la orilla opuesta para completar el nivel. Cada nivel aumenta la velocidad del tráfico. ¿Cuántos niveles puedes superar?',
     'maze'
   );
   ```

5. **Añadir `frogger` en `app/games/page.tsx`**:

   ```ts
   COVER_MAP: { ..., frogger: "cover-frogger" }
   COLOR_MAP: { ..., frogger: "#4caf50" }
   ```

   Añadir clase `cover-frogger` en `globals.css`:

   ```css
   .cover-frogger {
     background: linear-gradient(135deg, #1b5e20 0%, #4caf50 60%, #81c784 100%);
   }
   ```

6. **Verificación**
   - `npm run build` sin errores TypeScript
   - `npm run dev`, navegar a `/games` → Frogger aparece en la lista con fondo verde
   - `/games/frogger` → página de detalle con leaderboard vacío
   - `/games/frogger/play` → canvas 480×560 visible, rana responde a flechas, coches y troncos se mueven
   - Jugar hasta perder las 3 vidas → modal de nombre → guardar → score en `/games/frogger` y en `/hall`
   - Rejugar sin refresh: salir con FIN, volver a entrar → canvas activo, sin pantalla negra, sin `SyntaxError`

## Criterios de aceptación

- [ ] `public/games/frogger/game.js` tiene los 4 parches del contrato (IIFE, pausa, gameState, gameOver event)
- [ ] Al llegar a 0 vidas en `/games/frogger/play`, se emite evento custom `gameOver` una sola vez
- [ ] Prompt/modal de nombre aparece tras game over
- [ ] Score se inserta en `scores` con `player_name` y `game_id` correctos
- [ ] `games.matches_played` se incrementa tras cada partida guardada
- [ ] `games.best_score` se actualiza si el score nuevo supera el anterior
- [ ] `/games/frogger` muestra sección leaderboard con top 10
- [ ] Leaderboard ordenado por `score DESC`, desempate `created_at ASC`
- [ ] `/games` lista Frogger (leído desde Supabase)
- [ ] `/hall` muestra scores de Frogger en tab "TODOS" y en su tab específico
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] HUD de plataforma visible en play: JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, botones PAUSA y FIN
- [ ] Canvas 480×560 dentro del área `crt-screen`, rana responde a flechas, coches y troncos se mueven
- [ ] Rejugar sin refresh: salir con FIN, volver a entrar → canvas activo, sin pantalla negra, sin `SyntaxError`

## Decisiones tomadas y descartadas

| Decisión                        | Elegida                       | Descartada                             | Razón                                                                                              |
| ------------------------------- | ----------------------------- | -------------------------------------- | -------------------------------------------------------------------------------------------------- |
| Auth para scores                | Sin auth, nombre libre        | Requerir sesión activa                 | Auth no implementada; no bloquea leaderboard                                                       |
| Trigger game over               | Evento custom `gameOver`      | Polling de `window.gameState`          | Más limpio; evita polling en el componente React                                                   |
| `best_score` / `matches_played` | Desnormalizado + RPC          | Derivado con COUNT/MAX                 | Queries simples; actualización atómica via RPC                                                     |
| Scope del leaderboard           | Sección en página del juego   | Página `/leaderboard` dedicada         | Consistente con patrón Asteroids/Arkanoid/Snake                                                    |
| Carga de game.js                | `useEffect` + script nativo   | `<Script>` de next/script              | Next.js deduplica `<Script>` entre navegaciones; script nativo fuerza re-ejecución en cada montaje |
| Scope de variables en game.js   | IIFE envuelve todo el archivo | Variables en scope global              | Sin IIFE, `const X` en scope global lanza `SyntaxError` al rejugar                                 |
| Archivos extra                  | Ninguno (formas canvas 2D)    | Sprites PNG / spritesheet              | Sin assets externos elimina riesgo de 404 y simplifica la carga de scripts                         |
| Proporción del crt-screen       | `6/7` (vertical)              | `4/3` (horizontal, usado en Asteroids) | Canvas 480×560 es vertical; ajustar el ratio evita bandas negras excesivas en pantalla             |
