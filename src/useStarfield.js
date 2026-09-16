import { useRef, useEffect } from "react";

/**
 * Lightweight sitewide starfield — sits fixed behind everything below the
 * hero (the hero has its own dedicated night-sky canvas and fully covers
 * this with an opaque background). Just a plain twinkling starfield.
 *
 * Sized to the viewport (position: fixed), not the document, so it stays
 * cheap regardless of page length — it never has to render more than one
 * screen's worth of stars.
 */
export default function useStarfield() {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d", { alpha: true });
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    let W, H;
    let stars = [];
    let animationId;
    let resizeTimer;

    function initStars() {
      const count = Math.min(110, Math.round((W * H) / 12000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.2,
        baseA: 0.16 + Math.random() * 0.38,
        tw: 1600 + Math.random() * 3200,
        phase: Math.random() * Math.PI * 2,
        vy: -(0.004 + Math.random() * 0.014),
        vx: (Math.random() - 0.5) * 0.008,
      }));
    }

    function resize() {
      W = window.innerWidth;
      H = window.innerHeight;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      initStars();
    }

    function draw(time) {
      ctx.clearRect(0, 0, W, H);

      stars.forEach((s) => {
        s.y += s.vy;
        s.x += s.vx;
        if (s.y < -5) {
          s.y = H + 5;
          s.x = Math.random() * W;
        }
        if (s.x < -5) s.x = W + 5;
        if (s.x > W + 5) s.x = -5;

        const a = s.baseA * (0.55 + 0.45 * Math.sin(time / s.tw + s.phase));
        ctx.fillStyle = `rgba(225,232,245,${a})`;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });

      animationId = requestAnimationFrame(draw);
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 150);
    }

    resize();
    animationId = requestAnimationFrame(draw);
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimer);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  return { canvasRef };
}
