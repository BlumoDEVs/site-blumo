const WIDTH = 390, HEIGHT = 620, LUIS_X = 84, LUIS_SIZE = 54, GRAVITY = 0.42, JUMP = -7.5, PIPE_W = 74, GAP = 170, SPEED = 2.7;
const game = document.querySelector('#game');
const luis = document.querySelector('#luis');
const pipesLayer = document.querySelector('#pipes');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const overlay = document.querySelector('#overlay');
let y = 250, velocity = 0, started = false, over = false, score = 0, raf;
let best = Number(localStorage.getItem('flappy-baixinho-best') || 0);
let pipes = freshPipes();
bestEl.textContent = `Recorde: ${best}`;
render();

function freshPipes() {
  return [0, 1, 2].map((i) => ({ x: WIDTH + i * 190, gapY: 125 + Math.random() * 250, passed: false }));
}

function flap() {
  if (over) reset();
  started = true;
  overlay.classList.add('hidden');
  velocity = JUMP;
  if (!raf) raf = requestAnimationFrame(tick);
}

function reset() {
  y = 250; velocity = 0; score = 0; over = false; pipes = freshPipes();
  scoreEl.textContent = '0'; overlay.classList.add('hidden'); render();
}

function tick() {
  velocity += GRAVITY;
  y += velocity;
  const centerY = y + LUIS_SIZE / 2;
  let hit = y < 0 || y + LUIS_SIZE > HEIGHT - 72;
  pipes = pipes.map((pipe) => {
    let next = { ...pipe, x: pipe.x - SPEED };
    if (next.x < -PIPE_W) next = { x: WIDTH + 120, gapY: 115 + Math.random() * 280, passed: false };
    const insideX = LUIS_X + LUIS_SIZE > next.x && LUIS_X < next.x + PIPE_W;
    if (insideX && (centerY < next.gapY - GAP / 2 || centerY > next.gapY + GAP / 2)) hit = true;
    if (!next.passed && next.x + PIPE_W < LUIS_X) {
      next.passed = true; score += 1; scoreEl.textContent = score;
      if (score > best) { best = score; localStorage.setItem('flappy-baixinho-best', best); bestEl.textContent = `Recorde: ${best}`; }
    }
    return next;
  });
  render();
  if (hit) return gameOver();
  raf = requestAnimationFrame(tick);
}

function gameOver() {
  over = true; started = false; cancelAnimationFrame(raf); raf = null;
  overlay.innerHTML = `<h1>Ups, baixinho!</h1><p>Pontuação: ${score}</p><span>Toca para tentar outra vez.</span>`;
  overlay.classList.remove('hidden');
}

function render() {
  luis.style.transform = `translate(${LUIS_X}px, ${y}px)`;
  pipesLayer.innerHTML = pipes.map((pipe) => {
    const topH = pipe.gapY - GAP / 2;
    const bottomY = pipe.gapY + GAP / 2;
    return `<div class="pipe top" style="left:${pipe.x}px;height:${topH}px"><b></b></div><div class="pipe bottom" style="left:${pipe.x}px;top:${bottomY}px;height:${HEIGHT - bottomY - 72}px"><b></b></div>`;
  }).join('');
}

game.addEventListener('pointerdown', flap);
window.addEventListener('keydown', (e) => { if (e.code === 'Space' || e.code === 'ArrowUp') flap(); });
