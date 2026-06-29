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



    function initStars() {
    stars = Array.from({ length: 260 }, () => ({
        x: Math.random() * W,
        y: Math.random() * H * 0.8,
        r: Math.random() * 1.8 + 0.3,
        opacity: Math.random(),
        twinkle: Math.random() * 3000 + 1000,
    }));
    }
    function drawMist(time = 0) {
    for (let i = 0; i < 5; i++) {
        const x =
        W * 0.5 +
        Math.sin(time / (4000 + i * 1000)) * (80 + i * 20);

        const y =
        H * 0.55 +
        Math.cos(time / (5000 + i * 700)) * 35;

        const grad = ctx.createRadialGradient(
        x,
        y,
        0,
        x,
        y,
        260 + i * 40
        );

        grad.addColorStop(0, `rgba(220,230,255,${0.04 - i * 0.005})`);
        grad.addColorStop(1, "rgba(255,255,255,0)");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);
    }
    }

        
    function drawStars(time = 0) {
    for (const s of stars) {
        const alpha =
        s.opacity * (0.5 + 0.5 * Math.sin(time / s.twinkle));

        ctx.beginPath();
        ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${alpha})`;
        ctx.fill();
    }
    }

    /* ---------- Night sky ---------- */
    function drawNightSky() {
        const grad = ctx.createLinearGradient(0, 0, 0, H);
        grad.addColorStop(0, "#02030a");
        grad.addColorStop(0.35, "#08111f");
        grad.addColorStop(0.75, "#101a34");
        grad.addColorStop(1, "#060b14");

        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, W, H);

        // Galaxy glow 1
        let g1 = ctx.createRadialGradient(
            W * 0.2, H * 0.3, 0,
            W * 0.2, H * 0.3, 250
        );
        g1.addColorStop(0, "rgba(100,150,255,0.14)");
        g1.addColorStop(1, "rgba(100,150,255,0)");

        ctx.fillStyle = g1;
        ctx.fillRect(0, 0, W, H);

        // Galaxy glow 2
        let g2 = ctx.createRadialGradient(
            W * 0.8, H * 0.25, 0,
            W * 0.8, H * 0.25, 220
        );
        g2.addColorStop(0, "rgba(170,120,255,0.12)");
        g2.addColorStop(1, "rgba(170,120,255,0)");

        ctx.fillStyle = g2;
        ctx.fillRect(0, 0, W, H);
        }

        function drawFog() {
    const fog = ctx.createRadialGradient(
        W * 0.5,
        H * 0.45,
        0,
        W * 0.5,
        H * 0.45,
        Math.max(W, H)
    );

    fog.addColorStop(0, "rgba(200,220,255,0.04)");
    fog.addColorStop(0.5, "rgba(170,190,220,0.18)");
    fog.addColorStop(1, "rgba(120,140,180,0.38)");

    ctx.fillStyle = fog;
    ctx.fillRect(0, 0, W, H);
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