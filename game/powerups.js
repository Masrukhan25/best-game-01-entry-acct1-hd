// VOIDLIGHT — power-up drops: what falls, how it drifts, what it does.
// Drops fall slowly, bob, and (with the tractor upgrade) fly to the player.

import { POWERUPS, VIEW_W } from './config.js';
import { pick, chance, range } from './random.js';

const DROP_TYPES = ['shield', 'rapid', 'spread', 'repair', 'bomb'];
const DROP_WEIGHTS = [0.2, 0.24, 0.24, 0.2, 0.12];

export function makePowerups() {
  return [];
}

export function rollDrop(G, x, y, guaranteed = false) {
  if (!guaranteed && !chance(G.rng, 0.12)) return;
  const r = G.rng();
  let acc = 0;
  let type = 'repair';
  for (let i = 0; i < DROP_TYPES.length; i++) {
    acc += DROP_WEIGHTS[i];
    if (r <= acc) {
      type = DROP_TYPES[i];
      break;
    }
  }
  G.powerups.push({
    type,
    x: Math.max(24, Math.min(VIEW_W - 24, x)),
    y,
    vy: 62,
    t: range(G.rng, 0, Math.PI * 2),
    life: 11,
    radius: 16,
  });
}

export function updatePowerups(G, dt) {
  const p = G.player;
  for (let i = G.powerups.length - 1; i >= 0; i--) {
    const u = G.powerups[i];
    u.t += dt;
    u.life -= dt;
    // Tractor upgrade pulls drops toward the ship.
    const dx = p.x - u.x;
    const dy = p.y - u.y;
    const d = Math.hypot(dx, dy);
    if (p.upgrades.includes('magnet') && d < 320 && d > 1) {
      u.x += (dx / d) * 340 * dt;
      u.y += (dy / d) * 340 * dt;
    } else {
      u.y += u.vy * dt;
      u.x += Math.sin(u.t * 2.2) * 18 * dt;
    }
    if (u.life <= 0 || u.y > 760) G.powerups.splice(i, 1);
  }
}

// Apply a collected power-up. Returns its display name for the floating text.
export function applyPowerup(G, type) {
  const p = G.player;
  const def = POWERUPS[type];
  switch (type) {
    case 'shield':
      p.shieldTime = 8;
      break;
    case 'rapid':
      p.rapidTime = 12;
      break;
    case 'spread':
      p.spreadTime = 12;
      break;
    case 'repair':
      p.hull = Math.min(p.maxHull, p.hull + 40);
      break;
    case 'bomb':
      G.bombBlast();
      break;
    default:
      break;
  }
  return def.name;
}

// Draw drops as glowing hex capsules with a letter glyph.
export function drawPowerups(ctx, G, glowSprites) {
  ctx.save();
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  for (const u of G.powerups) {
    const def = POWERUPS[u.type];
    const blink = u.life < 3 ? (Math.sin(u.t * 12) > 0 ? 1 : 0.35) : 1;
    ctx.globalAlpha = blink;
    const s = 52;
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(glowSprites[def.color], u.x - s / 2, u.y - s / 2, s, s);
    ctx.globalCompositeOperation = 'source-over';
    // Hex capsule.
    ctx.beginPath();
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2 - Math.PI / 2;
      const x = u.x + Math.cos(a) * 15;
      const y = u.y + Math.sin(a) * 15;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }
    ctx.closePath();
    ctx.fillStyle = 'rgba(4,4,18,0.9)';
    ctx.fill();
    ctx.strokeStyle = def.color;
    ctx.lineWidth = 2;
    ctx.shadowColor = def.color;
    ctx.shadowBlur = 10;
    ctx.stroke();
    ctx.shadowBlur = 0;
    ctx.fillStyle = def.color;
    ctx.font = '700 13px "Segoe UI", system-ui, sans-serif';
    const glyph = { shield: 'S', rapid: 'R', spread: 'W', repair: '+', bomb: 'B' }[u.type];
    ctx.fillText(glyph, u.x, u.y + 1);
  }
  ctx.restore();
}
