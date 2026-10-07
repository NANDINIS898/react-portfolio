import React, { useCallback, useRef, useState } from "react";
import { skillGroups } from "./skillData";
import { typeBurst } from "./sound";
import "./Skills.css";

const group = (id) => skillGroups.find((g) => g.id === id);
const IDLE = "hover a skill to ping it";

/**
 * One skill. Hovering, focusing or tapping it reports to the status line;
 * `children` lets each object dress the name its own way.
 */
function Skill({ name, groupId, active, onPing, className = "", children }) {
  const ping = () => onPing(groupId, name);
  return (
    <li
      className={"sk-item " + className + (active === name ? " is-active" : "")}
      tabIndex={0}
      onMouseEnter={ping}
      onFocus={ping}
    >
      {children || name}
    </li>
  );
}

/** Languages — a torn-out notebook page. */
function LanguageSheet({ active, onPing }) {
  const g = group("languages");
  return (
    <section className="sk-obj sk-sheet" aria-labelledby="sk-languages">
      <span className="sk-tape" aria-hidden="true"></span>
      <h3 className="sk-sheet-title" id="sk-languages">
        {g.label}
      </h3>
      <ul className="sk-sheet-list">
        {g.items.map((name) => (
          <Skill key={name} name={name} groupId={g.id} active={active} onPing={onPing} />
        ))}
      </ul>
      <span className="sk-sheet-note" aria-hidden="true">
        pg. 03
      </span>
    </section>
  );
}

/** AI / ML — a terminal that has just finished loading everything. */
function AiTerminal({ active, onPing }) {
  const g = group("ai");
  return (
    <section className="sk-obj sk-term" aria-labelledby="sk-ai">
      <header className="sk-term-bar">
        <h3 id="sk-ai">{g.label}</h3>
        <span aria-hidden="true">ai_ml.sh</span>
      </header>
      <div className="sk-term-body">
        <p className="sk-term-cmd" aria-hidden="true">
          $ ./load --all
        </p>
        <ul className="sk-term-list">
          {g.items.map((name) => (
            <Skill key={name} name={name} groupId={g.id} active={active} onPing={onPing}>
              <span className="sk-term-name">{name}</span>
              <span className="sk-term-dots" aria-hidden="true"></span>
              <span className="sk-term-ok" aria-hidden="true">
                ok
              </span>
            </Skill>
          ))}
        </ul>
        <p className="sk-term-cmd" aria-hidden="true">
          $ <span className="caret"></span>
        </p>
      </div>
    </section>
  );
}

/** Web & Backend — the menu on an old candybar phone. */
function BackendPhone({ active, onPing }) {
  const g = group("backend");
  return (
    <section className="sk-obj sk-phone" aria-labelledby="sk-backend">
      <span className="sk-phone-speaker" aria-hidden="true"></span>
      <div className="sk-phone-screen">
        <div className="sk-phone-top" aria-hidden="true">
          <span className="sk-phone-signal">
            <i></i>
            <i></i>
            <i></i>
            <i></i>
          </span>
          <span>menu</span>
          <span className="sk-phone-batt"></span>
        </div>
        <h3 className="sk-phone-title" id="sk-backend">
          {g.label}
        </h3>
        <ul className="sk-phone-list">
          {g.items.map((name) => (
            <Skill key={name} name={name} groupId={g.id} active={active} onPing={onPing} />
          ))}
        </ul>
        <div className="sk-phone-soft" aria-hidden="true">
          <span>select</span>
          <span>back</span>
        </div>
      </div>
      <div className="sk-phone-keys" aria-hidden="true">
        {Array.from({ length: 12 }, (_, i) => (
          <i key={i}></i>
        ))}
      </div>
    </section>
  );
}

/** Databases — one floppy disk each. */
function DatabaseDisks({ active, onPing }) {
  const g = group("databases");
  return (
    <section className="sk-obj sk-disks" aria-labelledby="sk-databases">
      <h3 className="sk-caption" id="sk-databases">
        <span aria-hidden="true">A:\</span> {g.label}
      </h3>
      <ul className="sk-disk-list">
        {g.items.map((name) => (
          <Skill key={name} name={name} groupId={g.id} active={active} onPing={onPing} className="sk-disk">
            <span className="sk-disk-shutter" aria-hidden="true"></span>
            <span className="sk-disk-label">{name}</span>
          </Skill>
        ))}
      </ul>
    </section>
  );
}

/** DevOps & Tools — sticky notes on the desk. */
function ToolNotes({ active, onPing }) {
  const g = group("devops");
  return (
    <section className="sk-obj sk-notes" aria-labelledby="sk-devops">
      <h3 className="sk-caption" id="sk-devops">
        <span aria-hidden="true">{"//"}</span> {g.label}
      </h3>
      <ul className="sk-note-list">
        {g.items.map((name) => (
          <Skill key={name} name={name} groupId={g.id} active={active} onPing={onPing} className="sk-note" />
        ))}
      </ul>
    </section>
  );
}

/**
 * The skills desk: each group is its own object, and one shared status line
 * reports on whichever skill is being pointed at.
 */
export default function Skills() {
  const [ping, setPing] = useState(null);

  // The ref (not state) decides whether this is a new skill, so the sound is
  // triggered from the event handler rather than from inside a state update.
  const lastName = useRef(null);
  const onPing = useCallback((groupId, name) => {
    if (lastName.current === name) return;
    lastName.current = name;
    typeBurst(280);
    setPing({ name, text: group(groupId).status(name) });
  }, []);

  const active = ping ? ping.name : null;
  const text = ping ? ping.text : IDLE;

  return (
    <div className="sk">
      <div className="sk-status" role="status">
        <span className="sk-status-led" aria-hidden="true"></span>
        <span className="sk-status-label" aria-hidden="true">
          skills.sys
        </span>
        {/* keyed so each new message types itself out */}
        <span className={"sk-status-text" + (ping ? " is-live" : "")} key={text} style={{ "--n": text.length }}>
          &gt; {text}
        </span>
      </div>

      <div className="sk-grid">
        <LanguageSheet active={active} onPing={onPing} />
        <AiTerminal active={active} onPing={onPing} />
        <BackendPhone active={active} onPing={onPing} />
        <DatabaseDisks active={active} onPing={onPing} />
        <ToolNotes active={active} onPing={onPing} />
      </div>
    </div>
  );
}
