---
spec: 01-frogger-game
title: Frogger
subtitle: mecánica del juego
state: Borrador
date: 2026-08-09
objective: Implementar el juego Frogger en canvas/JS vanilla como juego jugable en Arcade Vault, listo para la integración con la plataforma.
dependencies: 01-mvp-visual, 04-supabase-setup
---

## Alcance

**Dentro:**

- Crear `public/games/frogger/game.js` desde cero con:
  - Canvas 480×560px, `id="canvas"` (requerido por el contrato de integración)
  - Loop de animación con `requestAnimationFrame`
  - Rana controlada por el jugador que debe cruzar una carretera con coches y un río con troncos/tortugas
  - Controles: teclas de flecha (ArrowUp / ArrowDown / ArrowLeft / ArrowRight)
  - Sistema de score: puntos por avance hacia arriba, bonus por llegar a un hueco del río, bonus de tiempo
  - Condición de game over: perder las 3 vidas (atropellada, ahogada o caída fuera del tronco)
  - Estructura preparada para el contrato de integración (IIFE, `window.gameState`, evento `gameOver`)

**Fuera de scope:**

- Guardado de scores en Supabase — en spec 02
- HUD de plataforma (JUGADOR, PUNTUACIÓN, VIDAS, NIVEL, PAUSA, FIN) — en spec 02
- Autenticación
- Controles táctiles / mobile
- Sprites o imágenes — implementar con formas geométricas canvas 2D (rectángulos y arcos)

## Modelo de datos

```js
// Estado del juego
const state = {
  score: 0,
  lives: 3,
  level: 1,   // sube al completar todas las filas de destino
  gameOver: false,
};

// Rana (jugador)
const frog = {
  x: 240,       // centro del canvas
  y: 520,       // fila inicial (inferior)
  size: 32,     // lado del sprite cuadrado
  moving: false,
};

// Carriles de carretera (filas 4-8 desde abajo)
const roadLanes = [
  { y: 440, speed: 1.5, direction: 1,  cars: [...] },
  { y: 380, speed: 2.0, direction: -1, cars: [...] },
  { y: 320, speed: 2.5, direction: 1,  cars: [...] },
  { y: 260, speed: 1.8, direction: -1, cars: [...] },
  { y: 200, speed: 3.0, direction: 1,  cars: [...] },
];

// Carriles de río (filas 9-13 desde abajo, entre carretera y destino)
const riverLanes = [
  { y: 140, speed: 1.2, direction: -1, logs: [...] },
  { y: 100, speed: 1.8, direction: 1,  logs: [...] },
  { y: 60,  speed: 1.0, direction: -1, logs: [...] },
];

// Huecos de destino en la fila superior (5 posiciones)
const slots = [
  { x: 20,  filled: false },
  { x: 116, filled: false },
  { x: 212, filled: false },
  { x: 308, filled: false },
  { x: 404, filled: false },
];
```

Convenciones:

- Coordenadas: origen arriba-izquierda, X a la derecha, Y hacia abajo
- Velocidades en píxeles por frame (60 fps target)
- `direction`: `1` = derecha, `-1` = izquierda
- Cada `car` / `log` es `{ x, width }`. La `y` la hereda del carril.
- Un vehículo / tronco que sale del canvas reaparece por el lado contrario (wrap-around)

## Plan de implementación

1. **Esqueleto y canvas** — crear `public/games/frogger/game.js` con IIFE wrapper, canvas `id="canvas"` 480×560, loop vacío con `requestAnimationFrame`. Verificar: canvas visible con fondo negro en una página HTML simple.

2. **Dibujo de escenario** — pintar la zona inferior (zona de espera, color gris oscuro), los cinco carriles de carretera (negro asfalto con líneas discontinuas amarillas), la franja central de descanso (verde), los tres carriles de río (azul), y la franja de destino (verde oscuro con 5 huecos blancos). Verificar: escenario reconocible sin objetos móviles.

3. **Entidades móviles** — añadir coches (rectángulos rojos/amarillos/celestes según carril) y troncos/tortugas (rectángulos marrones) con wrap-around. Verificar: coches y troncos se desplazan correctamente en ambas direcciones.

4. **Rana y controles** — dibujar la rana (arco verde + ojos). Capturar `keydown` con ArrowUp/Down/Left/Right para mover la rana una celda (40px) en la dirección pulsada, clampear dentro del canvas. Ignorar input mientras la rana está en medio de un movimiento (flag `moving`). Verificar: rana responde a teclas, no sale del canvas.

