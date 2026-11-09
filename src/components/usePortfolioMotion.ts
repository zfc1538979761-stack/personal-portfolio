import { useLayoutEffect, useRef } from "react";
import type { RefObject } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { motionPolicy } from "./motionPolicy";
import "./PortfolioMotion.css";

gsap.registerPlugin(ScrollTrigger);
type Reveal = { key: string; trigger: HTMLElement; timeline: gsap.core.Timeline };
const clearMotion = "transform,opacity,visibility,willChange";

export function usePortfolioMotion(rootRef: RefObject<HTMLDivElement | null>) {
  const played = useRef(new Set<string>());
  const openingPlayed = useRef(false);

  useLayoutEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    const completed = played.current;
    let disposed = false;
    let refreshFrame = 0;
    const mm = gsap.matchMedia();
    const context = gsap.context(() => {
      mm.add({ desktop: "(min-width: 1024px)", compact: "(max-width: 1023px)", reduce: "(prefers-reduced-motion: reduce)" }, (media) => {
        const reduce = Boolean(media.conditions?.reduce);
        const policy = motionPolicy(window.innerWidth, reduce, window.location.hash, window.scrollY);
        root.dataset.motionMode = reduce ? "reduced" : policy.parallax ? "full" : "compact";
        const select = <T extends HTMLElement = HTMLElement>(selector: string) => Array.from(root.querySelectorAll<T>(selector));
        const records: Reveal[] = [];
        const touched = new Set<HTMLElement>();
        let opening: gsap.core.Timeline | undefined;
        let interrupted = false;
        let safety: gsap.core.Tween | undefined;
        const own = (nodes: HTMLElement[]) => { nodes.forEach((node) => touched.add(node)); return nodes; };

        const watch = (key: string, trigger: HTMLElement, timeline: gsap.core.Timeline) => {
          records.push({ key, trigger, timeline });
          trigger.dataset.motionReveal = "pending";
          timeline.eventCallback("onStart", () => { trigger.dataset.motionReveal = "running"; });
          const complete = timeline.eventCallback("onComplete") as (() => void) | undefined;
          timeline.eventCallback("onComplete", () => {
            complete?.();
            completed.add(key);
            trigger.dataset.motionReveal = "complete";
          });
          ScrollTrigger.create({ trigger, start: "top 88%", animation: timeline,
            toggleActions: "play none none none", once: true });
        };
        const skipReveal = (key: string, trigger: HTMLElement) => {
          if (reduce || completed.has(key) || trigger.getBoundingClientRect().bottom <= 0) {
            trigger.dataset.motionReveal = "complete";
            completed.add(key);
            return true;
          }
          return false;
        };
        const group = (key: string, trigger: HTMLElement | null, nodes: HTMLElement[], delay = .12) => {
          if (!trigger || !nodes.length || skipReveal(key, trigger)) return;
          own(nodes);
          const tl = gsap.timeline({ paused: true, onComplete: () => gsap.set(nodes, { clearProps: clearMotion }) });
          tl.fromTo(nodes, { y: policy.travel * .7, rotationX: policy.rotation * .12, scale: .95, opacity: .25,
            transformPerspective: 1200, transformOrigin: "50% 100%" },
          { y: 0, rotationX: 0, scale: 1, opacity: 1, duration: 1.15 * policy.timeScale,
            stagger: .14 * policy.timeScale, ease: "power3.out",
            onStart: () => gsap.set(nodes, { willChange: "transform,opacity" }) }, delay);
          watch(key, trigger, tl);
        };

        // Each chapter's typography has its own masked entrance, ahead of content.
        select(".chapter-heading").forEach((heading, index) => {
          const key = `chapter-${index}`;
          if (skipReveal(key, heading)) return;
          const words = own(Array.from(heading.querySelectorAll<HTMLElement>(".chapter-word")));
          const meta = own(Array.from(heading.querySelectorAll<HTMLElement>(".chapter-meta")));
          const section = heading.closest("section");
          const chinese = section?.querySelector<HTMLElement>("h2");
          const intro = section?.querySelector<HTMLElement>(".section-heading > p");
          const caption = heading.querySelector<HTMLElement>(".chapter-subtitle");
          const secondary = own([caption, chinese, intro].filter((node): node is HTMLElement => Boolean(node)));
          const nodes = [...words, ...meta, ...secondary];
          const tl = gsap.timeline({ paused: true, onComplete: () => gsap.set(nodes, { clearProps: clearMotion }) });
          tl.fromTo(words, { yPercent: 125, x: index % 2 ? policy.travel : -policy.travel,
            rotationX: -policy.rotation, skewX: policy.parallax ? -7 : 0, scaleY: 1.22, transformPerspective: 1200 },
          { yPercent: 0, x: 0, rotationX: 0, skewX: 0, scaleY: 1, duration: 1.35 * policy.timeScale,
            stagger: .09 * policy.timeScale, ease: "power4.out",
            onStart: () => gsap.set(words, { willChange: "transform" }) }, 0);
          tl.fromTo(meta, { y: 28, opacity: .2 }, { y: 0, opacity: 1, duration: .8 * policy.timeScale, ease: "power3.out" }, .08);
          if (secondary.length) tl.fromTo(secondary, { y: 65, scaleY: 1.08, opacity: .3 },
            { y: 0, scaleY: 1, opacity: 1, duration: 1.05 * policy.timeScale, stagger: .12, ease: "power3.out" }, .3);
          watch(key, heading, tl);
        });

        group("about-copy", root.querySelector(".about-copy"), select(".bio,.about-description,.timeline > div,.about-email"), .35);
        group("metrics", root.querySelector(".metrics"), select(".metrics > div"));
        group("creator-status", root.querySelector(".creator-status"), select(".creator-status > *"));
        select(".project").forEach((project, index) => group(`project-${index}`, project,
          Array.from(project.querySelectorAll<HTMLElement>(".project-open,.project-summary,.project-highlight,.tags")), .25));
        const strengthCards = select(".strength-card");
        if (completed.has("strength-cards")) strengthCards.forEach((_, index) => completed.add(`strength-${index}`));
        if (strengthCards.every((_, index) => completed.has(`strength-${index}`))) completed.add("strength-cards");
        if (policy.parallax) group("strength-cards", root.querySelector(".strengths-grid"),
          strengthCards.filter((_, index) => !completed.has(`strength-${index}`)), .25);
        else strengthCards.forEach((card, index) => group(`strength-${index}`, card, [card]));
        group("journal-index", root.querySelector(".journal-layout"), select(".journal-index"), .18);
        group("journal-viewer", root.querySelector(".journal-layout"), select(".journal-viewer"), .35);
        group("contact-content", root.querySelector(".contact-main"), select(".contact-intro,.contact-email-row,.contact-links,.wechat-row"), .3);

        select(".media-reveal").forEach((frame, index) => {
          const key = `image-${index}`;
          if (skipReveal(key, frame)) return;
          const shutter = frame.querySelector<HTMLElement>(".image-shutter");
          const image = frame.querySelector<HTMLElement>(".project-motion-ink") ?? frame.querySelector<HTMLImageElement>(":scope > img");
          if (!shutter || !image) return;
          own([shutter, image]);
          const tl = gsap.timeline({ paused: true, onComplete: () => gsap.set([shutter, image], { clearProps: clearMotion }) });
          tl.fromTo(shutter, { yPercent: 0 }, { yPercent: -102, duration: 1.25 * policy.timeScale, ease: "power4.inOut" }, .1);
          tl.fromTo(image, { scale: 1.14 }, { scale: 1, duration: 1.65 * policy.timeScale, ease: "power3.out",
            onStart: () => gsap.set([shutter, image], { willChange: "transform" }) }, .1);
          watch(key, frame, tl);
        });
        if (policy.parallax) {
          const plane = root.querySelector<HTMLElement>(".project-parallax-plane");
          if (plane) gsap.fromTo(plane, { yPercent: -3, scale: 1.065 }, { yPercent: 3, scale: 1.065, ease: "none",
            scrollTrigger: { trigger: ".project-dolla", start: "top bottom", end: "bottom top", scrub: .8, invalidateOnRefresh: true } });
        }

        const removeOpeningListeners = () => {
          window.removeEventListener("wheel", skipOpening);
          window.removeEventListener("touchstart", skipOpening);
          window.removeEventListener("keydown", skipOpening);
          window.removeEventListener("hashchange", skipOpening);
          window.removeEventListener("scroll", skipOnScroll);
        };
        const skipOpening = () => {
          if (!opening || root.dataset.opening !== "playing") return;
          interrupted = true;
          opening.progress(1);
        };
        const skipOnScroll = () => { if (window.scrollY > 40) skipOpening(); };
        const control = (event: Event) => {
          const target = event.target instanceof Element ? event.target.closest("a,button,[tabindex]") : null;
          if (!target) return;
          skipOpening();
          records.forEach(({ trigger, timeline }) => {
            if (trigger.contains(target) || target.contains(trigger)) timeline.progress(1);
          });
        };
        root.addEventListener("pointerdown", control, true);
        root.addEventListener("click", control, true);
        root.addEventListener("focusin", control, true);

        if (policy.opening && !openingPlayed.current) {
          root.dataset.opening = "playing";
          const heroNodes = own(select(".hero-media,.hero-glyph,.name-dot,.english-name,.hero-line-copy,.hero-actions,.hero-side,.hero-foot,.header .wordmark,.header nav a"));
          const curtainNodes = own(select(".opening-mark,.opening-rule,.opening-lockup,.opening-panel"));
          opening = gsap.timeline({ onComplete: () => {
            openingPlayed.current = true;
            root.dataset.opening = interrupted ? "skipped" : "complete";
            gsap.set([...heroNodes, ...curtainNodes], { clearProps: clearMotion });
            safety?.kill();
            removeOpeningListeners();
          } });
          opening.fromTo(".opening-mark", { yPercent: 115, scaleY: 1.35 }, { yPercent: 0, scaleY: 1, duration: .75, ease: "power4.out" }, 0)
            .fromTo(".opening-rule", { scaleX: 0, transformOrigin: "0% 50%" }, { scaleX: 1, duration: .9, ease: "power3.inOut" }, .12)
            .to(".opening-lockup", { y: -65, opacity: 0, duration: .55, ease: "power3.in" }, .65)
            .fromTo(".opening-panel", { yPercent: 0 }, { yPercent: -105, duration: 1.35, ease: "power4.inOut" }, .65)
            .fromTo(".hero-media", { scale: 1.14, yPercent: 4 }, { scale: 1, yPercent: 0, duration: 2.5, ease: "power3.out" }, .3)
            .fromTo(".hero-glyph", { yPercent: 130, scaleY: 1.3, rotationX: policy.rotation, skewX: policy.parallax ? -7 : 0, transformPerspective: 1100 },
              { yPercent: 0, scaleY: 1, rotationX: 0, skewX: 0, duration: 1.25, stagger: .12, ease: "power4.out" }, 1.05)
            .fromTo(".name-dot", { y: 80, scale: .35 }, { y: 0, scale: 1, duration: .9, ease: "power3.out" }, 1.55)
            .fromTo(".english-name", { x: 150, scaleX: 1.12, opacity: .2 }, { x: 0, scaleX: 1, opacity: 1, duration: 1.05, ease: "power4.out" }, 1.65)
            .fromTo(".header .wordmark,.header nav a", { y: -80, opacity: .2 }, { y: 0, opacity: 1, duration: .9, stagger: .06, ease: "power3.out" }, 1.15)
            .fromTo(".hero-line-copy", { yPercent: 120, scaleY: 1.15 }, { yPercent: 0, scaleY: 1, duration: 1.05, stagger: .12, ease: "power4.out" }, 1.85)
            .fromTo(".hero-actions", { y: 70, scale: .96, opacity: .2 }, { y: 0, scale: 1, opacity: 1, duration: .95, ease: "power3.out" }, 2.15)
            .fromTo(".hero-side,.hero-foot", { y: 45, opacity: .2 }, { y: 0, opacity: 1, duration: .8, stagger: .1, ease: "power3.out" }, 2.3);
          opening.timeScale(1 / policy.timeScale);
          gsap.set(heroNodes, { willChange: "transform,opacity" });
          safety = gsap.delayedCall(4.5 * policy.timeScale, skipOpening);
          window.addEventListener("wheel", skipOpening, { passive: true });
          window.addEventListener("touchstart", skipOpening, { passive: true });
          window.addEventListener("keydown", skipOpening);
          window.addEventListener("hashchange", skipOpening);
          window.addEventListener("scroll", skipOnScroll, { passive: true });
        } else root.dataset.opening = "skipped";

        return () => {
          // Only a live matchMedia rebuild counts as "already shown". React
          // StrictMode effect replay/unmount must not consume the opening.
          if (!disposed) {
            records.forEach(({ key, timeline }) => { if (timeline.progress() > 0) completed.add(key); });
            if (root.dataset.opening === "playing") openingPlayed.current = true;
          }
          removeOpeningListeners();
          safety?.kill();
          root.removeEventListener("pointerdown", control, true);
          root.removeEventListener("click", control, true);
          root.removeEventListener("focusin", control, true);
          touched.forEach((node) => node.style.removeProperty("will-change"));
          root.dataset.opening = "complete";
        };
      });
    }, root);

    const refresh = () => {
      if (refreshFrame || disposed) return;
      refreshFrame = requestAnimationFrame(() => { refreshFrame = 0; if (!disposed) ScrollTrigger.refresh(); });
    };
    const loaded = (event: Event) => {
      if (event.target instanceof Element && event.target.matches(".about-portrait img,.project-image img,.hero-poster")) refresh();
    };
    root.addEventListener("load", loaded, true);
    const observer = new ResizeObserver(refresh);
    root.querySelectorAll(".about-grid,.projects,.journal-layout").forEach((node) => observer.observe(node));
    void document.fonts.ready.then(refresh);
    const anchorFrame = requestAnimationFrame(() => {
      const hash = window.location.hash;
      if (hash && hash !== "#home") {
        const anchor = document.getElementById(hash.slice(1));
        anchor?.scrollIntoView({ behavior: "instant", block: "start" });
      }
      refresh();
    });
    return () => {
      disposed = true;
      cancelAnimationFrame(anchorFrame);
      cancelAnimationFrame(refreshFrame);
      observer.disconnect();
      root.removeEventListener("load", loaded, true);
      mm.revert();
      context.revert();
    };
  }, [rootRef]);
}
