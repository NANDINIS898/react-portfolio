import React, { useState } from "react";
import "./App.css";
import tensorflowCert from "./deeplearning.png";
import genaiCert from "./genai_simulation.png";
import ProjectLab from "./ProjectLab";
import ExperienceRoadmap from "./ExperienceRoadmap";
import { experience } from "./experience";
import Skills from "./Skills";
import Contact from "./Contact";
import Hero from "./Hero";
import About from "./About";
import { useClock } from "./useY2K";
import { useClickSounds, useSoundSetting } from "./sound";

// The Experience section and its link exist only while experience.js has entries.
const hasExperience = experience.length > 0;

const navLinks = [
  { href: "#home", label: "home" },
  { href: "#about", label: "about" },
  ...(hasExperience ? [{ href: "#experience", label: "experience" }] : []),
  { href: "#projects", label: "projects" },
  { href: "#tech-stack", label: "skills" },
  { href: "#achievements", label: "awards" },
  { href: "#contact", label: "contact" },
];

const achievements = [
  { event: "IIT Delhi TRYST 2025", result: "3rd Place" },
  { event: "DTU CodeWithDCG", result: "Special Mention" },
  { event: "ABES Hacknovate 6.0", result: "3rd Place" },
];

const certifications = [
  { title: "Deep Learning with TensorFlow 2.0", issuer: "365 Careers · July 2025", image: tensorflowCert },
  { title: "GenAI-Powered Analytics Simulation", issuer: "Tata & Forage · July 2025", image: genaiCert },
];

// Section numbers follow About (01); they shift by one when Experience is shown.
const sectionNum = (n) => String(n + (hasExperience ? 1 : 0)).padStart(2, "0");

// Floating taskbar. Below 1100px the links fold into a MENU dropdown that
// closes as soon as one is chosen.
function Nav() {
  const [open, setOpen] = useState(false);
  const time = useClock();
  const [soundOn, setSoundOn] = useSoundSetting();

  return (
    <nav className={"nav" + (open ? " is-open" : "")} aria-label="Primary">
      <a href="#home" className="nav-mark">
        N.G<span>/ portfolio</span>
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

      <div className="nav-tray" aria-hidden="true">
        <span className="status-dot"></span>
        <span>online</span>
        <span className="nav-clock">{time}</span>
      </div>
    </nav>
  );
}

function App() {
  useClickSounds();

  return (
    <div className="app">
      <Nav />
      <Hero />

      <main>
        <div className="wrap">
          <About />
        </div>

        {/* Everything after About sits on the beige desk: black and cream,
            with pink and blue only as small accents. */}
        <div className="beige">
          <div className="wrap">
            {/* EXPERIENCE */}
            {hasExperience && (
              <section className="section" id="experience">
                <div className="section-head">
                  <span className="section-num">02</span>
                  <span className="section-title">Build Journey</span>
                  <span className="section-line"></span>
                </div>

                <ExperienceRoadmap items={experience} />
              </section>
            )}

            {/* PROJECTS */}
            <section className="section" id="projects">
              <div className="section-head">
                <span className="section-num">{sectionNum(2)}</span>
                <span className="section-title">Project Lab</span>
                <span className="section-line"></span>
              </div>

              <ProjectLab />
            </section>

            {/* SKILLS */}
            <section className="section" id="tech-stack">
              <div className="section-head">
                <span className="section-num">{sectionNum(3)}</span>
                <span className="section-title">Tech Stack</span>
                <span className="section-line"></span>
              </div>

              <Skills />
            </section>

            {/* AWARDS + CERTIFICATES */}
            <section className="section" id="achievements">
              <div className="section-head">
                <span className="section-num">{sectionNum(4)}</span>
                <span className="section-title">Awards & Certs</span>
                <span className="section-line"></span>
              </div>

              <p className="room-label">
                <b>shelf_01</b> hackathons
              </p>
              <ul className="trophy-row">
                {achievements.map((a) => (
                  <li className="trophy" key={a.event}>
                    <svg className="trophy-star" viewBox="0 0 9 9" shapeRendering="crispEdges" aria-hidden="true">
                        <path d="M4 0h1v3h1v1h3v1H6v1H5v3H4V6H3V5H0V4h3V3h1z" fill="currentColor" />
                      </svg>
                    <div className="trophy-cup">
                      <span className="trophy-result">{a.result}</span>
                    </div>
                    <div className="trophy-stem" aria-hidden="true"></div>
                    <div className="trophy-base">{a.event}</div>
                  </li>
                ))}
              </ul>
              <div className="room-shelf" aria-hidden="true"></div>

              <p className="room-label" id="certifications">
                <b>wall_02</b> certificates
              </p>
              <ul className="cert-wall">
                {certifications.map((c) => (
                  <li className="cert-hang" key={c.title} tabIndex={0}>
                    <span className="cert-string" aria-hidden="true"></span>
                    <figure className="cert-frame">
                      <img src={c.image} alt={`${c.title} certificate`} />
                      <span className="cert-stamp" aria-hidden="true">
                        certified ✓
                      </span>
                      <figcaption className="cert-plate">
                        <h3>{c.title}</h3>
                        <p>{c.issuer}</p>
                      </figcaption>
                    </figure>
                  </li>
                ))}
              </ul>
            </section>

            <Contact />
          </div>
        </div>
      </main>

      <footer className="site-footer">
        <span>© 2026 Nandini Gangwar</span>
        <span className="footer-mid">built by nandini G.</span>
        <span>
          <span className="status-dot"></span> system online
          <a href="#home">top ↑</a>
        </span>
      </footer>
    </div>
  );
}

export default App;
