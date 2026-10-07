/**
 * Skills, grouped the way the CV groups them (Languages / AI-ML / Backend /
 * Databases-DevOps), plus the two the old site listed that the CV's skills
 * table does not: React and RAG Systems.
 *
 * `status` is what the status line prints when a skill in that group is
 * hovered or focused.
 */
export const skillGroups = [
  {
    id: "languages",
    label: "Languages",
    items: ["Python", "C", "C++", "JavaScript", "TypeScript", "SQL"],
    status: (name) => `${name.toUpperCase()}.EXE — READY`,
  },
  {
    id: "ai",
    label: "AI / ML",
    items: [
      "scikit-learn",
      "XGBoost",
      "PyTorch",
      "TensorFlow",
      "LangChain",
      "CrewAI",
      "RAG Systems",
      "OpenCV",
      "PaddleOCR",
    ],
    status: (name) => `${name} — MODEL TOOLING: LOADED`,
  },
  {
    id: "backend",
    label: "Web & Backend",
    items: ["FastAPI", "Node.js", "Express.js", "REST APIs", "Celery", "Redis", "React"],
    status: (name) => `${name} — SERVICE: RUNNING`,
  },
  {
    id: "databases",
    label: "Databases",
    items: ["PostgreSQL", "MySQL", "SQLite", "ChromaDB"],
    status: (name) => `${name} — DATABASE: CONNECTED`,
  },
  {
    id: "devops",
    label: "DevOps & Tools",
    items: ["Git", "GitHub Actions", "Docker", "Alembic"],
    status: (name) => `${name} — PIPELINE: OK`,
  },
];
