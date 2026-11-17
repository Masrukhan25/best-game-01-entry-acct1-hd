// VOIDLIGHT — tuning, palette, enemy table, wave table, upgrade pool.
// Every number that shapes the game lives here so balance can be tuned in one place.

export const VIEW_W = 1280;
export const VIEW_H = 720;
export const TOTAL_WAVES = 18;

// Neon palette: deep space blues and purples, cyan + magenta + warm orange accents.
export const PALETTE = {
  space0: '#04040f',
  space1: '#0a0a26',
  nebulaViolet: '#7b2fff',
  nebulaMagenta: '#ff2bd6',
  nebulaCyan: '#1ec8ff',
  cyan: '#2ee6ff',
  cyanDim: '#1899bb',
  magenta: '#ff2bd6',
  orange: '#ffb020',
  violet: '#8b5cff',
  green: '#3dff9e',
  red: '#ff3b5c',
  white: '#f4f8ff',
  gold: '#ffd76a',
};

// Player tuning.
export const PLAYER = {
  radius: 16,
  speed: 430,
  accel: 2600,
  drag: 6.5,
  hull: 100,
  lives: 3,
  fireRate: 7.5, // shots per second at level 1
  bulletSpeed: 920,
  bulletDamage: 12,
  bulletRadius: 5,
  invulnTime: 2.0,
  respawnTime: 1.2,
};

// Enemy types. hp scales with wave: hp * (1 + (wave - 1) * 0.085).
export const ENEMIES = {
  drifter: { name: 'Drifter', hp: 22, speed: 78, radius: 17, score: 100, color: '#ff2bd6', kind: 'drifter' },
  weaver: { name: 'Weaver', hp: 30, speed: 105, radius: 16, score: 150, color: '#8b5cff', kind: 'weaver' },
  darter: { name: 'Darter', hp: 16, speed: 235, radius: 13, score: 150, color: '#ffb020', kind: 'darter' },
  spitter: { name: 'Spitter', hp: 42, speed: 62, radius: 19, score: 250, color: '#3dff9e', kind: 'spitter' },
  bulwark: { name: 'Bulwark', hp: 150, speed: 42, radius: 27, score: 400, color: '#ff3b5c', kind: 'bulwark' },
  splitter: { name: 'Splitter', hp: 34, speed: 92, radius: 18, score: 200, color: '#2ee6ff', kind: 'splitter' },
  stinger: { name: 'Stinger', hp: 10, speed: 285, radius: 10, score: 80, color: '#ffd76a', kind: 'stinger' },
  shard: { name: 'Shard', hp: 8, speed: 320, radius: 9, score: 50, color: '#2ee6ff', kind: 'shard' },
};

export const BOSS = {
  name: 'VOID SOVEREIGN',
  hp: 3400,
  radius: 64,
  score: 20000,
  color: '#ff2bd6',
};

// Power-up types.
export const POWERUPS = {
  shield: { name: 'AEGIS SHIELD', color: '#2ee6ff', desc: 'Invulnerable for 8s' },
  rapid: { name: 'RAPID FIRE', color: '#ffb020', desc: '+55% fire rate for 12s' },
  spread: { name: 'TRIPLE SPREAD', color: '#ff2bd6', desc: '3-way shots for 12s' },
  repair: { name: 'HULL REPAIR', color: '#3dff9e', desc: 'Restore 40 hull' },
  bomb: { name: 'NOVA BOMB', color: '#ffd76a', desc: 'Blast every foe on screen' },
};

// Wave director: each wave lists spawn groups [type, count, gapSeconds].
// Waves grow in size and mix; wave 18 is the boss.
export const WAVES = [
  { groups: [['drifter', 6, 1.1]] },
  { groups: [['drifter', 8, 0.9], ['weaver', 3, 1.4]] },
  { groups: [['drifter', 8, 0.8], ['weaver', 5, 1.2], ['darter', 3, 1.6]] },
  { groups: [['weaver', 7, 1.0], ['darter', 5, 1.1], ['spitter', 2, 2.2]] },
  { groups: [['drifter', 10, 0.7], ['spitter', 3, 1.8], ['splitter', 4, 1.5]] },
  { groups: [['weaver', 8, 0.9], ['darter', 7, 0.9], ['stinger', 6, 0.7]] },
  { groups: [['spitter', 4, 1.6], ['splitter', 6, 1.2], ['bulwark', 1, 3.0]] },
  { groups: [['drifter', 12, 0.6], ['weaver', 8, 0.8], ['darter', 6, 0.9]] },
  { groups: [['stinger', 12, 0.5], ['spitter', 4, 1.5], ['weaver', 6, 1.0]] },
  { groups: [['bulwark', 2, 2.5], ['splitter', 8, 1.0], ['darter', 8, 0.8]] },
  { groups: [['drifter', 14, 0.5], ['weaver', 9, 0.8], ['spitter', 5, 1.4]] },
  { groups: [['stinger', 16, 0.45], ['darter', 10, 0.7], ['bulwark', 2, 2.2]] },
  { groups: [['weaver', 10, 0.8], ['splitter', 9, 0.9], ['spitter', 6, 1.3]] },
  { groups: [['drifter', 16, 0.5], ['bulwark', 3, 2.0], ['darter', 10, 0.7]] },
  { groups: [['stinger', 20, 0.4], ['weaver', 10, 0.7], ['spitter', 6, 1.2]] },
  { groups: [['splitter', 12, 0.8], ['bulwark', 3, 1.8], ['darter', 12, 0.6]] },
  { groups: [['drifter', 18, 0.45], ['weaver', 12, 0.7], ['spitter', 7, 1.1], ['stinger', 14, 0.45]] },
  { groups: [['boss', 1, 0]] },
];

// Upgrade choices offered between waves (at waves 3, 6, 9, 12, 15).
export const UPGRADES = [
  { id: 'damage', name: 'HEAVY ROUNDS', desc: '+30% bullet damage', icon: 'DMG' },
  { id: 'rate', name: 'OVERCLOCK', desc: '+25% fire rate', icon: 'RPM' },
  { id: 'spread', name: 'SPLIT CANNON', desc: '+1 projectile per shot', icon: 'x2' },
  { id: 'speed', name: 'ION THRUSTERS', desc: '+15% move speed', icon: 'SPD' },
  { id: 'hull', name: 'REINFORCED HULL', desc: '+30 max hull, repair 30', icon: 'HUL' },
  { id: 'magnet', name: 'TRACTOR ARRAY', desc: 'Power-ups fly to you', icon: 'MAG' },
];

export const COMBO_WINDOW = 3.0; // seconds to keep the combo alive
export const COMBO_MAX = 8;
export const DROP_CHANCE = 0.12; // normal enemy power-up drop chance
export const WAVE_BANNER_TIME = 2.4;
export const UPGRADE_WAVES = [3, 6, 9, 12, 15];
