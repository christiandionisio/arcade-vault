---
spec: 13-auth-supabase
title: Autenticación con Supabase — Registro, Login y OAuth
state: Approved
date: 2026-08-19
objective: Reemplazar el auth fake (localStorage) por Supabase Auth real con email/password, Google OAuth y GitHub OAuth, integrando sesión en UserProvider y el display name en los scores.
dependencies: 04-supabase-setup
---

## Scope

### Dentro

- `components/UserProvider.tsx` — reemplazar lógica localStorage por `supabase.auth.getSession()` + `onAuthStateChange`; tipo `User` incluye `id`, `email`, `display_name`
- `app/auth/page.tsx` — conectar formulario a `supabase.auth.signInWithPassword` (login) y `supabase.auth.signUp` (registro); toast genérico en errores; tab/link "¿Olvidaste tu contraseña?"
- `app/auth/reset/page.tsx` — formulario de solicitud de recuperación: input email + `supabase.auth.resetPasswordForEmail()`; muestra confirmación inline tras envío
- `app/auth/update-password/page.tsx` — formulario de nueva contraseña (accesible desde el link del email de Supabase): llama `supabase.auth.updateUser({ password })`
- Google OAuth — botón "G GOOGLE" llama `supabase.auth.signInWithOAuth({ provider: 'google' })`
- GitHub OAuth — reemplazar botón Discord por "⬡ GITHUB" con `supabase.auth.signInWithOAuth({ provider: 'github' })`
- `components/Nav.tsx` — dropdown en lugar de logout directo: muestra "Perfil" (link a `/auth`) + "Cerrar sesión"
- `app/auth/callback/route.ts` — route handler para intercambiar el code OAuth por sesión (también maneja el redirect de reset password)
- Spinner/skeleton en `UserProvider` mientras se resuelve la sesión inicial
- `player_name` en scores: pasa a usar `user.display_name` del usuario autenticado; invitados siguen usando nombre libre
- Confirmación de email activada (flow real: Supabase manda verificación)

### Fuera de scope

- Página de perfil (`/profile`) — futuro spec
- Vinculación de cuentas (OAuth + email mismo usuario) — futuro spec
- Protección de rutas (todos pueden jugar sin login)
- Cambio de display name post-registro
- Eliminación de cuenta

## Data Model

No hay tablas nuevas. Supabase Auth maneja `auth.users` internamente.

### Tipo `User` en `UserProvider.tsx`

```ts
type User = {
  id: string; // auth.users.id (UUID)
  email: string;
  display_name: string; // user_metadata.display_name (registro) o email prefix (OAuth fallback)
};
```

### `UserCtx` (contexto actualizado)

```ts
type UserCtx = {
  user: User | null;
  loading: boolean; // true mientras se resuelve sesión inicial
  logout: () => Promise<void>;
};
```

- `login` / `logout` manuales desaparecen del contexto — auth lo maneja Supabase directamente desde los formularios
- `loading: true` desde mount hasta que `onAuthStateChange` dispara el primer evento

### Display name — reglas de derivación

| Método         | Fuente                                                   |
| -------------- | -------------------------------------------------------- |
| Registro email | `user_metadata.display_name` (campo "NOMBRE DE JUGADOR") |
| Google OAuth   | `user_metadata.full_name` → fallback: email prefix       |
| GitHub OAuth   | `user_metadata.user_name` → fallback: email prefix       |

### Scores — sin cambio de schema

`scores.player_name` sigue siendo `text`. En las play pages, se pasa `user.display_name` si hay sesión, o el nombre libre del invitado si no la hay.

## Plan de Implementación

1. **`app/auth/callback/route.ts`** — route handler que intercambia el `code` OAuth/reset por sesión:
   - Lee `code` y `next` de `searchParams`
   - Llama `supabase.auth.exchangeCodeForSession(code)`
   - Redirige a `next` (default `/`)

2. **`components/UserProvider.tsx`** — reemplazar lógica localStorage:
   - `supabase.auth.getSession()` al montar → setea `user` y baja `loading`
   - `onAuthStateChange` mantiene `user` sincronizado
   - Derivar `display_name` según tabla de reglas del data model
   - Exponer `{ user, loading, logout }` en contexto

3. **`app/auth/page.tsx`** — conectar formulario a Supabase:
   - Login: `supabase.auth.signInWithPassword({ email, password })`
   - Registro: `supabase.auth.signUp({ email, password, options: { data: { display_name: name } } })`
   - Google: `supabase.auth.signInWithOAuth({ provider: 'google', options: { redirectTo: .../auth/callback } })`
   - GitHub: `supabase.auth.signInWithOAuth({ provider: 'github', options: { redirectTo: .../auth/callback } })`
   - En error: toast genérico con el mensaje de Supabase
   - En éxito registro: mensaje inline "Revisa tu email para confirmar tu cuenta"
   - Link "¿Olvidaste tu contraseña?" bajo el campo password → navega a `/auth/reset`

4. **`app/auth/reset/page.tsx`** — solicitud de recuperación:
   - Input email + botón enviar
   - Llama `supabase.auth.resetPasswordForEmail(email, { redirectTo: .../auth/callback?next=/auth/update-password })`
   - Tras envío: mensaje inline "Revisa tu email" (no redirige)

5. **`app/auth/update-password/page.tsx`** — nueva contraseña:
   - Solo accesible desde el link del email (sesión activa de tipo `recovery`)
   - Input nueva contraseña + confirmar
   - Llama `supabase.auth.updateUser({ password })`
   - En éxito: redirige a `/`

