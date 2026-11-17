// VOIDLIGHT — HUD and screens: every menu the player sees, drawn on the
// canvas so the screenshots show the whole game. One font stack everywhere,
// big readable type, generous spacing, no clipped text at 1280x720.

import { VIEW_W, VIEW_H, TOTAL_WAVES, PALETTE, PLAYER } from './config.js';

const FONT = '"Segoe UI", system-ui, -apple-system, sans-serif';
const TITLE_FONT = '"Segoe UI", system-ui, sans-serif';

function text(ctx, str, x, y, size, color, weight = 700, align = 'center') {
  ctx.font = `${weight} ${size}px ${TITLE_FONT}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(str, x, y);
}

function glowText(ctx, str, x, y, size, color, glow, weight = 800) {
  ctx.save();
  ctx.shadowColor = glow;
  ctx.shadowBlur = 22;
  text(ctx, str, x, y, size, color, weight);
  ctx.restore();
}

function panel(ctx, x, y, w, h, alpha = 0.72) {
  ctx.save();
  ctx.fillStyle = `rgba(6,8,28,${alpha})`;
  ctx.strokeStyle = 'rgba(46,230,255,0.35)';
  ctx.lineWidth = 1.5;
  roundRect(ctx, x, y, w, h, 14);
  ctx.fill();
  ctx.stroke();
  ctx.restore();
}

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function bar(ctx, x, y, w, h, frac, color, bg = 'rgba(255,255,255,0.14)') {
  ctx.fillStyle = bg;
  ctx.fillRect(x, y, w, h);
  ctx.fillStyle = color;
  ctx.fillRect(x, y, w * Math.max(0, Math.min(1, frac)), h);
}

function formatTime(seconds) {
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${String(s).padStart(2, '0')}`;
}

// --- HUD --------------------------------------------------------------------
export function drawHud(ctx, G) {
  const p = G.player;
  // Top-left: score and combo.
  ctx.textAlign = 'left';
  text(ctx, `SCORE ${G.score.toLocaleString('en-US')}`, 24, 30, 24, PALETTE.white, 800, 'left');
  if (G.combo > 1) {
    text(ctx, `COMBO x${G.combo}`, 24, 58, 17, PALETTE.gold, 800, 'left');
  } else {
    text(ctx, `BEST ${G.best.toLocaleString('en-US')}`, 24, 58, 15, 'rgba(244,248,255,0.6)', 600, 'left');
  }
  // Top-centre: wave and progress.
  text(ctx, `WAVE ${Math.min(G.wave, TOTAL_WAVES)} / ${TOTAL_WAVES}`, 640, 30, 22, PALETTE.cyan, 800);
  if (G.director.spawnedAll && G.mode === 'playing') {
    const left = G.enemies.length + (G.boss ? 1 : 0);
    text(ctx, left === 0 ? 'WAVE CLEAR' : `${left} HOSTILE${left === 1 ? '' : 'S'} LEFT`, 640, 56, 14, 'rgba(244,248,255,0.75)', 600);
  }
  // Top-right: lives and hull.
  const hullFrac = p.maxHull > 0 ? p.hull / p.maxHull : 0;
  const hullColor = hullFrac > 0.5 ? PALETTE.green : hullFrac > 0.25 ? PALETTE.orange : PALETTE.red;
  text(ctx, 'HULL', 1060, 30, 15, 'rgba(244,248,255,0.8)', 700, 'left');
  bar(ctx, 1060, 42, 196, 12, hullFrac, hullColor);
  text(ctx, `${Math.ceil(p.hull)} / ${p.maxHull}`, 1060, 68, 13, 'rgba(244,248,255,0.7)', 600, 'left');
  // Lives as small ships.
  for (let i = 0; i < PLAYER.lives; i++) {
    const x = 1072 + i * 26;
    const y = 92;
    ctx.save();
    ctx.translate(x, y);
    ctx.fillStyle = i < p.lives ? PALETTE.cyan : 'rgba(255,255,255,0.18)';
    ctx.beginPath();
    ctx.moveTo(0, -8);
    ctx.lineTo(6, 7);
    ctx.lineTo(0, 3);
    ctx.lineTo(-6, 7);
    ctx.closePath();
    ctx.fill();
    ctx.restore();
  }
  text(ctx, 'LIVES', 1150, 92, 13, 'rgba(244,248,255,0.7)', 600, 'left');
  // Active timers, bottom-left.
  let ty = 690;
  ctx.textAlign = 'left';
  if (p.shieldTime > 0) {
    text(ctx, `AEGIS ${Math.ceil(p.shieldTime)}s`, 24, ty, 15, PALETTE.cyan, 700, 'left');
    ty -= 22;
  }
  if (p.rapidTime > 0) {
    text(ctx, `RAPID ${Math.ceil(p.rapidTime)}s`, 24, ty, 15, PALETTE.orange, 700, 'left');
    ty -= 22;
  }
  if (p.spreadTime > 0) {
    text(ctx, `SPREAD ${Math.ceil(p.spreadTime)}s`, 24, ty, 15, PALETTE.magenta, 700, 'left');
    ty -= 22;
  }
  if (p.upgrades.length > 0) {
    text(ctx, `UPGRADES: ${p.upgrades.length}`, 24, ty, 13, 'rgba(244,248,255,0.55)', 600, 'left');
  }
  // Boss health bar.
  if (G.boss) {
    const b = G.boss;
    const frac = Math.max(0, b.hp / b.maxHp);
    panel(ctx, 340, 76, 600, 34, 0.6);
    text(ctx, 'VOID SOVEREIGN', 640, 88, 14, PALETTE.magenta, 800);
    bar(ctx, 356, 100, 568, 8, frac, PALETTE.magenta);
    text(ctx, `PHASE ${b.phase}`, 640, 122, 12, 'rgba(244,248,255,0.7)', 600);
  }
  // Wave banner.
  if (G.waveBannerTime > 0 && G.waveBanner) {
    const a = Math.min(1, G.waveBannerTime / 0.6);
    ctx.save();
    ctx.globalAlpha = a;
    glowText(ctx, G.waveBanner, 640, 250, 44, PALETTE.white, PALETTE.cyan, 800);
    ctx.restore();
  }
}

