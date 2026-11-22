// Midnight Vault — the heist simulation, pure logic with no DOM in it, so a
// headless test can run it in Node. One fixed step (1/60s) moves the thief,
// patrols the guards, sweeps the cameras, fills detection and the alarm,
// and decides win, bust and game over. The same seed always replays the
// same run: patrols are fixed waypoints, lasers blink on a fixed timer.

import { ALARM, CAMERA, FLOOR, GUARD, LOOT, PLAYER, SHADOW_FACTOR, SNEAK_FACTOR, STEP, TOOLS, VENT_SPEED } from './config.js';
import { LEVELS as LEVEL_DATA } from './levels.js';
import { angleDiff, angleTo, hasLineOfSight, inVisionCone, pointInAnyRect } from './vision.js';

export { STEP };

export function createWorld(levelIndex, carry) {
  const level = LEVEL_DATA[levelIndex];
  const tools = carry && carry.tools ? { ...carry.tools } : { smoke: 1, emp: 1, lockpick: false };
  return {
    levelIndex,
    level,
    time: 0,
    lives: carry && carry.lives !== undefined ? carry.lives : 3,
    bank: carry && carry.bank ? carry.bank : 0,
    score: carry && carry.score ? carry.score : 0,
    tools,
    player: {
      x: level.entry.x,
      y: level.entry.y,
      facing: 0,
      sneak: false,
      smokeT: 0,
      moveTarget: null,
      channelLoot: null,
      channelProgress: 0,
    },
    guards: level.guards.map((g) => ({
      waypoints: g.waypoints,
      x: g.waypoints[0].x,
      y: g.waypoints[0].y,
      facing: angleTo(g.waypoints[0].x, g.waypoints[0].y, g.waypoints[1].x, g.waypoints[1].y),
      wp: 1,
      detection: 0,
      mode: 'patrol',
      chaseT: 0,
      lastSeen: null,
      stuck: 0,
    })),
    cameras: level.cameras.map((c) => ({
      x: c.x,
      y: c.y,
      baseFacing: c.facing,
      facing: c.facing,
      disabledT: 0,
      seen: false,
    })),
    loot: level.loot.map((l) => ({ ...l, taken: false })),
    lasers: level.lasers.map((l) => ({ ...l, cool: 0 })),
    alarm: 0,
    levelLoot: 0,
    status: 'play',
    ghost: true,
    spotted: false,
    events: [],
  };
}

export function isInVent(world, x, y) {
  return pointInAnyRect(x, y, world.level.vents);
}

export function isInShadow(world, x, y) {
  return pointInAnyRect(x, y, world.level.shadows);
}

export function laserOn(laser, time) {
  return ((time + laser.phase) % laser.period) < laser.period / 2;
}

/** Move a circle by (dx, dy), sliding along walls, staying on the floor. */
function moveCircle(world, entity, dx, dy) {
  const r = entity.radius || PLAYER.radius;
  const walls = world.level.walls;
  const blocked = (x, y) =>
    x - r < FLOOR.x ||
    x + r > FLOOR.x + FLOOR.width ||
    y - r < FLOOR.y ||
    y + r > FLOOR.y + FLOOR.height ||
    walls.some((w) => x + r > w.x && x - r < w.x + w.w && y + r > w.y && y - r < w.y + w.h);
  if (!blocked(entity.x + dx, entity.y)) entity.x += dx;
  if (!blocked(entity.x, entity.y + dy)) entity.y += dy;
}

function guardSeesPlayer(world, guard) {
  const p = world.player;
  if (p.smokeT > 0 || isInVent(world, p.x, p.y)) return 0;
  if (!inVisionCone(guard.x, guard.y, guard.facing, GUARD.visionRange, GUARD.visionHalfAngle, p.x, p.y, world.level.walls)) return 0;
  const dist = Math.hypot(p.x - guard.x, p.y - guard.y);
  let rate = (1.6 - dist / GUARD.visionRange) * GUARD.fillBase;
  if (p.sneak) rate *= SNEAK_FACTOR;
  if (isInShadow(world, p.x, p.y)) rate *= SHADOW_FACTOR;
  return Math.max(0, rate);
}

function cameraSeesPlayer(world, camera) {
  const p = world.player;
  if (camera.disabledT > 0 || p.smokeT > 0 || isInVent(world, p.x, p.y)) return false;
  if (!inVisionCone(camera.x, camera.y, camera.facing, CAMERA.range, CAMERA.halfAngle, p.x, p.y, world.level.walls)) return false;
  return true;
}

function resetGuards(world) {
  for (const g of world.guards) {
    g.x = g.waypoints[0].x;
    g.y = g.waypoints[0].y;
    g.facing = angleTo(g.waypoints[0].x, g.waypoints[0].y, g.waypoints[1].x, g.waypoints[1].y);
    g.wp = 1;
    g.detection = 0;
    g.mode = 'patrol';
    g.chaseT = 0;
    g.lastSeen = null;
  }
}

