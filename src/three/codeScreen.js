import * as THREE from "three";

/**
 * A monitor screen that types code forever: a script of lines (code, test
 * runs, a failure, the fix, a green run, a commit) typed out character by
 * character with light syntax colouring, then the next file starts.
 */

const SCRIPTS = [
  [
    "# saarthi/risk.py",
    "from fastapi import FastAPI",
    "import xgboost as xgb, shap",
    "",
    "app = FastAPI()",
    "",
    '@app.post("/score")',
    "async def score(a: Applicant):",
    "    X = features(a)",
    "    risk = model.predict_proba(X)[0][1]",
    "    why = shap.TreeExplainer(model)(X)",
    '    return {"risk": round(risk, 3), "why": top_k(why)}',
    "",
    ">>> pytest -q",
    "✗ FAILED test_score - KeyError: 'income'",
    "# hmm. missing field. on it.",
    '    income = a.get("income", 0)',
    ">>> pytest -q",
    "✓ 12 passed in 0.84s",
    '>>> git commit -m "fix: handle missing income"',
  ],
  [
    "// screen/agents.ts",
    "const ranker = createAgent({",
    '  model: "llm",',
    "  tools: [resumeMatch, githubScan],",
    "  output: RankSchema,",
    "});",
    "",
    "export async function rank(c: Candidate) {",
    "  const res = await ranker.run(c);",
    "  return RankSchema.parse(res);",
    "}",
    "",
    ">>> npm test",
    "✗ ZodError: score expected number, got string",
    "// the model said '9/10'. classic.",
    "  score: z.coerce.number().min(0).max(10),",
    ">>> npm test",
    "✓ all checks passed",
    ">>> git push origin main",
    "✓ deployed. ship it ✦",
  ],
];

const COLORS = {
  base: "#d7ecff",
  key: "#6fe3ff",
  str: "#ffb3d9",
  comment: "#5d7ea8",
  cmd: "#9fe6ff",
  bad: "#ff6b81",
  good: "#7dffb0",
};
const KEYWORDS = /\b(from|import|as|def|async|await|return|const|let|export|function|if|else|for|in|class|try|except)\b/;

function colourFor(line) {
  if (line.startsWith(">>>")) return COLORS.cmd;
  if (line.startsWith("✗")) return COLORS.bad;
  if (line.startsWith("✓")) return COLORS.good;
  if (line.trim().startsWith("#") || line.trim().startsWith("//")) return COLORS.comment;
  return null;
}

function tokens(line) {
  const out = [];
  const re = /("[^"]*"?|'[^']*'?|\b\w+\b|\s+|[^\w\s])/g;
  let m;
  while ((m = re.exec(line))) {
    const t = m[0];
    let c = COLORS.base;
    if (t[0] === '"' || t[0] === "'") c = COLORS.str;
    else if (KEYWORDS.test(t) && /^\w+$/.test(t)) c = COLORS.key;
    out.push([t, c]);
  }
  return out;
}

export function createCodeScreen() {
  const W = 1024;
  const H = 768;
  const canvas = document.createElement("canvas");
  canvas.width = W;
  canvas.height = H;
  const ctx = canvas.getContext("2d");
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;

  const LINE_H = 36;
  const TOP = 70;
  const MAX_LINES = Math.floor((H - TOP - 20) / LINE_H);

  let script = 0;
  let line = 0;
  let col = 0;
  let done = []; // finished lines
  let wait = 0;
  let acc = 0;
  let blink = 0;

  function paint() {
    ctx.fillStyle = "#030b1f";
    ctx.fillRect(0, 0, W, H);

    // title bar
    ctx.fillStyle = "#0a1f4d";
    ctx.fillRect(0, 0, W, 48);
    ["#ff6b81", "#ffc928", "#7dffb0"].forEach((c, i) => {
      ctx.fillStyle = c;
      ctx.beginPath();
      ctx.arc(28 + i * 30, 24, 9, 0, Math.PI * 2);
      ctx.fill();
    });
    ctx.fillStyle = "#9fe6ff";
    ctx.font = '28px "VT323", "Courier New", monospace';
    ctx.textBaseline = "middle";
    ctx.fillText(`nandini@dev: ~/${script === 0 ? "saarthi" : "screen"} — debugging`, 130, 25);

    ctx.font = '26px "JetBrains Mono", "Courier New", monospace';
    const visible = done.slice(-(MAX_LINES - 1));
    const typing = SCRIPTS[script][line] || "";
    const rows = [...visible, typing.slice(0, col)];
    const cw = ctx.measureText("M").width;

    rows.forEach((text, r) => {
      const y = TOP + r * LINE_H + LINE_H / 2;
      ctx.fillStyle = "#33507a";
      ctx.fillText(String(r + 1 + Math.max(0, done.length - (MAX_LINES - 1))).padStart(3, " "), 14, y);
      const whole = colourFor(text);
      let x = 90;
      if (whole) {
        ctx.fillStyle = whole;
        ctx.fillText(text, x, y);
        x += cw * text.length;
      } else {
        tokens(text).forEach(([t, c]) => {
          ctx.fillStyle = c;
          ctx.fillText(t, x, y);
          x += cw * t.length;
        });
      }
      if (r === rows.length - 1 && blink < 0.5) {
        ctx.fillStyle = "#6fe3ff";
        ctx.fillRect(x + 2, y - 14, cw, 28);
      }
    });

    // scanlines + glow edge
    ctx.fillStyle = "rgba(0,0,0,0.18)";
    for (let y = 0; y < H; y += 4) ctx.fillRect(0, y, W, 2);
    texture.needsUpdate = true;
  }

  /** Advance the typing by `dt` seconds. */
  function update(dt) {
    blink = (blink + dt * 1.6) % 1;
    acc += dt;
    if (acc < 0.03) return;
    const step = acc;
    acc = 0;

    if (wait > 0) {
      wait -= step;
      paint();
      return;
    }
    const lines = SCRIPTS[script];
    const current = lines[line];
    const instant = current.startsWith("✗") || current.startsWith("✓");
    col += instant ? current.length : Math.max(1, Math.round(step * 38));
    if (col >= current.length) {
      done.push(current);
      line += 1;
      col = 0;
      wait = instant ? 0.9 : current === "" ? 0.05 : 0.18;
      if (line >= lines.length) {
        wait = 2.2;
        script = (script + 1) % SCRIPTS.length;
        line = 0;
        done.push("", "");
      }
      if (done.length > 80) done = done.slice(-40);
    }
    paint();
  }

  paint();
  return { texture, update };
}
