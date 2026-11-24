import * as THREE from "three";

/**
 * Canvas-drawn textures, so the scenes need no image files. Each texture is
 * drawn once with whatever font is available and drawn again when the web
 * fonts finish loading.
 */

function canvasTexture(width, height, draw) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const paint = () => {
    ctx.clearRect(0, 0, width, height);
    draw(ctx, width, height);
    tex.needsUpdate = true;
  };
  paint();
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(paint);
  return tex;
}

const glyphCache = new Map();

/** A small chest print for a minifig torso: one glyph, centred. */
export function glyphTexture(glyph, color = "#eaf6ff") {
  const key = glyph + color;
  if (!glyphCache.has(key)) {
    glyphCache.set(
      key,
      canvasTexture(256, 256, (ctx, w, h) => {
        ctx.fillStyle = color;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.font = `700 ${glyph.length > 2 ? 92 : 150}px "Pixelify Sans", "Courier New", monospace`;
        ctx.fillText(glyph, w / 2, h / 2 + 6);
      })
    );
  }
  return glyphCache.get(key);
}

let glow;
/** Soft round glow, for floor pools of light and halos. */
export function glowTexture() {
  if (!glow) {
    glow = canvasTexture(256, 256, (ctx, w, h) => {
      const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
      g.addColorStop(0, "rgba(255,255,255,1)");
      g.addColorStop(0.35, "rgba(200,235,255,0.55)");
      g.addColorStop(1, "rgba(120,200,255,0)");
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);
    });
  }
  return glow;
}

/** The LED wall behind the stage: her name, huge, on a Y2K grid. */
export function ledWallTexture(name) {
  return canvasTexture(1536, 560, (ctx, w, h) => {
    const bg = ctx.createLinearGradient(0, 0, 0, h);
    bg.addColorStop(0, "#020611");
    bg.addColorStop(1, "#061a44");
    ctx.fillStyle = bg;
    ctx.fillRect(0, 0, w, h);

    ctx.strokeStyle = "rgba(111,227,255,0.16)";
    ctx.lineWidth = 2;
    for (let x = 0; x <= w; x += 48) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, h);
      ctx.stroke();
    }
    for (let y = 0; y <= h; y += 48) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(w, y);
      ctx.stroke();
    }

    // sparkles
    ctx.fillStyle = "rgba(200,240,255,0.9)";
    for (let i = 0; i < 60; i++) {
      const x = (i * 263) % w;
      const y = (i * 151) % h;
      ctx.fillRect(x, y, 4, 4);
    }

    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.font = `700 250px "Pixelify Sans", "Courier New", monospace`;
    const chrome = ctx.createLinearGradient(0, h * 0.2, 0, h * 0.8);
    chrome.addColorStop(0, "#ffffff");
    chrome.addColorStop(0.45, "#9fe6ff");
    chrome.addColorStop(0.55, "#2f7bff");
    chrome.addColorStop(1, "#dff6ff");
    ctx.shadowColor = "rgba(111,227,255,0.9)";
    ctx.shadowBlur = 40;
    ctx.fillStyle = chrome;
    ctx.fillText(name, w / 2, h / 2 + 10);

    ctx.shadowBlur = 0;
    ctx.font = `400 46px "VT323", "Courier New", monospace`;
    ctx.fillStyle = "#9fe6ff";
    ctx.fillText("★  LIVE  ·  SOLD OUT  ·  WORLD TOUR 20XX  ★", w / 2, h - 52);

    // scanlines
    ctx.fillStyle = "rgba(0,0,0,0.22)";
    for (let y = 0; y < h; y += 4) ctx.fillRect(0, y, w, 2);
  });
}

let floralTex = null;

/** Her stage top from the photo: black fabric with small gold leaf sprigs. */
export function floralTexture() {
  if (floralTex) return floralTex;
  floralTex = canvasTexture(512, 256, (ctx, w, h) => {
    ctx.fillStyle = "#0c0a10";
    ctx.fillRect(0, 0, w, h);
    let seed = 7;
    const rnd = () => {
      seed = (seed * 16807) % 2147483647;
      return seed / 2147483647;
    };
    const golds = ["#c9a35a", "#a8834a", "#e0c07e", "#8f6e3c"];
    for (let k = 0; k < 22; k++) {
      const x = rnd() * w;
      const y = rnd() * h;
      const ang = rnd() * Math.PI * 2;
      const len = 26 + rnd() * 26;
      ctx.save();
      ctx.translate(x, y);
      ctx.rotate(ang);
      ctx.strokeStyle = golds[k % golds.length];
      ctx.fillStyle = golds[(k + 1) % golds.length];
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.quadraticCurveTo(len * 0.5, -6, len, 0);
      ctx.stroke();
      for (let l = 0; l < 5; l++) {
        const t = 0.2 + l * 0.17;
        const s = l % 2 ? 1 : -1;
        ctx.save();
        ctx.translate(len * t, -3 * Math.sin(t * Math.PI));
        ctx.rotate(s * 0.7);
        ctx.beginPath();
        ctx.ellipse(0, s * 6, 3.2, 7, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
      }
      ctx.beginPath();
      ctx.arc(len + 3, 0, 4, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  });
  floralTex.wrapS = THREE.RepeatWrapping;
  floralTex.wrapT = THREE.RepeatWrapping;
  floralTex.repeat.set(2, 1);
  return floralTex;
}
