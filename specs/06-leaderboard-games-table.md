---
spec: 06-leaderboard-games-table
title: Leaderboard y tabla de juegos en Supabase
state: Approved
date: 2026-08-03
objective: Crear tablas `games` y `scores` en Supabase, guardar score al terminar partida en Asteroids vía evento custom, y mostrar top 10 en la página del juego.
dependencies: 04-supabase-setup, 05-asteroids-game
---

## Alcance

**Dentro:**

- Tabla `games` en Supabase con campos: `id`, `slug`, `name`, `description_short`, `description_long`, `category`, `best_score`, `matches_played`, `created_at`
- Seeder: insertar fila de Asteroids en `games`
- Tabla `scores` en Supabase: `id`, `game_id` (FK → games), `player_name`, `score`, `created_at`
- RLS habilitado en ambas tablas (lectura pública, escritura pública sin auth)
- Parche en `public/games/asteroids/game.js`: emitir evento custom `gameOver` con `{ score }` al terminar partida
- En `app/games/asteroids/play/page.tsx`: escuchar evento `gameOver`, pedir nombre al jugador, guardar score en Supabase
- Actualizar `games.best_score` y `games.matches_played` tras cada partida guardada
- Sección leaderboard en `/games/asteroids` (página de detalle del juego): top 10 scores con nombre y puntuación, estilo visual del resto de la plataforma

**Fuera:**

- Autenticación — sin auth en este spec
- Leaderboard global (todos los juegos juntos) — spec posterior
- Página `/leaderboard` dedicada — spec posterior
- Otros juegos distintos de Asteroids
- Validación de scores en servidor (anti-cheat)
- Paginación del leaderboard (solo top 10)

## Modelo de datos

### Tabla `games`

| Campo               | Tipo          | Notas                                  |
| ------------------- | ------------- | -------------------------------------- |
| `id`                | `uuid`        | PK, `gen_random_uuid()`                |
| `slug`              | `text`        | único, e.g. `"asteroids"`              |
| `name`              | `text`        | e.g. `"Asteroids"`                     |
| `description_short` | `text`        | descripción corta, e.g. card/hero      |
| `description_long`  | `text`        | descripción larga, e.g. página detalle |
| `category`          | `text`        | e.g. `"arcade"`                        |
| `best_score`        | `integer`     | desnormalizado, default `0`            |
| `matches_played`    | `integer`     | desnormalizado, default `0`            |
| `created_at`        | `timestamptz` | default `now()`                        |

### Tabla `scores`

| Campo         | Tipo          | Notas                   |
| ------------- | ------------- | ----------------------- |
| `id`          | `uuid`        | PK, `gen_random_uuid()` |
| `game_id`     | `uuid`        | FK → `games.id`         |
| `player_name` | `text`        | nombre libre, sin auth  |
| `score`       | `integer`     | puntuación final        |
| `created_at`  | `timestamptz` | default `now()`         |

### RLS

- `games`: SELECT público, INSERT/UPDATE solo via service role (datos gestionados por dev)
- `scores`: SELECT público, INSERT público sin auth

### Seeder

```sql
INSERT INTO games (slug, name, description_short, description_long, category)
VALUES (
  'asteroids',
  'Asteroids',
  'Destruye asteroides. Sobrevive.',
  'Nave en campo abierto, asteroides de todos los tamaños. Los grandes se fragmentan en medianos, los medianos en pequeños. A partir del nivel 5 aparecen OVNIs hostiles.',
  'arcade'
);
```

## Plan de implementación

1. **Migración Supabase — tabla `games`**
   - Crear tabla con campos definidos en el modelo de datos
   - Habilitar RLS: SELECT público, INSERT/UPDATE solo service role
   - Ejecutar seeder de Asteroids

2. **Migración Supabase — tabla `scores`**
   - Crear tabla con FK a `games.id`
   - Habilitar RLS: SELECT público, INSERT público sin auth

3. **Parche `public/games/asteroids/game.js`**
   - Al detectar Game Over en el game loop, emitir:
     ```js
     window.dispatchEvent(
       new CustomEvent("gameOver", { detail: { score: ship.score } }),
     );
     ```
   - Un solo disparo por partida (guardar flag para no emitir doble)

