---
spec: 14-security-hardening
title: Security Hardening — RLS, Auth Config, Headers y DB Functions
state: approved
date: 2026-08-30
objective: Corregir todas las advertencias de seguridad del checklist: policy RLS permisiva en scores, funciones SECURITY DEFINER expuestas públicamente, search_path mutable, configuración Auth de Supabase y security headers en Next.js.
dependencies: 04-supabase-setup, 13-auth-supabase
---

## Scope

### Dentro

- **RLS policy `scores_insert_public`** — reemplazar `WITH CHECK (true)` por `WITH CHECK (auth.uid() IS NOT NULL)`: solo usuarios autenticados pueden insertar scores
- **`increment_game_stats` — revocar EXECUTE a `anon`** — función `SECURITY DEFINER` no debe ser callable sin sesión; `authenticated` conserva acceso
- **`rls_auto_enable` — revocar EXECUTE a `anon` y `authenticated`** — función de utilidad/setup que no debe estar en la API pública
- **`increment_game_stats` — fijar `search_path`** — añadir `SET search_path = public` para eliminar warning `function_search_path_mutable`
- **Security headers en Next.js** — añadir `X-Content-Type-Options`, `X-Frame-Options` y `Referrer-Policy` en `next.config.ts` vía `headers()`
- **Supabase Auth — configuración manual documentada** — pasos en el spec para: mínimo 8 caracteres, leaked password protection y max signup rate por IP
- **Protección de rutas en `proxy.ts`** — rutas `/games/[slug]/play` requieren sesión activa; usuarios sin login redirigen a `/auth`. Referencia: https://nextjs.org/docs/app/getting-started/proxy

### Fuera de scope

- CSP (Content Security Policy) — requiere spec propio
- Protección de otras rutas distintas a `/games/[slug]/play`
- Auditoría de otras funciones SQL distintas a las listadas
- Migración de scores existentes de invitados sin `user_id`

---

## Data model

Sin estructuras nuevas. Solo cambios en policies y permisos SQL existentes.

---

## Implementación

### Paso 1 — Migración: fijar RLS policy de scores

Reemplazar la policy `scores_insert_public` en la tabla `scores`:

```sql
-- Eliminar policy permisiva
DROP POLICY IF EXISTS scores_insert_public ON public.scores;

-- Nueva policy: solo usuarios autenticados
CREATE POLICY scores_insert_authenticated
  ON public.scores
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() IS NOT NULL);
```

Verificar: intentar INSERT como `anon` → debe fallar con 403. INSERT como usuario autenticado → debe funcionar.

### Paso 2 — Migración: revocar EXECUTE a anon en `increment_game_stats`

```sql
REVOKE EXECUTE ON FUNCTION public.increment_game_stats(uuid, integer) FROM anon;
```

Verificar: llamar `/rest/v1/rpc/increment_game_stats` sin token → debe retornar 403.

### Paso 3 — Migración: revocar EXECUTE en `rls_auto_enable`

```sql
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM anon;
REVOKE EXECUTE ON FUNCTION public.rls_auto_enable() FROM authenticated;
```

Verificar: `/rest/v1/rpc/rls_auto_enable` → 403 para ambos roles.

### Paso 4 — Migración: fijar search_path en `increment_game_stats`

Recrear la función con `SET search_path = public`. Ejemplo (ajustar al body actual):

```sql
CREATE OR REPLACE FUNCTION public.increment_game_stats(p_game_id uuid, p_score integer)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE public.games
  SET
    best_score = GREATEST(best_score, p_score),
    total_plays = total_plays + 1
  WHERE id = p_game_id;
$$;
```

Verificar: `get_advisors` debe dejar de reportar `function_search_path_mutable` para esta función.

### Paso 5 — Security headers en Next.js

Editar `next.config.ts` para añadir headers HTTP:

```ts
const securityHeaders = [
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
];

// En el objeto de configuración de Next.js:
headers: async () => [
  { source: '/(.*)', headers: securityHeaders },
],
```

