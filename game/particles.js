// VOIDLIGHT — particles, floating combat text, shockwave rings, and the
// parallax space background (pre-rendered nebula + three star layers + a ringed
// planet). Everything here is visual only: it never changes the game state.

import { VIEW_W, VIEW_H, PALETTE } from './config.js';
import { range } from './random.js';

// Pre-rendered soft glow dot in one colour, reused for particles and bullets.
export function makeGlowSprite(color, size = 64) {
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2);
  g.addColorStop(0, '#ffffff');
  g.addColorStop(0.25, color);
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, size, size);
  return c;
}

// The nebula: soft coloured clouds baked once to an offscreen canvas.
export function makeNebula(rng) {
  const c = document.createElement('canvas');
  c.width = VIEW_W;
  c.height = VIEW_H;
  const ctx = c.getContext('2d');
  ctx.fillStyle = PALETTE.space0;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.globalCompositeOperation = 'lighter';
  const blobs = [
    { color: PALETTE.nebulaViolet, n: 7, a: 0.16, rMin: 130, rMax: 320 },
    { color: PALETTE.nebulaMagenta, n: 5, a: 0.12, rMin: 100, rMax: 260 },
    { color: PALETTE.nebulaCyan, n: 5, a: 0.11, rMin: 110, rMax: 280 },
  ];
  for (const b of blobs) {
    for (let i = 0; i < b.n; i++) {
      const x = range(rng, -80, VIEW_W + 80);
      const y = range(rng, -80, VIEW_H + 80);
      const r = range(rng, b.rMin, b.rMax);
      const g = ctx.createRadialGradient(x, y, 0, x, y, r);
      g.addColorStop(0, hexA(b.color, b.a));
      g.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  ctx.globalCompositeOperation = 'source-over';
  return c;
}

function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Three star layers for parallax. Stars drift down slowly and wrap.
export function makeStars(rng) {
  const layers = [];
  const counts = [90, 60, 34];
  const speeds = [9, 20, 42];
  const sizes = [1.1, 1.7, 2.6];
  for (let l = 0; l < 3; l++) {
    const stars = [];
    for (let i = 0; i < counts[l]; i++) {
      stars.push({
        x: range(rng, 0, VIEW_W),
        y: range(rng, 0, VIEW_H),
        tw: range(rng, 0, Math.PI * 2),
        twSpeed: range(rng, 0.6, 2.4),
      });
    }
    layers.push({ stars, speed: speeds[l], size: sizes[l] });
  }
  return layers;
}

export function drawBackground(ctx, nebula, layers, rng, t, dt) {
  ctx.drawImage(nebula, 0, 0);
  // Ringed planet, low and to the right, drawn under the stars.
  ctx.save();
  ctx.globalAlpha = 0.9;
  const px = 1060;
  const py = 600;
  const pr = 74;
  const g = ctx.createRadialGradient(px - 22, py - 26, 8, px, py, pr);
  g.addColorStop(0, '#3a2a7a');
  g.addColorStop(0.55, '#241b52');
  g.addColorStop(1, '#0d0a26');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(px, py, pr, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = 'rgba(46,230,255,0.35)';
  ctx.lineWidth = 5;
  ctx.beginPath();
  ctx.ellipse(px, py, pr + 42, 15, -0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.strokeStyle = 'rgba(255,43,214,0.22)';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.ellipse(px, py, pr + 56, 20, -0.42, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();
  // Stars, twinkling.
  for (const layer of layers) {
    for (const s of layer.stars) {
      s.y += layer.speed * dt;
      if (s.y > VIEW_H + 4) {
        s.y = -4;
        s.x = range(rng, 0, VIEW_W);
      }
      s.tw += s.twSpeed * dt;
      const a = 0.45 + 0.4 * Math.sin(s.tw);
      ctx.globalAlpha = a;
      ctx.fillStyle = '#dfeaff';
      ctx.fillRect(s.x, s.y, layer.size, layer.size);
    }
  }
  ctx.globalAlpha = 1;
}

// Particle pool: sparks, debris and engine glow. Additive, fast, capped.
export function makeParticles() {
  return { list: [], texts: [], rings: [] };
}

export function spawnExplosion(p, rng, x, y, color, count, speed) {
  for (let i = 0; i < count; i++) {
    if (p.list.length > 420) return;
    const a = rng() * Math.PI * 2;
    const v = speed * (0.25 + rng() * 0.75);
    p.list.push({
      x, y,
      vx: Math.cos(a) * v,
      vy: Math.sin(a) * v,
      life: 0.45 + rng() * 0.55,
      maxLife: 1,
      size: 2 + rng() * 5,
      color,
      drag: 2.2,
    });
    p.list[p.list.length - 1].maxLife = p.list[p.list.length - 1].life;
  }
}

export function spawnTrail(p, rng, x, y, color) {
  if (p.list.length > 420) return;
  p.list.push({
    x: x + (rng() - 0.5) * 6,
    y: y + (rng() - 0.5) * 6,
    vx: (rng() - 0.5) * 30,
    vy: 60 + rng() * 60,
    life: 0.35,
    maxLife: 0.35,
    size: 2.5 + rng() * 2.5,
    color,
    drag: 0.5,
  });
}

export function spawnText(p, x, y, str, color, big = false) {
  if (p.texts.length > 24) p.texts.shift();
  p.texts.push({ x, y, str, color, life: 0.9, maxLife: 0.9, big });
}

export function spawnRing(p, x, y, color, maxR = 160) {
  p.rings.push({ x, y, color, r: 8, maxR, life: 0.5, maxLife: 0.5 });
}

export function updateParticles(p, dt) {
  for (let i = p.list.length - 1; i >= 0; i--) {
    const q = p.list[i];
    q.life -= dt;
    if (q.life <= 0) {
      p.list.splice(i, 1);
      continue;
    }
    const d = 1 - q.drag * dt;
    q.vx *= d;
    q.vy *= d;
    q.x += q.vx * dt;
    q.y += q.vy * dt;
  }
  for (let i = p.texts.length - 1; i >= 0; i--) {
    const t = p.texts[i];
    t.life -= dt;
    t.y -= 46 * dt;
    if (t.life <= 0) p.texts.splice(i, 1);
  }
  for (let i = p.rings.length - 1; i >= 0; i--) {
    const r = p.rings[i];
    r.life -= dt;
    r.r += (r.maxR - r.r) * dt * 7;
    if (r.life <= 0) p.rings.splice(i, 1);
  }
}

export function drawParticles(ctx, p, glowSprites) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (const q of p.list) {
    const a = Math.max(0, q.life / q.maxLife);
    const sprite = glowSprites[q.color] || glowSprites['#ffffff'];
    const s = q.size * 4 * (0.5 + a * 0.5);
    ctx.globalAlpha = a;
    ctx.drawImage(sprite, q.x - s / 2, q.y - s / 2, s, s);
  }
  for (const r of p.rings) {
    const a = Math.max(0, r.life / r.maxLife);
    ctx.globalAlpha = a * 0.8;
    ctx.strokeStyle = r.color;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(r.x, r.y, r.r, 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
  ctx.save();
  ctx.textAlign = 'center';
  for (const t of p.texts) {
    const a = Math.max(0, t.life / t.maxLife);
    ctx.globalAlpha = a;
    ctx.font = t.big ? '700 22px "Segoe UI", system-ui, sans-serif' : '700 15px "Segoe UI", system-ui, sans-serif';
    ctx.fillStyle = t.color;
    ctx.fillText(t.str, t.x, t.y);
  }
  ctx.restore();
}
