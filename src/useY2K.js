import { useEffect, useRef, useState } from "react";

/**
 * Small shared hooks for the Y2K hero + about sections.
 *
 * Everything here writes CSS custom properties or flips a boolean once, so
 * the animation work itself stays in CSS (transform/opacity only) and React
 * never re-renders on pointer or scroll movement.
 */

export function prefersReducedMotion() {
  return (
    typeof window !== "undefined" &&
    !!window.matchMedia &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

/**
 * Pointer position as CSS variables on the returned ref's element:
 *   --mx / --my  pointer position in px, relative to the element
 *   --px / --py  the same position normalised to -1..1 around its centre
 * Skipped for reduced motion and for touch-only devices, where the CSS
 * fallbacks (0) leave everything at rest.
 */
export function usePointerVars() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || !window.matchMedia) return;
    if (prefersReducedMotion()) return;
    if (!window.matchMedia("(hover: hover)").matches) return;

    let raf = 0;
    let x = 0;
    let y = 0;

    function apply() {
      raf = 0;
      const r = el.getBoundingClientRect();
      if (!r.width || !r.height) return;
      const mx = x - r.left;
      const my = y - r.top;
      el.style.setProperty("--mx", mx.toFixed(1));
      el.style.setProperty("--my", my.toFixed(1));
      el.style.setProperty("--px", ((mx / r.width) * 2 - 1).toFixed(3));
      el.style.setProperty("--py", ((my / r.height) * 2 - 1).toFixed(3));
    }

    function onMove(e) {
      x = e.clientX;
      y = e.clientY;
      if (!raf) raf = requestAnimationFrame(apply);
    }

    function onLeave() {
      if (raf) cancelAnimationFrame(raf);
      raf = 0;
      el.style.setProperty("--px", "0");
      el.style.setProperty("--py", "0");
    }

    el.addEventListener("pointermove", onMove, { passive: true });
    el.addEventListener("pointerleave", onLeave);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      el.removeEventListener("pointermove", onMove);
      el.removeEventListener("pointerleave", onLeave);
    };
  }, []);

  return ref;
}

/**
 * Scroll progress of an element through the viewport as --sp (0 when its top
 * reaches the bottom of the screen, 1 when its bottom leaves the top).
 */
export function useScrollVar() {
  const ref = useRef(null);

  useEffect(() => {
    const el = ref.current;
    if (!el || prefersReducedMotion()) return;

    let raf = 0;

    function apply() {
      raf = 0;
      const r = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh - r.top) / (vh + r.height);
      el.style.setProperty("--sp", Math.min(1, Math.max(0, p)).toFixed(3));
    }

    function onScroll() {
      if (!raf) raf = requestAnimationFrame(apply);
    }

    apply();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  return ref;
}

/** True once the element has scrolled into view; it never flips back. */
export function useInView({ threshold = 0.2, rootMargin = "0px" } = {}) {
  const ref = useRef(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          io.disconnect();
        }
      },
      { threshold, rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [threshold, rootMargin]);

  return [ref, inView];
}

/** The visitor's local time as a tray-clock string, e.g. "02:47 AM". */
export function useClock() {
  const format = () =>
    new Date().toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  const [time, setTime] = useState(format);

  useEffect(() => {
    const id = setInterval(() => setTime(format()), 15000);
    return () => clearInterval(id);
  }, []);

  return time;
}
