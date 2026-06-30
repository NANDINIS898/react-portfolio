import { useRef, useEffect } from "react";

/**
 * Cinematic multi-layer fog system.
 *
 * Design:
 * - 3 parallax cloud layers (far/mid/near) drifting independently → depth.
 * - Each layer is built from soft radial "clumps" that move on slow ambient
 *   curl-like noise so the whole bank breathes even with zero input.
 * - A separate "clarity field" (per-pixel-ish grid of clear values) is thinned
 *   wherever the cursor travels — this is what actually reveals the sky,
 *   not just light-dodging blend modes. Clarity decays back to 0 (full fog)
 *   over ~5-6s, so wiped patches drift back in like real condensation.
 * - "Hazy thin-out": clarity caps at ~0.62 opacity reduction, so it never
 *   becomes a hard clean hole — always atmospheric.
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

    const ctx = canvas.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    let W, H;
    let stars = [];
    let layers = []; // [{clumps:[], speed, scale, opacity}]
    let clarity = null; // Float32Array grid
    let gridCols, gridRows, cellSize;
    let animationId;
    let rafTime = 0;

    let mouse = { x: -9999, y: -9999, px: -9999, py: -9999, active: false };

    // signature draw-on
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

      cellSize = 28; // resolution of the clarity field — finer = smoother wipes
      gridCols = Math.ceil(W / cellSize) + 2;
      gridRows = Math.ceil(H / cellSize) + 2;
      clarity = new Float32Array(gridCols * gridRows);

      initStars();
      initLayers();
    }

    function initStars() {
      stars = Array.from({ length: 160 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.75,
        r: Math.random() * 1.5 + 0.3,
        baseA: Math.random() * 0.5 + 0.2,
        tw: Math.random() * 3000 + 1500,
        phase: Math.random() * Math.PI * 2,
      }));
    }

    // Build a parallax layer of soft cloud "clumps" — each clump is a cluster
    // of overlapping radial blobs so edges look organic, not circular.
    function makeLayer(opts) {
      const { count, rMin, rMax, speedX, speedY, opacity, hue } = opts;
      const clumps = [];
      for (let i = 0; i < count; i++) {
        const blobCount = 3 + Math.floor(Math.random() * 3);
        const cx = Math.random() * W;
        const cy = Math.random() * H;
        const blobs = [];
        for (let b = 0; b < blobCount; b++) {
          blobs.push({
            ox: (Math.random() - 0.5) * rMax * 0.9,
            oy: (Math.random() - 0.5) * rMax * 0.5,
            r: rMin + Math.random() * (rMax - rMin),
          });
        }
        clumps.push({
          x: cx,
          y: cy,
          blobs,
          driftPhase: Math.random() * Math.PI * 2,
          driftAmpY: 6 + Math.random() * 14,
          vx: speedX * (0.7 + Math.random() * 0.6),
        });
      }
      return { clumps, opacity, hue, speedY };
    }

    function initLayers() {
      layers = [
        // far layer: large, slow, faint — deep background haze
        makeLayer({ count: 7, rMin: 160, rMax: 280, speedX: 2.0, speedY: 0, opacity: 0.34, hue: "200,210,230" }),
        // mid layer: medium, moderate speed
        makeLayer({ count: 9, rMin: 100, rMax: 190, speedX: 4.2, speedY: 0, opacity: 0.46, hue: "210,218,236" }),
        // near layer: smaller, faster, denser — reads closest to "glass"
        makeLayer({ count: 11, rMin: 60, rMax: 130, speedX: 7.5, speedY: 0, opacity: 0.55, hue: "222,228,242" }),
      ];
    }

    function drawNightSky() {
      const grad = ctx.createLinearGradient(0, 0, 0, H);
      grad.addColorStop(0, "#03050b");
      grad.addColorStop(0.45, "#0a1322");
      grad.addColorStop(1, "#05070f");
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, W, H);

      let g1 = ctx.createRadialGradient(W * 0.22, H * 0.28, 0, W * 0.22, H * 0.28, 300);
      g1.addColorStop(0, "rgba(100,160,255,0.13)");
      g1.addColorStop(1, "rgba(100,160,255,0)");
      ctx.fillStyle = g1;
      ctx.fillRect(0, 0, W, H);

      let g2 = ctx.createRadialGradient(W * 0.78, H * 0.2, 0, W * 0.78, H * 0.2, 260);
      g2.addColorStop(0, "rgba(180,130,255,0.10)");
      g2.addColorStop(1, "rgba(180,130,255,0)");
      ctx.fillStyle = g2;
      ctx.fillRect(0, 0, W, H);
    }

    function drawStars(time) {
      stars.forEach((s) => {
        const a = s.baseA * (0.5 + 0.5 * Math.sin(time / s.tw + s.phase));
        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${a})`;
        ctx.fill();
      });
    }

    // ---- Clarity field: where the mist has been thinned by the cursor ----
    function gridIndex(gx, gy) {
      return gy * gridCols + gx;
    }

    function wipeAt(x, y, strength) {
      const radiusCells = 4.5; // influence radius in grid cells
      const gx0 = Math.floor(x / cellSize);
      const gy0 = Math.floor(y / cellSize);
      for (let gy = gy0 - radiusCells; gy <= gy0 + radiusCells; gy++) {
        for (let gx = gx0 - radiusCells; gx <= gx0 + radiusCells; gx++) {
          if (gx < 0 || gy < 0 || gx >= gridCols || gy >= gridRows) continue;
          const dx = gx - x / cellSize;
          const dy = gy - y / cellSize;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radiusCells) continue;
          const falloff = 1 - dist / radiusCells;
          const idx = gridIndex(gx, gy);
          // hazy thin-out cap: never fully clears (max ~0.62)
          const target = 0.62 * falloff * strength;
          if (target > clarity[idx]) clarity[idx] = target;
        }
      }
    }

    function updateClarity(dt) {
      // decay toward 0 over ~5.5s dreamy regrowth, calibrated against the
      // 0.62 hazy-thinout peak (not 1.0) so the full wipe-to-refog cycle
      // actually takes ~5.5s rather than decaying early
      const decayPerSecond = 0.62 / 5.5;
      const decay = decayPerSecond * dt;
      for (let i = 0; i < clarity.length; i++) {
        if (clarity[i] > 0) {
          clarity[i] = Math.max(0, clarity[i] - decay);
        }
      }
    }

    // sample clarity (bilinear-ish, just nearest for perf) for a given pixel position
    function clarityAt(x, y) {
      const gx = Math.min(gridCols - 1, Math.max(0, Math.round(x / cellSize)));
      const gy = Math.min(gridRows - 1, Math.max(0, Math.round(y / cellSize)));
      return clarity[gridIndex(gx, gy)] || 0;
    }

    function drawLayer(layer, time, parallaxShift) {
      ctx.save();
      layer.clumps.forEach((c) => {
        // ambient drift: horizontal current + gentle vertical bob
        c.x += c.vx * 0.016;
        if (c.x - 300 > W) c.x = -300;
        const bobY = Math.sin(time / 1800 + c.driftPhase) * c.driftAmpY;
        const drawX = c.x + parallaxShift;
        const drawY = c.y + bobY;

        // local clarity reduces this clump's opacity (hazy thin-out)
        const localClarity = clarityAt(((drawX % W) + W) % W, drawY);
        const opacity = layer.opacity * (1 - localClarity);
        if (opacity <= 0.02) return;

        c.blobs.forEach((b) => {
          const bx = drawX + b.ox;
          const by = drawY + b.oy;
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.r);
          grad.addColorStop(0, `rgba(${layer.hue},${opacity})`);
          grad.addColorStop(0.55, `rgba(${layer.hue},${opacity * 0.55})`);
          grad.addColorStop(1, `rgba(${layer.hue},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(bx, by, b.r, 0, Math.PI * 2);
          ctx.fill();
        });
      });
      ctx.restore();
    }

    let lastTime = 0;
    function animate(time) {
      const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
      lastTime = time;
      rafTime = time;

      ctx.clearRect(0, 0, W, H);
      drawNightSky();
      drawStars(time);

      updateClarity(dt);

      ctx.globalCompositeOperation = "lighten";
      drawLayer(layers[0], time, Math.sin(time / 9000) * 14); // far
      drawLayer(layers[1], time, Math.sin(time / 6000) * 22); // mid
      drawLayer(layers[2], time, Math.sin(time / 4000) * 30); // near
      ctx.globalCompositeOperation = "source-over";

      // continuous wipe while cursor is active (not just on move events)
      if (mouse.active) {
        wipeAt(mouse.x, mouse.y, 1);
      }

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
      // interpolate between last and current position so fast moves
      // leave a continuous wiped trail instead of dotted gaps
      if (mouse.active && mouse.x > -9000) {
        const dist = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        const steps = Math.max(1, Math.floor(dist / (cellSize * 0.6)));
        for (let i = 1; i <= steps; i++) {
          const t = i / steps;
          wipeAt(mouse.x + (p.x - mouse.x) * t, mouse.y + (p.y - mouse.y) * t, 1);
        }
      }
      mouse.px = mouse.x;
      mouse.py = mouse.y;
      mouse.x = p.x;
      mouse.y = p.y;
      mouse.active = true;
      if (hint) hint.style.opacity = "0";
    }

    function enter(e) {
      move(e);
    }
    function leave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    resize();
    animationId = requestAnimationFrame(animate);

    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseenter", enter);
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
      canvas.removeEventListener("mouseenter", enter);
      canvas.removeEventListener("mouseleave", leave);
      window.removeEventListener("touchend", leave);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return { canvasRef, skylineRef, sigRef, hintRef };
}