import React from "react";
import "./App.css";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import tensorflowCert from "./deeplearning.png";
import genaiCert from "./genai_simulation.png";
import saarthiMainImg from "./saarthi-main.png";
import pryoportDashboardImg from "./pryoport-dashboard.png";
import pryoportDemoVideo from "./pryoport video - Trim.mp4";
import useFogEffect from "./useFogEffect";
import profileImage from "./nandini.jpeg";



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
          N.G<span>/ portfolio</span>
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
  <h1 className="signature-name">Nandini</h1>
</div>

        

        <canvas ref={canvasRef} id="fogCanvas"></canvas>

        <div ref={hintRef} className="hint">
          <span className="dot"></span>
          breathe on the glass, then drag to wipe it clean
        </div>

        <div className="hero-copy">
          <div className="eyebrow">
            AI Systems Engineer · President, eCell MSIT
          </div>

          <h1 className="hero-title">
            I build systems that <em>think,</em>
            <br />
            then I make sure they're <em>correct and scalable.</em>
          </h1>

          <p className="hero-sub">
            Agent-driven products, loan intelligence, and AI automation
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
            <div className="about-image"><img src={profileImage} alt="Nandini" /></div>
            <div className="about-text">
              <p>
                I’m a B.Tech student (CGPA :9.00) focused on building AI systems that solve
                real-world problems through product thinking and engineering.
              </p>

              <p>
                Most of what I build sits at the intersection of{" "}
                <strong>Generative AI, machine learning and systems design</strong>
                - from multi-agent LLM pipelines to credit-risk intelligence.
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
                <span className="stat-val">2</span>
              </div>

              <div className="stat">
                <span className="stat-label">LeetCode</span>
                <span className="stat-val">350+</span>
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
              <span className="project-tag">Loan AI Assistant with Video Based Onboarding</span>
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
              <span className="project-tag">Smart Email Priority Detection Engine</span>
            </div>

            <p className="project-desc">
              AI-powered email prioritisation system combining dashboard, browser
              extension and alert engine. Makes sure all your important tasks & deadlines are never missed or buried under spam.
            </p>

            <div className="capstone-media">
              <video src={pryoportDemoVideo} controls />
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
              🏆 IIT Delhi TRYST 2025 : 3rd Place
            </div>
            <div className="ach-card">
              🏅 DTU CodeWithDCG : Special Mention
            </div>
            <div className="ach-card">
              🥉 ABES Hacknovate 6.0 : 3rd Place
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

      <footer>built by nandini G. · 2026</footer>
    </div>
  );
}

export default App;