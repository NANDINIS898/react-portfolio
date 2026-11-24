"""Persona cut-outs from Nandini's own photos.

    python mockups/cutouts/make_persona_cutouts.py public

Reads public/photos/src/pNN.jpg, finds her with a DeepLabV3 person mask
(torchvision, COCO weights) refined by GrabCut, crops a half-body frame at the
poster aspect, and writes for each persona:

    public/photos/cut-<persona>.webp     filtered cut-out with a sticker rim
    public/photos/strip-<persona>.webp   thermal band across her eyes
    public/photos/personas.json          strip rects (fractions of the cut-out)

It also re-inks the stage photo (public/stage/nandini-half*.webp) in the
violet / cyan / beige halftone of the stage poster.
"""
import json
import os
import sys

import cv2
import numpy as np
import torch
import torchvision.models.segmentation as seg
from PIL import Image

PUB = sys.argv[1] if len(sys.argv) > 1 else "public"
SRC = os.path.join(PUB, "photos", "src")
OUT = os.path.join(PUB, "photos")
W, H = 524, 834  # same frame as the stage cut-out, aspect 0.6283

# persona -> (photo, filter)
PICKS = {
    "builder": ("p03", "hrx"),
    "debugger": ("p06", "violet"),
    "performer": ("p13", "pop"),
    "creator": ("p09", "lime"),
    "dancer": ("p12", "hrx"),
    "filmmaker": ("p10", "violet"),
}

# --- palettes ---
VIOLET_INK = (34, 20, 84)
VIOLET_MID = (92, 64, 178)
CYAN = (70, 200, 240)
BEIGE = (242, 222, 190)
THERMAL = [(0, (10, 6, 48)), (0.28, (64, 18, 160)), (0.52, (190, 30, 160)),
           (0.76, (250, 128, 20)), (1, (255, 222, 120))]


def ramp(t, stops):
    t = np.clip(t, 0, 1)
    out = np.zeros(t.shape + (3,), np.float32)
    for (p0, c0), (p1, c1) in zip(stops[:-1], stops[1:]):
        k = np.clip((t - p0) / max(p1 - p0, 1e-6), 0, 1)[..., None]
        sel = (t >= p0) & (t <= p1)
        out[sel] = (np.array(c0, np.float32) * (1 - k) + np.array(c1, np.float32) * k)[sel]
    return out


def save(path, rgb, a):
    rgba = np.dstack([np.clip(rgb, 0, 255), np.clip(a, 0, 1) * 255]).astype(np.uint8)
    Image.fromarray(rgba, "RGBA").save(path, quality=88, method=6)


def sticker(rgb, a, rim=7, colour=(244, 242, 230)):
    a8 = (a * 255).astype(np.uint8)
    grown = cv2.dilate(a8, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (rim * 2 + 1, rim * 2 + 1)))
    grown = cv2.GaussianBlur(grown, (0, 0), 0.8).astype(np.float32) / 255.0
    base = np.empty_like(rgb)
    base[:] = colour
    k = a[..., None]
    return base * (1 - k) + rgb * k, np.maximum(grown, a)


def dots(shape, cell=6.0):
    yy, xx = np.mgrid[0:shape[0], 0:shape[1]].astype(np.float32)
    u, v = xx * 0.7071 + yy * 0.7071, -xx * 0.7071 + yy * 0.7071
    return (np.sin(u * np.pi / cell) * np.sin(v * np.pi / cell) + 1) / 2


# --- filters: gray 0..1 in, rgb + rim colour out ---
def f_hrx(g, rng):
    t = np.clip((g - 0.08) * 1.35 + rng.normal(0, 0.03, g.shape), 0, 1)
    return ramp(t, [(0, (8, 8, 10)), (0.45, (60, 58, 54)), (1, (240, 238, 218))]), (244, 242, 230)


def f_violet(g, rng):
    """The stage poster: violet ink, cyan mids in halftone, beige highlights."""
    light = cv2.GaussianBlur(g, (0, 0), 0.8)
    d = dots(g.shape, 5.0)
    base = ramp(light, [(0, VIOLET_INK), (0.45, VIOLET_MID), (0.7, CYAN), (1, BEIGE)])
    shade = (light < d * 0.95).astype(np.float32)[..., None]
    out = base * (1 - shade * 0.45) + np.array(VIOLET_INK, np.float32) * shade * 0.45
    return out, BEIGE


