---
spec: 04-supabase-setup
title: Supabase Integration Setup — Arcade Vault
state: Approved
date: 2026-07-26
objective: Integrar Supabase en el proyecto Next.js como infraestructura base (cliente browser, cliente server, middleware de sesión) sin features de producto.
dependencies: 01-mvp-visual
---

## Alcance

**Dentro:**

- Instalar `@supabase/supabase-js` y `@supabase/ssr`
- `utils/supabase/client.ts` — cliente browser (componentes `"use client"`)
- `utils/supabase/server.ts` — cliente server (Server Components, Route Handlers)
- `middleware.ts` — refresh automático de sesión con `@supabase/ssr`
- `.env.template` — añadir `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- RLS habilitado por defecto en Supabase (decisión de política, sin código)

**Fuera:**

- Autenticación (registro/login) — spec 05
- Tablas de producto (scores, usuarios, etc.) — specs posteriores
- Tipos TypeScript generados (`supabase gen types`) — cuando haya tablas reales
- Edge Functions y Realtime — specs posteriores
- Variables en `.env.local` — usuario las completa manualmente

## Plan de implementación

1. **Instalar dependencias** — `npm install @supabase/supabase-js @supabase/ssr`

2. **`.env.template`** — añadir:

   ```
   NEXT_PUBLIC_SUPABASE_URL=XXXX
   NEXT_PUBLIC_SUPABASE_ANON_KEY=XXXX
   ```

3. **`utils/supabase/client.ts`** — cliente browser:

   ```ts
   import { createBrowserClient } from "@supabase/ssr";
   export const createClient = () =>
     createBrowserClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
     );
   ```

4. **`utils/supabase/server.ts`** — cliente server (cookies de Next.js):

   ```ts
   import { createServerClient } from "@supabase/ssr";
   import { cookies } from "next/headers";
   export const createClient = async () => {
     const cookieStore = await cookies();
     return createServerClient(
       process.env.NEXT_PUBLIC_SUPABASE_URL!,
       process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
       {
         cookies: {
           getAll: () => cookieStore.getAll(),
           setAll: (c) =>
             c.forEach(({ name, value, options }) =>
               cookieStore.set(name, value, options),
             ),
         },
       },
     );
   };
   ```

5. **`middleware.ts`** — refresh de sesión en cada request:
   - Usar `createServerClient` con `request/response` cookies
   - Llamar `supabase.auth.getUser()` para refrescar token
   - Aplicar matcher a rutas que necesitan sesión (excluir `_next`, assets)

6. **Verificación** — `npm run build` sin errores de tipos; `npm run dev` levanta sin crashear

## Criterios de aceptación

- [ ] `@supabase/supabase-js` y `@supabase/ssr` en `package.json`
- [ ] `.env.template` contiene `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] `utils/supabase/client.ts` exporta `createClient` para uso browser
- [ ] `utils/supabase/server.ts` exporta `createClient` async para uso server
- [ ] `middleware.ts` refresca sesión en cada request sin crashear
- [ ] `npm run build` pasa sin errores de TypeScript
- [ ] `npm run dev` levanta sin errores de runtime relacionados con Supabase

## Decisiones tomadas y descartadas

| Decisión        | Elegida                          | Descartada                       | Razón                                                                     |
| --------------- | -------------------------------- | -------------------------------- | ------------------------------------------------------------------------- |
| Scope del spec  | Solo infraestructura             | Setup + auth en mismo spec       | Auth merece spec propio; base limpia para specs posteriores               |
| Package SSR     | `@supabase/ssr`                  | `@supabase/auth-helpers-nextjs`  | `auth-helpers` deprecado; `@supabase/ssr` es el sucesor oficial           |
| Cliente server  | `createServerClient` con cookies | Cliente singleton                | App Router requiere cookies por request; singleton no funciona en server  |
| RLS             | Habilitado por defecto           | Deshabilitado hasta tener tablas | Mejor activarlo desde el inicio que olvidarlo cuando haya datos reales    |
| Tipos generados | Fuera de scope                   | Incluir en este spec             | Sin tablas reales aún; generarlos ahora produce `Database = {}` sin valor |
| Variables env   | `NEXT_PUBLIC_*`                  | Nombres custom                   | Estándar oficial Supabase; compatible con docs y ejemplos                 |

## Riesgos identificados

- **`cookies()` en Next.js 16**: API async — `await cookies()` requerido. El plan ya lo contempla; no usar versión síncrona.
- **Middleware matcher demasiado amplio**: Si incluye rutas de assets (`_next/static`, imágenes), añade latencia innecesaria. Excluir explícitamente en el matcher.
- **Env vars no configuradas en `.env.local`**: Build no falla (son `NEXT_PUBLIC_*` con `!`), pero runtime lanza error al primer uso del cliente. Documentado — usuario debe completar `.env.local` antes de levantar.
