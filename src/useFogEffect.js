import { useRef, useEffect } from "react";

export default function useFogEffect() {
  const canvasRef = useRef(null);
  const skylineRef = useRef(null); // keep for compatibility, unused now
  const sigRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = document.querySelector(".hero");
    const hint = hintRef.current;

    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");

    let W, H;
    let drawing = false;
    let last = null;
    let stars = [];
    let animationId;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    /* ---------- Signature animation ---------- */
    const sig = sigRef.current;
    if (sig && sig.getTotalLength) {
      const len = sig.getTotalLength();
      sig.style.strokeDasharray = len;
      sig.style.strokeDashoffset = len;

      requestAnimationFrame(() => {
        sig.style.transition =
          "stroke-dashoffset 2.6s cubic-bezier(.65,0,.35,1)";
        sig.style.strokeDashoffset = "0";
      });
    }

    function resize() {
      W = hero.clientWidth;
      H = hero.clientHeight;

      canvas.width = Math.floor(W * DPR);
      canvas.height = Math.floor(H * DPR);
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      initStars();
    }

    /* ---------- Stars ---------- */
    function initStars() {
      stars = Array.from({ length: 180 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: Math.random() * 1.4 + 0.2,
        opacity: Math.random() * 0.8 + 0.2,
        twinkle: Math.random() * 4000 + 2000,
      }));
    }

    function drawStars(time = 0) {
      for (const s of stars) {
        const alpha =
          s.opacity * (0.75 + 0.25 * Math.sin(time / s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      }
    }

    /* ---------- Night sky ---------- */
    function drawNightSky() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#020611");
      grad.addColorStop(0.5, "#07111f");
      grad.addColorStop(1, "#0b1b2f");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      const moonGlow = ctx.createRadialGradient(
        W * 0.8,
        H * 0.18,
        0,
        W * 0.8,
        H * 0.18,
        180
      );

      moonGlow.addColorStop(0, "rgba(180,220,255,0.14)");
      moonGlow.addColorStop(1, "rgba(180,220,255,0)");

      ctx.fillStyle = moonGlow;
      ctx.fillRect(0, 0, W, H);
    }

    /* ---------- Mist clouds ---------- */
    function drawMist(time = 0) {
      ctx.save();
      ctx.globalCompositeOperation = "lighter";

      for (let i = 0; i < 4; i++) {
        const scale = 1 + i * 0.2;
        const alpha = 0.08 / (i + 1);

        const offsetX = Math.sin(time / (7000 + i * 2000)) * 40 * scale;
        const offsetY = Math.cos(time / (8000 + i * 1500)) * 25 * scale;

        const grad = ctx.createRadialGradient(
          W * 0.5 + offsetX,
          H * 0.55 + offsetY,
          0,
          W * 0.5 + offsetX,
          H * 0.55 + offsetY,
          Math.max(W, H) * scale * 0.8
        );

        grad.addColorStop(0, `rgba(240,245,255,${alpha})`);
        grad.addColorStop(0.5, `rgba(210,220,240,${alpha * 0.7})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }

      ctx.restore();
    }

    /* ---------- Fog layer ---------- */
    function drawFog() {
      const fog = ctx.createRadialGradient(
        W * 0.5,
        H * 0.35,
        0,
        W * 0.5,
        H * 0.35,
        Math.max(W, H)
      );

      fog.addColorStop(0, "rgba(18,26,40,0)");
      fog.addColorStop(0.4, "rgba(30,40,60,0.2)");
      fog.addColorStop(1, "rgba(8,12,20,0.94)");

      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);
    }

    function drawScene(time = 0) {
      ctx.clearRect(0, 0, W, H);

      drawNightSky();
      drawStars(time);
      drawMist(time);
      drawFog();

      animationId = requestAnimationFrame(drawScene);
    }

    /* ---------- Reveal effect ---------- */
    function reveal(x, y, r = 60) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(0,0,0,1)");
      grad.addColorStop(0.7, "rgba(0,0,0,0.6)");
      grad.addColorStop(1, "rgba(0,0,0,0)");

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();

      if (e.touches) {
        return {
          x: e.touches[0].clientX - rect.left,
          y: e.touches[0].clientY - rect.top,
        };
      }

      return {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
      };
    }

    function start(e) {
      drawing = true;
      const p = getPos(e);
      reveal(p.x, p.y);

      if (hint) hint.style.opacity = "0";
    }

    function move(e) {
      if (!drawing) return;

      const p = getPos(e);

      if (last) {
        const dx = p.x - last.x;
        const dy = p.y - last.y;
        const dist = Math.hypot(dx, dy);
        const steps = Math.max(1, Math.floor(dist / 8));

        for (let i = 1; i <= steps; i++) {
          reveal(
            last.x + (dx * i) / steps,
            last.y + (dy * i) / steps,
            60
          );
        }
      } else {
        reveal(p.x, p.y);
      }

      last = p;
    }

    function end() {
      drawing = false;
      last = null;
    }

    resize();
    drawScene();

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start, { passive: true });
    canvas.addEventListener(
      "touchmove",
      (e) => {
        move(e);
        e.preventDefault();
      },
      { passive: false }
    );
    window.addEventListener("touchend", end);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);

      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);
      window.removeEventListener("touchend", end);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return {
    canvasRef,
    skylineRef,
    sigRef,
    hintRef,
  };
}