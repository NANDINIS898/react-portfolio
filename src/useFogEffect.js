import { useRef, useEffect } from "react";

/**
 * Lightweight glass-fog effect.
 *
 * Performance approach (this is the part that was lagging before):
 * - NO ctx.filter blur. Canvas blur filters force a full-frame software blur
 *   pass per draw call — with 3 layers + emitters that's 4+ full blurs every
 *   frame, which tanks FPS. Softness here comes purely from radial gradients
 *   (cheap, GPU-friendly) which look just as soft without the cost.
 * - Single composite pass per frame, normal "source-over" blending — no
 *   "lighten" stacking, which is what was blowing everything out to white.
 * - Low, capped opacity per wisp (~0.10–0.16) so layers add up to a believable
 *   misty veil instead of stacking toward solid white.
 * - Clarity field unchanged in concept: cursor thins fog locally, decays back
 *   over ~5.5s. Wipe reads instantly since opacity is now low enough that a
 *   small reduction is visually obvious.
 */

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

    const ctx = canvas.getContext("2d", { alpha: false });
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5); // cap DPR — 2x was extra cost for no visible gain

    let W, H;
    let stars = [];
    let layers = [];
    let clarity = null;
    let gridCols, gridRows, cellSize;
    let animationId;

    let mouse = { x: -9999, y: -9999, active: false };

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

      cellSize = 32;
      gridCols = Math.ceil(W / cellSize) + 2;
      gridRows = Math.ceil(H / cellSize) + 2;
      clarity = new Float32Array(gridCols * gridRows);

      initStars();
      initLayers();
    }

    function initStars() {
      stars = Array.from({ length: 90 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.7,
        r: Math.random() * 1.3 + 0.3,
        baseA: Math.random() * 0.4 + 0.15,
        tw: Math.random() * 3000 + 1500,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    // Soft wisps — single radial gradient per wisp, gently elongated via
    // non-uniform scale (cheap: ctx.scale, not a real blur).
    function makeLayer(opts) {
      const { count, rMin, rMax, speedX, opacity, hue } = opts;
      const wisps = [];
      for (let i = 0; i < count; i++) {
        wisps.push({
          x: Math.random() * W,
          y: Math.random() * H,
          r: rMin + Math.random() * (rMax - rMin),
          stretch: 1.6 + Math.random() * 1.2,
          vx: speedX * (0.6 + Math.random() * 0.7),
          driftPhase: Math.random() * Math.PI * 2,
          driftAmpY: 8 + Math.random() * 14,
        });
      }
      return { wisps, opacity, hue };
    }

    function initLayers() {
      // Three depths, deliberately low-opacity and few in count — the
      // previous version's "very white" problem was too many overlapping
      // near-opaque layers in lighten mode. This caps total visual density.
      layers = [
        makeLayer({ count: 4, rMin: 140, rMax: 220, speedX: 1.6, opacity: 0.10, hue: "198,206,220" }),
        makeLayer({ count: 5, rMin: 90, rMax: 150, speedX: 3.2, opacity: 0.13, hue: "206,213,226" }),
        makeLayer({ count: 6, rMin: 55, rMax: 100, speedX: 5.6, opacity: 0.16, hue: "214,220,232" }),
      ];
      initEmitters();
    }

    // Side smoke emitters — same low-opacity treatment, no blur filter.
    let emitters = [];
    function initEmitters() {
      emitters = [];
      [{ x: -10, dir: 1 }, { x: W + 10, dir: -1 }].forEach((side) => {
        for (let i = 0; i < 3; i++) {
          emitters.push({
            baseX: side.x,
            y: H * (0.28 + Math.random() * 0.5),
            dir: side.dir,
            life: Math.random() * 6,
            maxLife: 8 + Math.random() * 5,
            r: 60 + Math.random() * 50,
            wob: Math.random() * Math.PI * 2,
          });
        }
      });
    }

    function drawNightSky() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#03050b");
      grad.addColorStop(0.45, "#0a1322");
      grad.addColorStop(1, "#05070f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      let g1 = ctx.createRadialGradient(W * 0.22, H * 0.28, 0, W * 0.22, H * 0.28, 280);
      g1.addColorStop(0, "rgba(100,160,255,0.10)");
      g1.addColorStop(1, "rgba(100,160,255,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStars(time) {
      ctx.fillStyle = "white";
      stars.forEach((s) => {
        const a = s.baseA * (0.5 + 0.5 * Math.sin(time / s.tw + s.phase));
        ctx.globalAlpha = a;
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.globalAlpha = 1;
    }

    function gridIndex(gx, gy) {
      return gy * gridCols + gx;
    }

    function wipeAt(x, y, strength) {
      const radiusCells = 6;
      const gx0 = Math.floor(x / cellSize);
      const gy0 = Math.floor(y / cellSize);
      for (let gy = gy0 - radiusCells; gy <= gy0 + radiusCells; gy++) {
        for (let gx = gx0 - radiusCells; gx <= gx0 + radiusCells; gx++) {
          if (gx < 0 || gy < 0 || gx >= gridCols || gy >= gridRows) continue;
          const dx = gx - x / cellSize;
          const dy = gy - y / cellSize;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radiusCells) continue;
          const falloff = Math.pow(1 - dist / radiusCells, 0.7);
          const idx = gridIndex(gx, gy);
          const target = 0.62 * falloff * strength; // hazy cap, never fully clear
          if (target > clarity[idx]) clarity[idx] = target;
        }
      }
    }

    function updateClarity(dt) {
      const decayPerSecond = 0.62 / 5.5; // ~5.5s dreamy regrowth
      const decay = decayPerSecond * dt;
      for (let i = 0; i < clarity.length; i++) {
        if (clarity[i] > 0) clarity[i] = Math.max(0, clarity[i] - decay);
      }
    }

    function clarityAt(x, y) {
      const gx = Math.min(gridCols - 1, Math.max(0, Math.round(x / cellSize)));
      const gy = Math.min(gridRows - 1, Math.max(0, Math.round(y / cellSize)));
      return clarity[gridIndex(gx, gy)] || 0;
    }

    function drawLayer(layer, time, parallaxShift) {
      layer.wisps.forEach((w) => {
        w.x += w.vx * 0.016;
        if (w.x - w.r * 2 > W) w.x = -w.r * 2;
        const drawX = w.x + parallaxShift;
        const drawY = w.y + Math.sin(time / 1800 + w.driftPhase) * w.driftAmpY;

        const localClarity = clarityAt(((drawX % W) + W) % W, drawY);
        const opacity = layer.opacity * (1 - localClarity);
        if (opacity <= 0.008) return;

        ctx.save();
        ctx.translate(drawX, drawY);
        ctx.scale(w.stretch, 1); // cheap horizontal stretch — no blur cost
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, w.r);
        grad.addColorStop(0, `rgba(${layer.hue},${opacity})`);
        grad.addColorStop(0.6, `rgba(${layer.hue},${opacity * 0.45})`);
        grad.addColorStop(1, `rgba(${layer.hue},0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, w.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    function updateAndDrawEmitters(time, dt) {
      emitters.forEach((em) => {
        em.life += dt;
        if (em.life > em.maxLife) {
          em.life = 0;
          em.y = H * (0.28 + Math.random() * 0.5);
        }
        const t = em.life / em.maxLife;
        const travel = t * (W * 0.38);
        const x = em.baseX + em.dir * travel;
        const y = em.y + Math.sin(time / 1500 + em.wob) * 14;
        const fade = Math.sin(Math.PI * Math.min(1, t * 1.15));
        const localClarity = clarityAt(((x % W) + W) % W, y);
        const opacity = 0.12 * fade * (1 - localClarity); // kept subtle, not a white blob
        if (opacity <= 0.006) return;

        ctx.save();
        ctx.translate(x, y);
        ctx.scale(1.7, 0.7);
        const grad = ctx.createRadialGradient(0, 0, 0, 0, 0, em.r);
        grad.addColorStop(0, `rgba(220,226,236,${opacity})`);
        grad.addColorStop(0.6, `rgba(210,217,230,${opacity * 0.5})`);
        grad.addColorStop(1, "rgba(210,217,230,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(0, 0, em.r, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      });
    }

    let lastTime = 0;
    function animate(time) {
      const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
      lastTime = time;

      drawNightSky();
      drawStars(time);
      updateClarity(dt);

      drawLayer(layers[0], time, Math.sin(time / 9000) * 12);
      drawLayer(layers[1], time, Math.sin(time / 6000) * 18);
      drawLayer(layers[2], time, Math.sin(time / 4000) * 24);
      updateAndDrawEmitters(time, dt);

      if (mouse.active) wipeAt(mouse.x, mouse.y, 1);

      animationId = requestAnimationFrame(animate);
    }

    function getPos(e) {
      const rect = canvas.getBoundingClientRect();
      if (e.touches && e.touches.length) {
        return { x: e.touches[0].clientX - rect.left, y: e.touches[0].clientY - rect.top };
      }
      return { x: e.clientX - rect.left, y: e.clientY - rect.top };
    }

    function move(e) {
      const p = getPos(e);
      if (mouse.active && mouse.x > -9000) {
        const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        const steps = Math.max(1, Math.floor(dist / (cellSize * 0.6)));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          wipeAt(mouse.x + (p.x - mouse.x) * t, mouse.y + (p.y - mouse.y) * t, 1);
        }
      }
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
      if (hint) hint.style.opacity = "0";
    }

    function leave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    animationId = requestAnimationFrame(animate);

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