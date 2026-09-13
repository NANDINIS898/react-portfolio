import React, { useEffect, useRef, useState } from "react";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import saarthiMainImg from "./saarthi-main.png";
import pryoportDemoVideo from "./pryoport video - Trim.mp4";
import "./PacmanRoadmap.css";

const ROBOT_SIZE = 46;

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
      "AI-driven candidate screening platform that scores and ranks applicants against role requirements to speed up early-stage hiring decisions.",
    tech: "TODO: tech stack",
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
  const [trackHeight, setTrackHeight] = useState(0);

  useEffect(() => {
    const el = roadmapRef.current;
    if (!el) return;

    let raf = null;

    function measure() {
      setTrackHeight(el.clientHeight);
    }

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

  const robotTop = Math.max(0, trackHeight - ROBOT_SIZE) * progress;
  const wobble = Math.sin(progress * Math.PI * 14) * 6;

  return (
    <div className="pac-roadmap" ref={roadmapRef}>
      <div className="road-line"></div>
      <div className="road-eaten" style={{ height: `${progress * 100}%` }}></div>

      <div
        className="pac-robot"
        style={{ top: `${robotTop}px`, "--wobble": `${wobble}px` }}
      >
        <span className="pac-antenna-light"></span>
        <div className="pac-body"></div>
        <span className="pac-eye"></span>
      </div>

      {stops.map((s, i) => {
        const revealed = progress >= s.fraction - 0.04;
        const isCurrent = currentIdx === i;
        return (
          <div
            key={s.id}
            className={`pac-stop stop-${s.side}${revealed ? " revealed" : ""}${isCurrent ? " current" : ""}`}
            style={{ top: `${s.fraction * 100}%` }}
          >
            <span className="stop-pellet"></span>
            <div className="stop-card project">
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
