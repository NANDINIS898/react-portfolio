import React from "react";
import "./App.css";
import profileImage from "./nandini.jpeg";
import tensorflowCert from "./deeplearning.png";
import genaiCert from "./genai_simulation.png";
import saarthiMainImg from "./saarthi-main.png";
import pryoportDashboardImg from "./pryoport-dashboard.png";
import pryoportDemoVideo from "./pryoport video - Trim.mp4";
import { ReactTyped } from "react-typed";

import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

// Puryopor feature screenshots — drop the following files into /public:
//   puryopor-dashboard.png, puryopor-extension.png, puryopor-scan.png,
//   puryopor-report.png, puryopor-alerts.png, puryopor-history.png
const puryoporShots = [
  {
    src: pryoportDashboardImg,
    title: "Dashboard",
    desc: "Unified view of priority emails, recent activity and importance trends across the inbox.",
  },
  {
    src: "/pryoport-extension.png", // TODO: drop pryoport-extension.png into /public
    title: "Browser Extension",
    desc: "One-click triage on any open email — priority verdict shown inline in the browser.",
  },
  {
    src: "/pryoport-alerts.png", // TODO: drop pryoport-alerts.png into /public
    title: "Smart Alerts",
    desc: "Personalised warnings whenever an urgent or important email arrives, tuned to the user's priorities.",
  },
];

const techStack = [
  {
    title: "Programming Languages",
    icon: "💻",
    items: ["Python", "C++", "JavaScript", "SQL"],
  },
  {
    title: "AI / ML & GenAI",
    icon: "🤖",
    items: [
      "TensorFlow",
      "Scikit-learn",
      "XGBoost",
      "LangChain",
      "CrewAI",
      "LangSmith",
      "RAG Systems",
      "SHAP",
    ],
  },
  {
    title: "Frameworks & Full Stack",
    icon: "⚙️",
    items: [
      "ReactJS",
      "Node.js",
      "Express.js",
      "FastAPI",
      "REST APIs",
      "Streamlit",
    ],
  },
  {
    title: "Databases",
    icon: "🗄️",
    items: ["MySQL", "PostgreSQL", "ChromaDB", "SQLite"],
  },
  {
    title: "Tools & Infra",
    icon: "🧠",
    items: ["PyPDFLoader", "Git", "GitHub", "GitLab"],
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
    repo: "https://github.com/NANDINIS898/nandini-ai-voicebot-frontend", // TODO: replace with actual repo URL
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
          <li><a href="#tech-stack">Tech Stack</a></li>
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
            <strong>AI Systems Engineer</strong> | Product Thinking |
             Building scalable AI-driven solutions| President , eCell MSIT
          </p>
          <p>
            Passionate about building user-centric products that solve real everyday problems. I love combining product thinking with engineering to design intelligent, agent-driven systems that automate workflows, improve user experiences, and create meaningful real-world impact.
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
            <span className="capstone-tag">Loan AI assistant</span>
          </div>
          <p className="capstone-desc">
            Saarthi is AI powered loan underwriting and Video onboarding platform. It 
            replaces paper-and-form loan applications with a 5-minute conversational experience: a live video KYC session, an XGBoost risk model with SHAP explainability, industry-standard responsible-lending guardrails (FOIR, total exposure cap, concurrent-loan limit), and a multi-agent layer that negotiates the offer and issues the sanction letter: all guided by a voice-driven AI assistant.
          </p>

          <div className="saarthi-video-wrap">
            {/* Placeholder image until the Saarthi demo video is added */}
            <img
              className="saarthi-video"
              src={saarthiMainImg}
              alt="Saarthi platform preview"
            />
          </div>

          <p className="tech">Python · LangChain · ML Risk Prediction · Multi-agent systems · Speech I/O · ReactJS </p>
          <div className="capstone-links">
            <a href="https://github.com/NANDINIS898/saarthi-main" target="_blank" rel="noreferrer">
              <FaGithub /> View Code
            </a>
          </div>
        </div>

        {/* --- PRYOPORT --- */}
        <div className="capstone pryoport">
          <div className="capstone-header">
            <h3>Pryoport</h3>
            <span className="capstone-tag">Smart Email Priority Engine</span>
          </div>
          <p className="capstone-desc">
            An AI-powered system that ensures users never miss important emails or tasks.
            Built to boost productivity, Pryoport delivers personalised notifications whenever
            an urgent or high-priority mail arrives — combining a dashboard, browser extension
            and intelligent alerting layer.
          </p>

          <div className="pryoport-video-wrap">
            <video
              className="pryoport-video"
              src={pryoportDemoVideo}
              controls
              playsInline
            >
              Your browser does not support the video tag.
            </video>
          </div>

          <div className="pryoport-grid">
            {puryoporShots.map((shot) => (
              <div className="pryoport-card" key={shot.title}>
                <img src={shot.src} alt={`Pryoport ${shot.title}`} />
                <div className="pryoport-overlay">
                  <h4>{shot.title}</h4>
                  <p>{shot.desc}</p>
                </div>
              </div>
            ))}
          </div>

          <p className="tech">Python · FastAPI · React · ML+ Agentic AI pipeline · Chrome Extension · Typescript </p>
          <div className="capstone-links">
            <a href="https://github.com/NANDINIS898/PRYOPORT" target="_blank" rel="noreferrer">
              <FaGithub /> View Code
            </a>
            <a href="https://pryoport-frontend.vercel.app/" target="_blank" rel="noreferrer">
              🚀 Live Demo
            </a>
          </div>
        </div>
      </section>

      {/* === TECH STACK === */}
      <section className="tech-stack" id="tech-stack">
        <h2>My Tech Stack</h2>
        <p className="tech-stack-sub">
          The toolkit I reach for when designing, building and shipping AI systems.
        </p>
        <div className="tech-stack-grid">
          {techStack.map((group) => (
            <div className="tech-group" key={group.title}>
              <h3>
                <span className="tech-icon" aria-hidden="true">{group.icon}</span>
                {group.title}
              </h3>
              <ul className="tech-chips">
                {group.items.map((item) => (
                  <li key={item} className="tech-chip">{item}</li>
                ))}
              </ul>
            </div>
          ))}
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
