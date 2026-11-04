export function canvasBudget(width: number, height: number, ratio: number, maxPixels: number) {
  const boundedRatio = Math.min(ratio, Math.sqrt(maxPixels / Math.max(1, width * height)));
  return {
    width: Math.max(1, Math.floor(width * boundedRatio)),
    height: Math.max(1, Math.floor(height * boundedRatio)),
    ratio: boundedRatio,
  };
}
export function frameDue(now: number, previous: number, fps: number) {
  return !previous || now - previous >= 1000 / fps - .5;
}
