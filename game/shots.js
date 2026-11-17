// VOIDLIGHT — deterministic shot scenes for screenshots.
// ?shot=title|play|boss|victory&seed=<n> builds a fixed scene from the seed
// alone (fixed 1/60 s steps, no wall clock, no Math.random), draws it once
// and sets window.__shotReady so the screenshot tool knows the frame is done.

import { VIEW_W, TOTAL_WAVES, PALETTE } from './config.js';
import { makeRng, range } from './random.js';
import { spawnEnemy, spawnBoss } from './enemies.js';
import { spawnExplosion, spawnText, spawnRing } from './particles.js';
import { startWave } from './waves.js';
import { drawGame } from './render.js';

const STEP = 1 / 60;

function step(G, n) {
  for (let i = 0; i < n; i++) G.update(STEP);
}

function aimUp(G, x, y) {
  G.input.mouseDown = true;
  G.input.mouseX = x;
  G.input.mouseY = y;
}

function buildTitle(G, rng) {
  G.mode = 'title';
  G.best = 45200;
  G.rng = rng;
  step(G, 360); // 6 s of attract mode: foes drift, sparkles pop
  G.time = 6.0;
}

function buildPlay(G, rng) {
  G.rng = rng;
  G.mode = 'playing';
  G.wave = 5;
  G.score = 12450;
  G.combo = 4;
  G.comboTimer = 2.0;
  G.kills = 87;
  G.shotsFired = 640;
  G.shotsHit = 512;
  G.runTime = 214;
  G.player.hull = 78;
  G.player.lives = 3;
  G.player.x = 560;
  G.player.y = 560;
  startWave(G, 5);
  // A busy mid-wave frame: five foe kinds on screen at once.
  spawnEnemy(G, 'drifter', 500, 180);
  spawnEnemy(G, 'weaver', 770, 140);
  spawnEnemy(G, 'darter', 890, 260);
  spawnEnemy(G, 'spitter', 300, 150);
  spawnEnemy(G, 'bulwark', 1020, 120);
  spawnEnemy(G, 'splitter', 420, 90);
  spawnEnemy(G, 'stinger', 620, 210);
  spawnEnemy(G, 'stinger', 700, 260);
  G.director.queue = []; // keep the staged foes only
  G.director.spawnedAll = true;
  aimUp(G, 640, 120);
  step(G, 150); // 2.5 s of live fire — past the 2.2 s wave banner
  // A fresh explosion and a score popup for the cover frame.
  spawnExplosion(G.particles, G.rng, 760, 240, PALETTE.magenta, 30, 300);
  spawnText(G.particles, 760, 220, '+600', PALETTE.magenta);
  spawnRing(G.particles, 760, 240, PALETTE.magenta, 120);
  step(G, 6);
  G.waveBannerTime = 0; // the cover frame shows the fight, not the banner
  G.player.hull = 92;
  G.player.invuln = 0; // never catch the ship mid-blink in the still frame
  G.best = 45200;
}

function buildBoss(G, rng) {
  G.rng = rng;
  G.mode = 'playing';
  G.wave = TOTAL_WAVES;
  G.score = 86400;
  G.combo = 6;
  G.comboTimer = 2.4;
  G.kills = 388;
  G.shotsFired = 2100;
  G.shotsHit = 1638;
  G.runTime = 690;
  G.player.hull = 64;
  G.player.lives = 2;
  G.player.x = 560;
  G.player.y = 600;
  const boss = spawnBoss(G);
  boss.y = 130;
  boss.entered = true;
  boss.hp = boss.maxHp * 0.62;
  boss.fireTimer = 0.4;
  spawnEnemy(G, 'stinger', 420, 260);
  spawnEnemy(G, 'stinger', 860, 300);
  G.director.queue = [];
  G.director.spawnedAll = true;
  aimUp(G, 640, 130);
  step(G, 150); // 2.5 s: spiral streams, aimed spreads, minions
  spawnExplosion(G.particles, G.rng, 520, 300, PALETTE.orange, 24, 280);
  step(G, 6);
  G.player.invuln = 0; // never catch the ship mid-blink in the still frame
  G.best = 45200;
}

function buildVictory(G, rng) {
  G.rng = rng;
  G.mode = 'victory';
  G.score = 98400;
  G.best = 98400;
  G.wave = TOTAL_WAVES;
  G.kills = 412;
  G.shotsFired = 2400;
  G.shotsHit = 1872;
  G.runTime = 754;
  G.time = 2.0;
  // A celebratory burst behind the stats panel.
  spawnExplosion(G.particles, G.rng, 300, 180, PALETTE.gold, 26, 260);
  spawnExplosion(G.particles, G.rng, 980, 200, PALETTE.cyan, 26, 260);
  spawnRing(G.particles, 640, 360, PALETTE.gold, 300);
  step(G, 10); // let the bursts spread so they read in the still frame
}

export function applyShot(G, scene, seed) {
  const rng = makeRng(seed >>> 0 || 1);
  // Fresh visual state so the scene does not depend on earlier frames.
  G.particles.list = [];
  G.particles.texts = [];
  G.particles.rings = [];
  G.enemies = [];
  G.boss = null;
  G.bullets.player = [];
  G.bullets.enemy = [];
  G.powerups = [];
  G.time = 0;
  if (scene === 'title') buildTitle(G, rng);
  else if (scene === 'play') buildPlay(G, rng);
  else if (scene === 'boss') buildBoss(G, rng);
  else if (scene === 'victory') buildVictory(G, rng);
  else buildPlay(G, rng);
  drawGame(G);
  window.__shotReady = true;
}

export function shotParams() {
  const q = new URLSearchParams(window.location.search);
  const shot = q.get('shot');
  if (!shot) return null;
  const seed = Number.parseInt(q.get('seed') || '1', 10);
  return { scene: shot, seed: Number.isFinite(seed) ? seed : 1 };
}
