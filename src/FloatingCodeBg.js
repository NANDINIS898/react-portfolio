import React, { useEffect, useMemo, useRef } from "react";

const SYMBOLS = [
  "</>", "{ }", "=>", "( )", "[ ]", "<>", "</",
  "&&", "||", "==", "!=", ";;", "**", "//", "/>", "#",
  "def", "fn", "λ", "∑", "π", "AI", "ML", "</div>",
  "return", "async", "const", "import", "useState", "0x1F", "git",
];

// Deterministic pseudo-random so SSR-ish first paint stays stable per icon
function seeded(i, salt = 1) {
  const x = Math.sin(i * 9301.17 * salt + 49297.31) * 233280.7;
  return x - Math.floor(x);
}

export default function FloatingCodeBg({ count = 28 }) {
  const containerRef = useRef(null);
  const iconsRef = useRef([]);
  const mouseRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const rafRef = useRef(null);

  const icons = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const depth = 0.15 + seeded(i, 3) * 0.85; // 0.15 - 1.0 (further = smaller parallax)
        return {
          id: i,
          symbol: SYMBOLS[Math.floor(seeded(i, 7) * SYMBOLS.length)],
          top: seeded(i, 11) * 100,           // %
          left: seeded(i, 13) * 100,          // %
          size: 0.85 + seeded(i, 17) * 2.4,   // rem
          opacity: 0.04 + seeded(i, 19) * 0.18,
          depth,
          driftDur: 12 + seeded(i, 23) * 16,  // s
          driftDelay: -seeded(i, 29) * 20,    // s (negative => mid-cycle start)
          rotate: (seeded(i, 31) - 0.5) * 40, // deg
        };
      }),
    [count]
  );

  useEffect(() => {
    const onMove = (e) => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      // Range: -1 .. 1 from center
      mouseRef.current.tx = (e.clientX / w - 0.5) * 2;
      mouseRef.current.ty = (e.clientY / h - 0.5) * 2;
    };
    window.addEventListener("mousemove", onMove, { passive: true });

    const tick = () => {
      // Ease towards target for smoothness
      mouseRef.current.x += (mouseRef.current.tx - mouseRef.current.x) * 0.08;
      mouseRef.current.y += (mouseRef.current.ty - mouseRef.current.y) * 0.08;

      const { x, y } = mouseRef.current;
      const els = iconsRef.current;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        const depth = icons[i].depth;
        // Push opposite the cursor for that "parallax depth" feel,
        // strength up to ~60px on closest layer.
        const tx = -x * depth * 55;
        const ty = -y * depth * 55;
        el.style.setProperty("--mx", `${tx}px`);
        el.style.setProperty("--my", `${ty}px`);
      }

      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    // Cursor-following glow
    const glow = containerRef.current?.querySelector(".cursor-glow");
    const onGlowMove = (e) => {
      if (!glow) return;
      glow.style.transform = `translate3d(${e.clientX - 200}px, ${e.clientY - 200}px, 0)`;
    };
    window.addEventListener("mousemove", onGlowMove, { passive: true });

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mousemove", onGlowMove);
      cancelAnimationFrame(rafRef.current);
    };
  }, [icons]);

  return (
    <div className="code-bg" ref={containerRef} aria-hidden="true">
      <div className="cursor-glow" />
      {icons.map((ic, i) => (
        <span
          key={ic.id}
          ref={(el) => (iconsRef.current[i] = el)}
          className="code-bg-icon"
          style={{
            top: `${ic.top}%`,
            left: `${ic.left}%`,
            fontSize: `${ic.size}rem`,
            opacity: ic.opacity,
            "--rot": `${ic.rotate}deg`,
            "--drift-dur": `${ic.driftDur}s`,
            "--drift-delay": `${ic.driftDelay}s`,
          }}
        >
          {ic.symbol}
        </span>
      ))}
    </div>
  );
}
