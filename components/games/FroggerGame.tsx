"use client";

import { useEffect, useRef } from "react";

// ── Constants ──────────────────────────────────────────────────────────────────
const COLS = 16;
const ROWS = 14;
const CELL = 40;
const CANVAS_W = COLS * CELL; // 640
const CANVAS_H = ROWS * CELL; // 560

const ROW_GOALS = 0;
const ROW_RIVER_TOP = 1;
const ROW_RIVER_BOT = 6;
const ROW_SAFE_MID = 7;
const ROW_ROAD_TOP = 8;
const ROW_ROAD_BOT = 12;
const ROW_START = 13;

const ROUND_TIME_BASE = 15;
const JUMP_ANIM_MS = 120;
const TURTLE_VISIBLE_MS = 3000;
const TURTLE_HIDDEN_MS = 1500;
const TURTLE_CYCLE_MS = TURTLE_VISIBLE_MS + TURTLE_HIDDEN_MS;

// 5 goal bays: dividers at cols 0,3,6,9,12,15; bays at [1,2],[4,5],[7,8],[10,11],[13,14]
const GOAL_BAYS: Array<[number, number]> = [
  [1, 2],
  [4, 5],
  [7, 8],
  [10, 11],
  [13, 14],
];

// ── Types ──────────────────────────────────────────────────────────────────────
type Dir = "up" | "down" | "left" | "right";

interface Entity {
  col: number;
  width: number;
  type: "car" | "truck" | "log" | "turtle";
  subTimer: number; // ms into current visibility cycle (turtles only)
  colorIdx: number; // for car color variety
}

interface Lane {
  row: number;
  speed: number; // cells/sec
  dir: 1 | -1;
  entities: Entity[];
}

interface Frog {
  col: number;
  row: number;
  animating: boolean;
  animT: number;
  fromCol: number;
  fromRow: number;
  targetCol: number;
  targetRow: number;
}

interface GS {
  alive: boolean;
  over: boolean;
  firedGameOver: boolean;
  lives: number;
  score: number;
  level: number;
  roundTime: number;
  goalsOccupied: boolean[];
  highestRow: number; // min row index reached this round (lower = higher on screen)
  frog: Frog;
  lanes: Lane[];
  pendingDir: Dir | null;
  prevScore: number;
  prevLives: number;
  prevLevel: number;
}

// ── Skins ──────────────────────────────────────────────────────────────────────
interface SkinPalette {
  riverBg: string;
  roadBg: string;
  safeBg: string;
  goalBg: string;
  goalDivider: string;
  goalBayEmpty: string;
  goalBayFilled: string;
  goalBayBorderEmpty: string;
  goalBayBorderFilled: string;
  frogBody: string;
  frogLegs: string;
  carColors: [string, string, string];
  truckBody: string;
  truckCabin: string;
  logBody: string;
  logGrain: string;
  logCap: string;
  turtleBody: string;
  turtleShell: string;
  turtleHead: string;
  turtleBodySub: string;
  turtleShellSub: string;
}

