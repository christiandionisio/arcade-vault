# Spec 10 — Mobile Touch Controls

| Campo        | Valor                                                                                                                                                                                               |
| ------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Estado       | Approved                                                                                                                                                                                               |
| Dependencias | 05 (Asteroids), 07 (Tetris), 08 (Arkanoid), 09 (Snake)                                                                                                                                              |
| Fecha        | 2026-08-09                                                                                                                                                                                          |
| Objetivo     | Añadir layout mobile y gamepad virtual táctil en las play pages de todos los juegos, ocultando el HUD desktop y exponiendo solo los controles esenciales (D-pad + 2 botones acción + PAUSA + skin). |

## Scope

### Dentro

- Layout responsive en `/games/<slug>/play` para dispositivos touch (`pointer: coarse`)
- Canvas ocupa 100% del ancho, aspect ratio preservado (no stretch)
- HUD desktop oculto en mobile
- Gamepad virtual HTML overlay debajo del canvas:
  - D-pad izquierda (↑ ↓ ← →)
  - 2 botones de acción derecha (A, B)
- Barra inferior bajo el gamepad: botón PAUSA + selector de skin
- Mapping de controles por juego:

  | Juego     | ↑/↓/←/→          | Botón A  | Botón B |
  | --------- | ---------------- | -------- | ------- |
  | Asteroids | Girar ←/→        | Disparar | Thrust  |
  | Tetris    | Mover ←/→/↓      | Rotar    | —       |
  | Arkanoid  | Mover paleta ←/→ | —        | —       |
  | Snake     | Cambiar dir.     | —        | —       |

- Controles táctiles inyectan eventos de teclado (`KeyboardEvent`) al `window` para no modificar `game.js` de cada juego
- Solo mobile (`pointer: coarse`); desktop sin cambios

### Fuera de scope

- Soporte tablet / landscape orientation
- Haptic feedback
- Gestos swipe (solo botones)
- Modificaciones a `game.js` de los juegos
- Rediseño del HUD desktop
- Joystick analógico (solo D-pad digital)

## Modelo de datos / Componentes nuevos

### `app/components/MobileGamepad.tsx`

Componente React client-side. Props:

```ts
interface MobileGamepadProps {
  keyMap: {
    up?: string; // KeyboardEvent.code, e.g. "ArrowUp"
    down?: string;
    left?: string;
    right?: string;
    actionA?: string;
    actionB?: string;
  };
  labelA?: string; // texto del botón A, e.g. "FIRE"
  labelB?: string; // texto del botón B, e.g. "THRUST"
  onPause: () => void;
}
```

Dispara `KeyboardEvent` sintético en `window` con `{ bubbles: true }` al presionar/soltar cada botón (touchstart → keydown, touchend → keyup). Solo se renderiza si `pointer: coarse` (via `window.matchMedia`).

## Plan de implementación

1. **Crear `app/components/MobileGamepad.tsx`**
   - Renderiza D-pad (4 flechas) + 2 botones acción + barra inferior (PAUSA + skin selector)
   - `touchstart` → dispara `keydown` sintético; `touchend` → `keyup`
   - CSS: solo visible con `@media (pointer: coarse)`
   - Usar `touch-action: none` en cada botón para prevenir scroll accidental

2. **Adaptar layout de cada play page** (`asteroids`, `tetris`, `arkanoid`, `snake`)
   - En mobile: canvas `width: 100%`, `aspect-ratio` preservado, sin altura fija
   - HUD existente: `hidden pointer-fine:flex` (oculto en touch, visible en mouse)
   - Montar `<MobileGamepad>` con el `keyMap` y `labelA`/`labelB` correspondientes
   - Conectar `onPause` al estado de pausa existente de cada play page

3. **Pasar skin selector al `MobileGamepad`**
   - El selector de skin que hoy vive en el HUD desktop se duplica dentro del componente `MobileGamepad` (barra inferior), leyendo/escribiendo el mismo estado

