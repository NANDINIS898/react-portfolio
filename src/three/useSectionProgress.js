import { useEffect, useRef, useState } from "react";

/**
 * Scroll progress through a tall section whose content is position:sticky.
 * 0 when the section's top reaches the top of the viewport, 1 when its
 * bottom reaches the bottom. The value lives in a ref so 3D scenes can read
 * it every frame without re-rendering React; `onProgress` is called on each
 * change for anything that does need state (kept in a ref, so it may be an
 * inline function).
 *
 * `inView` is true while the section is on or near the screen; scenes use it
 * to stop rendering when nobody can see them.
 */
export function useSectionProgress(ref, onProgress) {
  const progress = useRef(0);
  const callback = useRef(onProgress);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    callback.current = onProgress;
  });

  useEffect(() => {
    const el = ref.current;
    if (!el) return undefined;
    let raf = 0;

    const measure = () => {
      raf = 0;
      const r = el.getBoundingClientRect();
      const total = r.height - window.innerHeight;
      const p = total > 0 ? Math.min(1, Math.max(0, -r.top / total)) : r.top <= 0 ? 1 : 0;
      progress.current = p;
      if (callback.current) callback.current(p);
    };
    const schedule = () => {
      if (!raf) raf = requestAnimationFrame(measure);
    };

    measure();
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    const io = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "200px 0px",
    });
    io.observe(el);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      io.disconnect();
    };
  }, [ref]);

  return { progress, inView };
}

export const clamp01 = (v) => Math.min(1, Math.max(0, v));

/** 0 below `a`, 1 above `b`, smooth in between. */
export function smoothstep(a, b, v) {
  const t = clamp01((v - a) / (b - a));
  return t * t * (3 - 2 * t);
}

/** True when WebGL can be created; scenes show a still fallback otherwise. */
export function hasWebGL() {
  try {
    const c = document.createElement("canvas");
    return !!(window.WebGLRenderingContext && (c.getContext("webgl2") || c.getContext("webgl")));
  } catch (e) {
    return false;
  }
}