// --- Title ------------------------------------------------------------------
export function drawTitle(ctx, G) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,3,12,0.45)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  glowText(ctx, 'VOIDLIGHT', 640, 218, 96, '#ffffff', PALETTE.cyan, 900);
  text(ctx, 'DEFEND THE LAST LIGHT OF THE VOID', 640, 292, 22, PALETTE.cyan, 700);
  text(ctx, '18 waves  ·  7 foe kinds  ·  1 sovereign  ·  5 power-ups', 640, 326, 16, 'rgba(244,248,255,0.85)', 600);
  const pulse = 0.65 + 0.35 * Math.sin(G.time * 3.2);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'CLICK OR PRESS ENTER TO LAUNCH', 640, 420, 24, PALETTE.gold, 800);
  ctx.restore();
  text(ctx, 'WASD / ARROWS move  ·  MOUSE aim  ·  HOLD CLICK or SPACE to fire  ·  P pause  ·  H how to play  ·  M mute', 640, 478, 15, 'rgba(244,248,255,0.75)', 600);
  if (G.best > 0) text(ctx, `BEST SCORE  ${G.best.toLocaleString('en-US')}`, 640, 516, 17, PALETTE.gold, 700);
  text(ctx, 'A NEON ARENA SURVIVAL — EVERY SHOT IS YOURS, NO NETWORK, NO ADS', 640, 664, 13, 'rgba(244,248,255,0.45)', 600);
}

// --- How to play --------------------------------------------------------------
export function drawHowTo(ctx, G) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,3,12,0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  panel(ctx, 290, 84, 700, 552, 0.85);
  glowText(ctx, 'HOW TO PLAY', 640, 128, 40, '#ffffff', PALETTE.cyan, 800);
  const rows = [
    ['MOVE', 'WASD or arrow keys — your ship answers at once.'],
    ['AIM + FIRE', 'Mouse aims. Hold left click or SPACE to fire.'],
    ['GOAL', 'Clear all 18 waves. The final wave holds the VOID SOVEREIGN.'],
    ['FOES', 'Drifter, Weaver, Darter, Spitter, Bulwark, Splitter, Stinger.'],
    ['POWER-UPS', 'S shield · R rapid fire · W spread · + repair · B nova bomb.'],
    ['COMBO', 'Kills within 3 seconds raise your combo up to x8 score.'],
    ['UPGRADES', 'After waves 3, 6, 9, 12 and 15, pick 1 of 3 upgrades.'],
    ['LIVES', '3 ships. Hull 0 loses one. Lose them all and the signal dies.'],
    ['PAUSE', 'P or ESC pauses. M mutes the music and sound.'],
  ];
  let y = 176;
  for (const [k, v] of rows) {
    text(ctx, k, 330, y, 16, PALETTE.cyan, 800, 'left');
    text(ctx, v, 470, y, 16, PALETTE.white, 600, 'left');
    y += 40;
  }
  const pulse = 0.65 + 0.35 * Math.sin(G.time * 3.2);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS ENTER OR CLICK TO GO BACK', 640, 596, 18, PALETTE.gold, 800);
  ctx.restore();
}

