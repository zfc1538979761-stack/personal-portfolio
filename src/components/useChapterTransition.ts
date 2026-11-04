import { useEffect, useMemo, useRef, useState } from "react";
import { flushSync } from "react-dom";
import { gsap } from "gsap";
import type { Destination } from "../types";
import { preloadChapterImage } from "./chapterImage";

type Phase = "idle" | "loading" | "exiting" | "entering" | "error";
const rest = { x: 0, z: 0, rotationY: 0, opacity: 1 };

export function useChapterTransition(requested: number, places: Destination[]) {
  const [display, setDisplay] = useState({ index: requested, epoch: 0 });
  const [phase, setPhase] = useState<Phase>("idle");
  const [attempt, setAttempt] = useState(0);
  const frame = useRef<HTMLDivElement>(null);
  const motion = useRef<HTMLDivElement>(null);
  const refs = useMemo(() => ({
    setFrame: (node: HTMLDivElement | null) => { frame.current = node; },
    setMotion: (node: HTMLDivElement | null) => { motion.current = node; },
  }), []);
  const selected = useRef(requested);
  const shown = useRef(requested);
  const epoch = useRef(0);
  const generation = useRef(0);
  const currentPhase = useRef<Phase>("idle");
  const alive = useRef(false);
  const loading = useRef<AbortController | null>(null);
  const tween = useRef<gsap.core.Timeline | null>(null);
  const finishTween = useRef<((complete: boolean) => void) | null>(null);
  const skipAnimation = useRef(false);
  const settle = useRef<() => void>(() => {});

  useEffect(() => {
    alive.current = true;
    const resize = () => settle.current();
    const preference = window.matchMedia("(prefers-reduced-motion: reduce)");
    window.addEventListener("resize", resize);
    preference.addEventListener("change", resize);
    return () => {
      alive.current = false;
      // Invalidate the latest async request; this ref is a counter, not a DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      generation.current++;
      loading.current?.abort();
      tween.current?.kill();
      // This is a live animation resolver, not a captured DOM node.
      // eslint-disable-next-line react-hooks/exhaustive-deps
      finishTween.current?.(false);
      window.removeEventListener("resize", resize);
      preference.removeEventListener("change", resize);
    };
  }, []);

  useEffect(() => {
    selected.current = requested;
    const token = ++generation.current;
    const valid = () => alive.current && generation.current === token;
    const stop = () => {
      tween.current?.kill();
      tween.current = null;
      finishTween.current?.(false);
      finishTween.current = null;
    };
    const updatePhase = (next: Phase) => {
      currentPhase.current = next;
      if (alive.current) setPhase(next);
    };
    const resetPose = () => {
      if (motion.current) gsap.set(motion.current, { clearProps: "transform,opacity" });
      if (frame.current) gsap.set(frame.current, { clearProps: "height" });
    };
    const commit = (index: number) => {
      shown.current = index;
      epoch.current++;
      flushSync(() => setDisplay({ index, epoch: epoch.current }));
    };
    const play = (build: (timeline: gsap.core.Timeline) => void) => new Promise<boolean>((resolve) => {
      finishTween.current = resolve;
      const timeline = gsap.timeline({ onComplete: () => {
        tween.current = null;
        finishTween.current = null;
        resolve(true);
      } });
      tween.current = timeline;
      build(timeline);
    });
    loading.current?.abort();
    stop();
    skipAnimation.current = false;

    // Resize during preload keeps the ready old photo until the new one decodes.
    // Resize during a transition commits the latest already-loaded destination.
    settle.current = () => {
      if (currentPhase.current === "loading") { skipAnimation.current = true; return; }
      if (currentPhase.current !== "exiting" && currentPhase.current !== "entering") return;
      generation.current++;
      loading.current?.abort();
      stop();
      commit(selected.current);
      resetPose();
      updatePhase("idle");
    };

    if (requested === shown.current) {
      if (currentPhase.current === "idle" || currentPhase.current === "error") {
        resetPose(); updatePhase("idle");
      } else {
        updatePhase("entering");
        const duration = window.matchMedia("(prefers-reduced-motion: reduce)").matches ? 0 : .18;
        void play((tl) => {
          tl.to(motion.current, { ...rest, duration, ease: "power2.out" }, 0);
          tl.to(frame.current, { height: motion.current?.offsetHeight ?? "auto", duration }, 0);
        }).then((complete) => {
          if (!complete || !valid()) return;
          resetPose(); updatePhase("idle");
        });
      }
      return;
    }
    const controller = new AbortController();
    loading.current = controller;
    updatePhase("loading");
    // Restore a partially entered old stack while a replacement is loading.
    if (motion.current) tween.current = gsap.timeline().to(motion.current, { ...rest, duration: .12 });

    const run = async () => {
      try {
      await preloadChapterImage(places[requested].photos[0].displaySrc ?? places[requested].photos[0].src, controller.signal);
        if (!valid()) return;
        stop();
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        if (reduce || skipAnimation.current) {
          commit(requested); resetPose(); updatePhase("idle"); return;
        }
        const direction = requested > shown.current ? 1 : -1;
        const mobile = window.matchMedia("(max-width: 760px)").matches;
        const oldHeight = frame.current?.getBoundingClientRect().height ?? 0;
        if (frame.current) gsap.set(frame.current, { height: oldHeight });
        updatePhase("exiting");
        const exited = await play((tl) => {
          tl.to(motion.current, {
            opacity: 0, x: mobile ? 0 : -40 * direction,
            z: mobile ? 0 : -100, rotationY: mobile ? 0 : 7 * direction,
            duration: mobile ? .09 : .22, ease: "power2.in",
          });
        });
        if (!exited || !valid()) return;
        commit(requested);
        const newHeight = motion.current?.offsetHeight ?? oldHeight;
        gsap.set(frame.current, { height: oldHeight });
        gsap.set(motion.current, {
          opacity: 0, x: mobile ? 0 : 40 * direction,
          z: mobile ? 0 : -100, rotationY: mobile ? 0 : -7 * direction,
        });
        updatePhase("entering");
        const entered = await play((tl) => {
          const duration = mobile ? .09 : .34;
          tl.to(motion.current, { ...rest, duration, ease: "power3.out" }, 0);
          tl.to(frame.current, { height: newHeight, duration, ease: "power3.out" }, 0);
        });
        if (!entered || !valid()) return;
        resetPose();
        updatePhase("idle");
      } catch (error) {
        if (!valid() || controller.signal.aborted) return;
        stop(); resetPose();
        console.info("Chapter image unavailable", error);
        updatePhase("error");
      }
    };
    void run();
    return () => { controller.abort(); stop(); };
    // Layout changes are settled by the resize handler, not replayed as requests.
  }, [requested, attempt, places]);

  return {
    display, phase, refs,
    busy: phase !== "idle" && phase !== "error",
    retry: () => setAttempt((value) => value + 1),
  };
}
