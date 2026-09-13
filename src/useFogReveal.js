import { useRef, useEffect, useState, useCallback } from "react";

/**
 * Frosted-glass photo reveal.
 *
 * A blurred/frosted copy of the image is baked into an offscreen buffer once
 * (on mount + resize), then drawn onto the visible canvas every frame. The
 * cursor "wipes" a clarity field (same falloff-grid approach as the hero fog)
 * and we punch destination-out holes into the frosted layer sized by that
 * field, letting the sharp <img> underneath show through. Fog regrows as the
 * clarity field decays, like breath fading off a cold window.
 */
export default function useFogReveal() {
  const containerRef = useRef(null);
  const imgRef = useRef(null);
  const canvasRef = useRef(null);
  const [imgLoaded, setImgLoaded] = useState(false);

  const onImgLoad = useCallback(() => setImgLoaded(true), []);

  useEffect(() => {
    const container = containerRef.current;
    const canvas = canvasRef.current;
    const img = imgRef.current;
    if (!container || !canvas || !img) return;
    if (!imgLoaded && !img.complete) return;

    const ctx = canvas.getContext("2d");
    const buffer = document.createElement("canvas");
    const bufferCtx = buffer.getContext("2d");
    const DPR = Math.min(window.devicePixelRatio || 1, 1.5);

    let W, H, gridCols, gridRows, cellSize, clarity;
    let animationId;
    let resizeTimer;
    const mouse = { x: -9999, y: -9999, active: false };

    function buildBuffer() {
      buffer.width = W * DPR;
      buffer.height = H * DPR;
      bufferCtx.setTransform(DPR, 0, 0, DPR, 0, 0);
      bufferCtx.clearRect(0, 0, W, H);
      bufferCtx.filter = "blur(9px) brightness(1.12) saturate(0.82)";
      bufferCtx.drawImage(img, 0, 0, W, H);
      bufferCtx.filter = "none";

      const sheen = bufferCtx.createLinearGradient(0, 0, W, H);
      sheen.addColorStop(0, "rgba(226,235,246,0.4)");
      sheen.addColorStop(0.5, "rgba(226,235,246,0.22)");
      sheen.addColorStop(1, "rgba(206,220,238,0.42)");
      bufferCtx.fillStyle = sheen;
      bufferCtx.fillRect(0, 0, W, H);
    }

    function resize() {
      const rect = container.getBoundingClientRect();
      W = rect.width;
      H = rect.height;
      canvas.width = W * DPR;
      canvas.height = H * DPR;
      canvas.style.width = W + "px";
      canvas.style.height = H + "px";
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);

      cellSize = 14;
      gridCols = Math.ceil(W / cellSize) + 2;
      gridRows = Math.ceil(H / cellSize) + 2;
      clarity = new Float32Array(gridCols * gridRows);

      buildBuffer();
    }

    function gridIndex(gx, gy) {
      return gy * gridCols + gx;
    }

    function wipeAt(x, y, strength) {
      const radiusCells = 3.4;
      const gx0 = Math.round(x / cellSize);
      const gy0 = Math.round(y / cellSize);
      for (let gy = gy0 - 4; gy <= gy0 + 4; gy++) {
        for (let gx = gx0 - 4; gx <= gx0 + 4; gx++) {
          if (gx < 0 || gy < 0 || gx >= gridCols || gy >= gridRows) continue;
          const dx = gx - x / cellSize;
          const dy = gy - y / cellSize;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > radiusCells) continue;
          const falloff = Math.pow(1 - dist / radiusCells, 0.8);
          const idx = gridIndex(gx, gy);
          const target = falloff * strength;
          if (target > clarity[idx]) clarity[idx] = target;
        }
      }
    }

    function updateClarity(dt) {
      const decay = (1 / 4.5) * dt; // fog fully regrows over ~4.5s
      for (let i = 0; i < clarity.length; i++) {
        if (clarity[i] > 0) clarity[i] = Math.max(0, clarity[i] - decay);
      }
    }

    let lastTime = 0;
    function draw(time) {
      const dt = Math.min(0.05, (time - lastTime) / 1000 || 0);
      lastTime = time;
      updateClarity(dt);

      ctx.clearRect(0, 0, W, H);
      ctx.globalCompositeOperation = "source-over";
      ctx.drawImage(buffer, 0, 0, W, H);

      ctx.globalCompositeOperation = "destination-out";
      const featherR = cellSize * 1.25;
      for (let gy = 0; gy < gridRows; gy++) {
        for (let gx = 0; gx < gridCols; gx++) {
          const c = clarity[gridIndex(gx, gy)];
          if (c <= 0.01) continue;
          const cx = gx * cellSize + cellSize / 2;
          const cy = gy * cellSize + cellSize / 2;
          const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, featherR);
          grad.addColorStop(0, `rgba(0,0,0,${c})`);
          grad.addColorStop(0.7, `rgba(0,0,0,${c * 0.6})`);
          grad.addColorStop(1, "rgba(0,0,0,0)");
          ctx.fillStyle = grad;
          ctx.beginPath();
          ctx.arc(cx, cy, featherR, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      ctx.globalCompositeOperation = "source-over";

      if (mouse.active) wipeAt(mouse.x, mouse.y, 1);
      animationId = requestAnimationFrame(draw);
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
    }

    function leave() {
      mouse.active = false;
      mouse.x = -9999;
      mouse.y = -9999;
    }

    function onResize() {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(resize, 120);
    }

    resize();
    animationId = requestAnimationFrame(draw);

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
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(animationId);
      clearTimeout(resizeTimer);
      canvas.removeEventListener("mousemove", move);
      canvas.removeEventListener("mouseleave", leave);
      window.removeEventListener("touchend", leave);
      window.removeEventListener("resize", onResize);
    };
  }, [imgLoaded]);

  return { containerRef, imgRef, canvasRef, onImgLoad };
}
