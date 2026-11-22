// Midnight Vault — everything the player sees, drawn on one canvas: the
// floor, vents, shadows, lasers, loot, the exit, guards and cameras with
// their vision cones, the thief, the HUD (alarm meter, loot, lives, tools),
// and the title / briefing / shop / end screens. Cones are drawn before
// the walls, so a wall reads as blocking the sight it stands in.

import { ALARM, CAMERA, COLORS, FLOOR, GUARD, HUD, LOOT, PLAYER, VIEW } from './config.js';
import { laserOn } from './world.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function drawCone(ctx, x, y, facing, range, halfAngle, fill, edge) {
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.arc(x, y, range, facing - halfAngle, facing + halfAngle);
  ctx.closePath();
  ctx.fillStyle = fill;
  ctx.fill();
  ctx.strokeStyle = edge;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing - halfAngle) * range, y + Math.sin(facing - halfAngle) * range);
  ctx.moveTo(x, y);
  ctx.lineTo(x + Math.cos(facing + halfAngle) * range, y + Math.sin(facing + halfAngle) * range);
  ctx.stroke();
}

function drawButton(ctx, rect, label, sub) {
  ctx.fillStyle = '#2a2f3c';
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
  ctx.fill();
  ctx.strokeStyle = COLORS.loot;
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(label, rect.x + rect.w / 2, rect.y + rect.h / 2 - (sub ? 10 : 0));
  if (sub) {
    ctx.fillStyle = COLORS.dim;
    ctx.font = '15px sans-serif';
    ctx.fillText(sub, rect.x + rect.w / 2, rect.y + rect.h / 2 + 16);
  }
  ctx.textAlign = 'left';
  ctx.textBaseline = 'alphabetic';
}

function centerButton(y, w, h) {
  return { x: (VIEW.width - w) / 2, y, w, h };
}

