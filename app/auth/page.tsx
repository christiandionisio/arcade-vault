"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { useUser } from "@/components/UserProvider";

export default function AuthPage() {
  const router = useRouter();
  const supabase = createClient();
  const { user, loading: authLoading } = useUser();

  useEffect(() => {
    if (!authLoading && user) router.replace("/");
  }, [authLoading, user]);

  const [tab, setTab] = useState<"login" | "registro">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [info, setInfo] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(null), 4000);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setToast(null);
    setInfo(null);

    if (tab === "login") {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (error) {
        showToast(error.message);
      } else {
        router.push("/");
        router.refresh();
      }
    } else {
      if (password !== confirm) {
        showToast("Las contraseñas no coinciden");
        setLoading(false);
        return;
      }
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: { data: { display_name: name || email.split("@")[0] } },
      });
      if (error) {
        showToast(error.message);
      } else {
        setInfo("Revisa tu email para confirmar tu cuenta.");
      }
    }

    setLoading(false);
  }

  async function handleOAuth(provider: "google" | "github") {
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (error) showToast(error.message);
  }

  return (
    <main className="av-main fade-in">
      <div className="av-auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="mark" />
            <h2 className="neon-cyan">ARCADE VAULT</h2>
          </div>

          <div className="auth-tabs">
            <button
              className={tab === "login" ? "on" : ""}
              onClick={() => setTab("login")}
            >
              LOGIN
            </button>
            <button
              className={tab === "registro" ? "on" : ""}
              onClick={() => setTab("registro")}
            >
              REGISTRO
            </button>
          </div>

          {toast && (
            <div className="auth-toast" role="alert">
              {toast}
            </div>
          )}

          {info && (
            <div className="auth-info" role="status">
              {info}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            {tab === "registro" && (
              <div className="field">
                <label>NOMBRE DE JUGADOR</label>
                <input
                  type="text"
                  placeholder="ACE001"
                  maxLength={12}
                  value={name}
                  onChange={(e) => setName(e.target.value.toUpperCase())}
                />
              </div>
            )}
            <div className="field">
              <label>EMAIL</label>
              <input
                type="email"
                placeholder="player@arcade.vault"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="field">
              <label>CONTRASEÑA</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              {tab === "login" && (
                <a
                  href="/auth/reset"
                  className="mono"
                  style={{
                    fontSize: "8px",
                    color: "var(--fg-dim)",
                    marginTop: "4px",
                    display: "block",
                  }}
                >
                  ¿Olvidaste tu contraseña?
                </a>
              )}
            </div>
            {tab === "registro" && (
              <div className="field">
                <label>CONFIRMAR CONTRASEÑA</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                />
              </div>
            )}

            <button
              type="submit"
              className="btn yellow"
              style={{ width: "100%", marginTop: "8px" }}
              disabled={loading}
            >
              {loading
                ? "..."
                : tab === "login"
                  ? "▶ INICIAR SESIÓN"
                  : "▶ CREAR CUENTA"}
            </button>
          </form>

          <div className="auth-divider">O CONTINÚA CON</div>

          <div className="social">
            <button
              type="button"
              className="btn ghost"
              onClick={() => handleOAuth("google")}
            >
              G GOOGLE
            </button>
            <button
              type="button"
              className="btn ghost"
              onClick={() => handleOAuth("github")}
            >
              ⬡ GITHUB
            </button>
          </div>

          <div className="divider" style={{ margin: "18px 0" }} />

          <button
            type="button"
            className="btn ghost"
            style={{ width: "100%", fontSize: "9px" }}
            onClick={() => router.push("/")}
          >
            JUGAR COMO INVITADO
          </button>
        </div>
      </div>
    </main>
  );
}
