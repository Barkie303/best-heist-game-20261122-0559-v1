// Midnight Vault — the screenshot scenes behind ?shot=start|play|tools|end.
// Each scene plays the real rules forward from a fresh world for a fixed
// number of steps, steered by a scripted pilot that walks the thief between
// waypoints and cracks a piece of loot at the end, so the frame is what a
// short game really looks like — and the same seed always gives the same
// frame. The cover (start) shows the whole game in one frame: the thief
// crossing a room, a guard's vision cone, a camera, a loot target and the
// alarm meter.

import { STEP } from './config.js';
import { stepWorld } from './world.js';

const EMPTY_INPUT = {
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
};

/** Walk the thief between waypoints, sneaking on the final approach. */
function runPilot(world, waypoints, seconds, crackAtEnd) {
  const steps = Math.round(seconds / STEP);
  let wi = 0;
  for (let i = 0; i < steps; i += 1) {
    const p = world.player;
    if (wi < waypoints.length) {
      const wp = waypoints[wi];
      if (Math.hypot(wp.x - p.x, wp.y - p.y) < 24) wi += 1;
      else p.moveTarget = { x: wp.x, y: wp.y };
    } else {
      p.moveTarget = null;
    }
    const input = { ...EMPTY_INPUT, sneak: wi >= waypoints.length - 1 };
    if (wi >= waypoints.length && crackAtEnd) input.interact = true;
    stepWorld(world, STEP, input);
    if (world.status !== 'play') break;
  }
}

/**
 * Stage the named scene on a fresh world and return the screen to draw over
 * it ('play' for a live floor, 'victory' for the getaway).
 */
export function stageShot(name, world) {
  if (name === 'play') {
    // The Iron Vault: the thief slips toward the vault door, laser blinking,
    // the vault camera sweeping overhead.
    runPilot(
      world,
      [
        { x: 300, y: 620 },
        { x: 600, y: 600 },
        { x: 850, y: 600 },
        { x: 900, y: 450 },
        { x: 960, y: 380 },
      ],
      13,
      false,
    );
    return { screen: 'play' };
  }
  if (name === 'tools') {
    // The gallery again, mid-heist: smoke up, cameras blinded by the EMP.
    runPilot(
      world,
      [
        { x: 300, y: 620 },
        { x: 600, y: 500 },
        { x: 680, y: 520 },
        { x: 700, y: 380 },
      ],
      10,
      false,
    );
    world.player.smokeT = 2.5;
    world.tools.smoke = 2;
    for (const c of world.cameras) c.disabledT = 5;
    return { screen: 'play' };
  }
  if (name === 'end') {
    // The Neon Casino, already won: the thief at the getaway door, the
    // vault emptied, the score tallied.
    runPilot(
      world,
      [
        { x: 300, y: 600 },
        { x: 300, y: 680 },
        { x: 120, y: 680 },
        { x: 120, y: 150 },
        { x: 110, y: 120 },
      ],
      12,
      false,
    );
    world.levelLoot = 6000;
    world.score = 18400;
    world.bank = 14700;
    world.status = 'victory';
    return { screen: 'victory' };
  }
  // start (the cover): the gallery, the thief cracking the jade vase while
  // a guard's cone sweeps past and the camera watches from above.
  runPilot(
    world,
    [
      { x: 350, y: 620 },
      { x: 450, y: 520 },
      { x: 450, y: 360 },
      { x: 540, y: 375 },
    ],
    10,
    true,
  );
  return { screen: 'play' };
}
