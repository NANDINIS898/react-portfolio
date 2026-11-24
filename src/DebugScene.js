import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame, useThree } from "@react-three/fiber";
import LegoGirl, { MAT } from "./three/LegoGirl";
import { createCodeScreen } from "./three/codeScreen";
import { useSectionProgress, hasWebGL } from "./three/useSectionProgress";
import { skillGroups } from "./skillData";
import { playKey } from "./sound";
import { decode, animate, stagger, reducedMotion } from "./motion";
import "./DebugScene.css";

/**
 * Act III: Nandini at her Y2K computer, typing and debugging on a loop. As you
 * scroll, her tech stack branches out of her head, one group at a time.
 */

const deskMat = new THREE.MeshStandardMaterial({ color: "#0d1d44", roughness: 0.35, metalness: 0.2 });
const shellMat = new THREE.MeshStandardMaterial({
  color: "#7fd8ff",
  roughness: 0.12,
  transparent: true,
  opacity: 0.78,
});
const chairMat = new THREE.MeshStandardMaterial({ color: "#2f7bff", roughness: 0.15 });
const keysMat = new THREE.MeshStandardMaterial({ color: "#cfeeff", roughness: 0.4 });
const steamMat = new THREE.MeshBasicMaterial({ color: "#cfeeff", transparent: true, opacity: 0.35 });
const orange = new THREE.MeshStandardMaterial({ color: "#ff8a1c", roughness: 0.3 });

function Steam() {
  const g = useRef();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    g.current.children.forEach((m, i) => {
      const k = (t * 0.5 + i / 3) % 1;
      m.position.set(Math.sin(k * 6 + i) * 0.05, k * 0.6, 0);
      m.scale.setScalar(0.4 + k);
      m.material.opacity = 0.35 * (1 - k);
    });
  });
  return (
    <group ref={g} position={[0, 0.25, 0]}>
      {[0, 1, 2].map((i) => (
        <mesh key={i} material={steamMat.clone()}>
          <sphereGeometry args={[0.06, 10, 8]} />
        </mesh>
      ))}
    </group>
  );
}

function Workstation({ screen }) {
  const screenMat = useMemo(() => new THREE.MeshBasicMaterial({ map: screen.texture }), [screen]);
  useFrame((_, dt) => screen.update(Math.min(dt, 0.1)));

  return (
    <group>
      {/* desk */}
      <mesh material={deskMat} position={[0, 1.9, 0.95]}>
        <boxGeometry args={[3.6, 0.1, 1.4]} />
      </mesh>
      {[-1.65, 1.65].map((x) => (
        <mesh key={x} material={deskMat} position={[x, 0.93, 0.95]}>
          <boxGeometry args={[0.1, 1.85, 1.3]} />
        </mesh>
      ))}

      {/* translucent CRT, iMac-blue */}
      <group position={[0, 2.8, 1.35]}>
        <mesh material={shellMat}>
          <boxGeometry args={[1.7, 1.35, 0.85]} />
        </mesh>
        <mesh material={shellMat} position={[0, -0.05, 0.55]}>
          <boxGeometry args={[1.1, 0.95, 0.5]} />
        </mesh>
        <mesh material={screenMat} position={[0, 0.04, -0.43]} rotation={[0, Math.PI, 0]}>
          <planeGeometry args={[1.42, 1.06]} />
        </mesh>
        <mesh material={MAT.black} position={[0, -0.82, 0.05]}>
          <cylinderGeometry args={[0.35, 0.45, 0.18, 24]} />
        </mesh>
        <pointLight position={[0, 0, -1]} color="#6fe3ff" intensity={6} distance={4} />
      </group>

      {/* keyboard */}
      <mesh material={keysMat} position={[0, 1.98, 0.55]} rotation={[0.08, 0, 0]}>
        <boxGeometry args={[1.25, 0.06, 0.38]} />
      </mesh>

      {/* rubber duck — every debugger's senior engineer */}
      <group position={[1.15, 1.95, 0.55]} rotation={[0, -2.4, 0]} scale={0.8}>
        <mesh material={MAT.yellow} position={[0, 0.14, 0]} scale={[1.2, 0.85, 1]}>
          <sphereGeometry args={[0.18, 20, 14]} />
        </mesh>
        <mesh material={MAT.yellow} position={[0, 0.36, 0.1]}>
          <sphereGeometry args={[0.12, 20, 14]} />
        </mesh>
        <mesh material={orange} position={[0, 0.34, 0.22]} rotation={[Math.PI / 2, 0, 0]} scale={[1.4, 1, 0.6]}>
          <coneGeometry args={[0.05, 0.1, 12]} />
        </mesh>
        <mesh material={MAT.black} position={[0.05, 0.4, 0.2]}>
          <sphereGeometry args={[0.018, 8, 6]} />
        </mesh>
      </group>

      {/* mug */}
      <group position={[-1.2, 1.95, 0.7]}>
        <mesh material={MAT.white} position={[0, 0.13, 0]}>
          <cylinderGeometry args={[0.13, 0.12, 0.26, 20]} />
        </mesh>
        <Steam />
      </group>

      {/* bubble chair */}
      <mesh material={chairMat} position={[0, 1.13, -0.05]} scale={[1, 0.28, 0.95]}>
        <sphereGeometry args={[0.62, 28, 16]} />
      </mesh>
      <mesh material={chairMat} position={[0, 1.85, -0.62]} rotation={[-0.15, 0, 0]} scale={[1, 1.15, 0.3]}>
        <sphereGeometry args={[0.6, 28, 16]} />
      </mesh>
      <mesh material={MAT.steel} position={[0, 0.55, -0.05]}>
        <cylinderGeometry args={[0.06, 0.06, 1.0, 12]} />
      </mesh>
      <mesh material={MAT.black} position={[0, 0.06, -0.05]}>
        <cylinderGeometry args={[0.5, 0.5, 0.08, 24]} />
      </mesh>

      <LegoGirl persona="debugger" pose="type" position={[0, 0.36, 0]} />
    </group>
  );
}

