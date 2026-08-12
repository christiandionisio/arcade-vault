---
name: spec-impl-game
description: Como /spec-impl pero para specs de juegos. Implementa el spec aprobado paso a paso y, al terminar, detona en secuencia skin-designer y luego mobile-porter (nunca en paralelo).
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Implementador de specs de juegos

Este skill es un superconjunto de `/spec-impl`. Ejecuta exactamente las mismas 4 fases
de ese skill y, al completarlas, añade una **Fase 5** de post-proceso específica para
juegos: lanza `skin-designer` y luego `mobile-porter` en secuencia estricta.

---

## Fase 1–4: implementación del spec

Invoca el skill `spec-impl` con el mismo argumento recibido (`$ARGUMENTS`).
Respeta íntegramente sus cuatro fases:

1. Identificar el spec.
2. Validar que el estado significa "Approved" (en cualquier idioma).
3. Crear/cambiar al branch `spec-NN-slug` y mostrar el resumen del spec.
4. Implementar paso a paso con pausa después de cada step.

**No reescribas esas reglas aquí — se delegan al skill `spec-impl` completo.**
Si `spec-impl` se detiene por cualquier motivo (estado no aprobado, ambigüedad, etc.),
este skill también se detiene. La Fase 5 sólo se activa cuando spec-impl termina con
el mensaje "✅ All steps of the plan are implemented".

---

## Fase 5 — Post-proceso de juego

Entrar aquí **únicamente** cuando todos los pasos del plan estén implementados.

### 5.1 Detectar el slug del juego

Deriva el slug del juego a partir del spec implementado (título, objetivo, nombre del
directorio que crea, etc.). Valida que el slug existe como carpeta en `public/games/`.

- Si puedes determinarlo de forma inequívoca → úsalo directamente.
- Si hay ambigüedad o no existe en `public/games/` → lista las carpetas disponibles y
  pide el slug al usuario. **No adivines.**

### 5.2 Confirmación única

Muestra este mensaje y espera respuesta explícita del usuario antes de continuar:

```
Implementación terminada. Post-proceso de juego para slug: <slug>

Voy a lanzar en secuencia:
  1) skin-designer <slug>
  2) mobile-porter <slug>

¿Lanzo? [y/N]
```

Si el usuario responde con cualquier equivalente de "no" o no responde → detener aquí.
No lanzar ningún agente sin confirmación.

### 5.3 Disparo secuencial — REGLA DURA

**Nunca lanzar ambos agentes en el mismo bloque paralelo.**
Un agente por turno. El segundo sólo arranca cuando el primero terminó.

**Turno A — skin-designer:**

- Lanzar el agente `skin-designer` (subagent_type: `skin-designer`) pasándole el slug.
- Esperar a que termine completamente.
- Reportar al usuario el resultado/resumen de skin-designer.

**Turno B — mobile-porter (sólo después de que Turno A terminó):**

- Lanzar el agente `mobile-porter` (subagent_type: `mobile-porter`) pasándole el slug.
- Esperar a que termine completamente.
- Reportar al usuario el resultado/resumen de mobile-porter.

### 5.4 Cierre

Una vez que ambos agentes terminaron, mostrar:

```
✅ Post-proceso completado.

Recuerda antes del commit final:
  - Verificar los criterios de aceptación del spec uno a uno.
  - Actualizar el estado del spec a "Implemented" (o equivalente en tu idioma).
  - Hacer el commit final y mergear el branch spec-NN-slug.
```
