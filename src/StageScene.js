import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useSectionProgress, smoothstep, hasWebGL } from "./three/useSectionProgress";
import { glowTexture } from "./three/textures";
import { beamGeometry, beamMaterial, aim } from "./three/beams";
import { paperTexture, fanSilhouette, imageTexture } from "./three/paper";
import { playClick, playKey } from "./sound";
import { animate, splitText, stagger, reducedMotion } from "./motion";
import { FaSpotify } from "react-icons/fa";
import "./StageScene.css";

/**
 * Act II: the stage, as a blue paper collage. First the suspense: lights
 * down, a spot, and only her name standing where she will be, with the line
 * written in the light. Then the camera swings round behind her and there
 * she is (her photo cut-out), looking out at a full house on its feet.
 * Hover a fan for a cheer; hover her (or her name) for the line she lives by.
 */

const CHEERS = [
  "NANDINIIII!! 💙",
  "once more! ek aur baar!",
  "main character energy ✦",
  "kya baat hai!! 🔥",
  "kainaat bhi uske saath hai 🌌",
  "ship it, queen 🚀",
  "sirf iske liye aaye hain!!",
  "naam yaad rakhna — NANDINI",
  "rongte khade ho gaye fr",
  "front row forever 🙌",
  "standing ovation 👏👏",
  "legend in the making",
  "autograph please 🥹",
  "duniya ab jaanti hai ✨",
  "she's literally HER",
];

const SRK =
  "SRK said it right: kisi cheez ko poori shiddat se chaaho, toh poori kainaat use tumse milane mein lag jaati hai ✦";


const STAGE_Z = -1.6; // where she stands
const STAGE_TOP = 1.2;
const HALL_Z = 21;
const PUBLIC = process.env.PUBLIC_URL || "";

// the blue of the landing turntable: navy ink, icy light, cyan glow
const C = { ice: "#dff1ff", cyan: "#6fe3ff", azure: "#2f7bff", ink: "#030817" };

// her half-body cut-out: public/stage/nandini-half*.webp (mockups/cutouts/make_cutouts.py)
const FIG_H = 3.4;
const FIG_W = FIG_H * 0.6283;
const FIG_Y = 0.25; // she rises out of the haze a little above the boards
const SHADOW_W = FIG_W * (1 + 96 / 524);
const SHADOW_H = FIG_H * (1 + 96 / 834);

// room colours: house lights, lights down, full house roaring
const HOUSE = new THREE.Color("#163a7a");
const DARK = new THREE.Color("#040a1e");
const ROAR = new THREE.Color("#0b2257");

// --- the crowd: ink silhouettes cut from paper ---
const FAN_ROWS = 6;
const FAN_COLS = 11;
const FAN_TINTS = ["#020613", "#050c22", "#08132f", "#0c1a3d"];
const riserHeight = (r) => Math.max(0, r - 1) * 0.45;
const fanPlane = new THREE.PlaneGeometry(1.3, 2.6);
const phoneGeo = new THREE.PlaneGeometry(0.17, 0.28);
const phoneMat = new THREE.MeshBasicMaterial({ color: C.ice, side: THREE.DoubleSide });

const fanTextures = new Map();
const fanMats = new Map();
function fanMat(hair, up, tint) {
  const key = `${hair}-${up}-${tint}`;
  if (!fanMats.has(key)) {
    const tk = `${hair}-${up}`;
    if (!fanTextures.has(tk)) fanTextures.set(tk, fanSilhouette(hair, up));
    fanMats.set(
      key,
      new THREE.MeshBasicMaterial({ map: fanTextures.get(tk), color: tint, alphaTest: 0.5, side: THREE.DoubleSide })
    );
  }
  return fanMats.get(key);
}

function useFans() {
  return useMemo(() => {
    const list = [];
    for (let r = 0; r < FAN_ROWS; r++) {
      for (let c = 0; c < FAN_COLS; c++) {
        const i = r * FAN_COLS + c;
        const j = (n) => Math.abs((Math.sin(i * 12.9898 + n * 78.233) * 43758.5453) % 1);
        const x = (c - (FAN_COLS - 1) / 2) * 1.5 + (r % 2 ? 0.75 : 0) + (j(1) - 0.5) * 0.3;
        const z = 3.2 + r * 1.7 + (j(2) - 0.5) * 0.4;
        list.push({
          i,
          x,
          z,
          y: riserHeight(r),
          yaw: Math.atan2(-x, STAGE_Z - z), // face her
          hair: Math.floor(j(5) * 4),
          tint: FAN_TINTS[Math.floor(j(3) * FAN_TINTS.length)],
          phone: j(6) > 0.5,
          threshold: 0.12 + j(11) * 0.75, // how much excitement before the arms go up
          phase: j(8) * Math.PI * 2,
          speed: 5 + j(9) * 3,
          scale: 0.85 + j(10) * 0.15,
        });
      }
    }
    return list;
  }, []);
}

