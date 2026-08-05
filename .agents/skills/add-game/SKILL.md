---
name: add-game
description: Genera un spec para integrar un juego canvas/JS vanilla (de references/started-games o externo) con leaderboard e integración de plataforma, siguiendo el patrón de Asteroids (specs 05/06). No escribe código; produce specs/NN-slug.md listo para /spec-impl.
disable-model-invocation: true
argument-hint: "nombre o ruta del juego (opcional, ej: tetris o references/started-games/03-tetris)"
---

# /add-game — Diseñador de specs para integrar un juego nuevo

Esta skill genera un spec concreto y ejecutable para integrar un juego canvas/JS vanilla en Arcade Vault: plataforma Next.js con Supabase, leaderboard, HUD, y salón de la fama. **No escribes código aquí.** Tu trabajo es entender el juego concreto, hacer las preguntas necesarias, y producir un spec limpio que `/spec-impl` pueda ejecutar sin ambigüedades.

## El contrato de integración (lo que ya sabes)

Arcade Vault usa un contrato fijo para conectar React con cualquier juego canvas/JS vanilla vía `window`. Tú ya lo conoces — lo que varía son los detalles del juego específico (nombres de variables, dimensiones, archivos extra).

**Tres parches en `game.js`** + **un requisito estructural:**

0. **IIFE wrapper** — todo el contenido de `game.js` debe estar envuelto en una IIFE. Esto evita que las declaraciones `const`/`let` del nivel superior queden en el scope global, lo que causaría `SyntaxError: Identifier 'X' has already been declared` al rejugar sin refresh de página (Next.js no re-ejecuta scripts cacheados; el useEffect los reinyecta, pero el scope global persiste entre montajes).

   ```js
   // Inicio del archivo (reemplaza "use strict"; suelto):
   (function () {
     "use strict";

     // ... todo el código del juego ...
   })(); // cierre al final del archivo
   ```

1. **Pausa** — al inicio de la función de loop principal:
   ```js
   if (window.gamePaused) {
     requestAnimationFrame(loop);
     return;
   }
   ```
2. **Estado HUD** — al final de cada tick del loop:
   ```js
   window.gameState = { score, lives, level, gameOver };
   ```
   _(los nombres exactos de las variables dependen del juego — debes localizarlos en Fase 1)_
3. **Evento game over** — una sola vez, protegido por un flag (para evitar duplicados):
   ```js
   // Declarar al inicio del archivo:
   let gameOverFired = false;
   // Resetear en la función que inicia/reinicia la partida:
   gameOverFired = false;
   // Disparar en la condición de game over:
   if (!gameOverFired) {
     gameOverFired = true;
     window.dispatchEvent(new CustomEvent("gameOver", { detail: { score } }));
   }
   ```

**Contrato del canvas:** el `<canvas>` en la play page de React debe tener `id="canvas"` (hardcoded en `game.js` con `document.getElementById("canvas")`). Las dimensiones W×H deben coincidir con las del juego.

**Patrón de persistencia (play page, browser client):**

```ts
const { data: gameRow } = await supabase
  .from("games")
  .select("id, best_score")
  .eq("slug", SLUG)
  .single();
await supabase.from("scores").insert({
  game_id: gameRow.id,
  player_name: name.trim().slice(0, 12),
  score: finalScore,
});
await supabase.rpc("increment_game_stats", {
  p_game_id: gameRow.id,
  p_score: finalScore,
});
```

Las tablas `games` y `scores`, y el RPC `increment_game_stats`, ya existen en Supabase. Solo falta insertar la fila del nuevo juego.

**Lecturas Supabase (server client, Server Components):** `/games` y `/hall` ya consumen todos los juegos de la tabla — se auto-actualizan al insertar una fila nueva. Solo hay que añadir entradas en `COVER_MAP` y `COLOR_MAP` en `app/games/page.tsx`.

**Plantillas disponibles** (el spec dirá copiarlas y adaptar el slug):

- Play page: `app/games/asteroids/play/page.tsx`
- Detail + leaderboard: `app/games/asteroids/page.tsx`

---

## Flujo de la skill

Sigue las cuatro fases en orden. **No saltes fases.** Tus respuestas deben estar en el mismo idioma que el prompt inicial.

---

### Fase 1 — Carga de contexto

