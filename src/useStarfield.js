import { useRef, useEffect } from "react";

/**
 * Lightweight sitewide starfield — sits fixed behind everything below the
 * hero (the hero has its own dedicated night-sky canvas and fully covers
 * this with an opaque background). Two small rotating "galaxy" clusters
 * (spiral arms of tiny stars around a soft glowing core) drift slowly for
 * visual interest, alongside a plain twinkling starfield.
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
    let galaxies = [];
    let animationId;
    let resizeTimer;

    function initStars() {
      const count = Math.min(160, Math.round((W * H) / 9000));
      stars = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 0.4 + Math.random() * 1.3,
        baseA: 0.18 + Math.random() * 0.42,
        tw: 1600 + Math.random() * 3200,
        phase: Math.random() * Math.PI * 2,
        vy: -(0.004 + Math.random() * 0.014),
        vx: (Math.random() - 0.5) * 0.008,
      }));
    }

    function initGalaxies() {
      const count = W < 700 ? 1 : 2;
      galaxies = Array.from({ length: count }, (_, gi) => {
        const armStars = Array.from({ length: 42 }, (_, i) => {
          const t = i / 42;
          return {
            angle: t * Math.PI * 4.2,
            radius: 8 + t * 58,
            r: 0.5 + Math.random() * 1,
            baseA: 0.22 + Math.random() * 0.4,
          };
        });
        return {
          cx: W * (0.15 + Math.random() * 0.7),
          cy: H * (0.15 + Math.random() * 0.7),
          rot: Math.random() * Math.PI * 2,
          spin: 0.09 + Math.random() * 0.05, // radians/sec
          tilt: 0.4 + Math.random() * 0.3,
          stars: armStars,
          hue: gi % 2 === 0 ? "150,190,255" : "196,170,255",
        };
      });
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
      initGalaxies();
    }

    let lastTime = 0;
    function draw(time) {
      const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
      lastTime = time;

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

      galaxies.forEach((g) => {
        g.rot += g.spin * dt;

        const core = ctx.createRadialGradient(g.cx, g.cy, 0, g.cx, g.cy, 62);
        core.addColorStop(0, `rgba(${g.hue},0.12)`);
        core.addColorStop(0.5, `rgba(${g.hue},0.05)`);
        core.addColorStop(1, `rgba(${g.hue},0)`);
        ctx.fillStyle = core;
        ctx.beginPath();
        ctx.arc(g.cx, g.cy, 62, 0, Math.PI * 2);
        ctx.fill();

        g.stars.forEach((s) => {
          const ang = s.angle + g.rot;
          const x = g.cx + Math.cos(ang) * s.radius;
          const y = g.cy + Math.sin(ang) * s.radius * g.tilt;
          ctx.fillStyle = `rgba(${g.hue},${s.baseA})`;
          ctx.beginPath();
          ctx.arc(x, y, s.r, 0, Math.PI * 2);
          ctx.fill();
        });
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