const SKINS: Record<string, SkinPalette> = {
  classic: {
    riverBg: "#071428",
    roadBg: "#141414",
    safeBg: "#112200",
    goalBg: "#0f2200",
    goalDivider: "#0a1f00",
    goalBayEmpty: "#162d00",
    goalBayFilled: "#1e4d00",
    goalBayBorderEmpty: "#3a5c00",
    goalBayBorderFilled: "#84cc16",
    frogBody: "#84cc16",
    frogLegs: "#65a30d",
    carColors: ["#e84545", "#f59e0b", "#3b82f6"],
    truckBody: "#4b5563",
    truckCabin: "#6b7280",
    logBody: "#7c4d1e",
    logGrain: "#92560f",
    logCap: "#5a3510",
    turtleBody: "#16a34a",
    turtleShell: "#22c55e",
    turtleHead: "#4ade80",
    turtleBodySub: "#1a4020",
    turtleShellSub: "#0d2010",
  },
  retro: {
    // CGA palette: black, cyan, magenta, white
    riverBg: "#000000",
    roadBg: "#000000",
    safeBg: "#000000",
    goalBg: "#000000",
    goalDivider: "#000000",
    goalBayEmpty: "#000040",
    goalBayFilled: "#004040",
    goalBayBorderEmpty: "#008080",
    goalBayBorderFilled: "#00ffff",
    frogBody: "#00ff00",
    frogLegs: "#008000",
    carColors: ["#ff00ff", "#ffffff", "#ff0000"],
    truckBody: "#808080",
    truckCabin: "#c0c0c0",
    logBody: "#804000",
    logGrain: "#a05000",
    logCap: "#603000",
    turtleBody: "#008080",
    turtleShell: "#00ffff",
    turtleHead: "#80ffff",
    turtleBodySub: "#004040",
    turtleShellSub: "#002020",
  },
  neon: {
    riverBg: "#000814",
    roadBg: "#0a0a0a",
    safeBg: "#050505",
    goalBg: "#020208",
    goalDivider: "#000000",
    goalBayEmpty: "#001020",
    goalBayFilled: "#002040",
    goalBayBorderEmpty: "#0040ff",
    goalBayBorderFilled: "#00f0ff",
    frogBody: "#39ff14",
    frogLegs: "#22cc00",
    carColors: ["#ff2d78", "#ff6b35", "#00e5ff"],
    truckBody: "#1a0030",
    truckCabin: "#2d0050",
    logBody: "#3d1a5c",
    logGrain: "#5c2a8a",
    logCap: "#2a1040",
    turtleBody: "#00e5ff",
    turtleShell: "#00b4cc",
    turtleHead: "#80ffff",
    turtleBodySub: "#003040",
    turtleShellSub: "#001520",
  },
  jungle: {
    riverBg: "#0a1f0a",
    roadBg: "#1a1200",
    safeBg: "#0d1a00",
    goalBg: "#061006",
    goalDivider: "#040c04",
    goalBayEmpty: "#0d1f0d",
    goalBayFilled: "#1a3d1a",
    goalBayBorderEmpty: "#2d5c2d",
    goalBayBorderFilled: "#7abd3e",
    frogBody: "#5a9e2f",
    frogLegs: "#3d7020",
    carColors: ["#8b2500", "#c47a00", "#4a7c00"],
    truckBody: "#3d2a00",
    truckCabin: "#5a3d00",
    logBody: "#5c3a1a",
    logGrain: "#7a4f22",
    logCap: "#3d2510",
    turtleBody: "#2d7a2d",
    turtleShell: "#4aad4a",
    turtleHead: "#6bcf6b",
    turtleBodySub: "#153d15",
    turtleShellSub: "#0a200a",
  },
};

export interface FroggerGameProps {
  paused: boolean;
  skin?: string;
  onScoreChange: (score: number) => void;
  onLivesChange: (lives: number) => void;
  onLevelChange: (level: number) => void;
  onGameOver: (finalScore: number) => void;
}

// ── Lane builder ───────────────────────────────────────────────────────────────
function ent(
  col: number,
  width: number,
  type: Entity["type"],
  subOffset = 0,
  colorIdx = 0,
): Entity {
  return { col, width, type, subTimer: subOffset, colorIdx };
}

