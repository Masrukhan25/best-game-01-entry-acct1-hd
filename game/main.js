// VOIDLIGHT — entrypoint: boot the canvas, run the fixed-step loop, and
// hand deterministic screenshot scenes to shots.js when ?shot= is present.

import { VIEW_W, VIEW_H } from './config.js';
import { createGame } from './game.js';
import { drawGame } from './render.js';
import { applyShot, shotParams } from './shots.js';

const canvas = document.getElementById('game');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const G = createGame(canvas);
// Exposed for scripted playtests (state inspection only, never for cheating).
window.__game = G;

const shot = shotParams();
if (shot) {
  // Screenshot mode: build the scene, draw it once, signal readiness.
  applyShot(G, shot.scene, shot.seed);
} else {
  let last = performance.now();
  function frame(now) {
    const dt = Math.min(1 / 30, Math.max(0, (now - last) / 1000));
    last = now;
    G.update(dt);
    drawGame(G);
    G.handleInput();
    G.input.endFrame();
    requestAnimationFrame(frame);
  }
  requestAnimationFrame(frame);
}