4. **CSS global** (`globals.css`)
   - Añadir utilidades para el gamepad: botones circulares, D-pad en cruz, colores `av-*` consistentes con el resto de la UI

5. **Verificación por juego**
   - Abrir `/games/<slug>/play` en Chrome DevTools con viewport mobile (375px)
   - Confirmar canvas ocupa 100% ancho, HUD desktop oculto
   - Confirmar D-pad y botones responden (touchstart/touchend en DevTools)
   - Confirmar PAUSA y skin selector funcionan desde la barra inferior
   - Confirmar desktop sin regresiones (`pointer: fine`)

## Criterios de aceptación

- [ ] `app/components/MobileGamepad.tsx` existe y no modifica ningún `game.js`
- [ ] En viewport mobile (≤768px, `pointer: coarse`): HUD desktop oculto
- [ ] Canvas ocupa 100% del ancho disponible con aspect ratio correcto (sin stretch ni recorte)
- [ ] D-pad dispara `keydown`/`keyup` sintéticos correctos en `window`
- [ ] Botón A y B disparan sus `KeyboardEvent` correspondientes según el juego
- [ ] Botones sin uso (Arkanoid B, Tetris B, Snake A/B) no aparecen o aparecen deshabilitados
- [ ] `touch-action: none` en todos los botones del gamepad (sin scroll accidental)
- [ ] Botón PAUSA en barra inferior pausa/reanuda el juego
- [ ] Selector de skin en barra inferior funciona igual que en HUD desktop
- [ ] En desktop (`pointer: fine`): HUD visible, gamepad invisible, cero regresiones
- [ ] Los 4 juegos verificados en Chrome DevTools mobile 375px
- [ ] `npm run build` pasa sin errores TypeScript

## Decisiones tomadas y descartadas

| Decisión              | Elegida                                 | Descartada             | Razón                                                                    |
| --------------------- | --------------------------------------- | ---------------------- | ------------------------------------------------------------------------ |
| Detección mobile      | `pointer: coarse` (CSS + matchMedia)    | `max-width: 768px`     | Detecta capacidad táctil, no tamaño; un tablet grande sigue siendo touch |
| Inyección de input    | `KeyboardEvent` sintético en `window`   | Modificar `game.js`    | No tocar game.js; el contrato de integración ya usa teclado              |
| Ubicación del gamepad | HTML overlay debajo del canvas          | Dibujado en canvas     | HTML es más flexible, accesible y no requiere cambios en game.js         |
| Botones inactivos     | Ocultos si `keyMap` no los define       | Visibles pero disabled | Menos ruido visual; el gamepad se adapta al juego                        |
| Skin selector mobile  | Duplicado en barra inferior del gamepad | Mantener solo en HUD   | HUD oculto en mobile; selector debe seguir accesible                     |
| Scope                 | Solo mobile portrait                    | Tablet + landscape     | Scope acotado; landscape y tablet son iteración futura                   |
| Swipe vs botones      | Botones D-pad                           | Gestos swipe           | Botones más predecibles; swipe interfiere con scroll de página           |

## Riesgos

- **KeyboardEvent sintético bloqueado por game.js:** Algunos juegos filtran eventos por `event.isTrusted`. Si ocurre, el workaround es exponer funciones de control en `window` (e.g. `window.gameControls.left()`). Verificar en paso 5 antes de asumir que funciona.

- **Touch delay en iOS Safari:** iOS añade 300ms de delay en `touchend` si no se usa `touch-action: manipulation`. Mitigación: `touch-action: none` ya está en el plan; verificar en Safari mobile real o BrowserStack.

- **Canvas aspect ratio en mobile:** Juegos con canvas de tamaño fijo (800×600) pueden verse muy pequeños en portrait 375px. `width: 100%; aspect-ratio: 4/3` resuelve el display pero game.js opera en coordenadas internas fijas — no es un bug, solo se ve más pequeño.

- **Selector de skin duplicado:** Si el HUD desktop y la barra mobile leen el mismo estado React, no hay problema. Si están desconectados, el skin no sincroniza. Verificar que comparten el mismo `useState`.
