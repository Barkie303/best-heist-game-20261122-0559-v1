// Midnight Vault — the three heist floors. Every floor is data: walls are
// solid rectangles, vents are crawl spaces the watchers cannot see into,
// shadows slow detection, lasers blink on a timer, loot has a dollar value,
// guards walk waypoint loops, cameras sweep. The thief enters at `entry`
// and escapes through `exit` once the loot target is met.
//
// Coordinates live in the floor below the HUD bar (y starts at 64).

export const LEVELS = [
  {
    name: 'The Gilded Gallery',
    sub: 'Heist 1 of 3 — lift the paintings, mind the docent',
    parSeconds: 120,
    target: 2400,
    entry: { x: 70, y: 660 },
    exit: { x: 1170, y: 96, w: 76, h: 52 },
    walls: [
      { x: 300, y: 200, w: 90, h: 60 },
      { x: 700, y: 180, w: 90, h: 60 },
      { x: 500, y: 420, w: 110, h: 60 },
      { x: 950, y: 380, w: 80, h: 120 },
      { x: 180, y: 480, w: 90, h: 60 },
    ],
    vents: [
      { x: 110, y: 100, w: 230, h: 40 },
      { x: 880, y: 640, w: 230, h: 40 },
    ],
    shadows: [
      { x: 420, y: 300, w: 180, h: 90 },
      { x: 850, y: 480, w: 180, h: 100 },
    ],
    lasers: [],
    loot: [
      { x: 345, y: 150, w: 800, label: 'Sunset' },
      { x: 745, y: 140, w: 900, label: 'Vermeer' },
      { x: 555, y: 380, w: 700, label: 'Jade vase' },
      { x: 990, y: 330, w: 1200, label: 'Gold mask' },
    ],
    guards: [
      {
        waypoints: [
          { x: 140, y: 300 },
          { x: 650, y: 300 },
          { x: 650, y: 580 },
          { x: 140, y: 580 },
        ],
      },
      {
        waypoints: [
          { x: 900, y: 200 },
          { x: 1100, y: 200 },
          { x: 1100, y: 550 },
          { x: 900, y: 550 },
        ],
      },
    ],
    cameras: [{ x: 640, y: 92, facing: Math.PI / 2 }],
  },
  {
    name: 'The Iron Vault',
    sub: 'Heist 2 of 3 — the gold is behind the laser door',
    parSeconds: 150,
    target: 3600,
    entry: { x: 70, y: 660 },
    exit: { x: 1170, y: 96, w: 76, h: 52 },
    walls: [
      { x: 250, y: 200, w: 220, h: 50 },
      { x: 700, y: 200, w: 220, h: 50 },
      { x: 480, y: 380, w: 320, h: 140 },
      { x: 150, y: 500, w: 100, h: 60 },
      { x: 1000, y: 480, w: 120, h: 60 },
      { x: 900, y: 90, w: 16, h: 210 },
      { x: 1164, y: 90, w: 16, h: 210 },
      { x: 900, y: 90, w: 280, h: 16 },
    ],
    vents: [
      { x: 110, y: 100, w: 200, h: 40 },
      { x: 620, y: 640, w: 230, h: 40 },
    ],
    shadows: [
      { x: 330, y: 300, w: 190, h: 90 },
      { x: 780, y: 480, w: 190, h: 100 },
    ],
    lasers: [{ x: 996, y: 300, w: 84, h: 10, period: 5, phase: 0 }],
    loot: [
      { x: 320, y: 170, w: 700, label: 'Cash' },
      { x: 780, y: 170, w: 800, label: 'Cash' },
      { x: 540, y: 330, w: 600, label: 'Bonds' },
      { x: 970, y: 150, w: 1500, label: 'Gold bars' },
      { x: 1100, y: 150, w: 1500, label: 'Gold bars' },
      { x: 620, y: 590, w: 500, label: 'Safe' },
    ],
    guards: [
      {
        waypoints: [
          { x: 110, y: 320 },
          { x: 420, y: 320 },
          { x: 420, y: 600 },
          { x: 110, y: 600 },
        ],
      },
      {
        waypoints: [
          { x: 850, y: 330 },
          { x: 850, y: 580 },
          { x: 1150, y: 580 },
          { x: 1150, y: 330 },
        ],
      },
      {
        waypoints: [
          { x: 600, y: 140 },
          { x: 960, y: 140 },
          { x: 960, y: 290 },
          { x: 600, y: 290 },
        ],
      },
    ],
    cameras: [
      { x: 1040, y: 320, facing: Math.PI / 2 },
      { x: 120, y: 120, facing: 0 },
    ],
  },
  {
    name: 'The Neon Casino',
    sub: 'Heist 3 of 3 — clean out the high-roller room',
    parSeconds: 180,
    target: 4500,
    entry: { x: 70, y: 660 },
    exit: { x: 60, y: 96, w: 76, h: 52 },
    walls: [
      { x: 200, y: 180, w: 300, h: 50 },
      { x: 700, y: 180, w: 300, h: 50 },
      { x: 400, y: 400, w: 140, h: 80 },
      { x: 750, y: 420, w: 140, h: 80 },
      { x: 1000, y: 550, w: 180, h: 60 },
      { x: 150, y: 320, w: 90, h: 90 },
    ],
    vents: [
      { x: 110, y: 100, w: 220, h: 40 },
      { x: 900, y: 100, w: 220, h: 40 },
    ],
    shadows: [
      { x: 560, y: 260, w: 180, h: 90 },
      { x: 180, y: 560, w: 190, h: 90 },
      { x: 950, y: 300, w: 170, h: 90 },
    ],
    lasers: [
      { x: 540, y: 500, w: 120, h: 10, period: 4, phase: 0 },
      { x: 900, y: 500, w: 120, h: 10, period: 4, phase: 2 },
    ],
    loot: [
      { x: 250, y: 150, w: 800, label: 'Chips' },
      { x: 750, y: 150, w: 900, label: 'Chips' },
      { x: 470, y: 370, w: 1200, label: 'Diamond' },
      { x: 820, y: 390, w: 1000, label: 'Chips' },
      { x: 1090, y: 520, w: 1500, label: 'High roller' },
      { x: 620, y: 600, w: 600, label: 'Safe' },
    ],
    guards: [
      {
        waypoints: [
          { x: 110, y: 270 },
          { x: 580, y: 270 },
          { x: 580, y: 690 },
          { x: 110, y: 690 },
        ],
      },
      {
        waypoints: [
          { x: 620, y: 270 },
          { x: 940, y: 270 },
          { x: 940, y: 650 },
          { x: 620, y: 650 },
        ],
      },
      {
        waypoints: [
          { x: 1040, y: 150 },
          { x: 1180, y: 150 },
          { x: 1180, y: 420 },
          { x: 1040, y: 420 },
        ],
      },
      {
        waypoints: [
          { x: 300, y: 100 },
          { x: 700, y: 100 },
          { x: 700, y: 160 },
          { x: 300, y: 160 },
        ],
      },
    ],
    cameras: [
      { x: 640, y: 92, facing: Math.PI / 2 },
      { x: 1180, y: 340, facing: Math.PI },
      { x: 120, y: 340, facing: 0 },
    ],
  },
];
