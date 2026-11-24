import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { MAT } from "./three/LegoGirl";
import { imageTexture } from "./three/paper";
import { useSectionProgress, hasWebGL } from "./three/useSectionProgress";
import { useAnime, decode, reducedMotion, animate, createTimeline, splitText, stagger } from "./motion";
import "./PersonaHero.css";

/**
 * Landing: a ring of six street posters cut from her photos. Scrolling spins
 * the ring a full 360°, and every 60° another persona swings to the front and
 * a new card branches out. `want` marks the ones she is still manifesting.
 */
export const PERSONAS = [
  { id: "builder", label: "Builder", line: "ships systems end-to-end, from idea to deploy." },
  { id: "debugger", label: "Debugger", line: "hunts the bug at 2am. the bug never wins." },
  { id: "performer", label: "Performer", line: "every stage she walks onto becomes hers." },
  { id: "creator", label: "Creator", line: "stories, reels, ideas — recording soon.", want: true },
  { id: "dancer", label: "Dancer", line: "rhythm in the code, and outside it too." },
  { id: "filmmaker", label: "Film Maker", line: "directing her own film, scene by scene.", want: true },
];

const COUNT = PERSONAS.length;

// --- 3D: six street posters on a ring, one per persona ---
// Each one is a layered mock-up built from her cut-outs: grunge board with the
// persona type slammed on it, the filtered cut-out in front, and a thermal
// strip floating off her like a misprinted slice. Scroll spins the ring 360°.

const PUB = process.env.PUBLIC_URL || "";
const SPARK = new THREE.OctahedronGeometry(0.07);
const FLOOR_RING = new THREE.TorusGeometry(2.75, 0.018, 8, 128);

const RADIUS = 2.45;
const BOARD_H = 2.3;
const BOARD_W = BOARD_H * (768 / 1080);
const CUT_H = 1.95;
const CUT_W = CUT_H * 0.6283;
// how each persona's poster is cut: her photo (cut-<id>.webp, made by
// mockups/cutouts/make_persona_cutouts.py), accent ink, wash, and the thermal
// strip across her eyes (rect from public/photos/personas.json)
const LOOKS = [
  { accent: "#f2e6cf", wash: "#1d1250", strip: [0.198, 0.209, 0.808, 0.299], dx: 0.1 },
  { accent: "#5fd3f5", wash: "#160d44", strip: [0.221, 0.209, 0.804, 0.299], dx: -0.1 },
  { accent: "#f2e6cf", wash: "#2a1660", strip: [0.137, 0.209, 0.867, 0.299], dx: -0.06 },
  { accent: "#d9ff6a", wash: "#120b38", strip: [0.211, 0.209, 0.82, 0.299], dx: 0.08 },
  { accent: "#b8a3f0", wash: "#1a0f48", strip: [0.211, 0.209, 0.814, 0.299], dx: 0.06 },
  { accent: "#5fd3f5", wash: "#221458", strip: [0.142, 0.209, 0.873, 0.299], dx: -0.08 },
];

let grungeImg = null;
function grunge() {
  if (!grungeImg) {
    grungeImg = new Image();
    grungeImg.src = `${PUB}/photos/grunge.webp`;
  }
  return grungeImg;
}