function Fan({ f, excite, hovered, onHover }) {
  const body = useRef();
  const mesh = useRef();
  const head = useRef();
  const phones = useRef();
  const mats = useMemo(
    () => ({
      down: fanMat(f.hair, false, f.tint),
      up: fanMat(f.hair, true, f.tint),
      hotDown: fanMat(f.hair, false, C.cyan),
      hotUp: fanMat(f.hair, true, C.cyan),
    }),
    [f]
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const e = excite.current;
    const hot = hovered.current === f.i;
    const beat = Math.sin(t * f.speed + f.phase);
    const up = hot || e > f.threshold;
    // a hovered fan holds still and just lights up: if it jumped, it would
    // slide out from under the pointer and the cheer bubble would flicker
    const k = Math.min(dt, 0.05);
    const y = hot ? 0 : Math.max(0, beat) * (0.03 + 0.3 * e);
    const rz = hot ? 0 : beat * 0.05 * e;
    body.current.position.y = THREE.MathUtils.damp(body.current.position.y, y, 14, k);
    body.current.rotation.z = THREE.MathUtils.damp(body.current.rotation.z, rz, 14, k);
    mesh.current.material = hot ? (up ? mats.hotUp : mats.hotDown) : up ? mats.up : mats.down;
    phones.current.visible = up && f.phone;
  });

  return (
    <group
      position={[f.x, f.y, f.z]}
      rotation={[0, f.yaw, 0]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover({ kind: "fan", i: f.i, target: head.current });
      }}
      onPointerOut={() => onHover(null, f.i)}
    >
      <group ref={body} scale={f.scale}>
        <mesh ref={mesh} geometry={fanPlane} material={mats.down} position={[0, 1.3, 0]} />
        <group ref={phones} visible={false}>
          {[-1, 1].map((s) => (
            <mesh key={s} geometry={phoneGeo} material={phoneMat} position={[s * 0.47, 2.62, 0.02]} />
          ))}
        </group>
        <group ref={head} position={[0, 2.5, 0]} />
      </group>
    </group>
  );
}

// --- the suspense: her name stands where she will, the line written in the light ---
const NAME = "NANDINI";
const NAME_H = 1.75;
const LAYERS = 9; // stacked cut-outs, front to back, for chunky 3D letters
const LAYER_GAP = 0.035;

/** A white glyph on transparent, redrawn once the poster font arrives. */
function glyphTexture(ch, font, size, w, h) {
  const c = document.createElement("canvas");
  c.width = w;
  c.height = h;
  const ctx = c.getContext("2d");
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  const draw = () => {
    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = "#fff";
    ctx.textAlign = "center";
    ctx.textBaseline = "alphabetic";
    ctx.font = `${size}px ${font}`;
    ctx.fillText(ch, w / 2, h * 0.9);
    tex.needsUpdate = true;
  };
  draw();
  if (document.fonts && document.fonts.load) document.fonts.load(`${size}px ${font}`, ch).then(draw, draw);
  return tex;
}

// Anton advance widths, as a share of the glyph height
const ADV = { N: 0.56, A: 0.55, D: 0.56, I: 0.27 };

