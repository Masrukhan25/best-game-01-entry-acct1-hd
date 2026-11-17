// VOIDLIGHT — the wave director: builds each wave's spawn queue, feeds foes
// in over time, and reports when the wave is cleared. Wave 18 is the boss.

import { WAVES, TOTAL_WAVES, WAVE_BANNER_TIME, UPGRADE_WAVES } from './config.js';
import { range } from './random.js';
import { spawnEnemy, spawnBoss } from './enemies.js';

export function makeDirector() {
  return {
    queue: [], // { type, at } in spawn order
    clock: 0,
    spawnedAll: false,
    bannerTime: 0,
    betweenWaves: 0,
    bossSpawned: false,
  };
}

// Build the spawn queue for a wave number (1-based).
export function startWave(G, n) {
  const dir = G.director;
  dir.queue = [];
  dir.clock = 0;
  dir.spawnedAll = false;
  dir.bossSpawned = false;
  dir.bannerTime = WAVE_BANNER_TIME;
  const def = WAVES[n - 1];
  let at = 0.6;
  for (const [type, count, gap] of def.groups) {
    for (let i = 0; i < count; i++) {
      dir.queue.push({ type, at });
      at += gap;
    }
    at += 0.8;
  }
  if (n === TOTAL_WAVES) {
    G.waveBanner = 'FINAL WAVE — THE VOID SOVEREIGN';
  } else {
    G.waveBanner = `WAVE ${n} / ${TOTAL_WAVES}`;
  }
  G.waveBannerTime = WAVE_BANNER_TIME;
}

export function updateDirector(G, dt) {
  const dir = G.director;
  if (dir.bannerTime > 0) dir.bannerTime -= dt;
  dir.clock += dt;
  // Feed the queue.
  while (dir.queue.length > 0 && dir.queue[0].at <= dir.clock) {
    const item = dir.queue.shift();
    if (item.type === 'boss') {
      if (!dir.bossSpawned) {
        dir.bossSpawned = true;
        spawnBoss(G);
        G.audio.bossAlarm();
        G.shake(10, 0.5);
      }
    } else {
      const x = range(G.rng, 50, 1230);
      spawnEnemy(G, item.type, x, -30);
    }
  }
  if (dir.queue.length === 0) dir.spawnedAll = true;
}

// True when the wave is fully cleared: nothing left to spawn, no foes alive.
export function waveCleared(G) {
  const dir = G.director;
  if (!dir.spawnedAll) return false;
  if (G.boss) return false;
  return G.enemies.length === 0;
}

// Called when a wave ends: bonus, banner, then the next wave or the upgrade screen.
export function advanceWave(G) {
  const bonus = 500 + G.wave * 250;
  G.score += bonus;
  G.audio.waveClear();
  if (G.wave >= TOTAL_WAVES) return; // victory is handled by the boss death
  G.wave++;
  if (UPGRADE_WAVES.includes(G.wave - 1)) {
    G.openUpgrades();
  } else {
    startWave(G, G.wave);
  }
}
