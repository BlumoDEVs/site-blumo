import './style.css';

type Screen = 'menu' | 'playing' | 'over';
type Pipe = { x: number; gapY: number; gap: number; scored: boolean; kind: 'roupeiro' | 'cama' | 'placa' };
type Particle = { x: number; y: number; vx: number; vy: number; life: number; color: string; size: number };

const canvas = document.getElementById('game') as HTMLCanvasElement;
const ctx = canvas.getContext('2d') as CanvasRenderingContext2D;
const panel = document.getElementById('panel') as HTMLDivElement;
const toast = document.getElementById('toast') as HTMLDivElement;
const scoreEl = document.getElementById('score') as HTMLSpanElement;
const bestEl = document.getElementById('best') as HTMLSpanElement;

const luisPhoto = new Image();
luisPhoto.src = '/luis.jpg';

const jokes = [
  'Isto cabe no carrinho?',
  'Tem em amarelo, mas mais azul?',
  'Só vim ver!',
  'A saída é para que lado?',
  'Este roupeiro voa montado?',
  'Pausa de 5 minutos ativada!'
];

let screen: Screen = 'menu';
let score = 0;
let best = Number(localStorage.getItem('flappy-baixinho-best') ?? 0);
let last = performance.now();
let shake = 0;
let jokeTimer = 0;
let flash = 0;
const keys: Record<string, boolean> = {};
const bird = { x: 230, y: 280, vy: 0, rot: 0 };
let pipes: Pipe[] = [];
let particles: Particle[] = [];

function resize(): void {
  const dpr = Math.min(window.devicePixelRatio || 1, 2);
  canvas.width = Math.floor(1000 * dpr);
  canvas.height = Math.floor(650 * dpr);
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
}

function setPanel(html = ''): void {
  panel.innerHTML = html;
  panel.classList.toggle('hidden', html.length === 0);
}

function showMenu(): void {
  screen = 'menu';
  setPanel(`
    <p class="eyebrow">MÓVEA apresenta</p>
    <h1>FLAPPY BAIXINHO</h1>
    <p>Ajuda o Luís a voar entre roupeiros, camas e placas antes que o turno comece. Um toque = uma asa. Muitos toques = provavelmente caos.</p>
    <button id="start">COMEÇAR A VOAR</button>
    <small>Espaço / Clique / Toque para bater asas · Recorde local: ${best}</small>
  `);
  document.getElementById('start')?.addEventListener('click', reset);
}

function reset(): void {
  screen = 'playing';
  score = 0;
  shake = 0;
  flash = 0;
  jokeTimer = 1.2;
  bird.x = 230;
  bird.y = 280;
  bird.vy = -220;
  bird.rot = 0;
  pipes = [makePipe(760), makePipe(1160), makePipe(1560)];
  particles = [];
  setPanel('');
  say('Luís ganhou asas. Ninguém leu o manual.');
}

function gameOver(): void {
  if (screen !== 'playing') return;
  screen = 'over';
  best = Math.max(best, score);
  localStorage.setItem('flappy-baixinho-best', String(best));
  shake = 18;
  setPanel(`
    <p class="eyebrow">Fim do voo</p>
    <h1>O BAIXINHO BATEU NO ROUPEIRO</h1>
    <p>Luís tentou, mas o departamento de quartos tinha demasiada gravidade.</p>
    <div class="result"><b>${score}</b><span>pontos</span><b>${best}</b><span>recorde</span></div>
    <button id="again">TENTAR OUTRA VEZ</button>
  `);
  document.getElementById('again')?.addEventListener('click', reset);
}

function flap(): void {
  if (screen === 'menu' || screen === 'over') { reset(); return; }
  bird.vy = -365;
  flash = 0.12;
  for (let i = 0; i < 10; i++) particles.push({ x: bird.x - 28, y: bird.y + 8, vx: -120 - Math.random() * 120, vy: -50 + Math.random() * 100, life: 0.55, color: i % 2 ? '#ffd21f' : '#ffffff', size: 4 + Math.random() * 6 });
}

