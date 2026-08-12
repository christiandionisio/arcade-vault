"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/UserProvider";
import { createClient } from "@/utils/supabase/client";
import MobileGamepad from "@/components/MobileGamepad";

const FroggerGame = dynamic(() => import("@/components/games/FroggerGame"), {
  ssr: false,
});

export default function FroggerPlayPage() {
  const { user } = useUser();
  const router = useRouter();

  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [level, setLevel] = useState(1);
  const [paused, setPaused] = useState(false);
  const [over, setOver] = useState(false);
  const [gameKey, setGameKey] = useState(0);

  const [showModal, setShowModal] = useState(false);
  const [name, setName] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [activeSkin, setActiveSkin] = useState("classic");

  const finalScore = useRef(0);

  useEffect(() => {
    setIsMobile(window.matchMedia("(pointer: coarse)").matches);
    const saved = localStorage.getItem("av_player_name");
    if (saved) setName(saved);
    const savedSkin = localStorage.getItem("frogger-skin");
    if (savedSkin) setActiveSkin(savedSkin);
  }, []);

  function handleScoreChange(s: number) {
    setScore(s);
  }
  function handleLivesChange(l: number) {
    setLives(l);
  }
  function handleLevelChange(l: number) {
    setLevel(l);
  }

  function handleGameOver(s: number) {
    finalScore.current = s;
    setOver(true);
    setShowModal(true);
    setSaved(false);
    setSaveError(null);
  }

  function togglePause() {
    if (over) return;
    setPaused((p) => !p);
  }

  function handleSkinChange(skinName: string) {
    setActiveSkin(skinName);
    localStorage.setItem("frogger-skin", skinName);
  }

  async function handleSave() {
    const playerName = (name.trim() || "ANON").slice(0, 12).toUpperCase();
    setSaving(true);
    setSaveError(null);

    localStorage.setItem("av_player_name", playerName);

    const supabase = createClient();
    const { data: gameRow, error: gameErr } = await supabase
      .from("games")
      .select("id, best_score")
      .eq("slug", "frogger")
      .single();

    if (gameErr || !gameRow) {
      setSaveError("Error al obtener el juego.");
      setSaving(false);
      return;
    }

    const { error: insertErr } = await supabase.from("scores").insert({
      game_id: gameRow.id,
      player_name: playerName,
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

  function handleReplay() {
    setScore(0);
    setLives(3);
    setLevel(1);
    setPaused(false);
    setOver(false);
    setShowModal(false);
    setSaved(false);
    setSaveError(null);
    setGameKey((k) => k + 1);
  }

  return (
    <main
      className="av-main fade-in"
      style={
        isMobile
          ? { display: "flex", flexDirection: "column" }
          : {
              height: "calc(100dvh - 65px)",
              overflow: "hidden",
              display: "flex",
              flexDirection: "column",
            }
      }
    >
      <div
        className="av-player"
        style={
          isMobile
            ? {
                display: "flex",
                flexDirection: "column",
                width: "100%",
                padding: "0 8px 16px",
                margin: "8px auto",
              }
            : {
                flex: 1,
                display: "flex",
                flexDirection: "column",
                minHeight: 0,
                width: "100%",
                margin: "16px auto",
                paddingBottom: 0,
              }
        }
      >
        {/* React HUD */}
        <div className="player-hud" style={isMobile ? { display: "none" } : {}}>
          <div className="hud-stat">
            <span className="l">JUGADOR</span>
            <span className="v" style={{ fontSize: "12px" }}>
              {user?.name ?? "GUEST"}
            </span>
          </div>
          <div className="hud-stat">
            <span className="l">PUNTUACIÓN</span>
            <span className="v">{score.toLocaleString()}</span>
          </div>
          <div className="hud-stat lives">
            <span className="l">VIDAS</span>
            <span className="v">{"♥".repeat(Math.max(0, lives))}</span>
          </div>
          <div className="hud-stat level">
            <span className="l">NIVEL</span>
            <span className="v">{String(level).padStart(2, "0")}</span>
          </div>
          <div className="hud-actions">
            <select
              value={activeSkin}
              onChange={(e) => handleSkinChange(e.target.value)}
              className="pixel text-xs bg-black border border-white/20 text-white px-1 py-0.5 cursor-pointer"
            >
              {["classic", "retro", "neon", "jungle"].map((s) => (
                <option key={s} value={s}>
                  {s.toUpperCase()}
                </option>
              ))}
            </select>
            <button
              className="btn ghost"
              style={{ padding: "8px 14px", fontSize: "9px" }}
              onClick={togglePause}
              disabled={over}
            >
              {paused ? "REANUDAR" : "PAUSA"}
            </button>
            <button
              className="btn magenta"
              style={{ padding: "8px 14px", fontSize: "9px" }}
              onClick={() => router.push("/games/frogger")}
            >
              FIN
            </button>
          </div>
        </div>

        {/* Canvas */}
        <div
          className="crt"
          style={
            isMobile
              ? {
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                }
              : {
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  minHeight: 0,
                  alignItems: "center",
                }
          }
        >
          <div
            className="crt-screen"
            style={
              isMobile
                ? { width: "100%", aspectRatio: "8/7", position: "relative" }
                : {
                    width: "min(100%, calc((100dvh - 220px) * 8 / 7))",
                    position: "relative",
                  }
            }
          >
            <FroggerGame
              key={gameKey}
              paused={paused}
              skin={activeSkin}
              onScoreChange={handleScoreChange}
              onLivesChange={handleLivesChange}
              onLevelChange={handleLevelChange}
              onGameOver={handleGameOver}
            />
          </div>
          <div className="crt-bottom" style={{ width: "100%" }}>
            <span className="led">FROGGER</span>
            <span>FLECHAS — CRUZA LA CARRETERA Y EL RÍO</span>
          </div>
        </div>

        <MobileGamepad
          keyMap={{
            up: "ArrowUp",
            down: "ArrowDown",
            left: "ArrowLeft",
            right: "ArrowRight",
          }}
          onPause={togglePause}
          paused={paused}
          skins={["classic", "retro", "neon", "jungle"]}
          activeSkin={activeSkin}
          onSkinChange={handleSkinChange}
        />
      </div>

      {/* Game over modal */}
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
                    value={name}
                    onChange={(e) => setName(e.target.value.toUpperCase())}
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
                  <button className="btn ghost" onClick={handleReplay}>
                    JUGAR DE NUEVO
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => router.push("/games/frogger")}
                  >
                    SALIR
                  </button>
                </div>
              </>
            ) : (
              <>
                <span className="toast-saved">▸ PUNTUACIÓN GUARDADA_</span>
                <div className="actions" style={{ marginTop: "24px" }}>
                  <button className="btn yellow" onClick={handleReplay}>
                    JUGAR DE NUEVO
                  </button>
                  <button
                    className="btn ghost"
                    onClick={() => router.push("/games/frogger")}
                  >
                    VER LEADERBOARD
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
