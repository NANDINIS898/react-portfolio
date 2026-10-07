/**
 * Experience, oldest first, taken from the CV (Nandini_gangwar_latest_cv.pdf). The Experience section (and its nav link)
 * only appears once this list has at least one entry.
 *
 * Each entry:
 *   {
 *     company: "Company name",
 *     role: "Job title",
 *     dates: "Jun 2025 – Aug 2025",
 *     location: "City / Remote",          // optional
 *     description: "One or two sentences on what you did.",
 *     tech: ["FastAPI", "React"],         // optional
 *     achievements: ["Shipped …"],        // optional
 *     link: "https://…",                  // optional
 *     current: true,                      // optional — marks the role you hold now
 *   }
 *
 * Only `company`, `role` and `dates` are required; anything left out is
 * simply not shown.
 */
export const experience = [
  {
    company: "Entrepreneurship Cell, MSIT",
    role: "President",
    dates: "Jul 2025 – Jul 2026",
    achievements: [
      "Led and mentored 120+ students.",
      "Organized a university-wide E-Summit with 700+ attendees.",
      "Coordinated 5+ startup pitch events and contributed to launching 3 student-led startups.",
    ],
  },
  {
    company: "BDO India",
    role: "Products & Solutions Intern – Technology Team",
    dates: "Jul 20, 2026 – Sep 20, 2026",
    achievements: [
      "Developed a Document Intelligence pipeline for extracting structured information from scanned PDFs, tax documents, and invoices.",
      "Built preprocessing and OCR workflows using Python, OpenCV, PyMuPDF, PaddleOCR, and EasyOCR, including deskewing, denoising, table detection, and layout analysis.",
      "Developed a Graph Neural Network (GNN) to model hierarchical relationships between document headers and created ground-truth annotations for 18 invoices.",
    ],
    tech: ["Python", "OpenCV", "PyMuPDF", "PaddleOCR", "EasyOCR", "GNN"],
  },
  {
    company: "VISL.AI",
    role: "AI Engineer Intern",
    dates: "Sep 21, 2026 – Present",
    current: true,
    achievements: [
      "Building agentic AI workflows with LLMs, tool calling, context engineering, and structured outputs for production applications.",
      "Developing AI backend services and API integrations, implementing validation, evaluation, observability, and reliable error-handling across model-driven workflows.",
    ],
  },
];