function makePipe(x: number): Pipe {
  return { x, gapY: 170 + Math.random() * 280, gap: 185 - Math.min(score, 16) * 3, scored: false, kind: ['roupeiro', 'cama', 'placa'][Math.floor(Math.random() * 3)] as Pipe['kind'] };
}

function say(message: string): void {
  toast.textContent = message;
  toast.classList.remove('hidden');
  window.setTimeout(() => toast.classList.add('hidden'), 1500);
}

function update(dt: number): void {
  if (screen !== 'playing') return;
  bird.vy += 880 * dt;
  bird.y += bird.vy * dt;
  bird.rot = Math.max(-0.45, Math.min(0.9, bird.vy / 520));
  jokeTimer -= dt;
  flash = Math.max(0, flash - dt);

  const speed = 230 + Math.min(score, 20) * 7;
  for (const pipe of pipes) {
    pipe.x -= speed * dt;
    if (!pipe.scored && pipe.x + 84 < bird.x) {
      pipe.scored = true;
      score += 1;
      say(jokes[score % jokes.length]);
      for (let i = 0; i < 14; i++) particles.push({ x: bird.x, y: bird.y, vx: -80 + Math.random() * 160, vy: -160 + Math.random() * 80, life: 0.8, color: '#2ec27e', size: 3 + Math.random() * 5 });
    }
  }
  if (pipes[0]?.x < -130) pipes.push(makePipe(pipes[pipes.length - 1].x + 390)), pipes.shift();

  for (const p of particles) { p.x += p.vx * dt; p.y += p.vy * dt; p.vy += 260 * dt; p.life -= dt; }
  particles = particles.filter(p => p.life > 0);

  if (bird.y < 38 || bird.y > 604) gameOver();
  for (const pipe of pipes) {
    const hitX = bird.x + 34 > pipe.x && bird.x - 30 < pipe.x + 92;
    const hitY = bird.y - 30 < pipe.gapY - pipe.gap / 2 || bird.y + 30 > pipe.gapY + pipe.gap / 2;
    if (hitX && hitY) gameOver();
  }
}

function draw(): void {
  ctx.save();
  if (shake > 0) { ctx.translate((Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake); shake *= 0.88; }
  drawStore();
  pipes.forEach(drawPipe);
  particles.forEach(drawParticle);
  drawLuisBird();
  drawScore();
  if (flash > 0) { ctx.fillStyle = `rgba(255,210,31,${flash})`; ctx.fillRect(0, 0, 1000, 650); }
  ctx.restore();
  scoreEl.textContent = `Pontos ${score}`;
  bestEl.textContent = `Recorde ${best}`;
}

function drawStore(): void {
  const sky = ctx.createLinearGradient(0, 0, 0, 650);
  sky.addColorStop(0, '#eef7ff'); sky.addColorStop(0.55, '#fff6c7'); sky.addColorStop(1, '#dfe9f7');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, 1000, 650);
  ctx.strokeStyle = '#ffffffaa'; ctx.lineWidth = 8;
  for (let x = -60; x < 1080; x += 180) { ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x + 120, 120); ctx.stroke(); }
  ctx.fillStyle = '#08264a'; round(34, 28, 250, 48, 14); ctx.fill();
  ctx.fillStyle = '#ffd21f'; ctx.font = '900 24px system-ui'; ctx.fillText('MÓVEA QUARTOS', 55, 60);
  ctx.fillStyle = '#ffffff88'; for (let x = 0; x < 1000; x += 90) ctx.fillRect(x, 600, 55, 10);
}

function drawPipe(pipe: Pipe): void {
  const topH = pipe.gapY - pipe.gap / 2;
  const bottomY = pipe.gapY + pipe.gap / 2;
  drawObstacle(pipe.x, -12, 92, topH + 12, pipe.kind, true);
  drawObstacle(pipe.x, bottomY, 92, 650 - bottomY + 20, pipe.kind, false);
}

