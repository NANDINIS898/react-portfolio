import React, { useMemo, useRef } from "react";
import * as THREE from "three";
import { useFrame } from "@react-three/fiber";
import { glyphTexture, floralTexture } from "./textures";

/**
 * Nandini as a brick-built minifigure, made only from three.js primitives.
 * About 2.95 units tall, feet at y = 0, facing +z.
 *
 *   persona  builder | debugger | performer | creator | dancer | filmmaker | stage
 *            picks the outfit colour, chest print, headgear, hand prop and
 *            the default pose
 *   pose     optional override: "type" (sitting at a keyboard)
 *
 * Arm and leg angles ease toward each pose, and a persona change pops the
 * figure with a little bounce.
 */

// ---------- shared geometry (built once for every figure on the page) ----------

function torsoGeometry() {
  // a 4-sided cylinder is a square frustum; turn it so the faces line up
  const g = new THREE.CylinderGeometry(0.41 * Math.SQRT2, 0.5 * Math.SQRT2, 0.95, 4, 1);
  g.rotateY(Math.PI / 4);
  g.scale(1, 1, 0.5);
  return g;
}

export const GEO = {
  hip: new THREE.BoxGeometry(1.0, 0.18, 0.5),
  leg: new THREE.BoxGeometry(0.46, 0.7, 0.5),
  foot: new THREE.BoxGeometry(0.46, 0.18, 0.6),
  torso: torsoGeometry(),
  neck: new THREE.CylinderGeometry(0.13, 0.13, 0.1, 16),
  head: new THREE.CylinderGeometry(0.34, 0.34, 0.56, 32),
  hairCap: new THREE.SphereGeometry(0.385, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
  hairBack: new THREE.CylinderGeometry(0.4, 0.44, 0.98, 32, 1, false, Math.PI * 0.3, Math.PI * 1.4),
  // long straight hair falling down her back (the back half of a tapered tube)
  hairLong: new THREE.CylinderGeometry(0.4, 0.36, 1.45, 32, 1, false, Math.PI * 0.55, Math.PI * 0.9),
  hairLock: new THREE.BoxGeometry(0.1, 0.62, 0.2),
  bangs: new THREE.BoxGeometry(0.6, 0.12, 0.14),
  arm: new THREE.CylinderGeometry(0.12, 0.13, 0.6, 16),
  wrist: new THREE.CylinderGeometry(0.06, 0.06, 0.1, 12),
  hand: new THREE.TorusGeometry(0.1, 0.05, 10, 20, Math.PI * 1.6),
  eye: new THREE.SphereGeometry(0.045, 12, 8),
  lash: new THREE.BoxGeometry(0.07, 0.016, 0.02),
  smile: new THREE.TorusGeometry(0.1, 0.017, 8, 20, Math.PI),
  blush: new THREE.CircleGeometry(0.05, 16),
  print: new THREE.PlaneGeometry(0.5, 0.5),
};

const plastic = (color, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: 0.32, metalness: 0.04, ...extra });

export const MAT = {
  skin: plastic("#e9b48c"),
  hair: plastic("#1a1220", { roughness: 0.45 }),
  pants: plastic("#16205a"),
  black: plastic("#0b0d14"),
  white: plastic("#f4f8ff"),
  lips: plastic("#b3365f"),
  blush: new THREE.MeshBasicMaterial({ color: "#ff8fb8", transparent: true, opacity: 0.55 }),
  yellow: plastic("#ffc928"),
  steel: plastic("#b9c6d8", { metalness: 0.7, roughness: 0.25 }),
  wood: plastic("#8a5a32"),
  ice: plastic("#9fe6ff", { transparent: true, opacity: 0.45, roughness: 0.05 }),
  glow: new THREE.MeshBasicMaterial({ color: "#dff6ff" }),
  cyan: plastic("#6fe3ff", { emissive: "#1b6f99", emissiveIntensity: 0.6 }),
};