const floorGeo = new THREE.CircleGeometry(6, 64);
const floorMat = new THREE.MeshStandardMaterial({ color: "#071433", roughness: 0.6 });

/** Projects her head to screen space so the HTML branches can start there. */
function HeadAnchor({ onAnchor }) {
  const { camera, size } = useThree();
  const marker = useRef();
  const v = useMemo(() => new THREE.Vector3(), []);
  const last = useRef({ x: -1, y: -1, w: 0, h: 0 });
  useFrame(() => {
    marker.current.getWorldPosition(v);
    v.project(camera);
    const x = (v.x * 0.5 + 0.5) * size.width;
    const y = (-v.y * 0.5 + 0.5) * size.height;
    const l = last.current;
    if (Math.abs(x - l.x) > 1 || Math.abs(y - l.y) > 1 || l.w !== size.width || l.h !== size.height) {
      last.current = { x, y, w: size.width, h: size.height };
      onAnchor(last.current);
    }
  });
  return <group ref={marker} position={[0, 3.25, 0]} />;
}

function DebugWorld({ onAnchor }) {
  const screen = useMemo(() => createCodeScreen(), []);
  const { camera } = useThree();
  useFrame((state) => {
    const t = state.clock.elapsedTime;
    camera.position.x = 4.3 + Math.sin(t * 0.2) * 0.25;
    camera.lookAt(-0.15, 2.6, 0.8);
  });
  return (
    <>
      <ambientLight intensity={0.5} />
      <hemisphereLight args={["#bfe9ff", "#061332", 0.6]} />
      <directionalLight position={[-4, 7, -3]} intensity={1.8} />
      <pointLight position={[3, 4, 3]} color="#2f7bff" intensity={20} />
      <mesh geometry={floorGeo} material={floorMat} rotation={[-Math.PI / 2, 0, 0]} />
      <Workstation screen={screen} />
      <HeadAnchor onAnchor={onAnchor} />
    </>
  );
}

// branch end points (centre-top of each card), as % of the stage
const NODES = [
  { x: 10, y: 10 },
  { x: 30, y: 4 },
  { x: 52, y: 2 },
  { x: 74, y: 4 },
  { x: 91, y: 10 },
];