function drawObstacle(x: number, y: number, w: number, h: number, kind: Pipe['kind'], top: boolean): void {
  ctx.save(); ctx.translate(x, y);
  const colors = kind === 'roupeiro' ? ['#8b5e34', '#5c3b21'] : kind === 'cama' ? ['#6fa8ff', '#0b4fb3'] : ['#ffd21f', '#e63946'];
  ctx.fillStyle = colors[0]; round(0, 0, w, h, 14); ctx.fill();
  ctx.fillStyle = colors[1]; round(-8, top ? h - 26 : 0, w + 16, 34, 10); ctx.fill();
  ctx.fillStyle = '#fff'; ctx.font = '900 17px system-ui'; ctx.textAlign = 'center';
  ctx.fillText(kind === 'roupeiro' ? '▥' : kind === 'cama' ? 'CAMA' : 'PROMO', w / 2, top ? h - 6 : 24);
  ctx.restore();
}

function drawLuisBird(): void {
  ctx.save(); ctx.translate(bird.x, bird.y); ctx.rotate(bird.rot);
  ctx.fillStyle = '#08264a33'; ctx.beginPath(); ctx.ellipse(8, 34, 42, 12, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffd21f'; ctx.beginPath(); ctx.ellipse(0, 4, 46, 34, 0, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#ffe36d'; for (let y = -15; y < 25; y += 12) ctx.fillRect(-36, y, 72, 5);
  ctx.fillStyle = '#12345a'; ctx.beginPath(); ctx.ellipse(-8, 31, 32, 12, 0.05, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#fff'; round(12, 8, 24, 15, 4); ctx.fill(); ctx.fillStyle = '#e63946'; ctx.font = '8px system-ui'; ctx.fillText('Luís', 16, 18);
  ctx.fillStyle = '#f3c394'; ctx.beginPath(); ctx.arc(18, -26, 26, 0, Math.PI * 2); ctx.fill();
  if (luisPhoto.complete && luisPhoto.naturalWidth) { ctx.save(); ctx.beginPath(); ctx.arc(18, -26, 27, 0, Math.PI * 2); ctx.clip(); ctx.drawImage(luisPhoto, -10, -58, 58, 58); ctx.restore(); }
  else { ctx.fillStyle = '#2b211f'; ctx.beginPath(); ctx.arc(15, -40, 25, 3.25, 6.15); ctx.fill(); ctx.fillRect(0, -28, 36, 11); ctx.fillStyle = '#2b211f'; ctx.fillRect(7, -31, 9, 4); ctx.fillRect(25, -31, 9, 4); ctx.fillStyle = '#fff'; ctx.fillRect(13, -17, 20, 5); }
  ctx.fillStyle = '#fff'; ctx.beginPath(); ctx.ellipse(-30, 0, 24, 13, -0.55 - Math.sin(performance.now() / 85) * 0.28, 0, Math.PI * 2); ctx.fill();
  ctx.restore();
}

function drawParticle(p: Particle): void { ctx.globalAlpha = Math.max(0, p.life); ctx.fillStyle = p.color; ctx.beginPath(); ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2); ctx.fill(); ctx.globalAlpha = 1; }
function drawScore(): void { ctx.fillStyle = '#08264a'; ctx.font = '900 76px system-ui'; ctx.textAlign = 'center'; ctx.fillText(String(score), 500, 108); ctx.textAlign = 'start'; }
function round(x: number, y: number, w: number, h: number, r: number): void { ctx.beginPath(); ctx.roundRect(x, y, w, h, r); }

function loop(now: number): void { const dt = Math.min(0.033, (now - last) / 1000); last = now; update(dt); draw(); requestAnimationFrame(loop); }

addEventListener('resize', resize);
addEventListener('keydown', (event: KeyboardEvent) => { if (event.code === 'Space' || event.key === 'ArrowUp') { event.preventDefault(); if (!keys[event.code]) flap(); } keys[event.code] = true; });
addEventListener('keyup', (event: KeyboardEvent) => { keys[event.code] = false; });
canvas.addEventListener('pointerdown', flap);

resize();
showMenu();
requestAnimationFrame(loop);
