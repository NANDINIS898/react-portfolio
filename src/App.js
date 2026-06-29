import React from "react";
import "./App.css";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import tensorflowCert from "./deeplearning.png";
import genaiCert from "./genai_simulation.png";
import saarthiMainImg from "./saarthi-main.png";
import pryoportDashboardImg from "./pryoport-dashboard.png";
import pryoportDemoVideo from "./pryoport video - Trim.mp4";
import useFogEffect from "./useFogEffect";

const puryoporShots = [
  {
    src: pryoportDashboardImg,
    title: "Dashboard",
    desc: "Unified view of priority emails and activity trends.",
  },
  {
    src: "/pryoport-extension.png",
    title: "Browser Extension",
    desc: "Inline email triage directly in browser.",
  },
  {
    src: "/pryoport-alerts.png",
    title: "Smart Alerts",
    desc: "AI-powered priority notifications.",
  },
];

const techStack = [
  "Python",
  "C++",
  "JavaScript",
  "React",
  "Node.js",
  "FastAPI",
  "TypeScript",
  "TensorFlow",
  "Scikit-learn",
  "LangChain",
  "CrewAI",
  "RAG Systems",
  "XGBoost",
  "ChromaDB",
  "SQL",
  "Git",
];

const practiceProjects = [
  {
    name: "My Movie Mate",
    desc: "Movie recommender with mood playlists and favorites.",
    tech: "ReactJS · Node.js · MySQL",
    repo: "https://github.com/NANDINIS898/my-movie-mate",
  },
  {
    name: "InsightCV",
    desc: "AI-powered resume reviewer with job-fit scoring.",
    tech: "Python · TensorFlow · Streamlit",
    repo: "https://github.com/NANDINIS898/InsightCV",
  },
  {
    name: "EventEase Bot",
    desc: "GenAI event planner using LLM + RAG.",
    tech: "LangChain · ChromaDB",
    repo: "https://github.com/NANDINIS898/event-ease-bot",
  },
  {
    name: "VoiceBot",
    desc: "Speech-to-text + LLM + TTS assistant.",
    tech: "Whisper · Python",
    repo: "https://github.com/NANDINIS898/nandini-ai-voicebot-frontend",
  },
  {
    name: "BudgetWise",
    desc: "AI-powered budget tracker with analytics.",
    tech: "Pandas · NumPy",
    repo: "https://github.com/NANDINIS898/budget-tracker-app",
  },
];

