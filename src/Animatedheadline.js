import React from "react";

/**
 * AnimatedHeadline — splits text into words and staggers a fade+rise
 * animation across them on mount. Accepts a small markup language so we
 * can keep the <em> accent styling on specific words/phrases:
 *
 *   <AnimatedHeadline
 *     parts={[
 *       { text: "I build systems that " },
 *       { text: "think,", em: true },
 *       { text: " ", break: true },
 *       { text: "then I make sure they're " },
 *       { text: "correct and scalable.", em: true },
 *     ]}
 *   />
 *
 * Each `part` can span multiple words — they'll each animate individually.
 * `break: true` forces a line break after that part (use on its own with
 * empty text, or attach to the last word before the break).
 */
export default function AnimatedHeadline({ parts, className = "hero-title", baseDelay = 0, stagger = 70 }) {
  // flatten parts into individual word tokens, tracking em/break state
  const tokens = [];
  parts.forEach((part) => {
    const words = part.text.split(" ").filter((w) => w.length > 0);
    words.forEach((w, i) => {
      tokens.push({
        word: w,
        em: !!part.em,
        // line break goes after the LAST word of a part marked break:true
        lineBreakAfter: !!part.break && i === words.length - 1,
      });
    });
  });

  let wordIndex = 0;

  return (
    <h1 className={className + " animated-headline"}>
      {tokens.map((t, i) => {
        const delay = baseDelay + wordIndex * stagger;
        wordIndex++;
        const span = (
          <span
            className={"word-reveal" + (t.em ? " word-em" : "")}
            style={{ animationDelay: `${delay}ms` }}
            key={i}
          >
            {t.word}
          </span>
        );
        return (
          <React.Fragment key={i}>
            {span}
            {" "}
            {t.lineBreakAfter && <br />}
          </React.Fragment>
        );
      })}
    </h1>
  );
}