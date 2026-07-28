"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";

const GAME_KEYS = new Set([
  "ArrowUp",
  "ArrowDown",
  "ArrowLeft",
  "ArrowRight",
  "Space",
]);

type GameState = {
  score: number;
  lives: number;
  level: number;
  gameOver: boolean;
};
type Win = Window & { gamePaused?: boolean; gameState?: GameState };

export default function AsteroidsPlayPage() {
  const { user } = useUser();
  const router = useRouter();
  const [gameState, setGameState] = useState<GameState>({
    score: 0,
    lives: 3,
    level: 1,
    gameOver: false,
  });
  const [paused, setPaused] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [playerName, setPlayerName] = useState(user?.name ?? "");
  const [saved, setSaved] = useState(false);
  const finalScore = useRef(0);

  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
    };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, []);

  useEffect(() => {
    const id = setInterval(() => {
      const gs = (window as Win).gameState;
      if (!gs) return;
      setGameState((prev) => {
        if (gs.gameOver && !prev.gameOver) {
          finalScore.current = gs.score;
          setShowModal(true);
        }
        return { ...gs };
      });
    }, 100);
    return () => clearInterval(id);
  }, []);

  function togglePause() {
    setPaused((p) => {
      (window as Win).gamePaused = !p;
      return !p;
    });
  }

  function handleSave() {
    const entry = {
      game: "asteroids",
      name: playerName || "ANON",
      score: finalScore.current,
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

  return (
    <main
      className="av-main fade-in"
      style={{
        height: "calc(100dvh - 65px)",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      <div
        className="av-player"
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          minHeight: 0,
          width: "100%",
          margin: "16px auto",
          paddingBottom: 0,
        }}
      >
        <div className="player-hud">
          <div className="hud-stat">
            <span className="l">JUGADOR</span>
            <span className="v" style={{ fontSize: "12px" }}>
              {user?.name ?? "GUEST"}
            </span>
          </div>
          <div className="hud-stat">
            <span className="l">PUNTUACIÓN</span>
            <span className="v">{gameState.score.toLocaleString()}</span>
          </div>
          <div className="hud-stat lives">
            <span className="l">VIDAS</span>
            <span className="v">
              {"♥".repeat(Math.max(0, gameState.lives))}
            </span>
          </div>
          <div className="hud-stat level">
            <span className="l">NIVEL</span>
            <span className="v">
              {String(gameState.level).padStart(2, "0")}
            </span>
          </div>
          <div className="hud-actions">
            <button
              className="btn ghost"
              style={{ padding: "8px 14px", fontSize: "9px" }}
              onClick={togglePause}
            >
              {paused ? "REANUDAR" : "PAUSA"}
            </button>
            <button
              className="btn magenta"
              style={{ padding: "8px 14px", fontSize: "9px" }}
              onClick={() => router.push("/games/asteroids")}
            >
              FIN
            </button>
          </div>
        </div>

        <div
          className="crt"
          style={{
            flex: 1,
            display: "flex",
            flexDirection: "column",
            minHeight: 0,
            alignItems: "center",
          }}
        >
          <div
            className="crt-screen"
            style={{
              width: "min(100%, calc((100dvh - 220px) * 4 / 3))",
              position: "relative",
            }}
          >
            <canvas
              id="canvas"
              width={800}
              height={600}
              style={{
                position: "absolute",
                inset: 0,
                width: "100%",
                height: "100%",
              }}
            />
            {paused && (
              <div
                className="crt-content"
                style={{
                  flexDirection: "column",
                  gap: "20px",
                  zIndex: 10,
                  background: "rgba(0,0,0,0.75)",
                }}
              >
                <p
                  className="pixel neon-yellow flicker"
                  style={{ fontSize: "14px", letterSpacing: "0.2em" }}
                >
                  EN PAUSA
                </p>
                <button className="btn yellow" onClick={togglePause}>
                  ▶ REANUDAR
                </button>
              </div>
            )}
          </div>
          <div className="crt-bottom" style={{ width: "100%" }}>
            <span className="led">ROCAS</span>
            <span>FLECHAS + ESPACIO</span>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="modal-bd">
          <div className="modal slide-in">
            <h2>GAME OVER</h2>
            <div className="final-label">PUNTUACIÓN FINAL</div>
            <div className="final">{finalScore.current.toLocaleString()}</div>
            {!saved ? (
              <>
                <div className="input-row">
                  <input
                    type="text"
                    placeholder="TU NOMBRE..."
                    maxLength={12}
                    value={playerName}
                    onChange={(e) =>
                      setPlayerName(e.target.value.toUpperCase())
                    }
                  />
                </div>
                <div className="actions">
                  <button className="btn yellow" onClick={handleSave}>
                    GUARDAR PUNTUACIÓN
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => router.push("/games/asteroids")}
                  >
                    SALIR
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="toast-saved">▸ PUNTUACIÓN GUARDADA_</span>
                <div className="actions" style={{ marginTop: "24px" }}>
                  <button
                    className="btn ghost"
                    onClick={() => router.push("/hall")}
                  >
                    VER SALÓN
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      <Script src="/games/asteroids/game.js" strategy="afterInteractive" />
    </main>
  );
}
