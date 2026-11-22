// Midnight Vault — vision helpers: is a point inside a watcher cone, and
// does a straight line between two points cross any wall? Line of sight is
// sampled along the segment every few pixels, which is cheap, exact enough
// for a tile-free floor, and fully deterministic.

export function angleTo(fromX, fromY, toX, toY) {
  return Math.atan2(toY - fromY, toX - fromX);
}

export function angleDiff(a, b) {
  let d = a - b;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return d;
}

export function pointInRect(x, y, rect) {
  return x >= rect.x && x <= rect.x + rect.w && y >= rect.y && y <= rect.y + rect.h;
}

export function pointInAnyRect(x, y, rects) {
  for (let i = 0; i < rects.length; i += 1) {
    if (pointInRect(x, y, rects[i])) return true;
  }
  return false;
}

/** True when nothing solid stands between (x0,y0) and (x1,y1). */
export function hasLineOfSight(x0, y0, x1, y1, walls) {
  const dx = x1 - x0;
  const dy = y1 - y0;
  const dist = Math.hypot(dx, dy);
  const steps = Math.max(1, Math.ceil(dist / 6));
  for (let i = 1; i < steps; i += 1) {
    const t = i / steps;
    if (pointInAnyRect(x0 + dx * t, y0 + dy * t, walls)) return false;
  }
  return true;
}

/**
 * True when the target sits inside the watcher's cone (range, facing, half
 * angle) and the watcher can actually see it through the walls.
 */
export function inVisionCone(wx, wy, facing, range, halfAngle, tx, ty, walls) {
  const dx = tx - wx;
  const dy = ty - wy;
  const dist = Math.hypot(dx, dy);
  if (dist > range) return false;
  if (dist < 1) return true;
  if (Math.abs(angleDiff(Math.atan2(dy, dx), facing)) > halfAngle) return false;
  return hasLineOfSight(wx, wy, tx, ty, walls);
}