/** The board: distressed paper, a wash of colour, and the persona typeset loud. */
function boardTexture(p, i, look) {
  const W = 768;
  const H = 1080;
  const c = document.createElement("canvas");
  c.width = W;
  c.height = H;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const img = grunge();
  const draw = () => {
    ctx.globalCompositeOperation = "source-over";
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#130c2c";
    ctx.fillRect(0, 0, W, H);
    if (img.complete && img.naturalWidth) ctx.drawImage(img, 0, 0, W, H);
    ctx.globalCompositeOperation = "screen";
    ctx.fillStyle = look.wash;
    ctx.fillRect(0, 0, W, H);
    ctx.globalCompositeOperation = "source-over";

    // the giant word behind her: one solid, two hollow echoes
    const word = p.label.toUpperCase().replace(" ", "");
    let size = 260;
    ctx.font = `${size}px Anton`;
    size = Math.min(320, size * ((W * 0.94) / ctx.measureText(word).width));
    ctx.font = `${size}px Anton`;
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    const y0 = H * 0.5;
    ctx.lineWidth = 3;
    ctx.strokeStyle = look.accent;
    ctx.globalAlpha = 0.55;
    ctx.strokeText(word, W / 2, y0 - size * 0.86);
    ctx.globalAlpha = 1;
    ctx.fillStyle = look.accent;
    ctx.fillText(word, W / 2, y0);
    ctx.globalAlpha = 0.55;
    ctx.strokeText(word, W / 2, y0 + size * 0.86);
    ctx.globalAlpha = 1;

    // corner furniture: number and angle
    ctx.textAlign = "left";
    ctx.fillStyle = "#f2e6cf";
    ctx.font = "84px Anton";
    ctx.fillText(String(i + 1).padStart(2, "0"), 36, 108);
    ctx.font = "26px 'JetBrains Mono', monospace";
    ctx.fillText(`/06 · ${i * 60}°`, 40, 146);
    ctx.textAlign = "right";
    ctx.font = "26px 'JetBrains Mono', monospace";
    ctx.fillText("N.G — 2026", W - 38, 72);

    // the bottom bar, like a gig flyer
    ctx.fillStyle = "#130c2c";
    ctx.fillRect(0, H - 120, W, 120);
    ctx.fillStyle = look.accent;
    ctx.fillRect(0, H - 124, W, 6);
    ctx.textAlign = "left";
    ctx.fillStyle = "#f2e6cf";
    ctx.font = "40px Anton";
    ctx.fillText("NANDINI GANGWAR", 34, H - 62);
    ctx.font = "22px 'JetBrains Mono', monospace";
    ctx.fillStyle = "rgba(242,230,207,0.7)";
    ctx.fillText(p.want ? "manifesting · loading…" : "live · now showing", 36, H - 28);
    let x = W - 230;
    for (let k = 0; k < 42; k++) {
      const w = 1 + ((k * 7 + i * 3) % 4);
      ctx.fillStyle = "#f2e6cf";
      ctx.fillRect(x, H - 96, w, 62);
      x += w + 2 + ((k * 5) % 3);
    }
    if (p.want) {
      ctx.save();
      ctx.translate(W * 0.74, H * 0.7);
      ctx.rotate(-0.22);
      ctx.strokeStyle = look.accent;
      ctx.lineWidth = 6;
      ctx.strokeRect(-150, -46, 300, 92);
      ctx.fillStyle = look.accent;
      ctx.textAlign = "center";
      ctx.font = "54px Anton";
      ctx.fillText("COMING SOON", 0, 20);
      ctx.restore();
    }
    tex.needsUpdate = true;
  };
  draw();
  img.addEventListener("load", draw);
  if (document.fonts && document.fonts.ready) document.fonts.ready.then(draw);
  return tex;
}

const texCache = {};
function photo(name) {
  if (!texCache[name]) texCache[name] = imageTexture(`${PUB}/photos/${name}`);
  return texCache[name];
}

function basic(opts) {
  return new THREE.MeshBasicMaterial({ toneMapped: false, ...opts });
}

const PLANE = new THREE.PlaneGeometry(1, 1);

function Poster({ p, i, matsRef }) {
  const look = LOOKS[i];
  const mats = useMemo(
    () => ({
      board: basic({ map: boardTexture(p, i, look) }),
      back: basic({ color: "#130c2c" }),
      edge: basic({ color: look.accent }),
      cut: basic({ map: photo(`cut-${p.id}.webp`), transparent: true, alphaTest: 0.05 }),
      strip: basic({ map: photo(`strip-${p.id}.webp`), transparent: true, alphaTest: 0.05 }),
      tape: basic({ color: "#f2ecd8", transparent: true, opacity: 0.78 }),
    }),
    [p, i, look]
  );
  matsRef.current[i] = mats;
  const tilt = (i % 2 ? 1 : -1) * 0.025;
  // the cut-out stands on the flyer bar, the strip lifts off her
  const cutY = -BOARD_H / 2 + 0.12 + CUT_H / 2;
  const [x0, y0, x1, y1] = look.strip;
  const sx = ((x0 + x1) / 2 - 0.5) * CUT_W;
  const sy = cutY + CUT_H / 2 - ((y0 + y1) / 2) * CUT_H;
  const sw = (x1 - x0) * CUT_W * 1.08;
  const sh = (y1 - y0) * CUT_H * 1.08;
  return (
    <group rotation={[0, 0, tilt]}>
      <mesh geometry={PLANE} material={mats.edge} position={[0, 0, -0.012]} scale={[BOARD_W + 0.05, BOARD_H + 0.05, 1]} />
      <mesh geometry={PLANE} material={mats.board} scale={[BOARD_W, BOARD_H, 1]} />
      <mesh geometry={PLANE} material={mats.back} position={[0, 0, -0.02]} rotation={[0, Math.PI, 0]} scale={[BOARD_W, BOARD_H, 1]} />
      <mesh geometry={PLANE} material={mats.cut} position={[look.dx, cutY, 0.09]} scale={[CUT_W, CUT_H, 1]} />
      <mesh
        name="strip"
        geometry={PLANE}
        material={mats.strip}
        position={[look.dx + sx + 0.16, sy + 0.04, 0.3]}
        scale={[sw, sh, 1]}
      />
      <mesh geometry={PLANE} material={mats.tape} position={[-BOARD_W / 2 + 0.12, BOARD_H / 2 - 0.04, 0.02]} rotation={[0, 0, 0.7]} scale={[0.42, 0.1, 1]} />
      <mesh geometry={PLANE} material={mats.tape} position={[BOARD_W / 2 - 0.12, BOARD_H / 2 - 0.04, 0.02]} rotation={[0, 0, -0.7]} scale={[0.42, 0.1, 1]} />
    </group>
  );
}

