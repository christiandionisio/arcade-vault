"use client";

import { use, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { GAMES } from "@/app/data/games";
import { useUser } from "@/components/UserProvider";

export default function PlayPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const game = GAMES.find((g) => g.id === id);
  const { user } = useUser();
  const router = useRouter();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [playerName, setPlayerName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);

  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (paused || showModal) return;
    intervalRef.current = setInterval(() => {
      setScore((s) => {
        const next = s + Math.floor(Math.random() * 120 + 30);
        if (next > level * 5000) setLevel((l) => l + 1);
        return next;
      });
    }, 800);
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [paused, showModal, level]);

  function handleEnd() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setShowModal(true);
  }

  function handleSave() {
    const entry = {
      game: id,
      name: playerName || "ANON",
      score,
      date: new Date().toISOString().slice(0, 10),
    };
    try {
      const raw = localStorage.getItem("av_scores");
      const arr = raw ? JSON.parse(raw) : [];
      arr.unshift(entry);
      localStorage.setItem("av_scores", JSON.stringify(arr.slice(0, 100)));
    } catch {}
    setSaved(true);
  }

  if (!game) return <main className="av-main" style={{ padding: "48px 32px", textAlign: "center" }}>
    <p className="pixel neon-magenta" style={{ fontSize: "12px" }}>JUEGO NO ENCONTRADO</p>
  </main>;

  return (
    <main className="av-main fade-in">
      <div className="av-player">
        {/* HUD */}
        <div className="player-hud">
          <div className="hud-stat">
            <span className="l">JUGADOR</span>
            <span className="v" style={{ fontSize: "12px" }}>{user?.name ?? "GUEST"}</span>
          </div>
          <div className="hud-stat">
            <span className="l">PUNTUACIÓN</span>
            <span className="v">{score.toLocaleString()}</span>
          </div>
          <div className="hud-stat lives">
            <span className="l">VIDAS</span>
            <span className="v">{"♥".repeat(lives)}</span>
          </div>
          <div className="hud-stat level">
            <span className="l">NIVEL</span>
            <span className="v">{String(level).padStart(2, "0")}</span>
          </div>
          <div className="hud-actions">
            <button
              className="btn ghost"
              style={{ padding: "8px 14px", fontSize: "9px" }}
              onClick={() => setPaused((p) => !p)}
            >
              {paused ? "REANUDAR" : "PAUSA"}
            </button>
            <button
              className="btn magenta"
              style={{ padding: "8px 14px", fontSize: "9px" }}
              onClick={handleEnd}
            >
              FIN
            </button>
          </div>
        </div>

        {/* CRT screen */}
        <div className="crt">
          <div className="crt-screen">
            {paused ? (
              <div className="crt-content" style={{ flexDirection: "column", gap: "20px" }}>
                <p className="pixel neon-yellow flicker" style={{ fontSize: "14px", letterSpacing: "0.2em" }}>EN PAUSA</p>
                <button
                  className="btn yellow"
                  onClick={() => setPaused(false)}
                >
                  ▶ REANUDAR
                </button>
              </div>
            ) : (
              <div className="game-arena">
                <div className="grid-floor" />
                <div className="player-ship" />
                <div className="enemy e1" />
                <div className="enemy e2" />
                <div className="enemy e3" />
              </div>
            )}
          </div>
          <div className="crt-bottom">
            <span className="led">{game.title}</span>
            <span>NIVEL {String(level).padStart(2, "0")}</span>
            <span>60 FPS</span>
          </div>
        </div>
      </div>

      {/* Game over modal */}
      {showModal && (
        <div className="modal-bd">
          <div className="modal slide-in">
            <h2>GAME OVER</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{score.toLocaleString()}</div>
            {!saved ? (
              <>
                <div className="input-row">
                  <input
                    type="text"
                    placeholder="TU NOMBRE..."
                    maxLength={12}
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value.toUpperCase())}
                  />
                </div>
                <div className="actions">
                  <button className="btn yellow" onClick={handleSave}>
                    GUARDAR PUNTUACIÓN
                  </button>
                  <button className="btn ghost" onClick={() => router.push(`/games/${id}`)}>
                    SALIR
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="toast-saved">▸ PUNTUACIÓN GUARDADA_</span>
                <div className="actions" style={{ marginTop: "24px" }}>
                  <button className="btn" onClick={() => { setScore(0); setLevel(1); setLives(3); setSaved(false); setShowModal(false); }}>
                    JUGAR DE NUEVO
                  </button>
                  <button className="btn ghost" onClick={() => router.push("/hall")}>
                    VER SALÓN
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </main>
  );
}