function buildLanes(level: number): Lane[] {
  const m = Math.pow(1.15, level - 1);

  return [
    // Road (rows 8–12): cars and trucks
    {
      row: 12,
      speed: 2.0 * m,
      dir: 1,
      entities: [
        ent(0, 1, "car", 0, 0),
        ent(5, 1, "car", 0, 1),
        ent(11, 1, "car", 0, 2),
      ],
    },
    {
      row: 11,
      speed: 1.5 * m,
      dir: -1,
      entities: [ent(1, 2, "truck"), ent(9, 2, "truck")],
    },
    {
      row: 10,
      speed: 2.5 * m,
      dir: 1,
      entities: [
        ent(0, 1, "car", 0, 1),
        ent(4, 1, "car", 0, 2),
        ent(8, 1, "car", 0, 0),
        ent(12, 1, "car", 0, 1),
      ],
    },
    {
      row: 9,
      speed: 2.0 * m,
      dir: -1,
      entities: [ent(2, 2, "truck"), ent(10, 2, "truck")],
    },
    {
      row: 8,
      speed: 3.0 * m,
      dir: 1,
      entities: [
        ent(0, 1, "car", 0, 2),
        ent(5, 1, "car", 0, 0),
        ent(11, 1, "car", 0, 1),
      ],
    },
    // River (rows 1–6): logs and turtles
    {
      row: 6,
      speed: 1.5 * m,
      dir: 1,
      entities: [ent(0, 3, "log"), ent(6, 3, "log"), ent(12, 3, "log")],
    },
    {
      row: 5,
      speed: 1.0 * m,
      dir: -1,
      entities: [
        ent(1, 2, "turtle", 0),
        ent(7, 2, "turtle", TURTLE_CYCLE_MS / 3),
        ent(12, 2, "turtle", (2 * TURTLE_CYCLE_MS) / 3),
      ],
    },
    {
      row: 4,
      speed: 2.0 * m,
      dir: 1,
      entities: [ent(0, 4, "log"), ent(8, 4, "log")],
    },
    {
      row: 3,
      speed: 1.5 * m,
      dir: -1,
      entities: [
        ent(0, 2, "turtle", 0),
        ent(9, 2, "turtle", TURTLE_CYCLE_MS / 2),
      ],
    },
    {
      row: 2,
      speed: 1.5 * m,
      dir: 1,
      entities: [ent(0, 2, "log"), ent(5, 2, "log"), ent(10, 2, "log")],
    },
    {
      row: 1,
      speed: 2.5 * m,
      dir: -1,
      entities: [ent(0, 3, "log"), ent(6, 3, "log"), ent(12, 3, "log")],
    },
  ];
}

function makeFrog(): Frog {
  return {
    col: 7,
    row: ROW_START,
    animating: false,
    animT: 0,
    fromCol: 7,
    fromRow: ROW_START,
    targetCol: 7,
    targetRow: ROW_START,
  };
}

function roundTimeForLevel(level: number) {
  return Math.max(5, ROUND_TIME_BASE - (level - 1));
}

// ── Offscreen static background ────────────────────────────────────────────────
function buildStaticBg(skinName: string): HTMLCanvasElement {
  const sk = SKINS[skinName] ?? SKINS.classic;
  const offscreen = document.createElement("canvas");
  offscreen.width = CANVAS_W;
  offscreen.height = CANVAS_H;
  const ctx = offscreen.getContext("2d")!;

  // Zone backgrounds
  for (let row = 0; row < ROWS; row++) {
    const y = row * CELL;
    if (row === ROW_GOALS) ctx.fillStyle = sk.goalBg;
    else if (row >= ROW_RIVER_TOP && row <= ROW_RIVER_BOT)
      ctx.fillStyle = sk.riverBg;
    else if (row === ROW_SAFE_MID) ctx.fillStyle = sk.safeBg;
    else if (row === ROW_START) ctx.fillStyle = sk.safeBg;
    else ctx.fillStyle = sk.roadBg;
    ctx.fillRect(0, y, CANVAS_W, CELL);
  }

  // Road lane dashes
  ctx.strokeStyle = "#ffffff18";
  ctx.lineWidth = 1;
  ctx.setLineDash([8, 8]);
  for (let row = ROW_ROAD_TOP + 1; row <= ROW_ROAD_BOT; row++) {
    ctx.beginPath();
    ctx.moveTo(0, row * CELL);
    ctx.lineTo(CANVAS_W, row * CELL);
    ctx.stroke();
  }
  ctx.setLineDash([]);

  // River shimmer
  ctx.strokeStyle = "#0f2a5020";
  ctx.lineWidth = 1;
  for (let row = ROW_RIVER_TOP; row <= ROW_RIVER_BOT; row++) {
    for (let yi = 2; yi < CELL; yi += 8) {
      ctx.beginPath();
      ctx.moveTo(0, row * CELL + yi);
      ctx.lineTo(CANVAS_W, row * CELL + yi);
      ctx.stroke();
    }
  }

  return offscreen;
}