6. **`components/Nav.tsx`** — dropdown en estado autenticado:
   - Click en `user.display_name ▾` abre dropdown
   - Opciones: "Perfil" (link `/auth`) + "Cerrar sesión" (llama `logout()`)
   - Click fuera cierra dropdown

7. **Spinner en `UserProvider`** — mientras `loading === true`, el layout renderiza un skeleton o spinner mínimo en lugar del Nav con estado indefinido

8. **Play pages** — en cada `app/games/<slug>/play/page.tsx` pasar `user?.display_name` como `player_name` default al guardar score; si no hay sesión, mantener el input libre actual

9. **Supabase Dashboard** — configurar providers Google y GitHub (Client ID + Secret); `Site URL` y `Redirect URLs` con la URL de producción + `localhost:3000`

10. **Smoke test** — verificar: registro email → email confirmación llega → login → score se guarda con display_name → logout → Google OAuth → GitHub OAuth → forgot password → nueva contraseña

## Criterios de Aceptación

- [ ] Registro con email/password crea usuario en `auth.users`; Supabase envía email de confirmación
- [ ] Login con email/password establece sesión; `UserProvider` refleja `user` con `display_name` correcto
- [ ] Google OAuth completa el flow y regresa con sesión activa
- [ ] GitHub OAuth completa el flow y regresa con sesión activa
- [ ] `display_name` se deriva correctamente según método de auth (ver tabla data model)
- [ ] Errores de auth (email incorrecto, contraseña inválida, email ya registrado) muestran toast genérico
- [ ] Link "¿Olvidaste tu contraseña?" navega a `/auth/reset`
- [ ] `/auth/reset` envía email de recuperación; muestra "Revisa tu email" sin redirigir
- [ ] Link en email de recuperación llega a `/auth/update-password` con sesión activa
- [ ] `/auth/update-password` actualiza contraseña y redirige a `/`
- [ ] Nav muestra dropdown con "Perfil" + "Cerrar sesión" cuando hay sesión activa
- [ ] Logout cierra sesión en Supabase y limpia `user` del contexto
- [ ] Mientras `loading === true`, el Nav no muestra estado indefinido (spinner/skeleton visible)
- [ ] Score guardado desde play page usa `user.display_name` si hay sesión; nombre libre si es invitado
- [ ] `npm run build` pasa sin errores de TypeScript

## Decisiones Tomadas y Descartadas

| Decisión                   | Elegida                                 | Descartada                         | Razón                                                                        |
| -------------------------- | --------------------------------------- | ---------------------------------- | ---------------------------------------------------------------------------- |
| OAuth providers            | Google + GitHub                         | Discord                            | Usuario eligió GitHub sobre Discord                                          |
| Confirmación email         | Activada (flow real)                    | Desactivada en Dashboard           | Mejor UX de seguridad; usuario lo eligió explícitamente                      |
| Estado de carga            | Spinner/skeleton                        | Renderizar como "no logueado"      | Evita flash de Nav incorrecto en sesiones existentes                         |
| Errores de auth            | Toast genérico                          | Mensajes inline por campo          | Simplicidad; los errores de Supabase no siempre mapean a un campo específico |
| Rutas protegidas           | Ninguna                                 | Proteger `/play` con redirect      | Todos pueden jugar sin login; decisión de producto                           |
| `player_name` en scores    | `user.display_name` si autenticado      | Requerir login para guardar score  | Invitados siguen pudiendo guardar; mínimo cambio de schema                   |
| Schema `scores`            | Sin cambios (`player_name text`)        | Añadir `user_id` FK a `auth.users` | Vinculación de scores a usuarios es scope de spec posterior                  |
| Logout en Nav              | Dropdown con "Perfil" + "Cerrar sesión" | Click directo logout               | Usuario lo pidió explícitamente                                              |
| Recuperación de contraseña | Incluida en este spec                   | Spec separado                      | Usuario lo solicitó durante definición                                       |
| `login()` en contexto      | Eliminada                               | Mantenerla como no-op              | Supabase maneja auth; exponer `login` sería dead code                        |

## Riesgos Identificados

- **Callback URL en OAuth**: Google y GitHub requieren la URL exacta registrada en sus consolas de desarrollador. En local es `http://localhost:3000/auth/callback`; en producción debe añadirse la URL real. Sin esto el OAuth falla con `redirect_uri_mismatch`. Configurar ambas en Supabase Dashboard Y en las consolas de Google/GitHub.

- **Sesión `recovery` en `/auth/update-password`**: Supabase establece una sesión temporal tipo `recovery` al llegar desde el email. Si el usuario navega directamente a `/auth/update-password` sin ese token, `updateUser` falla. La página debe verificar que la sesión existe antes de mostrar el formulario.

- **Flash de Nav sin sesión**: Entre el mount y el primer evento de `onAuthStateChange`, `user` es `null`. Sin el flag `loading`, el Nav muestra "Iniciar Sesión" brevemente aunque haya sesión activa. El spinner en step 7 del plan mitiga esto.

- **`display_name` vacío en OAuth**: Algunas cuentas de Google/GitHub no exponen `full_name` o `user_name`. El fallback a email prefix cubre esto, pero puede resultar en nombres tipo `usuario123` poco legibles. Aceptable para este spec; edición de perfil es scope futuro.

- **Play pages con múltiples slugs**: Son 5 juegos (Asteroids, Tetris, Arkanoid, Snake, Frogger). El step 8 requiere tocar cada play page. Frogger usa un componente React diferente (`FroggerGame.tsx`), no `public/games/`. Verificar que el `player_name` default se pasa correctamente en ambos patrones.
