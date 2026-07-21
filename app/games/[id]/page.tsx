import Link from "next/link";
import { notFound } from "next/navigation";
import { GAMES, seededScores } from "@/app/data/games";

export default async function GameDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const game = GAMES.find((g) => g.id === id);
  if (!game) notFound();

  const scores = seededScores(game.id.charCodeAt(0) + game.id.length, 10);

  return (
    <main className="av-main fade-in">
      <div className="av-detail">
        {/* Left: cover + actions */}
        <div>
          <div className="detail-cover">
            <div className={`cover-bg ${game.cover}`} style={{ position: "absolute", inset: 0 }} />
          </div>
          <div className="detail-actions" style={{ marginTop: "18px" }}>
            <Link href={`/games/${game.id}/play`}>
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
            <span>{game.cat}</span>
            <span style={{ color: "var(--cyan)", borderColor: "var(--cyan)" }}>{game.plays} PARTIDAS</span>
          </div>

          <h2 className="neon-cyan">{game.title}</h2>
          <p>{game.long}</p>

          <div className="stat-strip">
            <div>
              <div className="l">MEJOR</div>
              <div className="v">{game.best > 0 ? game.best.toLocaleString() : "—"}</div>
            </div>
            <div>
              <div className="l">PARTIDAS</div>
              <div className="v">{game.plays}</div>
            </div>
            <div>
              <div className="l">CATEGORÍA</div>
              <div className="v" style={{ fontSize: "10px" }}>{game.cat}</div>
            </div>
          </div>

          <div className="leaderboard" style={{ marginTop: "8px" }}>
            <h3>▸ TOP SCORES</h3>
            {scores.map((row) => (
              <div
                key={row.rank}
                className={`lb-row${row.rank === 1 ? " top1" : row.rank === 2 ? " top2" : row.rank === 3 ? " top3" : ""}`}
              >
                <span className="rk">#{row.rank}</span>
                <span className="pl">{row.name}</span>
                <span className="sc">{row.score.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
