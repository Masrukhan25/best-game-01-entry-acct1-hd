// VOIDLIGHT — keyboard and mouse input.
// Tracks held keys, edge-triggered presses, and the mouse position in logical
// 1280x720 coordinates (the canvas is letterboxed, so client coords are mapped).

export function makeInput(canvas) {
  const input = {
    keys: new Set(),
    pressed: new Set(),
    mouseX: 640,
    mouseY: 360,
    mouseDown: false,
    mousePressed: false,
    // True while any fire control is held: Space, or the left mouse button.
    get firing() {
      return this.keys.has('Space') || this.mouseDown;
    },
  };

  function toLogical(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const scale = Math.min(rect.width / 1280, rect.height / 720);
    const ox = (rect.width - 1280 * scale) / 2;
    const oy = (rect.height - 720 * scale) / 2;
    return {
      x: (clientX - rect.left - ox) / scale,
      y: (clientY - rect.top - oy) / scale,
    };
  }

  window.addEventListener('keydown', (e) => {
    if (['Space', 'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.code)) e.preventDefault();
    if (!input.keys.has(e.code)) input.pressed.add(e.code);
    input.keys.add(e.code);
  });
  window.addEventListener('keyup', (e) => input.keys.delete(e.code));
  window.addEventListener('blur', () => {
    input.keys.clear();
    input.mouseDown = false;
  });
  canvas.addEventListener('mousemove', (e) => {
    const p = toLogical(e.clientX, e.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
  });
  canvas.addEventListener('mousedown', (e) => {
    if (e.button !== 0) return;
    const p = toLogical(e.clientX, e.clientY);
    input.mouseX = p.x;
    input.mouseY = p.y;
    if (!input.mouseDown) input.mousePressed = true;
    input.mouseDown = true;
  });
  window.addEventListener('mouseup', (e) => {
    if (e.button === 0) input.mouseDown = false;
  });
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  // Movement vector from WASD / arrows, normalised.
  input.moveVector = function moveVector() {
    let x = 0;
    let y = 0;
    if (this.keys.has('KeyA') || this.keys.has('ArrowLeft')) x -= 1;
    if (this.keys.has('KeyD') || this.keys.has('ArrowRight')) x += 1;
    if (this.keys.has('KeyW') || this.keys.has('ArrowUp')) y -= 1;
    if (this.keys.has('KeyS') || this.keys.has('ArrowDown')) y += 1;
    if (x !== 0 && y !== 0) {
      const inv = 1 / Math.hypot(x, y);
      x *= inv;
      y *= inv;
    }
    return { x, y };
  };

  // Consume the edge-triggered presses at the end of each frame.
  input.endFrame = function endFrame() {
    this.pressed.clear();
    this.mousePressed = false;
  };

  input.wasPressed = function wasPressed(code) {
    return this.pressed.has(code);
  };

  return input;
}
