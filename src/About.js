import React, { useCallback, useEffect, useRef, useState } from "react";
import profileImage from "./nandini.jpeg";
import { prefersReducedMotion, useInView, usePointerVars, useScrollVar } from "./useY2K";
import { playKey } from "./sound";
import "./About.css";

// The About copy, unchanged. `strong` marks the phrase that was bold.
const ENTRIES = [
  {
    id: "01",
    segs: [
      {
        t: "I’m a final year B.Tech student (CGPA :9.00) focused on building AI systems that solve real-world problems through product thinking and engineering.",
      },
    ],
  },
  {
    id: "02",
    segs: [
      { t: "Most of what I build sits at the intersection of " },
      { t: "Generative AI, machine learning and systems design", strong: true },
      { t: " - from multi-agent LLM pipelines to credit-risk intelligence." },
    ],
  },
  {
    id: "03",
    segs: [
      {
        t: "I’m currently preparing for SDE and AI/ML roles at product-based companies while building strong AI products and sharpening DSA.",
      },
    ],
  },
];

const STATS = [
  { label: "Hackathon wins", val: "3" },
  { label: "Major AI Projects", val: "3" },
  { label: "LeetCode", val: "400+" },
  { label: "Target", val: "SDE + AI" },
];

const WRITE_SPEED = 80; // characters per second
const FLIP_MS = 1250; // keep in step with the .jr-leaf transition in About.css

/**
 * Text that writes itself out. The whole paragraph is laid out from the first
 * frame — the unwritten remainder is only hidden — so lines never reflow as
 * the pen advances, and the text stays put once written.
 */
function Handwritten({ segs, start, onDone }) {
  const total = segs.reduce((n, s) => n + s.t.length, 0);
  const [count, setCount] = useState(0);
  const onDoneRef = useRef(onDone);
  onDoneRef.current = onDone;

  useEffect(() => {
    if (!start) return;
    if (prefersReducedMotion()) {
      setCount(total);
      onDoneRef.current && onDoneRef.current();
      return;
    }
    let raf;
    let t0;
    let lastKey = 0;
    function tick(t) {
      if (t0 === undefined) t0 = t;
      const next = Math.min(total, Math.floor(((t - t0) / 1000) * WRITE_SPEED));
      if (next - lastKey >= 4) {
        lastKey = next;
        playKey();
      }
      setCount(next);
      if (next < total) raf = requestAnimationFrame(tick);
      else onDoneRef.current && onDoneRef.current();
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [start, total]);

  const writing = start && count < total;
  let offset = 0;

  return (
    <p className="hw">
      <span className="sr-only">{segs.map((s) => s.t).join("")}</span>
      <span aria-hidden="true">
        {segs.map((s, i) => {
          const shown = Math.min(s.t.length, Math.max(0, count - offset));
          const penHere = writing && count >= offset && count < offset + s.t.length;
          offset += s.t.length;
          const Tag = s.strong ? "strong" : "span";
          return (
            <Tag key={i}>
              <span className="hw-ink">{s.t.slice(0, shown)}</span>
              {penHere && <span className="hw-pen"></span>}
              <span className="hw-ghost">{s.t.slice(shown)}</span>
            </Tag>
          );
        })}
      </span>
    </p>
  );
}

// An entry starts once the notebook is open, the one before it is finished,
// and it is on screen — so on a phone nothing is written out of sight.
function Entry({ entry, index, ready, done, onDone, children }) {
  const [ref, inView] = useInView({ threshold: 0.35 });
  const start = ready && done >= index && inView;
  const finish = useCallback(() => onDone(index), [onDone, index]);

  return (
    <article className={"jr-entry" + (start ? " is-started" : "")} ref={ref}>
      <h3 className="jr-entry-head">entry {entry.id}</h3>
      <Handwritten segs={entry.segs} start={start} onDone={finish} />
      {children}
    </article>
  );
}

function Doodle({ kind, className = "" }) {
  const paths = {
    star: "M12 2l2.6 6.6 7 .6-5.4 4.6 1.7 6.9L12 17l-5.9 3.7 1.7-6.9L2.4 9.2l7-.6z",
    arrow: "M3 6c6-3 14-2 17 6m0 0l-5-1m5 1l1-5",
    screen: "M3 4h18v12H3zM9 20h6M12 16v4M7 9l2 2-2 2M12 13h4",
    loop: "M4 14c0-6 6-9 10-6s2 9-3 8-4-7 2-9 9 2 8 7",
  };
  return (
    <svg className={`doodle doodle-${kind} ${className}`} viewBox="0 0 24 24" aria-hidden="true">
      <path d={paths[kind]} pathLength="1" />
    </svg>
  );
}

function Journal() {
  const [ref, inView] = useInView({ threshold: 0.12, rootMargin: "0px 0px -22% 0px" });
  const [ready, setReady] = useState(false);
  const [done, setDone] = useState(0);
  // The notebook opens by itself the first time it scrolls into view; after
  // that the reader can turn back to the cover and open it again.
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (inView) setOpen(true);
  }, [inView]);

  // The pen waits for the title page to finish turning (wide screens only;
  // the stacked phone layout has no page turn).
  useEffect(() => {
    if (!inView) return;
    const flips =
      !prefersReducedMotion() &&
      !!window.matchMedia &&
      window.matchMedia("(min-width: 821px)").matches;
    const id = setTimeout(() => setReady(true), flips ? FLIP_MS : 120);
    return () => clearTimeout(id);
  }, [inView]);

  const finish = useCallback((i) => setDone((d) => Math.max(d, i + 1)), []);
  const allDone = done >= ENTRIES.length;

  return (
    <div className="journal-stage">
      <p className="journal-cue" aria-hidden="true">
        <Doodle kind="arrow" /> found my notebook
      </p>

      <div
        className={"journal" + (open ? " is-open" : "") + (ready ? " is-ready" : "") + (allDone ? " is-done" : "")}
        ref={ref}
      >
        <div className="jr-spread">
          <div className="jr-page jr-left">
            <header className="jr-head">
              <span>dev diary</span>
              <span>pg. 01</span>
            </header>

            <Entry entry={ENTRIES[0]} index={0} ready={ready} done={done} onDone={finish} />
            <Entry entry={ENTRIES[1]} index={1} ready={ready} done={done} onDone={finish}>
              <span className="jr-note note-fun" aria-hidden="true">
                <Doodle kind="arrow" /> the fun part
              </span>
            </Entry>

            <Doodle kind="star" className="jr-doodle d-star-a" />
            <Doodle kind="loop" className="jr-doodle d-loop" />
          </div>

          <div className="jr-page jr-right">
            <header className="jr-head">
              <span>nandini gangwar</span>
              <span>pg. 02</span>
            </header>

            <Entry entry={ENTRIES[2]} index={2} ready={ready} done={done} onDone={finish} />

            <div className="jr-sticky" aria-hidden="true">
              <span className="jr-sticky-title">to-do</span>
              <span>
                <s>sleep</s> debug
              </span>
              <span>fix edge cases ✓</span>
              <span>ship it</span>
            </div>

            <p className="jr-sign" aria-hidden="true">
              — nandini <Doodle kind="star" />
            </p>

            <span className="jr-stamp" aria-hidden="true">
              N.G · dev diary · 2026
            </span>
            <Doodle kind="screen" className="jr-doodle d-screen" />
            <span className="jr-tape" aria-hidden="true"></span>
          </div>

          {open && ready && (
            <button type="button" className="jr-turn jr-turn-back" onClick={() => setOpen(false)}>
              <span aria-hidden="true">◂</span> back to cover
            </button>
          )}

          {/* What you see while the notebook is shut: the inside cover on the
              left and the title page on the right. Both are taken out of view
              once the page has turned. */}
          <div className="jr-inside" aria-hidden="true">
            <span className="jr-inside-label">
              if found, return to
              <b>N.G</b>
            </span>
          </div>
          <div className="jr-leaf">
            <div className="jr-leaf-front">
              <span className="jr-leaf-kicker" aria-hidden="true">
                vol. 01 — keep out (jk)
              </span>
              <span className="jr-leaf-title" aria-hidden="true">
                dev diary
              </span>
              <span className="jr-leaf-sub" aria-hidden="true">
                property of nandini g.
              </span>
              <Doodle kind="star" className="jr-leaf-star" />
              <button type="button" className="jr-turn jr-turn-open" onClick={() => setOpen(true)}>
                open it <span aria-hidden="true">▸</span>
              </button>
            </div>
            <div className="jr-leaf-back" aria-hidden="true"></div>
          </div>
        </div>
        <span className="jr-ribbon" aria-hidden="true"></span>
      </div>
    </div>
  );
}