def f_pop(g, rng):
    q = np.digitize(cv2.GaussianBlur(g, (0, 0), 1.2), [0.2, 0.45, 0.72])
    pal = np.array([(40, 16, 72), (92, 46, 140), (47, 182, 230), (242, 217, 176)], np.float32)
    out = pal[q]
    yy, xx = np.mgrid[0:g.shape[0], 0:g.shape[1]]
    screen = (np.sin(xx * 1.1) * np.sin(yy * 1.1) > 0.55)[..., None]
    return np.where(screen, out * 0.82, out), (244, 242, 230)


def f_lime(g, rng):
    st = (np.clip(g * 1.2, 0, 1) > rng.random(g.shape) * 0.85 + 0.08).astype(np.float32)
    return ramp(st, [(0, (12, 14, 10)), (1, (223, 255, 122))]), (12, 14, 10)


FILTERS = {"hrx": f_hrx, "violet": f_violet, "pop": f_pop, "lime": f_lime}


# --- finding her ---
_model = None


def person_prob(rgb):
    global _model
    if _model is None:
        w = seg.DeepLabV3_ResNet50_Weights.COCO_WITH_VOC_LABELS_V1
        _model = seg.deeplabv3_resnet50(weights=w).eval()
    h, w_ = rgb.shape[:2]
    s = 640 / max(h, w_)
    small = cv2.resize(rgb, (int(w_ * s), int(h * s)), interpolation=cv2.INTER_AREA)
    x = torch.from_numpy(small).permute(2, 0, 1).float() / 255.0
    x = (x - torch.tensor([0.485, 0.456, 0.406])[:, None, None]) / torch.tensor([0.229, 0.224, 0.225])[:, None, None]
    with torch.no_grad():
        logits = _model(x[None])["out"][0]
    prob = torch.softmax(logits, 0)[15].numpy()  # VOC class 15 = person
    return cv2.resize(prob, (w_, h), interpolation=cv2.INTER_LINEAR)


def her_mask(rgb):
    prob = person_prob(rgb)
    # keep the person nearest the centre of the frame
    n, lab, stats, cent = cv2.connectedComponentsWithStats((prob > 0.5).astype(np.uint8))
    if n > 2:
        h, w = prob.shape
        score = [-1] + [stats[i, cv2.CC_STAT_AREA] / (1 + abs(cent[i][0] - w / 2) / w * 4) for i in range(1, n)]
        keep = lab == int(np.argmax(score))
        prob = np.where(keep, prob, np.minimum(prob, 0.05))
    # GrabCut tidies hair and edges, seeded from the model's confidence
    h, w = prob.shape
    s = min(1.0, 900 / max(h, w))
    sm = cv2.resize(rgb, (int(w * s), int(h * s)), interpolation=cv2.INTER_AREA)
    pm = cv2.resize(prob, (sm.shape[1], sm.shape[0]))
    gc = np.full(pm.shape, cv2.GC_PR_BGD, np.uint8)
    gc[pm > 0.5] = cv2.GC_PR_FGD
    gc[pm > 0.92] = cv2.GC_FGD
    gc[pm < 0.04] = cv2.GC_BGD
    bgd, fgd = np.zeros((1, 65), np.float64), np.zeros((1, 65), np.float64)
    cv2.grabCut(cv2.cvtColor(sm, cv2.COLOR_RGB2BGR), gc, None, bgd, fgd, 4, cv2.GC_INIT_WITH_MASK)
    m = ((gc == cv2.GC_FGD) | (gc == cv2.GC_PR_FGD)).astype(np.float32)
    m = cv2.resize(m, (w, h), interpolation=cv2.INTER_LINEAR)
    # blend with the model so GrabCut never eats a whole limb
    m = np.clip(0.65 * m + 0.35 * (prob > 0.5), 0, 1)
    m = cv2.morphologyEx((m > 0.5).astype(np.uint8), cv2.MORPH_CLOSE, np.ones((9, 9), np.uint8))
    n, lab, stats, _ = cv2.connectedComponentsWithStats(m)
    if n > 1:
        m = (lab == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))).astype(np.uint8)
    return cv2.GaussianBlur(m.astype(np.float32), (0, 0), 1.2)