export const PERSONA_LOOK = {
  builder: { torso: "#ff9f1c", glyph: "{ }" },
  debugger: { torso: "#2f6bff", glyph: ">_" },
  performer: { torso: "#cfeeff", glyph: "★", metal: true },
  creator: { torso: "#6fe3ff", glyph: "REC" },
  dancer: { torso: "#ff5fb0", glyph: "♪" },
  filmmaker: { torso: "#141a2e", glyph: "▶" },
  // the stage photo: black sleeveless top with gold florals, dark skirt
  stage: { torso: "#ffffff", floral: true, sleeveless: true, legs: "#0b0a10", glyph: null },
};

// ---------- poses ----------
// Right arm hangs at -x (her right), left arm at +x. For an arm group,
// rotation.x < 0 swings it forward/up, rotation.z swings it out to the side
// (negative for the right arm, positive for the left).

function poseFor(name, t) {
  const p = { rx: 0, rz: -0.12, lx: 0, lz: 0.12, rl: 0, ll: 0, y: 0, roll: 0, head: 0, clap: 0 };
  switch (name) {
    case "builder":
      p.rx = -1.25 + Math.sin(t * 5) * 0.35;
      p.rz = -0.12;
      p.lx = -0.15;
      p.lz = 0.5;
      p.head = Math.sin(t * 1.2) * 0.12;
      break;
    case "debugger":
      p.rx = -1.4;
      p.rz = -0.3;
      p.lx = -0.95;
      p.lz = 0.25;
      p.head = Math.sin(t * 0.9) * 0.3;
      break;
    case "performer":
      p.rx = -2.45;
      p.rz = -0.55;
      p.lx = -0.25;
      p.lz = 2.35 + Math.sin(t * 3) * 0.3;
      p.y = Math.abs(Math.sin(t * 2.5)) * 0.05;
      p.roll = Math.sin(t * 1.25) * 0.05;
      break;
    case "creator":
      p.rx = -1.95;
      p.rz = -0.3;
      p.lx = -0.15;
      p.lz = 0.9 + Math.sin(t * 2.5) * 0.25;
      p.head = 0.15;
      break;
    case "dancer": {
      const s = Math.sin(t * 4.2);
      p.rx = -0.35 + s * 0.25;
      p.rz = -2.45 + s * 0.4;
      p.lx = -0.35 - s * 0.25;
      p.lz = 2.45 + s * 0.4;
      p.rl = Math.max(0, s) * -0.7;
      p.ll = Math.max(0, -s) * -0.7;
      p.y = Math.abs(s) * 0.14;
      p.roll = s * 0.09;
      p.head = s * 0.2;
      break;
    }
    case "filmmaker":
      p.rx = -1.35;
      p.rz = -0.05;
      p.lx = -1.35;
      p.lz = 0.05;
      p.clap = Math.max(0, Math.sin(t * 2.6)) * 0.55;
      p.head = Math.sin(t * 0.8) * 0.12;
      break;
    case "stage":
      // standing easy, looking out over the crowd to her left
      p.rz = -0.1 - Math.sin(t * 1.1) * 0.03;
      p.lz = 0.1 + Math.sin(t * 1.1) * 0.03;
      p.rx = 0.05;
      p.lx = 0.05;
      p.head = 0.55 + Math.sin(t * 0.5) * 0.18;
      p.roll = Math.sin(t * 0.9) * 0.015;
      break;
    case "wave": {
      // one arm up, waving back at the crowd
      const w = Math.sin(t * 6);
      p.lz = 0.12;
      p.lx = 0.05;
      p.rx = -0.2;
      p.rz = -2.5 - w * 0.3;
      p.head = 0.35 + Math.sin(t * 0.7) * 0.3;
      p.y = Math.abs(Math.sin(t * 3)) * 0.03;
      break;
    }
    case "type": {
      const k = t * 16;
      p.rx = -1.1 + Math.max(0, Math.sin(k)) * 0.1;
      p.rz = 0.12;
      p.lx = -1.1 + Math.max(0, Math.sin(k + 2)) * 0.1;
      p.lz = -0.12;
      p.rl = -1.57;
      p.ll = -1.57;
      p.head = Math.sin(t * 0.6) * 0.06;
      break;
    }
    default:
      p.rz = -0.12 - Math.sin(t * 1.5) * 0.05;
      p.lz = 0.12 + Math.sin(t * 1.5) * 0.05;
  }
  return p;
}

