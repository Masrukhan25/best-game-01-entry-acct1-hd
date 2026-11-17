// VOIDLIGHT — between-wave upgrades: offer three choices, apply the pick.
// Each upgrade stacks; the player keeps the list for the run summary.

import { UPGRADES, PLAYER } from './config.js';
import { shuffle } from './random.js';

export function offerUpgrades(G) {
  // Prefer upgrades the player has not maxed yet; damage/rate/speed stack forever.
  const pool = shuffle(G.rng, UPGRADES.slice());
  const offered = pool.slice(0, 3);
  G.upgradeChoices = offered;
  return offered;
}

export function applyUpgrade(G, choice) {
  const p = G.player;
  p.upgrades.push(choice.id);
  switch (choice.id) {
    case 'damage':
      p.damageMul *= 1.3;
      break;
    case 'rate':
      p.rateMul *= 1.25;
      break;
    case 'spread':
      p.extraShots += 1;
      break;
    case 'speed':
      p.speedMul *= 1.15;
      break;
    case 'hull':
      p.maxHull += 30;
      p.hull = Math.min(p.maxHull, p.hull + 30);
      break;
    case 'magnet':
      // Magnet is a flag; owning it once is enough, but stacking is harmless.
      break;
    default:
      break;
  }
  G.audio.upgrade();
}

export function basePlayer() {
  return {
    x: 640,
    y: 600,
    vx: 0,
    vy: 0,
    angle: -Math.PI / 2,
    radius: PLAYER.radius,
    hull: PLAYER.hull,
    maxHull: PLAYER.hull,
    lives: PLAYER.lives,
    fireTimer: 0,
    invuln: 0,
    shieldTime: 0,
    rapidTime: 0,
    spreadTime: 0,
    damageMul: 1,
    rateMul: 1,
    speedMul: 1,
    extraShots: 0,
    upgrades: [],
    alive: true,
    respawnTimer: 0,
    trailTimer: 0,
  };
}