def half_body(rgb, a):
    """Crop head-to-waist at the poster aspect, then scale to W x H."""
    ys, xs = np.nonzero(a > 0.5)
    top, bot = ys.min(), ys.max()
    bh = bot - top
    ch = int(min(bh * 0.62 + bh * 0.06, rgb.shape[0] - max(0, top - bh * 0.06)))
    y0 = int(max(0, top - bh * 0.06))
    cw = int(ch * W / H)
    head = a[top:top + max(4, bh // 6)]
    hx = int(np.average(np.arange(a.shape[1]), weights=head.sum(0) + 1e-6))
    x0 = int(np.clip(hx - cw / 2, 0, max(0, rgb.shape[1] - cw)))
    pad_l = max(0, cw - (rgb.shape[1] - x0))
    crop = rgb[y0:y0 + ch, x0:x0 + cw]
    ca = a[y0:y0 + ch, x0:x0 + cw]
    if pad_l or crop.shape[1] < cw:  # narrow photo: pad the sides with nothing
        padw = cw - crop.shape[1]
        crop = np.pad(crop, ((0, 0), (padw // 2, padw - padw // 2), (0, 0)), mode="edge")
        ca = np.pad(ca, ((0, 0), (padw // 2, padw - padw // 2)))
    crop = cv2.resize(crop, (W, H), interpolation=cv2.INTER_AREA)
    ca = cv2.resize(ca, (W, H), interpolation=cv2.INTER_LINEAR)
    return crop, ca


def eye_band(a):
    ys = np.nonzero(a.max(1) > 0.5)[0]
    yt = ys.min() / H
    v0, v1 = yt + 0.12, yt + 0.21
    rows = a[int(v0 * H):int(v1 * H)]
    xs = np.nonzero(rows.max(0) > 0.5)[0]
    u0, u1 = max(0.02, xs.min() / W - 0.06), min(0.98, xs.max() / W + 0.06)
    return [float(round(u0, 3)), float(round(v0, 3)), float(round(u1, 3)), float(round(v1, 3))]


def gray_of(rgb, a):
    g = cv2.cvtColor(rgb, cv2.COLOR_RGB2GRAY).astype(np.float32) / 255.0
    inside = g[a > 0.5]
    lo, hi = np.percentile(inside, [2, 98])
    return np.clip((g - lo) / (hi - lo + 1e-6), 0, 1)


def main():
    rng = np.random.default_rng(5)
    meta = {"aspect": round(W / H, 4), "personas": {}}
    for persona, (pid, filt) in PICKS.items():
        rgb = np.array(Image.open(os.path.join(SRC, pid + ".jpg")).convert("RGB"))
        a_full = her_mask(rgb)
        crop, a = half_body(rgb, a_full)
        # a clean flat cut at the bottom edge
        a[-3:] = 0
        g = gray_of(crop, a)
        out, rim = FILTERS[filt](g, rng)
        save(os.path.join(OUT, f"cut-{persona}.webp"), *sticker(out, a, colour=rim))
        u0, v0, u1, v1 = eye_band(a)
        patch = g[int(v0 * H):int(v1 * H), int(u0 * W):int(u1 * W)]
        patch = cv2.GaussianBlur(patch, (0, 0), 1.2)
        srgb = ramp(np.power(patch, 0.8), THERMAL)
        srgb[:4] = srgb[-4:] = srgb[:, :4] = srgb[:, -4:] = 0
        save(os.path.join(OUT, f"strip-{persona}.webp"), srgb, np.ones(patch.shape, np.float32))
        meta["personas"][persona] = {"photo": pid, "filter": filt, "strip": [u0, v0, u1, v1]}
        print(persona, pid, filt, "strip", [u0, v0, u1, v1])
    with open(os.path.join(OUT, "personas.json"), "w") as f:
        json.dump(meta, f, indent=2)

    # the stage photo, re-inked in the poster's violet halftone
    stage = os.path.join(PUB, "stage")
    for name in ("nandini-half.webp", "nandini-half-fade.webp"):
        src = os.path.join(os.path.dirname(os.path.abspath(__file__)), "stage-src", name)
        im = np.array(Image.open(src).convert("RGBA")).astype(np.float32)
        lum = im[..., :3].mean(2) / 255.0
        lo, hi = np.percentile(lum[im[..., 3] > 128], [3, 99.5])
        g = np.clip((lum - lo) / (hi - lo + 1e-6), 0, 1) ** 0.85
        out, _ = f_violet(g, rng)
        save(os.path.join(stage, name), out, im[..., 3] / 255.0)
    print("stage re-inked")


if __name__ == "__main__":
    main()
