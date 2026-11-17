// VOIDLIGHT — the game itself: state, the update loop, collisions, scoring,
// lives, the boss kill, and the mode machine (title / how-to / playing /
// upgrade / paused / game over / victory). Rendering lives in render.js.

import { VIEW_W, VIEW_H, TOTAL_WAVES, PLAYER, COMBO_WINDOW, COMBO_MAX, PALETTE } from './config.js';
import { makeRng, range, chance } from './random.js';
import { makeInput } from './input.js';
import { makeAudio } from './audio.js';
import {
  makeNebula, makeStars, makeGlowSprite, makeParticles,
  spawnExplosion, spawnTrail, spawnText, spawnRing, updateParticles,
} from './particles.js';
import { makeBulletPools, firePlayerBullet, fireEnemyBullet, updateBullets, clearEnemyBullets } from './bullets.js';
import { makeEnemySprites, spawnEnemy, updateEnemy, updateBoss } from './enemies.js';
import { makePowerups, rollDrop, updatePowerups, applyPowerup } from './powerups.js';
import { makeDirector, startWave, updateDirector, waveCleared, advanceWave } from './waves.js';
import { offerUpgrades, applyUpgrade, basePlayer } from './upgrades.js';

export function createGame(canvas) {
  const G = {
    canvas,
    ctx: canvas.getContext('2d'),
    mode: 'title',
    rng: makeRng((Date.now() % 2147483647) || 1),
    input: makeInput(canvas),
    audio: makeAudio(),
    time: 0,
    runTime: 0,
    wave: 1,
    score: 0,
    best: 0,
    combo: 1,
    comboTimer: 0,
    kills: 0,
    shotsFired: 0,
    shotsHit: 0,
    player: basePlayer(),
    enemies: [],
    boss: null,
    bullets: makeBulletPools(),
    powerups: makePowerups(),
    particles: makeParticles(),
    director: makeDirector(),
    waveBanner: '',
    waveBannerTime: 0,
    upgradeChoices: [],
    upgradeRects: [],
    shakeT: 0,
    shakeMag: 0,
    shakeX: 0,
    shakeY: 0,
    victoryTimer: 0,
    titleSpawnTimer: 0,
    titleSparkleTimer: 0,
    flashRed: 0,
    flashWhite: 0,
    nebula: null,
    stars: null,
    glowSprites: {},
    enemySprites: null,
    playerSprite: null,
  };

  // Best score persists in localStorage when the browser allows it.
  try {
    G.best = Number(window.localStorage.getItem('voidlight-best') || 0) || 0;
  } catch {
    G.best = 0;
  }

  G.saveBest = function saveBest() {
    if (G.score > G.best) {
      G.best = G.score;
      try {
        window.localStorage.setItem('voidlight-best', String(G.best));
      } catch { /* storage unavailable; best lives for the session */ }
    }
  };

  // --- visual setup (seeded so shots are deterministic) -------------------
  const visualRng = makeRng(1337);
  G.nebula = makeNebula(visualRng);
  G.stars = makeStars(visualRng);
  for (const color of [PALETTE.cyan, PALETTE.magenta, PALETTE.orange, PALETTE.violet, PALETTE.green, PALETTE.red, PALETTE.gold, '#ffffff']) {
    G.glowSprites[color] = makeGlowSprite(color);
  }
  G.enemySprites = makeEnemySprites();
  G.playerSprite = makePlayerSprite();

  // --- helpers the entity modules call ------------------------------------
  G.fireEnemy = function fireEnemy(x, y, vx, vy, color, radius = 6) {
    fireEnemyBullet(G.bullets, x, y, vx, vy, color, radius);
  };

  G.shake = function shake(mag, time) {
    G.shakeMag = Math.max(G.shakeMag, mag);
    G.shakeT = Math.max(G.shakeT, time);
  };

  G.bombBlast = function bombBlast() {
    spawnRing(G.particles, G.player.x, G.player.y, PALETTE.gold, 620);
    G.shake(14, 0.5);
    G.audio.explosion(true);
    for (const e of G.enemies) G.damageEnemy(e, 150, true);
    if (G.boss) G.damageBoss(150);
    clearEnemyBullets(G.bullets);
  };

  G.openUpgrades = function openUpgrades() {
    G.mode = 'upgrade';
    offerUpgrades(G);
  };

  G.startGame = function startGame() {
    G.score = 0;
    G.wave = 1;
    G.combo = 1;
    G.comboTimer = 0;
    G.kills = 0;
    G.shotsFired = 0;
    G.shotsHit = 0;
    G.runTime = 0;
    G.player = basePlayer();
    G.enemies = [];
    G.boss = null;
    G.bullets = makeBulletPools();
    G.powerups = makePowerups();
    G.particles = makeParticles();
    G.director = makeDirector();
    G.victoryTimer = 0;
    G.rng = makeRng((Date.now() % 2147483647) || 1);
    G.mode = 'playing';
    G.audio.ensure();
    G.audio.startMusic();
    startWave(G, 1);
  };

  G.toTitle = function toTitle() {
    G.saveBest();
    G.mode = 'title';
    G.enemies = [];
    G.boss = null;
    G.bullets = makeBulletPools();
    G.powerups = makePowerups();
    G.audio.stopMusic();
  };

  // --- combat --------------------------------------------------------------
  G.damageEnemy = function damageEnemy(e, dmg, silent = false) {
    e.hp -= dmg;
    e.flash = 0.09;
    if (!silent) G.audio.enemyHit();
    if (e.hp <= 0 && !e.dead) {
      e.dead = true;
      G.killEnemy(e);
    }
  };

  G.damageBoss = function damageBoss(dmg) {
    const b = G.boss;
    if (!b) return;
    b.hp -= dmg;
    b.flash = 0.09;
    if (b.hp <= 0) {
      G.killBoss();
    }
  };

  G.killEnemy = function killEnemy(e) {
    G.kills++;
    G.comboTimer = COMBO_WINDOW;
    G.combo = Math.min(COMBO_MAX, G.combo + 1);
    const gained = e.score * G.combo;
    G.score += gained;
    spawnExplosion(G.particles, G.rng, e.x, e.y, e.color, e.type === 'bulwark' ? 42 : 22, 260);
    spawnText(G.particles, e.x, e.y - 10, `+${gained}`, e.color);
    if (G.combo >= 3) spawnText(G.particles, e.x, e.y - 32, `COMBO x${G.combo}`, PALETTE.gold);
    G.audio.explosion(e.type === 'bulwark');
    G.shake(3, 0.12);
    if (e.type === 'splitter') {
      for (const side of [-1, 1]) {
        const s = spawnEnemy(G, 'shard', e.x + side * 14, e.y);
        s.vx = side * 90;
        s.vy = 200;
      }
    }
    rollDrop(G, e.x, e.y, e.type === 'bulwark');
  };

  G.killBoss = function killBoss() {
    const b = G.boss;
    G.score += b.score;
    G.kills++;
    spawnExplosion(G.particles, G.rng, b.x, b.y, '#ff2bd6', 90, 420);
    spawnExplosion(G.particles, G.rng, b.x, b.y, '#ffb020', 60, 320);
    spawnRing(G.particles, b.x, b.y, '#ff2bd6', 420);
    spawnText(G.particles, b.x, b.y - 60, `+${b.score}`, PALETTE.gold, true);
    G.audio.explosion(true);
    G.shake(18, 0.8);
    G.boss = null;
    G.victoryTimer = 1.6;
  };

  G.damagePlayer = function damagePlayer(dmg) {
    const p = G.player;
    if (!p.alive || p.invuln > 0 || p.shieldTime > 0 || G.mode !== 'playing') return;
    p.hull -= dmg;
    p.invuln = 0.9;
    G.flashRed = 0.35;
    G.shake(8, 0.3);
    G.audio.playerHit();
    spawnExplosion(G.particles, G.rng, p.x, p.y, PALETTE.red, 18, 220);
    if (p.hull <= 0) {
      p.hull = 0;
      G.loseLife();
    }
  };

  G.loseLife = function loseLife() {
    const p = G.player;
    p.alive = false;
    p.lives--;
    p.respawnTimer = PLAYER.respawnTime;
    spawnExplosion(G.particles, G.rng, p.x, p.y, PALETTE.cyan, 60, 380);
    spawnRing(G.particles, p.x, p.y, PALETTE.cyan, 260);
    G.shake(16, 0.6);
    G.audio.explosion(true);
    clearEnemyBullets(G.bullets);
    if (p.lives <= 0) {
      G.gameOver();
    }
  };

  G.gameOver = function gameOver() {
    G.saveBest();
    G.mode = 'gameover';
    G.audio.stopMusic();
    G.audio.gameOver();
  };

  G.victory = function victory() {
    G.saveBest();
    G.mode = 'victory';
    G.audio.stopMusic();
    G.audio.victory();
  };

  // --- per-frame update ------------------------------------------------------
  G.update = function update(dt) {
    G.time += dt;
    updateParticles(G.particles, dt);
    if (G.flashRed > 0) G.flashRed -= dt;
    if (G.flashWhite > 0) G.flashWhite -= dt;
    if (G.shakeT > 0) {
      G.shakeT -= dt;
      const m = G.shakeMag * Math.max(0, G.shakeT / 0.5);
      G.shakeX = (G.rng() - 0.5) * m * 2;
      G.shakeY = (G.rng() - 0.5) * m * 2;
      if (G.shakeT <= 0) {
        G.shakeMag = 0;
        G.shakeX = 0;
        G.shakeY = 0;
      }
    }
    if (G.waveBannerTime > 0) G.waveBannerTime -= dt;

    if (G.mode === 'title') {
      updateTitle(G, dt);
      return;
    }
    if (G.mode === 'howto' || G.mode === 'upgrade' || G.mode === 'paused' || G.mode === 'gameover' || G.mode === 'victory') {
      return;
    }
    // playing
    G.runTime += dt;
    if (G.comboTimer > 0) {
      G.comboTimer -= dt;
      if (G.comboTimer <= 0) G.combo = 1;
    }
    updateDirector(G, dt);
    updatePlayer(G, dt);
    for (const e of G.enemies) updateEnemy(G, e, dt);
    if (G.boss) updateBoss(G, G.boss, dt);
    updateBullets(G.bullets, dt);
    updatePowerups(G, dt);
    G.audio.updateMusic(dt);
    collide(G);
    // Remove the dead.
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      const e = G.enemies[i];
      if (e.dead || e.y > VIEW_H + 60) G.enemies.splice(i, 1);
    }
    // Wave clear?
    if (G.mode === 'playing' && waveCleared(G)) {
      if (G.wave >= TOTAL_WAVES) {
        // Boss wave cleared without a boss object means the boss died already.
      } else {
        advanceWave(G);
      }
    }
    // Victory delay after the boss falls.
    if (G.victoryTimer > 0) {
      G.victoryTimer -= dt;
      if (G.victoryTimer <= 0 && G.mode === 'playing') G.victory();
    }
  };

  function updateTitle(G, dt) {
    // A living backdrop: foes drift down and sparkle out, never fought.
    G.titleSpawnTimer -= dt;
    if (G.titleSpawnTimer <= 0) {
      G.titleSpawnTimer = range(G.rng, 0.9, 1.8);
      if (G.enemies.length < 7) {
        const kinds = ['drifter', 'weaver', 'darter', 'splitter'];
        const kind = kinds[Math.floor(G.rng() * kinds.length)];
        spawnEnemy(G, kind, range(G.rng, 60, VIEW_W - 60), -40);
      }
    }
    G.titleSparkleTimer -= dt;
    if (G.titleSparkleTimer <= 0) {
      G.titleSparkleTimer = range(G.rng, 0.4, 1.1);
      const x = range(G.rng, 80, VIEW_W - 80);
      const y = range(G.rng, 120, VIEW_H - 120);
      spawnExplosion(G.particles, G.rng, x, y, chance(G.rng, 0.5) ? PALETTE.magenta : PALETTE.cyan, 10, 140);
    }
    for (const e of G.enemies) updateEnemy(G, e, dt);
    for (let i = G.enemies.length - 1; i >= 0; i--) {
      if (G.enemies[i].y > VIEW_H + 60) G.enemies.splice(i, 1);
    }
  }

  function updatePlayer(G, dt) {
    const p = G.player;
    const input = G.input;
    if (!p.alive) {
      p.respawnTimer -= dt;
      if (p.respawnTimer <= 0 && p.lives > 0) {
        p.alive = true;
        p.hull = p.maxHull;
        p.x = VIEW_W / 2;
        p.y = 600;
        p.vx = 0;
        p.vy = 0;
        p.invuln = 2.0;
        spawnRing(G.particles, p.x, p.y, PALETTE.cyan, 140);
      }
      return;
    }
    if (p.invuln > 0) p.invuln -= dt;
    if (p.shieldTime > 0) p.shieldTime -= dt;
    if (p.rapidTime > 0) p.rapidTime -= dt;
    if (p.spreadTime > 0) p.spreadTime -= dt;

    // Movement with acceleration and drag.
    const mv = input.moveVector();
    const speed = PLAYER.speed * p.speedMul;
    p.vx += mv.x * PLAYER.accel * dt;
    p.vy += mv.y * PLAYER.accel * dt;
    const drag = Math.max(0, 1 - PLAYER.drag * dt);
    p.vx *= drag;
    p.vy *= drag;
    const sp = Math.hypot(p.vx, p.vy);
    if (sp > speed) {
      p.vx = (p.vx / sp) * speed;
      p.vy = (p.vy / sp) * speed;
    }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.x = Math.max(24, Math.min(VIEW_W - 24, p.x));
    p.y = Math.max(90, Math.min(VIEW_H - 24, p.y));

    // Aim at the mouse; straight up when the mouse sits on the ship.
    const dx = input.mouseX - p.x;
    const dy = input.mouseY - p.y;
    p.angle = Math.hypot(dx, dy) < 24 ? -Math.PI / 2 : Math.atan2(dy, dx);

    // Engine trail.
    p.trailTimer -= dt;
    if ((Math.abs(p.vx) > 60 || Math.abs(p.vy) > 60) && p.trailTimer <= 0) {
      p.trailTimer = 0.03;
      spawnTrail(G.particles, G.rng, p.x - Math.cos(p.angle) * 14, p.y - Math.sin(p.angle) * 14 + 10, PALETTE.cyan);
    }

    // Fire.
    p.fireTimer -= dt;
    if (input.firing && p.fireTimer <= 0) {
      const rate = PLAYER.fireRate * p.rateMul * (p.rapidTime > 0 ? 1.55 : 1);
      p.fireTimer = 1 / rate;
      const shots = Math.min(5, 1 + p.extraShots + (p.spreadTime > 0 ? 2 : 0));
      const dmg = PLAYER.bulletDamage * p.damageMul;
      for (let i = 0; i < shots; i++) {
        const off = (i - (shots - 1) / 2) * 0.14;
        const a = p.angle + off;
        const bx = p.x + Math.cos(a) * 20;
        const by = p.y + Math.sin(a) * 20;
        firePlayerBullet(G.bullets, bx, by, Math.cos(a) * PLAYER.bulletSpeed, Math.sin(a) * PLAYER.bulletSpeed, dmg);
      }
      G.shotsFired += shots;
      G.audio.shoot();
      G.flashWhite = 0.04;
    }
  }

  function collide(G) {
    const p = G.player;
    // Player bullets vs enemies and boss.
    for (let i = G.bullets.player.length - 1; i >= 0; i--) {
      const b = G.bullets.player[i];
      let hit = false;
      for (const e of G.enemies) {
        if (e.dead) continue;
        const dx = b.x - e.x;
        const dy = b.y - e.y;
        const rr = e.radius + b.radius;
        if (dx * dx + dy * dy < rr * rr) {
          G.damageEnemy(e, b.damage);
          G.shotsHit++;
          spawnExplosion(G.particles, G.rng, b.x, b.y, e.color, 3, 120);
          hit = true;
          break;
        }
      }
      if (!hit && G.boss) {
        const b2 = G.boss;
        const dx = b.x - b2.x;
        const dy = b.y - b2.y;
        const rr = b2.radius + b.radius;
        if (dx * dx + dy * dy < rr * rr) {
          G.damageBoss(b.damage);
          G.shotsHit++;
          spawnExplosion(G.particles, G.rng, b.x, b.y, '#ff2bd6', 3, 120);
          hit = true;
        }
      }
      if (hit) G.bullets.player.splice(i, 1);
    }
    if (!p.alive) return;
    // Enemy bullets vs player.
    for (let i = G.bullets.enemy.length - 1; i >= 0; i--) {
      const b = G.bullets.enemy[i];
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const rr = p.radius * 0.8 + b.radius;
      if (dx * dx + dy * dy < rr * rr) {
        G.bullets.enemy.splice(i, 1);
        G.damagePlayer(12);
        // damagePlayer can kill the ship, and losing a life clears the
        // enemy bullet array — stop iterating it or the next read is undefined.
        if (!p.alive) break;
      }
    }
    // Enemies vs player (ramming).
    for (const e of G.enemies) {
      if (e.dead) continue;
      const dx = e.x - p.x;
      const dy = e.y - p.y;
      const rr = p.radius + e.radius - 4;
      if (dx * dx + dy * dy < rr * rr) {
        G.damagePlayer(18);
        G.damageEnemy(e, 40, true);
      }
    }
    // Boss vs player.
    if (G.boss) {
      const b = G.boss;
      const dx = b.x - p.x;
      const dy = b.y - p.y;
      const rr = p.radius + b.radius - 10;
      if (dx * dx + dy * dy < rr * rr) G.damagePlayer(25);
    }
    // Power-ups vs player.
    for (let i = G.powerups.length - 1; i >= 0; i--) {
      const u = G.powerups[i];
      const dx = u.x - p.x;
      const dy = u.y - p.y;
      const rr = p.radius + u.radius + 8;
      if (dx * dx + dy * dy < rr * rr) {
        G.powerups.splice(i, 1);
        const name = applyPowerup(G, u.type);
        spawnText(G.particles, p.x, p.y - 30, name, '#ffd76a', true);
        spawnRing(G.particles, p.x, p.y, '#ffd76a', 90);
        G.audio.powerup();
      }
    }
  }

  // --- input routing (called from main.js after update) ---------------------
  G.handleInput = function handleInput() {
    const input = G.input;
    if (input.wasPressed('KeyM')) {
      G.audio.ensure();
      G.audio.setMuted(!G.audio.muted);
    }
    if (G.mode === 'title') {
      if (input.wasPressed('Enter') || input.mousePressed) {
        G.startGame();
      } else if (input.wasPressed('KeyH')) {
        G.mode = 'howto';
      }
      return;
    }
    if (G.mode === 'howto') {
      if (input.wasPressed('Enter') || input.wasPressed('Escape') || input.mousePressed) {
        G.mode = 'title';
      }
      return;
    }
    if (G.mode === 'playing') {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape')) {
        G.mode = 'paused';
        G.audio.stopMusic();
      }
      return;
    }
    if (G.mode === 'paused') {
      if (input.wasPressed('KeyP') || input.wasPressed('Escape') || input.wasPressed('Enter')) {
        G.mode = 'playing';
        G.audio.startMusic();
      }
      return;
    }
    if (G.mode === 'upgrade') {
      for (let i = 0; i < 3; i++) {
        if (input.wasPressed(`Digit${i + 1}`) || input.wasPressed(`Numpad${i + 1}`)) {
          pickUpgrade(G, i);
          return;
        }
      }
      if (input.mousePressed) {
        for (let i = 0; i < G.upgradeRects.length; i++) {
          const r = G.upgradeRects[i];
          if (input.mouseX >= r.x && input.mouseX <= r.x + r.w && input.mouseY >= r.y && input.mouseY <= r.y + r.h) {
            pickUpgrade(G, i);
            return;
          }
        }
      }
      return;
    }
    if (G.mode === 'gameover' || G.mode === 'victory') {
      if (input.wasPressed('KeyR') || input.wasPressed('Enter') || input.mousePressed) {
        G.startGame();
      }
    }
  };

  function pickUpgrade(G, i) {
    const choice = G.upgradeChoices[i];
    if (!choice) return;
    applyUpgrade(G, choice);
    G.upgradeChoices = [];
    G.mode = 'playing';
    startWave(G, G.wave);
  }

  return G;
}

