// VOIDLIGHT — enemies: the seven foe kinds plus the final boss.
// Each kind is a pre-rendered glowing sprite (vector shape baked to an offscreen
// canvas at boot) with its own movement behaviour, so the frame stays fast and
// every foe reads at a glance. The boss has three phases.

import { ENEMIES, BOSS, VIEW_W, VIEW_H } from './config.js';
import { range, chance } from './random.js';

// Pre-render one sprite per enemy kind: shape + glow, drawn facing down.
export function makeEnemySprites() {
  const sprites = {};
  for (const [kind, def] of Object.entries(ENEMIES)) {
    sprites[kind] = drawEnemySprite(def);
  }
  sprites.boss = drawBossSprite();
  return sprites;
}

function drawEnemySprite(def) {
  const pad = 26;
  const size = (def.radius + pad) * 2;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  const r = def.radius;
  ctx.save();
  ctx.translate(cx, cy);
  // Glow halo.
  const g = ctx.createRadialGradient(0, 0, r * 0.3, 0, 0, r + pad);
  g.addColorStop(0, hexA(def.color, 0.5));
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, r + pad, 0, Math.PI * 2);
  ctx.fill();
  // Body.
  ctx.fillStyle = '#0b0b22';
  ctx.strokeStyle = def.color;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = def.color;
  ctx.shadowBlur = 14;
  const path = enemyPath(ctx, def.kind, r);
  ctx.fill(path);
  ctx.stroke(path);
  // Core.
  ctx.fillStyle = def.color;
  ctx.beginPath();
  ctx.arc(0, 0, Math.max(3, r * 0.22), 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return c;
}

function enemyPath(ctx, kind, r) {
  const p = new Path2D();
  switch (kind) {
    case 'drifter': // Hexagonal pod.
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2 + Math.PI / 6;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      p.closePath();
      break;
    case 'weaver': // Diamond with wings.
      p.moveTo(0, r);
      p.lineTo(r * 0.7, 0);
      p.lineTo(0, -r);
      p.lineTo(-r * 0.7, 0);
      p.closePath();
      p.moveTo(-r, -r * 0.2);
      p.lineTo(-r * 1.5, r * 0.4);
      p.lineTo(-r * 0.7, r * 0.5);
      p.closePath();
      p.moveTo(r, -r * 0.2);
      p.lineTo(r * 1.5, r * 0.4);
      p.lineTo(r * 0.7, r * 0.5);
      p.closePath();
      break;
    case 'darter': // Sharp dart.
      p.moveTo(0, r * 1.2);
      p.lineTo(r * 0.8, -r * 0.5);
      p.lineTo(0, -r * 0.2);
      p.lineTo(-r * 0.8, -r * 0.5);
      p.closePath();
      break;
    case 'spitter': // Round turret with barrel.
      p.arc(0, 0, r * 0.85, 0, Math.PI * 2);
      p.moveTo(-r * 0.3, r * 0.6);
      p.lineTo(r * 0.3, r * 0.6);
      p.lineTo(r * 0.2, r * 1.2);
      p.lineTo(-r * 0.2, r * 1.2);
      p.closePath();
      break;
    case 'bulwark': // Heavy octagon with armor ring.
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        const x = Math.cos(a) * r;
        const y = Math.sin(a) * r;
        if (i === 0) p.moveTo(x, y);
        else p.lineTo(x, y);
      }
      p.closePath();
      p.moveTo(r * 0.55, 0);
      p.arc(0, 0, r * 0.55, 0, Math.PI * 2);
      break;
    case 'splitter': // Twin-lobed cell.
      p.arc(-r * 0.4, 0, r * 0.62, 0, Math.PI * 2);
      p.arc(r * 0.4, 0, r * 0.62, 0, Math.PI * 2);
      break;
    case 'stinger': // Small triangle.
      p.moveTo(0, r);
      p.lineTo(r * 0.9, -r * 0.7);
      p.lineTo(0, -r * 0.3);
      p.lineTo(-r * 0.9, -r * 0.7);
      p.closePath();
      break;
    default: // Shard: tiny diamond.
      p.moveTo(0, r);
      p.lineTo(r * 0.7, 0);
      p.lineTo(0, -r);
      p.lineTo(-r * 0.7, 0);
      p.closePath();
      break;
  }
  return p;
}

