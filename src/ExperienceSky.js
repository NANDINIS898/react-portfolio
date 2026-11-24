import React, { useEffect, useMemo, useRef, useState } from "react";
import * as THREE from "three";
import { Canvas, useFrame } from "@react-three/fiber";
import { useSectionProgress, hasWebGL } from "./three/useSectionProgress";
import { animate, stagger, reducedMotion } from "./motion";
import { playClick } from "./sound";
import LegoAvatar from "./LegoAvatar";
import "./ExperienceSky.css";

/**
 * Act IV: the journey so far. A swirling, hand-painted night sky (made in a
 * shader: thick curling brush strokes, a crescent moon, haloed stars) with the
 * experience written across a road of clouds. Scrolling walks her along it,
 * left to right, one stop at a time.
 */


// the path through the clouds, in track units (the track is 10 units per vw
// wide and 10 per % of the viewport tall)
const TRACK_W = 3200;
const PATH = "M -60 770 C 260 770, 450 640, 750 640 S 1260 540, 1600 540 S 2150 610, 2450 610 S 2960 420, 3260 420";
const STOPS_X = [750, 1600, 2450];
const STOPS_Y = [640, 540, 610]; // the path height under each stop
const HER_X = 300; // where she stands on screen, in track units (30vw)

const skyVert = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = vec4(position.xy, 0.0, 1.0);
  }
