"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";

export default function UpdatePasswordPage() {
  const supabase = createClient();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [hasSession, setHasSession] = useState<boolean | null>(null);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setHasSession(!!session);
    });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (password !== confirm) {
      setToast("Las contraseñas no coinciden");
      return;
    }
    setLoading(true);
    setToast(null);

    const { error } = await supabase.auth.updateUser({ password });
    if (error) {
      setToast(error.message);
      setLoading(false);
    } else {
      router.push("/");
    }
  }

  if (hasSession === null) {
    return (
      <main className="av-main fade-in">
        <div className="av-auth-wrap">
          <div className="auth-card">
            <div className="auth-spinner" />
          </div>
        </div>
      </main>
    );
  }

  if (!hasSession) {
    return (
      <main className="av-main fade-in">
        <div className="av-auth-wrap">
          <div className="auth-card">
            <p
              className="mono"
              style={{
                fontSize: "9px",
                color: "var(--fg-dim)",
                textAlign: "center",
              }}
            >
              Enlace inválido o expirado.
            </p>
            <a
              href="/auth/reset"
              className="mono"
              style={{
                fontSize: "8px",
                color: "var(--fg-dim)",
                display: "block",
                textAlign: "center",
                marginTop: "16px",
              }}
            >
              ← SOLICITAR NUEVO ENLACE
            </a>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="av-main fade-in">
      <div className="av-auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="mark" />
            <h2 className="neon-cyan">NUEVA CONTRASEÑA</h2>
          </div>

          {toast && (
            <div className="auth-toast" role="alert">
              {toast}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div className="field">
              <label>NUEVA CONTRASEÑA</label>
              <input
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>
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
            <button
              type="submit"
              className="btn yellow"
              style={{ width: "100%", marginTop: "8px" }}
              disabled={loading}
            >
              {loading ? "..." : "▶ ACTUALIZAR CONTRASEÑA"}
            </button>
          </form>
        </div>
      </div>
    </main>
  );
}
