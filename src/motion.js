import { useEffect, useLayoutEffect } from "react";
import { animate, createTimeline, createScope, splitText, stagger, utils } from "animejs";

/**
 * anime.js handles the page's DOM motion (intros, reveals, text decoding).
 * three.js still runs the 3D scenes. All of it is skipped under
 * prefers-reduced-motion, so the page then shows its final state at once.
 */

export const reducedMotion = () =>
  typeof window !== "undefined" &&
  !!window.matchMedia &&
  window.matchMedia("(prefers-reduced-motion: reduce)").matches;

const GLYPHS = "!<>-_\\/[]{}=+*^?#01ABCDEFGHIJKLMNOPQRSTUVWXYZ";

/**
 * Y2K "decode": the text starts as noise and resolves left to right.
 * Returns the animation so a caller can cancel it.
 */
export function decode(el, text, { duration = 700, delay = 0 } = {}) {
  if (!el) return null;
  const final = text != null ? text : el.textContent;
  if (reducedMotion()) {
    el.textContent = final;
    return null;
  }
  const state = { p: 0 };
  return animate(state, {
    p: 1,
    duration,
    delay,
    ease: "outQuad",
    onUpdate: () => {
      const done = Math.floor(state.p * final.length);
      let out = final.slice(0, done);
      for (let i = done; i < final.length; i++) {
        out += final[i] === " " ? " " : GLYPHS[(Math.random() * GLYPHS.length) | 0];
      }
      el.textContent = out;
    },
    onComplete: () => {
      el.textContent = final;
    },
  });
}

/**
 * Run anime.js code against a React ref's subtree. Selectors inside `build`
 * are scoped to that root, and everything is reverted when deps change or
 * the component unmounts (safe under StrictMode's double effects).
 */
export function useAnime(rootRef, build, deps = []) {
  useLayoutEffect(() => {
    if (!rootRef.current || reducedMotion()) return undefined;
    const scope = createScope({ root: rootRef }).add(build);
    return () => scope.revert();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}

/** Chars of a heading drop in like a stack of bricks. */
export function brickIn(el, { delay = 0 } = {}) {
  const split = splitText(el, { chars: true });
  const a = animate(split.chars, {
    y: ["110%", "0%"],
    rotate: () => utils.random(-24, 24),
    opacity: [0, 1],
    duration: 900,
    delay: stagger(28, { start: delay }),
    ease: "outElastic(1, .6)",
    onComplete: () => split.revert(),
  });
  return () => {
    a.revert();
    split.revert();
  };
}

/**
 * One-shot scroll reveals for the classic sections below the 3D acts.
 * Each group animates the first time it is scrolled into view, then its
 * inline styles are cleaned so hover transforms in the CSS keep working.
 */
const REVEALS = [
  // headings get the brick drop
  { sel: ".stage-title, .dbg-title, .rd-title, .section-title, .about-title, .contact-title", brick: true },
  // grouped items rise in, staggered
  { sel: ".trophy-row", kids: ".trophy", from: { y: 60, rotate: -6, scale: 0.8 } },
  { sel: ".cert-wall", kids: ".cert-hang", from: { y: -80, rotate: 8 } },
  { sel: ".about-bubbles", kids: ".bubble", from: { scale: 0.4 } },
  { sel: ".contact-grid", kids: ":scope > *", from: { y: 40 } },
  { sel: ".section-head", kids: ".section-num, .section-line", from: { x: -40 } },
];

export function useScrollReveals() {
  useEffect(() => {
    if (reducedMotion() || !("IntersectionObserver" in window)) return undefined;
    const cleanups = [];
    const pending = new Map();

    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (!e.isIntersecting) return;
          const cfg = pending.get(e.target);
          io.unobserve(e.target);
          pending.delete(e.target);
          if (!cfg) return;
          if (cfg.brick) {
            cleanups.push(brickIn(e.target));
            return;
          }
          const kids = e.target.querySelectorAll(cfg.kids);
          if (!kids.length) return;
          const props = {};
          Object.entries(cfg.from).forEach(([k, v]) => {
            props[k] = { from: v };
          });
          animate(kids, {
            ...props,
            opacity: { from: 0 },
            duration: 900,
            delay: stagger(110),
            ease: "outBack(1.4)",
            onComplete: (self) => utils.cleanInlineStyles(self),
          });
        });
      },
      { threshold: 0.2 }
    );

    REVEALS.forEach((cfg) => {
      document.querySelectorAll(cfg.sel).forEach((el) => {
        pending.set(el, cfg);
        io.observe(el);
      });
    });

    return () => {
      io.disconnect();
      cleanups.forEach((c) => c && c());
    };
  }, []);
}

export { animate, createTimeline, splitText, stagger, utils };
