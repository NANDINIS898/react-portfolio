import React, { useState } from "react";
import { FaGithub } from "react-icons/fa";
import AnimatedHeadline from "./Animatedheadline";
import PixelCoder from "./PixelCoder";
import { usePointerVars, useClock } from "./useY2K";
import "./Hero.css";

const ROLES = ["software engineer", "AI builder", "systems / backend"];

const TICKER = [
  "SOFTWARE ENGINEER",
  "AI BUILDER",
  "SYSTEMS / BACKEND",
  "MULTI-AGENT LLM PIPELINES",
  "LATE-NIGHT DEBUGGER",
];

// What the pixel coder says when poked.
const BUBBLES = ["hi! ✦", "one sec, debugging…", "works on my machine", "ok. shipping it."];

// Each letter is its own span so it can drop in on load and glitch on hover.
// The readable name lives in a visually hidden span; these are decoration.
function NameLine({ text, className, delay }) {
  return (
    <span
      className={"name-line " + className}
      data-text={text}
      aria-hidden="true"
      style={{ "--line-d": `${delay}ms` }}
    >
      {[...text].map((ch, i) => (
        <span className="name-ch" key={i} style={{ "--i": i }}>
          {ch}
        </span>
      ))}
    </span>
  );
}

function Star({ className = "", style }) {
  return (
    <svg className={"px-star " + className} style={style} viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
      <path d="M4 0h1v3h1v1h3v1H6v1H5v3H4V6H3V5H0V4h3V3h1z" fill="currentColor" />
    </svg>
  );
}

export default function Hero() {
  const heroRef = usePointerVars();
  const time = useClock();
  const [bubble, setBubble] = useState(0);

  return (
    <header className="hero" id="home" ref={heroRef}>
      <div className="hero-paper" aria-hidden="true"></div>
      <div className="hero-glow" aria-hidden="true"></div>

      <div className="hero-inner">
        <div className="hero-text">
          <p className="hero-kicker" data-enter style={{ "--d": "0ms" }}>
            <span className="status-dot"></span>
            SYSTEM ACTIVE <span className="sep">{"//"}</span> portfolio.exe{" "}
            <span className="sep">{"//"}</span> C:\nandini\home
          </p>

          <h1 className="hero-name">
            <span className="sr-only">Nandini Gangwar</span>
            <NameLine text="NANDINI" className="name-a" delay={120} />
            <NameLine text="GANGWAR" className="name-b" delay={320} />
          </h1>

          <p className="hero-tagline" data-enter style={{ "--d": "700ms" }}>
            building systems, one <mark>late-night debug</mark> at a time.
            <span className="caret" aria-hidden="true"></span>
          </p>

          <ul className="hero-roles" data-enter style={{ "--d": "820ms" }}>
            {ROLES.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>

          <div className="win hero-readme" data-enter style={{ "--d": "940ms" }}>
            <div className="win-bar">
              <span>readme.txt</span>
              <span className="win-ctrl" aria-hidden="true">
                <i></i>
                <i></i>
                <i></i>
              </span>
            </div>
            <div className="win-body">
              <AnimatedHeadline
                as="h2"
                baseDelay={1100}
                parts={[
                  { text: "I build systems that " },
                  { text: "think,", em: true, break: true },
                  { text: "then I make sure they're " },
                  { text: "correct and scalable.", em: true },
                ]}
              />
              <p className="hero-sub">
                Agent-driven products and AI automation engineered with debugging until edge
                cases stop breaking.
              </p>
            </div>
          </div>

          <div className="hero-cta" data-enter style={{ "--d": "1060ms" }}>
            <a href="#projects" className="btn98 btn98-primary">
              <span aria-hidden="true">▶</span> view projects
            </a>
            <a href="#about" className="btn98">
              about.txt
            </a>
            <a
              href="https://github.com/NANDINIS898"
              target="_blank"
              rel="noreferrer"
              className="btn98 btn98-icon"
              aria-label="GitHub profile"
            >
              <FaGithub />
            </a>
          </div>
        </div>

        <div className="hero-scene" data-enter style={{ "--d": "380ms" }}>
          <div className="float float-night" style={{ "--depth": -14 }}>
            <div className="win win-pink bob">
              <div className="win-bar">
                <span>night_shift.exe</span>
                <span className="win-ctrl" aria-hidden="true">
                  <i></i>
                </span>
              </div>
              <div className="win-body night-body">
                <span className="moon" aria-hidden="true"></span>
                <span className="night-time">{time}</span>
                <span className="night-note">still awake</span>
              </div>
            </div>
          </div>

          <div className="float float-build" style={{ "--depth": 18 }}>
            <div className="win bob bob-slow">
              <div className="win-bar">
                <span>build.log</span>
                <span className="win-ctrl" aria-hidden="true">
                  <i></i>
                </span>
              </div>
              <div className="win-body build-body" aria-hidden="true">
                <span className="build-status">
                  <span>compiling systems…</span>
                  <span>build ok ✓</span>
                </span>
                <span className="build-bar">
                  <span></span>
                </span>
              </div>
            </div>
          </div>

          <Star className="float star-a" style={{ "--depth": 26 }} />
          <Star className="float star-b" style={{ "--depth": -22 }} />
          <Star className="float star-c" style={{ "--depth": 12 }} />
          <span className="float px-bit bit-a" style={{ "--depth": 30 }} aria-hidden="true"></span>
          <span className="float px-bit bit-b" style={{ "--depth": -18 }} aria-hidden="true"></span>

          <div className="crt" aria-hidden="true">
            <div className="crt-screen">
              <div className="term">
                <span className="term-line" style={{ "--n": 12, "--t": "1.0s" }}>A:\&gt; whoami</span>
                <span className="term-line out" style={{ "--n": 15, "--t": "1.5s" }}>nandini gangwar</span>
                <span className="term-line" style={{ "--n": 20, "--t": "2.1s" }}>A:\&gt; ./build --systems</span>
                <span className="term-line out" style={{ "--n": 22, "--t": "2.8s" }}>[ok] agents [ok] rag</span>
                <span className="term-line" style={{ "--n": 20, "--t": "3.5s" }}>A:\&gt; debug --tonight</span>
                <span className="term-line out last" style={{ "--n": 20, "--t": "4.2s" }}>fixing edge cases</span>
              </div>
              <span className="crt-sweep"></span>
            </div>
            <div className="crt-chin">
              <span className="crt-brand">N.G-2000</span>
              <span className="crt-led"></span>
            </div>
          </div>

          <button
            type="button"
            className="coder"
            onClick={() => setBubble((b) => (b + 1) % BUBBLES.length)}
            aria-label="Poke the pixel coder"
          >
            <span className="coder-bubble" aria-live="polite">
              {BUBBLES[bubble]}
            </span>
            <PixelCoder />
          </button>

          <div className="desk" aria-hidden="true">
            <span className="kbd"></span>
            <span className="mug"></span>
          </div>

          <span className="scene-label label-a" aria-hidden="true">
            fig. 01 — the developer, 2&nbsp;a.m.
          </span>
          <span className="scene-label label-b" aria-hidden="true">
            <span className="status-dot"></span> ONLINE
          </span>
        </div>
      </div>

      <div className="hero-marquee" aria-hidden="true">
        <div className="marquee-track">
          {[0, 1].map((k) => (
            <span className="marquee-set" key={k}>
              {TICKER.map((t) => (
                <span key={t}>
                  <Star /> {t}
                </span>
              ))}
            </span>
          ))}
        </div>
      </div>
    </header>
  );
}