function NameStandee({ spot, turn }) {
  const letters = useRef();
  const glyphs = useMemo(() => {
    const cache = {};
    let x = 0;
    const out = NAME.split("").map((ch) => {
      if (!cache[ch]) cache[ch] = glyphTexture(ch, "Anton", 300, 256, 340);
      const w = ADV[ch] * NAME_H;
      const g = { ch, map: cache[ch], x: x + w / 2 };
      x += w + 0.08;
      return g;
    });
    const total = x - 0.08;
    out.forEach((g) => (g.x -= total / 2));
    return out;
  }, []);
  // one material per depth layer: icy face, deepening to navy behind
  const mats = useMemo(
    () =>
      Array.from({ length: LAYERS }, (_, l) => {
        const col = new THREE.Color(l === 0 ? C.ice : "#0f2a66").lerp(new THREE.Color(C.ink), l === 0 ? 0 : l / LAYERS);
        return Object.fromEntries(
          Object.keys(ADV).map((ch) => [
            ch,
            new THREE.MeshBasicMaterial({ map: glyphs.find((g) => g.ch === ch).map, color: col, transparent: true, alphaTest: 0.5 }),
          ])
        );
      }),
    [glyphs]
  );
  const base = useMemo(() => mats.map((m) => m.N.color.clone()), [mats]);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = spot.current;
    const fade = 1 - smoothstep(0.3, 0.6, turn.current);
    mats.forEach((byCh, l) => {
      Object.values(byCh).forEach((m) => {
        m.color.copy(base[l]).multiplyScalar(0.35 + 0.65 * s);
        m.opacity = fade;
        m.visible = fade > 0.01;
      });
    });
    // the one-sheet wave, carried into 3D: each letter breathes in turn
    letters.current.children.forEach((g, i) => {
      g.position.y = NAME_H / 2 + Math.sin(t * 2.1 - i * 0.6) * 0.06;
      g.rotation.z = Math.sin(t * 2.1 - i * 0.6 + 1) * 0.025;
    });
  });

  const plane = useMemo(() => new THREE.PlaneGeometry(1, 1), []);
  return (
    <group ref={letters}>
      {glyphs.map((g, i) => (
        <group key={i} position={[g.x, NAME_H / 2, 0]}>
          {mats.map((byCh, l) => (
            <mesh
              key={l}
              geometry={plane}
              material={byCh[g.ch]}
              position={[0, l * 0.012, -l * LAYER_GAP]}
              scale={[NAME_H * (256 / 340), NAME_H, 1]}
              renderOrder={LAYERS - l}
            />
          ))}
        </group>
      ))}
    </group>
  );
}

/** The line she lives by, glowing in the beam above her name. */
function SpotLine({ spot, turn }) {
  const mat = useMemo(() => {
    const W = 2048;
    const H = 160;
    const c = document.createElement("canvas");
    c.width = W;
    c.height = H;
    const ctx = c.getContext("2d");
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const draw = () => {
      ctx.clearRect(0, 0, W, H);
      ctx.font = "96px Anton";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      if ("letterSpacing" in ctx) ctx.letterSpacing = "18px";
      ctx.shadowColor = "rgba(111,227,255,0.75)";
      ctx.shadowBlur = 22;
      ctx.fillStyle = "#f2e6cf";
      ctx.fillText("THE WORLD IS GONNA KNOW MY NAME", W / 2, H / 2 + 4);
      ctx.shadowBlur = 0;
      // a printed, worn texture: halftone rows and scuffs bitten out of the ink
      ctx.globalCompositeOperation = "destination-out";
      let seed = 7;
      const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
      for (let y = 0; y < H; y += 5) {
        for (let x = (y / 5) % 2 ? 2.5 : 0; x < W; x += 5) {
          const r = 0.6 + rnd() * 1.3;
          ctx.beginPath();
          ctx.arc(x, y, r, 0, Math.PI * 2);
          ctx.fill();
        }
      }
      for (let k = 0; k < 140; k++) {
        ctx.globalAlpha = 0.35 + rnd() * 0.5;
        ctx.fillRect(rnd() * W, rnd() * H, 4 + rnd() * 40, 1 + rnd() * 3);
      }
      ctx.globalAlpha = 1;
      ctx.globalCompositeOperation = "source-over";
      tex.needsUpdate = true;
    };
    draw();
    if (document.fonts && document.fonts.load) document.fonts.load("96px Anton").then(draw, draw);
    return new THREE.MeshBasicMaterial({
      map: tex,
      transparent: true,
      depthWrite: false,
      blending: THREE.AdditiveBlending,
      fog: false,
    });
  }, []);
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    // it flickers on a beat after the spot lands, like a sign warming up
    const on = smoothstep(0.55, 1, spot.current);
    const flick = on < 1 ? (Math.sin(t * 37) > 0.2 ? 1 : 0.35) : 0.92 + 0.08 * Math.sin(t * 3);
    mat.opacity = on * flick * (1 - smoothstep(0.25, 0.5, turn.current));
  });
  return (
    <mesh material={mat} position={[0, NAME_H + 0.75, 0.25]} renderOrder={20}>
      <planeGeometry args={[6.4, 0.5]} />
    </mesh>
  );
}