Antes de hacer preguntas al usuario, reúne el contexto del proyecto y del juego:

1. Lee `CLAUDE.md` o `AGENTS.md` (el primero que exista).
2. Lista `specs/` para ver qué specs existen y cuál es el siguiente número secuencial.
3. Lee los specs `05-asteroids-game.md` y `06-leaderboard-games-table.md` para tener presente el estilo y las decisiones ya tomadas. Si no existen con ese nombre exacto, busca por número (05-_.md, 06-_.md).
4. Lee la skill `/spec` como referencia maestra de diseño de specs:
   - Lee `.agents/skills/spec/SKILL.md` — entiende su filosofía de fases, las categorías de preguntas, las reglas de construcción sección por sección, y las hard rules. Esta skill sigue el mismo método; `/spec` es el contrato que defines cómo deben quedar los specs en este proyecto.
   - Lee `.agents/skills/spec/template.md` — la estructura canónica que todo spec debe respetar (cabecera, alcance, modelo de datos, plan, criterios, decisiones, riesgos). Úsala como referencia de formato al generar cada sección en Fase 3.
5. Si `$ARGUMENTS` tiene un valor que parece una carpeta de juego (ej: `tetris`, `03-tetris`, `references/started-games/03-tetris`):
   - Localiza la carpeta: primero en `references/started-games/`, luego como ruta directa.
   - Lista sus archivos. Detecta si hay archivos extra además de `game.js` (por ejemplo: `levels.js`, carpeta `assets/`, múltiples `.js`).
   - Lee las primeras 80–100 líneas de `game.js` para identificar: nombre de las variables de score, vidas, nivel; nombre de la función de loop; dimensiones del canvas (W, H); cómo se detecta el game over.
6. Si `$ARGUMENTS` está vacío, omite el paso 5 — lo preguntarás en Fase 2.

Con esta información, ya puedes empezar a preguntar de forma concreta, no genérica.

---

### Fase 2 — Preguntas al usuario

Este es el paso más importante. Tu objetivo: obtener todos los valores que harán el spec ejecutable sin ambigüedades. Haz preguntas en bloques de 3 a 5; espera respuesta antes de continuar.

**Bloque A — Identidad del juego** (si no lo deduces de `$ARGUMENTS`):

1. **Fuente del juego.** ¿Viene de `references/started-games/` o tienes una ruta/archivo diferente? Si viene de references, ¿qué carpeta exacta?
2. **Slug.** Identificador URL-friendly en minúsculas (ej: `tetris`, `arkanoid`). Propón uno basado en el nombre y confirma.
3. **Nombre para mostrar.** El título tal como aparecerá en tarjetas y cabeceras (ej: `Tetris`).
4. **`description_short`** (≤80 chars, para la tarjeta en `/games`). Propón uno si conoces el juego.
5. **`description_long`** (2-4 frases, para la página de detalle). Propón uno si conoces el juego.
6. **`category`** — ej: `arcade`, `puzzle`, `strategy`. Recomendación basada en el tipo de juego.

**Bloque B — Detalles técnicos del juego** (si no los dedujiste en Fase 1):

7. **Nombre de la función de loop** en `game.js` (ej: `loop`, `gameLoop`, `tick`). Debe ser donde van los tres parches.
8. **Variable de score** (ej: `score`, `points`, `totalScore`).
9. **Variable de vidas** (ej: `lives`, `hp`, `lifes`). Si el juego no tiene vidas, ¿cómo indica game over? ¿Qué poner en `lives` del HUD?
10. **Variable de nivel** (ej: `level`, `stage`, `wave`). Si el juego no tiene niveles, usa `1` como constante.
11. **Dimensiones del canvas** — W×H en píxeles. Si las viste en el código o en `index.html`, confírmalas.
12. **Archivos extra** — además de `game.js`, ¿hay otros archivos a copiar? (ej: `levels.js`, carpeta `assets/` con imágenes/sonidos). Listarlos en orden de carga.

**Bloque C — Plataforma y visual**:

13. **Clase CSS del cover** — en `app/games/page.tsx` existe un `COVER_MAP` que asigna una clase CSS al slug (ej: `cover-rocas` para asteroids). ¿Existe ya una clase para este juego o hay que crear una nueva? Si hay que crearla, ¿qué nombre usamos?
14. **Color de tarjeta** — el `COLOR_MAP` asigna un color hex/CSS al slug (ej: `#c7d0e0` para asteroids). ¿Qué color propones para este juego?
15. **¿Alguna decisión ya tomada?** Algo que el usuario ya haya decidido y no quiere reabrir.

