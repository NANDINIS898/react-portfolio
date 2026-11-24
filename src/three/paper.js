import * as THREE from "three";

/**
 * Paper-collage pieces for the 3D acts: flat ink cut-outs on a coloured
 * ground, with warped repeating type behind (the "kill this love" poster look).
 */

export const PAPER = {
  green: "#3b7352",
  greenDeep: "#2a5a40",
  mint: "#8fc79a",
  cream: "#f5d7ab",
  ink: "#0e1a12",
};

function canvas(w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  return c;
}

/** A tileable paper grain, white-ish, for tinting with a material colour. */
export function paperTexture(size = 256) {
  const c = canvas(size, size);
  const ctx = c.getContext("2d");
  const img = ctx.createImageData(size, size);
  for (let i = 0; i < size * size; i++) {
    const v = 232 + Math.random() * 23;
    img.data[i * 4] = v;
    img.data[i * 4 + 1] = v;
    img.data[i * 4 + 2] = v;
    img.data[i * 4 + 3] = 255;
  }
  ctx.putImageData(img, 0, 0);
  // a few fibres
  ctx.strokeStyle = "rgba(0,0,0,0.05)";
  for (let i = 0; i < 40; i++) {
    const x = Math.random() * size;
    const y = Math.random() * size;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + (Math.random() - 0.5) * 30, y + (Math.random() - 0.5) * 30);
    ctx.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/**
 * Repeating lines of type, white on transparent, drawn again once the web
 * fonts arrive. rows: [{ text, font, size, x }]
 */
export function typeTexture(rows, { width = 2048, height = 1024 } = {}) {
  const c = canvas(width, height);
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.anisotropy = 4;
  const draw = () => {
    ctx.clearRect(0, 0, width, height);
    ctx.fillStyle = "#fff";
    ctx.textBaseline = "alphabetic";
    let y = 0;
    rows.forEach((r) => {
      y += r.size * (r.lead || 0.92);
      ctx.font = `${r.style || ""} ${r.size}px ${r.font}`;
      // squeeze each line a touch so a whole number of repeats spans the
      // width: the texture then tiles sideways without a seam
      const step = ctx.measureText(r.text + "  ").width;
      const n = Math.max(1, Math.round(width / step));
      const sx = width / (n * step);
      ctx.save();
      ctx.scale(sx, 1);
      for (let x = ((r.x || 0) % step) - step; x < width / sx; x += step) ctx.fillText(r.text, x, y);
      ctx.restore();
    });
    tex.needsUpdate = true;
  };
  draw();
  if (document.fonts && document.fonts.load) {
    const loads = rows.map((r) => document.fonts.load(`${r.size}px ${r.font}`, r.text));
    Promise.all(loads).then(draw, draw);
  }
  return tex;
}

const wavyVert = /* glsl */ `
  uniform float uTime;
  uniform float uAmp;
  varying vec2 vUv;
  void main() {
    vUv = uv;
    vec3 p = position;
    p.z += sin(p.x * 0.32 + uTime * 0.8) * uAmp + sin(p.y * 0.55 + p.x * 0.18 + uTime * 1.2) * uAmp * 0.35;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;
const wavyFrag = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform float uTime;
  uniform float uOpacity;
  uniform float uBend;
  uniform vec2 uRepeat;
  varying vec2 vUv;
  void main() {
    vec2 uv = vUv * uRepeat;
    // the lines bend and swell like the poster's warped type
    uv.y += sin(vUv.x * 5.6 + uTime * 0.7) * uBend;
    uv.x += sin(vUv.y * 3.1 + uTime * 0.45) * uBend * 0.4 + uTime * 0.006;
    if (uv.y < 0.0 || uv.y > 1.0) discard;
    float a = texture2D(uMap, uv).a;
    if (a < 0.04) discard;
    gl_FragColor = vec4(uColor, a * uOpacity);
    #include <colorspace_fragment>
  }
`;

/** Warped, slowly waving type on a plane. Bump uniforms.uTime each frame. */
export function wavyTypeMaterial(map, color = PAPER.mint, { amp = 0.6, bend = 0.05, opacity = 1, repeat = [1, 1] } = {}) {
  map.wrapS = THREE.RepeatWrapping;
  return new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: map },
      uRepeat: { value: new THREE.Vector2(repeat[0], repeat[1]) },
      uColor: { value: new THREE.Color(color) },
      uTime: { value: 0 },
      uAmp: { value: amp },
      uBend: { value: bend },
      uOpacity: { value: opacity },
    },
    vertexShader: wavyVert,
    fragmentShader: wavyFrag,
    transparent: true,
    side: THREE.DoubleSide,
  });
}

