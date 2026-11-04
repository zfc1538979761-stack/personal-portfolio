import assert from 'node:assert/strict';
import { depthDragTarget, depthSettleDuration } from '../src/components/depthGesture.ts';
assert.equal(depthDragTarget(1, 6, -130, -.1, 900), 2);
assert.equal(depthDragTarget(1, 6, 130, .1, 900), 0);
assert.equal(depthDragTarget(1, 6, -30, -.1, 900), 1);
assert.equal(depthDragTarget(1, 6, -30, -.8, 900), 2);
assert.equal(depthDragTarget(1, 6, -30, .8, 900), 1);
assert.equal(depthDragTarget(0, 6, 140, .9, 900), 0);
assert.equal(depthDragTarget(5, 6, -140, -.9, 900), 5);
for (const distance of [0, 20, 80, 200, 2000]) {
  const duration = depthSettleDuration(distance, 900);
  assert.ok(duration >= .12 && duration <= .42);
}
console.log('PASS: drag distance, directional flick, boundaries, bounded settling.');
