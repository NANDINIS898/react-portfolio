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

    // Build a parallax layer of smoky "wisps" — elongated, soft-edged streaks
    // that flow horizontally like vapor/smog rather than puffy round clouds.
    function makeLayer(opts) {
      const { count, rMin, rMax, speedX, opacity, hue } = opts;
      const clumps = [];
      for (let i = 0; i < count; i++) {
        const blobCount = 4 + Math.floor(Math.random() * 3);
        const cx = Math.random() * W;
        const cy = Math.random() * H;
        const stretch = 1.8 + Math.random() * 1.4; // smoke is elongated, not round
        const blobs = [];
        for (let b = 0; b < blobCount; b++) {
          blobs.push({
            ox: (b - blobCount / 2) * (rMax * 0.55) + (Math.random() - 0.5) * rMax * 0.3,
            oy: (Math.random() - 0.5) * rMax * 0.35,
            rx: (rMin + Math.random() * (rMax - rMin)) * stretch,
            ry: (rMin + Math.random() * (rMax - rMin)) * 0.55,
          });
        }
        clumps.push({
          x: cx,
          y: cy,
          blobs,
          driftPhase: Math.random() * Math.PI * 2,
          driftAmpY: 8 + Math.random() * 16,
          vx: speedX * (0.7 + Math.random() * 0.6),
          wobble: Math.random() * Math.PI * 2,
        });
      }
      return { clumps, opacity, hue, speedX };
    }

    // Edge smoke emitters: vent-like sources on the left/right walls that
    // continuously birth new wisps drifting inward, like smoke seeping in.
    let emitters = [];
    function initEmitters() {
      emitters = [];
      const sides = [
        { x: -20, dir: 1 },
        { x: W + 20, dir: -1 },
      ];
      sides.forEach((side) => {
        for (let i = 0; i < 4; i++) {
          emitters.push({
            baseX: side.x,
            y: H * (0.25 + Math.random() * 0.55),
            dir: side.dir,
            speed: 14 + Math.random() * 10,
            life: Math.random(),
            maxLife: 9 + Math.random() * 6,
            r: 70 + Math.random() * 60,
            wob: Math.random() * Math.PI * 2,
          });
        }
      });
    }

    function updateAndDrawEmitters(time, dt) {
      ctx.save();
      ctx.filter = "blur(18px)";
      emitters.forEach((em) => {
        em.life += dt;
        if (em.life > em.maxLife) {
          em.life = 0;
          em.y = H * (0.25 + Math.random() * 0.55);
        }
        const t = em.life / em.maxLife; // 0..1 across its travel
        const travel = t * (W * 0.42);
        const x = em.baseX + em.dir * travel;
        const y = em.y + Math.sin(time / 1500 + em.wob) * 18;
        // fade in, hold, fade out across its lifetime
        const fade = Math.sin(Math.PI * Math.min(1, t * 1.15));
        const localClarity = clarityAt(((x % W) + W) % W, y);
        const opacity = 0.32 * fade * (1 - localClarity);
        if (opacity <= 0.015) return;

        const grad = ctx.createRadialGradient(x, y, 0, x, y, em.r);
        grad.addColorStop(0, `rgba(225,230,238,${opacity})`);
        grad.addColorStop(0.6, `rgba(210,217,230,${opacity * 0.5})`);
        grad.addColorStop(1, "rgba(210,217,230,0)");
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.ellipse(x, y, em.r * 1.6, em.r * 0.7, 0, 0, Math.PI * 2);
        ctx.fill();
      });
      ctx.restore();
    }

    function initLayers() {
      layers = [
        // far smog: large, slow, very soft — deep atmospheric haze
        makeLayer({ count: 6, rMin: 90, rMax: 150, speedX: 2.4, opacity: 0.30, hue: "198,206,222" }),
        // mid smog: medium drift
        makeLayer({ count: 8, rMin: 60, rMax: 110, speedX: 4.8, opacity: 0.40, hue: "208,215,230" }),
        // near smog: smaller, faster, denser — closest "glass-fog" layer
        makeLayer({ count: 10, rMin: 38, rMax: 75, speedX: 8.2, opacity: 0.48, hue: "218,224,238" }),
      ];
      initEmitters();
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
      const radiusCells = 6.5; // wider influence — cursor clears a generous patch
      const gx0 = Math.floor(x / cellSize);
      const gy0 = Math.floor(y / cellSize);
      for (let gy = gy0 - radiusCells; gy <= gy0 + radiusCells; gy++) {
        for (let gx = gx0 - radiusCells; gx <= gx0 + radiusCells; gx++) {
          if (gx < 0 || gy < 0 || gx >= gridCols || gy >= gridRows) continue;
          const dx = gx - x / cellSize;
          const dy = gy - y / cellSize;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radiusCells) continue;
          const falloff = Math.pow(1 - dist / radiusCells, 0.7); // sharper near center, still soft at edge
          const idx = gridIndex(gx, gy);
          // hazy thin-out cap: never fully clears (max ~0.62), but ramps up fast
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
      ctx.filter = "blur(14px)"; // smog/mist softness — no hard cloud edges
      layer.clumps.forEach((c) => {
        // ambient drift: horizontal current + gentle vertical bob, like vapor
        c.x += c.vx * 0.016;
        if (layer.speedX >= 0 && c.x - 400 > W) c.x = -400;
        const bobY = Math.sin(time / 1700 + c.driftPhase) * c.driftAmpY;
        const wob = Math.sin(time / 2200 + c.wobble) * 6;
        const drawX = c.x + parallaxShift;
        const drawY = c.y + bobY;

        // local clarity reduces this clump's opacity (hazy thin-out from cursor)
        const localClarity = clarityAt(((drawX % W) + W) % W, drawY);
        const opacity = layer.opacity * (1 - localClarity);
        if (opacity <= 0.015) return;

        c.blobs.forEach((b) => {
          const bx = drawX + b.ox + wob;
          const by = drawY + b.oy;
          const grad = ctx.createRadialGradient(bx, by, 0, bx, by, b.rx);
          grad.addColorStop(0, `rgba(${layer.hue},${opacity})`);
          grad.addColorStop(0.5, `rgba(${layer.hue},${opacity * 0.5})`);
          grad.addColorStop(1, `rgba(${layer.hue},0)`);
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.ellipse(bx, by, b.rx, b.ry, 0, 0, Math.PI * 2);
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
      updateAndDrawEmitters(time, dt); // smoke seeping in from the sides
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