/**
 * A crowd member as a paper silhouette (white, so a material colour inks it),
 * with a halftone fading the lower half. hair: 0 short, 1 long, 2 bun, 3 cap.
 */
export function fanSilhouette(hair, up) {
  const W = 256;
  const H = 512;
  const c = canvas(W, H);
  const ctx = c.getContext("2d");
  const cx = W / 2;
  ctx.fillStyle = "#fff";
  ctx.strokeStyle = "#fff";
  ctx.lineCap = "round";
  ctx.lineJoin = "round";

  // long hair sits behind the head and shoulders
  if (hair === 1) {
    ctx.beginPath();
    ctx.ellipse(cx, 0.36 * H, 0.2 * W, 0.15 * H, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // torso
  ctx.beginPath();
  ctx.moveTo(cx - 0.34 * W, H);
  ctx.lineTo(cx - 0.35 * W, 0.56 * H);
  ctx.quadraticCurveTo(cx - 0.34 * W, 0.43 * H, cx - 0.16 * W, 0.41 * H);
  ctx.lineTo(cx + 0.16 * W, 0.41 * H);
  ctx.quadraticCurveTo(cx + 0.34 * W, 0.43 * H, cx + 0.35 * W, 0.56 * H);
  ctx.lineTo(cx + 0.34 * W, H);
  ctx.closePath();
  ctx.fill();
  // neck + head
  ctx.fillRect(cx - 0.07 * W, 0.33 * H, 0.14 * W, 0.1 * H);
  ctx.beginPath();
  ctx.ellipse(cx, 0.28 * H, 0.15 * W, 0.085 * H, 0, 0, Math.PI * 2);
  ctx.fill();
  if (hair === 2) {
    ctx.beginPath();
    ctx.arc(cx, 0.18 * H, 0.08 * W, 0, Math.PI * 2);
    ctx.fill();
  }
  if (hair === 3) {
    ctx.beginPath();
    ctx.ellipse(cx + 0.1 * W, 0.215 * H, 0.2 * W, 0.022 * H, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // arms
  ctx.lineWidth = 0.1 * W;
  [-1, 1].forEach((s) => {
    ctx.beginPath();
    ctx.moveTo(cx + s * 0.27 * W, 0.47 * H);
    if (up) {
      ctx.lineTo(cx + s * 0.42 * W, 0.24 * H);
      ctx.lineTo(cx + s * 0.36 * W, 0.06 * H);
    } else {
      ctx.lineTo(cx + s * 0.39 * W, 0.68 * H);
      ctx.lineTo(cx + s * 0.37 * W, 0.86 * H);
    }
    ctx.stroke();
    ctx.beginPath();
    ctx.arc(cx + s * (up ? 0.36 : 0.37) * W, (up ? 0.05 : 0.88) * H, 0.065 * W, 0, Math.PI * 2);
    ctx.fill();
  });

  // halftone: dots punched out, growing toward the bottom
  ctx.globalCompositeOperation = "destination-out";
  ctx.fillStyle = "#000";
  const cell = 11;
  for (let y = 0.6 * H; y < H; y += cell) {
    const r = ((y - 0.6 * H) / (0.4 * H)) * cell * 0.45;
    for (let x = (y / cell) % 2 ? cell / 2 : 0; x < W; x += cell) {
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

/** Load an image texture (sRGB) without suspending React. */
export function imageTexture(url) {
  const t = new THREE.TextureLoader().load(url);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  return t;
}
