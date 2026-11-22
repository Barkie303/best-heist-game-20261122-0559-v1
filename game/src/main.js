// Midnight Vault — boot, screens and the game loop. Screens: title,
// briefing, play, shop (between heists), level done, busted, game over,
// victory. The loop steps the world in fixed 1/60s slices and draws every
// frame. With ?shot=start|play|tools|end in the URL the game instead stages
// one screenshot scene and draws a single frame — that is how the entry's
// screenshots were taken, from the real rules, never composed.

import { STEP, VIEW } from './config.js';
import { LEVELS } from './levels.js';
import { createWorld, stepWorld } from './world.js';
import { clearEdges, createInput } from './input.js';
import { createAudio } from './audio.js';
import {
  drawBusted,
  drawBrief,
  drawGameOver,
  drawHud,
  drawLevelDone,
  drawShop,
  drawTitle,
  drawVictory,
  drawWorld,
} from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
const statusEl = document.getElementById('status');
canvas.width = VIEW.width;
canvas.height = VIEW.height;

const audio = createAudio();
const input = createInput(canvas);

const run = {
  levelIndex: 0,
  lives: 3,
  bank: 0,
  score: 0,
  tools: { smoke: 1, emp: 1, lockpick: false },
};

let screen = 'title';
let world = null;
let buttons = [];

function freshRun() {
  run.levelIndex = 0;
  run.lives = 3;
  run.bank = 0;
  run.score = 0;
  run.tools = { smoke: 1, emp: 1, lockpick: false };
}

function openBrief() {
  world = createWorld(run.levelIndex, run);
  screen = 'brief';
}

function startPlay() {
  screen = 'play';
}

function openShop() {
  screen = 'shop';
}

function nextLevel() {
  run.levelIndex += 1;
  run.bank = world.bank;
  run.score = world.score;
  run.tools = { ...world.tools };
  run.lives = world.lives;
  openBrief();
}

function retryLevel() {
  world = createWorld(run.levelIndex, run);
  screen = 'play';
}

function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

function buyTool(id, price) {
  if (run.bank < price) return;
  if (id === 'smoke') run.tools.smoke += 1;
  else if (id === 'emp') run.tools.emp += 1;
  else if (id === 'lockpick') {
    if (run.tools.lockpick) return;
    run.tools.lockpick = true;
  } else if (id === 'life') {
    run.lives += 1;
  } else {
    return;
  }
  run.bank -= price;
  audio.play('click');
}

function clickButton(id) {
  if (screen === 'title' && id === 'start') {
    freshRun();
    openBrief();
  } else if (screen === 'brief' && id === 'begin') {
    startPlay();
  } else if (screen === 'shop') {
    if (id === 'next') {
      nextLevel();
    } else {
      const prices = { smoke: 300, emp: 400, lockpick: 500, life: 800 };
      if (prices[id] !== undefined) buyTool(id, prices[id]);
    }
  } else if (screen === 'leveldone' && id === 'next') {
    run.bank = world.bank;
    run.score = world.score;
    run.tools = { ...world.tools };
    run.lives = world.lives;
    openShop();
  } else if (screen === 'busted' && id === 'retry') {
    retryLevel();
  } else if ((screen === 'gameover' || screen === 'victory') && id === 'again') {
    freshRun();
    screen = 'title';
  }
}

function handleClick() {
  if (!input.clicked || input.clickX === null) return;
  for (const b of buttons) {
    if (pointInRect(input.clickX, input.clickY, b.rect)) {
      if (b.can === false) return;
      clickButton(b.id);
      return;
    }
  }
}

function handleKey() {
  if (input.pressedKey === 'KeyM') {
    audio.muted = !audio.muted;
  }
  if (input.pressedKey !== 'Enter') return;
  if (screen === 'title') clickButton('start');
  else if (screen === 'brief') clickButton('begin');
  else if (screen === 'leveldone') clickButton('next');
  else if (screen === 'busted') clickButton('retry');
  else if (screen === 'gameover' || screen === 'victory') clickButton('again');
}

function announce(text) {
  if (statusEl) statusEl.textContent = text;
}

function draw() {
  ctx.clearRect(0, 0, VIEW.width, VIEW.height);
  buttons = [];
  if (screen === 'title') {
    buttons = drawTitle(ctx);
    return;
  }
  if (!world) return;
  drawWorld(ctx, world);
  drawHud(ctx, world, run);
  if (screen === 'brief') buttons = drawBrief(ctx, world);
  else if (screen === 'shop') buttons = drawShop(ctx, run, LEVELS[run.levelIndex + 1] ? { ...LEVELS[run.levelIndex + 1], index: run.levelIndex + 1 } : LEVELS[0]);
  else if (screen === 'leveldone') buttons = drawLevelDone(ctx, world);
  else if (screen === 'busted') buttons = drawBusted(ctx, world);
  else if (screen === 'gameover') buttons = drawGameOver(ctx, world);
  else if (screen === 'victory') buttons = drawVictory(ctx, world);
}

function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.1, (now - frame.last) / 1000 || 0);
  frame.last = now;
  audio.ensure();
  handleKey();
  if (screen !== 'play') handleClick();
  if (screen === 'play' && world) {
    frame.acc = (frame.acc || 0) + dt;
    while (frame.acc >= STEP) {
      stepWorld(world, STEP, input);
      for (const event of world.events) audio.play(event);
      frame.acc -= STEP;
      if (world.status === 'leveldone') {
        run.bank = world.bank;
        run.score = world.score;
        screen = 'leveldone';
        announce('Clean getaway. ' + world.level.name + ' done.');
        break;
      }
      if (world.status === 'victory') {
        run.bank = world.bank;
        run.score = world.score;
        screen = 'victory';
        announce('The Midnight Vault is yours. Final score ' + world.score + '.');
        break;
      }
      if (world.status === 'busted') {
        run.lives = world.lives - 1;
        if (run.lives <= 0) {
          screen = 'gameover';
          announce('Busted, and out of lives.');
        } else {
          screen = 'busted';
          announce('Busted. Lives left: ' + run.lives + '.');
        }
        break;
      }
      if (world.status === 'gameover') {
        screen = 'gameover';
        announce('The crew got caught.');
        break;
      }
    }
  }
  clearEdges(input);
  draw();
}
frame.last = 0;
frame.acc = 0;

// Screenshot mode: stage one scene, draw one frame, stop.
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
if (shot) {
  const shotLevel = { play: 1, end: 2, tools: 0, start: 0 }[shot] ?? 0;
  run.levelIndex = shotLevel;
  world = createWorld(shotLevel, { lives: 3, bank: 0, score: 0, tools: { smoke: 1, emp: 1, lockpick: false } });
  const staged = stageShot(shot, world);
  screen = staged.screen;
  draw();
  window.__shotDone = true;
} else {
  requestAnimationFrame(frame);
}