function Sparkles() {
  const group = useRef();
  const items = useMemo(
    () =>
      Array.from({ length: 22 }, (_, i) => ({
        r: 3.1 + (i % 5) * 0.3,
        y: -0.3 + ((i * 37) % 30) / 9,
        a: (i / 22) * Math.PI * 2,
        s: 0.6 + ((i * 13) % 10) / 10,
      })),
    []
  );
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    group.current.children.forEach((m, i) => {
      const it = items[i];
      const a = it.a + t * 0.15 * (i % 2 ? 1 : -1);
      m.position.set(Math.cos(a) * it.r, it.y + Math.sin(t * 1.3 + i) * 0.15, Math.sin(a) * it.r);
      m.rotation.y = t * 2 + i;
      m.scale.setScalar(it.s * (0.8 + Math.sin(t * 3 + i) * 0.3));
    });
  });
  return (
    <group ref={group}>
      {items.map((_, i) => (
        <mesh key={i} geometry={SPARK} material={i % 3 ? MAT.glow : MAT.cyan} />
      ))}
    </group>
  );
}

function HeroScene({ progress }) {
  const ring = useRef();
  const slots = useRef([]);
  const mats = useRef([]);
  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const target = -progress.current * Math.PI * 2;
    ring.current.rotation.y = THREE.MathUtils.damp(ring.current.rotation.y, target, 5, Math.min(dt, 0.05));
    slots.current.forEach((g, i) => {
      if (!g || !mats.current[i]) return;
      // how squarely this poster faces the audience right now
      const a = (i * Math.PI) / 3 + ring.current.rotation.y;
      const face = Math.max(0, Math.cos(a));
      const lift = Math.pow(face, 6);
      g.position.y = 1.15 + Math.sin(t * 1.1 + i * 1.7) * 0.05 + lift * 0.12;
      g.scale.setScalar(0.92 + lift * 0.14);
      const dim = 0.32 + 0.68 * face;
      ["board", "cut", "strip"].forEach((k) => mats.current[i][k].color.setScalar(dim));
      // the strip drifts further off her when she is front and centre
      const strip = g.getObjectByName("strip");
      if (strip) strip.position.z = 0.22 + lift * 0.24;
    });
  });
  return (
    <>
      <ambientLight intensity={0.8} />
      <group ref={ring}>
        {PERSONAS.map((p, i) => {
          const a = (i * Math.PI) / 3;
          return (
            <group
              key={p.id}
              ref={(el) => (slots.current[i] = el)}
              position={[Math.sin(a) * RADIUS, 1.15, Math.cos(a) * RADIUS]}
              rotation={[0, a, 0]}
            >
              <Poster p={p} i={i} matsRef={mats} />
            </group>
          );
        })}
        <mesh geometry={FLOOR_RING} material={MAT.glow} position={[0, -0.12, 0]} rotation={[Math.PI / 2, 0, 0]} />
      </group>
      <Sparkles />
    </>
  );
}

// --- page ---

