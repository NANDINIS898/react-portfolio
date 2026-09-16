import React, { useEffect, useRef, useState } from "react";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import saarthiMainImg from "./saarthi-main.png";
import pryoportDemoVideo from "./pryoport video - Trim.mp4";
import "./PacmanRoadmap.css";

/**
 * Winding maze road: waypoints in percent coordinates (x: 0-100 across the
 * roadmap width, y: 0-100 down its height). Straight segments between them
 * give the path its left/right turns — stops sit on the flat stretch at
 * their peak swing so the pellet/robot land cleanly on a turn, not mid-bend.
 */
const PATH_POINTS = [
  { y: 0, x: 50 },
  { y: 5, x: 50 },
  { y: 10, x: 60 }, // saarthi (right turn)
  { y: 16, x: 60 },
  { y: 26, x: 50 },
  { y: 36, x: 40 },
  { y: 44, x: 40 },
  { y: 50, x: 40 }, // pryoport (left turn)
  { y: 56, x: 40 },
  { y: 66, x: 50 },
  { y: 76, x: 60 },
  { y: 84, x: 60 },
  { y: 90, x: 60 }, // screen (right turn)
  { y: 96, x: 60 },
  { y: 100, x: 50 },
];

function pointAtY(pts, yPercent) {
  if (yPercent <= pts[0].y) return pts[0];
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i];
    const b = pts[i + 1];
    if (yPercent >= a.y && yPercent <= b.y) {
      const t = b.y === a.y ? 0 : (yPercent - a.y) / (b.y - a.y);
      return { x: a.x + (b.x - a.x) * t, y: yPercent };
    }
  }
  return pts[pts.length - 1];
}

// Built in real pixel space (not the 0-100 percent space) so stroke width
// and the dash-based "reveal" trick stay consistent regardless of how
// stretched/narrow the roadmap container is.
function toPixelPath(points, w, h) {
  const pixelPoints = points.map((p) => ({ x: (p.x / 100) * w, y: (p.y / 100) * h }));
  const d = "M " + pixelPoints.map((p) => `${p.x},${p.y}`).join(" L ");
  const len = pixelPoints.reduce((total, p, i) => {
    if (i === 0) return 0;
    const prev = pixelPoints[i - 1];
    return total + Math.hypot(p.x - prev.x, p.y - prev.y);
  }, 0);
  return { d, len };
}

const stops = [
  {
    id: "saarthi",
    fraction: 0.1,
    side: "right",
    name: "Saarthi",
    tag: "Loan AI Assistant with Video-Based Onboarding",
    desc:
      "AI-powered loan underwriting and video onboarding platform with XGBoost risk scoring, SHAP explainability, multi-agent negotiation, and voice-based onboarding.",
    repo: "https://github.com/NANDINIS898/saarthi-main",
    media: { type: "image", src: saarthiMainImg, alt: "Saarthi" },
  },
  {
    id: "pryoport",
    fraction: 0.5,
    side: "left",
    name: "Pryoport",
    tag: "Smart Email Priority Detection Engine",
    desc:
      "AI-powered email prioritisation system combining dashboard, browser extension and alert engine. Makes sure all your important tasks & deadlines are never missed or buried under spam.",
    repo: "https://github.com/NANDINIS898/pryoport",
    media: { type: "video", src: pryoportDemoVideo },
  },
  {
    id: "screen",
    fraction: 0.9,
    side: "right",
    name: "Screen",
    tag: "AI Screening Platform",
    // TODO(Nandini): swap in a real 1-2 line description + tech stack.
    desc:
      "AI-driven candidate screening platform that scores and ranks applicants with resume matching, github analysis and role requirements to speed up early-stage hiring decisions.",
    tech: "TODO: FastAPI, Gmail calender API, NextJS, Groq, Celery, REDIS, PotgreSQL ",
    repo: "https://github.com/NANDINIS898/ai-screening-platform",
    demo: "https://visl-ai-lab-assignment-screening-pl.vercel.app/",
    media: { type: "placeholder" },
  },
];

function ScreenMock() {
  return (
    <div className="screen-mock" aria-hidden="true">
      <div className="screen-mock-scanline"></div>
      <div className="screen-mock-row">
        <span className="screen-mock-bar bar-1"></span>
        <span className="screen-mock-score">92%</span>
      </div>
      <div className="screen-mock-row">
        <span className="screen-mock-bar bar-2"></span>
        <span className="screen-mock-score">78%</span>
      </div>
      <div className="screen-mock-row">
        <span className="screen-mock-bar bar-3"></span>
        <span className="screen-mock-score">64%</span>
      </div>
      <div className="screen-mock-label">AI SCREENING</div>
    </div>
  );
}