4. **`app/games/asteroids/play/page.tsx`**
   - Registrar listener `window.addEventListener('gameOver', handler)` en `useEffect`
   - Handler: mostrar prompt/modal pidiendo `player_name`
   - Llamar cliente Supabase browser para INSERT en `scores`
   - Tras INSERT exitoso: UPDATE `games` — incrementar `matches_played`, actualizar `best_score` si el score nuevo es mayor
   - Limpiar listener en cleanup del `useEffect`

5. **`app/games/asteroids/page.tsx` (página de detalle)**
   - Leer top 10 de `scores` JOIN `games` donde `slug = 'asteroids'`, ordenado por `score DESC`, `created_at ASC` como desempate
   - Renderizar sección leaderboard con tabla: posición, nombre, puntuación
   - Estilo visual consistente con el resto de la plataforma

6. **Verificación**
   - `npm run dev`, jugar partida en `/games/asteroids/play`, llegar a Game Over
   - Prompt de nombre aparece, score se guarda en Supabase
   - Navegar a `/games/asteroids`, top 10 muestra la partida guardada
   - `npm run build` pasa sin errores TypeScript

## Criterios de aceptación

- [x] Tabla `games` existe en Supabase con todos los campos del modelo (incluye `description_short` y `description_long`)
- [x] Tabla `scores` existe en Supabase con FK a `games.id`
- [x] RLS habilitado en ambas tablas según política definida
- [x] Fila de Asteroids existe en `games` con slug `"asteroids"`
- [x] Al llegar a Game Over en `/games/asteroids/play`, se emite evento custom `gameOver`
- [ ] Prompt/modal de nombre aparece tras Game Over
- [ ] Score se inserta en `scores` con `player_name` y `game_id` correctos
- [ ] `games.matches_played` se incrementa tras cada partida guardada
- [ ] `games.best_score` se actualiza si el score nuevo supera el anterior
- [ ] `/games/asteroids` muestra sección leaderboard con top 10
- [ ] Leaderboard ordenado por `score DESC`, desempate `created_at ASC`
- [ ] `npm run build` pasa sin errores TypeScript

## Decisiones tomadas y descartadas

| Decisión                        | Elegida                                  | Descartada                           | Razón                                                              |
| ------------------------------- | ---------------------------------------- | ------------------------------------ | ------------------------------------------------------------------ |
| Auth para scores                | Sin auth, nombre libre                   | Requerir sesión activa               | Auth no implementada aún; unblock leaderboard sin blocker de spec  |
| Trigger Game Over               | Evento custom `gameOver` desde `game.js` | Polling de `window.gameState.lives`  | Más limpio; evita polling en el componente React                   |
| `best_score` / `matches_played` | Desnormalizado en `games`                | Derivado con COUNT/MAX en cada query | Queries de leaderboard más simples; actualización al guardar score |
| Scope del leaderboard           | Sección en página del juego              | Página `/leaderboard` dedicada       | Decisión del usuario; global leaderboard queda para spec posterior |
| Leaderboard global              | Fuera de scope                           | Incluir en este spec                 | Complejidad adicional; solo hay un juego por ahora                 |
| Anti-cheat                      | Fuera de scope                           | Validar score en servidor            | Early stage; sin usuarios reales aún                               |
| Scores de otros juegos          | Fuera de scope                           | Generalizar para todos los juegos    | Solo existe Asteroids; generalizar ahora es especulativo           |

## Riesgos identificados

- **Doble emisión de `gameOver`**: Si el game loop llama al handler más de una vez, se insertarían scores duplicados. Mitigar con flag booleano en `game.js` que se activa al primer disparo y no se resetea hasta nueva partida.

- **`game.js` corre en `public/`**: No tiene acceso al cliente Supabase — el INSERT debe hacerse en el componente React que escucha el evento, no en el script vanilla.

- **UPDATE de `best_score` con race condition**: Si dos partidas terminan simultáneamente, el UPDATE puede sobrescribir con un valor incorrecto. Aceptable en early stage; mitigación futura con función RPC en Supabase.

- **`player_name` vacío o malicioso**: Sin auth ni validación server-side, cualquier texto puede entrar. Mitigar con trim + longitud máxima en el cliente.
