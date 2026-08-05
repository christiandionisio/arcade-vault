import { createClient } from "@/utils/supabase/server";
import { type Game } from "@/app/data/games";
import GamesGrid from "./_components/GamesGrid";

const COVER_MAP: Record<string, string> = {
  asteroids: "cover-rocas",
  tetris: "cover-tetris",
  arkanoid: "cover-arkanoid",
};

const COLOR_MAP: Record<string, string> = {
  asteroids: "#c7d0e0",
  tetris: "#4dd0e1",
  arkanoid: "#e84545",
};

export default async function LibraryPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("games")
    .select(
      "slug, name, description_short, description_long, category, best_score, matches_played",
    )
    .order("created_at", { ascending: true });

  const games: Game[] = (data ?? []).map((g) => ({
    id: g.slug,
    title: g.name,
    short: g.description_short ?? "",
    long: g.description_long ?? "",
    cat: g.category?.toUpperCase() ?? "ARCADE",
    cover: COVER_MAP[g.slug] ?? "cover-default",
    color: COLOR_MAP[g.slug] ?? "#ffffff",
    best: g.best_score ?? 0,
    plays: (g.matches_played ?? 0).toLocaleString(),
  }));

  const cats = [
    "TODOS",
    ...Array.from(new Set(games.map((g) => g.cat))).sort(),
  ];

  return (
    <main className="av-main fade-in">
      <section className="av-hero">
        <h1 className="flicker">ARCADE VAULT</h1>
        <div className="sub">
          INSERTA UNA MONEDA PARA JUGAR <span className="blink">_</span>
        </div>
      </section>

      <GamesGrid games={games} cats={cats} />
    </main>
  );
}
