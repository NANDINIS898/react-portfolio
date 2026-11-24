import React, { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import { projects, screenLines } from "./projects";
import { useSectionProgress } from "./three/useSectionProgress";
import { typeBurst } from "./sound";
import { decode, animate, stagger, reducedMotion } from "./motion";
import LegoAvatar from "./LegoAvatar";
import "./ProjectRoad.css";

/**
 * Act IV: the project road. Vertical scroll moves the world left; a tiny
 * Nandini walks a path that only grows forward, and each project machine
 * boots up when she reaches it (and stays on).
 */

function useViewport() {
  const read = () => ({ w: window.innerWidth, h: Math.max(window.innerHeight, 560) });
  const [vp, setVp] = useState(read);
  useEffect(() => {
    const on = () => setVp(read());
    window.addEventListener("resize", on);
    return () => window.removeEventListener("resize", on);
  }, []);
  return vp;
}

// her brick minifigure (Builder look) rides the road; see LegoAvatar.js
function Mascot() {
  return <LegoAvatar className="rd-mascot-img" />;
}

function Screen({ p, on }) {
  const videoRef = useRef(null);
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (on) v.play().catch(() => {});
    else v.pause();
  }, [on]);

  if (p.media && p.media.type === "image") {
    return <img src={p.media.src} alt={p.media.alt} loading="lazy" />;
  }
  if (p.media && p.media.type === "video") {
    return <video ref={videoRef} src={p.media.src} muted loop playsInline aria-label={p.media.alt} />;
  }
  return (
    <pre className="rd-term">
      {screenLines(p).map((l, i) => (
        <span key={i} style={{ "--i": i }}>
          {l}
          {"\n"}
        </span>
      ))}
    </pre>
  );
}