// --- her: seen only from behind, once the camera has come round ---
function Her({ spot, turn, onHover, starHead, hot }) {
  const sway = useRef();
  const mats = useMemo(
    () => ({
      photo: new THREE.MeshBasicMaterial({
        map: imageTexture(`${PUBLIC}/stage/nandini-half-fade.webp`),
        transparent: true,
        alphaTest: 0.02,
        opacity: 0,
      }),
      shadow: new THREE.MeshBasicMaterial({
        map: imageTexture(`${PUBLIC}/stage/nandini-half-shadow.webp`),
        color: "#000",
        transparent: true,
        opacity: 0,
        depthWrite: false,
      }),
      contact: new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: C.ink,
        transparent: true,
        opacity: 0.5,
        depthWrite: false,
      }),
    }),
    []
  );

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const reveal = smoothstep(0.42, 0.75, turn.current);
    mats.photo.opacity = reveal;
    mats.photo.visible = reveal > 0.01;
    mats.photo.color.setScalar(0.7 + 0.3 * spot.current);
    mats.shadow.opacity = 0.5 * reveal;
    sway.current.rotation.y = Math.sin(t * 0.6) * 0.04;
    const s = hot.current ? 1.04 : 1;
    sway.current.scale.setScalar(THREE.MathUtils.damp(sway.current.scale.x, s, 10, Math.min(dt, 0.05)));
  });

  return (
    <group
      position={[0, STAGE_TOP, STAGE_Z]}
      onPointerOver={(e) => {
        e.stopPropagation();
        onHover({ kind: "star", target: starHead.current });
      }}
      onPointerOut={() => onHover(null, "star")}
    >
      <mesh material={mats.contact} position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]} scale={[3, 1, 1]}>
        <planeGeometry args={[1.6, 1.6]} />
      </mesh>
      <NameStandee spot={spot} turn={turn} />
      <SpotLine spot={spot} turn={turn} />
      <group ref={sway}>
        {/* the photo faces upstage: only the reverse shot ever sees her */}
        <mesh material={mats.photo} position={[0, FIG_Y + FIG_H / 2, -0.4]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[FIG_W, FIG_H]} />
        </mesh>
        <mesh
          material={mats.shadow}
          position={[-0.14, FIG_Y + FIG_H / 2 - 0.08, -0.28]}
          rotation={[0, Math.PI, 0]}
          renderOrder={-1}
        >
          <planeGeometry args={[SHADOW_W, SHADOW_H]} />
        </mesh>
      </group>
      <group ref={starHead} position={[0, NAME_H + 1.3, 0]} />
    </group>
  );
}

