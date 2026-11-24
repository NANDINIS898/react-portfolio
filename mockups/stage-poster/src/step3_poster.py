"""Screen-print poster treatment: posterised inks with halftone transitions,
the audience given its own (darker, flatter) inks, and the two blended through
a halftone edge instead of a hard cutout.

usage: step3_poster.py clean.png subject.png out_dir
"""
import os
import sys
import cv2
import numpy as np
from PIL import Image, ImageDraw, ImageFont

src, mask_src, out_dir = sys.argv[1], sys.argv[2], sys.argv[3]
os.makedirs(out_dir, exist_ok=True)
S = 2.6  # upscale; the halftone hides the low source resolution

img = cv2.imread(src)
m = cv2.imread(mask_src, cv2.IMREAD_GRAYSCALE)
H, W = int(img.shape[0] * S), int(img.shape[1] * S)
img = cv2.resize(img, (W, H), interpolation=cv2.INTER_LANCZOS4)
m = cv2.resize(m, (W, H), interpolation=cv2.INTER_LINEAR).astype(np.float32) / 255.0

gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)


def stretch(x, sel, lo=1, hi=99):
    a, b = np.percentile(x[sel], [lo, hi])
    return np.clip((x - a) / max(b - a, 1e-3), 0, 1)


# her: strong local contrast so hair strands and the floral print read
clahe = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(8, 8))
ls = clahe.apply(gray).astype(np.float32) / 255.0
ls = stretch(ls, m > 0.5, 2, 99.5)
ls = np.power(ls, 1.25)

# the audience: pull detail out of the bokeh so heads read as a crowd
g = gray.astype(np.float32) / 255.0
detail = g + 1.6 * (g - cv2.GaussianBlur(g, (0, 0), 6))
clahe_bg = cv2.createCLAHE(clipLimit=2.0, tileGridSize=(6, 6))
lb = clahe_bg.apply((np.clip(detail, 0, 1) * 255).astype(np.uint8)).astype(np.float32) / 255.0
lb = np.power(stretch(lb, m < 0.5, 1, 99.5), 0.8)


def screen(cell, angle):
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
    a = np.deg2rad(angle)
    u = xx * np.cos(a) + yy * np.sin(a)
    v = -xx * np.sin(a) + yy * np.cos(a)
    return (np.cos(2 * np.pi * u / cell) + np.cos(2 * np.pi * v / cell)) / 4 + 0.5


def inks(t, scr, thresholds, colors, spread):
    q = t + (scr - 0.5) * spread
    idx = np.zeros(t.shape, np.int32)
    for th in thresholds:
        idx += (q > th).astype(np.int32)
    pal = np.array([hex_rgb(c) for c in colors], np.uint8)
    return pal[idx], idx


def hex_rgb(h):
    h = h.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4))


PALETTES = {
    # purple / cyan / peach, like the Masaan print (and close to the site's blues)
    "masaan": dict(
        fg=["#22153f", "#5b3b8f", "#33b3e6", "#f5d7ab"], fg_th=[0.24, 0.48, 0.72],
        bg=["#1d1236", "#3e2a6d", "#6a4ba6", "#3a9fd0"], bg_th=[0.24, 0.52, 0.84],
        paper="#ead6b6",
    ),
    # black / crimson / acid lime, like the Rockstar print
    "rockstar": dict(
        fg=["#160b0c", "#b9323b", "#e7f39a"], fg_th=[0.34, 0.68],
        bg=["#160b0c", "#9c2a33", "#c4404a"], bg_th=[0.28, 0.6],
        paper="#e9e2c8",
    ),
    # the portfolio's own Y2K night palette
    "y2k": dict(
        fg=["#02040c", "#0b2a7a", "#2f7bff", "#bff0ff"], fg_th=[0.2, 0.4, 0.62],
        bg=["#02040c", "#061a4a", "#0f3a8f", "#2f7bff"], bg_th=[0.3, 0.6, 0.9],
        paper="#dff3ff",
    ),
}

fine = screen(7.0, 45)       # her: fine dots
coarse = screen(11.0, 15)    # crowd: coarser dots at another angle
edge = screen(9.0, 75)

