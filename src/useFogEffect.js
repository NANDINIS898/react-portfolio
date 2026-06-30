

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
    let puffs = [];
    let animationId;

    // mouse / drag tracking
    let mouse = { x: -9999, y: -9999, px: -9999, py: -9999, vx: 0, vy: 0, active: false };

    const DPR = Math.min(window.devicePixelRatio || 1, 2);

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
      initPuffs();
    }

    function initStars() {
      stars = Array.from({ length: 220 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.8,
        r: Math.random() * 1.7 + 0.3,
        opacity: Math.random(),
        twinkle: Math.random() * 3000 + 1000,
        vx: (Math.random() - 0.5) * 0.05,
        vy: (Math.random() - 0.5) * 0.05,
      }));
    }

    // cloud puffs: independent soft mist blobs that drift on their own
    // and get physically pushed when the cursor drags through them
    function initPuffs() {
      const count = Math.max(12, Math.floor((W * H) / 60000));
      puffs = Array.from({ length: count }, () => ({
        x: Math.random() * W,
        y: Math.random() * H,
        r: 120 + Math.random() * 160,
        // slow ambient current, every puff drifts slightly differently
        ax: (Math.random() - 0.5) * 0.12,
        ay: (Math.random() - 0.5) * 0.08,
        // velocity accumulator (ambient + cursor-driven)
        vx: 0,
        vy: 0,
        density: 0.55 + Math.random() * 0.35,
      }));
    }

    function drawNightSky() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#02030a");
      grad.addColorStop(0.4, "#091325");
      grad.addColorStop(1, "#05070f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      let g1 = ctx.createRadialGradient(W * 0.2, H * 0.3, 0, W * 0.2, H * 0.3, 260);
      g1.addColorStop(0, "rgba(100,160,255,0.14)");
      g1.addColorStop(1, "rgba(100,160,255,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      let g2 = ctx.createRadialGradient(W * 0.8, H * 0.2, 0, W * 0.8, H * 0.2, 240);
      g2.addColorStop(0, "rgba(180,120,255,0.12)");
      g2.addColorStop(1, "rgba(180,120,255,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStars(time = 0) {
      stars.forEach((s) => {
        s.x += s.vx;
        s.y += s.vy;
        if (s.x < 0) s.x = W;
        if (s.x > W) s.x = 0;
        if (s.y < 0) s.y = H * 0.8;
        if (s.y > H * 0.8) s.y = 0;

        const alpha = s.opacity * (0.4 + 0.6 * Math.sin(time / s.twinkle));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
      });
    }

    function updatePuffs() {
      const influenceR = 240; // how far the cursor's push reaches
      const pushStrength = 0.9;

      puffs.forEach((p) => {
        // ambient drift, always present, this is why clouds move on their own
        p.vx += p.ax * 0.02;
        p.vy += p.ay * 0.02;

        // cursor drag physically displaces nearby puffs
        if (mouse.active) {
          const dx = p.x - mouse.x;
          const dy = p.y - mouse.y;
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;

          if (dist < influenceR) {
            const falloff = 1 - dist / influenceR;
            // push away from cursor
            p.vx += (dx / dist) * falloff * pushStrength;
            p.vy += (dy / dist) * falloff * pushStrength;
            // and carry along the drag direction, like wind dragging fog
            p.vx += mouse.vx * falloff * 0.5;
            p.vy += mouse.vy * falloff * 0.5;
          }
        }

        // friction so puffs settle back into ambient drift instead of flying off
        p.vx *= 0.94;
        p.vy *= 0.94;

        p.x += p.vx;
        p.y += p.vy;

        // soft wrap so a puff pushed off-screen reappears, keeping the field full
        const pad = p.r;
        if (p.x < -pad) p.x = W + pad;
        if (p.x > W + pad) p.x = -pad;
        if (p.y < -pad) p.y = H + pad;
        if (p.y > H + pad) p.y = -pad;
      });

      // decay the recorded mouse velocity so a held cursor stops pushing
      mouse.vx *= 0.85;
      mouse.vy *= 0.85;
    }

    function drawPuffs() {
      // base veil so the scene reads as "behind glass" even between puffs
      ctx.fillStyle = "rgba(170,182,212,0.16)";
      ctx.fillRect(0, 0, W, H);

      ctx.globalCompositeOperation = "lighten";
      puffs.forEach((p) => {
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r);
        grad.addColorStop(0, `rgba(225,233,255,${0.5 * p.density})`);
        grad.addColorStop(0.5, `rgba(195,206,235,${0.28 * p.density})`);
        grad.addColorStop(1, "rgba(195,206,235,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalCompositeOperation = "source-over";
    }

    function drawScene(time = 0) {
      ctx.clearRect(0, 0, W, H);
      drawNightSky();
      drawStars(time);
      updatePuffs();
      drawPuffs();
    }

    function animate(time) {
      drawScene(time);
      animationId = requestAnimationFrame(animate);
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function move(e) {
      const p = getPos(e);
      mouse.px = mouse.x === -9999 ? p.x : mouse.x;
      mouse.py = mouse.y === -9999 ? p.y : mouse.y;
      mouse.vx = p.x - mouse.px;
      mouse.vy = p.y - mouse.py;
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
      if (hint) hint.style.opacity = "0";
    }

    function leave() {
      mouse.active = false;
    }

    resize();
    animate();

    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseleave", leave);
    canvas.addEventListener("touchstart", move, { passive: true });
    canvas.addEventListener(
      "touchmove",
      (e) => {
        move(e);
        e.preventDefault();
      },
      { passive: false }
    );
    window.addEventListener("touchend", leave);
    window.addEventListener("resize", resize);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseleave", leave);
      window.removeEventListener("touchend", leave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return { canvasRef, skylineRef, sigRef, hintRef };
}