// --- a dark velvet drop behind the stage ---
function Curtain() {
  const mat = useMemo(() => {
    const c = document.createElement("canvas");
    c.width = 512;
    c.height = 8;
    const ctx = c.getContext("2d");
    for (let x = 0; x < 512; x++) {
      const v = 0.5 + 0.5 * Math.sin(x * 0.11) * Math.sin(x * 0.031 + 1);
      const l = 6 + v * 16;
      ctx.fillStyle = `rgb(${l * 0.35},${l * 0.6},${l * 1.5 + 8})`;
      ctx.fillRect(x, 0, 1, 8);
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(3, 1);
    return new THREE.MeshBasicMaterial({ map: t });
  }, []);
  return (
    <mesh material={mat} position={[0, 5.4, -5.2]}>
      <planeGeometry args={[34, 12]} />
    </mesh>
  );
}

// --- the venue, all flat paper colours ---
const floorGeo = new THREE.PlaneGeometry(80, 80);
const stageGeo = new THREE.BoxGeometry(14, STAGE_TOP, 5.2);
const lipGeo = new THREE.BoxGeometry(14.05, 0.08, 0.1);
const bulbGeo = new THREE.CircleGeometry(0.08, 14);
const towerGeo = new THREE.BoxGeometry(0.3, 7, 0.3);
const trussGeo = new THREE.BoxGeometry(15, 0.26, 0.26);
const riserGeo = new THREE.BoxGeometry(20, 1, 1.7);
const flat = (color) => new THREE.MeshBasicMaterial({ color });

function Venue({ spot }) {
  const m = useMemo(() => {
    const grain = paperTexture();
    grain.repeat.set(24, 24);
    const floor = new THREE.MeshBasicMaterial({ color: "#0a1836", map: grain });
    const side = flat("#0b1d45");
    return {
      floor,
      stage: [side, side, flat("#1b3c86"), side, flat("#081633"), side],
      cream: flat(C.ice),
      bulb: flat(C.ice),
      ink: flat(C.ink),
      riser: flat("#071331"),
      hall: flat("#050d26"),
    };
  }, []);

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const on = spot.current;
    m.bulb.color.set(C.ice).multiplyScalar(0.45 + 0.55 * on * (0.7 + 0.3 * Math.sin(t * 6)));
    m.floor.color.set("#0a1836").multiplyScalar(1 - 0.35 * on);
  });

  return (
    <group>
      <mesh geometry={floorGeo} material={m.floor} rotation={[-Math.PI / 2, 0, 0]} />
      <mesh geometry={stageGeo} material={m.stage} position={[0, STAGE_TOP / 2, -2.2]} />
      <mesh geometry={lipGeo} material={m.cream} position={[0, STAGE_TOP, 0.4]} />
      {Array.from({ length: 34 }, (_, i) => (
        <mesh key={i} geometry={bulbGeo} material={m.bulb} position={[-6.6 + i * 0.4, STAGE_TOP - 0.2, 0.41]} />
      ))}
      {[-7.2, 7.2].map((x) => (
        <mesh key={x} geometry={towerGeo} material={m.ink} position={[x, 3.5, -1]} />
      ))}
      <mesh geometry={trussGeo} material={m.ink} position={[0, 7, -1]} />

      {Array.from({ length: FAN_ROWS }, (_, r) => r)
        .filter((r) => riserHeight(r) > 0)
        .map((r) => {
          const h = riserHeight(r);
          return (
            <mesh key={r} geometry={riserGeo} material={m.riser} position={[0, h / 2, 3.2 + r * 1.7]} scale={[1, h, 1]} />
          );
        })}
      <mesh material={m.hall} position={[0, 9, HALL_Z]} rotation={[0, Math.PI, 0]}>
        <planeGeometry args={[70, 22]} />
      </mesh>
      <mesh material={m.riser} position={[0, 6.0, HALL_Z - 0.6]}>
        <boxGeometry args={[60, 0.8, 1.2]} />
      </mesh>
    </group>
  );
}

const spotFrom = new THREE.Vector3(0, 9.5, 2.5);
const spotTo = new THREE.Vector3(0, STAGE_TOP, STAGE_Z);
const spotLen = spotFrom.distanceTo(spotTo) + 0.4;
const spotGeo = beamGeometry(1.5, spotLen);
const sweepGeo = beamGeometry(1.1, 11);
const poolGeo = new THREE.PlaneGeometry(4.2, 4.2);

