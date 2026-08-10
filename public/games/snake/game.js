(function () {
  "use strict";

  const SKINS = {
    classic: {
      bg: "#1a2e1a",
      grid: "#223322",
      headFill: "#55ee55",
      headR: 40,
      headG: 180,
      headB: 40,
      bodyFadeG: 60,
      eyes: "#003300",
      gameOverText: "#ff4444",
    },
    retro: {
      bg: "#1a0a00",
      grid: "#2a1400",
      headFill: "#ffaa00",
      headR: 80,
      headG: 40,
      headB: 0,
      bodyFadeG: 30,
      eyes: "#330000",
      gameOverText: "#ff6600",
    },
    neon: {
      bg: "#050510",
      grid: "#0a0a20",
      headFill: "#00ffcc",
      headR: 0,
      headG: 200,
      headB: 80,
      bodyFadeG: 80,
      eyes: "#001133",
      gameOverText: "#ff00ff",
    },
    forest: {
      bg: "#0d1f0d",
      grid: "#162916",
      headFill: "#7ec850",
      headR: 30,
      headG: 90,
      headB: 20,
      bodyFadeG: 50,
      eyes: "#0a1a0a",
      gameOverText: "#a0ff60",
    },
    matrix: {
      bg: "#000000",
      grid: "#001100",
      headFill: "#00ff41",
      headR: 0,
      headG: 150,
      headB: 20,
      bodyFadeG: 100,
      eyes: "#000800",
      gameOverText: "#00ff41",
    },
  };
  let activeSkin = SKINS.classic;

  window.gameSkins = Object.keys(SKINS);
  window.setSkin = (name) => {
    activeSkin = SKINS[name] ?? activeSkin;
    localStorage.setItem("snake-skin", name);
  };

  const canvas = document.getElementById("canvas");
  const ctx = canvas.getContext("2d");

  const _savedSkin = localStorage.getItem("snake-skin");
  if (_savedSkin && SKINS[_savedSkin]) activeSkin = SKINS[_savedSkin];

  const CELL = 30;
  const COLS = 20;
  const ROWS = 20;
  const TICK_BASE = 160;

  const atlas = window.SPRITE_ATLAS;
  const fruitNames = Object.keys(atlas.fruits);
  const fruitsImg = new Image();
  fruitsImg.src = "/games/snake/snake-assets/fruits.png";

  let snake, dir, nextDir, fruit, fruitType;
  let score, level, fruitsEaten, isGameOver;
  let tickAccum, lastTime;
  let gameOverFired = false;

  function randomFruitPos() {
    const occupied = new Set(snake.map((s) => `${s.r},${s.c}`));
    const free = [];
    for (let r = 0; r < ROWS; r++) {
      for (let c = 0; c < COLS; c++) {
        if (!occupied.has(`${r},${c}`)) free.push({ r, c });
      }
    }
    return free[Math.floor(Math.random() * free.length)];
  }

  function tickSpeed() {
    return Math.max(60, TICK_BASE - (level - 1) * 15);
  }

  function init() {
    snake = [
      { r: 10, c: 10 },
      { r: 10, c: 9 },
      { r: 10, c: 8 },
    ];
    dir = { r: 0, c: 1 };
    nextDir = { r: 0, c: 1 };
    score = 0;
    level = 1;
    fruitsEaten = 0;
    isGameOver = false;
    gameOverFired = false;
    tickAccum = 0;
    lastTime = null;
    fruitType = fruitNames[Math.floor(Math.random() * fruitNames.length)];
    fruit = randomFruitPos();
  }

  function move() {
    dir = { ...nextDir };
    const head = { r: snake[0].r + dir.r, c: snake[0].c + dir.c };

    if (head.r < 0 || head.r >= ROWS || head.c < 0 || head.c >= COLS) {
      isGameOver = true;
      return;
    }
    if (snake.some((s) => s.r === head.r && s.c === head.c)) {
      isGameOver = true;
      return;
    }

    snake.unshift(head);

    if (head.r === fruit.r && head.c === fruit.c) {
      score += 10;
      fruitsEaten++;
      if (fruitsEaten % 5 === 0) level++;
      fruitType = fruitNames[Math.floor(Math.random() * fruitNames.length)];
      fruit = randomFruitPos();
    } else {
      snake.pop();
    }
  }

  function drawGrid() {
    ctx.fillStyle = activeSkin.bg;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = activeSkin.grid;
    ctx.lineWidth = 1;
    for (let r = 0; r <= ROWS; r++) {
      ctx.beginPath();
      ctx.moveTo(0, r * CELL);
      ctx.lineTo(canvas.width, r * CELL);
      ctx.stroke();
    }
    for (let c = 0; c <= COLS; c++) {
      ctx.beginPath();
      ctx.moveTo(c * CELL, 0);
      ctx.lineTo(c * CELL, canvas.height);
      ctx.stroke();
    }
  }

  function drawFruit() {
    const sp = atlas.fruits[fruitType];
    ctx.drawImage(
      fruitsImg,
      sp.x,
      sp.y,
      sp.w,
      sp.h,
      fruit.c * CELL + 1,
      fruit.r * CELL + 1,
      CELL - 2,
      CELL - 2,
    );
  }

  function drawSnake() {
    snake.forEach((seg, i) => {
      const x = seg.c * CELL;
      const y = seg.r * CELL;
      if (i === 0) {
        ctx.fillStyle = activeSkin.headFill;
      } else {
        const t = i / snake.length;
        const r = activeSkin.headR;
        const g = Math.round(activeSkin.headG - t * activeSkin.bodyFadeG);
        const b = activeSkin.headB;
        ctx.fillStyle = `rgb(${r},${g},${b})`;
      }
      ctx.fillRect(x + 1, y + 1, CELL - 2, CELL - 2);

      if (i === 0) {
        ctx.fillStyle = activeSkin.eyes;
        const eyeSize = 4;
        const ex1 = dir.c === -1 ? x + 4 : dir.r !== 0 ? x + 5 : x + CELL - 10;
        const ex2 =
          dir.c === -1 ? x + 4 : dir.r !== 0 ? x + CELL - 9 : x + CELL - 10;
        const ey1 = dir.r === -1 ? y + 4 : dir.c !== 0 ? y + 5 : y + CELL - 10;
        const ey2 =
          dir.r === -1 ? y + 4 : dir.c !== 0 ? y + CELL - 9 : y + CELL - 10;
        ctx.fillRect(ex1, ey1, eyeSize, eyeSize);
        ctx.fillRect(ex2, ey2, eyeSize, eyeSize);
      }
    });
  }

  function drawGameOver() {
    ctx.fillStyle = "rgba(0,0,0,0.65)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.textAlign = "center";
    ctx.fillStyle = activeSkin.gameOverText;
    ctx.font = "bold 52px monospace";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 20);

    ctx.fillStyle = "#ffffff";
    ctx.font = "22px monospace";
    ctx.fillText(
      `Puntuación: ${score}`,
      canvas.width / 2,
      canvas.height / 2 + 30,
    );
    ctx.textAlign = "left";
  }

  function loop(ts) {
    if (window.gamePaused) {
      requestAnimationFrame(loop);
      return;
    }

    const dt = ts - (lastTime ?? ts);
    lastTime = ts;

    if (!isGameOver) {
      tickAccum += dt;
      while (tickAccum >= tickSpeed()) {
        tickAccum -= tickSpeed();
        move();
        if (isGameOver) break;
      }
    }

    drawGrid();
    drawFruit();
    drawSnake();
    if (isGameOver) drawGameOver();

    window.gameState = {
      score,
      lives: isGameOver ? 0 : 1,
      level,
      gameOver: isGameOver,
    };

    if (isGameOver && !gameOverFired) {
      gameOverFired = true;
      window.dispatchEvent(new CustomEvent("gameOver", { detail: { score } }));
    }

    requestAnimationFrame(loop);
  }

  document.addEventListener("keydown", (e) => {
    switch (e.key) {
      case "ArrowUp":
      case "w":
      case "W":
        if (dir.r !== 1) nextDir = { r: -1, c: 0 };
        e.preventDefault();
        break;
      case "ArrowDown":
      case "s":
      case "S":
        if (dir.r !== -1) nextDir = { r: 1, c: 0 };
        e.preventDefault();
        break;
      case "ArrowLeft":
      case "a":
      case "A":
        if (dir.c !== 1) nextDir = { r: 0, c: -1 };
        e.preventDefault();
        break;
      case "ArrowRight":
      case "d":
      case "D":
        if (dir.c !== -1) nextDir = { r: 0, c: 1 };
        e.preventDefault();
        break;
    }
  });

  init();
  fruitsImg.onload = () => requestAnimationFrame(loop);
})();
