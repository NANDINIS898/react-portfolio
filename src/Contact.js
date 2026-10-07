import React from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import "./Contact.css";

const EMAIL = "nandinis898@gmail.com";

// The places to reach me, as they were on the old contact row.
const LINKS = [
  { label: "GitHub", href: "https://github.com/NANDINIS898", Icon: FaGithub },
  { label: "LeetCode", href: "https://leetcode.com/u/nandiiinigangwar/", Icon: SiLeetcode },
  { label: "LinkedIn", href: "https://www.linkedin.com/in/nandini-gangwar-b47987213/", Icon: FaLinkedin },
];

/**
 * The last screen: an email window already addressed, and a terminal that
 * has "dialled" every other place to find me. Both are plain links — there
 * is no form here to pretend to send anything.
 */
export default function Contact() {
  return (
    <section className="contact" id="contact">
      <p className="contact-kicker">
        <span className="status-dot"></span> connection established <span>{"//"}</span> end of line
      </p>

      <h2 className="contact-title">
        Let’s build <span className="accent">something.</span>
      </h2>

      <div className="contact-grid">
        <div className="win contact-mail">
          <div className="win-bar">
            <span>new_message.eml</span>
            <span className="win-ctrl" aria-hidden="true">
              <i></i>
              <i></i>
              <i></i>
            </span>
          </div>

          <dl className="mail-fields">
            <div>
              <dt>to</dt>
              <dd>
                <a href={`mailto:${EMAIL}`}>{EMAIL}</a>
              </dd>
            </div>
            <div>
              <dt>from</dt>
              <dd className="mail-you">
                you<span className="caret" aria-hidden="true"></span>
              </dd>
            </div>
          </dl>

          <p className="mail-body">Open to internships and roles in SDE, AI/ML and GenAI.</p>

          <div className="mail-actions">
            <a href={`mailto:${EMAIL}`} className="btn98 btn98-primary mail-send">
              <FaEnvelope /> Email
            </a>
            <span className="mail-hint" aria-hidden="true">
              opens your mail app
            </span>
          </div>
        </div>

        <div className="contact-dial">
          <div className="dial-bar">
            <span>dial-up.exe</span>
            <span className="dial-online">
              <span className="status-dot"></span> online
            </span>
          </div>
          <ul className="dial-list">
            {LINKS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a href={href} target="_blank" rel="noreferrer">
                  <Icon aria-hidden="true" />
                  <span className="dial-name">{label}</span>
                  <span className="dial-dots" aria-hidden="true"></span>
                  <span className="dial-go" aria-hidden="true">
                    open ↗
                  </span>
                </a>
              </li>
            ))}
          </ul>
          <p className="dial-foot" aria-hidden="true">
            &gt; {LINKS.length + 1} lines open<span className="dial-cursor">_</span>
          </p>
        </div>
      </div>
    </section>
  );
}
