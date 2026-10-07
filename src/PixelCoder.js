import React from "react";

/**
 * Original pixel-art character drawn from the portfolio photo: long dark
 * hair, over-ear headphones, pink-framed glasses, the green/orange knit vest.
 *
 * The sprite is a character grid so it can be edited by hand — each letter is
 * a palette key and "." is transparent. Pupils and eyelids are separate
 * layers so CSS can move/blink them (see .pc-pupils / .pc-lids in Hero.css).
 */
const PALETTE = {
  B: "#4a4c58", // headphone band
  R: "#ff2d2d", // headphone cups
  H: "#17141f", // hair
  h: "#3d3852", // hair highlight
  S: "#e8b38c", // skin
  s: "#cf9370", // skin shadow
  G: "#ff7fbd", // glasses frame
  W: "#ffffff",
  p: "#f59aa6", // blush
  m: "#b5475b", // mouth
  V: "#149c6a", // vest green
  O: "#f0562e", // vest orange
  T: "#0f7f8c", // vest hem
};

const SPRITE = [
  "..........BBBBBBBBBB..........",
  "........BBBBBBBBBBBBBB........",
  ".......BBHHHHHHHHHHHHBB.......",
  "......BBHHHHHHHHHHHHHHBB......",
  ".....BBHHHhhhHHHHHHHHHHBB.....",
  ".....BHHHhhHHHHHHHHHHHHHB.....",
  "....BBHHHhHHHHHHHHHHHHHHBB....",
  "...BBHHHHHSSSSSHSSSSSHHHHBB...",
  "..RRBHHHHSSSSSSSSSSSSSHHHBRR..",
  "..RRBHHHSSSSSSSSSSSSSSSHHBRR..",
  "..RRBHHHSGGGGGSSSGGGGGSHHBRR..",
  "..RRBHHHSGWWWGGGGGWWWGSHHBRR..",
  "..RRBHHHSGWWWGSSSGWWWGSHHBRR..",
  "..RRBHHHSGGGGGSSSGGGGGSHHBRR..",
  "..RRBHHHSSppSSSSSSSppSSHHBRR..",
  "...RBHHHSSSSSSmmmSSSSSSHHBR...",
  "....HHHHHSSSSSSSSSSSSSHHHH....",
  "....HHHHHHSSSSSSSSSSSHHHHH....",
  "....HHHHHHHHSSSSSSSHHHHHHH....",
  "....HHHHHHHHHsSSSsHHHHHHHH....",
  "...HHHHHWWWWWOSSSOWWWWWHHHHH..",
  "..HHHHHSWWVVVVOSOVVVVWWSHHHHH.",
  "..HHHHSSWOVOVOVOVOVOVOWSSHHHH.",
  "..HHHHSSWVOVWVOVWVOVWVWSSHHHH.",
  "..HHHSSSWOVOVOVOVOVOVOWSSSHHH.",
  "..HHHSSSWVWVOVWVOVWVOVWSSSHHH.",
  "...HHSSSWOVOVOVOVOVOVOWSSSHH..",
  "...HHSSSWTTTTTTTTTTTTTWSSSHH..",
];

const COLS = 30;
const ROWS = SPRITE.length;

// Collapse each row into horizontal runs so the SVG carries a few hundred
// rects instead of one per pixel.
const RUNS = SPRITE.flatMap((row, y) => {
  const runs = [];
  let x = 0;
  while (x < COLS) {
    const key = row[x];
    let end = x + 1;
    while (end < COLS && row[end] === key) end++;
    if (PALETTE[key]) runs.push({ x, y, w: end - x, fill: PALETTE[key] });
    x = end;
  }
  return runs;
});

export default function PixelCoder({ className = "" }) {
  return (
    <svg
      className={"pixel-coder " + className}
      viewBox={`0 0 ${COLS} ${ROWS}`}
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
    >
      {RUNS.map((r) => (
        <rect key={`${r.x}-${r.y}`} x={r.x} y={r.y} width={r.w} height={1} fill={r.fill} />
      ))}
      <g className="pc-pupils" fill="#17141f">
        <rect x="11" y="11.5" width="1" height="1" />
        <rect x="19" y="11.5" width="1" height="1" />
      </g>
      <g className="pc-lids" fill={PALETTE.S}>
        <rect x="10" y="11" width="3" height="2" />
        <rect x="18" y="11" width="3" height="2" />
      </g>
    </svg>
  );
}
