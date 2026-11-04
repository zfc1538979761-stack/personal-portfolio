// Share a single passive listener and at most one notification per frame.
const subscribers = new Set<() => void>();
let frame = 0;
function notify() {
  frame = 0;
  subscribers.forEach(callback => callback());
}
function schedule() {
  if (!frame) frame = requestAnimationFrame(notify);
}
export function subscribePageScroll(callback: () => void) {
  if (!subscribers.size) window.addEventListener('scroll', schedule, { passive: true });
  subscribers.add(callback);
  return () => {
    subscribers.delete(callback);
    if (!subscribers.size) {
      window.removeEventListener('scroll', schedule);
      cancelAnimationFrame(frame); frame = 0;
    }
  };
}
