"use client";

import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { createClient } from "@/utils/supabase/client";

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
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const finalScore = useRef(0);

  useEffect(() => {
    const block = (e: KeyboardEvent) => {
      if (GAME_KEYS.has(e.code)) e.preventDefault();
    };
    window.addEventListener("keydown", block);
    return () => window.removeEventListener("keydown", block);
  }, []);

  // HUD polling
  useEffect(() => {
    const id = setInterval(() => {
      const gs = (window as Win).gameState;
      if (!gs) return;
      setGameState({ ...gs });
    }, 100);
    return () => clearInterval(id);
  }, []);

  // Game over event from game.js
  useEffect(() => {
    const handler = (e: Event) => {
      const score = (e as CustomEvent<{ score: number }>).detail.score;
      finalScore.current = score;
      setSaved(false);
      setSaveError(null);
      setShowModal(true);
    };
    window.addEventListener("gameOver", handler);
    return () => window.removeEventListener("gameOver", handler);
  }, []);

  function togglePause() {
    setPaused((p) => {
      (window as Win).gamePaused = !p;
      return !p;
    });
  }

  async function handleSave() {
    const name = playerName.trim() || "ANON";
    setSaving(true);
    setSaveError(null);

    const supabase = createClient();

    const { data: gameRow, error: gameErr } = await supabase
      .from("games")
      .select("id, best_score")
      .eq("slug", "asteroids")
      .single();

    if (gameErr || !gameRow) {
      setSaveError("Error al obtener el juego.");
      setSaving(false);
      return;
    }

    const { error: insertErr } = await supabase.from("scores").insert({
      game_id: gameRow.id,
      player_name: name.slice(0, 12),
      score: finalScore.current,
    });

    if (insertErr) {
      setSaveError("Error al guardar puntuación.");
      setSaving(false);
      return;
    }

    await supabase.rpc("increment_game_stats", {
      p_game_id: gameRow.id,
      p_score: finalScore.current,
    });

    setSaving(false);
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
                {saveError && (
                  <p
                    style={{
                      color: "var(--color-magenta)",
                      fontSize: "11px",
                      margin: "8px 0 0",
                    }}
                  >
                    {saveError}
                  </p>
                )}
                <div className="actions">
                  <button
                    className="btn yellow"
                    onClick={handleSave}
                    disabled={saving}
                  >
                    {saving ? "GUARDANDO..." : "GUARDAR PUNTUACIÓN"}
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
                    onClick={() => router.push("/games/asteroids")}
                  >
                    VER LEADERBOARD
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
