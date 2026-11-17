// VOIDLIGHT — the entry program for make.fun's best-game-01 (Node 22,
// standard library only). It hands the game in: it copies this repository's
// game/ and screenshots/ into the output directory and writes dossier.json
// with the vendored make.fun library, which the scorer re-derives byte for
// byte. Run it locally with:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
// In the grader's container MAKEFUN_OUTPUT_DIR is unset and /output is used.

import { existsSync, mkdirSync, readdirSync, statSync, copyFileSync, writeFileSync, readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-game.ts';

// The repository root is the directory this file lives in.
const repoRoot = dirname(fileURLToPath(import.meta.url));
const outDir = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';

// Copy a directory tree, files only, creating directories as needed.
// Returns the number of files copied.
function copyTree(fromDir, toDir) {
  mkdirSync(toDir, { recursive: true });
  let copied = 0;
  for (const name of readdirSync(fromDir)) {
    const from = join(fromDir, name);
    const to = join(toDir, name);
    const info = statSync(from);
    if (info.isDirectory()) copied += copyTree(from, to);
    else if (info.isFile()) {
      copyFileSync(from, to);
      copied += 1;
    }
  }
  return copied;
}

// The scorer's own caps for this bounty (reference/gate.json): only
// text_max_bytes shapes the dossier's bytes; the rest refuse an entry the
// scorer would refuse — more than 4 screenshots or one over 256 KiB, more
// than 993 entries in game/ or 48 MiB of game files, or a game path over
// 1000 bytes. game/ counts beside /output's own 1000-entry cap, together
// with screenshots/ and dossier.json.
const DOSSIER_CAPS = {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
  game_path_max_bytes: 1000,
};

function handIn() {
  const gameDir = join(repoRoot, 'game');
  const shotsDir = join(repoRoot, 'screenshots');
  if (!existsSync(gameDir)) throw new Error('hand-in: no game/ directory beside main.ts');
  mkdirSync(outDir, { recursive: true });
  const gameFiles = copyTree(gameDir, join(outDir, 'game'));
  mkdirSync(join(outDir, 'screenshots'), { recursive: true });
  const shotFiles = existsSync(shotsDir) ? copyTree(shotsDir, join(outDir, 'screenshots')) : 0;
  const dossier = buildDossier(outDir, DOSSIER_CAPS);
  const dossierPath = join(outDir, 'dossier.json');
  writeFileSync(dossierPath, dossier);
  // Read the dossier back and confirm it parses — a hand-in with a broken
  // dossier.json is worse than no hand-in at all.
  const parsed = JSON.parse(readFileSync(dossierPath, 'utf8'));
  if (!parsed || typeof parsed !== 'object') throw new Error('hand-in: dossier.json did not parse');
  return { outDir, dossierBytes: dossier.length, gameFiles, shotFiles };
}

const result = handIn();
console.log(`VOIDLIGHT handed in: ${result.outDir} (dossier.json ${result.dossierBytes} bytes, ${result.gameFiles} game files, ${result.shotFiles} screenshots)`);