function App() {
  const { canvasRef, skylineRef, sigRef, hintRef } = useFogEffect();

  return (
    <div className="app">
      {/* NAV */}
      <nav className="nav">
        <div className="nav-mark">
          N.K<span>/ portfolio</span>
        </div>

        <div className="nav-links">
          <a href="#about">about</a>
          <a href="#capstones">capstones</a>
          <a href="#practice">practice</a>
          <a href="#tech-stack">tech stack</a>
          <a href="#achievements">achievements</a>
          <a href="#certifications">certifications</a>
          <a href="#contact">contact</a>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="outside">
          <div className="skyline" ref={skylineRef}></div>
        </div>

        <div className="signature-layer">
          <svg
            viewBox="0 0 600 220"
            width="min(86vw,560px)"
            style={{ overflow: "visible" }}
          >
            <path
              ref={sigRef}
              id="sigPath"
              d="M30,150 C45,100 60,55 78,55 C96,55 100,110 95,150
              C90,180 85,160 95,140 C115,100 130,70 138,70
              C146,70 140,120 145,140 C148,152 158,140 165,118
              L180,75 C175,110 172,140 178,148 C184,156 198,135 205,110
              M225,150 L225,60 M210,60 L240,60
              M255,150 C255,110 258,75 270,75 C282,75 282,115 270,140
              C262,156 250,150 255,140
              M300,150 L300,55 M300,55 L335,55 C350,55 350,90 335,90
              L300,90 M320,90 L345,150
              M365,150 C365,110 368,75 380,75 C392,75 392,115 380,140
              C372,156 360,150 365,140
              M410,150 L410,60
              M430,150 C430,150 432,90 445,90 C458,90 446,150 458,150
              C470,150 472,100 478,90
              M495,150 L495,55 L520,150 L520,55"
            />
          </svg>
        </div>

        <canvas ref={canvasRef} id="fogCanvas"></canvas>

        <div ref={hintRef} className="hint">
          <span className="dot"></span>
          breathe on the glass, then drag to wipe it clean
        </div>

        <div className="hero-copy">
          <div className="eyebrow">
            AI Systems Engineer · President, E-Cell MSIT
          </div>

          <h1 className="hero-title">
            I build systems that <em>think,</em>
            <br />
            then I make sure they're <em>correct.</em>
          </h1>

          <p className="hero-sub">
            Agent-driven products, loan intelligence, and AI automation —
            engineered with product thinking and debugged until edge cases stop
            breaking.
          </p>
        </div>

        <div className="scroll-cue"></div>
      </section>

      <main className="wrap">
        {/* ABOUT */}
        <section className="section" id="about">
          <div className="section-head">
            <span className="section-num">01</span>
            <span className="section-title">About</span>
            <span className="section-line"></span>
          </div>

          <div className="about-grid">
            <div className="about-text">
              <p>
                I’m a B.Tech CS student focused on building AI systems that solve
                real-world problems through product thinking and engineering.
              </p>

              <p>
                Most of what I build sits at the intersection of{" "}
                <strong>Generative AI, machine learning and systems design</strong>
                — from multi-agent LLM pipelines to credit-risk intelligence.
              </p>

              <p>
                I’m currently preparing for SDE and AI/ML roles at product-based
                companies while building strong AI products and sharpening DSA.
              </p>
            </div>

            <div className="stat-rail">
              <div className="stat">
                <span className="stat-label">Hackathon wins</span>
                <span className="stat-val">3</span>
              </div>

              <div className="stat">
                <span className="stat-label">Major AI Projects</span>
                <span className="stat-val">7+</span>
              </div>

              <div className="stat">
                <span className="stat-label">Current Focus</span>
                <span className="stat-val">GenAI</span>
              </div>

              <div className="stat">
                <span className="stat-label">Target</span>
                <span className="stat-val">SDE + AI</span>
              </div>
            </div>
          </div>
        </section>

        {/* CAPSTONES */}
        <section className="section" id="capstones">
          <div className="section-head">
            <span className="section-num">02</span>
            <span className="section-title">Capstones</span>
            <span className="section-line"></span>
          </div>

          <div className="project">
            <div className="project-top">
              <span className="project-name">Saarthi</span>
              <span className="project-tag">Loan AI Assistant</span>
            </div>

            <p className="project-desc">
              AI-powered loan underwriting and video onboarding platform with
              XGBoost risk scoring, SHAP explainability, multi-agent negotiation,
              and voice-based onboarding.
            </p>

            <div className="capstone-media">
              <img src={saarthiMainImg} alt="Saarthi" />
            </div>
          </div>

          <div className="project">
            <div className="project-top">
              <span className="project-name">Pryoport</span>
              <span className="project-tag">Email Intelligence</span>
            </div>

            <p className="project-desc">
              AI-powered email prioritisation system combining dashboard, browser
              extension and alert engine.
            </p>

            <div className="capstone-media">
              <video src={pryoportDemoVideo} controls />
            </div>

            <div className="shot-grid">
              {puryoporShots.map((shot) => (
                <div className="shot-card" key={shot.title}>
                  <img src={shot.src} alt={shot.title} />
                  <div className="shot-card-body">
                    <h4>{shot.title}</h4>
                    <p>{shot.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* TECH STACK */}
        <section className="section" id="tech-stack">
          <div className="section-head">
            <span className="section-num">03</span>
            <span className="section-title">Tech Stack</span>
            <span className="section-line"></span>
          </div>

          <div className="stack-row">
            {techStack.map((item) => (
              <span key={item} className="chip">
                {item}
              </span>
            ))}
          </div>
        </section>

        {/* PRACTICE */}
        <section className="section" id="practice">
          <div className="section-head">
            <span className="section-num">04</span>
            <span className="section-title">Practice Projects</span>
            <span className="section-line"></span>
          </div>

          <ul className="practice-list">
            {practiceProjects.map((p) => (
              <li className="practice-item" key={p.name}>
                <div className="practice-main">
                  <h4>{p.name}</h4>
                  <p>{p.desc}</p>
                  <span className="practice-tech">{p.tech}</span>
                </div>

                <a href={p.repo} className="practice-repo">
                  <FaGithub /> GitHub
                </a>
              </li>
            ))}
          </ul>
        </section>

        {/* ACHIEVEMENTS */}
        <section className="section" id="achievements">
          <div className="section-head">
            <span className="section-num">05</span>
            <span className="section-title">Achievements</span>
            <span className="section-line"></span>
          </div>

          <div className="ach-grid">
            <div className="ach-card">
              🏆 IIT Delhi TRYST 2025 — 3rd Place
            </div>
            <div className="ach-card">
              🏅 DTU CodeWithDCG — Special Mention
            </div>
            <div className="ach-card">
              🥉 ABES Hacknovate 6.0 — 3rd Place
            </div>
          </div>
        </section>

        {/* CERTS */}
        <section className="section" id="certifications">
          <div className="section-head">
            <span className="section-num">06</span>
            <span className="section-title">Certifications</span>
            <span className="section-line"></span>
          </div>

          <div className="cert-grid">
            <div className="cert-card">
              <img src={tensorflowCert} alt="" />
              <div className="cert-card-body">
                <h3>Deep Learning with TensorFlow 2.0</h3>
                <p>365 Careers · July 2025</p>
              </div>
            </div>

            <div className="cert-card">
              <img src={genaiCert} alt="" />
              <div className="cert-card-body">
                <h3>GenAI-Powered Analytics Simulation</h3>
                <p>Tata & Forage · July 2025</p>
              </div>
            </div>
          </div>
        </section>

        {/* CONTACT */}
        <section className="contact" id="contact">
          <h2 className="contact-title">
            Let’s build something <span className="accent">meaningful.</span>
          </h2>

          <p className="contact-sub">
            Open to internships and roles in SDE, AI/ML and GenAI.
          </p>

          <div className="contact-links">
            <a href="mailto:nandinis898@gmail.com" className="contact-link primary">
              <FaEnvelope /> Email
            </a>

            <a
              href="https://github.com/NANDINIS898"
              className="contact-link"
            >
              <FaGithub /> GitHub
            </a>

            <a
              href="https://www.linkedin.com/in/nandini-gangwar-b47987213/"
              className="contact-link"
            >
              <FaLinkedin /> LinkedIn
            </a>
          </div>
        </section>
      </main>

      <footer>built by nandini · 2026</footer>
    </div>
  );
}

export default App;