**Cuándo parar de preguntar:** cuando puedas rellenar sin asumir nada: el plan de implementación de 7 pasos completo, los criterios de aceptación booleanos, y la fila SQL del juego.

---

### Fase 3 — Construir el spec sección por sección

Una vez tengas claridad, construye el spec **sección por sección** siguiendo el orden del template, mostrando cada sección y esperando confirmación antes de continuar.

**Orden estricto:**

#### 3.1 — Cabecera

```markdown
# SPEC NN — Integración de <NombreJuego>: plataforma + leaderboard

> **Estado:** Borrador
> **Depende de:** 04-supabase-setup, 06-leaderboard-games-table
> **Fecha:** YYYY-MM-DD
> **Objetivo:** Integrar el juego <NombreJuego> (canvas/JS vanilla) en Arcade Vault con HUD, guardado de scores en Supabase y leaderboard en la página del juego.
```

Presenta, pide confirmación, ajusta si piden cambios. Solo continúa cuando confirmen.

#### 3.2 — Alcance

**Dentro** (adaptar con los detalles del juego):

- Copiar `game.js` (y assets si aplica) → `public/games/<slug>/`
- Parchar `game.js`: pausa, HUD state, evento `gameOver` (una sola vez)
- `app/games/<slug>/play/page.tsx`: HUD de plataforma, canvas, listener `gameOver`, modal de nombre, INSERT en `scores`, RPC `increment_game_stats`
- `app/games/<slug>/page.tsx`: datos desde Supabase, leaderboard top 10
- Insertar fila en tabla `games` vía Supabase MCP
- Añadir `<slug>` en `COVER_MAP` y `COLOR_MAP` de `app/games/page.tsx`

**Fuera de scope** (siempre incluir estas):

- Autenticación — sin auth en este spec
- Anti-cheat / validación de scores en servidor
- Controles táctiles / mobile
- Otros juegos distintos de `<slug>`
- Paginación del leaderboard (solo top 10)

Presenta, pide confirmación.

#### 3.3 — Modelo de datos

El modelo de Supabase ya está definido (specs 05/06). Solo documenta la fila a insertar:

```sql
INSERT INTO games (slug, name, description_short, description_long, category)
VALUES (
  '<slug>',
  '<NombreJuego>',
  '<description_short>',
  '<description_long>',
  '<category>'
);
```

Y los tipos de `window` que usa la play page:

```ts
type GameState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};
type Win = Window & { gamePaused?: boolean; gameState?: GameState };
```

Si el juego no tiene vidas/niveles, documenta el valor constante acordado.

Presenta, pide confirmación.

#### 3.4 — Plan de implementación

Siempre 7 pasos en este orden (adaptar detalles de `<slug>`, variables, archivos extra):

````markdown
## Plan de implementación

1. **Copiar archivos del juego** → `public/games/<slug>/`
   - Fuente: `<ruta-fuente>/game.js` (y assets si aplica)
   - Si hay archivos extra (`levels.js`, `assets/`): copiarlos manteniendo la estructura de carpetas

2. **Parchar `public/games/<slug>/game.js`** (4 ediciones):
   - Envolver **todo** el archivo en IIFE: `(function () { "use strict"; ... })();` — elimina `"use strict";` suelto del inicio y cierra la IIFE al final. Crítico para rejugar sin refresh.
   - Al inicio de la función `<nombreLoop>`: añadir check de pausa (`window.gamePaused`)
   - Al final de cada tick del loop: escribir `window.gameState = { score: <varScore>, lives: <varLives>, level: <varLevel>, gameOver: <condición> }`
   - En la condición de game over: declarar `gameOverFired = false` al inicio, resetear en `<funcionInit>`, disparar evento `gameOver` una sola vez con `{ detail: { score: <varScore> } }`