export default function DebugScene() {
  const ref = useRef(null);
  const stageRef = useRef(null);
  const cardRefs = useRef([]);
  const [shown, setShown] = useState(0);

  // the newest node decodes its label and its chips spill out of the branch
  const lastShown = useRef(0);
  useEffect(() => {
    const prev = lastShown.current;
    lastShown.current = shown;
    if (shown <= prev || reducedMotion()) return;
    const anims = [];
    for (let i = prev; i < shown; i++) {
      const card = cardRefs.current[i];
      if (!card) continue;
      anims.push(decode(card.querySelector(".dbg-node-label"), skillGroups[i].label, { duration: 600 }));
      anims.push(
        animate(card.querySelectorAll(".dbg-chip"), {
          opacity: { from: 0 },
          y: { from: 14 },
          scale: { from: 0.5 },
          duration: 550,
          delay: stagger(45, { start: 200, from: "first" }),
          ease: "outBack(2.2)",
          onComplete: (self) => self.revert(),
        })
      );
    }
  }, [shown]);
  const [anchor, setAnchor] = useState(null);
  const [ends, setEnds] = useState([]);
  const [status, setStatus] = useState("> hover a skill to load it");
  const [webgl] = useState(hasWebGL);

  const { inView } = useSectionProgress(ref, (p) => {
    const n = Math.min(skillGroups.length, Math.floor((p + 0.06) / 0.13));
    setShown((prev) => (prev === n ? prev : n));
  });

  // Where each branch lands: the bottom-centre of its card. Cards sit at
  // left: var(--x) and are centred with `translate`, which offsetLeft ignores,
  // so offsetLeft is already the centre (and the grow-in scale is ignored too).
  const aw = anchor && anchor.w;
  const ah = anchor && anchor.h;
  useLayoutEffect(() => {
    if (!stageRef.current) return;
    setEnds(
      cardRefs.current.map((el) => (el ? { x: el.offsetLeft, y: el.offsetTop + el.offsetHeight } : null))
    );
  }, [aw, ah]);

  return (
    <section className="dbg" id="tech-stack" ref={ref} aria-label="Debugging and tech stack">
      <div className="dbg-sticky" ref={stageRef}>
        <div className="dbg-canvas" aria-hidden="true">
          {webgl ? (
            <Canvas
              dpr={[1, 1.75]}
              frameloop={inView ? "always" : "never"}
              camera={{ position: [4.3, 4.6, -3.6], fov: 40 }}
              gl={{ antialias: true, alpha: true }}
            >
              <DebugWorld onAnchor={setAnchor} />
            </Canvas>
          ) : (
            <div className="dbg-fallback">&gt;_ debugging…</div>
          )}
        </div>

        <div className="dbg-head">
          <span className="dbg-act">act III</span>
          <h2 className="dbg-title">inside her mind: the stack</h2>
        </div>

        {anchor && (
          <svg
            className="dbg-branches"
            viewBox={`0 0 ${anchor.w} ${anchor.h}`}
            width={anchor.w}
            height={anchor.h}
            aria-hidden="true"
          >
            {skillGroups.map((g, i) => {
              const e = ends[i];
              if (!e) return null;
              const d = `M${anchor.x} ${anchor.y} C ${anchor.x} ${anchor.y - 140}, ${e.x} ${e.y + 120}, ${e.x} ${e.y}`;
              const on = i < shown;
              return (
                <g key={g.id} className={"dbg-branch" + (on ? " is-on" : "")}>
                  <path d={d} pathLength="1" className="dbg-branch-line" />
                  <path d={d} pathLength="1" className="dbg-branch-pulse" style={{ animationDelay: `${i * 0.3}s` }} />
                </g>
              );
            })}
            <circle cx={anchor.x} cy={anchor.y} r="7" className="dbg-mind" />
          </svg>
        )}

        <ul className="dbg-nodes">
          {skillGroups.map((g, i) => (
            <li
              key={g.id}
              ref={(el) => (cardRefs.current[i] = el)}
              className={"dbg-node" + (i < shown ? " is-on" : "")}
              style={{ "--x": `${NODES[i].x}%`, "--y": `${NODES[i].y}%` }}
            >
              <span className="dbg-node-label">{g.label}</span>
              <span className="dbg-chips">
                {g.items.map((s) => (
                  <button
                    type="button"
                    key={s}
                    className="dbg-chip"
                    onMouseEnter={() => {
                      setStatus("> " + g.status(s));
                      playKey();
                    }}
                    onFocus={() => setStatus("> " + g.status(s))}
                  >
                    {s}
                  </button>
                ))}
              </span>
            </li>
          ))}
        </ul>

        <p className="dbg-status" aria-live="polite">
          {status}
          <span className="dbg-caret">█</span>
        </p>
      </div>
    </section>
  );
}
