import React, { useEffect, useRef, useState } from "react";
import { prefersReducedMotion } from "./useY2K";
import "./ExperienceRoadmap.css";

const PIN_OFFSET = 34; // px from the top of a stop's row to its checkpoint
const MOBILE_X = 20; // px; on narrow screens the road runs straight down the left

/**
 * The road is a chain of S-curves through the checkpoints: each segment is a
 * cubic bezier whose two control points sit at the segment's vertical
 * midpoint, directly above/below its ends. That shape has a closed form in y,
 *   y(t) = y0 + (y1 - y0) * (1.5t - 1.5t² + t³)
 *   x(t) = x0 + (x1 - x0) * (3t² - 2t³)
 * so the traveller's position for a given scroll depth can be solved without
 * measuring the SVG path.
 */
function roadPath(pts) {
  if (pts.length < 2) return "";
  let d = `M ${pts[0].x},${pts[0].y}`;
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    const my = (a.y + b.y) / 2;
    d += ` C ${a.x},${my} ${b.x},${my} ${b.x},${b.y}`;
  }
  return d;
}

function pointAtY(pts, y) {
  if (!pts.length) return { x: 0, y: 0, angle: 90 };
  if (y <= pts[0].y) return { x: pts[0].x, y: pts[0].y, angle: 90 };
  for (let i = 1; i < pts.length; i++) {
    const a = pts[i - 1];
    const b = pts[i];
    if (y > b.y) continue;
    const s = (y - a.y) / (b.y - a.y || 1);
    let lo = 0;
    let hi = 1;
    for (let k = 0; k < 18; k++) {
      const t = (lo + hi) / 2;
      if (1.5 * t - 1.5 * t * t + t * t * t < s) lo = t;
      else hi = t;
    }
    const t = (lo + hi) / 2;
    const dx = (b.x - a.x) * (6 * t - 6 * t * t);
    const dy = (b.y - a.y) * (1.5 - 3 * t + 3 * t * t);
    return {
      x: a.x + (b.x - a.x) * (3 * t * t - 2 * t * t * t),
      y,
      angle: (Math.atan2(dy, dx) * 180) / Math.PI,
    };
  }
  const last = pts[pts.length - 1];
  return { x: last.x, y: last.y, angle: 90 };
}

function Stop({ item, index, side, reached, selected, onSelect, setRef }) {
  const panelId = `xr-panel-${index}`;
  const hasMore =
    item.description || (item.tech && item.tech.length) || (item.achievements && item.achievements.length) || item.link;

  return (
    <li
      className={
        `xr-stop xr-${side}` +
        (reached ? " is-reached" : "") +
        (selected ? " is-selected" : "") +
        (item.current ? " is-current" : "")
      }
      ref={setRef}
    >
      <article className="xr-card">
        <button
          type="button"
          className="xr-card-head"
          aria-expanded={hasMore ? selected : undefined}
          aria-controls={hasMore ? panelId : undefined}
          onClick={() => onSelect(selected ? -1 : index)}
        >
          <span className="xr-card-bar">
            <span>checkpoint_{String(index + 1).padStart(2, "0")}</span>
            {item.current ? (
              <span className="xr-now">
                <span className="status-dot"></span> now building
              </span>
            ) : (
              <span className="xr-done">✓ cleared</span>
            )}
          </span>
          <span className="xr-role">{item.role}</span>
          <span className="xr-company">@ {item.company}</span>
          <span className="xr-dates">
            {item.dates}
            {item.location ? ` · ${item.location}` : ""}
          </span>
          {hasMore && (
            <span className="xr-toggle" aria-hidden="true">
              {selected ? "[ – close ]" : "[ + open log ]"}
            </span>
          )}
        </button>

        {hasMore && (
          <div className="xr-panel" id={panelId} hidden={!selected}>
            {item.description && <p className="xr-desc">{item.description}</p>}

            {item.achievements && item.achievements.length > 0 && (
              <ul className="xr-wins">
                {item.achievements.map((a) => (
                  <li key={a}>{a}</li>
                ))}
              </ul>
            )}

            {item.tech && item.tech.length > 0 && (
              <ul className="xr-tech">
                {item.tech.map((t) => (
                  <li key={t}>{t}</li>
                ))}
              </ul>
            )}

            {item.link && (
              <a href={item.link} className="xr-link" target="_blank" rel="noreferrer">
                visit ↗
              </a>
            )}
          </div>
        )}
      </article>
    </li>
  );
}

/**
 * Career as a road: scroll draws it, a cursor travels it, and each role is a
 * checkpoint that lights up as the cursor passes. Stops are laid out in
 * normal flow and the road is fitted to wherever they land, so opening a
 * card (which changes the height) simply redraws the road.
 */