function onCaught(world) {
  world.lives -= 1;
  world.events.push('caught');
  world.ghost = false;
  if (world.lives <= 0) {
    world.status = 'gameover';
    return;
  }
  world.alarm = Math.max(world.alarm, ALARM.caughtJump);
  world.player.x = world.level.entry.x;
  world.player.y = world.level.entry.y;
  world.player.moveTarget = null;
  world.player.channelLoot = null;
  world.player.channelProgress = 0;
  resetGuards(world);
}

/**
 * Advance the world one fixed step. `input` is {up,down,left,right,sneak,
 * interact,smoke,emp,clickX,clickY,clicked} — smoke/emp/clicked are edges,
 * the rest are held states. Returns nothing; read world.status and
 * world.events after the call.
 */
export function stepWorld(world, dt, input) {
  if (world.status !== 'play') return;
  world.events.length = 0;
  world.time += dt;
  const p = world.player;
  const level = world.level;

  if (p.smokeT > 0) p.smokeT -= dt;
  for (const c of world.cameras) if (c.disabledT > 0) c.disabledT -= dt;
  for (const l of world.lasers) if (l.cool > 0) l.cool -= dt;

  // Tools are edges: one press, one use.
  if (input.smoke && world.tools.smoke > 0 && p.smokeT <= 0) {
    world.tools.smoke -= 1;
    p.smokeT = TOOLS.smokeSeconds;
    world.events.push('smoke');
  }
  if (input.emp && world.tools.emp > 0) {
    world.tools.emp -= 1;
    for (const c of world.cameras) c.disabledT = TOOLS.empSeconds;
    world.events.push('emp');
  }

  // --- Move the thief: keys win over a mouse target. ---
  let mx = 0;
  let my = 0;
  if (input.left) mx -= 1;
  if (input.right) mx += 1;
  if (input.up) my -= 1;
  if (input.down) my += 1;
  if (input.clicked && input.clickX !== null) {
    p.moveTarget = { x: input.clickX, y: input.clickY };
  }
  if (mx === 0 && my === 0 && p.moveTarget) {
    const dx = p.moveTarget.x - p.x;
    const dy = p.moveTarget.y - p.y;
    const d = Math.hypot(dx, dy);
    if (d < 8) {
      p.moveTarget = null;
    } else {
      mx = dx / d;
      my = dy / d;
    }
  }
  p.sneak = !!input.sneak;
  const channeling = p.channelLoot !== null;
  let speed = p.sneak ? PLAYER.sneakSpeed : PLAYER.walkSpeed;
  if (channeling) speed = PLAYER.channelSpeed;
  if (isInVent(world, p.x, p.y)) speed *= VENT_SPEED;
  if (mx !== 0 || my !== 0) {
    const len = Math.hypot(mx, my) || 1;
    const nx = (mx / len) * speed * dt;
    const ny = (my / len) * speed * dt;
    const walls = level.walls;
    const blocked = (x, y) =>
      x - PLAYER.radius < FLOOR.x ||
      x + PLAYER.radius > FLOOR.x + FLOOR.width ||
      y - PLAYER.radius < FLOOR.y ||
      y + PLAYER.radius > FLOOR.y + FLOOR.height ||
      walls.some((w) => x + PLAYER.radius > w.x && x - PLAYER.radius < w.x + w.w && y + PLAYER.radius > w.y && y - PLAYER.radius < w.y + w.h);
    if (!blocked(p.x + nx, p.y)) p.x += nx;
    if (!blocked(p.x, p.y + ny)) p.y += ny;
    p.facing = Math.atan2(my / len, mx / len);
    // Walking loud: nearby guards turn toward the noise.
    if (!p.sneak) {
      for (const g of world.guards) {
        if (g.mode === 'patrol' && Math.hypot(g.x - p.x, g.y - p.y) < PLAYER.noiseRadius) {
          g.facing = angleTo(g.x, g.y, p.x, p.y);
          g.detection = Math.min(1, g.detection + 0.25 * dt);
        }
      }
    }
  }

  // --- Loot: hold E beside a piece to crack it open. ---
  let nearest = null;
  let nearestD = Infinity;
  for (const item of world.loot) {
    if (item.taken) continue;
    const d = Math.hypot(item.x - p.x, item.y - p.y);
    if (d < nearestD) {
      nearestD = d;
      nearest = item;
    }
  }
  if (input.interact && nearest && nearestD <= LOOT.grabRadius) {
    if (p.channelLoot !== nearest) {
      p.channelLoot = nearest;
      p.channelProgress = 0;
    }
    const rate = world.tools.lockpick ? 1 / LOOT.channelWithPick : 1 / LOOT.channelSeconds;
    p.channelProgress += rate * dt;
    if (p.channelProgress >= 1) {
      nearest.taken = true;
      world.levelLoot += nearest.w;
      world.events.push('pickup');
      p.channelLoot = null;
      p.channelProgress = 0;
    }
  } else {
    p.channelLoot = null;
    p.channelProgress = 0;
  }

  // --- Guards: patrol, notice, chase, catch. ---
  world.spotted = false;
  for (const g of world.guards) {
    const seen = guardSeesPlayer(world, g);
    if (seen > 0) {
      g.detection = Math.min(1, g.detection + seen * dt);
      g.lastSeen = { x: p.x, y: p.y };
      world.spotted = true;
      if (g.detection > 0.5) {
        world.alarm = Math.min(ALARM.max, world.alarm + ALARM.guardSeenRate * dt);
        world.ghost = false;
      }
      if (g.detection >= 1 && g.mode !== 'chase') {
        g.mode = 'chase';
        g.chaseT = GUARD.chaseSeconds;
        world.events.push('spotted');
      }
    } else {
      g.detection = Math.max(0, g.detection - GUARD.decay * dt);
    }
    if (g.mode === 'chase') {
      g.chaseT -= dt;
      const target = g.lastSeen || { x: p.x, y: p.y };
      const dx = target.x - g.x;
      const dy = target.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d > 4) {
        const stepLen = GUARD.chaseSpeed * dt;
        const stepX = (dx / d) * stepLen;
        const stepY = (dy / d) * stepLen;
        const probe = { x: g.x, y: g.y, radius: GUARD.radius };
        moveCircle(world, probe, stepX, stepY);
        g.x = probe.x;
        g.y = probe.y;
        g.facing = Math.atan2(dy, dx);
      }
      if (Math.hypot(p.x - g.x, p.y - g.y) < GUARD.catchDistance && p.smokeT <= 0) {
        onCaught(world);
        return;
      }
      if (g.chaseT <= 0) {
        g.mode = 'patrol';
        g.detection = 0.4;
      }
    } else {
      const wp = g.waypoints[g.wp];
      const dx = wp.x - g.x;
      const dy = wp.y - g.y;
      const d = Math.hypot(dx, dy);
      if (d < 6) {
        g.wp = (g.wp + 1) % g.waypoints.length;
        g.stuck = 0;
      } else {
        const beforeX = g.x;
        const beforeY = g.y;
        const stepLen = GUARD.patrolSpeed * dt;
        const stepX = (dx / d) * stepLen;
        const stepY = (dy / d) * stepLen;
        const probe = { x: g.x, y: g.y, radius: GUARD.radius };
        moveCircle(world, probe, stepX, stepY);
        g.x = probe.x;
        g.y = probe.y;
        g.facing = Math.atan2(dy, dx);
        // A guard wedged against a wall (a patrol leg that clips a corner)
        // skips to its next waypoint instead of pushing forever: a frozen
        // guard would stare at one spot and break the game.
        if (Math.hypot(g.x - beforeX, g.y - beforeY) < 0.5) {
          g.stuck += dt;
          if (g.stuck > 1) {
            g.wp = (g.wp + 1) % g.waypoints.length;
            g.stuck = 0;
          }
        } else {
          g.stuck = 0;
        }
      }
    }
  }

  // --- Cameras: sweep, and feed the alarm while they see the thief. ---
  for (const c of world.cameras) {
    c.facing =
      c.baseFacing +
      Math.sin((world.time * Math.PI * 2) / CAMERA.sweepSeconds) * CAMERA.sweepHalfAngle;
    c.seen = cameraSeesPlayer(world, c);
    if (c.seen) {
      world.spotted = true;
      world.ghost = false;
      let rate = CAMERA.alarmRate;
      if (p.sneak) rate *= SNEAK_FACTOR;
      if (isInShadow(world, p.x, p.y)) rate *= SHADOW_FACTOR;
      world.alarm = Math.min(ALARM.max, world.alarm + rate * dt);
    }
  }

  // --- Lasers: crossing a lit beam trips the alarm. ---
  for (const l of world.lasers) {
    if (laserOn(l, world.time) && l.cool <= 0 && pointInAnyRect(p.x, p.y, [l])) {
      world.alarm = Math.min(ALARM.max, world.alarm + ALARM.laserHit);
      l.cool = 1;
      world.ghost = false;
      world.events.push('laser');
    }
  }

  // --- Alarm: decays while nobody sees the thief; full means busted. ---
  if (!world.spotted) {
    world.alarm = Math.max(0, world.alarm - ALARM.decay * dt);
  }
  if (world.alarm >= ALARM.max) {
    world.status = 'busted';
    world.events.push('busted');
    return;
  }

  // --- Exit: open once the loot target is met. ---
  const exit = level.exit;
  if (
    world.levelLoot >= level.target &&
    p.x > exit.x &&
    p.x < exit.x + exit.w &&
    p.y > exit.y &&
    p.y < exit.y + exit.h
  ) {
    const timeBonus = Math.max(0, Math.round((level.parSeconds - world.time) * 10));
    const ghostBonus = world.ghost ? 500 : 0;
    world.score += world.levelLoot + timeBonus + ghostBonus;
    world.bank += world.levelLoot;
    world.status = world.levelIndex >= LEVEL_DATA.length - 1 ? 'victory' : 'leveldone';
    world.events.push(world.status === 'victory' ? 'victory' : 'leveldone');
  }
}
