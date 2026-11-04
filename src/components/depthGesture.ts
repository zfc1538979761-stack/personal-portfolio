export function depthDragTarget(index: number, count: number, distance: number, velocity: number, width: number) {
  const threshold = Math.max(50, Math.min(120, width * .12));
  const flick = Math.abs(velocity) > .45 && Math.abs(distance) > 12 && Math.sign(velocity) === Math.sign(distance);
  if (Math.abs(distance) < threshold && !flick) return index;
  return Math.max(0, Math.min(count - 1, index + (distance < 0 ? 1 : -1)));
}
export function depthSettleDuration(distance: number, width: number) {
  return Math.max(.12, Math.min(.42, .42 * (1 - Math.min(1, Math.abs(distance) / (width * .4)))));
}
