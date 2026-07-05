const WIDTH = 390;
const HEIGHT = 620;
const GROUND_HEIGHT = 112;
const LUIS = { x: 78, width: 54, height: 42 };
const GRAVITY = 0.43;
const FLAP_STRENGTH = -7.6;
const PIPE_WIDTH = 72;
const PIPE_GAP = 152;
const PIPE_SPACING = 196;
const SPEED = 2.35;

const game = document.querySelector('#game');
const luis = document.querySelector('#luis');
const pipesLayer = document.querySelector('#pipes');
const scoreEl = document.querySelector('#score');
const bestEl = document.querySelector('#best');
const overlay = document.querySelector('#overlay');

let y = 244;
let velocity = 0;
let started = false;
let gameHasEnded = false;
let score = 0;
let raf;
let best = Number(localStorage.getItem('flappy-baixinho-best') || 0);
let pipes = createPipes();

bestEl.textContent = `BEST ${best}`;
render();

function createPipes() {
  return [0, 1, 2].map((index) => ({
    x: WIDTH + 92 + index * PIPE_SPACING,
    gapY: randomGap(),
    passed: false,
  }));
}

function randomGap() {
  const min = 130;
  const max = HEIGHT - GROUND_HEIGHT - 130;
  return min + Math.random() * (max - min);
}

function flap() {
  if (gameHasEnded) reset();

  started = true;
  overlay.classList.add('hidden');
  velocity = FLAP_STRENGTH;

  if (!raf) raf = requestAnimationFrame(tick);
}

function reset() {
  y = 244;
  velocity = 0;
  score = 0;
  pipes = createPipes();
  gameHasEnded = false;
  scoreEl.textContent = '0';
  render();
}

function tick() {
  velocity += GRAVITY;
  y += velocity;

  const luisBox = {
    left: LUIS.x + 7,
    right: LUIS.x + LUIS.width - 5,
    top: y + 5,
    bottom: y + LUIS.height - 3,
  };

  let collision = y < -12 || y + LUIS.height > HEIGHT - GROUND_HEIGHT;

  pipes = pipes.map((pipe) => {
    let next = { ...pipe, x: pipe.x - SPEED };

    if (next.x < -PIPE_WIDTH - 20) {
      const farthestX = Math.max(...pipes.map((item) => item.x));
      next = {
        x: farthestX + PIPE_SPACING,
        gapY: randomGap(),
        passed: false,
      };
    }

    const pipeLeft = next.x;
    const pipeRight = next.x + PIPE_WIDTH;
    const topPipeBottom = next.gapY - PIPE_GAP / 2;
    const bottomPipeTop = next.gapY + PIPE_GAP / 2;
    const overlapsX = luisBox.right > pipeLeft && luisBox.left < pipeRight;
    const outsideGap = luisBox.top < topPipeBottom || luisBox.bottom > bottomPipeTop;

    if (overlapsX && outsideGap) collision = true;

    if (!next.passed && pipeRight < LUIS.x) {
      next.passed = true;
      score += 1;
      scoreEl.textContent = score;
      saveBestScore();
    }

    return next;
  });

  render();

  if (collision) return endGame();
  raf = requestAnimationFrame(tick);
}

function saveBestScore() {
  if (score <= best) return;

  best = score;
  localStorage.setItem('flappy-baixinho-best', best);
  bestEl.textContent = `BEST ${best}`;
}

function endGame() {
  gameHasEnded = true;
  started = false;
  cancelAnimationFrame(raf);
  raf = undefined;
  overlay.innerHTML = `
    <h1>GAME OVER</h1>
    <p>SCORE ${score}</p>
    <span>TAP TO RESTART</span>
  `;
  overlay.classList.remove('hidden');
}

function render() {
  const rotation = Math.max(-25, Math.min(75, velocity * 5));
  luis.style.transform = `translate(${LUIS.x}px, ${y}px) rotate(${rotation}deg)`;
  pipesLayer.innerHTML = pipes.map(pipeTemplate).join('');
}

function pipeTemplate(pipe) {
  const topHeight = pipe.gapY - PIPE_GAP / 2;
  const bottomTop = pipe.gapY + PIPE_GAP / 2;
  const bottomHeight = HEIGHT - GROUND_HEIGHT - bottomTop;

  return `
    <div class="pipe pipe-top" style="left:${pipe.x}px;height:${topHeight}px"><span></span></div>
    <div class="pipe pipe-bottom" style="left:${pipe.x}px;top:${bottomTop}px;height:${bottomHeight}px"><span></span></div>
  `;
}

game.addEventListener('pointerdown', flap);
window.addEventListener('keydown', (event) => {
  if (event.code === 'Space' || event.code === 'ArrowUp') flap();
});
