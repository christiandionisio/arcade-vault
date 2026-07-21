"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";

export default function AuthPage() {
  const { login } = useUser();
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "registro">("login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const displayName = (name || email.split("@")[0] || "PLAYER").toUpperCase().slice(0, 12);
    login(displayName);
    router.push("/");
  }

  function handleGuest() {
    router.push("/");
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
            </div>
            {tab === "registro" && (
              <div className="field">
                <label>CONFIRMAR CONTRASEÑA</label>
                <input
                  type="password"
                  placeholder="••••••••"
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                />
              </div>
            )}

            <button type="submit" className="btn yellow" style={{ width: "100%", marginTop: "8px" }}>
              {tab === "login" ? "▶ INICIAR SESIÓN" : "▶ CREAR CUENTA"}
            </button>
          </form>

          <div className="auth-divider">O CONTINÚA CON</div>

          <div className="social">
            <button type="button" className="btn ghost">
              G  GOOGLE
            </button>
            <button type="button" className="btn ghost">
              ⬡  DISCORD
            </button>
          </div>

          <div className="divider" style={{ margin: "18px 0" }} />

          <button
            type="button"
            className="btn ghost"
            style={{ width: "100%", fontSize: "9px" }}
            onClick={handleGuest}
          >
            JUGAR COMO INVITADO
          </button>
        </div>
      </div>
    </main>
  );
}
