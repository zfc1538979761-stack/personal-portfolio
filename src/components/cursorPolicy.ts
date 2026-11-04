export function cursorEligible(width: number, hover: boolean, fine: boolean, reduced: boolean) {
  return width > 760 && hover && fine && !reduced;
}
export type CursorSurface = 'background' | 'text' | 'media' | 'suspended';
export function cursorStrength(surface: CursorSurface) {
  return { background: 1, text: .85, media: .7, suspended: 0 }[surface];
}
export function pointerScale(interactive: boolean, pressed: boolean) { return pressed ? .92 : interactive ? 1.12 : 1; }
export function cursorWithinBudget(baseline: { p95: number; slow: number }, active: { p95: number; slow: number }) {
  return active.p95 - baseline.p95 <= 4 && active.slow - baseline.slow <= 5;
}