export default function ExperienceRoadmap({ items }) {
  const rootRef = useRef(null);
  const stopRefs = useRef([]);
  const [geo, setGeo] = useState({ w: 0, h: 0, mobile: false, pins: [] });
  const [progress, setProgress] = useState(prefersReducedMotion() ? 1 : 0);

  const currentIndex = items.findIndex((it) => it.current);
  const [selected, setSelected] = useState(currentIndex >= 0 ? currentIndex : items.length - 1);

  // Fit the road to the laid-out stops.
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    function measure() {
      const w = root.clientWidth;
      const h = root.clientHeight;
      const mobile = w < 720;
      const pins = stopRefs.current.slice(0, items.length).map((el, i) => ({
        x: mobile ? MOBILE_X : w * (i % 2 === 0 ? 0.58 : 0.42),
        y: (el ? el.offsetTop : 0) + PIN_OFFSET,
      }));
      setGeo({ w, h, mobile, pins });
    }

    measure();
    if (typeof ResizeObserver === "undefined") return;
    const ro = new ResizeObserver(measure);
    ro.observe(root);
    return () => ro.disconnect();
  }, [items.length]);

  // Scroll depth through the roadmap: 0 as it enters, 1 once its end is
  // comfortably on screen.
  useEffect(() => {
    const root = rootRef.current;
    if (!root || prefersReducedMotion()) return;

    let raf = 0;
    function compute() {
      raf = 0;
      const r = root.getBoundingClientRect();
      const vh = window.innerHeight;
      const p = (vh * 0.6 - r.top) / (r.height || 1);
      setProgress(Math.min(1, Math.max(0, p)));
    }
    function onScroll() {
      if (!raf) raf = requestAnimationFrame(compute);
    }

    compute();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      if (raf) cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, []);

  const { w, h, mobile, pins } = geo;
  const startX = mobile ? MOBILE_X : w / 2;
  const pts = [{ x: startX, y: 0 }, ...pins, { x: startX, y: h }];
  const d = w ? roadPath(pts) : "";
  const travelY = progress * h;
  const traveller = pointAtY(pts, travelY);
  const cardEdge = (i) => (mobile ? 48 : w * (i % 2 === 0 ? 0.46 : 0.54));

  return (
    <div className="xr-wrap">
      <div className="xr-cap xr-cap-start">
        <span className="xr-flag">start</span>
        <span className="xr-cap-note">journey.exe — {items.length} checkpoint{items.length === 1 ? "" : "s"}</span>
      </div>

      <div className={"xr" + (mobile ? " is-mobile" : "")} ref={rootRef}>
        {w > 0 && (
          <svg className="xr-svg" width={w} height={h} viewBox={`0 0 ${w} ${h}`} aria-hidden="true">
            <defs>
              <clipPath id="xr-travelled">
                <rect x="0" y="0" width={w} height={travelY} />
              </clipPath>
            </defs>

            {/* connector from each checkpoint to its card */}
            {pins.map((p, i) => (
              <line
                key={i}
                className={"xr-link-line" + (travelY >= p.y ? " is-reached" : "")}
                x1={p.x}
                y1={p.y}
                x2={cardEdge(i)}
                y2={p.y}
              />
            ))}

            <path d={d} className="xr-road-ghost" />
            <g clipPath="url(#xr-travelled)">
              <path d={d} className="xr-road" />
              <path d={d} className="xr-road-dash" />
            </g>
          </svg>
        )}

        {pins.map((p, i) => (
          <span
            key={i}
            className={
              "xr-pin" +
              (travelY >= p.y ? " is-reached" : "") +
              (selected === i ? " is-selected" : "") +
              (items[i].current ? " is-current" : "")
            }
            style={{ left: p.x, top: p.y }}
            aria-hidden="true"
          ></span>
        ))}

        {w > 0 && (
          <span
            className="xr-traveller"
            style={{ left: traveller.x, top: traveller.y, "--angle": `${traveller.angle - 90}deg` }}
            aria-hidden="true"
          >
            <svg viewBox="0 0 12 12" shapeRendering="crispEdges">
              <path d="M5 11h2V9h1V7h1V5h1V3H2v2h1v2h1v2h1z" fill="#ff4fa3" stroke="#0b0b0f" strokeWidth="1" />
            </svg>
          </span>
        )}

        <ol className="xr-stops">
          {items.map((item, i) => (
            <Stop
              key={`${item.company}-${item.role}-${item.dates}`}
              item={item}
              index={i}
              side={i % 2 === 0 ? "left" : "right"}
              reached={pins[i] ? travelY >= pins[i].y - 60 : false}
              selected={selected === i}
              onSelect={setSelected}
              setRef={(el) => (stopRefs.current[i] = el)}
            />
          ))}
        </ol>
      </div>

      <div className={"xr-cap xr-cap-end" + (progress >= 0.98 ? " is-reached" : "")}>
        <span className="xr-flag">{currentIndex >= 0 ? "current build" : "to be continued"}</span>
        <span className="xr-cap-note">
          next checkpoint: loading<span className="xr-dots"></span>
        </span>
      </div>
    </div>
  );
}
