// Midnight Vault — shared constants for every module of the game.
// One canvas, 1280x720: a 64px HUD bar on top, the heist floor below it.
// All speeds are pixels per second, all times seconds, all money dollars.

export const VIEW = { width: 1280, height: 720 };
export const HUD = { height: 64 };
export const FLOOR = { x: 0, y: 64, width: 1280, height: 656 };

export const STEP = 1 / 60;

export const PLAYER = {
  radius: 13,
  walkSpeed: 168,
  sneakSpeed: 96,
  channelSpeed: 84,
  noiseRadius: 95,
};

export const GUARD = {
  radius: 14,
  patrolSpeed: 72,
  chaseSpeed: 152,
  visionRange: 235,
  visionHalfAngle: (32 * Math.PI) / 180,
  catchDistance: 22,
  chaseSeconds: 5,
  // Detection fills faster up close: rate = (1.6 - dist/range) * fillBase.
  fillBase: 1.25,
  decay: 0.8,
};

export const CAMERA = {
  range: 265,
  halfAngle: (25 * Math.PI) / 180,
  // Alarm points per second while the thief is in the camera's cone.
  alarmRate: 20,
  sweepHalfAngle: (48 * Math.PI) / 180,
  sweepSeconds: 4.2,
};

export const ALARM = {
  max: 100,
  guardSeenRate: 8,
  decay: 5,
  caughtJump: 50,
  laserHit: 20,
};

export const LOOT = { channelSeconds: 0.7, channelWithPick: 0.35, grabRadius: 32 };

export const TOOLS = {
  smokeSeconds: 3,
  empSeconds: 6,
  smokePrice: 300,
  empPrice: 400,
  lockpickPrice: 500,
  lifePrice: 800,
};

export const SHADOW_FACTOR = 0.45;
export const SNEAK_FACTOR = 0.5;
export const VENT_SPEED = 0.7;

export const LIVES_START = 3;

export const COLORS = {
  floorA: '#20242e',
  floorB: '#1b1f28',
  wall: '#3a4152',
  wallEdge: '#565f75',
  vent: '#4b3a6e',
  shadow: '#10131a',
  exit: '#2f9e44',
  exitLocked: '#7a2e2e',
  loot: '#f2c14e',
  lootRing: '#ffe9a8',
  guard: '#31435f',
  guardCone: 'rgba(235, 64, 64, 0.20)',
  guardConeEdge: 'rgba(235, 64, 64, 0.55)',
  camera: '#8a6d1f',
  cameraCone: 'rgba(242, 178, 32, 0.20)',
  cameraConeEdge: 'rgba(242, 178, 32, 0.55)',
  player: '#e8e6df',
  playerTrim: '#f2c14e',
  smoke: 'rgba(200, 200, 210, 0.35)',
  laserOn: '#ff3b30',
  laserOff: '#5a2320',
  alarmLow: '#2f9e44',
  alarmMid: '#f2a93b',
  alarmHigh: '#e03131',
  text: '#e8e6df',
  dim: '#9aa1b2',
};
