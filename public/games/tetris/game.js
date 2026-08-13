(function () {
  "use strict";

  const COLS = 10;
  const ROWS = 20;
  const BLOCK = 30;

  const SKINS = {
    classic: {
      bg: "#000000",
      pieces: [
        null,
        "#4dd0e1",
        "#ffd54f",
        "#ba68c8",
        "#81c784",
        "#e57373",
        "#90caf9",
        "#ffb74d",
        "#9e9e9e",
      ],
      ghost: "rgba(255,255,255,0.18)",
      grid: "rgba(255,255,255,0.05)",
      highlight: "rgba(255,255,255,0.12)",
    },
    retro: {
      bg: "#1a0a00",
      pieces: [
        null,
        "#ff6600",
        "#ffaa00",
        "#cc4400",
        "#ff8800",
        "#dd2200",
        "#ff5500",
        "#ffcc00",
        "#aa6600",
      ],
      ghost: "rgba(255,120,0,0.2)",
      grid: "rgba(255,100,0,0.1)",
      highlight: "rgba(255,200,0,0.15)",
    },
    neon: {
      bg: "#050510",
      pieces: [
        null,
        "#00ffff",
        "#ffff00",
        "#ff00ff",
        "#00ff88",
        "#ff0055",
        "#0088ff",
        "#ff8800",
        "#aaaaff",
      ],
      ghost: "rgba(0,255,255,0.15)",
      grid: "rgba(0,255,255,0.06)",
      highlight: "rgba(255,255,255,0.18)",
    },
    pastel: {
      bg: "#1a1a2e",
      pieces: [
        null,
        "#a8d8ea",
        "#ffeaa7",
        "#dda0dd",
        "#98d8c8",
        "#ffb3b3",
        "#b3c6ff",
        "#ffd4a3",
        "#d4d4d4",
      ],
      ghost: "rgba(200,200,255,0.2)",
      grid: "rgba(180,180,220,0.08)",
      highlight: "rgba(255,255,255,0.2)",
    },
  };
  let activeSkin = SKINS.classic;

  window.gameSkins = Object.keys(SKINS);
  window.setSkin = (name) => {
    activeSkin = SKINS[name] ?? activeSkin;
    localStorage.setItem("tetris-skin", name);
    buildStaticLayer();
    dirty = true;
  };

  const _savedSkin = localStorage.getItem("tetris-skin");
  if (_savedSkin && SKINS[_savedSkin]) activeSkin = SKINS[_savedSkin];

  const COLORS = [
    null,
    "#4dd0e1", // I - cyan
    "#ffd54f", // O - yellow
    "#ba68c8", // T - purple
    "#81c784", // S - green
    "#e57373", // Z - red
    "#90caf9", // J - pale blue
    "#ffb74d", // L - orange
    "#9e9e9e", // N - tuerca (gris metálico)
  ];

  const PIECES = [
    null,
    [
      [0, 0, 0, 0],
      [1, 1, 1, 1],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ], // I
    [
      [2, 2],
      [2, 2],
    ], // O
    [
      [0, 3, 0],
      [3, 3, 3],
      [0, 0, 0],
    ], // T
    [
      [0, 4, 4],
      [4, 4, 0],
      [0, 0, 0],
    ], // S
    [
      [5, 5, 0],
      [0, 5, 5],
      [0, 0, 0],
    ], // Z
    [
      [6, 0, 0],
      [6, 6, 6],
      [0, 0, 0],
    ], // J
    [
      [0, 0, 7],
      [7, 7, 7],
      [0, 0, 0],
    ], // L
    [
      [8, 8, 8],
      [8, 0, 8],
      [8, 8, 8],
    ], // N (tuerca)
  ];

  const LINE_SCORES = [0, 100, 300, 500, 800];

  let staticLayer = null;

  function buildStaticLayer() {
    const offscreen = document.createElement("canvas");
    offscreen.width = COLS * BLOCK;
    offscreen.height = ROWS * BLOCK;
    const octx = offscreen.getContext("2d");
    octx.fillStyle = activeSkin.bg;
    octx.fillRect(0, 0, offscreen.width, offscreen.height);
    octx.strokeStyle = activeSkin.grid;
    octx.lineWidth = 0.5;
    for (let c = 1; c < COLS; c++) {
      octx.beginPath();
      octx.moveTo(c * BLOCK, 0);
      octx.lineTo(c * BLOCK, ROWS * BLOCK);
      octx.stroke();
    }
    for (let r = 1; r < ROWS; r++) {
      octx.beginPath();
      octx.moveTo(0, r * BLOCK);
      octx.lineTo(COLS * BLOCK, r * BLOCK);
      octx.stroke();
    }
    staticLayer = offscreen;
  }

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");
  const nextCanvas = document.getElementById("next-canvas");
  const nextCtx = nextCanvas.getContext("2d");
  const scoreEl = document.getElementById("score");
  const linesEl = document.getElementById("lines");
  const levelEl = document.getElementById("level");
  const overlay = document.getElementById("overlay");
  const overlayTitle = document.getElementById("overlay-title");
  const overlayScore = document.getElementById("overlay-score");
  const restartBtn = document.getElementById("restart-btn");

  let board,
    current,
    next,
    score,
    lines,
    level,
    paused,
    gameOver,
    lastTime,
    dropAccum,
    dropInterval,
    animId,
    dirty;

  let gameOverFired = false;

  function createBoard() {
    return Array.from({ length: ROWS }, () => new Array(COLS).fill(0));
  }

  function randomPiece() {
    const type = Math.floor(Math.random() * 8) + 1;
    const shape = PIECES[type].map((row) => [...row]);
    return {
      type,
      shape,
      x: Math.floor(COLS / 2) - Math.floor(shape[0].length / 2),
      y: 0,
    };
  }

  function collide(shape, ox, oy) {
    for (let r = 0; r < shape.length; r++) {
      for (let c = 0; c < shape[r].length; c++) {
        if (!shape[r][c]) continue;
        const nx = ox + c;
        const ny = oy + r;
        if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
        if (ny >= 0 && board[ny][nx]) return true;
      }
    }
    return false;
  }

  function rotateCW(shape) {
    const rows = shape.length,
      cols = shape[0].length;
    const result = Array.from({ length: cols }, () => new Array(rows).fill(0));
    for (let r = 0; r < rows; r++)
      for (let c = 0; c < cols; c++) result[c][rows - 1 - r] = shape[r][c];
    return result;
  }

  function tryRotate() {
    const rotated = rotateCW(current.shape);
    const kicks = [0, -1, 1, -2, 2];
    for (const kick of kicks) {
      if (!collide(rotated, current.x + kick, current.y)) {
        current.shape = rotated;
        current.x += kick;
        dirty = true;
        return;
      }
    }
  }

  function merge() {
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c])
          board[current.y + r][current.x + c] = current.shape[r][c];
  }

  function clearLines() {
    let cleared = 0;
    for (let r = ROWS - 1; r >= 0; r--) {
      if (board[r].every((v) => v !== 0)) {
        board.splice(r, 1);
        board.unshift(new Array(COLS).fill(0));
        cleared++;
        r++;
      }
    }
    if (cleared) {
      lines += cleared;
      score += (LINE_SCORES[cleared] || 0) * level;
      level = Math.floor(lines / 10) + 1;
      dropInterval = Math.max(100, 1000 - (level - 1) * 90);
      updateHUD();
    }
  }

  function ghostY() {
    let gy = current.y;
    while (!collide(current.shape, current.x, gy + 1)) gy++;
    return gy;
  }

  function hardDrop() {
    const gy = ghostY();
    score += (gy - current.y) * 2;
    current.y = gy;
    dirty = true;
    lockPiece();
  }

  function softDrop() {
    if (!collide(current.shape, current.x, current.y + 1)) {
      current.y++;
      score += 1;
      dirty = true;
      updateHUD();
    } else {
      lockPiece();
    }
  }

  function lockPiece() {
    merge();
    clearLines();
    spawn();
  }

  function spawn() {
    current = next;
    next = randomPiece();
    dirty = true;
    if (collide(current.shape, current.x, current.y)) {
      endGame();
    }
    drawNext();
  }

  function updateHUD() {
    if (scoreEl) scoreEl.textContent = score.toLocaleString();
    if (linesEl) linesEl.textContent = lines;
    if (levelEl) levelEl.textContent = level;
  }

  function drawBlock(context, x, y, colorIndex, size, alpha) {
    if (!colorIndex) return;
    const color = activeSkin.pieces[colorIndex];
    context.globalAlpha = alpha ?? 1;
    context.fillStyle = color;
    context.fillRect(x * size + 1, y * size + 1, size - 2, size - 2);
    // highlight
    context.fillStyle = activeSkin.highlight;
    context.fillRect(x * size + 1, y * size + 1, size - 2, 4);
    context.globalAlpha = 1;
  }

  function draw() {
    ctx.drawImage(staticLayer, 0, 0);

    // board
    for (let r = 0; r < ROWS; r++)
      for (let c = 0; c < COLS; c++) drawBlock(ctx, c, r, board[r][c], BLOCK);

    // ghost
    const gy = ghostY();
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        if (current.shape[r][c]) {
          ctx.globalAlpha = 0.25;
          ctx.fillStyle = activeSkin.ghost;
          ctx.fillRect(
            (current.x + c) * BLOCK + 1,
            (gy + r) * BLOCK + 1,
            BLOCK - 2,
            BLOCK - 2,
          );
          ctx.globalAlpha = 1;
        }

    // current piece
    for (let r = 0; r < current.shape.length; r++)
      for (let c = 0; c < current.shape[r].length; c++)
        drawBlock(
          ctx,
          current.x + c,
          current.y + r,
          current.shape[r][c],
          BLOCK,
        );
  }

  function drawNext() {
    const NB = 30;
    nextCtx.clearRect(0, 0, nextCanvas.width, nextCanvas.height);
    const shape = next.shape;
    const offX = Math.floor((4 - shape[0].length) / 2);
    const offY = Math.floor((4 - shape.length) / 2);
    for (let r = 0; r < shape.length; r++)
      for (let c = 0; c < shape[r].length; c++)
        drawBlock(nextCtx, offX + c, offY + r, shape[r][c], NB);
  }

  function endGame() {
    gameOver = true;
    if (!gameOverFired) {
      gameOverFired = true;
      window.dispatchEvent(new CustomEvent("gameOver", { detail: { score } }));
    }
    cancelAnimationFrame(animId);
    if (overlayTitle) overlayTitle.textContent = "GAME OVER";
    if (overlayScore)
      overlayScore.textContent = `Puntuación: ${score.toLocaleString()}`;
    if (overlay) overlay.classList.remove("hidden");
  }

  function togglePause() {
    if (gameOver) return;
    paused = !paused;
    if (!paused) {
      lastTime = performance.now();
      loop(lastTime);
    } else {
      cancelAnimationFrame(animId);
      if (overlayTitle) overlayTitle.textContent = "PAUSA";
      if (overlayScore) overlayScore.textContent = "";
      if (overlay) overlay.classList.remove("hidden");
    }
  }

  function loop(ts) {
    if (window.gamePaused) {
      animId = requestAnimationFrame(loop);
      return;
    }
    const dt = Math.min(ts - lastTime, 50);
    lastTime = ts;
    dropAccum += dt;
    if (dropAccum >= dropInterval) {
      dropAccum = 0;
      if (!collide(current.shape, current.x, current.y + 1)) {
        current.y++;
        dirty = true;
      } else {
        lockPiece();
      }
    }
    if (gameOver) return;
    window.gameState = { score, lives: "-", level, gameOver };
    if (dirty) {
      draw();
      dirty = false;
    }
    animId = requestAnimationFrame(loop);
  }

  function init() {
    buildStaticLayer();
    board = createBoard();
    score = 0;
    lines = 0;
    level = 1;
    paused = false;
    gameOver = false;
    gameOverFired = false;
    dropInterval = 1000;
    dropAccum = 0;
    lastTime = performance.now();
    next = randomPiece();
    spawn();
    updateHUD();
    if (overlay) overlay.classList.add("hidden");
    cancelAnimationFrame(animId);
    animId = requestAnimationFrame(loop);
  }

  function onKeyDown(e) {
    if (e.code === "KeyP") {
      togglePause();
      return;
    }
    if (paused || gameOver) return;
    switch (e.code) {
      case "ArrowLeft":
        if (!collide(current.shape, current.x - 1, current.y)) {
          current.x--;
          dirty = true;
        }
        break;
      case "ArrowRight":
        if (!collide(current.shape, current.x + 1, current.y)) {
          current.x++;
          dirty = true;
        }
        break;
      case "ArrowDown":
        softDrop();
        break;
      case "ArrowUp":
      case "KeyX":
        tryRotate();
        break;
      case "Space":
        e.preventDefault();
        hardDrop();
        break;
    }
    updateHUD();
  }

  document.addEventListener("keydown", onKeyDown);

  if (restartBtn) restartBtn.addEventListener("click", init);

  window.destroyGame = () => {
    cancelAnimationFrame(animId);
    document.removeEventListener("keydown", onKeyDown);
    if (restartBtn) restartBtn.removeEventListener("click", init);
  };

  init();
})();
