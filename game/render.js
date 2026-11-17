// VOIDLIGHT — world rendering: background, player ship, enemies, bullets,
// power-ups and particles, in that order, with the screen shake applied.
// Menus and the HUD live in ui.js; this file draws the world itself.

import { VIEW_W, VIEW_H, PALETTE } from './config.js';
import { drawBackground, drawParticles } from './particles.js';
import { drawBullets } from './bullets.js';
import { drawEnemy, drawBoss } from './enemies.js';
import { drawPowerups } from './powerups.js';
import { drawHud, drawTitle, drawHowTo, drawPaused, drawUpgrade, drawGameOver, drawVictory } from './ui.js';

export function drawGame(G) {
  const ctx = G.ctx;
  ctx.save();
  ctx.clearRect(0, 0, VIEW_W, VIEW_H);
  // Screen shake: translate the whole world a few pixels.
  if (G.shakeX !== 0 || G.shakeY !== 0) ctx.translate(G.shakeX, G.shakeY);
  drawBackground(ctx, G.nebula, G.stars, G.rng, G.time, 1 / 60);
  drawPowerups(ctx, G, G.glowSprites);
  for (const e of G.enemies) drawEnemy(ctx, e, G.enemySprites);
  if (G.boss) drawBoss(ctx, G.boss, G.enemySprites);
  drawBullets(ctx, G.bullets, G.glowSprites);
  drawPlayer(ctx, G);
  drawParticles(ctx, G.particles, G.glowSprites);
  ctx.restore();

  // Full-screen flashes (damage vignette, muzzle flash).
  if (G.flashRed > 0) {
    ctx.save();
    ctx.globalAlpha = Math.min(0.35, G.flashRed);
    const g = ctx.createRadialGradient(640, 360, 240, 640, 360, 720);
    g.addColorStop(0, 'rgba(255,0,0,0)');
    g.addColorStop(1, 'rgba(255,40,60,0.8)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }
  if (G.flashWhite > 0) {
    ctx.save();
    ctx.globalAlpha = G.flashWhite * 2;
    ctx.fillStyle = '#bfefff';
    ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    ctx.restore();
  }

  // Screens and HUD on top.
  if (G.mode === 'title') drawTitle(ctx, G);
  else if (G.mode === 'howto') drawHowTo(ctx, G);
  else if (G.mode === 'paused') drawPaused(ctx, G);
  else if (G.mode === 'upgrade') drawUpgrade(ctx, G);
  else if (G.mode === 'gameover') drawGameOver(ctx, G);
  else if (G.mode === 'victory') drawVictory(ctx, G);
  if (G.mode === 'playing' || G.mode === 'paused' || G.mode === 'upgrade') drawHud(ctx, G);
}

// The player ship: pre-rendered sprite rotated to the aim angle, with a
// shield ring while the Aegis shield runs and a blink while invulnerable.
export function drawPlayer(ctx, G) {
  const p = G.player;
  if (!p.alive) return;
  if (p.invuln > 0 && Math.floor(G.time * 14) % 2 === 0) return; // blink
  ctx.save();
  ctx.translate(p.x, p.y);
  ctx.rotate(p.angle + Math.PI / 2);
  ctx.drawImage(G.playerSprite, -48, -48);
  ctx.restore();
  if (p.shieldTime > 0) {
    ctx.save();
    ctx.globalAlpha = 0.55 + 0.25 * Math.sin(G.time * 8);
    ctx.strokeStyle = PALETTE.cyan;
    ctx.lineWidth = 3;
    ctx.shadowColor = PALETTE.cyan;
    ctx.shadowBlur = 16;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 30, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }
  // Muzzle flash: a hot dot at the nose while firing.
  if (G.input.firing && p.alive) {
    ctx.save();
    ctx.globalCompositeOperation = 'lighter';
    const mx = p.x + Math.cos(p.angle) * 24;
    const my = p.y + Math.sin(p.angle) * 24;
    ctx.globalAlpha = 0.9;
    ctx.drawImage(G.glowSprites['#ffffff'], mx - 14, my - 14, 28, 28);
    ctx.restore();
  }
}
