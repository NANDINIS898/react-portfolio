import React from "react";
import "./App.css";
import profileImage from "./nandini.jpeg";
import tensorflowCert from "./deeplearning.png";
import genaiCert from "./genai_simulation.png";
import { ReactTyped } from "react-typed";

import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

// Puryopor feature screenshots — drop the following files into /public:
//   puryopor-dashboard.png, puryopor-extension.png, puryopor-scan.png,
//   puryopor-report.png, puryopor-alerts.png, puryopor-history.png
const puryoporShots = [
  {
    src: "/puryopor-dashboard.png",
    title: "Dashboard",
    desc: "Central view of purity scores, recent scans and trend graphs across all monitored products.",
  },
  {
    src: "/puryopor-extension.png",
    title: "Browser Extension",
    desc: "One-click ingredient analysis on any e-commerce product page — verdict shown inline.",
  },
  {
    src: "/puryopor-scan.png",
    title: "Ingredient Scan",
    desc: "OCR + LLM pipeline parses ingredient lists from labels and classifies each component.",
  },
  {
    src: "/puryopor-report.png",
    title: "Detailed Report",
    desc: "Per-product breakdown of harmful additives, allergens and a transparent purity score.",
  },
  {
    src: "/puryopor-alerts.png",
    title: "Smart Alerts",
    desc: "Personalised warnings based on user health profile, allergies and dietary preferences.",
  },
  {
    src: "/puryopor-history.png",
    title: "History & Insights",
    desc: "Tracks consumption patterns over time and surfaces insights on overall product purity.",
  },
];

