// Adapted from the React Bits AccordionGallery supplied by the user.
import { useLayoutEffect, useRef, useState, useSyncExternalStore } from "react";
import type { KeyboardEvent } from "react";
import { gsap } from "gsap";
import type { ImageMedia } from "../types";
import { Arrow, Plus } from "./Icons";
import { ImageLightbox } from "./MediaGallery";
import { accordionLayout } from "./accordionLayout";
import "./AccordionGallery.css";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type Props = {
  items: ImageMedia[];
  label: string;
  defaultIndex?: number;
};

export function AccordionGallery({ items, label, defaultIndex = 0 }: Props) {
  const [active, setActive] = useState(() =>
    Math.max(0, Math.min(defaultIndex, items.length - 1)),
  );
  const [zoom, setZoom] = useState(false);
  const rowRef = useRef<HTMLDivElement>(null);
  const panels = useRef<(HTMLButtonElement | null)[]>([]);
  const media = useRef<(HTMLSpanElement | null)[]>([]);
  const captions = useRef<(HTMLSpanElement | null)[]>([]);
  const timeline = useRef<gsap.core.Timeline | null>(null);
  const firstRun = useRef(true);
  const reduce = useSyncExternalStore(subscribeMotion, readMotion, () => true);
  const current = items[active];

  useLayoutEffect(() => {
    const row = rowRef.current;
    if (!row || !current) return;
    let lastWidth = 0;
    let lastViewport = 0;
    const applyLayout = (animate: boolean) => {
      const width = row.clientWidth;
      if (!width) return;
      lastWidth = width;
      lastViewport = window.innerHeight;
      const gap = parseFloat(getComputedStyle(row).columnGap) || 10;
      const layout = accordionLayout(
        width,
        lastViewport,
        items.length,
        current.width,
        current.height,
        gap,
      );
      timeline.current?.kill();
      const duration = animate && !reduce ? 0.55 : 0;
      const tl = gsap.timeline();
      tl.to(row, { height: layout.rowHeight, duration, ease: "power3.out" }, 0);
      panels.current.forEach((panel, index) => {
        if (!panel) return;
        tl.set(panel, { flexGrow: 0, flexShrink: 0, flexBasis: "auto" }, 0);
        const selected = index === active;
        const rotation = selected || reduce ? 0 : index < active ? 5 : -5;
        tl.to(
          panel,
          {
            width: selected ? layout.activeWidth : layout.previewWidth,
            rotationY: rotation,
            duration,
            ease: "power3.out",
          },
          0,
        );
        const image = media.current[index];
        if (image)
          tl.to(
            image,
            {
              x:
                selected || reduce
                  ? 0
                  : Math.max(-1, Math.min(1, active - index)) * 10,
              duration,
              ease: "power3.out",
            },
            0,
          );
        const caption = captions.current[index];
        if (caption)
          tl.to(
            caption,
            {
              opacity: selected ? 1 : 0,
              x: selected ? 0 : -10,
              duration,
              ease: "power3.out",
            },
            0,
          );
      });
      timeline.current = tl;
    };
    applyLayout(!firstRun.current);
    firstRun.current = false;
    const resize = () => {
      // Ignore height notifications from our own accordion animation.
      if (row.clientWidth !== lastWidth || window.innerHeight !== lastViewport)
        applyLayout(false);
    };
    const observer = new ResizeObserver(resize);
    observer.observe(row);
    window.addEventListener("resize", resize);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", resize);
      timeline.current?.kill();
      timeline.current = null;
    };
  }, [active, current, items.length, reduce]);

  const select = (index: number, focus = false) => {
    if (index < 0 || index >= items.length) return;
    if (index !== active) {
      setZoom(false);
      setActive(index);
    }
    if (focus) panels.current[index]?.focus({ preventScroll: true });
  };
  const handleKey = (event: KeyboardEvent<HTMLButtonElement>) => {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
    event.preventDefault();
    select(active + (event.key === "ArrowRight" ? 1 : -1), true);
  };
  if (!current) return null;
  return (
    <div className="accordion-gallery" aria-label={label}>
      <div className="gallery-toolbar">
        <span>{label}</span>
        <span className="gallery-counter" aria-live="polite">
          {active + 1} / {items.length}
        </span>
      </div>
      <div
        ref={rowRef}
        className="ag-row"
        role="group"
        aria-label={`${label}，悬浮或左右方向键切换`}
      >
        {items.map((item, index) => (
          <button
            type="button"
            key={item.id}
            ref={(element) => {
              panels.current[index] = element;
            }}
            className={`ag-panel${index === active ? " ag-panel--active" : ""}`}
            aria-pressed={index === active}
            aria-label={`${label}第${index + 1}张，共${items.length}张`}
            onPointerEnter={(event) => {
              if (event.pointerType === "mouse" && !zoom) select(index);
            }}
            onClick={() => select(index)}
            onFocus={() => select(index)}
            onKeyDown={handleKey}
          >
            <span className="ag-panel__frame">
              <span
                className="ag-panel__media"
                ref={(element) => {
                  media.current[index] = element;
                }}
              >
                <img
                  src={item.src}
                  alt={item.alt}
                  width={item.width}
                  height={item.height}
                  loading="lazy"
                  draggable={false}
                />
              </span>
            </span>
            <span className="ag-panel__number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <span
              className="ag-panel__caption"
              aria-hidden="true"
              ref={(element) => {
                captions.current[index] = element;
              }}
            >
              <span className="ag-panel__bar" />
              {item.caption}
            </span>
          </button>
        ))}
      </div>
      <div className="gallery-caption">
        <div>
          <p>{current.caption}</p>
          <small>悬浮展开照片 · 点击或使用左右方向键切换</small>
        </div>
        <div className="gallery-buttons">
          <button
            type="button"
            className="enlarge-button"
            aria-label={`放大查看${current.caption}`}
            onClick={() => setZoom(true)}
          >
            放大查看 <Plus />
          </button>
          <button
            type="button"
            className="gallery-prev"
            aria-label={`${label}上一项`}
            disabled={active === 0}
            onClick={() => select(active - 1)}
          >
            <Arrow />
          </button>
          <button
            type="button"
            className="gallery-next"
            aria-label={`${label}下一项`}
            disabled={active === items.length - 1}
            onClick={() => select(active + 1)}
          >
            <Arrow />
          </button>
        </div>
      </div>
      {zoom && <ImageLightbox item={current} onClose={() => setZoom(false)} />}
    </div>
  );
}
