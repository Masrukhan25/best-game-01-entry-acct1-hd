// VOIDLIGHT — bullets: the player shot pool and the enemy shot pool.
// Both pools are capped arrays, updated and drawn in place, with circle hits.

import { PALETTE } from './config.js';

export function makeBulletPools() {
  return { player: [], enemy: [] };
}

export function firePlayerBullet(pools, x, y, vx, vy, damage) {
  if (pools.player.length > 160) return;
  pools.player.push({ x, y, vx, vy, damage, radius: 5, life: 1.6 });
}

export function fireEnemyBullet(pools, x, y, vx, vy, color, radius = 6) {
  if (pools.enemy.length > 320) return;
  pools.enemy.push({ x, y, vx, vy, color, radius, life: 6 });
}

export function updateBullets(pools, dt) {
  for (let i = pools.player.length - 1; i >= 0; i--) {
    const b = pools.player[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.y < -30 || b.y > 750 || b.x < -30 || b.x > 1310) pools.player.splice(i, 1);
  }
  for (let i = pools.enemy.length - 1; i >= 0; i--) {
    const b = pools.enemy[i];
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    b.life -= dt;
    if (b.life <= 0 || b.y < -30 || b.y > 750 || b.x < -30 || b.x > 1310) pools.enemy.splice(i, 1);
  }
}

export function clearEnemyBullets(pools) {
  pools.enemy.length = 0;
}

export function drawBullets(ctx, pools, glowSprites) {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  // Player shots: hot cyan-white capsules with a glow halo.
  for (const b of pools.player) {
    const s = 26;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(glowSprites[PALETTE.cyan], b.x - s / 2, b.y - s / 2, s, s);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#eafcff';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + 10);
    ctx.lineTo(b.x, b.y - 10);
    ctx.stroke();
    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(b.x, b.y + 14);
    ctx.lineTo(b.x, b.y - 14);
    ctx.stroke();
  }
  // Enemy shots: magenta-red orbs with a glow halo.
  for (const b of pools.enemy) {
    const s = b.radius * 4;
    ctx.globalAlpha = 0.95;
    ctx.drawImage(glowSprites[b.color] || glowSprites[PALETTE.magenta], b.x - s / 2, b.y - s / 2, s, s);
    ctx.globalAlpha = 1;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius * 0.45, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}
