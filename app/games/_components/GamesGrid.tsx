"use client";

import { useState } from "react";
import Link from "next/link";
import { type Game } from "@/app/data/games";

function GameCard({ game }: { game: Game }) {
  function onMove(e: React.MouseEvent<HTMLDivElement>) {
    const el = e.currentTarget;
    const r = el.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    el.style.transform = `translateY(-6px) rotateX(${-py * 6}deg) rotateY(${px * 8}deg)`;
  }
  function onLeave(e: React.MouseEvent<HTMLDivElement>) {
    e.currentTarget.style.transform = "";
  }

  const btnClass = `btn${game.color === "#ff006e" ? " magenta" : game.color === "#f5ff00" ? " yellow" : ""}`;

  return (
    <Link href={`/games/${game.id}`} style={{ textDecoration: "none" }}>
      <div className="card" onMouseMove={onMove} onMouseLeave={onLeave}>
        <div className="cover">
          <div className={`cover-bg ${game.cover}`} />
          <div className="label">{game.cat}</div>
        </div>
        <div className="meta">
          <div className="title">{game.title}</div>
          <div className="desc">{game.short}</div>
          <div className="row">
            <div className="score-badge">
              <span>MEJOR PUNTUACIÓN</span>
              <b>{game.best > 0 ? game.best.toLocaleString("es-ES") : "—"}</b>
            </div>
            <button className={btnClass} onClick={(e) => e.preventDefault()}>
              JUGAR
            </button>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function GamesGrid({
  games,
  cats,
}: {
  games: Game[];
  cats: string[];
}) {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("TODOS");

  const filtered = games.filter((g) => {
    const matchCat = cat === "TODOS" || g.cat === cat;
    const matchQ = g.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <>
      <div className="av-filters">
        <div className="av-search">
          <span className="ico">⌕</span>
          <input
            type="text"
            placeholder="Buscar un juego por nombre…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="av-chips">
          {cats.map((c) => (
            <button
              key={c}
              className={`chip${cat === c ? " active" : ""}`}
              onClick={() => setCat(c)}
            >
              {c}
            </button>
          ))}
        </div>
      </div>

      <div className="av-grid">
        {filtered.map((game) => (
          <GameCard key={game.id} game={game} />
        ))}
        {filtered.length === 0 && (
          <div
            style={{
              gridColumn: "1 / -1",
              textAlign: "center",
              padding: 80,
              color: "var(--ink-faint)",
            }}
          >
            <div
              className="pixel"
              style={{
                fontSize: 14,
                color: "var(--magenta)",
                marginBottom: 12,
              }}
            >
              NO HAY RESULTADOS
            </div>
            <div>Intenta otra búsqueda o categoría.</div>
          </div>
        )}
      </div>
    </>
  );
}
