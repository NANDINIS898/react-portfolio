"""Her photo cut-outs in the poster filters (half body: the photo ends at the
waist and so does she).

  stage/nandini-half.webp     blue newsprint B&W, for the stage reverse shot
  stage/nandini-half-shadow.webp
  photos/cut-hrx.webp         cream-and-ink B&W, sticker rim   (Hritik poster)
  photos/cut-blue.webp        halftone duotone, ink on electric blue (Dev D, in blue)
  photos/cut-pop.webp         posterised purple / cyan / cream (Masaan)
  photos/cut-lime.webp        stippled lime on ink (Rockstar)
  photos/strip-*.webp         thermal-gradient bands to float in front (Hritik)
  photos/grunge.webp          dark distressed canvas for the poster boards
  photos/cutouts.json         aspect + strip rectangles (0..1, from top-left)

usage: make_cutouts.py clean.png mask.png public_dir
"""
import json
import os
import sys

import cv2
import numpy as np
from PIL import Image

src, mask_src, pub = sys.argv[1], sys.argv[2], sys.argv[3]
stage_dir = os.path.join(pub, "stage")
photo_dir = os.path.join(pub, "photos")
os.makedirs(stage_dir, exist_ok=True)
os.makedirs(photo_dir, exist_ok=True)

img = cv2.imread(src)
m = cv2.imread(mask_src, cv2.IMREAD_GRAYSCALE)

X0, X1 = 340, 690
crop = img[:, X0:X1]
mc = m[:, X0:X1].astype(np.float32) / 255.0
h, w = mc.shape
TOP = 30
H = TOP + h
S = 1.6

gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=2.4, tileGridSize=(6, 6))
g = clahe.apply(gray).astype(np.float32) / 255.0
sel = mc > 0.5
lo, hi = np.percentile(g[sel], [3, 99.6])
g = np.clip((g - lo) / (hi - lo), 0, 1)

canvas = np.zeros((H, w), np.float32)
alpha = np.zeros((H, w), np.float32)
canvas[TOP:] = g
alpha[TOP:] = mc

# the photo crops the top of her head: round the crown off in hair
r0 = np.where(mc[20] > 0.5)[0]
cx, half = (r0.min() + r0.max()) / 2, (r0.max() - r0.min()) / 2
cap = np.zeros((H, w), np.uint8)
cv2.ellipse(cap, (int(cx), TOP + 20), (int(half), TOP + 12), 0, 180, 360, 255, -1)
cap = cv2.GaussianBlur(cap, (0, 0), 1.2).astype(np.float32) / 255.0
tone = float(np.percentile(g[0:60][mc[0:60] > 0.5], 12))
streak = cv2.GaussianBlur(np.random.default_rng(9).normal(0, 1, (1, w)).astype(np.float32), (0, 0), 1.2)
hair = np.clip(tone + streak * 0.08, 0, 1) * np.linspace(0.9, 1.0, TOP)[:, None]
canvas[:TOP] = np.where(cap[:TOP] > alpha[:TOP], hair, canvas[:TOP])
side = (cap[TOP:TOP + 20] > 0.5) & (mc[0:20] < 0.5)
canvas[TOP:TOP + 20][side] = tone
alpha = np.maximum(alpha, cap)

# colour crop kept alongside for the thermal bands
colour = np.zeros((H, w, 3), np.uint8)
colour[TOP:] = crop
colour[:TOP] = crop[0:1]

size = (int(w * S), int(H * S))
canvas = cv2.resize(canvas, size, interpolation=cv2.INTER_CUBIC)
colour = cv2.resize(colour, size, interpolation=cv2.INTER_CUBIC)
alpha = cv2.resize(alpha, size, interpolation=cv2.INTER_LINEAR)
alpha = np.clip((alpha - 0.5) * 3 + 0.5, 0, 1)

