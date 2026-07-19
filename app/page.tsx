"use client";

import { useState } from "react";
import Link from "next/link";
import { GAMES, CATS } from "@/app/data/games";

export default function LibraryPage() {
  const [query, setQuery] = useState("");
  const [cat, setCat] = useState("TODOS");

  const filtered = GAMES.filter((g) => {
    const matchCat = cat === "TODOS" || g.cat === cat;
    const matchQ = g.title.toLowerCase().includes(query.toLowerCase());
    return matchCat && matchQ;
  });

  return (
    <main className="av-main fade-in">
      <div className="av-hero">
        <h1>ARCADE VAULT</h1>
        <p className="sub">
          INSERT COIN TO PLAY <span className="blink">_</span>
        </p>
      </div>

      <div className="av-filters">
        <div className="av-search">
          <span className="ico">▶</span>
          <input
            type="text"
            placeholder="BUSCAR JUEGO..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </div>
        <div className="av-chips">
          {CATS.map((c) => (
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
          <Link key={game.id} href={`/games/${game.id}`} style={{ textDecoration: "none" }}>
            <div className="card">
              <div className="cover">
                <div className={`cover-bg ${game.cover}`} />
                <span className="label">{game.cat}</span>
              </div>
              <div className="meta">
                <div className="title">{game.title}</div>
                <div className="desc">{game.short}</div>
                <div className="row">
                  <div className="score-badge">
                    <span>MEJOR</span>
                    <b>{game.best > 0 ? game.best.toLocaleString() : "—"}</b>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span className="mono" style={{ fontSize: "11px", color: "var(--ink-faint)" }}>
                      {game.plays} partidas
                    </span>
                    <button
                      className="btn"
                      style={{ padding: "8px 14px", fontSize: "9px" }}
                      onClick={(e) => e.preventDefault()}
                    >
                      JUGAR
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </main>
  );
}
