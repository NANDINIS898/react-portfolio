import React, { useState } from "react";
import "./App.css";
import ExperienceSky from "./ExperienceSky";
import { experience } from "./experience";
import Contact from "./Contact";
import PersonaHero from "./PersonaHero";
import StageScene from "./StageScene";
import DebugScene from "./DebugScene";
import ProjectRoad from "./ProjectRoad";
import { useClickSounds, useSoundSetting } from "./sound";
import { useScrollReveals } from "./motion";

// The Experience section and its link exist only while experience.js has entries.
const hasExperience = experience.length > 0;

const navLinks = [
  { href: "#stage", label: "stage" },
  { href: "#home", label: "personas" },
  { href: "#tech-stack", label: "stack" },
  ...(hasExperience ? [{ href: "#experience", label: "journey" }] : []),
  { href: "#projects", label: "projects" },
  { href: "#achievements", label: "awards" },
  { href: "#contact", label: "contact" },
];

const achievements = [
  { event: "IIT Delhi TRYST 2025", result: "3rd Place" },
  { event: "DTU CodeWithDCG", result: "Special Mention" },
  { event: "ABES Hacknovate 6.0", result: "3rd Place" },
];

// Section numbers for the closing chapters.
const sectionNum = (n) => String(n).padStart(2, "0");

// Floating nav pill. Below 1000px the links fold into a MENU dropdown that
// closes as soon as one is chosen.
function Nav() {
  const [open, setOpen] = useState(false);
  const [soundOn, setSoundOn] = useSoundSetting();

  return (
    <nav className={"nav" + (open ? " is-open" : "")} aria-label="Primary">
      <a href="#stage" className="nav-mark">
        Nandini<span>portfolio</span>
      </a>

      <button
        type="button"
        className="nav-toggle"
        aria-expanded={open}
        aria-controls="nav-links"
        onClick={() => setOpen((o) => !o)}
      >
        {open ? "close" : "menu"}
      </button>

      <div className="nav-links" id="nav-links" onClick={() => setOpen(false)}>
        {navLinks.map((l) => (
          <a href={l.href} key={l.href}>
            {l.label}
          </a>
        ))}
      </div>

      <button
        type="button"
        className="nav-sound"
        aria-pressed={soundOn}
        aria-label="Sound effects"
        title={soundOn ? "Sound effects: on" : "Sound effects: off"}
        onClick={() => setSoundOn(!soundOn)}
      >
        <span aria-hidden="true">♪</span> {soundOn ? "on" : "off"}
      </button>
    </nav>
  );
}

function App() {
  useClickSounds();
  useScrollReveals();

  return (
    <div className="app">
      <Nav />
      <main>
        <StageScene />
        <PersonaHero />
        <DebugScene />
        {hasExperience && <ExperienceSky items={experience} />}
        <ProjectRoad />

        <div className="beige">
          <div className="wrap">
            {/* AWARDS */}
            <section className="section awards" id="achievements">
              <div className="section-head">
                <span className="section-num">{sectionNum(1)}</span>
                <span className="section-title">Awards</span>
                <span className="section-line"></span>
              </div>

              <h2 className="awards-title">
                Built under <em>pressure,</em> recognised for it.
              </h2>

              <ol className="awards-list">
                {achievements.map((a, i) => (
                  <li key={a.event}>
                    <span className="awards-n">{sectionNum(i + 1)}</span>
                    <span className="awards-event">{a.event}</span>
                    <span className="awards-result">{a.result}</span>
                  </li>
                ))}
              </ol>
            </section>

            <Contact />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <span>© 2026 Nandini Gangwar</span>
        <span>
          designed &amp; built by Nandini
          <a href="#stage">back to top ↑</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
