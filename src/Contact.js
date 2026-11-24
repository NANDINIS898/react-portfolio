import React from "react";
import { FaGithub, FaLinkedin, FaEnvelope } from "react-icons/fa";
import { SiLeetcode } from "react-icons/si";
import "./Contact.css";

const EMAIL = "nandinis898@gmail.com";

const LINKS = [
  { label: "Email", value: EMAIL, href: `mailto:${EMAIL}`, Icon: FaEnvelope },
  { label: "GitHub", value: "NANDINIS898", href: "https://github.com/NANDINIS898", Icon: FaGithub },
  { label: "LeetCode", value: "nandiiinigangwar", href: "https://leetcode.com/u/nandiiinigangwar/", Icon: SiLeetcode },
  { label: "LinkedIn", value: "nandini-gangwar", href: "https://www.linkedin.com/in/nandini-gangwar-b47987213/", Icon: FaLinkedin },
];

/** The closing page: one line of intent, then every way to reach her. */
export default function Contact() {
  return (
    <section className="contact" id="contact">
      <div className="contact-head">
        <span className="section-num">02</span>
        <span className="contact-kicker">Contact</span>
        <span className="section-line"></span>
      </div>

      <h2 className="contact-title">
        Let’s build <em>something.</em>
      </h2>
      <p className="contact-lede">Open to internships and roles in SDE, AI/ML and GenAI.</p>

      <ul className="contact-list">
        {LINKS.map(({ label, value, href, Icon }) => (
          <li key={label}>
            <a href={href} {...(href.startsWith("mailto:") ? {} : { target: "_blank", rel: "noreferrer" })}>
              <span className="contact-label">
                <Icon aria-hidden="true" /> {label}
              </span>
              <span className="contact-value">{value}</span>
              <span className="contact-arrow" aria-hidden="true">
                ↗
              </span>
            </a>
          </li>
        ))}
      </ul>
    </section>
  );
}
