// Fixed natural-ratio foregrounds and independent cropped depth previews.
import { useEffect, useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent, PointerEvent } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import type { ImageMedia } from "../types";
import { Arrow, Plus } from "./Icons";
import { ImageLightbox } from "./MediaGallery";
import { depthLayout } from "./depthLayout";
import { depthDragTarget, depthSettleDuration } from "./depthGesture";
import { preloadChapterImage } from "./chapterImage";
import { ChapterPhotoStage } from "./ChapterPhotoStage";
import { useNearViewport } from "./useNearViewport";
import "./DepthCarousel.css";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
type Props = { items: ImageMedia[]; label: string };
type Phase = "idle" | "loading" | "animating" | "dragging" | "error";
type Gesture = {
  x: number; y: number; lastX: number; lastTime: number; velocity: number;
  moved: boolean; from: number; dx: number; baseX: number; baseRotation: number;
};
const frontPose = { x: -32, y: 0, z: 0, rotationY: 0, scale: 1, opacity: 1 };

export function DepthCarousel({ items, label }: Props) {
  const [active, setActive] = useState(0);
  const [ready, setReady] = useState(() => new Set<number>());
  const [phase, setPhase] = useState<Phase>("idle");
  const [zoom, setZoom] = useState(false);
  const stageRef = useRef<HTMLDivElement>(null);
  const near = useNearViewport(stageRef);
  const cards = useRef<(HTMLButtonElement | null)[]>([]);
  const previews = useRef<(HTMLButtonElement | null)[]>([]);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const dimensions = useRef<ReturnType<typeof depthLayout>[]>([]);
  const activeIndex = useRef(0);
  const desiredIndex = useRef(0);
  const generation = useRef(0);
  const animationId = useRef(0);
  const alive = useRef(false);
  const readyIndices = useRef(new Set<number>());
  const requests = useRef(new Map<number, { controller: AbortController; promise: Promise<void> }>());
  const gesture = useRef<Gesture | null>(null);
  const dragFrame = useRef(0);
  const suppressClickUntil = useRef(0);
  const reduce = useSyncExternalStore(subscribeMotion, readMotion, () => true);
  const current = items[active];

  const ensure = (index: number): Promise<void> => {
    const pending = requests.current.get(index);
    if (pending) return pending.promise;
    const controller = new AbortController();
    const promise = preloadChapterImage(items[index].displaySrc ?? items[index].src, controller.signal).catch((error) => {
      if (requests.current.get(index)?.controller === controller) requests.current.delete(index);
      throw error;
    });
    requests.current.set(index, { controller, promise });
    return promise;
  };
  const markReady = (index: number) => {
    if (readyIndices.current.has(index)) return;
    readyIndices.current.add(index);
    setReady((previous) => new Set([...previous, index]));
  };
  const stop = () => {
    animationId.current++;
    timeline.current?.kill();
    timeline.current = null;
  };
  const previewPose = (index: number, target: number) => {
    const rank = index - target;
    const layout = dimensions.current[target];
    const height = (layout?.stageHeight ?? 610) - 50;
    return {
      x: -32 + (layout?.cardWidth ?? 400) / 2 - 2 + (rank - 1) * 46,
      y: rank * -6, z: reduce ? 0 : -70 * Math.max(0, rank),
      rotationY: reduce ? 0 : 10,
      scaleX: 1 - Math.max(0, rank) * .015,
      scaleY: ((layout?.cardHeight ?? height) / height) * (1 - Math.max(0, rank) * .035),
      opacity: rank >= 1 && rank <= 3 && readyIndices.current.has(index) ? 1 : 0,
    };
  };
  const settle = () => {
    const target = activeIndex.current;
    cards.current.forEach((card, index) => {
      if (!card) return;
      gsap.set(card, { ...frontPose, opacity: index === target ? 1 : 0, zIndex: index === target ? 30 : 20,
        pointerEvents: index === target ? "auto" : "none", willChange: "auto" });
    });
    previews.current.forEach((preview, index) => {
      if (!preview) return;
      const pose = previewPose(index, target);
      gsap.set(preview, { ...pose, zIndex: 15 - (index - target), pointerEvents: pose.opacity ? "auto" : "none", willChange: "auto" });
    });
  };

  useLayoutEffect(() => {
    const stage = stageRef.current;
    if (!stage) return;
    let width = 0;
    let height = 0;
    const resize = () => {
      if (stage.clientWidth === width && window.innerHeight === height) return;
      width = stage.clientWidth;
      height = window.innerHeight;
      stop();
      gesture.current = null;
      cancelAnimationFrame(dragFrame.current);
      dimensions.current = items.map((item) => depthLayout(width, height, item.width, item.height));
      stage.style.height = `${dimensions.current[0].stageHeight}px`;
      cards.current.forEach((card, index) => {
        if (card) gsap.set(card, { width: dimensions.current[index].cardWidth, height: dimensions.current[index].cardHeight,
          xPercent: -50, yPercent: -50 });
      });
      previews.current.forEach((preview) => {
        if (preview) gsap.set(preview, { width: 68, height: dimensions.current[0].stageHeight - 50, xPercent: -50, yPercent: -50 });
      });
      settle();
      setPhase((value) => value === "loading" || value === "error" ? value : "idle");
    };
    resize();
    const observer = new ResizeObserver(resize);
    observer.observe(stage);
    window.addEventListener("resize", resize);
    return () => { observer.disconnect(); window.removeEventListener("resize", resize); stop(); };
    // Dimensions change only on viewport resize, never on photo selection.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, reduce]);

  useLayoutEffect(() => {
    // Newly decoded images stay mounted until this destination unmounts.
    if (!timeline.current && !gesture.current?.moved) settle();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    alive.current = true;
    const pending = requests.current;
    return () => {
      alive.current = false;
      // Async request counter, not a DOM ref captured by this effect.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      stop();
      cancelAnimationFrame(dragFrame.current);
      pending.forEach(({ controller }) => controller.abort());
      pending.clear();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!near) return;
    const neighborhood = [active - 1, active, active + 1, active + 2, active + 3].filter((index) => index >= 0 && index < items.length);
    neighborhood.forEach((index) => {
      void ensure(index).then(() => { if (alive.current) markReady(index); }).catch(() => {
        if (alive.current && index === desiredIndex.current) setPhase('error');
      });
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, items, near]);

  const animateTo = (target: number, duration: number) => {
    const old = activeIndex.current;
    const direction = Math.sign(target - old) || 1;
    stop();
    const id = animationId.current;
    activeIndex.current = target;
    setActive(target);
    setPhase("animating");
    const incoming = cards.current[target];
    if (!incoming) return;
    if (reduce) { settle(); setPhase("idle"); return; }
    if (Number(gsap.getProperty(incoming, "opacity")) < .001 && target !== old) {
      gsap.set(incoming, { x: -32 + direction * 90, y: 0, z: reduce ? 0 : -160,
        rotationY: reduce ? 0 : -10 * direction, scale: .94, opacity: 0 });
    }
    gsap.set(incoming, { zIndex: 40, pointerEvents: "auto" });
    const seconds = reduce ? 0 : duration;
    const tl = gsap.timeline({ onComplete: () => {
      if (!alive.current || id !== animationId.current) return;
      timeline.current = null;
      settle(); setPhase((value) => value === "loading" || value === "error" ? value : "idle");
    } });
    timeline.current = tl;
    cards.current.forEach((card, index) => {
      if (!card || index === target) return;
      gsap.set(card, { pointerEvents: "none" });
      if (Number(gsap.getProperty(card, "opacity")) > .001) {
        gsap.set(card, { willChange: "transform,opacity" });
        tl.to(card, { x: -32 - direction * 120, z: reduce ? 0 : -100,
          rotationY: reduce ? 0 : 7 * direction, scale: .97, opacity: 0, duration: seconds, ease: "power2.inOut" }, 0);
      }
    });
    gsap.set(incoming, { willChange: "transform,opacity" });
    tl.to(incoming, { ...frontPose, duration: seconds, ease: "power3.out" }, 0);
    previews.current.forEach((preview, index) => {
      if (!preview) return;
      const pose = previewPose(index, target);
      gsap.set(preview, { pointerEvents: pose.opacity ? "auto" : "none", zIndex: 15 - Math.max(0, index - target) });
      tl.to(preview, { ...pose, duration: seconds, ease: "power3.out" }, 0);
    });
  };

  const select = (index: number, duration = .45) => {
    if (index < 0 || index >= items.length) return;
    setZoom(false);
    desiredIndex.current = index;
    const token = ++generation.current;
    if (readyIndices.current.has(index) && requests.current.has(index)) { animateTo(index, duration); return; }
    // A drag may have displaced the old photo. Restore it while decoding,
    // without changing the desired target or queuing a second selection.
    animateTo(activeIndex.current, .18);
    setPhase("loading");
    void ensure(index).then(() => {
      if (!alive.current || token !== generation.current) return;
      flushSync(() => markReady(index));
      animateTo(index, duration);
    }).catch(() => { if (alive.current && token === generation.current) setPhase("error"); });
  };
  const handleKey = (event: KeyboardEvent<HTMLDivElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    select(desiredIndex.current + (event.key === "ArrowRight" ? 1 : -1));
    stageRef.current?.focus({ preventScroll: true });
  };
  const drawDrag = () => {
    dragFrame.current = 0;
    const drag = gesture.current;
    if (!drag?.moved || reduce) return;
    const edge = (drag.from === 0 && drag.dx > 0) || (drag.from === items.length - 1 && drag.dx < 0);
    const distance = drag.dx * (edge ? .22 : 1);
    gsap.set(cards.current[drag.from], { x: drag.baseX + distance,
      rotationY: drag.baseRotation + Math.max(-7, Math.min(7, distance * .012)) });
  };
  const handleDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0 || phase === "loading" || phase === "error") return;
    gesture.current = { x: event.clientX, y: event.clientY, lastX: event.clientX, lastTime: event.timeStamp,
      velocity: 0, moved: false, from: activeIndex.current, dx: 0, baseX: -32, baseRotation: 0 };
  };
  const handleMove = (event: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag) return;
    const dx = event.clientX - drag.x;
    const dy = event.clientY - drag.y;
    if (!drag.moved && Math.abs(dy) > 12 && Math.abs(dy) > Math.abs(dx)) { gesture.current = null; return; }
    if (!drag.moved && Math.abs(dx) > 8 && Math.abs(dx) > Math.abs(dy)) {
      stop(); drag.moved = true;
      drag.baseX = Number(gsap.getProperty(cards.current[drag.from], "x"));
      drag.baseRotation = Number(gsap.getProperty(cards.current[drag.from], "rotationY"));
      event.currentTarget.setPointerCapture(event.pointerId);
      setPhase("dragging");
    }
    const dt = event.timeStamp - drag.lastTime;
    if (dt > 0) drag.velocity = (event.clientX - drag.lastX) / dt;
    drag.lastX = event.clientX; drag.lastTime = event.timeStamp; drag.dx = dx;
    if (drag.moved && !dragFrame.current) dragFrame.current = requestAnimationFrame(drawDrag);
  };
  const endDrag = (event?: PointerEvent<HTMLDivElement>) => {
    const drag = gesture.current;
    if (!drag?.moved) { gesture.current = null; return; }
    cancelAnimationFrame(dragFrame.current); drawDrag();
    gesture.current = null;
    suppressClickUntil.current = performance.now() + 250;
    const width = stageRef.current?.clientWidth ?? 900;
    const velocity = event && event.timeStamp - drag.lastTime < 100 ? drag.velocity : 0;
    const target = event ? depthDragTarget(drag.from, items.length, drag.dx, velocity, width) : drag.from;
    select(target, depthSettleDuration(drag.dx, width));
  };
  if (!current) return null;

  return (
    <div className="depth-carousel" aria-label={label} data-motion={phase}>
      <div className="gallery-toolbar"><span>{label}</span><span className="gallery-counter" aria-live="polite">{active + 1} / {items.length}</span></div>
      <p className="depth-load-status" role="status">
        {phase === "loading" && "正在准备照片…"}
        {phase === "error" && <>照片暂时未能加载，当前画面已保留。<button type="button" onClick={() => select(desiredIndex.current)}>重试</button></>}
      </p>
      <ChapterPhotoStage>
        <div className="depth-stage" ref={stageRef} tabIndex={0} role="region" aria-roledescription="轮播图库"
          aria-label={`${label}，拖动或左右方向键切换`} onKeyDown={handleKey}
          onPointerDown={handleDown} onPointerMove={handleMove} onPointerUp={endDrag}
          onPointerCancel={() => endDrag()} onLostPointerCapture={() => { if (gesture.current?.moved) endDrag(); }}
          onClickCapture={(event) => { if (performance.now() < suppressClickUntil.current) { event.preventDefault(); event.stopPropagation(); } }}>
          {items.map((item, index) => (
            <button type="button" key={item.id} className={`depth-card${index === active ? " is-front" : ""}`}
              ref={(node) => { cards.current[index] = node; }} tabIndex={-1} aria-hidden={index !== active}
              aria-label={`${label}第${index + 1}张`} onClick={() => { if (index !== activeIndex.current) select(index); }}>
              {ready.has(index) && <img src={item.displaySrc ?? item.src} alt={item.alt} width={item.width} height={item.height} decoding="async" draggable={false} />}
            </button>
          ))}
          {items.map((item, index) => (
            <button type="button" key={`${item.id}-preview`} className="depth-preview" ref={(node) => { previews.current[index] = node; }}
              tabIndex={-1} aria-hidden="true" aria-label={`预览${label}第${index + 1}张`} onClick={() => select(index)}>
              {ready.has(index) && <img src={item.displaySrc ?? item.src} alt="" width={item.width} height={item.height} decoding="async" draggable={false} />}
            </button>
          ))}
        </div>
      </ChapterPhotoStage>
      <div className="depth-indicators" role="group" aria-label={`${label}页码`}>
        {items.map((item, index) => <button type="button" key={item.id} className="depth-dot" aria-pressed={index === active}
          aria-label={`查看${label}第${index + 1}张`} onClick={() => select(index)}><span /></button>)}
      </div>
      <div className="gallery-caption"><div><p>{current.caption}</p><small>横向拖动 · 点击后方照片 · 左右方向键切换</small></div>
        <div className="gallery-buttons">
          <button type="button" className="enlarge-button" aria-label={`放大查看${current.caption}`} onClick={() => setZoom(true)}>放大查看 <Plus /></button>
          <button type="button" className="gallery-prev" aria-label={`${label}上一项`} disabled={active === 0} onClick={() => select(desiredIndex.current - 1)}><Arrow /></button>
          <button type="button" className="gallery-next" aria-label={`${label}下一项`} disabled={active === items.length - 1} onClick={() => select(desiredIndex.current + 1)}><Arrow /></button>
        </div>
      </div>
      {zoom && <ImageLightbox item={current} onClose={() => setZoom(false)} />}
    </div>
  );
}
