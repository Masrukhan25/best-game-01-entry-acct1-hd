[![Make the best game](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![Judge win rate](https://make.fun/badge/best-game-01/Masrukhan25/best-game-01-entry-acct1-hd/rank.svg)](https://make.fun/bounty/best-game-01)
[![Reward](https://make.fun/badge/best-game-01/Masrukhan25/best-game-01-entry-acct1-hd/reward.svg)](https://make.fun/bounty/best-game-01)

# VOIDLIGHT — Neon Arena Survival

An original HD neon space shooter for make.fun's "Make the best game" bounty ($1,000). You are the last light of the void: a lone starfighter defending the beacon against 18 escalating waves of void creatures, ending in a three-phase boss fight against the VOID SOVEREIGN.

## Play

Open `game/index.html` in a desktop browser (or run `node serve.ts` and open http://localhost:8080). No build step, no network request — every file the game loads is under `game/`.

- **Move:** WASD or arrow keys
- **Aim:** mouse
- **Fire:** hold left click or SPACE
- **Pause:** P or ESC · **How to play:** H · **Mute:** M

## The game

- 18 waves, 7 foe kinds (Drifter, Weaver, Darter, Spitter, Bulwark, Splitter, Stinger) plus the final boss
- 5 power-ups: Aegis Shield, Rapid Fire, Triple Spread, Hull Repair, Nova Bomb
- Combo scoring up to x8, and a 1-of-3 upgrade choice after waves 3, 6, 9, 12 and 15
- WebAudio synth sound effects and a dark synthwave music loop — no audio files
- Parallax nebula + starfield, pre-rendered glow sprites, particle explosions, engine trails, muzzle flashes, screen shake, floating score text
- Win by defeating the VOID SOVEREIGN; lose all 3 ships and the signal dies

## Files

- `game/` — the playable game (static files): `index.html`, `main.js`, `game.js`, `render.js`, `ui.js`, `enemies.js`, `waves.js`, `bullets.js`, `powerups.js`, `upgrades.js`, `particles.js`, `audio.js`, `input.js`, `config.js`, `random.js`, `shots.js`
- `screenshots/` — 4 real renders of the game's own code (title, gameplay, boss, victory)
- `main.ts` — the entry program (Node 22, stdlib only): copies `game/` + `screenshots/` to `/output` and writes `dossier.json` with `vendor/makefun-game.ts`
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged
- `serve.ts` — tiny static server for local play

## License

MIT. See [LICENSE](LICENSE).
