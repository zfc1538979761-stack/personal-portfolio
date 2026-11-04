import type { CursorEngine } from './glowFluid';

export function createLightCursor(canvas: HTMLCanvasElement, suspended: () => boolean, onFrame: () => void): CursorEngine {
  const ctx = canvas.getContext('2d');
  if (!ctx) return { stop() {}, dispose() {} };
  let raf = 0;
  let point: { x: number; y: number } | null = null;
  let trail: { x: number; y: number; time: number }[] = [];
  const stop = () => {
    cancelAnimationFrame(raf); raf = 0; point = null; trail = [];
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  };
  const resize = () => { stop(); canvas.width = innerWidth; canvas.height = innerHeight; };
  const frame = (now: number) => {
    raf = 0;
    if (suspended() || document.hidden) { stop(); return; }
    onFrame();
    if (point) { trail.push({ ...point, time: now }); point = null; }
    trail = trail.filter(p => now - p.time < 450).slice(-45);
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.strokeStyle = '#b4dbe7'; ctx.shadowColor = '#b4dbe7'; ctx.shadowBlur = 8;
    for (let i = 1; i < trail.length; i++) {
      ctx.globalAlpha = .65 * (1 - (now - trail[i].time) / 450);
      ctx.beginPath(); ctx.moveTo(trail[i - 1].x, trail[i - 1].y);
      ctx.lineTo(trail[i].x, trail[i].y); ctx.stroke();
    }
    const tip = trail.at(-1);
    if (tip) {
      ctx.globalAlpha = .65 * (1 - (now - tip.time) / 450);
      const glow = ctx.createRadialGradient(tip.x, tip.y, 0, tip.x, tip.y, 10);
      glow.addColorStop(0, '#b4dbe790'); glow.addColorStop(1, '#b4dbe700');
      ctx.fillStyle = glow; ctx.fillRect(tip.x - 10, tip.y - 10, 20, 20);
      ctx.fillStyle = '#d5edf5'; ctx.beginPath(); ctx.arc(tip.x, tip.y, 1.5, 0, Math.PI * 2); ctx.fill();
    }
    if (trail.length) raf = requestAnimationFrame(frame);
  };
  const move = (event: PointerEvent) => {
    if (suspended() || event.pointerType !== 'mouse') return;
    point = { x: event.clientX, y: event.clientY };
    if (!raf) raf = requestAnimationFrame(frame);
  };
  resize(); window.addEventListener('resize', resize); window.addEventListener('pointermove', move, { passive: true });
  return { stop, dispose() { stop(); window.removeEventListener('resize', resize); window.removeEventListener('pointermove', move); } };
}