# trim to her, with a margin for the sticker rim
pad = 14
canvas = np.pad(canvas, ((pad, 0), (pad, pad)))
alpha = np.pad(alpha, ((pad, 0), (pad, pad)))
colour = np.pad(colour, ((pad, 0), (pad, pad), (0, 0)), mode="edge")
ys, xs = np.where(alpha > 0.02)
ya, yb = ys.min() - pad, alpha.shape[0]  # flat cut at the waist, where the photo ends
xa, xb = xs.min() - pad, xs.max() + pad
canvas, alpha, colour = canvas[ya:yb, xa:xb], alpha[ya:yb, xa:xb], colour[ya:yb, xa:xb]
Hh, Ww = alpha.shape

rng = np.random.default_rng(3)
grain = cv2.GaussianBlur(rng.normal(0, 1, (Hh, Ww)).astype(np.float32), (0, 0), 0.7)


def ramp(t, stops):
    """Gradient map: t 0..1 through [(pos, (r,g,b)), ...]."""
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        k = np.clip((t - p0) / max(p1 - p0, 1e-6), 0, 1)[..., None]
        seg = (t >= p0) & (t <= p1)
        out[seg] = (np.array(c0, np.float32) * (1 - k) + np.array(c1, np.float32) * k)[seg]
    return out