function drawBossSprite() {
  const size = 260;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  const g = ctx.createRadialGradient(0, 0, 20, 0, 0, 120);
  g.addColorStop(0, 'rgba(255,43,214,0.55)');
  g.addColorStop(0.6, 'rgba(139,92,255,0.22)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 120, 0, Math.PI * 2);
  ctx.fill();
  // Crowned hull: a wide spiked disc.
  ctx.fillStyle = '#140a2e';
  ctx.strokeStyle = '#ff2bd6';
  ctx.lineWidth = 4;
  ctx.shadowColor = '#ff2bd6';
  ctx.shadowBlur = 22;
  const p = new Path2D();
  for (let i = 0; i < 10; i++) {
    const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
    const rr = i % 2 === 0 ? 78 : 52;
    const x = Math.cos(a) * rr;
    const y = Math.sin(a) * rr;
    if (i === 0) p.moveTo(x, y);
    else p.lineTo(x, y);
  }
  p.closePath();
  ctx.fill(p);
  ctx.stroke(p);
  // Inner ring and eye.
  ctx.strokeStyle = '#ffb020';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.arc(0, 0, 38, 0, Math.PI * 2);
  ctx.stroke();
  ctx.fillStyle = '#ff3b5c';
  ctx.beginPath();
  ctx.arc(0, 6, 16, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(0, 6, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return c;
}

function hexA(hex, alpha) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// Spawn one enemy of a kind at (x, y) with wave-scaled health.
export function spawnEnemy(G, kind, x, y) {
  const def = ENEMIES[kind];
  const hpScale = 1 + (G.wave - 1) * 0.085;
  const e = {
    type: kind,
    def,
    x,
    y,
    vx: 0,
    vy: def.speed,
    hp: def.hp * hpScale,
    maxHp: def.hp * hpScale,
    radius: def.radius,
    color: def.color,
    t: 0,
    phase: G.rng() * Math.PI * 2,
    fireTimer: range(G.rng, 1.2, 2.4),
    flash: 0,
    rotation: 0,
    score: def.score,
    dead: false,
  };
  G.enemies.push(e);
  return e;
}

// Spawn a boss for the final wave.
export function spawnBoss(G) {
  const boss = {
    type: 'boss',
    def: BOSS,
    x: VIEW_W / 2,
    y: -90,
    vx: 0,
    vy: 55,
    hp: BOSS.hp,
    maxHp: BOSS.hp,
    radius: BOSS.radius,
    color: BOSS.color,
    t: 0,
    phase: 1,
    fireTimer: 2.0,
    spiralAngle: 0,
    minionTimer: 6,
    flash: 0,
    rotation: 0,
    score: BOSS.score,
    dead: false,
    entered: false,
  };
  G.boss = boss;
  return boss;
}

// One enemy's movement for this frame. Returns nothing; mutates e.
export function updateEnemy(G, e, dt) {
  e.t += dt;
  if (e.flash > 0) e.flash -= dt;
  const px = G.player.x;
  const py = G.player.y;
  switch (e.type) {
    case 'drifter':
      e.y += e.vy * dt;
      e.x += Math.sin(e.t * 1.4 + e.phase) * 26 * dt;
      e.rotation = Math.sin(e.t * 1.4 + e.phase) * 0.25;
      break;
    case 'weaver':
      e.y += e.vy * dt;
      e.x += Math.sin(e.t * 2.6 + e.phase) * 130 * dt;
      e.rotation = Math.cos(e.t * 2.6 + e.phase) * 0.4;
      break;
    case 'darter': {
      // Dive at the player once close enough.
      const dx = px - e.x;
      const dy = py - e.y;
      const d = Math.hypot(dx, dy) || 1;
      if (e.y > 120 && d < 420) {
        e.vx += (dx / d) * 900 * dt;
        e.vy += (dy / d) * 900 * dt;
        const sp = Math.hypot(e.vx, e.vy);
        const max = 340;
        if (sp > max) {
          e.vx = (e.vx / sp) * max;
          e.vy = (e.vy / sp) * max;
        }
      } else {
        e.vy = e.def.speed;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.rotation = Math.atan2(e.vy, e.vx) - Math.PI / 2;
      break;
    }
    case 'spitter':
      e.y += e.vy * dt;
      if (e.y > 170) e.vy = 0;
      e.x += Math.sin(e.t * 0.9 + e.phase) * 40 * dt;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && e.y > 40 && e.y < 420) {
        e.fireTimer = range(G.rng, 2.0, 2.8);
        const dx = px - e.x;
        const dy = py - e.y;
        const d = Math.hypot(dx, dy) || 1;
        const sp = 260;
        G.fireEnemy(e.x, e.y + e.radius, (dx / d) * sp, (dy / d) * sp, '#3dff9e');
      }
      break;
    case 'bulwark':
      e.y += e.vy * dt;
      if (e.y > 130) e.vy = 0;
      e.fireTimer -= dt;
      if (e.fireTimer <= 0 && e.y > 40) {
        e.fireTimer = range(G.rng, 2.6, 3.4);
        for (const a of [-0.35, 0, 0.35]) {
          G.fireEnemy(e.x, e.y + e.radius, Math.sin(a) * 240, Math.cos(a) * 240, '#ff3b5c');
        }
      }
      break;
    case 'splitter':
      e.y += e.vy * dt;
      e.x += Math.sin(e.t * 1.8 + e.phase) * 60 * dt;
      e.rotation = Math.sin(e.t * 1.8 + e.phase) * 0.3;
      break;
    case 'stinger': {
      const dx = px - e.x;
      const dy = py - e.y;
      const d = Math.hypot(dx, dy) || 1;
      e.vx += (dx / d) * 420 * dt;
      e.vy += (dy / d) * 420 * dt;
      const sp = Math.hypot(e.vx, e.vy);
      const max = 300;
      if (sp > max) {
        e.vx = (e.vx / sp) * max;
        e.vy = (e.vy / sp) * max;
      }
      e.x += e.vx * dt;
      e.y += e.vy * dt;
      e.rotation = Math.atan2(e.vy, e.vx) - Math.PI / 2;
      break;
    }
    default: // shard
      e.y += e.vy * dt;
      e.x += e.vx * dt;
      e.rotation += dt * 4;
      break;
  }
  // Keep inside the arena horizontally.
  if (e.x < e.radius) e.x = e.radius;
  if (e.x > VIEW_W - e.radius) e.x = VIEW_W - e.radius;
}

// Boss movement and attacks. Phases: 1 radial bursts, 2 spiral + minions, 3 fast spiral + dives.
export function updateBoss(G, boss, dt) {
  boss.t += dt;
  if (boss.flash > 0) boss.flash -= dt;
  const frac = boss.hp / boss.maxHp;
  boss.phase = frac > 0.66 ? 1 : frac > 0.33 ? 2 : 3;
  if (!boss.entered) {
    boss.y += boss.vy * dt;
    if (boss.y >= 130) {
      boss.y = 130;
      boss.entered = true;
    }
    return;
  }
  // Drift side to side, faster in later phases.
  const speed = 70 + boss.phase * 30;
  boss.x += Math.sin(boss.t * 0.7) * speed * dt;
  boss.x = Math.max(90, Math.min(VIEW_W - 90, boss.x));
  boss.fireTimer -= dt;
  if (boss.fireTimer <= 0) {
    boss.fireTimer = boss.phase === 3 ? 0.9 : boss.phase === 2 ? 1.25 : 1.7;
    if (boss.phase === 1) {
      // Radial burst of 12.
      for (let i = 0; i < 12; i++) {
        const a = (i / 12) * Math.PI * 2 + boss.t;
        G.fireEnemy(boss.x, boss.y, Math.cos(a) * 210, Math.sin(a) * 210, '#ff2bd6', 7);
      }
    } else {
      // Aimed 5-spread at the player.
      const dx = G.player.x - boss.x;
      const dy = G.player.y - boss.y;
      const base = Math.atan2(dy, dx);
      for (const off of [-0.4, -0.2, 0, 0.2, 0.4]) {
        G.fireEnemy(boss.x, boss.y + 30, Math.cos(base + off) * 300, Math.sin(base + off) * 300, '#ffb020', 7);
      }
    }
  }
  // Spiral stream in phases 2 and 3.
  if (boss.phase >= 2) {
    boss.spiralAngle += dt * (boss.phase === 3 ? 5.4 : 3.6);
    for (let k = 0; k < 2; k++) {
      const a = boss.spiralAngle + k * Math.PI;
      G.fireEnemy(boss.x, boss.y, Math.cos(a) * 190, Math.sin(a) * 190, '#8b5cff', 6);
    }
  }
  // Minion spawns in phases 2 and 3.
  boss.minionTimer -= dt;
  if (boss.minionTimer <= 0 && boss.phase >= 2) {
    boss.minionTimer = boss.phase === 3 ? 4.5 : 7;
    for (const side of [-1, 1]) {
      spawnEnemy(G, 'stinger', boss.x + side * 90, boss.y + 40);
    }
  }
  // Phase 3: occasional dive toward the player.
  if (boss.phase === 3 && chance(G.rng, dt * 0.12)) {
    boss.vy = 260;
  }
  if (boss.vy > 55) {
    boss.y += boss.vy * dt;
    boss.vy -= 320 * dt;
    if (boss.y > 300) boss.vy = -220;
    if (boss.y < 110) {
      boss.y = 110;
      boss.vy = 55;
    }
  }
}

// Draw one enemy from its pre-rendered sprite; flash white while hit.
export function drawEnemy(ctx, e, sprites) {
  const sprite = sprites[e.type];
  const size = sprite.width;
  ctx.save();
  ctx.translate(e.x, e.y);
  ctx.rotate(e.rotation);
  ctx.drawImage(sprite, -size / 2, -size / 2);
  if (e.flash > 0) {
    ctx.globalAlpha = Math.min(1, e.flash * 6);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(sprite, -size / 2, -size / 2);
  }
  ctx.restore();
  // Health bar for tough foes.
  if (e.maxHp >= 100 && e.hp < e.maxHp) {
    const w = e.radius * 2;
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w, 5);
    ctx.fillStyle = '#ff3b5c';
    ctx.fillRect(e.x - w / 2, e.y - e.radius - 12, w * Math.max(0, e.hp / e.maxHp), 5);
  }
}

export function drawBoss(ctx, boss, sprites) {
  const sprite = sprites.boss;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(Math.sin(boss.t * 0.8) * 0.08);
  ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  if (boss.flash > 0) {
    ctx.globalAlpha = Math.min(1, boss.flash * 6);
    ctx.globalCompositeOperation = 'lighter';
    ctx.drawImage(sprite, -sprite.width / 2, -sprite.height / 2);
  }
  ctx.restore();
}
