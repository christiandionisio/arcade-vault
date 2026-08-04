import Link from "next/link";
import { createClient } from "@/utils/supabase/server";

export default async function AsteroidsDetailPage() {
  const supabase = await createClient();

  const { data: game } = await supabase
    .from("games")
    .select(
      "id, name, description_short, description_long, category, best_score, matches_played",
    )
    .eq("slug", "asteroids")
    .single();

  const { data: scores } = await supabase
    .from("scores")
    .select("id, player_name, score, created_at")
    .eq("game_id", game?.id ?? "")
    .order("score", { ascending: false })
    .order("created_at", { ascending: true })
    .limit(10);

  const rows = scores ?? [];

  return (
    <main className="av-main fade-in">
      <div className="av-detail">
        {/* Left: cover + actions */}
        <div>
          <div className="detail-cover">
            <div
              className="cover-bg cover-rocas"
              style={{ position: "absolute", inset: 0 }}
            />
          </div>
          <div className="detail-actions" style={{ marginTop: "18px" }}>
            <Link href="/games/asteroids/play">
              <button className="btn yellow lg pulse">▶ JUGAR AHORA</button>
            </Link>
            <Link href="/">
              <button className="btn ghost">← BIBLIOTECA</button>
            </Link>
          </div>
        </div>

        {/* Right: info + stats + leaderboard */}
        <div className="detail-info">
          <div className="detail-tags">
            <span>{game?.category?.toUpperCase() ?? "SHOOTER"}</span>
            <span style={{ color: "var(--cyan)", borderColor: "var(--cyan)" }}>
              {game?.matches_played?.toLocaleString() ?? "0"} PARTIDAS
            </span>
          </div>

          <h2 className="neon-cyan">{game?.name ?? "ASTEROIDS"}</h2>
          <p>{game?.description_long ?? game?.description_short}</p>

          <div className="stat-strip">
            <div>
              <div className="l">MEJOR</div>
              <div className="v">
                {game?.best_score && game.best_score > 0
                  ? game.best_score.toLocaleString()
                  : "—"}
              </div>
            </div>
            <div>
              <div className="l">PARTIDAS</div>
              <div className="v">
                {game?.matches_played?.toLocaleString() ?? "0"}
              </div>
            </div>
            <div>
              <div className="l">CATEGORÍA</div>
              <div className="v" style={{ fontSize: "10px" }}>
                {game?.category?.toUpperCase() ?? "SHOOTER"}
              </div>
            </div>
          </div>

          <div className="leaderboard" style={{ marginTop: "8px" }}>
            <h3>▸ TOP SCORES</h3>
            {rows.length === 0 ? (
              <p
                style={{
                  color: "var(--fg-dim)",
                  fontSize: "11px",
                  marginTop: "12px",
                }}
              >
                SIN PUNTUACIONES AÚN — ¡SÉ EL PRIMERO!
              </p>
            ) : (
              rows.map((row, i) => (
                <div
                  key={row.id}
                  className={`lb-row${i === 0 ? " top1" : i === 1 ? " top2" : i === 2 ? " top3" : ""}`}
                >
                  <span className="rk">#{i + 1}</span>
                  <span className="pl">{row.player_name}</span>
                  <span className="sc">{row.score.toLocaleString()}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </main>
  );
}