const practiceProjects = [
  {
    name: "My Movie Mate",
    desc: "Movie recommender web app with mood playlists, favorites and TMDB-powered search.",
    tech: "ReactJS · Node.js · MySQL · TMDB API",
    repo: "https://github.com/NANDINIS898/my-movie-mate",
  },
  {
    name: "InsightCV",
    desc: "AI-powered resume reviewer with job-fit score predictions using GenAI.",
    tech: "Python · TensorFlow · Hugging Face · Streamlit",
    repo: "https://github.com/NANDINIS898/InsightCV",
  },
  {
    name: "EventEase Bot",
    desc: "GenAI event planner using LLMs and RAG for college societies.",
    tech: "Python · LangChain · Streamlit · ChromaDB",
    repo: "https://github.com/NANDINIS898/event-ease-bot",
  },
  {
    name: "Nandini AI VoiceBot",
    desc: "Conversational voice assistant built on speech-to-text + LLM + TTS pipeline.",
    tech: "Python · Whisper · LLM APIs · gTTS",
    repo: "#", // TODO: replace with actual repo URL
  },
  {
    name: "BudgetWise",
    desc: "AI-powered budget tracker with category spend analysis and alerts.",
    tech: "Pandas · NumPy · Matplotlib · Tkinter",
    repo: "https://github.com/NANDINIS898/budget-tracker-app",
  },
];

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-left">Nandini</div>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#capstones">Capstones</a></li>
          <li><a href="#practice">Practice</a></li>
          <li><a href="#achievements">Achievements</a></li>
          <li><a href="#certifications">Certifications</a></li>
          <li><a href="#contact">Contact</a></li>
        </ul>
      </nav>

      <header className="hero" id="about">
        <div className="hero-left">
          <img src={profileImage} alt="Nandini" className="profile-pic" />
        </div>
        <div className="hero-right">
          <h1>
            <ReactTyped
              strings={["Hi, I am Nandini Gangwar"]}
              typeSpeed={60}
              backSpeed={30}
              loop={false}
            />
          </h1>
          <p>
            <strong>AI Systems Engineer</strong> |specializing in decision intelligence & workflow automation|
             Building scalable AI-powered decision systems| President @ E-Cell MSIT
          </p>
          <p>
            Passionate about building impactful AI applications using LLMs, RAG systems, and deep learning.
            With experience in Python, CrewAI, TensorFlow, LangChain, and ReactJS, I design, and scale AI systems with agents, 
            fine-tuned LLMs, cost-aware routing, and cloud-native automation.
          </p>
          <div className="links">
            <a href="https://github.com/NANDINIS898" target="_blank" rel="noreferrer">
              <FaGithub size={20} /> GitHub
            </a>
            <a href="https://www.linkedin.com/in/nandini-gangwar-b47987213/" target="_blank" rel="noreferrer">
              <FaLinkedin size={20} /> LinkedIn
            </a>
            <a href="mailto:nandinis898@gmail.com">
              <FaEnvelope size={20} /> Email
            </a>
          </div>
        </div>
      </header>

      {/* === FEATURED CAPSTONES === */}
      <section className="capstones" id="capstones">
        <h2>Capstone Projects</h2>

        {/* --- SAARTHI --- */}
        <div className="capstone saarthi">
          <div className="capstone-header">
            <h3>Saarthi</h3>
            <span className="capstone-tag">Capstone · AI Companion</span>
          </div>
          <p className="capstone-desc">
            Saarthi is an AI-driven companion designed to guide users through personalised
            journeys — combining LLM reasoning, voice interaction and contextual memory to
            deliver an empathetic, conversational experience.
          </p>

          <div className="saarthi-video-wrap">
            {/* Drop your demo into /public/saarthi-demo.mp4 (and optional poster image) */}
            <video
              className="saarthi-video"
              src="/saarthi-demo.mp4"
              poster="/saarthi-poster.png"
              controls
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <p className="tech">Python · LangChain · LLMs · Speech I/O · ReactJS</p>
          <div className="capstone-links">
            <a href="#" target="_blank" rel="noreferrer">
              <FaGithub /> View Code
            </a>
          </div>
        </div>

        {/* --- PURYOPOR --- */}
        <div className="capstone puryopor">
          <div className="capstone-header">
            <h3>Puryopor</h3>
            <span className="capstone-tag">Capstone · Purity Intelligence</span>
          </div>
          <p className="capstone-desc">
            Puryopor brings transparency to everyday products. A dashboard + browser extension
            stack that analyses ingredient lists, flags harmful additives and produces an
            easy-to-read purity score — powered by OCR and LLM-based ingredient classification.
          </p>

          <div className="puryopor-grid">
            {puryoporShots.map((shot) => (
              <div className="puryopor-card" key={shot.title}>
                <img src={shot.src} alt={`Puryopor ${shot.title}`} />
                <div className="puryopor-overlay">
                  <h4>{shot.title}</h4>
                  <p>{shot.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="tech">Python · FastAPI · React · Chrome Extension · OCR · LLMs</p>
          <div className="capstone-links">
            <a href="#" target="_blank" rel="noreferrer">
              <FaGithub /> View Code
            </a>
          </div>
        </div>
      </section>

      {/* === PRACTICE PROJECTS (less highlighted) === */}
      <section className="practice" id="practice">
        <h2>Practice Projects</h2>
        <p className="practice-sub">
          Smaller builds along the way — exploring different stacks and ideas.
        </p>
        <ul className="practice-list">
          {practiceProjects.map((p) => (
            <li className="practice-item" key={p.name}>
              <div className="practice-main">
                <h4>{p.name}</h4>
                <p>{p.desc}</p>
                <span className="practice-tech">{p.tech}</span>
              </div>
              <a
                className="practice-repo"
                href={p.repo}
                target="_blank"
                rel="noreferrer"
              >
                <FaGithub /> GitHub
              </a>
            </li>
          ))}
        </ul>
      </section>

      <section className="placeholder-section" id="achievements">
        <h2>Achievements - 3x Hackathon Winner</h2>
        <p>🏆 3rd @ IIT Delhi TRYST'25</p>
        <p>🏅 Special Mention @ DTU CodeWithDCG</p>
        <p>🥉 3rd @ ABES Hacknovate 6.0</p>
      </section>

      <section className="certifications" id="certifications">
        <h2>Certifications</h2>
        <div className="cert-grid">
          <div className="cert-card">
            <img src={tensorflowCert} alt="TensorFlow Certification" />
            <h3>Deep Learning with TensorFlow 2.0</h3>
            <p>365 Careers · July 2025</p>
          </div>
          <div className="cert-card">
            <img src={genaiCert} alt="GenAI Simulation" />
            <h3>GenAI-Powered Data Analytics Simulation</h3>
            <p>Tata & Forage · July 2025</p>
          </div>
        </div>
      </section>

      <section className="placeholder-section" id="contact">
        <h2>Contact</h2>
        <p>📩 nandinis898@gmail.com</p>
        <p>📱 +91 7290991996</p>
        <p>🌐 <a href="https://www.linkedin.com/in/nandini-gangwar-b47987213/" target="_blank" rel="noreferrer">LinkedIn</a></p>
      </section>
    </div>
  );
}

export default App;