export default function About() {
  const sectionRef = useScrollVar();
  const introRef = usePointerVars();

  return (
    <section className="section about" id="about" ref={sectionRef}>
      <div className="about-intro" ref={introRef}>
        <div className="about-copy">
          <p className="about-kicker">
            <span className="section-num">01</span>
            <span>about</span>
            <span className="about-kicker-line"></span>
            <span>fig. 02 — the human</span>
          </p>

          <h2 className="about-title">
            About <em>me</em>
            <svg className="about-title-star" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
              <path d="M4 0h1v3h1v1h3v1H6v1H5v3H4V6H3V5H0V4h3V3h1z" fill="currentColor" />
            </svg>
          </h2>

          <ul className="about-bubbles">
            {STATS.map((s) => (
              <li className="bubble" key={s.label}>
                <span className="bubble-label">{s.label}</span>
                <span className="bubble-val">{s.val}</span>
              </li>
            ))}
          </ul>

          <p className="about-vertical" aria-hidden="true">
            n a n d i n i &nbsp;✦&nbsp; g a n g w a r
          </p>
        </div>

        <div className="about-photo">
          <div className="photo-tilt">
            <figure className="win photo-win">
              <div className="win-bar">
                <span>photo_booth — nandini.jpeg</span>
                <span className="win-ctrl" aria-hidden="true">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
              <div className="photo-frame">
                <img src={profileImage} alt="Nandini working at a laptop with headphones on" />
              </div>
              <figcaption className="photo-bar" aria-hidden="true">
                <span>IMG_0001</span>
                <span className="photo-rec"></span>
                <span>100%</span>
              </figcaption>
            </figure>
          </div>

          <div className="photo-round" aria-hidden="true">
            <img src={profileImage} alt="" />
          </div>

          <span className="photo-tape" aria-hidden="true"></span>
          <span className="photo-sticker" aria-hidden="true">
            debug
            <br />
            mode
          </span>
          <span className="photo-note" aria-hidden="true">
            me, mid-debug <Doodle kind="arrow" />
          </span>
          <span className="photo-tag" aria-hidden="true">
            headphones: on
          </span>
          <svg className="photo-star s1" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
            <path d="M4 0h1v3h1v1h3v1H6v1H5v3H4V6H3V5H0V4h3V3h1z" fill="currentColor" />
          </svg>
          <svg className="photo-star s2" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
            <path d="M4 0h1v3h1v1h3v1H6v1H5v3H4V6H3V5H0V4h3V3h1z" fill="currentColor" />
          </svg>
        </div>
      </div>

      <Journal />
    </section>
  );
}