// ---------- props (in hand space: the prop's long axis runs along local z) ----------

function Hammer() {
  return (
    <group position={[0, 0, 0.16]}>
      <mesh geometry={HAMMER.handle} material={MAT.wood} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={HAMMER.head} material={MAT.steel} position={[0, 0, 0.36]} />
    </group>
  );
}
const HAMMER = {
  handle: new THREE.CylinderGeometry(0.035, 0.035, 0.72, 10),
  head: new THREE.BoxGeometry(0.13, 0.38, 0.13),
};

function Magnifier() {
  return (
    <group position={[0, 0, 0.1]}>
      <mesh geometry={MAG.handle} material={MAT.black} rotation={[Math.PI / 2, 0, 0]} />
      <group position={[0, 0, 0.36]} rotation={[Math.PI / 2, 0, 0]}>
        <mesh geometry={MAG.ring} material={MAT.steel} />
        <mesh geometry={MAG.lens} material={MAT.ice} />
      </group>
    </group>
  );
}
const MAG = {
  handle: new THREE.CylinderGeometry(0.035, 0.035, 0.32, 10),
  ring: new THREE.TorusGeometry(0.16, 0.03, 8, 28),
  lens: new THREE.CircleGeometry(0.16, 28),
};

function Mic() {
  return (
    <group position={[0, 0, 0.08]}>
      <mesh geometry={MIC.handle} material={MAT.black} rotation={[Math.PI / 2, 0, 0]} />
      <mesh geometry={MIC.ball} material={MAT.steel} position={[0, 0, 0.22]} />
    </group>
  );
}
const MIC = {
  handle: new THREE.CylinderGeometry(0.05, 0.032, 0.3, 12),
  ball: new THREE.SphereGeometry(0.09, 16, 12),
};

function Phone() {
  return (
    <group position={[0, 0, 0.16]}>
      <mesh geometry={PHONE.body} material={MAT.black} />
      <mesh geometry={PHONE.screen} material={MAT.cyan} position={[0, 0.016, 0]} />
    </group>
  );
}
const PHONE = {
  body: new THREE.BoxGeometry(0.22, 0.03, 0.4),
  screen: new THREE.BoxGeometry(0.19, 0.005, 0.35),
};

function Clapper({ clapRef }) {
  return (
    <group position={[0.28, -0.02, 0.18]}>
      <mesh geometry={CLAP.board} material={MAT.black} />
      <mesh geometry={CLAP.stripe} material={MAT.white} position={[0, -0.02, -0.02]} />
      <group ref={clapRef} position={[0, 0, 0.22]}>
        <mesh geometry={CLAP.stick} material={MAT.black} position={[0, 0, 0.05]} />
        {[-0.18, 0, 0.18].map((x) => (
          <mesh key={x} geometry={CLAP.tooth} material={MAT.white} position={[x, -0.016, 0.05]} rotation={[0, 0.5, 0]} />
        ))}
      </group>
    </group>
  );
}
const CLAP = {
  board: new THREE.BoxGeometry(0.56, 0.03, 0.42),
  stripe: new THREE.BoxGeometry(0.5, 0.005, 0.03),
  stick: new THREE.BoxGeometry(0.56, 0.03, 0.09),
  tooth: new THREE.BoxGeometry(0.06, 0.004, 0.09),
};

