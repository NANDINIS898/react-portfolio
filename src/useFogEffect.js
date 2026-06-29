import { useRef, useEffect } from "react";

export default function useFogEffect() {
  const canvasRef = useRef(null);
  const skylineRef = useRef(null);
  const sigRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const hero = document.querySelector(".hero");
    const hint = hintRef.current;

    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");

    let W, H;
    let stars = [];
    let drawing = false;
    let animationId;

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    // Signature animation
    const sig = sigRef.current;
    if (sig && sig.getTotalLength) {
      const len = sig.getTotalLength();
      sig.style.strokeDasharray = len;
      sig.style.strokeDashoffset = len;

      requestAnimationFrame(() => {
        sig.style.transition = "stroke-dashoffset 2.6s ease";
        sig.style.strokeDashoffset = "0";
      });
    }

    function resize() {
      W = hero.clientWidth;
      H = hero.clientHeight;

      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";

      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      initStars();
      drawScene();
    }

    function initStars() {
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.8,
        r: Math.random() * 1.7 + 0.3,
        opacity: Math.random(),
        twinkle: Math.random() * 3000 + 1000,
      }));
    }

    function drawNightSky() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#02030a");
      grad.addColorStop(0.4, "#091325");
      grad.addColorStop(1, "#05070f");

      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      let g1 = ctx.createRadialGradient(
        W * 0.2,
        H * 0.3,
        0,
        W * 0.2,
        H * 0.3,
        260
      );
      g1.addColorStop(0, "rgba(100,160,255,0.14)");
      g1.addColorStop(1, "rgba(100,160,255,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      let g2 = ctx.createRadialGradient(
        W * 0.8,
        H * 0.2,
        0,
        W * 0.8,
        H * 0.2,
        240
      );
      g2.addColorStop(0, "rgba(180,120,255,0.12)");
      g2.addColorStop(1, "rgba(180,120,255,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStars(time = 0) {
      stars.forEach((s) => {
        const alpha =
          s.opacity * (0.4 + 0.6 * Math.sin(time / s.twinkle));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });
    }

    function drawMist(time = 0) {
      for (let i = 0; i < 4; i++) {
        const x =
          W * 0.5 + Math.sin(time / (3000 + i * 800)) * 120;
        const y =
          H * 0.5 + Math.cos(time / (4000 + i * 500)) * 50;

        const grad = ctx.createRadialGradient(
          x,
          y,
          0,
          x,
          y,
          260 + i * 50
        );

        grad.addColorStop(0, `rgba(220,230,255,${0.04 - i * 0.005})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
      }
    }

    function drawFog() {
      const fog = ctx.createRadialGradient(
        W / 2,
        H / 2,
        0,
        W / 2,
        H / 2,
        Math.max(W, H)
      );

      fog.addColorStop(0, "rgba(220,230,255,0.08)");
      fog.addColorStop(0.5, "rgba(180,190,220,0.22)");
      fog.addColorStop(1, "rgba(150,160,180,0.42)");

      ctx.fillStyle = fog;
      ctx.fillRect(0, 0, W, H);
    }

    function drawScene(time = 0) {
      ctx.clearRect(0, 0, W, H);
      drawNightSky();
      drawStars(time);
      drawMist(time);
      drawFog();
    }

    function animate(time) {
      drawScene(time);
      animationId = requestAnimationFrame(animate);
    }

    function wipe(x, y, r = 60) {
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";

      const grad = ctx.createRadialGradient(x, y, 0, x, y, r);
      grad.addColorStop(0, "rgba(0,0,0,1)");
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
      wipe(p.x, p.y);
      if (hint) hint.style.opacity = "0";
    }

    function move(e) {
      if (!drawing) return;
      const p = getPos(e);
      wipe(p.x, p.y);
    }

    function end() {
      drawing = false;
    }

    resize();
    animate();

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