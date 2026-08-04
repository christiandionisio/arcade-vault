import { createClient } from "@/utils/supabase/server";
import HallClient, {
  type HallGame,
  type HallScore,
} from "./_components/HallClient";

export default async function HallPage() {
  const supabase = await createClient();

  const [{ data: gamesData }, { data: scoresData }] = await Promise.all([
    supabase
      .from("games")
      .select("id, slug, name")
      .order("created_at", { ascending: true }),
    supabase
      .from("scores")
      .select("id, player_name, score, created_at, game_id, games(slug, name)")
      .order("score", { ascending: false })
      .order("created_at", { ascending: true })
      .limit(50),
  ]);

  const games: HallGame[] = (gamesData ?? []).map((g) => ({
    id: g.id,
    slug: g.slug,
    name: g.name,
  }));

  const scores: HallScore[] = (scoresData ?? []).map((s) => {
    const game = Array.isArray(s.games) ? s.games[0] : s.games;
    return {
      id: s.id,
      player_name: s.player_name,
      score: s.score,
      created_at: s.created_at,
      game_id: s.game_id,
      game_slug: game?.slug ?? "",
      game_name: game?.name ?? "",
    };
  });

  return (
    <main className="av-main fade-in">
      <HallClient games={games} scores={scores} />
    </main>
  );
}
