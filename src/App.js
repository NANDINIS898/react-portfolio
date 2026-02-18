import React from "react";
import "./App.css";
import profileImage from "./nandini.jpeg";
import insightcvimg from "./Insightcv.png";
import eventeaseImg from "./eventease.png";
import moviematevid from "./mymoviemate.png";
import budgetwiseImg from "./budgetwise.png";
import tensorflowCert from "./deeplearning.png";
import genaiCert from "./genai_simulation.png";
import { ReactTyped } from "react-typed";

import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";

function App() {
  return (
    <div className="app">
      <nav className="navbar">
        <div className="nav-left">Nandini</div>
        <ul className="nav-links">
          <li><a href="#about">About</a></li>
          <li><a href="#projects">Projects</a></li>
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

      <section className="projects" id="projects">
        <h2>Projects</h2>
        <div className="project-grid">
          <div className="project-card">
            <img src={insightcvimg} controls muted loop className="project-img" alt="insightcv" />
            <h3>InsightCV</h3>
            <p>AI-powered resume reviewer with job-fit score predictions using GenAI.</p>
            <p className="tech">Python · TensorFlow · Hugging Face · Streamlit</p>
            <a href="https://github.com/NANDINIS898/InsightCV" target="_blank" rel="noreferrer">View Code</a> 
            <a href="https://www.linkedin.com/posts/nandini-gangwar-b47987213_machinelearning-genai-insightcv-activity-7355537261058310146-pP1A?utm_source=share&utm_medium=member_desktop&rcm=ACoAADYSWacBUqYf62UH3PN7Oc3oda9TGYrJtNw" target= "_blank" rel="noreferrer">Demo link</a>
          </div>

          <div className="project-card">
            <img src={eventeaseImg} alt="EventEase Chatbot"/>
            <h3>EventEase Chatbot</h3>
            <p>GenAI-based event planner using LLMs and RAG for college societies.</p>
            <p className="tech">Python · LangChain · Streamlit · ChromaDB</p>
            <a href="https://github.com/NANDINIS898/event-ease-bot" target="_blank" rel="noreferrer">View Code</a>
          </div>

          <div className="project-card">
            <img src={moviematevid} controls muted loop className="project-img" alt="Mymoviemate" />
            <h3>My Movie Mate</h3>
            <p>Movie recommender web app with mood playlists and favorites.</p>
            <p className="tech">ReactJS · Node.js · MySQL · TMDB API</p>
            <a href="https://github.com/NANDINIS898/my-movie-mate" target="_blank" rel="noreferrer">View Code</a>
             < a href="https://www.linkedin.com/posts/nandini-gangwar-b47987213_webdevelopment-reactjs-nodejs-activity-7284996649146347520-ib5X?utm_source=share&utm_medium=member_desktop&rcm=ACoAADYSWacBUqYf62UH3PN7Oc3oda9TGYrJtNw" target= "_blank" rel="noreferrer">Demo link</a>
          </div>

          <div className="project-card">
            <img src={budgetwiseImg} alt="BudgetWise" />
            <h3>BudgetWise</h3>
            <p>AI-powered Budget Tracker with category spend analysis and alerts.</p>
            <p className="tech">Pandas, Numpy, Matplotlib, tkinter</p>
            <a href="https://github.com/NANDINIS898/budget-tracker-app" target="_blank" rel="noreferrer">View Code</a>
          </div>
        </div>
      </section>

      <section className="placeholder-section" id="achievements">
        <h2>Achievements - 3x Hackthon Winner</h2>
        <p>🏆 3rd @ IIT Delhi TRYST’25</p>
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