export default function ProjectRoad() {
  const ref = useRef(null);
  const trackRef = useRef(null);
  const pathRef = useRef(null);
  const mascotRef = useRef(null);
  const stillTimer = useRef(0);
  const lastS = useRef(0);
  const maxS = useRef(0);
  const [reached, setReached] = useState(0);
  const [here, setHere] = useState(-1);
  const vp = useViewport();

  const n = projects.length;
  const layout = useMemo(() => {
    const narrow = vp.w < 760;
    const gap = narrow ? vp.w * 0.86 : Math.min(560, Math.max(380, vp.w * 0.4));
    const padL = narrow ? vp.w * 0.5 : vp.w * 0.32;
    const ground = vp.h - (narrow ? 70 : 84);
    const xs = projects.map((_, i) => padL + i * gap);
    const width = xs[n - 1] + vp.w * 0.6;
    const pts = [{ x: 30, y: ground }, ...xs.map((x, i) => ({ x, y: ground + (i % 2 ? 14 : -14) })), { x: width - 30, y: ground }];
    let d = `M${pts[0].x} ${pts[0].y}`;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1];
      const b = pts[i];
      const mx = (a.x + b.x) / 2;
      d += ` C${mx} ${a.y} ${mx} ${b.y} ${b.x} ${b.y}`;
    }
    return { gap, xs, width, d, ground, narrow };
  }, [vp, n]);

  const pathLen = useRef(1);
  useLayoutEffect(() => {
    if (pathRef.current) pathLen.current = pathRef.current.getTotalLength();
  }, [layout]);

  const place = (p) => {
    const path = pathRef.current;
    if (!path) return;
    const L = pathLen.current;
    // she reaches the end of the road just before the section ends
    const s = Math.min(1, p / 0.94) * L;
    const pt = path.getPointAtLength(s);
    const dir = s >= lastS.current ? 1 : -1;
    const moved = Math.abs(s - lastS.current) > 0.5;
    lastS.current = s;
    maxS.current = Math.max(maxS.current, s);

    const m = mascotRef.current;
    if (m) {
      m.style.transform = `translate(${pt.x}px, ${pt.y}px)`;
      m.style.setProperty("--dir", dir);
      if (moved) {
        m.classList.add("is-walking");
        clearTimeout(stillTimer.current);
        stillTimer.current = setTimeout(() => m.classList.remove("is-walking"), 180);
      }
    }
    const shift = Math.min(Math.max(pt.x - vp.w * (layout.narrow ? 0.5 : 0.34), 0), layout.width - vp.w);
    if (trackRef.current) trackRef.current.style.transform = `translateX(${-shift}px)`;
    path.style.strokeDasharray = String(L);
    path.style.strokeDashoffset = String(L - maxS.current);

    const r = layout.xs.filter((x) => x - 40 <= pt.x).length;
    setReached((prev) => Math.max(prev, r));
    let near = -1;
    layout.xs.forEach((x, i) => {
      if (Math.abs(x - pt.x) < layout.gap * 0.3) near = i;
    });
    setHere((prev) => (prev === near ? prev : near));
  };

  const { progress } = useSectionProgress(ref, place);

  // re-place after a resize changes the layout
  useLayoutEffect(() => {
    place(progress.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [layout]);

  // each machine that boots: its name decodes, the plaque rows drop in and
  // the booted counter bumps
  const stationsRef = useRef(null);
  const countRef = useRef(null);
  const animated = useRef(0);
  useEffect(() => {
    const from = animated.current;
    animated.current = Math.max(from, reached);
    if (reached <= from || reducedMotion()) return;
    const list = stationsRef.current;
    for (let i = from; i < reached; i++) {
      const st = list && list.children[i];
      if (!st) continue;
      decode(st.querySelector(".rd-plaque h3"), projects[i].name, { duration: 700, delay: 150 });
      animate(st.querySelectorAll(".rd-tag, .rd-desc, .rd-chips li, .rd-links a"), {
        opacity: { from: 0 },
        x: { from: -16 },
        duration: 500,
        delay: stagger(40, { start: 250 }),
        ease: "outQuad",
        onComplete: (self) => self.revert(),
      });
    }
    if (countRef.current) {
      animate(countRef.current, {
        scale: [1.8, 1],
        color: ["#ffffff", "#6fe3ff"],
        duration: 600,
        ease: "outElastic(1, .5)",
        onComplete: (self) => self.revert(),
      });
    }
  }, [reached]);

  // a burst of typing as each machine boots
  const booted = useRef(0);
  useEffect(() => {
    if (reached > booted.current) {
      booted.current = reached;
      return typeBurst(380);
    }
    return undefined;
  }, [reached]);

  return (
    <section
      className="rd"
      id="projects"
      ref={ref}
      style={{ height: `calc(100vh + ${n * (layout.narrow ? 70 : 55)}vh)` }}
      aria-label="Projects"
    >
      <div className="rd-sticky">
        <div className="rd-head">
          <span className="rd-act">act V</span>
          <h2 className="rd-title">the project road</h2>
          <p className="rd-count">
            machines booted <b ref={countRef}>{String(reached).padStart(2, "0")}</b>/{String(n).padStart(2, "0")}
          </p>
        </div>

        <div className="rd-track" ref={trackRef} style={{ width: layout.width }}>
          <svg className="rd-road" width={layout.width} height={vp.h} aria-hidden="true">
            <path d={layout.d} className="rd-road-base" />
            <path ref={pathRef} d={layout.d} className="rd-road-line" />
          </svg>

          <ol className="rd-stations" ref={stationsRef}>
            {projects.map((p, i) => {
              const on = i < reached;
              return (
                <li
                  key={p.id}
                  className={"rd-station" + (on ? " is-on" : "") + (i === here ? " is-here" : "")}
                  style={{ left: layout.xs[i], bottom: vp.h - layout.ground + 46 }}
                >
                  <div className="rd-crt">
                    <span className="rd-crt-label">
                      {String(i + 1).padStart(2, "0")} · {p.kind}
                    </span>
                    <div className="rd-screen">
                      {on ? <Screen p={p} on={on} /> : <span className="rd-standby">standby…</span>}
                      <span className="rd-scan" aria-hidden="true"></span>
                    </div>
                    <span className="rd-crt-chin" aria-hidden="true">
                      <i></i>
                      <i></i>
                    </span>
                  </div>
                  <div className="rd-plaque">
                    <h3>{p.name}</h3>
                    {p.tag && <p className="rd-tag">{p.tag}</p>}
                    <p className="rd-desc">{p.desc}</p>
                    {p.tech && (
                      <ul className="rd-chips">
                        {p.tech.slice(0, 6).map((t) => (
                          <li key={t}>{t}</li>
                        ))}
                      </ul>
                    )}
                    <div className="rd-links">
                      {p.repo && (
                        <a href={p.repo} target="_blank" rel="noreferrer" tabIndex={on ? 0 : -1}>
                          <FaGithub aria-hidden="true" /> code
                        </a>
                      )}
                      {p.demo && (
                        <a href={p.demo} target="_blank" rel="noreferrer" tabIndex={on ? 0 : -1}>
                          <FaExternalLinkAlt aria-hidden="true" /> live
                        </a>
                      )}
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>

          <div className="rd-mascot" ref={mascotRef}>
            {here >= 0 && (
              <span className="rd-say" key={here}>
                &gt; run {projects[here].id}.exe
              </span>
            )}
            <div className="rd-mascot-flip">
              <Mascot />
            </div>
          </div>
        </div>

        <p className="rd-hint" aria-hidden="true">
          keep scrolling — she walks you through ↓
        </p>
      </div>
    </section>
  );
}