5. **Lógica de río** — si la rana está en un carril de río y NO está encima de un tronco, muere (pierde una vida, vuelve a la posición inicial). Si está encima de un tronco, se desplaza con él en X. Verificar: rana se mueve con el tronco y muere al caer al agua.

6. **Colisión con coches** — si la bounding box de la rana solapa con la de cualquier coche, pierde una vida y vuelve al inicio. Verificar: colisión detectada frame a frame en la zona de carretera.

7. **Destino y puntuación**:
   - Llegar a la fila superior sin slot: muere (sin slot libre en esa posición).
   - Llegar a un slot libre: `score += 50 + timeBonus`, slot marcado como `filled`, rana vuelve al inicio.
   - Al llenar los 5 slots: `level++`, velocidades aumentan un 15%, slots se vacían, `score += 100 * level`.
   - Avance hacia arriba (por fila cruzada): `score += 10`.
   - Verificar: score sube correctamente en cada acción.

8. **Game over y contrato** — cuando `lives` llegue a 0: `gameOver = true`. Añadir los 4 parches del contrato:
   - IIFE ya en paso 1.
   - `window.gamePaused` al inicio del loop: si es true, llamar `requestAnimationFrame(loop)` y retornar.
   - `window.gameState = { score, lives, level, gameOver }` al final de cada tick del loop.
   - `gameOverFired = false` al inicio (dentro de IIFE), reset en la función `init()`, disparar cuando `lives <= 0` con `CustomEvent("gameOver", { detail: { score } })`.
   - Verificar: `window.gameState` actualizado en cada tick; `gameOver` event disparado exactamente una vez.

## Criterios de aceptación

- [ ] `public/games/frogger/game.js` existe y tiene el IIFE wrapper completo
- [ ] Canvas `id="canvas"` 480×560 visible al cargar
- [ ] Controles responden: ArrowUp/Down/Left/Right mueven la rana una celda
- [ ] Coches y troncos se desplazan y hacen wrap-around
- [ ] La rana muere al colisionar con un coche o al caer al agua (no encima de tronco)
- [ ] Score se incrementa al avanzar filas, al llegar a un slot y al completar nivel
- [ ] Game over ocurre cuando `lives === 0`
- [ ] `window.gameState` se escribe en cada tick con `{ score, lives, level, gameOver }`
- [ ] Evento `CustomEvent("gameOver")` se dispara exactamente una vez al terminar la partida
- [ ] `npm run build` pasa sin errores TypeScript
- [ ] Sin errores de consola al cargar y jugar

## Decisiones tomadas y descartadas

| Decisión               | Elegida                                               | Descartada                    | Razón                                                                                |
| ---------------------- | ----------------------------------------------------- | ----------------------------- | ------------------------------------------------------------------------------------ |
| Canvas id              | `id="canvas"` (contrato de plataforma)                | `id="frogger"` o libre        | El contrato de integración hardcodea `id="canvas"`                                   |
| Scope de variables     | IIFE envuelve todo el archivo                         | Scope global                  | Sin IIFE, `const`/`let` en scope global lanza `SyntaxError` al rejugar               |
| Dimensiones del canvas | 480×560                                               | 640×480                       | Proporción vertical acentúa el recorrido de la rana y encaja en el HUD de plataforma |
| Tamaño de celda        | 40×40px por celda (12 filas × 40px = 480 + 80 margen) | 32px                          | Múltiplo limpio de 480; facilita alineación de objetos y colisiones                  |
| Sprites                | Formas geométricas canvas 2D                          | Imágenes PNG                  | Sin assets externos; más sencillo de implementar y sin riesgo de 404                 |
| Movimiento de rana     | Salto discreto por celda (40px)                       | Movimiento continuo           | Preserva la mecánica original de Frogger; más fácil de colisionar                    |
| Coches y troncos       | Rectángulos con wrap-around                           | Spawn/destroy fuera de canvas | Wrap-around mantiene densidad de tráfico constante y es más simple                   |
| Niveles                | Aumentar velocidad 15% al completar 5 slots           | Nuevos layouts                | Compatible con `level` del contrato; aumenta dificultad sin rediseñar el mapa        |

## Riesgos

| Riesgo                                                           | Mitigación                                                                                                |
| ---------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Detección de "rana sobre tronco" imprecisa por posición flotante | Usar centro de la rana (x + size/2) para hit-test; tronco válido si el centro cae dentro de sus límites X |
| Solapamiento de múltiples inputs del teclado                     | Flag `moving` que bloquea nuevo input hasta que el salto termina (1 frame discreto, no animado)           |
