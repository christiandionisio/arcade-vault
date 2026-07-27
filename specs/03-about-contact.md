---
spec: 03-about-contact
title: About Page + Contact Form con Resend — Arcade Vault
state: Aprobado
date: 2026-07-24
objective: Crear la página /about con sección "Acerca de" y formulario de contacto que envía correo a inbox vía Resend.
dependencies: 02-home-landing
---

## Alcance

**Dentro:**
- Nueva ruta `/about` → `app/about/page.tsx`
- Sección About Hero: kicker, título, misión, 3 highlight cards (HEART / BROWSER / PLANT) con SVGs pixel art
- Divider animado pixel art
- Sección Contact: grid intro + form (nombre, email, mensaje)
- Estado "enviado": terminal-success con animación typewriter
- Estado "error": mensaje inline en el form si Resend falla
- Shake animation en submit con campos vacíos
- `app/api/contact/route.ts` — API Route POST que llama Resend
- Variable de entorno `RESEND_API_KEY` en `.env.local` (sin valor; usuario la completa)
- CSS about/contact añadido a `app/globals.css` (líneas 1071–1130 de `styles.css` del template)
- Enlace "ACERCA DE" → `/about` añadido a `Nav.tsx` (desktop + mobile panel)
- Animación scroll `.reveal` con `IntersectionObserver` (mismo patrón que home)

**Fuera:**
- Correo de confirmación al remitente
- Almacenamiento de mensajes en base de datos
- Rate limiting / captcha
- Cualquier cambio a rutas existentes distintas de `Nav.tsx`

## Modelo de datos

No se introduce persistencia. Estructuras en memoria:

**`ContactPayload`** (body del POST a `/api/contact`):
```ts
{ name: string; email: string; msg: string }
```

**`ContactResponse`** (respuesta JSON):
```ts
{ ok: true } | { ok: false; error: string }
```

Variable de entorno requerida:
- `RESEND_API_KEY` — clave secreta de Resend. Añadir a `.env.local` (sin valor en repo).

## Plan de implementación

1. **`.env.local`** — añadir `RESEND_API_KEY=` (sin valor; usuario completa)

2. **`app/globals.css`** — añadir estilos about/contact del template (`styles.css` líneas 1071–1130+:
   `.about`, `.about-hero`, `.about-title`, `.about-mission`, `.highlight-row`, `.highlight`,
   `.hl-icon`, `.about-divider`, `.div-bar`, `.div-pixels`, `.about-contact`, `.contact-grid`,
   `.contact-intro`, `.contact-title`, `.contact-sub`, `.contact-tips`, `.tip`, `.tip-led`,
   `.contact-form`, `.shake`, `.terminal-success`, `.term-bar`, `.term-body`, `.field`)

3. **`app/api/contact/route.ts`** — API Route POST:
   - Parsea body `{ name, email, msg }`
   - Valida campos no vacíos → 400 si falta alguno
   - Valida presencia de `RESEND_API_KEY` → error descriptivo si falta
   - Llama `resend.emails.send()` a `christiandionisio9432@gmail.com`
   - Retorna `{ ok: true }` o `{ ok: false, error: string }` con status 500

4. **`app/about/page.tsx`** — componente client (`"use client"`):
   - `useReveal` hook con `IntersectionObserver` (mismo patrón de `app/page.tsx`)
   - About Hero: kicker, título, misión, 3 highlights con `HighlightIcon` SVGs
   - Divider animado pixel art
   - Contact: grid intro + form controlado con `useState`
   - Submit: POST a `/api/contact`, muestra `terminal-success` en éxito, error inline en fallo
   - Shake animation si campos vacíos al submit

5. **`components/Nav.tsx`** — añadir enlace `ACERCA DE → /about` en desktop links y mobile panel

6. **Verificación con Playwright MCP** — navegar `/about`, screenshot `.playwright-screenshoots/about.png`; probar submit form vacío (shake), probar submit completo (terminal-success)

## Criterios de aceptación

- [ ] `/about` carga con kicker "▸ ACERCA DE", título "ACERCA DE ARCADE VAULT" y párrafo misión
- [ ] 3 highlight cards visibles con SVGs pixel art (HEART/BROWSER/PLANT) y colores correctos (magenta/cyan/green)
- [ ] Divider animado pixel art visible entre secciones
- [ ] Sección contacto muestra grid intro + form con campos nombre, correo, mensaje
- [ ] Submit con campos vacíos activa shake animation, no envía
- [ ] Submit válido hace POST a `/api/contact` y muestra `terminal-success` con nombre del usuario en mayúsculas
- [ ] "ENVIAR OTRO MENSAJE" en terminal-success resetea form y vuelve al estado inicial
- [ ] Si Resend falla, form muestra error inline (no muestra terminal-success)
- [ ] `RESEND_API_KEY` presente en `.env.local` (sin valor commiteado)
- [ ] Nav desktop y mobile muestran enlace "ACERCA DE" activo en `/about`
- [ ] Scroll revela secciones con animación `.reveal` (IntersectionObserver)
- [ ] Screenshot `.playwright-screenshoots/about.png` capturado y no vacío

## Decisiones tomadas y descartadas

| Decisión | Elegida | Descartada | Razón |
|---|---|---|---|
| Envío email | API Route `app/api/contact/route.ts` | Server Action | Más portable, testeable con curl, debugging más simple |
| Destino correo | `christiandionisio9432@gmail.com` | Otro inbox | Inbox del dueño del proyecto |
| Confirmación al remitente | No | Sí | MVP; añade complejidad sin valor inmediato |
| Error handling | Error inline en form | Silenciar / error page | Mejor UX; usuario sabe qué pasó |
| Rate limiting / captcha | Fuera de scope | Incluir | MVP; añadir en spec posterior si hay spam |
| Persistencia de mensajes | Ninguna | DB / logs | MVP; Resend guarda historial en su dashboard |
| CSS | Añadir a `globals.css` | Archivo `about.css` separado | Consistente con convención del proyecto |
| Enlace Nav | Incluido en este spec | Spec separado | Cambio trivial, cohesivo con la feature |

## Riesgos identificados

- **`RESEND_API_KEY` no configurada**: API route retorna 500 silencioso. Mitigar: validar presencia de la env var al inicio de la route y retornar error descriptivo.
- **Resend bloquea Gmail como destino**: Resend requiere dominio verificado como remitente (`from:`), pero el destino puede ser cualquier email. Usar `onboarding@resend.dev` como `from` en desarrollo hasta tener dominio propio.
- **CSS colisiones**: `.field`, `.reveal`, `.tip` son clases genéricas que pueden solapar estilos existentes en `globals.css`. Revisar antes de añadir.
- **`useReveal` duplicado**: home ya tiene este hook inline. Extraer a `hooks/useReveal.ts` o copiar — decidir al implementar para no duplicar lógica.
