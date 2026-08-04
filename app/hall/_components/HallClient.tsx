"use client";

import { useState } from "react";
import { useUser } from "@/components/UserProvider";

export type HallScore = {
  id: string;
  player_name: string;
  score: number;
  created_at: string;
  game_id: string;
  game_slug: string;
  game_name: string;
};

export type HallGame = {
  id: string;
  slug: string;
  name: string;
};

type RankedRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

const ALL_TAB = "TODOS";

function rankRows(scores: HallScore[]): RankedRow[] {
  return scores.map((s, i) => ({
    rank: i + 1,
    name: s.player_name,
    score: s.score,
    date: s.created_at.slice(0, 10),
  }));
}

export default function HallClient({
  games,
  scores,
}: {
  games: HallGame[];
  scores: HallScore[];
}) {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(ALL_TAB);

  const filtered =
    activeTab === ALL_TAB
      ? scores
      : scores.filter((s) => s.game_slug === activeTab);

  const rows = rankRows(filtered);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);
  const podiumOrder = [top3[1], top3[0], top3[2]];

  function rowClass(row: RankedRow) {
    const classes = ["tr"];
    if (row.rank === 1) classes.push("top1");
    else if (row.rank === 2) classes.push("top2");
    else if (row.rank === 3) classes.push("top3");
    if (user && row.name === user.name) classes.push("you");
    return classes.join(" ");
  }

  return (
    <div className="av-hall">
      <div className="hall-head">
        <h1>SALÓN DE LA FAMA</h1>
        <p className="mono">LOS MEJORES SCORES DE ARCADE VAULT</p>
      </div>

      <div className="hall-tabs">
        <button
          className={`chip${activeTab === ALL_TAB ? " active" : ""}`}
          onClick={() => setActiveTab(ALL_TAB)}
        >
          TODOS
        </button>
        {games.map((g) => (
          <button
            key={g.slug}
            className={`chip${activeTab === g.slug ? " active" : ""}`}
            onClick={() => setActiveTab(g.slug)}
          >
            {g.name.toUpperCase()}
          </button>
        ))}
      </div>

      {top3.length === 3 && (
        <div className="podium">
          {podiumOrder.map((row, i) => {
            if (!row) return <div key={i} />;
            const medal =
              row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : "bronze";
            const isUser = user && row.name === user.name;
            return (
              <div key={row.rank} className={`podium-slot ${medal}`}>
                <div className="rank-num">#{row.rank}</div>
                <div
                  className="name"
                  style={isUser ? { color: "var(--yellow)" } : {}}
                >
                  {row.name}
                  {isUser ? " ★" : ""}
                </div>
                <div className="score">{row.score.toLocaleString()}</div>
                <div className="date">{row.date}</div>
              </div>
            );
          })}
        </div>
      )}

      {rows.length === 0 ? (
        <p
          style={{
            color: "var(--fg-dim)",
            fontSize: "11px",
            textAlign: "center",
            padding: "40px 0",
          }}
        >
          SIN PUNTUACIONES AÚN — ¡SÉ EL PRIMERO!
        </p>
      ) : (
        <div className="hall-table">
          <div className="th">
            <span>RANK</span>
            <span>JUGADOR</span>
            <span>PUNTUACIÓN</span>
            <span>FECHA</span>
          </div>
          {rows.map((row, idx) => {
            const isUser = user && row.name === user.name;
            return (
              <div
                key={idx}
                className={rowClass(row)}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <span className="rk">#{row.rank}</span>
                <span className="pl">
                  {row.name}
                  {isUser ? " ★" : ""}
                </span>
                <span className="sc">{row.score.toLocaleString()}</span>
                <span className="dt">{row.date}</span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