export default function PersonaHero() {
  const ref = useRef(null);
  const readout = useRef(null);
  const [index, setIndex] = useState(0);
  const [webgl] = useState(hasWebGL);

  const { progress, inView } = useSectionProgress(ref, (p) => {
    const i = Math.min(COUNT - 1, Math.floor(p * COUNT + 1e-4));
    setIndex((prev) => (prev === i ? prev : i));
    if (readout.current) readout.current.textContent = String(Math.round(p * 360)).padStart(3, "0");
  });

  const active = PERSONAS[index];

  // intro: the name slams in, the kicker boots, the tagline types itself
  useAnime(ref, () => {
    const tagline = splitText(".ph-tagline", { chars: true });
    createTimeline({ defaults: { ease: "outExpo" } })
      .add(".ph-name-line", {
        y: ["45%", "-6%"],
        scale: { from: 1.25 },
        opacity: { from: 0 },
        letterSpacing: { from: "0.4em" },
        duration: 1500,
        delay: stagger(180),
      })
      .add(".ph-kicker", { opacity: { from: 0 }, y: { from: -16 }, duration: 600 }, "-=1000")
      .add(tagline.chars, { opacity: [0, 1], duration: 1, delay: stagger(38), ease: "linear" }, "-=500")
      .add(".ph-readout, .ph-pips li, .ph-hint", { opacity: { from: 0 }, y: { from: 10 }, duration: 500, delay: stagger(50) }, "-=800");
    return () => tagline.revert();
  });

  // each new persona card decodes its label and slides its lines in
  const cardsRef = useRef(null);
  useEffect(() => {
    const card = cardsRef.current && cardsRef.current.children[index];
    if (!card || reducedMotion()) return undefined;
    const label = card.querySelector(".ph-card-label");
    const dec = decode(label, PERSONAS[index].label, { duration: 650 });
    const side = index % 2 === 0 ? -1 : 1;
    const slide = animate(card.querySelectorAll(".ph-card-num, .ph-card-line, .ph-card-status"), {
      x: { from: side * 28 },
      opacity: { from: 0 },
      duration: 700,
      delay: stagger(90, { start: 120 }),
      ease: "outBack(1.7)",
    });
    return () => {
      if (dec) dec.cancel();
      label.textContent = PERSONAS[index].label;
      slide.revert();
    };
  }, [index]);

  return (
    <header className="ph" id="home" ref={ref}>
      <div className="ph-sticky">
        <div className="ph-bg" aria-hidden="true">
          <div className="ph-grid"></div>
          <div className="ph-halo"></div>
        </div>

        <h1 className="ph-name">
          <span className="sr-only">Nandini Gangwar — </span>
          <span aria-hidden="true" className="ph-name-line">NANDINI</span>
          <span aria-hidden="true" className="ph-name-line ph-name-line--2">GANGWAR</span>
        </h1>

        <p className="ph-kicker">
          <span className="ph-dot"></span> manifest.exe — running
        </p>

        <div className="ph-canvas" aria-hidden="true">
          {webgl ? (
            <Canvas
              dpr={[1, 1.75]}
              frameloop={inView ? "always" : "never"}
              camera={{ position: [0, 2.0, 10.2], fov: 32 }}
              onCreated={({ camera }) => camera.lookAt(0, 1.2, 0)}
              gl={{ antialias: true, alpha: true }}
            >
              <HeroScene progress={progress} />
            </Canvas>
          ) : (
            <div className="ph-fallback">✦ {active.label} ✦</div>
          )}
        </div>

        {/* branches from her to each persona she has become so far */}
        <svg className="ph-branches" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
          {PERSONAS.map((p, i) => {
            const left = i % 2 === 0;
            const row = Math.floor(i / 2);
            const x = left ? 27 : 73;
            const y = 30 + row * 21;
            const d = `M50 52 Q ${left ? 40 : 60} ${y} ${x} ${y}`;
            return (
              <path
                key={p.id}
                d={d}
                pathLength="1"
                className={"ph-branch" + (i <= index ? " is-on" : "") + (i === index ? " is-active" : "")}
              />
            );
          })}
        </svg>

        <ol className="ph-cards" ref={cardsRef}>
          {PERSONAS.map((p, i) => (
            <li
              key={p.id}
              className={
                `ph-card ph-card--${i}` + (i <= index ? " is-on" : "") + (i === index ? " is-active" : "")
              }
            >
              <span className="ph-card-num">{String(i + 1).padStart(2, "0")} · {i * 60}°</span>
              <span className="ph-card-label">{p.label}</span>
              <span className="ph-card-line">{p.line}</span>
              {p.want ? (
                <span className="ph-card-status is-want">
                  manifesting<span className="ph-card-bar"><i></i></span>
                </span>
              ) : (
                <span className="ph-card-status">● online</span>
              )}
            </li>
          ))}
        </ol>

        <div className="ph-hud">
          <p className="ph-tagline">
            the world is gonna know my name<span className="ph-caret">_</span>
          </p>
          <p className="ph-readout">
            ROT <b ref={readout}>000</b>° · PERSONA {String(index + 1).padStart(2, "0")}/0{COUNT} ·{" "}
            <b>{active.label.toUpperCase()}</b>
            {active.want ? " (loading…)" : ""}
          </p>
          <ul className="ph-pips" aria-hidden="true">
            {PERSONAS.map((p, i) => (
              <li key={p.id} className={i <= index ? "is-on" : ""}></li>
            ))}
          </ul>
        </div>

        <p className={"ph-hint" + (index > 0 ? " is-gone" : "")} aria-hidden="true">
          scroll to spin the wall ↓
        </p>
      </div>
    </header>
  );
}
