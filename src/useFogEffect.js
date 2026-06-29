import { useRef, useEffect } from "react";

export default function useFogEffect() {
  const canvasRef = useRef(null);
  const skylineRef = useRef(null);
  const sigRef = useRef(null);
  const hintRef = useRef(null);

  useEffect(() => {
    /* ---------- Skyline ---------- */
    const skyline = skylineRef.current;

    if (skyline && skyline.children.length === 0) {
      for (let i = 0; i < 22; i++) {
        const b = document.createElement("div");
        b.className = "bldg";
        b.style.height = `${30 + Math.random() * 70}%`;
        b.style.width = `${18 + Math.random() * 34}px`;
        skyline.appendChild(b);
      }
    }

    /* ---------- Signature Animation ---------- */
    const sig = sigRef.current;
    if (sig) {
      const len = sig.getTotalLength();
      sig.style.strokeDasharray = len;
      sig.style.strokeDashoffset = len;

      requestAnimationFrame(() => {
        sig.style.transition = "stroke-dashoffset 2.5s ease";
        sig.style.strokeDashoffset = "0";
      });
    }

    /* ---------- Fog Effect ---------- */
    const canvas = canvasRef.current;
    const hero = document.querySelector(".hero");
    const hint = hintRef.current;

    if (!canvas || !hero) return;

    const ctx = canvas.getContext("2d");
    let W, H;

    function resize() {
      W = hero.clientWidth;
      H = hero.clientHeight;
      canvas.width = W;
      canvas.height = H;
      paintFog();
    }

    function paintFog() {
      ctx.clearRect(0, 0, W, H);

      const gradient = ctx.createLinearGradient(0, 0, W, H);
      gradient.addColorStop(0, "rgba(230,235,240,0.9)");
      gradient.addColorStop(1, "rgba(190,200,210,0.85)");

      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, W, H);
    }

    function wipe(x, y, r = 50) {
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

    let drawing = false;

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

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    window.addEventListener("mouseup", end);

    canvas.addEventListener("touchstart", start);
    canvas.addEventListener("touchmove", move);
    window.addEventListener("touchend", end);

    window.addEventListener("resize", resize);

    return () => {
      canvas.removeEventListener("mousedown", start);
      canvas.removeEventListener("mousemove", move);
      window.removeEventListener("mouseup", end);

      canvas.removeEventListener("touchstart", start);
      canvas.removeEventListener("touchmove", move);
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