// Adapted from the React Bits LineSidebar supplied by the user.
import { useCallback, useEffect, useRef, useSyncExternalStore } from "react";
import type { PointerEvent, KeyboardEvent } from "react";
import "./LineSidebar.css";

function subscribeMotion(onChange: () => void) {
  const query = window.matchMedia("(prefers-reduced-motion: reduce)");
  query.addEventListener("change", onChange);
  return () => query.removeEventListener("change", onChange);
}
const readMotion = () =>
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

type SidebarItem = { id: string; label: string; count: number };
type Props = {
  items: SidebarItem[];
  activeIndex: number;
  onItemClick: (index: number) => void;
};

export function LineSidebar({ items, activeIndex, onItemClick }: Props) {
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);
  const targets = useRef<number[]>([]);
  const current = useRef<number[]>([]);
  const raf = useRef<number | null>(null);
  const last = useRef(0);
  const activeRef = useRef(activeIndex);
  const focusRef = useRef<number | null>(null);
  const reduce = useSyncExternalStore(subscribeMotion, readMotion, () => true);
  const reduceRef = useRef(reduce);

  const runFrame = useCallback(function frame(now: number) {
    const dt = Math.min(Math.max((now - last.current) / 1000, 0), 0.05);
    last.current = now;
    const smoothing = 1 - Math.exp(-dt / 0.1);
    let moving = false;
    itemRefs.current.forEach((element, index) => {
      if (!element) return;
      const selected =
        index === activeRef.current || index === focusRef.current;
      const target = Math.max(targets.current[index] || 0, selected ? 1 : 0);
      const value = current.current[index] || 0;
      const next = reduceRef.current
        ? target
        : value + (target - value) * smoothing;
      const settled = Math.abs(target - next) < 0.0015;
      current.current[index] = settled ? target : next;
      element.style.setProperty("--effect", current.current[index].toFixed(4));
      if (!settled) moving = true;
    });
    raf.current = moving ? requestAnimationFrame(frame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (raf.current !== null) return;
    last.current = performance.now();
    raf.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  useEffect(() => {
    activeRef.current = activeIndex;
    reduceRef.current = reduce;
    startLoop();
  }, [activeIndex, reduce, startLoop]);
  useEffect(
    () => () => {
      if (raf.current !== null) cancelAnimationFrame(raf.current);
      raf.current = null;
    },
    [],
  );

  const clearProximity = () => {
    targets.current = [];
    startLoop();
  };
  const handlePointer = (event: PointerEvent<HTMLElement>) => {
    if (event.pointerType !== "mouse") return;
    itemRefs.current.forEach((element, index) => {
      if (!element) return;
      const box = element.getBoundingClientRect();
      const proximity = Math.max(
        0,
        1 - Math.abs(event.clientY - box.top - box.height / 2) / 100,
      );
      targets.current[index] = proximity * proximity * (3 - 2 * proximity);
    });
    startLoop();
  };
  const handleKey = (
    event: KeyboardEvent<HTMLButtonElement>,
    index: number,
  ) => {
    if (event.key !== "ArrowDown" && event.key !== "ArrowUp") return;
    event.preventDefault();
    const next = Math.max(
      0,
      Math.min(items.length - 1, index + (event.key === "ArrowDown" ? 1 : -1)),
    );
    buttonRefs.current[next]?.focus();
  };

  return (
    <nav
      className="line-sidebar"
      aria-label="按地点浏览户外手记"
      onScroll={clearProximity}
      onPointerMove={handlePointer}
      onPointerLeave={clearProximity}
    >
      <ul
        className="line-sidebar__list"
      >
        {items.map((item, index) => (
          <li
            className="line-sidebar__item"
            key={item.id}
            ref={(element) => {
              itemRefs.current[index] = element;
            }}
          >
            <span className="line-sidebar__marker" aria-hidden="true" />
            <button
              type="button"
              className="line-sidebar__button"
              ref={(element) => {
                buttonRefs.current[index] = element;
              }}
              aria-pressed={index === activeIndex}
              aria-current={index === activeIndex ? "location" : undefined}
              onClick={() => onItemClick(index)}
              onKeyDown={(event) => handleKey(event, index)}
              onFocus={() => {
                focusRef.current = index;
                startLoop();
              }}
              onBlur={() => {
                focusRef.current = null;
                startLoop();
              }}
            >
              <span className="line-sidebar__label">
                <span className="line-sidebar__index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <span className="line-sidebar__text">{item.label}</span>
              </span>
              <small className="line-sidebar__count">{item.count}张</small>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
}
