import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { FaGithub, FaExternalLinkAlt } from "react-icons/fa";
import { projects, screenLines } from "./projects";
import { prefersReducedMotion, useInView } from "./useY2K";
import "./ProjectLab.css";

const FILTERS = [
  { id: "all", label: "all" },
  { id: "capstone", label: "capstones" },
  { id: "practice", label: "practice" },
];

const KIND_LABEL = { capstone: "capstone", practice: "practice build" };
const SHELLS = ["beige", "ink", "cream", "taupe"];
const pad = (n) => String(n).padStart(2, "0");

/** What a machine's CRT shows in the grid: title plus its running log. */
function ProjectScreen({ project }) {
  return (
    <span className="pc-screen">
      <span className="pc-title">{project.name}</span>
      <span className="pc-lines">
        {screenLines(project).map((line, i) => (
          <span key={i} style={{ "--l": i }}>
            {line}
          </span>
        ))}
      </span>
      <span className="pc-open">[ click to boot ]</span>
    </span>
  );
}

function ProjectComputer({ project, index, active, onOpen }) {
  return (
    <li className="lab-cell" style={{ "--i": index }}>
      <button
        type="button"
        className={`pc pc-${SHELLS[index % SHELLS.length]}` + (active ? " is-active" : "")}
        data-pc={project.id}
        aria-haspopup="dialog"
        aria-label={`Open ${project.name}`}
        onClick={() => onOpen(index)}
      >
        <span className="pc-monitor">
          <ProjectScreen project={project} />
          <span className="pc-chin">
            <span>PC-{pad(index + 1)}</span>
            <span className="pc-led"></span>
          </span>
        </span>
        <span className="pc-neck"></span>
        <span className="pc-base"></span>
        <span className="pc-kbd"></span>
        {project.kind === "capstone" && <span className="pc-sticker">capstone</span>}
      </button>
      <span className="pc-desk" aria-hidden="true"></span>
      <span className="pc-plate" aria-hidden="true">
        {project.name}
        <em>{KIND_LABEL[project.kind]}</em>
      </span>
    </li>
  );
}

