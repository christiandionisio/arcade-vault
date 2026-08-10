# Spec 11 — Gamepad Neon Skin

| Campo        | Valor                                                                                                                               |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------- |
| Estado       | Draft                                                                                                                               |
| Dependencias | 10 (Mobile Touch Controls)                                                                                                          |
| Fecha        | 2026-08-09                                                                                                                          |
| Objetivo     | Rediseñar la apariencia visual de `MobileGamepad` para que coincida con el diseño neón de `references/gamepad-assets/gamepad.html`. |

## Scope

### Dentro

- Rediseño visual completo de `components/MobileGamepad.tsx`:
  - Shell del gamepad: fondo degradado oscuro, borde cyan con glow, patrón de puntos, anillo interior
  - D-pad: botones con estado pressed (cyan glow + translateY) y hub central con gema animada
  - Botones A/B: circulares, magenta (A) / cyan (B), glow radial, estado pressed (translateY + scale)
  - Barra inferior (PAUSA + skin selector): rediseñada con estilo neón consistente
- Feedback visual de presión vía estado React (`pressed`) por botón — no CSS `:active`
- Estilos en `globals.css` reemplazando/extendiendo las clases `mgp-*` actuales
- Variables CSS reutilizando tokens existentes del proyecto (`--cyan`, `--magenta`, etc.)

### Fuera de scope

- Cambios en la lógica de `KeyboardEvent` (funcionalidad intacta)
- Cambios en `game.js` de ningún juego
- Cambios en las play pages (solo el componente cambia)
- Soporte landscape / tablet
- Rediseño del HUD desktop

## Modelo de datos / Componentes

No hay datos nuevos. Cambios estructurales en `MobileGamepad.tsx`:

### Estado React nuevo

```ts
const [pressed, setPressed] = useState<Set<string>>(new Set());
```

Cada botón recibe su `code` y consulta `pressed.has(code)` para aplicar clase `.on`.

### Elementos HTML nuevos (vs. implementación actual)

| Elemento nuevo      | Propósito                                            |
| ------------------- | ---------------------------------------------------- |
| `.gp` wrapper       | Shell del gamepad con gradiente, borde y dots        |
| `.dp-hub`           | Centro del D-pad (cuadrado con borde cyan)           |
| `.dp-hub-gem`       | Diamante cyan con animación `pulse-led`              |
| `.ab-ring`          | Anillo dashed alrededor de A/B, visible al presionar |
| `.mgp-bar` (reskin) | Barra inferior con mismo token de color del shell    |

### Archivos que cambian

| Archivo                        | Cambio                                              |
| ------------------------------ | --------------------------------------------------- |
| `components/MobileGamepad.tsx` | Estructura JSX + lógica `pressed` state             |
| `app/globals.css`              | Reemplazar `mgp-*` con estilos del reference design |

## Plan de implementación

1. **Actualizar `globals.css`**
   - Reemplazar clases `mgp-*` actuales con estilos del reference design
   - Añadir: `.gp`, `.gp-body`, `.gp-col`, `.gp-dpad`, `.dp`, `.dp-up/down/left/right`, `.dp-hub`, `.dp-hub-gem`, `.ab`, `.ab.a`, `.ab.b`, `.ab-ring`, `.mgp-bar` reskinned
   - Añadir keyframe `@keyframes mgp-pulse-led`
   - Reutilizar tokens existentes: `--cyan`, `--magenta`, `--font-pixel`, `--font-mono`

2. **Refactorizar `components/MobileGamepad.tsx`**
   - Añadir `pressed: Set<string>` state
   - Extraer helpers `press(code)` / `release(code)` que actualizan el set Y disparan `keydown`/`keyup`
   - Reemplazar `GamepadButton` para que use `pressed.has(code)` → clase `.on`
   - Añadir elementos `.dp-hub` + `.dp-hub-gem` dentro del D-pad
   - Añadir `.ab-ring` dentro de cada botón A/B
   - Envolver todo en `.gp` shell con `.gp-body` grid
   - Reskin barra inferior: fondo/borde consistente con `.gp`

3. **Verificar en cada play page**
   - Chrome DevTools viewport 375px, `pointer: coarse` simulado
   - D-pad y botones muestran glow cyan/magenta al presionar
   - Hub gem pulsa correctamente
   - Barra inferior legible y funcional
   - Desktop (pointer: fine): gamepad invisible, sin regresiones
   - `npm run build` pasa sin errores TypeScript

## Criterios de aceptación

- [ ] Shell del gamepad: fondo degradado oscuro, borde cyan con glow, patrón de puntos visible
- [ ] D-pad: al presionar cualquier dirección → botón baja (translateY) + glow cyan encendido
- [ ] D-pad hub central visible con gema diamante cyan pulsante
- [ ] Botón A: circular, magenta, glow magenta al presionar + anillo dashed visible
- [ ] Botón B: circular, cyan, glow cyan al presionar + anillo dashed visible
- [ ] Barra inferior: fondo/borde coherente con el shell, botón PAUSA y skin selector legibles
- [ ] Estado `pressed` en React controla la clase `.on` — no depende de CSS `:active`
- [ ] `touch-action: none` en todos los botones (sin scroll accidental)
- [ ] Desktop (`pointer: fine`): gamepad invisible, HUD intacto, sin regresiones visuales
- [ ] Los 4 juegos verificados en viewport 375px con DevTools touch simulation
- [ ] `npm run build` sin errores TypeScript

## Decisiones tomadas y descartadas

| Decisión            | Elegida                                     | Descartada                       | Razón                                                      |
| ------------------- | ------------------------------------------- | -------------------------------- | ---------------------------------------------------------- |
| Ubicación estilos   | `globals.css` (clases `mgp-*`)              | CSS Modules / inline styles      | Consistente con patrón `av-*` del proyecto                 |
| Feedback de presión | Estado React `Set<string>` + clase `.on`    | CSS `:active`                    | `preventDefault()` en touch cancela `:active` en iOS       |
| Tokens de color     | Reutilizar `--cyan`, `--magenta` existentes | Hardcodear colores del reference | Consistencia con design system del proyecto                |
| Hub gem             | Incluido con animación `mgp-pulse-led`      | Omitido                          | Forma parte del diseño de referencia; usuario lo confirmó  |
| Barra inferior      | Rediseñada con estilo neón coherente        | Dejarla como está                | Usuario solicitó compatibilidad con el estilo del gamepad  |
| Scope funcional     | Lógica de KeyboardEvent intacta             | Refactorizar junto con estilos   | Cambio puramente visual; funcionalidad validada en spec 10 |

## Riesgos

- **Tokens CSS no disponibles:** `--cyan` y `--magenta` deben existir en `globals.css`. Verificar antes de usarlos; si faltan, definirlos con los valores del reference (`#00f5ff`, `#ff006e`).

- **`pulse-led` keyframe duplicado:** Renombrado a `mgp-pulse-led` para evitar colisiones con otros keyframes globales.

- **Glow pesado en móvil bajo:** `box-shadow` con múltiples capas puede degradar rendimiento en dispositivos lentos. Si se detecta lag, reducir capas de sombra en los estados `.on`.
