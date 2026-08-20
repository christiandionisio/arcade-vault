"use client";

import { useState } from "react";
import { createClient } from "@/utils/supabase/client";

export default function ResetPage() {
  const supabase = createClient();
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setToast(null);

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/auth/callback?next=/auth/update-password`,
    });

    if (error) {
      setToast(error.message);
    } else {
      setSent(true);
    }

    setLoading(false);
  }

  return (
    <main className="av-main fade-in">
      <div className="av-auth-wrap">
        <div className="auth-card">
          <div className="auth-header">
            <div className="mark" />
            <h2 className="neon-cyan">RECUPERAR CONTRASEÑA</h2>
          </div>

          {toast && (
            <div className="auth-toast" role="alert">
              {toast}
            </div>
          )}

          {sent ? (
            <div className="auth-info" role="status">
              Revisa tu email — te enviamos un enlace de recuperación.
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
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
              <button
                type="submit"
                className="btn yellow"
                style={{ width: "100%", marginTop: "8px" }}
                disabled={loading}
              >
                {loading ? "..." : "▶ ENVIAR ENLACE"}
              </button>
            </form>
          )}

          <div className="divider" style={{ margin: "18px 0" }} />

          <a
            href="/auth"
            className="mono"
            style={{
              fontSize: "8px",
              color: "var(--fg-dim)",
              display: "block",
              textAlign: "center",
            }}
          >
            ← VOLVER AL LOGIN
          </a>
        </div>
      </div>
    </main>
  );
}