const HAT = {
  dome: new THREE.SphereGeometry(0.42, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
  brim: new THREE.CylinderGeometry(0.52, 0.52, 0.04, 32),
  beret: new THREE.SphereGeometry(0.44, 28, 14),
  stem: new THREE.CylinderGeometry(0.03, 0.03, 0.08, 8),
  lensRing: new THREE.TorusGeometry(0.085, 0.015, 8, 24),
  bridge: new THREE.BoxGeometry(0.08, 0.015, 0.015),
  band: new THREE.TorusGeometry(0.392, 0.03, 8, 40),
  ring: new THREE.TorusGeometry(0.78, 0.05, 12, 64),
  pole: new THREE.CylinderGeometry(0.03, 0.03, 2.3, 8),
  star: new THREE.OctahedronGeometry(0.12),
};

// ---------- the figure ----------

function Leg({ side, legRef, material }) {
  return (
    <group ref={legRef} position={[side * 0.25, 0.86, 0]}>
      <mesh geometry={GEO.leg} material={material} position={[0, -0.35, 0]} />
      <mesh geometry={GEO.foot} material={material} position={[0, -0.77, 0.05]} />
    </group>
  );
}

function Arm({ side, armRef, torsoMat, children }) {
  return (
    <group ref={armRef} position={[side * 0.5, 1.86, 0]}>
      <mesh geometry={GEO.arm} material={torsoMat} position={[0, -0.28, 0]} />
      <mesh geometry={GEO.wrist} material={MAT.skin} position={[0, -0.6, 0]} />
      <group position={[0, -0.68, 0.02]}>
        <mesh geometry={GEO.hand} material={MAT.skin} rotation={[0, 0, Math.PI * 1.7]} />
        {children}
      </group>
    </group>
  );
}

function Face() {
  return (
    <group>
      {[-1, 1].map((s) => (
        <group key={s}>
          <mesh geometry={GEO.eye} material={MAT.black} position={[s * 0.12, 2.38, 0.312]} scale={[1, 1.25, 0.5]} />
          <mesh geometry={GEO.lash} material={MAT.black} position={[s * 0.17, 2.43, 0.29]} rotation={[0, s * 0.5, s * 0.55]} />
          <mesh
            geometry={GEO.blush}
            material={MAT.blush}
            position={[s * 0.2, 2.27, 0.276]}
            rotation={[0, s * 0.63, 0]}
          />
        </group>
      ))}
      <mesh geometry={GEO.smile} material={MAT.lips} position={[0, 2.26, 0.333]} rotation={[0, 0, Math.PI]} />
    </group>
  );
}

function Hair({ hidden }) {
  return (
    <group visible={!hidden}>
      <mesh geometry={GEO.hairCap} material={MAT.hair} position={[0, 2.6, 0]} scale={[1, 0.72, 1]} />
      <mesh geometry={GEO.hairBack} material={MAT.hair} position={[0, 2.09, 0]} />
      <mesh geometry={GEO.hairLong} material={MAT.hair} position={[0, 1.72, -0.04]} />
      <mesh geometry={GEO.bangs} material={MAT.hair} position={[0.04, 2.6, 0.3]} rotation={[0.2, 0, -0.12]} />
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={GEO.hairLock} material={MAT.hair} position={[s * 0.34, 2.28, 0.13]} rotation={[0, 0, s * 0.06]} />
      ))}
    </group>
  );
}