Verificar: `curl -I http://localhost:3000` → headers presentes en la respuesta.

### Paso 6 — Protección de rutas en `proxy.ts`

`proxy.ts` ya refresca la sesión en cada request. Añadir guard para rutas `/games/*/play`:

```ts
// Después de await supabase.auth.getUser():
const {
  data: { user },
} = await supabase.auth.getUser();
const pathname = request.nextUrl.pathname;

if (!user && /^\/games\/[^/]+\/play/.test(pathname)) {
  const redirectUrl = request.nextUrl.clone();
  redirectUrl.pathname = "/auth";
  redirectUrl.searchParams.set("redirect", pathname);
  return NextResponse.redirect(redirectUrl);
}
```

Verificar: navegar a `/games/asteroids/play` sin sesión → redirige a `/auth?redirect=/games/asteroids/play`.

### Paso 7 — Configuración manual de Supabase Auth (dashboard)

Estos ajustes no son código — se aplican en **Supabase Dashboard → Authentication → Settings**:

1. **Mínimo de contraseña:** `Password minimum length` → `8`
2. **Leaked password protection:** activar `Check if password has been leaked (HaveIBeenPwned)` → `ON`
3. **Max signup rate:** en `Rate Limits` → `Email signups per hour per IP` → valor recomendado: `5`

Verificar: intentar registrarse con password `1234567` (7 chars) → debe ser rechazado por Supabase Auth.

---

## Criterios de aceptación

- [ ] INSERT en `scores` como rol `anon` falla con 403
- [ ] INSERT en `scores` como usuario autenticado funciona
- [ ] Llamada a `/rpc/increment_game_stats` sin token retorna 403
- [ ] Llamada a `/rpc/rls_auto_enable` retorna 403 para anon y authenticated
- [ ] `get_advisors` no reporta `function_search_path_mutable` para `increment_game_stats`
- [ ] Response headers incluyen `X-Content-Type-Options: nosniff`, `X-Frame-Options: DENY` y `Referrer-Policy: strict-origin-when-cross-origin`
- [ ] Navegar a `/games/[slug]/play` sin sesión redirige a `/auth?redirect=...`
- [ ] Usuario autenticado accede a play page sin redirección
- [ ] Supabase Auth rechaza passwords menores a 8 caracteres
- [ ] Leaked password protection habilitada en dashboard
- [ ] Rate limit de signup por IP configurado

---

## Decisiones tomadas

| Decisión                                                                | Alternativa descartada                  | Razón                                                                                         |
| ----------------------------------------------------------------------- | --------------------------------------- | --------------------------------------------------------------------------------------------- |
| Restricción INSERT scores solo a `authenticated`                        | Permitir anon con validación de campos  | Ya tenemos auth real (spec 13); no hay razón válida para permitir scores anónimos             |
| Revocar EXECUTE en `rls_auto_enable` a ambos roles                      | Solo revocar a anon                     | Es función de setup que no debe estar en la API REST pública bajo ningún rol                  |
| REVOKE en lugar de cambiar a SECURITY INVOKER en `increment_game_stats` | Cambiar a SECURITY INVOKER              | REVOKE es más simple y seguro; INVOKER requeriría revisar permisos de la tabla para el caller |
| Auth settings como pasos manuales en spec                               | Automatizar vía Supabase Management API | No disponemos de token de management; son 3 clicks en dashboard, bajo riesgo de omisión       |
| Guard en `proxy.ts` solo para `/games/[slug]/play`                      | Proteger más rutas (hall, games list)   | Jugar requiere guardar scores (ya solo autenticados); el resto es lectura pública válida      |

---

## Riesgos

- **Scores de invitados rompen:** si código en play pages intenta insertar scores sin sesión activa, fallará silenciosamente o mostrará error. Verificar todos los `supabase.from('scores').insert(...)` llevan el browser client con sesión antes de permitir el guardado.
- **`increment_game_stats` body desconocido:** el Paso 4 asume el body de la función; leer el body real antes de recrearla para no perder lógica existente.