// The player ship, pre-rendered once: a sleek arrow hull with cyan glow.
function makePlayerSprite() {
  const size = 96;
  const c = document.createElement('canvas');
  c.width = size;
  c.height = size;
  const ctx = c.getContext('2d');
  const cx = size / 2;
  const cy = size / 2;
  ctx.save();
  ctx.translate(cx, cy);
  const g = ctx.createRadialGradient(0, 0, 4, 0, 0, 44);
  g.addColorStop(0, 'rgba(46,230,255,0.5)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(0, 0, 44, 0, Math.PI * 2);
  ctx.fill();
  // Hull: arrow pointing up (angle -PI/2 is forward).
  ctx.fillStyle = '#0d1030';
  ctx.strokeStyle = PALETTE.cyan;
  ctx.lineWidth = 2.5;
  ctx.shadowColor = PALETTE.cyan;
  ctx.shadowBlur = 16;
  const p = new Path2D();
  p.moveTo(0, -22);
  p.lineTo(15, 10);
  p.lineTo(7, 4);
  p.lineTo(0, 12);
  p.lineTo(-7, 4);
  p.lineTo(-15, 10);
  p.closePath();
  ctx.fill(p);
  ctx.stroke(p);
  // Cockpit.
  ctx.shadowBlur = 0;
  ctx.fillStyle = '#eafcff';
  ctx.beginPath();
  ctx.arc(0, -6, 4, 0, Math.PI * 2);
  ctx.fill();
  // Wing lights.
  ctx.fillStyle = PALETTE.magenta;
  ctx.beginPath();
  ctx.arc(-12, 8, 2.5, 0, Math.PI * 2);
  ctx.arc(12, 8, 2.5, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
  return c;
}