3. **Crear `app/games/<slug>/play/page.tsx`** — copiar `app/games/asteroids/play/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"<slug>"`
   - La play page usa `useEffect` con script nativo (NO `<Script>` de next/script) para forzar re-ejecución en cada montaje:
     ```ts
     useEffect(() => {
       const script = document.createElement("script");
       script.src = "/games/<slug>/game.js";
       document.body.appendChild(script);
       return () => {
         document.body.removeChild(script);
       };
     }, []);
     ```
   - Si hay archivos extra, agregar un `useEffect` por archivo en orden de carga
   - Dimensiones del canvas si difieren de 800×600

4. **Crear `app/games/<slug>/page.tsx`** — copiar `app/games/asteroids/page.tsx`, cambiar:
   - Literal `"asteroids"` → `"<slug>"`
   - Ruta de navegación a `/games/<slug>`

5. **Insertar fila en tabla `games` vía Supabase MCP** — usar `mcp__supabase__execute_sql` con:
   ```sql
   INSERT INTO games (slug, name, description_short, description_long, category)
   VALUES ('<slug>', '<NombreJuego>', '<desc_short>', '<desc_long>', '<category>');
   ```
````

6. **Añadir `<slug>` en `app/games/page.tsx`** — en `COVER_MAP` y `COLOR_MAP`:

   ```ts
   COVER_MAP: { ..., "<slug>": "<clase-css-cover>" }
   COLOR_MAP: { ..., "<slug>": "<color-hex>" }
   ```

7. **Verificación**
   - `npm run build` sin errores TypeScript
   - `npm run dev`, navegar a `/games` → el juego aparece en la lista
   - Navegar a `/games/<slug>` → página de detalle con leaderboard vacío
   - Navegar a `/games/<slug>/play` → canvas visible, controles funcionan, HUD lee score/vidas/nivel
   - Jugar hasta game over → modal de nombre aparece → guardar → score en leaderboard de `/games/<slug>` y en `/hall`

````

Presenta, pide confirmación.

#### 3.5 — Criterios de aceptación

Lista booleana, verificable, sin aspiraciones. Incluye siempre estos (adaptar slug):

