# Spec 12 — Frogger Performance

| Campo        | Valor                                                                                                                                     |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------- |
| Estado       | Implementado                                                                                                                              |
| Dependencias | spec-jam/frogger (integración core de FroggerGame.tsx)                                                                                    |
| Fecha        | 2026-08-12                                                                                                                                |
| Objetivo     | Eliminar los frame drops y la fuga de memoria en FroggerGame.tsx cacheando capas estáticas del canvas y reduciendo allocations por frame. |

## Scope

### Dentro

- `components/games/FroggerGame.tsx` únicamente
- Offscreen canvas para capa estática (fondos de zona, dashes de carretera, shimmer de río) — pre-renderizado una vez al montar y cuando cambia el skin; almacenado en `useRef<HTMLCanvasElement>`
- Skip de draw completo cuando el juego está pausado y el estado visual no cambió (dirty flag en `useRef<boolean>`)
- Indexar `lanes` por fila con un `Map<number, Lane>` en `useRef` para eliminar `Array.find` O(n) por frame
- Reducir `beginPath()`/`arc()`/`ellipse()` por frame agrupando paths donde sea posible

### Restricciones de implementación

- **Cero `useState` nuevo** — todo estado mutable en `useRef`; las callbacks hacia el padre (`onScoreChange`, etc.) ya son el único canal de re-render externo, no se añaden más
- No se introduce ningún estado React que provoque re-render del componente

### Fuera de scope

- Otros juegos (Asteroids, Tetris, Arkanoid, Snake)
- Cambios en `app/games/frogger/play/page.tsx`
- Lógica de gameplay, skins, leaderboard
- `OffscreenCanvas` en Worker
- Profiling con DevTools (root cause ya identificada en revisión de código)

## Modelo de datos / Componentes

No hay datos nuevos ni cambios de props/API del componente. Cambios internos en `FroggerGame.tsx`:

### Refs nuevos

```ts
const staticBgRef = useRef<HTMLCanvasElement | null>(null); // offscreen canvas capa estática
const laneMapRef = useRef<Map<number, Lane>>(new Map()); // lanes indexadas por fila
const dirtyRef = useRef<boolean>(true); // fuerza redraw tras cambio de estado
```

### Offscreen canvas — contenido

`staticBgRef` pre-renderiza una sola vez (y cuando cambia el skin):

| Elemento                 | Cambio vs. hoy                           |
| ------------------------ | ---------------------------------------- |
| Fondos de zona (14 rows) | `fillRect` x14 → 1 `drawImage` por frame |
| Road lane dashes         | stroke x4 → incluido en offscreen        |
| River shimmer lines      | 30 strokes → incluido en offscreen       |

### dirty flag

`dirtyRef` se pone a `true` cuando:

- El juego NO está pausado (cada tick de update)
- El skin cambia

Cuando el juego está pausado y `dirtyRef === false`, el loop llama `requestAnimationFrame` pero omite `draw()`.

## Plan de implementación

1. **Añadir refs nuevos** — `staticBgRef`, `laneMapRef`, `dirtyRef` al componente. Sin lógica aún.

2. **Función `buildStaticBg(skin)`** — crea/reutiliza un `<canvas>` offscreen 640×560, dibuja los 14 fondos de zona, road dashes y river shimmer. Devuelve el canvas. Llamada en el `useEffect` principal al montar. Resultado guardado en `staticBgRef`.

3. **Actualizar `useEffect([skin])`** existente — llamar `buildStaticBg(skin)` y guardar en `staticBgRef`; poner `dirtyRef.current = true`.

4. **Reemplazar fondos en `draw()`** — sustituir los 14 `fillRect` + dashes + shimmer por `ctx.drawImage(staticBgRef.current, 0, 0)`.

5. **Indexar lanes en `laneMapRef`** — tras cada `buildLanes()` (arranque y `completeRound`), poblar el Map. Reemplazar todos los `lanes.find(l => l.row === ...)` por `laneMapRef.current.get(row)`.

6. **dirty flag en el loop** — en `update()`: si no está pausado, poner `dirtyRef.current = true`. En `loop()`: llamar `draw()` solo si `dirtyRef.current`; resetear a `false` tras dibujar.

7. **Verificar cleanup** — confirmar que `cancelAnimationFrame` y `clearTimeout(respawnTimerRef)` ya cubren todo el teardown. No añadir lógica nueva si ya es correcto.

8. **Smoke test** — arrancar juego, verificar: sin frame drops visibles, memoria estable en DevTools después de 30s de gameplay, skin switch funciona, pausa funciona.

## Criterios de aceptación

- [ ] El canvas redibuja el fondo estático con un solo `drawImage` por frame (sin `fillRect` x14, sin dashes, sin shimmer en el loop)
- [ ] `laneMapRef` indexa las lanes; no hay `Array.find` sobre `gs.lanes` en el loop de juego
- [ ] Cero `useState` nuevo en `FroggerGame.tsx`
- [ ] Cambiar de skin reconstruye el offscreen canvas y el juego sigue corriendo sin artefactos
- [ ] Pausar el juego detiene los redraws (dirty flag); reanudar los reactiva
- [ ] Memoria en DevTools (pestaña Memory → Heap snapshot) no crece de forma sostenida tras 30s de gameplay en Chrome desktop
- [ ] Gameplay, colisiones, timer, leaderboard y skins funcionan igual que antes

## Decisiones tomadas y descartadas

| Decisión                                      | Resultado     | Razón                                                               |
| --------------------------------------------- | ------------- | ------------------------------------------------------------------- |
| Offscreen canvas para capa estática           | ✅ Adoptado   | Elimina 44+ ops de canvas por frame en un solo `drawImage`          |
| `OffscreenCanvas` en Web Worker               | ❌ Descartado | Complejidad alta; la causa raíz no requiere multi-thread            |
| Capa de entidades en offscreen canvas         | ❌ Descartado | Las entidades se mueven cada frame; caché no aplica                 |
| `useState` para dirty flag / offscreen canvas | ❌ Descartado | Provocaría re-renders innecesarios; `useRef` es suficiente          |
| Perfilar con DevTools antes de implementar    | ❌ Descartado | Root cause identificada en revisión de código; decisión del usuario |
| Scope a todos los juegos                      | ❌ Descartado | Otros juegos son `game.js` vanilla sin el mismo patrón React        |
