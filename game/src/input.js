// Midnight Vault — keyboard and mouse input. Keys are held states; clicks
// are edges (a click sets a move target once). The module owns nothing but
// the listeners, so the world can read a plain object each step.

export function createInput(canvas) {
  const input = {
    up: false,
    down: false,
    left: false,
    right: false,
    sneak: false,
    interact: false,
    smoke: false,
    emp: false,
    clickX: null,
    clickY: null,
    clicked: false,
    pressedKey: null,
  };
  const keys = {
    ArrowUp: 'up',
    KeyW: 'up',
    ArrowDown: 'down',
    KeyS: 'down',
    ArrowLeft: 'left',
    KeyA: 'left',
    ArrowRight: 'right',
    KeyD: 'right',
    ShiftLeft: 'sneak',
    ShiftRight: 'sneak',
    KeyE: 'interact',
  };
  window.addEventListener('keydown', (event) => {
    const name = keys[event.code];
    if (name) {
      input[name] = true;
      event.preventDefault();
    }
    if (event.code === 'Digit1' && !event.repeat) input.smoke = true;
    if (event.code === 'Digit2' && !event.repeat) input.emp = true;
    if (!event.repeat) input.pressedKey = event.code;
  });
  window.addEventListener('keyup', (event) => {
    const name = keys[event.code];
    if (name) input[name] = false;
  });
  canvas.addEventListener('mousedown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.clickX = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.clickY = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.clicked = true;
  });
  return input;
}

/** Clear the one-shot edges after the world has read them. */
export function clearEdges(input) {
  input.smoke = false;
  input.emp = false;
  input.clicked = false;
  input.pressedKey = null;
}