export default function PacmanRoadmap() {
  const roadmapRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [containerSize, setContainerSize] = useState({ width: 972, height: 2200 });
  const [isMobile, setIsMobile] = useState(
    typeof window !== "undefined" && window.innerWidth <= 900
  );

  useEffect(() => {
    const el = roadmapRef.current;
    if (!el) return;

    let raf = null;

    function computeProgress() {
      const rect = el.getBoundingClientRect();
      const vh = window.innerHeight;
      const startOffset = vh * 0.8;
      const endOffset = vh * 0.35;
      const denom = rect.height + startOffset - endOffset;
      const traveled = startOffset - rect.top;
      const p = denom > 0 ? traveled / denom : 0;
      setProgress(Math.min(1, Math.max(0, p)));
    }

    function measure() {
      const rect = el.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
      setIsMobile(window.innerWidth <= 900);
    }

    function onScroll() {
      if (raf) return;
      raf = requestAnimationFrame(() => {
        computeProgress();
        raf = null;
      });
    }

    function onResize() {
      measure();
      computeProgress();
    }

    const ro = new ResizeObserver(measure);
    ro.observe(el);

    measure();
    computeProgress();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onResize);

    return () => {
      if (raf) cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  let currentIdx = 0;
  let bestDist = Infinity;
  stops.forEach((s, i) => {
    const d = Math.abs(progress - s.fraction);
    if (d < bestDist) {
      bestDist = d;
      currentIdx = i;
    }
  });

  // On narrow screens the maze zigzag doesn't fit next to a full-width
  // stacked card, so the path collapses to a straight vertical line pinned
  // at the same fixed left offset the pellets/robot render at.
  const mobileXPercent = containerSize.width > 0 ? (22 / containerSize.width) * 100 : 6;
  const activePoints = isMobile
    ? PATH_POINTS.map((p) => ({ ...p, x: mobileXPercent }))
    : PATH_POINTS;

  const robotPoint = pointAtY(activePoints, progress * 100);
  // heading accounts for the container's real aspect ratio so the rotation
  // matches the actual on-screen turn, not the distorted percent-space one
  const aheadPoint = pointAtY(activePoints, Math.min(100, progress * 100 + 0.6));
  const dxPx = ((aheadPoint.x - robotPoint.x) / 100) * containerSize.width;
  const dyPx = ((aheadPoint.y - robotPoint.y) / 100) * containerSize.height;
  const headingDeg = (Math.atan2(dyPx, dxPx) * 180) / Math.PI;

  const { d: roadPathD, len: roadPathLen } = toPixelPath(
    activePoints,
    containerSize.width,
    containerSize.height
  );

  return (
    <div className="pac-roadmap" ref={roadmapRef}>
      <svg
        className="road-svg"
        width={containerSize.width}
        height={containerSize.height}
        viewBox={`0 0 ${containerSize.width} ${containerSize.height}`}
      >
        <path d={roadPathD} className="road-line-path" />
        <path
          d={roadPathD}
          className="road-eaten-path"
          style={{
            strokeDasharray: roadPathLen,
            strokeDashoffset: roadPathLen * (1 - progress),
          }}
        />
      </svg>

      <div
        className="pac-robot"
        style={{ left: `${robotPoint.x}%`, top: `${robotPoint.y}%`, "--heading": `${headingDeg}deg` }}
      >
        <span className="pac-antenna-light"></span>
        <div className="pac-body"></div>
        <span className="pac-eye"></span>
      </div>

      {stops.map((s, i) => {
        const revealed = progress >= s.fraction - 0.04;
        const isCurrent = currentIdx === i;
        const p = pointAtY(activePoints, s.fraction * 100);
        const cardStyle = isMobile
          ? { left: "56px", right: "12px", top: `${p.y}%` }
          : s.side === "right"
          ? { left: `calc(${p.x}% + 34px)`, right: "16px", top: `${p.y}%` }
          : { left: "16px", right: `calc(${100 - p.x}% + 34px)`, top: `${p.y}%` };
        const pelletStyle = { left: `${p.x}%`, top: `${p.y}%` };

        return (
          <div
            key={s.id}
            className={`pac-stop${revealed ? " revealed" : ""}${isCurrent ? " current" : ""}`}
          >
            <span className="stop-pellet" style={pelletStyle}></span>
            <div className="stop-card project" style={cardStyle}>
              <div className="project-top">
                <span className="project-name">{s.name}</span>
                <span className="project-tag">{s.tag}</span>
              </div>

              <p className="project-desc">{s.desc}</p>
              {s.tech && <span className="stop-tech">{s.tech}</span>}

              <div className="stop-links">
                {s.repo && (
                  <a href={s.repo} className="stop-link mist-hover" target="_blank" rel="noreferrer">
                    <FaGithub /> Code
                  </a>
                )}
                {s.demo && (
                  <a href={s.demo} className="stop-link mist-hover" target="_blank" rel="noreferrer">
                    <FaExternalLinkAlt /> Live
                  </a>
                )}
              </div>

              {s.media.type === "image" && (
                <div className="capstone-media">
                  <img src={s.media.src} alt={s.media.alt} />
                </div>
              )}
              {s.media.type === "video" && (
                <div className="capstone-media">
                  <video src={s.media.src} controls />
                </div>
              )}
              {s.media.type === "placeholder" && <ScreenMock />}
            </div>
          </div>
        );
      })}
    </div>
  );
}