export default function LegoGirl({ persona = "builder", pose, showRingLight = true, ...groupProps }) {
  const look = PERSONA_LOOK[persona] || PERSONA_LOOK.builder;
  const torsoMat = useMemo(
    () =>
      plastic(look.torso, {
        ...(look.metal ? { metalness: 0.55, roughness: 0.2 } : {}),
        ...(look.floral ? { map: floralTexture(), roughness: 0.6 } : {}),
      }),
    [look.torso, look.metal, look.floral]
  );
  const legMat = useMemo(() => (look.legs ? plastic(look.legs, { roughness: 0.55 }) : MAT.pants), [look.legs]);
  const armMat = look.sleeveless ? MAT.skin : torsoMat;
  const printMat = useMemo(
    () =>
      look.glyph
        ? new THREE.MeshBasicMaterial({ map: glyphTexture(look.glyph), transparent: true, depthWrite: false })
        : null,
    [look.glyph]
  );

  const root = useRef();
  const body = useRef();
  const head = useRef();
  const rArm = useRef();
  const lArm = useRef();
  const rLeg = useRef();
  const lLeg = useRef();
  const clap = useRef();
  const swap = useRef({ persona, at: -10 });

  const poseName = pose || persona;

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime;
    const d = Math.min(dt, 0.05);
    if (swap.current.persona !== persona) swap.current = { persona, at: t };

    const p = poseFor(poseName, t);
    const damp = (obj, key, target, speed = 10) => {
      obj[key] = THREE.MathUtils.damp(obj[key], target, speed, d);
    };
    damp(rArm.current.rotation, "x", p.rx);
    damp(rArm.current.rotation, "z", p.rz);
    damp(lArm.current.rotation, "x", p.lx);
    damp(lArm.current.rotation, "z", p.lz);
    damp(rLeg.current.rotation, "x", p.rl);
    damp(lLeg.current.rotation, "x", p.ll);
    damp(body.current.position, "y", p.y);
    damp(body.current.rotation, "z", p.roll);
    damp(head.current.rotation, "y", p.head, 6);
    if (clap.current) clap.current.rotation.x = p.clap;

    // persona swap: a quick squash-and-stretch pop
    const since = t - swap.current.at;
    const pop = since < 1.2 ? Math.exp(-since * 5) * Math.sin(since * 22) * 0.12 : 0;
    root.current.scale.set(1 - pop * 0.5, 1 + pop, 1 - pop * 0.5);
  });

  const hat = persona === "builder";
  return (
    <group {...groupProps}>
      <group ref={root}>
        <group ref={body}>
          {/* legs + hips */}
          <mesh geometry={GEO.hip} material={legMat} position={[0, 0.92, 0]} />
          <Leg side={-1} legRef={rLeg} material={legMat} />
          <Leg side={1} legRef={lLeg} material={legMat} />

          {/* torso */}
          <mesh geometry={GEO.torso} material={torsoMat} position={[0, 1.485, 0]} />
          {printMat && (
            <mesh geometry={GEO.print} material={printMat} position={[0, 1.5, 0.232]} rotation={[-0.047, 0, 0]} />
          )}
          <mesh geometry={GEO.neck} material={MAT.skin} position={[0, 2.0, 0]} />

          <Arm side={-1} armRef={rArm} torsoMat={armMat}>
            {persona === "builder" && <Hammer />}
            {persona === "debugger" && poseName !== "type" && <Magnifier />}
            {persona === "performer" && <Mic />}
            {persona === "creator" && <Phone />}
            {persona === "filmmaker" && <Clapper clapRef={clap} />}
          </Arm>
          <Arm side={1} armRef={lArm} torsoMat={armMat} />

          {/* head */}
          <group ref={head}>
            <mesh geometry={GEO.head} material={MAT.skin} position={[0, 2.33, 0]} />
            <Face />
            <Hair />
            {hat && (
              <group>
                <mesh geometry={HAT.dome} material={MAT.yellow} position={[0, 2.6, 0]} scale={[1, 0.8, 1]} />
                <mesh geometry={HAT.brim} material={MAT.yellow} position={[0, 2.62, 0.04]} />
              </group>
            )}
            {persona === "debugger" && (
              <group>
                {[-1, 1].map((s) => (
                  <mesh key={s} geometry={HAT.lensRing} material={MAT.cyan} position={[s * 0.12, 2.38, 0.345]} />
                ))}
                <mesh geometry={HAT.bridge} material={MAT.cyan} position={[0, 2.4, 0.35]} />
              </group>
            )}
            {persona === "dancer" && (
              <mesh geometry={HAT.band} material={MAT.cyan} position={[0, 2.6, 0]} rotation={[Math.PI / 2 - 0.15, 0, 0]} />
            )}
            {persona === "filmmaker" && (
              <group position={[0.05, 2.8, -0.02]} rotation={[0, 0, 0.16]}>
                <mesh geometry={HAT.beret} material={MAT.black} scale={[1, 0.28, 1]} />
                <mesh geometry={HAT.stem} material={MAT.black} position={[0, 0.14, 0]} />
              </group>
            )}
          </group>

          {persona === "creator" && showRingLight && (
            <group position={[0, 0, -1.0]}>
              <mesh geometry={HAT.ring} material={MAT.glow} position={[0, 2.35, 0]} />
              <mesh geometry={HAT.pole} material={MAT.black} position={[0, 1.15, 0]} />
            </group>
          )}
          {persona === "performer" &&
            [0, 1, 2].map((i) => (
              <mesh
                key={i}
                geometry={HAT.star}
                material={MAT.cyan}
                position={[Math.cos(i * 2.1) * 0.9, 3.0 + i * 0.12, Math.sin(i * 2.1) * 0.5]}
              />
            ))}
        </group>
      </group>
    </group>
  );
}
