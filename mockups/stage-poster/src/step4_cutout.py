"""Paper-cutout textures of her for the 3D stage (the green "kill this love" look).

  nandini-back.webp   her photo (seen from behind), black & white, crown
                     rounded off and black trousers drawn down to the floor
  nandini-front.webp the same outline, mirrored, as a flat ink silhouette with
                     a cream rim (what the audience sees: her, backlit)
  nandini-shadow.webp the outline blurred, for the soft drop shadow

usage: step4_cutout.py clean.png subject.png out_dir
"""
import os
import sys
import cv2
import numpy as np
from PIL import Image

src, mask_src, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out_dir, exist_ok=True)

img = cv2.imread(src)
m = cv2.imread(mask_src, cv2.IMREAD_GRAYSCALE)

# crop to her, with room on top for the crown and below for the legs
x0, x1 = 340, 690
crop = img[:, x0:x1]
mc = m[:, x0:x1].astype(np.float32) / 255.0
h, w = mc.shape
TOP, LEGS = 30, 400
H = TOP + h + LEGS
S = 1.6  # upscale

gray = cv2.cvtColor(crop, cv2.COLOR_BGR2GRAY)
clahe = cv2.createCLAHE(clipLimit=2.2, tileGridSize=(6, 6))
g = clahe.apply(gray).astype(np.float32) / 255.0
sel = mc > 0.5
lo, hi = np.percentile(g[sel], [3, 99.6])
g = np.clip((g - lo) / (hi - lo), 0, 1)
g = np.power(g, 1.15)  # keep it moody: mostly ink, light on skin

canvas = np.zeros((H, w), np.float32)
alpha = np.zeros((H, w), np.float32)
canvas[TOP:TOP + h] = g
alpha[TOP:TOP + h] = mc

# crown: the photo cuts her head off at the top edge; round it off in hair
r0 = np.where(mc[20] > 0.5)[0]
cx, half = (r0.min() + r0.max()) / 2, (r0.max() - r0.min()) / 2
cap = np.zeros((H, w), np.uint8)
cv2.ellipse(cap, (int(cx), TOP + 20), (int(half), TOP + 12), 0, 180, 360, 255, -1)
cap = cv2.GaussianBlur(cap, (0, 0), 1.2).astype(np.float32) / 255.0
# fill the dome by stretching the top rows of hair upward, a little darker
tone = float(np.percentile(g[0:60][mc[0:60] > 0.5], 12))
streak = cv2.GaussianBlur(np.random.default_rng(9).normal(0, 1, (1, w)).astype(np.float32), (0, 0), 1.2)
hair = np.clip(tone + streak * 0.08, 0, 1) * np.linspace(0.9, 1.0, TOP)[:, None]
canvas[:TOP] = np.where(cap[:TOP] > alpha[:TOP], hair, canvas[:TOP])
# where the dome widens past the photo's top rows, cover the backdrop too
side = (cap[TOP:TOP + 20] > 0.5) & (mc[0:20] < 0.5)
canvas[TOP:TOP + 20][side] = tone
alpha = np.maximum(alpha, cap)

# legs: black trousers from the hip down, tapering to the floor
rb = np.where(mc[-1] > 0.5)[0]
bl = rb.min()
br = bl + 190  # her hips, not the hair that falls past them on the right
pts = np.array([
    [bl + 4, TOP + h - 3], [br, TOP + h - 3], [br - 16, TOP + h + 160],
    [br - 44, H - 30], [br - 30, H - 4], [bl + 76, H - 4], [bl + 64, H - 30], [bl + 18, TOP + h + 160],
], np.int32)
# her hair ends where the photo did: fray that cut into ragged tips
tips = np.zeros((H, w), np.float32)
jag = np.random.default_rng(5).integers(0, 46, w).astype(np.float32)
jag = cv2.GaussianBlur(jag[None], (0, 0), 1.5)[0]
for x in range(br, w):
    tips[TOP + h - int(jag[x]) - 6:TOP + h, x] = 1
alpha = alpha * (1 - tips)
legs = np.zeros((H, w), np.uint8)
cv2.fillPoly(legs, [pts], 255)
# a seam between the legs
cv2.line(legs, ((bl + br) // 2 + 8, TOP + h + 120), ((bl + br) // 2 + 2, H), 0, 3)
legs = cv2.GaussianBlur(legs, (0, 0), 1.0).astype(np.float32) / 255.0
yy = np.mgrid[0:H, 0:w][0].astype(np.float32)
fabric = 0.09 + 0.04 * np.sin((yy - TOP - h) / 70.0)  # a faint fold
canvas = np.where(legs > alpha, fabric, canvas)
alpha = np.maximum(alpha, legs)

size = (int(w * S), int(H * S))
canvas = cv2.resize(canvas, size, interpolation=cv2.INTER_CUBIC)
alpha = cv2.resize(alpha, size, interpolation=cv2.INTER_LINEAR)
alpha = np.clip((alpha - 0.5) * 3 + 0.5, 0, 1)  # crisp scissor edge

# trim to the figure
ys, xs = np.where(alpha > 0.02)
pad = 6
ya, yb = max(ys.min() - pad, 0), min(ys.max() + pad, alpha.shape[0])
xa, xb = max(xs.min() - pad, 0), min(xs.max() + pad, alpha.shape[1])
canvas, alpha = canvas[ya:yb, xa:xb], alpha[ya:yb, xa:xb]
Hh, Ww = alpha.shape

rng = np.random.default_rng(3)
grain = cv2.GaussianBlur(rng.normal(0, 1, (Hh, Ww)).astype(np.float32), (0, 0), 0.7)


def ink(t, dark, light):
    d, l = np.array(dark, np.float32), np.array(light, np.float32)
    return d + (l - d) * t[..., None]


# photo side: newsprint black & white with a little green in the lights
photo = ink(np.clip(canvas + grain * 0.025, 0, 1), (14, 20, 16), (232, 240, 226))


def save(name, rgb, a):
    out = np.dstack([np.clip(rgb, 0, 255), a * 255]).astype(np.uint8)
    Image.fromarray(out, "RGBA").save(os.path.join(out_dir, name), quality=88, method=6)


save("nandini-back.webp", photo, alpha)

# audience side: ink silhouette, cream rim where the spotlight catches her
a8 = (alpha * 255).astype(np.uint8)
inner = cv2.erode(a8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)))
rim = cv2.GaussianBlur((a8.astype(np.float32) - inner) / 255.0, (0, 0), 1.6)
rim = np.clip(rim * 1.6, 0, 1)
rim[int(Hh * 0.55):] *= np.linspace(1, 0.15, Hh - int(Hh * 0.55))[:, None]
base = ink(np.clip(0.06 + grain * 0.02, 0, 1), (12, 22, 16), (40, 66, 50))
sil = base * (1 - rim[..., None]) + np.array((245, 215, 171), np.float32) * rim[..., None]
save("nandini-front.webp", sil[:, ::-1], alpha[:, ::-1])

# soft shadow: small, blurred, black
small = cv2.resize(alpha, (Ww // 4, Hh // 4), interpolation=cv2.INTER_AREA)
small = np.pad(small, 12)
small = cv2.GaussianBlur(small, (0, 0), 5)
save("nandini-shadow.webp", np.zeros(small.shape + (3,)), small)

print("figure", Ww, "x", Hh, "aspect", round(Ww / Hh, 4))
