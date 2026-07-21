export type Game = {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;
  color: string;
  best: number;
  plays: string;
};

export type ScoreRow = {
  rank: number;
  name: string;
  score: number;
  date: string;
};

export const GAMES: Game[] = [
  {
    id: "brickblast",
    title: "BRICK BLAST",
    short: "Destruye todos los bloques antes de que caiga la pelota.",
    long: "Controla la paleta y lanza la pelota para eliminar todos los bloques de colores. Con cada nivel la velocidad aumenta y los bloques se reorganizan en patrones imposibles.",
    cat: "ARCADE",
    cover: "cover-bricks",
    color: "#ff006e",
    best: 98400,
    plays: "142K",
  },
  {
    id: "tetroclash",
    title: "TETRO CLASH",
    short: "Encaja piezas, forma líneas, sobrevive.",
    long: "El clásico puzzle de piezas cayendo con un giro: cada 10 líneas el campo se invierte y los controles cambian de lado. ¿Cuántas líneas aguantas?",
    cat: "PUZZLE",
    cover: "cover-tetro",
    color: "#00f5ff",
    best: 214560,
    plays: "89K",
  },
  {
    id: "snakehunt",
    title: "SNAKE HUNT",
    short: "Come, crece, no te muerdas.",
    long: "La serpiente clásica en un grid que se achica con el tiempo. La dificultad escala con la longitud: a partir de cierto tamaño la pantalla empieza a parpadear.",
    cat: "ARCADE",
    cover: "cover-snake",
    color: "#00ff88",
    best: 67200,
    plays: "203K",
  },
  {
    id: "glotorun",
    title: "GLOTO RUN",
    short: "Esquiva, absorbe, explota.",
    long: "Controla una criatura gelatinosa que absorbe enemigos pequeños y explota contra los grandes. El escenario cambia cada 30 segundos en una rotación de 8 biomas.",
    cat: "ARCADE",
    cover: "cover-glot",
    color: "#f5ff00",
    best: 44100,
    plays: "51K",
  },
  {
    id: "invaders99",
    title: "INVADERS 99",
    short: "99 jugadores, un solo superviviente.",
    long: "Battle royale de aliens: 99 jugadores eliminan oleadas simultáneamente. Cuantos más aliens matas, más rápido caen en la pantalla de los rivales. El último vivo gana.",
    cat: "SHOOTER",
    cover: "cover-invaders",
    color: "#00ff88",
    best: 312000,
    plays: "512K",
  },
  {
    id: "rocas",
    title: "ROCAS",
    short: "Destruye asteroides. Sobrevive.",
    long: "Nave en campo abierto, asteroides de todos los tamaños. Los grandes se fragmentan en medianos, los medianos en pequeños. A partir del nivel 5 aparecen OVNIs hostiles.",
    cat: "SHOOTER",
    cover: "cover-rocas",
    color: "#c7d0e0",
    best: 88500,
    plays: "77K",
  },
  {
    id: "ranacruz",
    title: "RANA CRUZ",
    short: "Cruza la calle. No mueras.",
    long: "La rana más famosa del arcade vuelve con tráfico generado proceduralmente y ríos con corrientes variables. Cada pantalla completa suma bonus de tiempo.",
    cat: "ARCADE",
    cover: "cover-rana",
    color: "#00ff88",
    best: 29700,
    plays: "166K",
  },
  {
    id: "duelo",
    title: "DUELO",
    short: "1 vs 1. Reflejos de acero.",
    long: "Dos luchadores en un pasillo. Cada round es un intercambio de golpes con timing preciso. El lag de 1 frame puede costarte la pelea. ¿Tienes los reflejos?",
    cat: "VERSUS",
    cover: "cover-duelo",
    color: "#ff006e",
    best: 0,
    plays: "38K",
  },
];

export const CATS: string[] = ["TODOS", "ARCADE", "PUZZLE", "SHOOTER", "VERSUS"];

const NAMES = [
  "ACE", "BLITZ", "COBRA", "DASH", "ECHO", "FLUX", "GRIM", "HAWK",
  "IRON", "JOLT", "KAZE", "LYNX", "MACH", "NOVA", "ONYX", "PIKE",
  "QUAD", "RAZE", "SYNC", "TIDE", "UNIT", "VEGA", "WARP", "XRAY",
  "YUKI", "ZERO",
];

function seededRng(seed: number) {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) & 0xffffffff;
    return (s >>> 0) / 0x100000000;
  };
}

export function seededScores(seed: number, count = 10): ScoreRow[] {
  const rng = seededRng(seed);
  const rows: ScoreRow[] = [];
  let score = Math.floor(rng() * 300000 + 50000);
  for (let i = 0; i < count; i++) {
    const nameIdx = Math.floor(rng() * NAMES.length);
    const suffix = Math.floor(rng() * 999);
    const name = `${NAMES[nameIdx]}${suffix.toString().padStart(3, "0")}`;
    const year = 2025 + Math.floor(rng() * 2);
    const month = String(Math.floor(rng() * 12) + 1).padStart(2, "0");
    const day = String(Math.floor(rng() * 28) + 1).padStart(2, "0");
    rows.push({ rank: i + 1, name, score, date: `${year}-${month}-${day}` });
    score = Math.floor(score * (0.85 + rng() * 0.1));
  }
  return rows;
}