`;

const skyFrag = /* glsl */ `
  precision highp float;
  uniform float uTime;
  uniform float uPan;
  uniform vec2 uRes;
  varying vec2 vUv;

  float hash(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
  float noise(vec2 p) {
    vec2 i = floor(p), f = fract(p);
    vec2 u = f * f * (3.0 - 2.0 * f);
    return mix(mix(hash(i), hash(i + vec2(1, 0)), u.x), mix(hash(i + vec2(0, 1)), hash(i + vec2(1, 1)), u.x), u.y);
  }
  float fbm(vec2 p) {
    float v = 0.0, a = 0.5;
    for (int i = 0; i < 5; i++) { v += a * noise(p); p = p * 2.03 + 17.1; a *= 0.5; }
    return v;
  }
  mat2 rot(float a) { float c = cos(a), s = sin(a); return mat2(c, -s, s, c); }

  // twist space around a centre: strokes that were straight curl into a vortex
  vec2 vortex(vec2 p, vec2 c, float r, float k) {
    vec2 d = p - c;
    float w = exp(-dot(d, d) / (r * r));
    return c + rot(k * w) * d;
  }

  vec3 palette(float t) {
    vec3 navy = vec3(0.04, 0.09, 0.27);
    vec3 cobalt = vec3(0.10, 0.25, 0.60);
    vec3 blue = vec3(0.24, 0.45, 0.78);
    vec3 pale = vec3(0.62, 0.77, 0.90);
    vec3 col = mix(navy, cobalt, smoothstep(0.15, 0.45, t));
    col = mix(col, blue, smoothstep(0.45, 0.7, t));
    col = mix(col, pale, smoothstep(0.72, 0.95, t));
    return col;
  }

  // a star with painted rings round it
  vec3 star(vec2 p, vec2 c, float size, float t, inout float glow) {
    float d = length(p - c);
    float core = smoothstep(size, size * 0.35, d);
    float rings = (0.5 + 0.5 * sin(d * 70.0 - t * 1.6)) * smoothstep(size * 4.2, size, d);
    glow += core + rings * 0.35;
    return vec3(1.0, 0.92, 0.55) * core + vec3(0.95, 0.85, 0.45) * rings * 0.28;
  }

  void main() {
    vec2 uv = vUv;
    float aspect = uRes.x / uRes.y;
    vec2 p = vec2(uv.x * aspect, uv.y);
    p.x += uPan * 0.9; // the sky drifts as she walks
    float t = uTime * 0.12;

    // the swirls: two big vortices and a third small one, slowly turning
    vec2 q = p;
    q = vortex(q, vec2(0.85 + uPan * 0.9, 0.62), 0.34, 4.2 + sin(t) * 0.4);
    q = vortex(q, vec2(2.1 + uPan * 0.9, 0.7), 0.28, -3.6 + cos(t * 1.3) * 0.4);
    q = vortex(q, vec2(3.3 + uPan * 0.9, 0.55), 0.3, 3.9);
    q += 0.08 * vec2(fbm(q * 2.0 + t), fbm(q * 2.0 - t));

    // long horizontal currents, bent by the vortices into curls
    float band = fbm(vec2(q.x * 1.4 + t * 0.6, q.y * 5.5));
    // the brush: fine parallel strokes along the flow, broken into dabs
    float stroke = sin(q.y * 150.0 + fbm(q * 7.0) * 9.0);
    float dab = smoothstep(0.35, 0.75, noise(vec2(q.x * 26.0, q.y * 70.0)));
    float shade = band * 1.1 - 0.08 + stroke * 0.06 + dab * 0.08 * (0.5 + 0.5 * stroke);
    shade += smoothstep(0.35, 1.0, uv.y) * 0.18; // lighter up high
    vec3 col = palette(shade);

    // a crescent moon, top right
    float glow = 0.0;
    vec2 m = vec2(aspect * 0.86, 0.8);
    float dm = length(p - vec2(m.x + uPan * 0.8, m.y));
    float moon = smoothstep(0.075, 0.068, dm) * smoothstep(0.052, 0.06, length(p - vec2(m.x + uPan * 0.8 + 0.03, m.y + 0.02)));
    float halo = (0.5 + 0.5 * sin(dm * 90.0 - uTime * 0.8)) * smoothstep(0.24, 0.07, dm);
    col = mix(col, vec3(0.98, 0.83, 0.32), clamp(halo * 0.45, 0.0, 1.0));
    col = mix(col, vec3(1.0, 0.9, 0.45), moon);

    // stars scattered along the sky (repeating as the sky pans)
    vec3 sc = vec3(0.0);
    vec2 cell = vec2(mod(p.x, 1.6), p.y);
    sc += star(cell, vec2(0.22, 0.86), 0.018, uTime, glow);
    sc += star(cell, vec2(0.58, 0.74), 0.012, uTime + 1.0, glow);
    sc += star(cell, vec2(0.98, 0.9), 0.015, uTime + 2.0, glow);
    sc += star(cell, vec2(1.32, 0.78), 0.02, uTime + 3.0, glow);
    sc += star(cell, vec2(1.45, 0.93), 0.01, uTime + 4.0, glow);
    col = mix(col, sc / max(glow, 0.001), clamp(glow, 0.0, 1.0) * 0.85);

    // dusk at the bottom, where the road of clouds runs
    col = mix(col, vec3(0.03, 0.06, 0.18), smoothstep(0.32, 0.0, uv.y) * 0.65);
    // a little vignette
    vec2 v = uv - 0.5;
    col *= 1.0 - dot(v, v) * 0.55;
    gl_FragColor = vec4(col, 1.0);
    #include <colorspace_fragment>
  }
`;

function Sky({ pan }) {
  const mat = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: { uTime: { value: 0 }, uPan: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) } },
        vertexShader: skyVert,
        fragmentShader: skyFrag,
        depthTest: false,
      }),
    []
  );
  useFrame((state) => {
    mat.uniforms.uTime.value = state.clock.elapsedTime;
    mat.uniforms.uPan.value = THREE.MathUtils.lerp(mat.uniforms.uPan.value, pan.current, 0.08);
    mat.uniforms.uRes.value.set(state.size.width, state.size.height);
  });
  return (
    <mesh material={mat} frustumCulled={false}>
      <planeGeometry args={[2, 2]} />
    </mesh>
  );
}

/** A painted cloud: soft billows with curling brush strokes on top. */
function Cloud({ flip }) {
  return (
    <svg className="xs-cloud-art" viewBox="0 0 440 280" aria-hidden="true" style={flip ? { transform: "scaleX(-1)" } : null}>
      <defs>
        <linearGradient id="xsCloudFill" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#eef5fb" />
          <stop offset="0.65" stopColor="#c9dcef" />
          <stop offset="1" stopColor="#93b4dc" />
        </linearGradient>
      </defs>
      <path
        className="xs-cloud-body"
        d="M40 210 C8 206 6 160 44 152 C30 112 78 86 112 104 C120 58 182 40 214 74 C240 30 316 36 330 88 C372 70 420 100 404 144 C442 154 440 206 400 212 C330 228 110 228 40 210 Z"
        fill="url(#xsCloudFill)"
      />
      <g className="xs-cloud-strokes" fill="none" strokeLinecap="round">
        <path d="M70 186 C110 168 150 196 196 180 S 280 160 330 182" stroke="#ffffff" strokeWidth="5" />
        <path d="M96 140 C120 118 160 124 160 146 C160 162 136 164 132 150" stroke="#7fa3d4" strokeWidth="4" />
        <path d="M206 108 C236 84 286 96 282 126 C279 146 250 148 246 130" stroke="#ffffff" strokeWidth="5" />
        <path d="M300 128 C330 112 368 122 372 148" stroke="#7fa3d4" strokeWidth="4" />
        <path d="M60 200 C140 214 260 214 380 198" stroke="#6b90c7" strokeWidth="3" strokeDasharray="22 10" />
      </g>
    </svg>
  );
}

function shortRole(role) {
  return role.split(" – ")[0];
}

export default function ExperienceSky({ items }) {
  const ref = useRef(null);
  const track = useRef(null);
  const her = useRef(null);
  const pathEl = useRef(null);
  const pan = useRef(0);
  const ys = useRef(null); // path height sampled at every track unit
  const [active, setActive] = useState(-1);
  const [open, setOpen] = useState(-1);
  const [webgl] = useState(hasWebGL);
  const stops = items.slice(0, STOPS_X.length);

  // sample the path once so she can stand on it anywhere
  useEffect(() => {
    const path = pathEl.current;
    if (!path) return;
    const len = path.getTotalLength();
    const table = new Float32Array(TRACK_W + 1);
    let last = 770;
    for (let s = 0; s <= len; s += 2) {
      const pt = path.getPointAtLength(s);
      const x = Math.round(pt.x);
      if (x >= 0 && x <= TRACK_W) table[x] = pt.y;
    }
    for (let x = 0; x <= TRACK_W; x++) {
      if (table[x]) last = table[x];
      else table[x] = last;
    }
    ys.current = table;
  }, []);

  const place = (p) => {
    // the track slides left; she keeps her place on screen and climbs the path
    const shift = p * (TRACK_W - 1000);
    pan.current = p * 2.2;
    if (track.current) track.current.style.transform = `translate3d(${(-shift / 10).toFixed(3)}vw,0,0)`;
    const x = Math.min(TRACK_W, Math.round(HER_X + shift));
    const y = ys.current ? ys.current[x] : 770;
    if (ref.current) ref.current.style.setProperty("--xs-p", p.toFixed(3));
    if (her.current) {
      her.current.style.top = `${(y / 10).toFixed(2)}%`;
      her.current.classList.toggle("is-walking", p > 0.01 && p < 0.99);
    }
    let a = -1;
    STOPS_X.forEach((sx, i) => {
      if (i < stops.length && x >= sx - 140) a = i;
    });
    setActive((prev) => (prev === a ? prev : a));
  };

  const { inView } = useSectionProgress(ref, place);

  // each stop lifts in as she reaches it
  useEffect(() => {
    if (active < 0 || reducedMotion()) return undefined;
    const card = track.current && track.current.querySelectorAll(".xs-stop")[active];
    if (!card) return undefined;
    const a = animate(card.querySelectorAll(".xs-cloud-text > *"), {
      opacity: { from: 0 },
      y: { from: 14 },
      duration: 600,
      delay: stagger(70),
      ease: "outBack(1.6)",
    });
    playClick();
    return () => a.revert();
  }, [active]);

  return (
    <section className="xs" id="experience" ref={ref} aria-label="Experience">
      <div className="xs-sticky">
        <div className="xs-sky" aria-hidden="true">
          {webgl ? (
            <Canvas dpr={[0.75, 1.25]} frameloop={inView ? "always" : "never"} gl={{ antialias: false }}>
              <Sky pan={pan} />
            </Canvas>
          ) : null}
        </div>

        <div className="xs-head">
          <span className="xs-act">act IV · सफ़र</span>
          <h2 className="xs-title">the journey so far</h2>
          <p className="xs-sub">safar khoobsurat hai, manzil se bhi.</p>
        </div>

        <div className="xs-track" ref={track}>
          <svg className="xs-path" viewBox={`0 0 ${TRACK_W} 1000`} preserveAspectRatio="none" aria-hidden="true">
            <path ref={pathEl} d={PATH} className="xs-path-glow" />
            <path d={PATH} className="xs-path-line" />
          </svg>

          <ol className="xs-stops">
            {stops.map((e, i) => (
              <li
                key={e.company}
                className={"xs-stop" + (i <= active ? " is-reached" : "") + (e.current ? " is-now" : "")}
                style={{ left: `${STOPS_X[i] / 10}vw`, top: `${STOPS_Y[i] / 10}%`, "--i": i }}
              >
                <div className="xs-cloud">
                  <Cloud flip={i % 2 === 1} />
                  <div className="xs-cloud-text">
                    <span className="xs-dates">
                      {String(i + 1).padStart(2, "0")} · {e.dates}
                    </span>
                    <strong className="xs-role">{shortRole(e.role)}</strong>
                    <span className="xs-company">{e.company}</span>
                    {e.current && <span className="xs-now">abhi yahin · now</span>}
                    {e.achievements && e.achievements.length > 0 && (
                      <button
                        type="button"
                        className="xs-more"
                        aria-expanded={open === i}
                        onClick={() => setOpen(open === i ? -1 : i)}
                      >
                        {open === i ? "band karo ✕" : "aur dekho ↓"}
                      </button>
                    )}
                  </div>
                </div>
                {open === i && (
                  <div className="xs-panel">
                    {e.role.includes(" – ") && <p className="xs-panel-role">{e.role}</p>}
                    <ul>
                      {e.achievements.map((a) => (
                        <li key={a}>{a}</li>
                      ))}
                    </ul>
                    {e.tech && (
                      <p className="xs-tech">
                        {e.tech.map((t) => (
                          <span key={t}>{t}</span>
                        ))}
                      </p>
                    )}
                  </div>
                )}
                <span className="xs-pin" aria-hidden="true"></span>
              </li>
            ))}
          </ol>

          <p className="xs-end" style={{ left: "300vw" }} aria-hidden="true">
            picture abhi baaki hai, mere dost →
          </p>
        </div>

        <div className="xs-her" ref={her} aria-hidden="true">
          <LegoAvatar />
        </div>

        <ol className="xs-progress" aria-hidden="true">
          {stops.map((e, i) => (
            <li key={e.company} className={i <= active ? "is-on" : ""}>
              {e.company}
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