export function drawWorld(ctx, world) {
  const level = world.level;
  // Floor: quiet checker so movement reads at a glance.
  for (let ty = 0; ty < 11; ty += 1) {
    for (let tx = 0; tx < 20; tx += 1) {
      ctx.fillStyle = (tx + ty) % 2 === 0 ? COLORS.floorA : COLORS.floorB;
      ctx.fillRect(FLOOR.x + tx * 64, FLOOR.y + ty * 64, 64, 64);
    }
  }
  // Vents: purple crawl spaces the watchers cannot see into.
  for (const v of level.vents) {
    ctx.fillStyle = COLORS.vent;
    ctx.fillRect(v.x, v.y, v.w, v.h);
    ctx.strokeStyle = '#7a5fc0';
    ctx.lineWidth = 1;
    for (let x = v.x + 12; x < v.x + v.w; x += 18) {
      ctx.beginPath();
      ctx.moveTo(x, v.y + 5);
      ctx.lineTo(x, v.y + v.h - 5);
      ctx.stroke();
    }
    ctx.fillStyle = '#c9b8f0';
    ctx.font = 'bold 11px sans-serif';
    ctx.fillText('VENT', v.x + 6, v.y + v.h / 2 + 4);
  }
  // Shadows: dark patches where detection crawls.
  for (const s of level.shadows) {
    ctx.fillStyle = COLORS.shadow;
    roundRect(ctx, s.x, s.y, s.w, s.h, 12);
    ctx.fill();
    ctx.fillStyle = '#5a6274';
    ctx.font = '11px sans-serif';
    ctx.fillText('SHADOW', s.x + 8, s.y + 16);
  }
  // Lasers: bright while lit, dim while dark.
  for (const l of world.lasers) {
    const on = laserOn(l, world.time);
    ctx.strokeStyle = on ? COLORS.laserOn : COLORS.laserOff;
    ctx.lineWidth = on ? 4 : 2;
    ctx.beginPath();
    ctx.moveTo(l.x, l.y + l.h / 2);
    ctx.lineTo(l.x + l.w, l.y + l.h / 2);
    ctx.stroke();
    ctx.fillStyle = on ? COLORS.laserOn : COLORS.laserOff;
    ctx.fillRect(l.x - 4, l.y - 6, 8, l.h + 12);
    ctx.fillRect(l.x + l.w - 4, l.y - 6, 8, l.h + 12);
  }
  // Vision cones first, so walls drawn over them read as cover.
  for (const g of world.guards) {
    drawCone(ctx, g.x, g.y, g.facing, GUARD.visionRange, GUARD.visionHalfAngle, COLORS.guardCone, COLORS.guardConeEdge);
  }
  for (const c of world.cameras) {
    if (c.disabledT > 0) continue;
    drawCone(ctx, c.x, c.y, c.facing, CAMERA.range, CAMERA.halfAngle, COLORS.cameraCone, COLORS.cameraConeEdge);
  }
  // Guard patrol paths, faint dotted lines.
  ctx.strokeStyle = 'rgba(154, 161, 178, 0.35)';
  ctx.lineWidth = 1;
  ctx.setLineDash([3, 7]);
  for (const g of world.guards) {
    ctx.beginPath();
    for (let i = 0; i < g.waypoints.length; i += 1) {
      const wp = g.waypoints[i];
      if (i === 0) ctx.moveTo(wp.x, wp.y);
      else ctx.lineTo(wp.x, wp.y);
    }
    ctx.closePath();
    ctx.stroke();
  }
  ctx.setLineDash([]);
  // Walls.
  for (const w of level.walls) {
    ctx.fillStyle = COLORS.wall;
    ctx.fillRect(w.x, w.y, w.w, w.h);
    ctx.strokeStyle = COLORS.wallEdge;
    ctx.lineWidth = 2;
    ctx.strokeRect(w.x + 1, w.y + 1, w.w - 2, w.h - 2);
  }
  // Exit: green when the loot target is met, red and locked until then.
  const exit = level.exit;
  const open = world.levelLoot >= level.target;
  ctx.fillStyle = open ? COLORS.exit : COLORS.exitLocked;
  ctx.fillRect(exit.x, exit.y, exit.w, exit.h);
  ctx.strokeStyle = '#e8e6df';
  ctx.lineWidth = 2;
  ctx.strokeRect(exit.x + 1, exit.y + 1, exit.w - 2, exit.h - 2);
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(open ? 'EXIT' : 'LOCKED', exit.x + exit.w / 2, exit.y + exit.h / 2 + 5);
  ctx.textAlign = 'left';
  // Loot: gold diamonds with their value under them.
  for (const item of world.loot) {
    if (item.taken) continue;
    ctx.fillStyle = COLORS.loot;
    ctx.beginPath();
    ctx.moveTo(item.x, item.y - 12);
    ctx.lineTo(item.x + 11, item.y);
    ctx.lineTo(item.x, item.y + 12);
    ctx.lineTo(item.x - 11, item.y);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = COLORS.lootRing;
    ctx.font = 'bold 13px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('$' + item.w.toLocaleString('en-US'), item.x, item.y + 28);
    ctx.fillText(item.label, item.x, item.y - 20);
    ctx.textAlign = 'left';
    if (world.player.channelLoot === item) {
      ctx.strokeStyle = COLORS.lootRing;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(item.x, item.y, 20, -Math.PI / 2, -Math.PI / 2 + world.player.channelProgress * Math.PI * 2);
      ctx.stroke();
    }
  }
  // Cameras: wall mounts with a lens that follows the sweep.
  for (const c of world.cameras) {
    ctx.fillStyle = c.disabledT > 0 ? '#555c6e' : COLORS.camera;
    ctx.beginPath();
    ctx.arc(c.x, c.y, 9, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = c.disabledT > 0 ? '#333' : '#ffe9a8';
    ctx.beginPath();
    ctx.arc(c.x + Math.cos(c.facing) * 5, c.y + Math.sin(c.facing) * 5, 3, 0, Math.PI * 2);
    ctx.fill();
    if (c.disabledT > 0) {
      ctx.fillStyle = '#e8e6df';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('EMP ' + Math.ceil(c.disabledT) + 's', c.x, c.y - 14);
      ctx.textAlign = 'left';
    }
  }
  // Guards: navy coats, a facing tick, and a detection ring overhead.
  for (const g of world.guards) {
    ctx.fillStyle = COLORS.guard;
    ctx.beginPath();
    ctx.arc(g.x, g.y, GUARD.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = g.mode === 'chase' ? '#ff5a5a' : '#8fa3c8';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.strokeStyle = '#dbe4f5';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(g.x, g.y);
    ctx.lineTo(g.x + Math.cos(g.facing) * (GUARD.radius + 6), g.y + Math.sin(g.facing) * (GUARD.radius + 6));
    ctx.stroke();
    if (g.detection > 0.05) {
      ctx.strokeStyle = g.detection > 0.6 ? '#ff5a5a' : '#f2a93b';
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(g.x, g.y, GUARD.radius + 7, -Math.PI / 2, -Math.PI / 2 + g.detection * Math.PI * 2);
      ctx.stroke();
    }
    if (g.detection > 0.6) {
      ctx.fillStyle = '#ff5a5a';
      ctx.font = 'bold 20px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('!', g.x, g.y - GUARD.radius - 12);
      ctx.textAlign = 'left';
    }
  }
  // The thief: a pale coat with a gold trim, facing tick, smoke when hidden.
  const p = world.player;
  if (p.smokeT > 0) {
    ctx.fillStyle = COLORS.smoke;
    ctx.beginPath();
    ctx.arc(p.x, p.y, 48, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = p.smokeT > 0 ? 0.55 : 1;
  ctx.fillStyle = COLORS.player;
  ctx.beginPath();
  ctx.arc(p.x, p.y, PLAYER.radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = COLORS.playerTrim;
  ctx.lineWidth = 2.5;
  ctx.stroke();
  ctx.strokeStyle = '#22242c';
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + Math.cos(p.facing) * (PLAYER.radius + 5), p.y + Math.sin(p.facing) * (PLAYER.radius + 5));
  ctx.stroke();
  ctx.globalAlpha = 1;
  if (p.sneak) {
    ctx.fillStyle = COLORS.dim;
    ctx.font = '11px sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('sneaking', p.x, p.y + PLAYER.radius + 14);
    ctx.textAlign = 'left';
  }
  // Mouse move target.
  if (p.moveTarget) {
    ctx.strokeStyle = 'rgba(232, 230, 223, 0.7)';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.arc(p.moveTarget.x, p.moveTarget.y, 7, 0, Math.PI * 2);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(p.moveTarget.x - 11, p.moveTarget.y);
    ctx.lineTo(p.moveTarget.x + 11, p.moveTarget.y);
    ctx.moveTo(p.moveTarget.x, p.moveTarget.y - 11);
    ctx.lineTo(p.moveTarget.x, p.moveTarget.y + 11);
    ctx.stroke();
  }
  // Channel hint beside the nearest loot.
  if (!world.player.channelLoot) {
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
    if (nearest && nearestD <= LOOT.grabRadius) {
      ctx.fillStyle = COLORS.lootRing;
      ctx.font = 'bold 15px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText('Hold E to crack it', p.x, p.y - PLAYER.radius - 12);
      ctx.textAlign = 'left';
    }
  }
}

export function drawHud(ctx, world, run) {
  const level = world.level;
  ctx.fillStyle = '#14161d';
  ctx.fillRect(0, 0, VIEW.width, HUD.height);
  ctx.fillStyle = '#2a2f3c';
  ctx.fillRect(0, HUD.height - 2, VIEW.width, 2);
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(level.name, 16, 28);
  ctx.fillStyle = COLORS.dim;
  ctx.font = '14px sans-serif';
  ctx.fillText('Heist ' + (world.levelIndex + 1) + ' of 3', 16, 50);
  // Loot counter.
  ctx.fillStyle = COLORS.loot;
  ctx.font = 'bold 20px sans-serif';
  ctx.fillText(
    '$' + world.levelLoot.toLocaleString('en-US') + ' / $' + level.target.toLocaleString('en-US'),
    300,
    28,
  );
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px sans-serif';
  ctx.fillText('bank $' + world.bank.toLocaleString('en-US') + '  ·  score ' + world.score.toLocaleString('en-US'), 300, 50);
  // Alarm meter.
  const ax = 620;
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('ALARM', ax, 20);
  ctx.fillStyle = '#2a2f3c';
  roundRect(ctx, ax, 26, 260, 22, 6);
  ctx.fill();
  const frac = Math.min(1, world.alarm / ALARM.max);
  ctx.fillStyle = frac < 0.5 ? COLORS.alarmLow : frac < 0.8 ? COLORS.alarmMid : COLORS.alarmHigh;
  if (frac > 0) {
    roundRect(ctx, ax, 26, Math.max(8, 260 * frac), 22, 6);
    ctx.fill();
  }
  ctx.fillStyle = COLORS.text;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText(Math.round(world.alarm) + '%', ax + 268, 43);
  // Lives.
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('LIVES', 940, 20);
  ctx.font = '20px sans-serif';
  ctx.fillStyle = '#e03131';
  ctx.fillText('♥'.repeat(Math.max(0, world.lives)), 940, 46);
  // Tools.
  ctx.fillStyle = COLORS.dim;
  ctx.font = 'bold 13px sans-serif';
  ctx.fillText('TOOLS', 1050, 20);
  ctx.fillStyle = COLORS.text;
  ctx.font = '15px sans-serif';
  ctx.fillText(
    '1 Smoke ×' + world.tools.smoke + '   2 EMP ×' + world.tools.emp + (world.tools.lockpick ? '   Pick ✓' : ''),
    1050,
    44,
  );
  // Timer.
  ctx.fillStyle = COLORS.dim;
  ctx.font = '13px sans-serif';
  ctx.fillText(Math.floor(world.time / 60) + ':' + String(Math.floor(world.time % 60)).padStart(2, '0'), 1220, 44);
  // Controls hint along the floor's bottom edge.
  ctx.fillStyle = 'rgba(154, 161, 178, 0.8)';
  ctx.font = '13px sans-serif';
  ctx.fillText(
    'WASD / arrows move · click to walk there · Shift sneak · hold E to crack loot · 1 smoke · 2 EMP · M mute',
    16,
    VIEW.height - 10,
  );
}

function overlay(ctx) {
  ctx.fillStyle = 'rgba(10, 11, 16, 0.88)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
}

function titleText(ctx, text, y, size, color, bold) {
  ctx.fillStyle = color || COLORS.text;
  ctx.font = (bold ? 'bold ' : '') + size + 'px sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(text, VIEW.width / 2, y);
  ctx.textAlign = 'left';
}

export function drawTitle(ctx) {
  overlay(ctx);
  titleText(ctx, 'MIDNIGHT VAULT', 170, 64, COLORS.loot, true);
  titleText(ctx, 'Three heists. One cat burglar. No alarms, if you are good.', 215, 24, COLORS.dim);
  titleText(ctx, 'You are Wren. Tonight: a gallery, a bank vault, a neon casino.', 270, 20);
  titleText(ctx, 'Read the cones before you move. Crack the loot. Slip out the exit.', 300, 20);
  titleText(ctx, 'Guards patrol · cameras sweep · lasers blink · shadows hide you', 340, 18, COLORS.dim);
  const start = centerButton(400, 320, 64);
  drawButton(ctx, start, 'START THE FIRST HEIST', 'WASD or click to move · Shift sneak · E crack loot');
  titleText(ctx, 'Tools cost loot: smoke bombs, EMP charges, a lockpick — buy between heists.', 510, 16, COLORS.dim);
  return [{ id: 'start', rect: start }];
}

export function drawBrief(ctx, world) {
  overlay(ctx);
  titleText(ctx, world.level.name, 150, 48, COLORS.loot, true);
  titleText(ctx, world.level.sub, 195, 22, COLORS.dim);
  titleText(ctx, 'Lift $' + world.level.target.toLocaleString('en-US') + ' of loot, then reach the green EXIT.', 260, 22);
  titleText(ctx, 'Vents hide you. Shadows slow detection. Lasers trip the alarm.', 295, 20, COLORS.dim);
  titleText(ctx, 'A full alarm means BUSTED. A guard that catches you costs a life.', 330, 20, COLORS.dim);
  const begin = centerButton(400, 320, 64);
  drawButton(ctx, begin, 'BEGIN THE HEIST', 'Enter to start');
  return [{ id: 'begin', rect: begin }];
}

export function drawShop(ctx, run, nextLevel) {
  overlay(ctx);
  titleText(ctx, 'BETWEEN HEISTS', 130, 44, COLORS.loot, true);
  titleText(ctx, 'Bank: $' + run.bank.toLocaleString('en-US') + ' — spend it before the next floor.', 180, 22, COLORS.dim);
  const items = [
    { id: 'smoke', label: 'Smoke bomb ×1', sub: '$300 · vanish for 3s (key 1)', price: 300 },
    { id: 'emp', label: 'EMP charge ×1', sub: '$400 · cameras off 6s (key 2)', price: 400 },
    { id: 'lockpick', label: 'Lockpick', sub: '$500 · crack loot twice as fast', price: 500, once: true },
    { id: 'life', label: 'Extra life', sub: '$800 · one more mistake', price: 800 },
  ];
  const buttons = [];
  let y = 230;
  for (const item of items) {
    const owned = item.id === 'lockpick' && run.tools.lockpick;
    const rect = { x: (VIEW.width - 460) / 2, y, w: 460, h: 56 };
    const can = !owned && run.bank >= item.price;
    ctx.fillStyle = can ? '#2a2f3c' : '#1d212b';
    roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 8);
    ctx.fill();
    ctx.strokeStyle = can ? COLORS.loot : '#3a4152';
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = owned ? COLORS.dim : COLORS.text;
    ctx.font = 'bold 20px sans-serif';
    ctx.fillText(item.label + (owned ? ' — owned' : ''), rect.x + 18, rect.y + 25);
    ctx.fillStyle = COLORS.dim;
    ctx.font = '14px sans-serif';
    ctx.fillText(item.sub, rect.x + 18, rect.y + 46);
    ctx.fillStyle = can ? COLORS.loot : COLORS.dim;
    ctx.font = 'bold 18px sans-serif';
    ctx.textAlign = 'right';
    ctx.fillText(owned ? 'OWNED' : run.bank >= item.price ? 'BUY' : '$' + item.price, rect.x + rect.w - 18, rect.y + 32);
    ctx.textAlign = 'left';
    buttons.push({ id: item.id, rect, price: item.price, can });
    y += 70;
  }
  const next = centerButton(530, 340, 60);
  drawButton(ctx, next, 'CONTINUE TO ' + nextLevel.name.toUpperCase(), 'Heist ' + (nextLevel.index + 1) + ' of 3');
  buttons.push({ id: 'next', rect: next });
  return buttons;
}

export function drawLevelDone(ctx, world) {
  overlay(ctx);
  titleText(ctx, 'CLEAN GETAWAY', 170, 52, COLORS.loot, true);
  titleText(ctx, world.level.name + ' — loot $' + world.levelLoot.toLocaleString('en-US') + ' banked.', 230, 22);
  titleText(
    ctx,
    'Time bonus + ghost bonus are in your score: ' + world.score.toLocaleString('en-US') + '.',
    270,
    20,
    COLORS.dim,
  );
  const next = centerButton(360, 320, 64);
  drawButton(ctx, next, 'NEXT HEIST', 'spend the bank in the shop first');
  return [{ id: 'next', rect: next }];
}

export function drawBusted(ctx, world) {
  overlay(ctx);
  titleText(ctx, 'BUSTED!', 180, 56, COLORS.alarmHigh, true);
  titleText(ctx, 'The alarm hit 100%. The floor locked down around you.', 240, 22);
  titleText(ctx, 'Lives left: ' + world.lives + ' — the same floor, fresh guards.', 280, 20, COLORS.dim);
  const retry = centerButton(360, 320, 64);
  drawButton(ctx, retry, 'TRY THE FLOOR AGAIN', 'Enter to retry');
  return [{ id: 'retry', rect: retry }];
}

export function drawGameOver(ctx, world) {
  overlay(ctx);
  titleText(ctx, 'THE CREW GOT CAUGHT', 180, 52, COLORS.alarmHigh, true);
  titleText(ctx, 'Three strikes and the vault keeps its gold tonight.', 240, 22);
  titleText(ctx, 'Score: ' + world.score.toLocaleString('en-US') + ' · bank: $' + world.bank.toLocaleString('en-US'), 280, 20, COLORS.dim);
  const again = centerButton(360, 320, 64);
  drawButton(ctx, again, 'START OVER', 'Enter to try again');
  return [{ id: 'again', rect: again }];
}

export function drawVictory(ctx, world) {
  overlay(ctx);
  titleText(ctx, 'THE MIDNIGHT VAULT IS YOURS', 160, 48, COLORS.loot, true);
  titleText(ctx, 'Gallery, bank, casino — all three floors, cleaned out.', 220, 22);
  titleText(ctx, 'Final score: ' + world.score.toLocaleString('en-US') + ' · total loot: $' + world.bank.toLocaleString('en-US'), 265, 24);
  titleText(ctx, 'Wren slips into the night. The getaway car is already running.', 310, 20, COLORS.dim);
  const again = centerButton(390, 320, 64);
  drawButton(ctx, again, 'PLAY AGAIN', 'Enter to run it back');
  return [{ id: 'again', rect: again }];
}