def save(path, rgb, a):
    out = np.dstack([np.clip(rgb, 0, 255), np.clip(a, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(path, quality=88, method=6)


def sticker(rgb, a, rim=7, colour=(244, 242, 230)):
    """Die-cut sticker: a paper-white rim around the cut-out."""
    a8 = (a * 255).astype(np.uint8)
    grown = cv2.dilate(a8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (rim * 2 + 1, rim * 2 + 1)))
    grown = cv2.GaussianBlur(grown, (0, 0), 0.8).astype(np.float32) / 255.0
    base = np.empty_like(rgb)
    base[:] = colour
    k = a[..., None]
    return base * (1 - k) + rgb * k, np.maximum(grown, a)


# --- stage: blue newsprint (ink navy, icy lights) ---
stage_rgb = ramp(np.power(np.clip(canvas + grain * 0.025, 0, 1), 1.1),
                 [(0, (6, 12, 34)), (0.55, (58, 96, 170)), (1, (214, 236, 255))])
save(os.path.join(stage_dir, "nandini-half.webp"), stage_rgb, alpha)
small = cv2.resize(alpha, (Ww // 4, Hh // 4), interpolation=cv2.INTER_AREA)
small = cv2.GaussianBlur(np.pad(small, 12), (0, 0), 5)
save(os.path.join(stage_dir, "nandini-half-shadow.webp"), np.zeros(small.shape + (3,)), small)

# --- hrx: cream and ink, hard contrast (the Hritik poster) ---
t = np.clip((canvas - 0.08) * 1.35 + grain * 0.03, 0, 1)
hrx = ramp(t, [(0, (8, 8, 10)), (0.45, (60, 58, 54)), (1, (240, 238, 218))])
save(os.path.join(photo_dir, "cut-hrx.webp"), *sticker(hrx, alpha))

# --- blue: halftone duotone (Dev D, recoloured blue) ---
cell = 6
yy, xx = np.mgrid[0:Hh, 0:Ww].astype(np.float32)
rot = (xx * 0.7071 + yy * 0.7071, -xx * 0.7071 + yy * 0.7071)
dot = (np.sin(rot[0] * np.pi / cell) * np.sin(rot[1] * np.pi / cell) + 1) / 2
light = cv2.GaussianBlur(canvas, (0, 0), 1.0)
ink_on = (light < dot * 0.9 + 0.05).astype(np.float32)
ink_on = np.where(light < 0.12, 1, ink_on)
blue = ramp(1 - ink_on, [(0, (6, 10, 26)), (1, (79, 168, 255))])
save(os.path.join(photo_dir, "cut-blue.webp"), *sticker(blue, alpha, colour=(6, 10, 26)))

# --- pop: 4-tone posterise, purple / cyan / cream, fine dot screen (Masaan) ---
q = np.digitize(cv2.GaussianBlur(canvas, (0, 0), 1.2), [0.18, 0.42, 0.7])
pal = np.array([(40, 16, 72), (92, 46, 140), (47, 182, 230), (242, 217, 176)], np.float32)
pop = pal[q]
screen = (np.sin(xx * 1.1) * np.sin(yy * 1.1) > 0.55)[..., None]
pop = np.where(screen, pop * 0.82, pop)
save(os.path.join(photo_dir, "cut-pop.webp"), *sticker(pop, alpha))

# --- lime: stipple, lime on ink (Rockstar) ---
noise = rng.random((Hh, Ww)).astype(np.float32)
st = (np.clip(canvas * 1.2, 0, 1) > noise * 0.85 + 0.08).astype(np.float32)
lime = ramp(st, [(0, (12, 14, 10)), (1, (223, 255, 122))])
save(os.path.join(photo_dir, "cut-lime.webp"), *sticker(lime, alpha, colour=(12, 14, 10)))

# --- thermal bands floating in front (Hritik's eye + mouth strips) ---
thermal = [(0, (10, 6, 48)), (0.28, (64, 18, 160)), (0.52, (190, 30, 160)),
           (0.76, (250, 128, 20)), (1, (255, 222, 120))]
strip_dir_rects = []
# in figure fractions: a band across her head/profile, one across her shoulder
for name, (u0, v0, u1, v1) in {"head": (0.06, 0.25, 0.86, 0.38), "shoulder": (0.2, 0.55, 0.78, 0.69)}.items():
    a0, b0, a1, b1 = int(u0 * Ww), int(v0 * Hh), int(u1 * Ww), int(v1 * Hh)
    patch = cv2.cvtColor(colour[b0:b1, a0:a1], cv2.COLOR_BGR2GRAY).astype(np.float32) / 255.0
    plo, phi = np.percentile(patch, [2, 99])
    patch = np.clip((patch - plo) / (phi - plo + 1e-6), 0, 1)
    patch = cv2.GaussianBlur(patch, (0, 0), 1.4)
    rgb = ramp(np.power(patch, 0.8), thermal)
    rgb[:4] = rgb[-4:] = rgb[:, :4] = rgb[:, -4:] = 0  # the thin black frame
    save(os.path.join(photo_dir, f"strip-{name}.webp"), rgb, np.ones(patch.shape, np.float32))
    strip_dir_rects.append({"name": name, "rect": [u0, v0, u1, v1]})

# --- the poster board: dark distressed canvas ---
GW, GH = 768, 1080
gr = np.random.default_rng(21)
cloud = np.zeros((GH, GW), np.float32)
for s, amp in [(160, 1.0), (60, 0.5), (18, 0.25), (4, 0.15)]:
    n = gr.random((GH // s + 2, GW // s + 2)).astype(np.float32)
    cloud += cv2.resize(n, (GW, GH), interpolation=cv2.INTER_CUBIC) * amp
cloud = (cloud - cloud.min()) / (cloud.max() - cloud.min())
weave = (np.sin(np.arange(GW)[None] * 2.2) * np.sin(np.arange(GH)[:, None] * 2.2)) * 0.04
speck = (gr.random((GH, GW)) > 0.996).astype(np.float32) * 0.5
gt = np.clip(np.power(cloud, 2.2) * 0.8 + weave + speck, 0, 1)
grunge = ramp(gt, [(0, (9, 9, 13)), (0.5, (36, 34, 44)), (1, (104, 96, 112))])
Image.fromarray(grunge.astype(np.uint8)).save(os.path.join(photo_dir, "grunge.webp"), quality=80, method=6)

meta = {"aspect": round(Ww / Hh, 4), "strips": strip_dir_rects,
        "filters": ["hrx", "blue", "pop", "lime"], "source": "stage photo (from behind)"}
with open(os.path.join(photo_dir, "cutouts.json"), "w") as f:
    json.dump(meta, f, indent=2)
print("figure", Ww, "x", Hh, "aspect", meta["aspect"])

# stage version that dissolves at the waist (she rises out of the haze)
fade = np.ones(Hh, np.float32)
n = int(Hh * 0.3)
fade[-n:] = np.linspace(1, 0, n) ** 1.6
save(os.path.join(stage_dir, "nandini-half-fade.webp"), stage_rgb, alpha * fade[:, None])