# blend mask: feathered, then dithered through a halftone so she melts into
# the crowd in dots rather than a cut line
mf = cv2.GaussianBlur(m, (0, 0), 7)
blend = (mf + (edge - 0.5) * 0.7) > 0.5

rng = np.random.default_rng(7)
grain = rng.normal(0, 1, (H, W)).astype(np.float32)
grain = cv2.GaussianBlur(grain, (0, 0), 0.8)

yy, xx = np.mgrid[0:H, 0:W].astype(np.float32)
vign = 1 - 0.35 * (((xx / W - 0.55) ** 2) * 1.4 + ((yy / H - 0.5) ** 2) * 1.8)

results = {}
for name, p in PALETTES.items():
    fg_rgb, fg_idx = inks(ls, fine, p["fg_th"], p["fg"], 0.2)
    bg_rgb, _ = inks(lb * 0.95, coarse, p["bg_th"], p["bg"], 0.34)
    out = np.where(blend[..., None], fg_rgb, bg_rgb).astype(np.float32)

    # misregistration: the darkest ink printed again, 3px off, faintly
    ink_layer = (fg_idx == 0) & blend
    ghost = np.roll(np.roll(ink_layer, 3, axis=1), 2, axis=0) & ~ink_layer
    out[ghost] = out[ghost] * 0.72 + np.array(hex_rgb(p["fg"][0]), np.float32) * 0.28

    # paper: grain, a little of the paper colour in the lights, vignette
    paper = np.array(hex_rgb(p["paper"]), np.float32)
    out = out * 0.93 + paper * 0.07
    out += grain[..., None] * 9
    out *= vign[..., None]
    out = np.clip(out, 0, 255).astype(np.uint8)
    results[name] = out
    Image.fromarray(out).save(os.path.join(out_dir, f"stage-poster-{name}.png"), optimize=True)
    print("saved", name)


# a portrait one-sheet with a title, Rockstar-style, from the y2k + masaan inks
def one_sheet(arr, name, title_col, sub_col):
    # crop a 4:5 frame around her
    h, w = arr.shape[:2]
    cw = int(h * 0.8)
    x0 = min(w - cw, int(w * 0.33))
    crop = Image.fromarray(arr[:, x0:x0 + cw]).convert("RGB")
    d = ImageDraw.Draw(crop)
    fdir = "C:/Windows/Fonts/"
    title = ImageFont.truetype(fdir + "impact.ttf", int(cw * 0.215))
    small = ImageFont.truetype(fdir + "bahnschrift.ttf", int(cw * 0.032))
    pad = int(cw * 0.045)

    lines = ["BUILDER", "DEBUGGER", "PERFORMER", "DANCER"]
    for i, l in enumerate(lines):
        d.text((pad, pad + i * small.size * 1.15), l, font=small, fill=sub_col)
    right = ["A STORY BY", "NANDINI GANGWAR"]
    for i, l in enumerate(right):
        tw = d.textlength(l, font=small)
        d.text((cw - pad - tw, pad + i * small.size * 1.15), l, font=small, fill=sub_col)

    t = "NANDINI"
    # size the title to run nearly edge to edge, like a film one-sheet
    title = ImageFont.truetype(fdir + "impact.ttf", 100)
    title = ImageFont.truetype(fdir + "impact.ttf", int(100 * (cw - 2 * pad) / d.textlength(t, font=title)))
    tw = d.textlength(t, font=title)
    sx = (cw - tw) / 2
    ty = h - pad - title.size * 1.05
    shadow = tuple(int(c * 0.35) for c in title_col)
    d.text((sx + 6, ty + 6), t, font=title, fill=shadow)
    d.text((sx, ty), t, font=title, fill=title_col)
    crop.save(os.path.join(out_dir, f"stage-onesheet-{name}.png"), optimize=True)
    print("saved one-sheet", name)


one_sheet(results["masaan"], "masaan", hex_rgb("#f5d7ab"), hex_rgb("#f5d7ab"))
one_sheet(results["rockstar"], "rockstar", hex_rgb("#e7f39a"), hex_rgb("#e7f39a"))