// --- Pause --------------------------------------------------------------------
export function drawPaused(ctx, G) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,3,12,0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  glowText(ctx, 'PAUSED', 640, 300, 64, '#ffffff', PALETTE.cyan, 900);
  text(ctx, 'The void waits. Press P or ENTER to resume.', 640, 372, 18, 'rgba(244,248,255,0.85)', 600);
  text(ctx, `SCORE ${G.score.toLocaleString('en-US')}   ·   WAVE ${G.wave} / ${TOTAL_WAVES}   ·   KILLS ${G.kills}`, 640, 412, 16, PALETTE.gold, 700);
}

// --- Upgrade ------------------------------------------------------------------
export function drawUpgrade(ctx, G) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,3,12,0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  glowText(ctx, `WAVE ${G.wave - 1} CLEAR — CHOOSE AN UPGRADE`, 640, 130, 34, '#ffffff', PALETTE.gold, 800);
  text(ctx, 'Press 1, 2 or 3 — or click a card. The next wave starts after you choose.', 640, 176, 16, 'rgba(244,248,255,0.85)', 600);
  G.upgradeRects = [];
  const w = 300;
  const h = 260;
  const gap = 30;
  const totalW = w * 3 + gap * 2;
  let x = (VIEW_W - totalW) / 2;
  const y = 240;
  G.upgradeChoices.forEach((choice, i) => {
    panel(ctx, x, y, w, h, 0.88);
    text(ctx, `[ ${i + 1} ]`, 640 - totalW / 2 + w / 2 + i * (w + gap), y + 34, 16, PALETTE.cyan, 800);
    text(ctx, choice.icon, x + w / 2, y + 92, 40, PALETTE.magenta, 900);
    text(ctx, choice.name, x + w / 2, y + 150, 21, PALETTE.white, 800);
    text(ctx, choice.desc, x + w / 2, y + 190, 15, 'rgba(244,248,255,0.8)', 600);
    G.upgradeRects.push({ x, y, w, h });
    x += w + gap;
  });
  text(ctx, `SCORE ${G.score.toLocaleString('en-US')}   ·   HULL ${Math.ceil(G.player.hull)} / ${G.player.maxHull}   ·   UPGRADES OWNED: ${G.player.upgrades.length}`, 640, 560, 16, PALETTE.gold, 700);
}

// --- Game over ------------------------------------------------------------------
export function drawGameOver(ctx, G) {
  ctx.save();
  ctx.fillStyle = 'rgba(10,2,8,0.62)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  glowText(ctx, 'SIGNAL LOST', 640, 220, 72, '#ff3b5c', PALETTE.red, 900);
  text(ctx, 'The void took the last light. The beacon remembers your run.', 640, 292, 18, 'rgba(244,248,255,0.85)', 600);
  drawStats(ctx, G, 340);
  const pulse = 0.65 + 0.35 * Math.sin(G.time * 3.2);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS R OR CLICK TO FLY AGAIN', 640, 590, 22, PALETTE.gold, 800);
  ctx.restore();
}

// --- Victory ----------------------------------------------------------------------
export function drawVictory(ctx, G) {
  ctx.save();
  ctx.fillStyle = 'rgba(3,8,12,0.55)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.restore();
  glowText(ctx, 'VOIDLIGHT TRIUMPHS', 640, 200, 64, '#ffffff', PALETTE.gold, 900);
  text(ctx, 'The Sovereign is dust. All 18 waves are yours — the light holds.', 640, 268, 19, PALETTE.cyan, 700);
  drawStats(ctx, G, 336);
  const pulse = 0.65 + 0.35 * Math.sin(G.time * 3.2);
  ctx.save();
  ctx.globalAlpha = pulse;
  text(ctx, 'PRESS R OR CLICK TO PLAY AGAIN', 640, 584, 22, PALETTE.gold, 800);
  ctx.restore();
}

function drawStats(ctx, G, y0) {
  const acc = G.shotsFired > 0 ? Math.round((G.shotsHit / G.shotsFired) * 100) : 0;
  const rows = [
    ['FINAL SCORE', G.score.toLocaleString('en-US')],
    ['BEST SCORE', G.best.toLocaleString('en-US')],
    ['WAVE REACHED', `${Math.min(G.wave, TOTAL_WAVES)} / ${TOTAL_WAVES}`],
    ['FOES DESTROYED', String(G.kills)],
    ['ACCURACY', `${acc}%`],
    ['TIME', formatTime(G.runTime)],
  ];
  panel(ctx, 440, y0 - 24, 400, rows.length * 36 + 24, 0.8);
  let y = y0;
  for (const [k, v] of rows) {
    text(ctx, k, 470, y, 16, 'rgba(244,248,255,0.7)', 700, 'left');
    text(ctx, v, 810, y, 16, PALETTE.white, 800, 'right');
    y += 36;
  }
}