```markdown
## Criterios de aceptación

- [ ] `public/games/<slug>/game.js` existe y tiene los 3 parches del contrato
- [ ] Al llegar a game over en `/games/<slug>/play`, se emite evento custom `gameOver` una sola vez
- [ ] Prompt/modal de nombre aparece tras game over
- [ ] Score se inserta en `scores` con `player_name` y `game_id` correctos
- [ ] `games.matches_played` se incrementa tras cada partida guardada
- [ ] `games.best_score` se actualiza si el score nuevo supera el anterior
- [ ] `/games/<slug>` muestra sección leaderboard con top 10
- [ ] Leaderboard ordenado por `score DESC`, desempate `created_at ASC`
- [ ] `/games` lista el nuevo juego (leído desde Supabase)
- [ ] `/hall` muestra scores del nuevo juego en tab "TODOS" y en su tab específico
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] HUD de plataforma visible en play: JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, botones PAUSA y FIN
- [ ] Canvas dentro del área `crt-screen`, controles del juego funcionan
- [ ] Rejugar sin refresh: navegar a `/games/<slug>/play`, salir (FIN), volver a entrar → canvas activo, sin pantalla negra, sin `SyntaxError` en consola
````

Añadir criterios adicionales si el juego tiene características particulares (sonidos, levels.js, etc.). Presenta, pide confirmación.

#### 3.6 — Decisiones tomadas y descartadas

Tabla con las decisiones clave del spec. Incluye siempre las que son comunes al patrón:

```markdown
| Decisión                        | Elegida                       | Descartada                     | Razón                                                                                                        |
| ------------------------------- | ----------------------------- | ------------------------------ | ------------------------------------------------------------------------------------------------------------ |
| Auth para scores                | Sin auth, nombre libre        | Requerir sesión activa         | Auth no implementada; no bloquea leaderboard                                                                 |
| Trigger game over               | Evento custom `gameOver`      | Polling de `window.gameState`  | Más limpio; evita polling en el componente React                                                             |
| `best_score` / `matches_played` | Desnormalizado + RPC          | Derivado con COUNT/MAX         | Queries simples; actualización atómica via RPC                                                               |
| Scope del leaderboard           | Sección en página del juego   | Página `/leaderboard` dedicada | Consistente con patrón Asteroids                                                                             |
| Carga de game.js                | `useEffect` + script nativo   | `<Script>` de next/script      | Next.js deduplica `<Script>` entre navegaciones; script nativo fuerza re-ejecución en cada montaje           |
| Scope de variables en game.js   | IIFE envuelve todo el archivo | Variables en scope global      | Sin IIFE, `const X` en scope global lanza `SyntaxError` al rejugar (el scope global persiste entre montajes) |
```

Añadir decisiones específicas del juego que surgieron en Fase 2. Presenta, pide confirmación.

#### 3.7 — Riesgos (solo si aplica)

Si hay riesgos no obvios (ej: el juego tiene múltiples archivos JS con dependencias, sonidos que necesitan interacción del usuario, estado global que interfiere con HUD), documéntalos. Si no hay nada relevante, omite la sección y dilo explícitamente.

---

### Fase 4 — Guardar el spec

Cuando todas las secciones estén confirmadas:

1. Determina el número secuencial: lista `specs/` y usa el siguiente disponible.
2. Propón el nombre de archivo: `NN-<slug>-plataforma-leaderboard.md` (o similar, basado en el objetivo). Confirma con el usuario antes de escribir.
3. Crea el archivo en `specs/NN-slug.md` con todas las secciones aprobadas.
4. Marca el estado como `Borrador` (o `Draft` si el repo usa inglés). **No marcar como `Aprobado` automáticamente.** Ese paso lo hace el usuario al releer.
5. Verifica que `specs/.spec-config.yml` existe. Si no existe, créalo con el contenido por defecto:
   ```yaml
   # spec workflow configuration
   AutoCreateBranch: true
   ```
6. Confirma al usuario:
   - Ruta del archivo creado.
   - Recordatorio: el spec está en `Borrador`. Cámbialo a `Aprobado` una vez lo hayas releído.
   - Próximo paso: cuando esté aprobado, corre `/spec-impl NN-slug`.
7. **Para aquí.** No propongas implementar, no escribas código, no sigas con nada más.

---

## Hard rules

- **Nunca escribas código en esta skill.** Solo el archivo `.md` del spec al final.
- **Nunca proponga implementar el spec tras guardarlo.** Tu trabajo termina cuando el archivo está escrito.
- **Nunca asumas decisiones que el usuario no confirmó.** Si te falta información, pregunta.
- **Nunca generes el spec completo en una sola respuesta.** Sección por sección, con confirmación.
- **Si el juego es demasiado diferente** del contrato (no usa canvas, no tiene loop de animación, requiere WebGL, etc.), señálalo en Fase 1 antes de continuar: el patrón puede no aplicar sin adaptaciones significativas.
- **Si el usuario quiere saltarse Fase 2**, recuérdale: "Las preguntas ahora evitan horas de ambigüedad luego. ¿Seguro que quieres saltarlas?" Si insiste, respétalo pero regístralo en la sección de decisiones.

## Argumento

Si el usuario invocó `/add-game tetris`, usa `tetris` para localizar la carpeta en `references/started-games/` y proponer el slug. Si invocó `/add-game` sin argumentos, empieza preguntando la fuente y el nombre del juego.

## Tono al preguntar

Directo y específico. Sin disculpas por preguntar. Preguntas numeradas cuando hay varias. Cuando ofrezcas opciones, da 2–4 y marca cuál recomiendas y por qué.

## Resumen del comportamiento esperado

```
/add-game tetris

  Fase 1  →  Lee CLAUDE.md, lista specs/, lee 05-*.md + 06-*.md
             Localiza references/started-games/03-tetris/
             Lee game.js: detecta loop, score, nivel, dims canvas
  Fase 2  →  Pregunta slug, descriptions, cover/color, confirma variables técnicas
  Fase 3  →  Genera sección por sección: cabecera → alcance → datos → plan → criterios → decisiones → riesgos
             Cada sección: muestra → espera confirmación → ajusta si piden → continúa
  Fase 4  →  Escribe specs/07-tetris-plataforma-leaderboard.md en estado Borrador
             Confirma ruta, recuerda cambiar a Aprobado, sugiere /spec-impl 07-tetris-...
             PARA.

/add-game  (sin argumentos)

  Fase 1  →  Lee contexto del proyecto, lista specs/
  Fase 2  →  Pregunta primero: ¿cuál es el juego y de dónde viene?
             Luego continúa con el resto de preguntas
  Fase 3+4 → igual que arriba
```
