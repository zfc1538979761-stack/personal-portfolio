import { useEffect, useRef, useState } from 'react';
import { cursorStrength, pointerScale } from './cursorPolicy';
import type { CursorSurface } from './cursorPolicy';
import type { CursorEngine, FluidQuality } from './glowFluid';
import './GlowCursor.css';
import { subscribePageScroll } from './pageScroll';

export function GlowCursor({ suspended = false, enabled = true, quality = 'medium' }: { suspended?: boolean; enabled?: boolean; quality?: FluidQuality }) {
  const root = useRef<HTMLDivElement>(null);
  const canvas = useRef<HTMLCanvasElement>(null);
  const pointer = useRef<HTMLDivElement>(null);
  const externalPause = useRef(suspended);
  const stopCurrent = useRef<(() => void) | null>(null);
  const [eligible, setEligible] = useState(false);
  useEffect(() => {
    const query = matchMedia('(min-width: 761px) and (hover: hover) and (pointer: fine) and (prefers-reduced-motion: no-preference)');
    const update = () => setEligible(query.matches);
    update(); query.addEventListener('change', update);
    return () => query.removeEventListener('change', update);
  }, []);
  useEffect(() => {
    externalPause.current = suspended;
    if (suspended) stopCurrent.current?.();
  }, [suspended]);
  useEffect(() => {
    const element = root.current, surface = canvas.current, arrow = pointer.current;
    if (!eligible || !enabled || !element || !surface || !arrow) return;
    const fluid = element.querySelector<HTMLElement>('.cursor-fluid')!;
    let disposed = false, failed = false, blocked = true, awaitingMove = true, nativeTarget = false;
    let engine: CursorEngine | undefined;
    let starting = false;
    const startFluid = () => {
      if (starting || failed || disposed) return;
      starting = true;
      void import('./glowFluid').then(({ createFluidCursor }) => {
        if (disposed) return;
        try {
          engine = createFluidCursor(surface, fluid, paused, () => {}, unavailable, { quality });
          element.dataset.engine = 'fluid';
        } catch {
          surface.getContext('webgl2')?.getExtension('WEBGL_lose_context')?.loseContext(); unavailable();
        }
      }).catch(unavailable);
    };
    let raf = 0, x = 0, y = 0, pressed = false;
    const html = document.documentElement;
    const paused = () => blocked || awaitingMove || nativeTarget || externalPause.current || document.hidden;
    const stop = () => {
      cancelAnimationFrame(raf); raf = 0;
      awaitingMove = true; pressed = false; nativeTarget = false;
      element.dataset.active = 'false'; fluid.dataset.paused = 'true';
      html.classList.remove('has-custom-cursor'); engine?.stop();
    };
    stopCurrent.current = stop;
    const tick = () => {
      raf = 0;
      if (blocked || awaitingMove || externalPause.current || document.hidden) { stop(); return; }
      const target = document.elementFromPoint(x, y);
      nativeTarget = Boolean(target?.closest('input,textarea,select,[contenteditable]:not([contenteditable="false"]),video,[data-native-cursor]'));
      if (nativeTarget) {
        element.dataset.active = 'false'; fluid.dataset.paused = 'true';
        html.classList.remove('has-custom-cursor'); engine?.stop(); return;
      }
      // These DOM nodes exist before native cursor hiding, including on GL failure.
      // The arrow tip is the actual click position. Only the fluid has inertia.
      arrow.style.transform = `translate3d(${x}px,${y}px,0)`;
      const interactive = Boolean(target?.closest('a[href],button:not(:disabled),[role="button"],[role="tab"],.depth-stage,.media-slide'));
      element.style.setProperty('--pointer-scale', String(pointerScale(interactive, pressed)));
      element.dataset.active = 'true'; html.classList.add('has-custom-cursor');
      let kind: CursorSurface = 'background';
      if (target?.closest('img,video,canvas,.project-image,.depth-stage,.media-frame')) kind = 'media';
      else if (target?.closest('p,h1,h2,h3,a,button,label,.chapter-title,.chapter-subtitle')) kind = 'text';
      element.dataset.surface = kind;
      fluid.style.opacity = String(cursorStrength(kind)); fluid.dataset.paused = 'false';
      startFluid();
    };
    const schedule = () => { if (!raf) raf = requestAnimationFrame(tick); };
    const move = (event: PointerEvent) => {
      if (event.pointerType !== 'mouse' || blocked || externalPause.current || document.hidden) return;
      x = event.clientX; y = event.clientY; awaitingMove = false;
      // The fluid listener sees an eligible move immediately; tick resolves native targets before drawing.
      nativeTarget = false; schedule();
    };
    const down = (event: PointerEvent) => { if (event.pointerType === 'mouse' && event.button === 0 && !paused()) { pressed = true; schedule(); } };
    const up = () => { if (pressed) { pressed = false; schedule(); } };
    const scroll = () => { if (!awaitingMove && !blocked) schedule(); };
    const sync = () => {
      blocked = Boolean(document.querySelector('dialog[open]')) || Boolean(document.fullscreenElement) || document.querySelector('.portfolio-root')?.getAttribute('data-opening') === 'playing';
      if (blocked || document.hidden || externalPause.current) stop();
    };
    const key = (event: KeyboardEvent) => { if (!event.metaKey && !event.ctrlKey && !event.altKey) stop(); };
    const unavailable = () => {
      if (disposed || failed) return;
      failed = true; element.dataset.engine = 'ring-only';
      const old = engine; engine = undefined; old?.dispose();
      fluid.dataset.paused = 'true';
    };
    const lost = (event: Event) => { event.preventDefault(); unavailable(); };
    const observer = new MutationObserver(sync);
    observer.observe(document.body, { subtree: true, attributes: true, childList: true, attributeFilter: ['open', 'data-opening'] });
    sync();
    window.addEventListener('pointermove', move, { passive: true });
    window.addEventListener('pointerdown', down, { passive: true }); window.addEventListener('pointerup', up, { passive: true });
    const unsubscribeScroll = subscribePageScroll(scroll);
    window.addEventListener('pointercancel', stop);
    window.addEventListener('keydown', key); window.addEventListener('blur', stop); window.addEventListener('resize', stop);
    html.addEventListener('pointerleave', stop); document.addEventListener('visibilitychange', sync); document.addEventListener('fullscreenchange', sync);
    surface.addEventListener('webglcontextlost', lost);
    element.dataset.engine = 'loading';
    return () => {
      disposed = true; stop(); observer.disconnect();
      surface.removeEventListener('webglcontextlost', lost); engine?.dispose();
      window.removeEventListener('pointermove', move); window.removeEventListener('pointerdown', down); window.removeEventListener('pointerup', up);
      unsubscribeScroll();
      window.removeEventListener('pointercancel', stop);
      window.removeEventListener('keydown', key); window.removeEventListener('blur', stop); window.removeEventListener('resize', stop);
      html.removeEventListener('pointerleave', stop); document.removeEventListener('visibilitychange', sync); document.removeEventListener('fullscreenchange', sync);
      stopCurrent.current = null;
    };
  }, [eligible, enabled, quality]);
  if (!eligible || !enabled) return null;
  return <div ref={root} className="glow-cursor-overlay" aria-hidden="true" data-active="false" data-quality={quality}>
    <div className="cursor-fluid" data-paused="true"><canvas key={quality} ref={canvas} /></div>
    <div ref={pointer} className="cursor-pointer"><svg className="cursor-arrow" viewBox="0 0 14 19" width="14" height="19"><path d="M .75 .75 L 1.75 18 L 6 13.5 L 13.25 12 Z" /></svg></div>
  </div>;
}