function Lights({ spot, excite }) {
  const spotBeam = useMemo(() => beamMaterial(C.ice, 0.5), []);
  const sweepMat = useMemo(() => beamMaterial(C.cyan, 0.3), []);
  const poolMat = useMemo(
    () =>
      new THREE.MeshBasicMaterial({
        map: glowTexture(),
        color: C.ice,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    []
  );
  const sweeps = useRef();

  useFrame((state) => {
    const t = state.clock.elapsedTime;
    const s = spot.current;
    spotBeam.uniforms.uOpacity.value = 0.55 * s;
    poolMat.opacity = 0.75 * s;
    sweepMat.uniforms.uOpacity.value = 0.32 * excite.current;
    sweeps.current.children.forEach((b, i) => {
      const side = i < 2 ? -1 : 1;
      b.rotation.z = side * (0.35 + Math.sin(t * 0.9 + i * 1.7) * 0.35);
      b.rotation.x = -0.35 + Math.cos(t * 0.7 + i) * 0.2;
    });
  });

  return (
    <group>
      <mesh geometry={spotGeo} material={spotBeam} position={spotFrom.toArray()} quaternion={aim(spotFrom, spotTo)} />
      <mesh geometry={poolGeo} material={poolMat} position={[0, STAGE_TOP + 0.01, STAGE_Z]} rotation={[-Math.PI / 2, 0, 0]} />
      <group ref={sweeps}>
        {[-6.4, -3.2, 3.2, 6.4].map((x) => (
          <mesh key={x} geometry={sweepGeo} material={sweepMat} position={[x, 7, -1]} />
        ))}
      </group>
    </group>
  );
}

// Front: out in the crowd, looking at her. Back: just behind her right
// shoulder, looking out over the hall (the view from her photo).
const BACK_ANGLE = 2.85;
const BACK_RADIUS = 4.0;
const frontLook = new THREE.Vector3();
const backLook = new THREE.Vector3(-0.6, 3.1, 8);

function CameraRig({ progress, turn }) {
  const { camera } = useThree();
  const look = useMemo(() => new THREE.Vector3(), []);
  // ease the orbit parameters, not the position, so a fast scroll still
  // swings round her instead of cutting a straight line through the crowd
  const eased = useRef({ p: 0, k: 0 });
  useFrame((_, dt) => {
    const d = Math.min(dt, 0.05);
    const e = eased.current;
    e.p = THREE.MathUtils.damp(e.p, progress.current, 5, d);
    e.k = THREE.MathUtils.damp(e.k, turn.current, 5, d);
    const { p, k } = e;
    const ang = k * BACK_ANGLE;
    const rad = THREE.MathUtils.lerp(20.6 - p * 6, BACK_RADIUS, k);
    camera.position.set(
      Math.sin(ang) * rad + (1 - k) * Math.sin(p * Math.PI) * 1.2,
      THREE.MathUtils.lerp(6.1 - p * 1.5, 3.9, k),
      STAGE_Z + Math.cos(ang) * rad
    );
    frontLook.set(0, 3.1 - p * 0.4, STAGE_Z);
    look.lerpVectors(frontLook, backLook, k);
    camera.lookAt(look);
  });
  return null;
}

function BubbleTracker({ hoverRef, bubbleEl }) {
  const { camera, size } = useThree();
  const v = useMemo(() => new THREE.Vector3(), []);
  useFrame(() => {
    const el = bubbleEl.current;
    const h = hoverRef.current;
    if (!el || !h || !h.target) return;
    h.target.getWorldPosition(v);
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (-v.y * 0.5 + 0.5) * size.height;
    el.style.transform = `translate(${x.toFixed(1)}px, ${y.toFixed(1)}px)`;
  });
  return null;
}

function StageWorld({ progress, onHover, hoverRef, bubbleRef, bubbleEl }) {
  const fans = useFans();
  const spot = useRef(0);
  const excite = useRef(0);
  const turn = useRef(0);
  const hovered = useRef(null);
  const starHot = useRef(false);
  const starHead = useRef();
  const bg = useRef();
  const fog = useRef();

  useFrame(() => {
    const p = progress.current;
    spot.current = smoothstep(0.16, 0.3, p);
    excite.current = smoothstep(0.38, 0.55, p);
    turn.current = smoothstep(0.38, 0.72, p);
    const h = hoverRef.current;
    hovered.current = h && h.kind === "fan" ? h.i : null;
    starHot.current = !!(h && h.kind === "star");
    bg.current.copy(HOUSE).lerp(DARK, spot.current).lerp(ROAR, excite.current * 0.6);
    fog.current.color.copy(bg.current);
  });

  return (
    <>
      <color ref={bg} attach="background" args={[HOUSE.getStyle()]} />
      <fog ref={fog} attach="fog" args={[HOUSE.getStyle(), 22, 62]} />
      <CameraRig progress={progress} turn={turn} />
      <Curtain />
      <Lights spot={spot} excite={excite} />
      <Venue spot={spot} />
      <Her spot={spot} turn={turn} onHover={onHover} starHead={starHead} hot={starHot} />
      {fans.map((f) => (
        <Fan key={f.i} f={f} excite={excite} hovered={hovered} onHover={onHover} />
      ))}
      <BubbleTracker hoverRef={bubbleRef} bubbleEl={bubbleEl} />
    </>
  );
}

// the end card: one small wish, and the song it's borrowed from
const WISH_KICK = "ek choti si dua —";
const WISH = "main ban jaun sabse bada.";
const BUBBLE_MIN_MS = 2600; // a cheer stays up at least this long
const SONG_URL = "https://open.spotify.com/search/chaand%20taare";

// after the turn, who she is, typed out in her hand (from the About copy)
const ABOUT =
  "I’m a dreamer who shows up for the work — whether that’s building scalable AI backend systems, wrestling with hard problems until they give in, or stepping onto a stage to make my voice heard. Whatever the room, I bring all of me to it.";
const ABOUT_CPS = 55;
// script capitals turn acronyms into knots, so those get a plain italic serif
const CAPS = /([A-Z]{2,}(?:\/[A-Z]{2,})?|\d+\.\d+)/;

function withCaps(text, keyBase) {
  return text.split(CAPS).map((part, i) =>
    i % 2 ? (
      <span key={keyBase + i} className="stage-about-caps">
        {part}
      </span>
    ) : (
      part
    )
  );
}

function TypedAbout({ on }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (!on) {
      setN(0);
      return undefined;
    }
    if (reducedMotion()) {
      setN(ABOUT.length);
      return undefined;
    }
    let raf;
    let t0;
    let last = 0;
    const tick = (t) => {
      if (t0 === undefined) t0 = t;
      const next = Math.min(ABOUT.length, Math.floor(((t - t0) / 1000) * ABOUT_CPS));
      if (next - last >= 5) {
        last = next;
        playKey();
      }
      setN(next);
      if (next < ABOUT.length) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [on]);
  return (
    <p className={"stage-about" + (on ? " is-on" : "")} aria-label={ABOUT}>
      <span aria-hidden="true">{withCaps(ABOUT.slice(0, n), "t")}</span>
      <span className="stage-about-caret" aria-hidden="true"></span>
      <span className="stage-about-ghost" aria-hidden="true">
        {withCaps(ABOUT.slice(n), "g")}
      </span>
    </p>
  );
}

export default function StageScene() {
  const ref = useRef(null);
  const bubbleEl = useRef(null);
  const hoverRef = useRef(null);
  const sheet = useRef(null);
  const [aboutOn, setAboutOn] = useState(false);
  const [bubble, setBubble] = useState(null);
  const bubbleInner = useRef(null);


  // the one-sheet title: the same block letters, just breathing on a slow wave
  useEffect(() => {
    if (!sheet.current || reducedMotion()) return undefined;
    const a = animate(sheet.current.querySelectorAll(".stage-onesheet-l"), {
      y: [-6, 6],
      rotate: [-1.6, 1.6],
      duration: 1500,
      ease: "inOutSine",
      loop: true,
      alternate: true,
      delay: stagger(140),
    });
    return () => a.revert();
  }, []);

  // bubble words pop in one after another (the SRK line reads like a reveal)
  const bubbleKey = bubble && bubble.key;
  useEffect(() => {
    const el = bubbleInner.current;
    if (!el || reducedMotion()) return undefined;
    const split = splitText(el, { words: true });
    const a = animate(split.words, {
      opacity: { from: 0 },
      y: { from: 10 },
      scale: { from: 0.6 },
      duration: 500,
      delay: stagger(bubble.kind === "star" ? 70 : 40, { start: 120 }),
      ease: "outBack(2)",
    });
    return () => {
      a.revert();
      split.revert();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubbleKey]);
  const [webgl] = useState(hasWebGL);

  const { progress, inView } = useSectionProgress(ref, (p) => {
    // her name stands on stage for the front shot; the poster title only
    // comes in as the end card, once she has been seen
    if (sheet.current) {
      const o = smoothstep(0.86, 0.96, p);
      sheet.current.style.opacity = o.toFixed(3);
      sheet.current.classList.toggle("is-on", o > 0.6);
    }
    setAboutOn((prev) => (prev ? p > 0.68 : p >= 0.74));
  });

  // hover from the 3D scene. The highlight follows the pointer at once
  // (hoverRef); the bubble (bubbleRef) is sticky: it stays up for a minimum
  // read time, only moves to another fan once the pointer settles there, and
  // lingers a moment after the pointer leaves, so the cheer can be read.
  const bubbleRef = useRef(null);
  const bubbleAt = useRef(0);
  const swapTimer = useRef(0);
  const hideTimer = useRef(0);
  useEffect(
    () => () => {
      clearTimeout(swapTimer.current);
      clearTimeout(hideTimer.current);
    },
    []
  );
  const showBubble = (h) => {
    bubbleRef.current = h;
    bubbleAt.current = performance.now();
    playClick();
    setBubble({
      kind: h.kind,
      text: h.kind === "star" ? SRK : CHEERS[Math.floor(Math.random() * CHEERS.length)],
      key: Math.random(),
    });
  };
  const onHover = (h, who) => {
    const shown = performance.now() - bubbleAt.current;
    if (h) {
      hoverRef.current = h;
      document.body.style.cursor = "pointer";
      clearTimeout(hideTimer.current);
      clearTimeout(swapTimer.current);
      const b = bubbleRef.current;
      if (b && b.kind === h.kind && b.i === h.i) return; // same one: keep its words
      if (!b) {
        showBubble(h);
        return;
      }
      swapTimer.current = setTimeout(() => {
        if (hoverRef.current === h) showBubble(h);
      }, Math.max(350, BUBBLE_MIN_MS - shown));
    } else {
      const cur = hoverRef.current;
      if (cur && (who === "star" ? cur.kind !== "star" : cur.i !== who)) return;
      hoverRef.current = null;
      document.body.style.cursor = "";
      clearTimeout(swapTimer.current);
      clearTimeout(hideTimer.current);
      if (!bubbleRef.current) return;
      hideTimer.current = setTimeout(() => {
        if (hoverRef.current) return;
        bubbleRef.current = null;
        setBubble(null);
      }, Math.max(1200, BUBBLE_MIN_MS - shown));
    }
  };

  return (
    <section className="stage" id="stage" ref={ref} aria-label="On stage">
      <div className="stage-sticky">
        <h2 className="sr-only">The world is gonna know my name</h2>
        <div className="stage-canvas">
          {webgl ? (
            <Canvas
              flat
              dpr={[1, 1.5]}
              frameloop={inView ? "always" : "never"}
              camera={{ position: [0, 5.2, 19], fov: 38 }}
              gl={{ antialias: true }}
              onPointerMissed={() => onHover(null, hoverRef.current && hoverRef.current.i)}
            >
              <StageWorld progress={progress} onHover={onHover} hoverRef={hoverRef} bubbleRef={bubbleRef} bubbleEl={bubbleEl} />
            </Canvas>
          ) : (
            <div className="stage-fallback">NANDINI</div>
          )}
        </div>

        <div className="stage-onesheet" ref={sheet}>
          <p className="stage-wish-kick">{WISH_KICK}</p>
          <p className="stage-wish">
            {WISH.split(" ").map((w, i) => (
              <span key={i} className="stage-onesheet-l">
                {w}
              </span>
            ))}
          </p>
          <a className="stage-np" href={SONG_URL} target="_blank" rel="noreferrer">
            <span className="stage-np-art" aria-hidden="true">
              <svg viewBox="0 0 40 40">
                <defs>
                  <pattern id="np-dots" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
                    <circle cx="1.5" cy="1.5" r="0.8" fill="#130c2c" opacity="0.55" />
                  </pattern>
                </defs>
                <rect width="40" height="40" rx="6" fill="#5a43b8" />
                <path d="M23 9a11 11 0 1 0 8 18A9 9 0 0 1 23 9z" fill="#f2e6cf" />
                <path d="M30 8l1 2.4 2.4 1-2.4 1L30 15l-1-2.6-2.4-1 2.4-1z" fill="#5fd3f5" />
                <path d="M33 20l.6 1.4 1.4.6-1.4.6L33 24l-.6-1.4L31 22l1.4-.6z" fill="#5fd3f5" />
                <rect width="40" height="40" rx="6" fill="url(#np-dots)" />
              </svg>
            </span>
            <span className="stage-np-text">
              <small>now playing</small>
              Chaand Taare
            </span>
            <span className="stage-np-bars" aria-hidden="true">
              <i />
              <i />
              <i />
            </span>
            <FaSpotify className="stage-np-logo" aria-hidden="true" />
          </a>
        </div>

        <TypedAbout on={aboutOn} />


        <div
          ref={bubbleEl}
          className={"stage-bubble" + (bubble ? " is-on" : "") + (bubble && bubble.kind === "star" ? " is-star" : "")}
          aria-live="polite"
        >
          {bubble && (
            <span className="stage-bubble-inner" key={bubble.key} ref={bubbleInner}>
              {bubble.text}
            </span>
          )}
        </div>
      </div>
    </section>
  );
}