// ── Component ──────────────────────────────────────────────────────────────────
export default function FroggerGame({
  paused,
  skin = "classic",
  onScoreChange,
  onLivesChange,
  onLevelChange,
  onGameOver,
}: FroggerGameProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const skinRef = useRef<SkinPalette>(SKINS[skin] ?? SKINS.classic);
  const gsRef = useRef<GS>({
    alive: true,
    over: false,
    firedGameOver: false,
    lives: 3,
    score: 0,
    level: 1,
    roundTime: ROUND_TIME_BASE,
    goalsOccupied: Array(5).fill(false),
    highestRow: ROW_START,
    frog: makeFrog(),
    lanes: buildLanes(1),
    pendingDir: null,
    prevScore: 0,
    prevLives: 3,
    prevLevel: 1,
  });
  const pausedRef = useRef(paused);
  const cbRef = useRef({
    onScoreChange,
    onLivesChange,
    onLevelChange,
    onGameOver,
  });
  const respawnTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const staticBgRef = useRef<HTMLCanvasElement | null>(null);
  const laneMapRef = useRef<Map<number, Lane>>(new Map());
  const dirtyRef = useRef<boolean>(true);

  useEffect(() => {
    skinRef.current = SKINS[skin] ?? SKINS.classic;
    staticBgRef.current = buildStaticBg(skin);
    dirtyRef.current = true;
  }, [skin]);
  useEffect(() => {
    pausedRef.current = paused;
    dirtyRef.current = true;
  }, [paused]);
  useEffect(() => {
    cbRef.current = { onScoreChange, onLivesChange, onLevelChange, onGameOver };
  }, [onScoreChange, onLivesChange, onLevelChange, onGameOver]);

  // Keyboard input
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const gs = gsRef.current;
      if (gs.over) return;
      let dir: Dir | null = null;
      if (e.key === "ArrowUp") {
        dir = "up";
        e.preventDefault();
      }
      if (e.key === "ArrowDown") {
        dir = "down";
        e.preventDefault();
      }
      if (e.key === "ArrowLeft") {
        dir = "left";
        e.preventDefault();
      }
      if (e.key === "ArrowRight") {
        dir = "right";
        e.preventDefault();
      }
      if (dir && gs.alive && !gs.frog.animating) gs.pendingDir = dir;
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, []);

  // Game loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d")!;
    staticBgRef.current = buildStaticBg(skin);
    let rafId: number;
    let lastTime: number | null = null;

    // ── helpers ──────────────────────────────────────────────────────────────
    function populateLaneMap(lanes: Lane[]) {
      const m = laneMapRef.current;
      m.clear();
      for (const lane of lanes) m.set(lane.row, lane);
    }

    populateLaneMap(gsRef.current.lanes);

    function isSubmerged(e: Entity): boolean {
      return e.type === "turtle" && e.subTimer >= TURTLE_VISIBLE_MS;
    }

    function overlaps(frogCol: number, eCol: number, eWidth: number): boolean {
      return frogCol < eCol + eWidth && frogCol + 1 > eCol;
    }

    function checkRoadCollision(frog: Frog, lanes: Lane[]): boolean {
      const lane = laneMapRef.current.get(frog.row);
      if (!lane) return false;
      for (const e of lane.entities) {
        if (overlaps(frog.col, e.col, e.width)) return true;
        // also check wrapped copy
        if (overlaps(frog.col, e.col - COLS, e.width)) return true;
        if (overlaps(frog.col, e.col + COLS, e.width)) return true;
      }
      return false;
    }

    function getSupport(
      frog: Frog,
      lanes: Lane[],
    ): { lane: Lane; entity: Entity } | null {
      const lane = laneMapRef.current.get(frog.row);
      if (!lane) return null;
      for (const e of lane.entities) {
        if (isSubmerged(e)) continue;
        if (overlaps(frog.col, e.col, e.width)) return { lane, entity: e };
        if (overlaps(frog.col, e.col - COLS, e.width))
          return { lane, entity: e };
        if (overlaps(frog.col, e.col + COLS, e.width))
          return { lane, entity: e };
      }
      return null;
    }

    function killFrog(gs: GS) {
      if (!gs.alive) return;
      gs.alive = false;
      gs.pendingDir = null;
      gs.lives = Math.max(0, gs.lives - 1);
      if (gs.lives <= 0) {
        gs.over = true;
      } else {
        respawnTimerRef.current = setTimeout(() => {
          const g = gsRef.current;
          if (g.over) return;
          g.frog = makeFrog();
          g.highestRow = ROW_START;
          g.roundTime = roundTimeForLevel(g.level);
          g.pendingDir = null;
          g.alive = true;
        }, 600);
      }
    }

    function completeRound(gs: GS) {
      gs.score += 200;
      gs.level++;
      gs.goalsOccupied = Array(5).fill(false);
      gs.lanes = buildLanes(gs.level);
      populateLaneMap(gs.lanes);
      gs.frog = makeFrog();
      gs.highestRow = ROW_START;
      gs.roundTime = roundTimeForLevel(gs.level);
    }

    function resolveLanding(gs: GS) {
      const frog = gs.frog;

      // Score for advancing upward for the first time this round
      if (frog.row < gs.highestRow) {
        gs.score += (gs.highestRow - frog.row) * 10;
        gs.highestRow = frog.row;
      }

      if (frog.row === ROW_GOALS) {
        const goalIdx = GOAL_BAYS.findIndex(
          ([c1, c2]) => frog.col >= c1 && frog.col <= c2,
        );
        if (goalIdx === -1 || gs.goalsOccupied[goalIdx]) {
          killFrog(gs);
          return;
        }
        gs.goalsOccupied[goalIdx] = true;
        gs.score += 50 + Math.floor(gs.roundTime * 10);
        if (gs.goalsOccupied.every(Boolean)) {
          completeRound(gs);
        } else {
          gs.frog = makeFrog();
          gs.highestRow = ROW_START;
          gs.roundTime = roundTimeForLevel(gs.level);
        }
        return;
      }

      if (frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
        if (checkRoadCollision(frog, gs.lanes)) {
          killFrog(gs);
          return;
        }
      }

      if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
        if (!getSupport(frog, gs.lanes)) {
          killFrog(gs);
          return;
        }
      }
    }

    // ── update ────────────────────────────────────────────────────────────────
    function update(dt: number) {
      const gs = gsRef.current;
      if (pausedRef.current || gs.over) return;
      dirtyRef.current = true;

      const dtSec = dt / 1000;

      // Move entities and update turtle timers
      for (const lane of gs.lanes) {
        for (const e of lane.entities) {
          e.col += lane.speed * lane.dir * dtSec;
          if (lane.dir === 1 && e.col >= COLS) e.col -= COLS;
          if (lane.dir === -1 && e.col + e.width <= 0) e.col += COLS;
          if (e.type === "turtle") {
            e.subTimer = (e.subTimer + dt) % TURTLE_CYCLE_MS;
          }
        }
      }

      if (!gs.alive) return;

      const frog = gs.frog;

      if (frog.animating) {
        frog.animT += dt;
        if (frog.animT >= JUMP_ANIM_MS) {
          frog.col = frog.targetCol;
          frog.row = frog.targetRow;
          frog.animating = false;
          frog.animT = JUMP_ANIM_MS;
          resolveLanding(gs);
        }
      } else {
        // River drift
        if (frog.row >= ROW_RIVER_TOP && frog.row <= ROW_RIVER_BOT) {
          const support = getSupport(frog, gs.lanes);
          if (!support) {
            killFrog(gs);
          } else {
            frog.col += support.lane.speed * support.lane.dir * dtSec;
            if (frog.col < 0 || frog.col + 1 > COLS) {
              killFrog(gs);
            }
          }
        }

        // Road: car moves into standing frog
        if (gs.alive && frog.row >= ROW_ROAD_TOP && frog.row <= ROW_ROAD_BOT) {
          if (checkRoadCollision(frog, gs.lanes)) killFrog(gs);
        }

        // Input
        if (gs.alive && gs.pendingDir !== null) {
          const dir = gs.pendingDir;
          gs.pendingDir = null;
          let newCol = Math.round(frog.col);
          let newRow = frog.row;
          if (dir === "up") newRow--;
          if (dir === "down") newRow++;
          if (dir === "left") newCol--;
          if (dir === "right") newCol++;
          if (newCol < 0 || newCol >= COLS) return;
          if (newRow < ROW_GOALS || newRow > ROW_START) return;
          frog.fromCol = frog.col;
          frog.fromRow = frog.row;
          frog.targetCol = newCol;
          frog.targetRow = newRow;
          frog.animating = true;
          frog.animT = 0;
        }
      }

      // Round timer
      if (gs.alive) {
        gs.roundTime -= dtSec;
        if (gs.roundTime <= 0) {
          gs.roundTime = 0;
          killFrog(gs);
        }
      }

      // Fire callbacks on change
      if (gs.score !== gs.prevScore) {
        cbRef.current.onScoreChange(gs.score);
        gs.prevScore = gs.score;
      }
      if (gs.lives !== gs.prevLives) {
        cbRef.current.onLivesChange(gs.lives);
        gs.prevLives = gs.lives;
      }
      if (gs.level !== gs.prevLevel) {
        cbRef.current.onLevelChange(gs.level);
        gs.prevLevel = gs.level;
      }
      if (gs.over && !gs.firedGameOver) {
        gs.firedGameOver = true;
        cbRef.current.onLivesChange(0);
        cbRef.current.onGameOver(gs.score);
      }
    }

    // ── draw helpers ──────────────────────────────────────────────────────────
    function drawEntityAt(e: Entity, drawCol: number, row: number) {
      const sk = skinRef.current;
      const x = drawCol * CELL;
      const y = row * CELL;
      const w = e.width * CELL;

      if (e.type === "car") {
        ctx.fillStyle = sk.carColors[e.colorIdx % 3];
        ctx.fillRect(x + 3, y + 10, w - 6, CELL - 18);
        // windshield
        ctx.fillStyle = "rgba(180,220,255,0.6)";
        ctx.fillRect(x + 5, y + 12, w - 10, CELL - 24);
        // wheels
        ctx.fillStyle = "#1a1a1a";
        [
          [x + 6, y + CELL - 10],
          [x + w - 6, y + CELL - 10],
        ].forEach(([wx, wy]) => {
          ctx.beginPath();
          ctx.arc(wx, wy, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (e.type === "truck") {
        ctx.fillStyle = sk.truckBody;
        ctx.fillRect(x + 2, y + 8, w - 4, CELL - 14);
        // cabin
        ctx.fillStyle = sk.truckCabin;
        ctx.fillRect(x + 2, y + 6, CELL * 0.8, CELL - 10);
        // wheels
        ctx.fillStyle = "#1a1a1a";
        [x + 8, x + w / 2, x + w - 8].forEach((wx) => {
          ctx.beginPath();
          ctx.arc(wx, y + CELL - 8, 5, 0, Math.PI * 2);
          ctx.fill();
        });
      } else if (e.type === "log") {
        ctx.fillStyle = sk.logBody;
        ctx.fillRect(x + 1, y + 8, w - 2, CELL - 16);
        // wood grain
        ctx.strokeStyle = sk.logGrain;
        ctx.lineWidth = 1.5;
        for (let i = 1; i < e.width; i++) {
          ctx.beginPath();
          ctx.moveTo(x + i * CELL, y + 8);
          ctx.lineTo(x + i * CELL, y + CELL - 8);
          ctx.stroke();
        }
        // end caps
        ctx.fillStyle = sk.logCap;
        ctx.fillRect(x + 1, y + 8, 5, CELL - 16);
        ctx.fillRect(x + w - 6, y + 8, 5, CELL - 16);
      } else if (e.type === "turtle") {
        const sub = isSubmerged(e);
        ctx.globalAlpha = sub ? 0.3 : 1;
        const tW = (e.width * CELL) / 2;
        for (let t = 0; t < 2; t++) {
          const tx = x + t * tW + tW / 2;
          const ty = y + CELL / 2;
          ctx.fillStyle = sub ? sk.turtleBodySub : sk.turtleBody;
          ctx.beginPath();
          ctx.ellipse(tx, ty, tW / 2 - 3, CELL / 2 - 7, 0, 0, Math.PI * 2);
          ctx.fill();
          // shell
          ctx.fillStyle = sub ? sk.turtleShellSub : sk.turtleShell;
          ctx.beginPath();
          ctx.ellipse(tx, ty, tW / 4, CELL / 4, 0, 0, Math.PI * 2);
          ctx.fill();
          // head
          ctx.fillStyle = sub ? sk.turtleBodySub : sk.turtleHead;
          ctx.beginPath();
          ctx.arc(tx + (tW / 2 - 5), ty - 6, 4, 0, Math.PI * 2);
          ctx.fill();
        }
        ctx.globalAlpha = 1;
      }
    }

    function drawEntity(e: Entity, row: number) {
      // Main draw
      drawEntityAt(e, e.col, row);
      // Seamless edge wrap
      if (e.col + e.width > COLS) drawEntityAt(e, e.col - COLS, row);
      if (e.col < 0) drawEntityAt(e, e.col + COLS, row);
    }

    function drawFrog(renderCol: number, renderRow: number, jumpT: number) {
      const sk = skinRef.current;
      const x = renderCol * CELL;
      const y = renderRow * CELL;
      const cx = x + CELL / 2;
      const cy = y + CELL / 2 - Math.sin(jumpT * Math.PI) * 7;

      // back legs
      if (jumpT > 0.1 && jumpT < 0.9) {
        ctx.strokeStyle = sk.frogLegs;
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(cx - 10, cy + 8);
        ctx.lineTo(cx - 17, cy + 18);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(cx + 10, cy + 8);
        ctx.lineTo(cx + 17, cy + 18);
        ctx.stroke();
      }
      // body
      ctx.fillStyle = sk.frogBody;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 14, 11, 0, 0, Math.PI * 2);
      ctx.fill();
      // eyes
      [
        [cx - 7, cy - 8],
        [cx + 7, cy - 8],
      ].forEach(([ex, ey]) => {
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(ex, ey, 4, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(ex, ey, 2, 0, Math.PI * 2);
        ctx.fill();
      });
    }

    function drawMiniGoalFrog(cx: number, cy: number) {
      const sk = skinRef.current;
      ctx.fillStyle = sk.frogBody;
      ctx.beginPath();
      ctx.ellipse(cx, cy, 8, 6, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      [
        [cx - 4, cy - 5],
        [cx + 4, cy - 5],
      ].forEach(([ex, ey]) => {
        ctx.beginPath();
        ctx.arc(ex, ey, 2.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#111";
        ctx.beginPath();
        ctx.arc(ex, ey, 1.2, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
      });
    }

    // ── draw ──────────────────────────────────────────────────────────────────
    function draw() {
      const gs = gsRef.current;
      const sk = skinRef.current;
      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      // Static background (zones, road dashes, river shimmer)
      if (staticBgRef.current) ctx.drawImage(staticBgRef.current, 0, 0);

      // Goal bays
      const DIVIDER_COLS = [0, 3, 6, 9, 12, 15];
      for (const c of DIVIDER_COLS) {
        ctx.fillStyle = sk.goalDivider;
        ctx.fillRect(c * CELL, 0, CELL, CELL);
      }
      for (let i = 0; i < 5; i++) {
        const [c1, c2] = GOAL_BAYS[i];
        const bx = c1 * CELL;
        const bw = (c2 - c1 + 1) * CELL;
        ctx.fillStyle = gs.goalsOccupied[i]
          ? sk.goalBayFilled
          : sk.goalBayEmpty;
        ctx.fillRect(bx, 0, bw, CELL);
        ctx.strokeStyle = gs.goalsOccupied[i]
          ? sk.goalBayBorderFilled
          : sk.goalBayBorderEmpty;
        ctx.lineWidth = 2;
        ctx.strokeRect(bx + 1, 1, bw - 2, CELL - 2);
        if (gs.goalsOccupied[i]) drawMiniGoalFrog(bx + bw / 2, CELL / 2);
      }

      // Entities
      for (const lane of gs.lanes) {
        for (const e of lane.entities) drawEntity(e, lane.row);
      }

      // Frog
      if (gs.alive) {
        const frog = gs.frog;
        if (frog.animating) {
          const t = Math.min(frog.animT / JUMP_ANIM_MS, 1);
          drawFrog(
            frog.fromCol + (frog.targetCol - frog.fromCol) * t,
            frog.fromRow + (frog.targetRow - frog.fromRow) * t,
            t,
          );
        } else {
          drawFrog(frog.col, frog.row, 0);
        }
      }

      // HUD: timer bar
      const maxTime = roundTimeForLevel(gs.level);
      const timeRatio = Math.max(0, gs.roundTime / maxTime);
      const barColor =
        timeRatio > 0.5 ? "#22c55e" : timeRatio > 0.25 ? "#f59e0b" : "#ef4444";
      ctx.fillStyle = "#0004";
      ctx.fillRect(0, CANVAS_H - 20, CANVAS_W, 20);
      ctx.fillStyle = barColor;
      ctx.fillRect(0, CANVAS_H - 6, CANVAS_W * timeRatio, 6);

      // HUD: text
      ctx.font = "bold 11px monospace";
      ctx.textBaseline = "middle";
      ctx.fillStyle = "#e5e7eb";
      ctx.textAlign = "left";
      ctx.fillText(`SCORE ${gs.score.toLocaleString()}`, 8, CANVAS_H - 12);
      ctx.textAlign = "center";
      ctx.fillText(
        `LVL ${String(gs.level).padStart(2, "0")}`,
        CANVAS_W / 2,
        CANVAS_H - 12,
      );
      ctx.textAlign = "right";
      ctx.fillText(
        "♥".repeat(Math.max(0, gs.lives)),
        CANVAS_W - 8,
        CANVAS_H - 12,
      );

      // Game over overlay
      if (gs.over) {
        ctx.fillStyle = "rgba(0,0,0,0.75)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#ef4444";
        ctx.font = "bold 28px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("GAME OVER", CANVAS_W / 2, CANVAS_H / 2);
      }

      // Paused overlay
      if (pausedRef.current && !gs.over) {
        ctx.fillStyle = "rgba(0,0,0,0.6)";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        ctx.fillStyle = "#fde047";
        ctx.font = "bold 20px monospace";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText("EN PAUSA", CANVAS_W / 2, CANVAS_H / 2);
      }
    }

    function loop(ts: number) {
      if (lastTime === null) lastTime = ts;
      const dt = Math.min(ts - lastTime, 50);
      lastTime = ts;
      update(dt);
      if (dirtyRef.current) {
        draw();
        dirtyRef.current = false;
      }
      rafId = requestAnimationFrame(loop);
    }

    rafId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(rafId);
      if (respawnTimerRef.current) clearTimeout(respawnTimerRef.current);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      width={CANVAS_W}
      height={CANVAS_H}
      style={{ width: "100%", height: "100%", display: "block" }}
    />
  );
}
