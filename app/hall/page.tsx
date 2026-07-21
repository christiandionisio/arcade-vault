"use client";

import { useState } from "react";
import { GAMES, seededScores, type ScoreRow } from "@/app/data/games";
import { useUser } from "@/components/UserProvider";

const ALL_TAB = "TODOS";

function getScores(gameId: string): ScoreRow[] {
  const game = GAMES.find((g) => g.id === gameId);
  if (!game) return [];
  return seededScores(game.id.charCodeAt(0) + game.id.length, 12);
}

function mergeAll(): ScoreRow[] {
  const all: ScoreRow[] = [];
  GAMES.forEach((g) => {
    const rows = seededScores(g.id.charCodeAt(0) + g.id.length, 12);
    all.push(...rows);
  });
  all.sort((a, b) => b.score - a.score);
  return all.slice(0, 12).map((r, i) => ({ ...r, rank: i + 1 }));
}

export default function HallPage() {
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState(ALL_TAB);

  const scores = activeTab === ALL_TAB ? mergeAll() : getScores(activeTab);
  const top3 = scores.slice(0, 3);
  const rest = scores.slice(3);

  const podiumOrder = [top3[1], top3[0], top3[2]]; // silver, gold, bronze layout

  function rowClass(row: ScoreRow) {
    const classes: string[] = ["tr"];
    if (row.rank === 1) classes.push("top1");
    else if (row.rank === 2) classes.push("top2");
    else if (row.rank === 3) classes.push("top3");
    if (user && row.name === user.name) classes.push("you");
    return classes.join(" ");
  }

  return (
    <main className="av-main fade-in">
      <div className="av-hall">
        <div className="hall-head">
          <h1>SALÓN DE LA FAMA</h1>
          <p className="mono">LOS MEJORES SCORES DE ARCADE VAULT</p>
        </div>

        {/* Game tabs */}
        <div className="hall-tabs">
          <button
            className={`chip${activeTab === ALL_TAB ? " active" : ""}`}
            onClick={() => setActiveTab(ALL_TAB)}
          >
            TODOS
          </button>
          {GAMES.map((g) => (
            <button
              key={g.id}
              className={`chip${activeTab === g.id ? " active" : ""}`}
              onClick={() => setActiveTab(g.id)}
            >
              {g.title}
            </button>
          ))}
        </div>

        {/* Podium */}
        {top3.length === 3 && (
          <div className="podium">
            {podiumOrder.map((row, i) => {
              if (!row) return <div key={i} />;
              const medal = row.rank === 1 ? "gold" : row.rank === 2 ? "silver" : "bronze";
              const rankLabel = row.rank === 1 ? "#1" : row.rank === 2 ? "#2" : "#3";
              const isUser = user && row.name === user.name;
              return (
                <div key={row.rank} className={`podium-slot ${medal}`}>
                  <div className="rank-num">{rankLabel}</div>
                  <div className="name" style={isUser ? { color: "var(--yellow)" } : {}}>
                    {row.name}{isUser ? " ★" : ""}
                  </div>
                  <div className="score">{row.score.toLocaleString()}</div>
                  <div className="date">{row.date}</div>
                </div>
              );
            })}
          </div>
        )}

        {/* Table */}
        <div className="hall-table">
          <div className="th">
            <span>RANK</span>
            <span>JUGADOR</span>
            <span>PUNTUACIÓN</span>
            <span>FECHA</span>
          </div>
          {scores.map((row, idx) => {
            const isUser = user && row.name === user.name;
            return (
              <div
                key={idx}
                className={rowClass(row)}
                style={{ animationDelay: `${idx * 30}ms` }}
              >
                <span className="rk">#{row.rank}</span>
                <span className="pl">{row.name}{isUser ? " ★" : ""}</span>
                <span className="sc">{row.score.toLocaleString()}</span>
                <span className="dt">{row.date}</span>
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}
