import saarthiMainImg from "./saarthi-main.png";
import pryoportDemoVideo from "./pryoport video - Trim.mp4";
import myMovieMateImg from "./mymoviemate.png";
import eventEaseImg from "./eventease.png";
import budgetWiseImg from "./budgetwise.png";

/**
 * Every project on the site, in display order. The project lab renders
 * straight from this list, so adding a machine means adding an object here.
 *
 *   kind      "capstone" | "practice"
 *   tag       one-line subtitle (optional)
 *   tech      array of technologies (optional)
 *   features  capabilities, lifted from the description (optional)
 *   repo/demo links; a button is only shown for a link that exists
 *   media     { type: "image" | "video", src, alt } screenshot or demo (optional)
 *
 * Leave out anything a project does not have — the lab hides that part
 * rather than filling it in.
 */
export const projects = [
  {
    id: "saarthi",
    kind: "capstone",
    name: "Saarthi",
    tag: "Loan AI Assistant with Video-Based Onboarding",
    desc:
      "AI-powered loan underwriting and video onboarding platform with XGBoost risk scoring, SHAP explainability, multi-agent negotiation, and voice-based onboarding.",
    features: [
      "XGBoost risk scoring",
      "SHAP explainability",
      "Multi-agent negotiation",
      "Voice-based onboarding",
    ],
    tech: ["FastAPI", "React", "TypeScript", "PostgreSQL", "XGBoost", "SHAP", "OpenCV", "MediaPipe", "Qwen Vision"],
    repo: "https://github.com/NANDINIS898/saarthi-main",
    media: { type: "image", src: saarthiMainImg, alt: "Saarthi landing page" },
  },
  {
    id: "pryoport",
    kind: "capstone",
    name: "Pryoport",
    tag: "Smart Email Priority Detection Engine",
    desc:
      "AI-powered email prioritisation system combining dashboard, browser extension and alert engine. Makes sure all your important tasks & deadlines are never missed or buried under spam.",
    features: ["Dashboard", "Browser extension", "Alert engine"],
    repo: "https://github.com/NANDINIS898/pryoport",
    media: { type: "video", src: pryoportDemoVideo, alt: "Pryoport demo recording" },
  },
  {
    id: "screen",
    kind: "capstone",
    name: "Screen",
    tag: "AI Screening Platform",
    desc:
      "AI-driven candidate screening platform that scores and ranks applicants with resume matching, github analysis and role requirements to speed up early-stage hiring decisions.",
    tech: ["FastAPI", "React", "PostgreSQL", "Celery", "Redis", "Python", "Groq"],
    features: ["Resume matching", "GitHub analysis", "Role-requirement scoring and ranking"],
    repo: "https://github.com/NANDINIS898/ai-screening-platform",
    demo: "https://visl-ai-lab-assignment-screening-pl.vercel.app/",
  },
  {
    id: "my-movie-mate",
    kind: "practice",
    name: "My Movie Mate",
    desc: "Movie recommender with mood playlists and favorites.",
    tech: ["ReactJS", "Node.js", "MySQL"],
    features: ["Mood playlists", "Favorites"],
    repo: "https://github.com/NANDINIS898/my-movie-mate",
    media: { type: "image", src: myMovieMateImg, alt: "My Movie Mate home screen" },
  },
  {
    id: "insightcv",
    kind: "practice",
    name: "InsightCV",
    desc: "AI-powered resume reviewer with job-fit scoring.",
    tech: ["Python", "TensorFlow", "Streamlit"],
    repo: "https://github.com/NANDINIS898/InsightCV",
  },
  {
    id: "eventease-bot",
    kind: "practice",
    name: "EventEase Bot",
    desc: "GenAI event planner using LLM + RAG.",
    tech: ["LangChain", "ChromaDB"],
    repo: "https://github.com/NANDINIS898/event-ease-bot",
    media: { type: "image", src: eventEaseImg, alt: "EventEase Bot chat screen" },
  },
  {
    id: "voicebot",
    kind: "practice",
    name: "VoiceBot",
    desc: "Speech-to-text + LLM + TTS assistant.",
    tech: ["Whisper", "Python"],
    repo: "https://github.com/NANDINIS898/nandini-ai-voicebot-frontend",
  },
  {
    id: "budgetwise",
    kind: "practice",
    name: "BudgetWise",
    desc: "AI-powered budget tracker with analytics.",
    tech: ["Pandas", "NumPy"],
    repo: "https://github.com/NANDINIS898/budget-tracker-app",
    media: { type: "image", src: budgetWiseImg, alt: "BudgetWise report screen" },
  },
];

/**
 * The terminal lines a machine shows while "running" a project. Generated
 * from the project's own fields, so a screen never claims something the data
 * does not say.
 */
export function screenLines(p) {
  const lines = [`> initializing ${p.id}...`];
  if (p.tag) lines.push(`> ${p.tag.toUpperCase()}`);
  (p.tech || []).slice(0, 2).forEach((t) => lines.push(`> ${t.toLowerCase()}: LOADED`));
  if (p.features) lines.push(`> modules: ${p.features.length} ONLINE`);
  lines.push(p.demo ? "> deploy: LIVE" : "> repo: CONNECTED");
  return lines;
}