/** First page of an opened project: what it is and where to find it. */
function ProjectDetails({ project, onViewDetails }) {
  return (
    <div className="xp-page">
      <p className="xp-kicker">
        <span className="status-dot"></span>
        {KIND_LABEL[project.kind]} <span>{"//"}</span> status: running
      </p>
      <h3 className="xp-title" id="xp-title">
        {project.name}
      </h3>
      {project.tag && <p className="xp-tag">{project.tag}</p>}
      <p className="xp-desc">{project.desc}</p>

      {project.tech && (
        <>
          <h4 className="xp-label">tech stack</h4>
          <ul className="xp-pills">
            {project.tech.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </>
      )}

      {project.features && (
        <>
          <h4 className="xp-label">features</h4>
          <ul className="xp-features">
            {project.features.map((f) => (
              <li key={f}>{f}</li>
            ))}
          </ul>
        </>
      )}

      <div className="xp-actions">
        {project.demo && (
          <a href={project.demo} className="btn98 btn98-primary" target="_blank" rel="noreferrer">
            <FaExternalLinkAlt /> live demo
          </a>
        )}
        {project.repo && (
          <a href={project.repo} className="btn98" target="_blank" rel="noreferrer">
            <FaGithub /> github
          </a>
        )}
        <button type="button" className="btn98" onClick={onViewDetails}>
          view details <span aria-hidden="true">▶</span>
        </button>
      </div>
    </div>
  );
}

/** Second page: the project "running" — its screenshot/demo, or its log. */
function ProjectPreview({ project, onBack }) {
  const media = project.media;
  return (
    <div className="xp-page">
      <div className="xp-preview-head">
        <button type="button" className="btn98" onClick={onBack}>
          <span aria-hidden="true">◀</span> back
        </button>
        <h3 className="xp-title xp-title-sm" id="xp-title">
          {project.name}
        </h3>
      </div>

      {media && media.type === "image" && (
        <figure className="xp-media">
          <img src={media.src} alt={media.alt} />
        </figure>
      )}
      {media && media.type === "video" && (
        <figure className="xp-media">
          <video src={media.src} controls playsInline aria-label={media.alt} />
        </figure>
      )}
      {!media && (
        <div className="xp-log" aria-label="Project log">
          {screenLines(project).map((line, i) => (
            <span key={i}>{line}</span>
          ))}
          <span className="xp-log-last">&gt; no screenshot on this machine yet</span>
        </div>
      )}

      <dl className="xp-info">
        <div>
          <dt>type</dt>
          <dd>{KIND_LABEL[project.kind]}</dd>
        </div>
        {project.repo && (
          <div>
            <dt>source</dt>
            <dd>
              <a href={project.repo} target="_blank" rel="noreferrer">
                {project.repo.replace("https://", "")}
              </a>
            </dd>
          </div>
        )}
        {project.demo && (
          <div>
            <dt>live</dt>
            <dd>
              <a href={project.demo} target="_blank" rel="noreferrer">
                {project.demo.replace("https://", "").replace(/\/$/, "")}
              </a>
            </dd>
          </div>
        )}
      </dl>
    </div>
  );
}

const rectOfMachine = (id) => {
  const el = document.querySelector(`[data-pc="${id}"] .pc-monitor`);
  return el ? el.getBoundingClientRect() : null;
};

/**
 * The opened machine. It grows out of the grid computer that was clicked and
 * shrinks back into whichever one is showing when it closes (FLIP: measure
 * both rects, animate only the transform between them).
 */
function ExpandedProject({ project, index, total, onClose, onNav }) {
  const boxRef = useRef(null);
  const closeRef = useRef(null);
  const closingRef = useRef(false);
  const [view, setView] = useState("overview");
  const [closing, setClosing] = useState(false);

  const flip = useCallback((id) => {
    const box = boxRef.current;
    const from = rectOfMachine(id);
    if (!box || !from || !box.animate || prefersReducedMotion()) return null;
    const to = box.getBoundingClientRect();
    return `translate(${from.left - to.left}px, ${from.top - to.top}px) scale(${from.width / to.width}, ${
      from.height / to.height
    })`;
  }, []);

  // Grow in once, from the machine that was clicked.
  useLayoutEffect(() => {
    const start = flip(project.id);
    if (start) {
      boxRef.current.animate(
        [
          { transform: start, opacity: 0.5 },
          { transform: "none", opacity: 1 },
        ],
        { duration: 440, easing: "cubic-bezier(0.2, 0.8, 0.2, 1)" }
      );
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestClose = useCallback(() => {
    if (closingRef.current) return;
    closingRef.current = true;
    setClosing(true);
    const end = flip(project.id);
    if (!end) {
      onClose();
      return;
    }
    const anim = boxRef.current.animate(
      [
        { transform: "none", opacity: 1 },
        { transform: end, opacity: 0.3 },
      ],
      { duration: 300, easing: "cubic-bezier(0.6, 0, 0.8, 0.4)", fill: "forwards" }
    );
    anim.onfinish = onClose;
    anim.oncancel = onClose;
    // Browsers pause animations in a hidden tab; never leave the dialog stuck.
    setTimeout(onClose, 380);
  }, [flip, onClose, project.id]);

  // A new project always opens on its first page.
  useEffect(() => setView("overview"), [project.id]);

  // Modal behaviour: lock page scroll, take focus, and hand it back to the
  // machine that is showing when the dialog goes away.
  const projectIdRef = useRef(project.id);
  projectIdRef.current = project.id;
  useEffect(() => {
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    closeRef.current && closeRef.current.focus();
    return () => {
      document.body.style.overflow = prevOverflow;
      const opener = document.querySelector(`[data-pc="${projectIdRef.current}"]`);
      opener && opener.focus({ preventScroll: true });
    };
  }, []);

  useEffect(() => {
    function onKey(e) {
      if (e.key === "Escape") {
        e.preventDefault();
        requestClose();
      } else if (e.key === "ArrowRight" && e.target.tagName !== "VIDEO") {
        onNav(1);
      } else if (e.key === "ArrowLeft" && e.target.tagName !== "VIDEO") {
        onNav(-1);
      } else if (e.key === "Tab" && boxRef.current) {
        // keep Tab inside the dialog
        const items = boxRef.current.querySelectorAll("a[href], button:not([disabled]), video[controls]");
        if (!items.length) return;
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    }
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [requestClose, onNav]);

  return createPortal(
    <div
      className={"xp-backdrop beige" + (closing ? " is-closing" : "")}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) requestClose();
      }}
    >
      <div className="xp" role="dialog" aria-modal="true" aria-labelledby="xp-title" ref={boxRef}>
        <div className="xp-bar">
          <span className="xp-bar-name">{project.id}.exe</span>
          <span className="xp-count" aria-label={`Project ${index + 1} of ${total}`}>
            {pad(index + 1)} / {pad(total)}
          </span>
          <button type="button" className="xp-close" onClick={requestClose} aria-label="Close project" ref={closeRef}>
            ✕
          </button>
        </div>

        {/* keyed so the boot sequence replays for each project */}
        <div className="xp-screen" key={project.id}>
          <div className="xp-boot" aria-hidden="true">
            <span style={{ "--l": 0 }}>&gt; boot {project.id}.exe</span>
            <span style={{ "--l": 1 }}>&gt; loading modules ......... ok</span>
            <span style={{ "--l": 2 }}>&gt; mounting display</span>
          </div>
          <div className="xp-scroll">
            {view === "overview" ? (
              <ProjectDetails project={project} onViewDetails={() => setView("preview")} />
            ) : (
              <ProjectPreview project={project} onBack={() => setView("overview")} />
            )}
          </div>
        </div>

        <div className="xp-chin">
          <button type="button" className="xp-nav" onClick={() => onNav(-1)} aria-label="Previous project">
            ◀
          </button>
          <span className="xp-hint">
            <span className="pc-led"></span> esc to close <i>·</i> ← → to switch
          </span>
          <button type="button" className="xp-nav" onClick={() => onNav(1)} aria-label="Next project">
            ▶
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** The computer lab: one machine per project, filterable, click to open. */
export default function ProjectLab() {
  const [filter, setFilter] = useState("all");
  const [openIndex, setOpenIndex] = useState(null);
  const [gridRef, inView] = useInView({ threshold: 0.12 });

  const list = filter === "all" ? projects : projects.filter((p) => p.kind === filter);
  const total = list.length;

  const close = useCallback(() => setOpenIndex(null), []);
  const nav = useCallback(
    (step) => setOpenIndex((i) => (i === null ? i : (i + step + total) % total)),
    [total]
  );

  return (
    <div className={"lab" + (openIndex !== null ? " is-open" : "")}>
      <div className="lab-bar">
        <p className="lab-intro">
          <span className="status-dot"></span>
          {pad(projects.length)} machines, {pad(projects.length)} builds — click one to boot it up.
        </p>
        <div className="lab-filters" role="group" aria-label="Filter projects">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f.id}
              className="lab-filter"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <ul className={"lab-grid" + (inView ? " is-on" : "")} ref={gridRef}>
        {list.map((p, i) => (
          <ProjectComputer key={p.id} project={p} index={i} active={openIndex === i} onOpen={setOpenIndex} />
        ))}
      </ul>

      {openIndex !== null && (
        <ExpandedProject project={list[openIndex]} index={openIndex} total={total} onClose={close} onNav={nav} />
      )}
    </div>
  );
}
