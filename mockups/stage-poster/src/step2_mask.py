"""Cut her out from the (out-of-focus) audience with GrabCut."""
import sys
import cv2
import numpy as np

src, out, preview = sys.argv[1], sys.argv[2], sys.argv[3]
img = cv2.imread(src)
h, w = img.shape[:2]

mask = np.full((h, w), cv2.GC_BGD, np.uint8)
# probable foreground: the band she stands in
mask[0:h, 350:680] = cv2.GC_PR_FGD
# sure foreground seeds: hair crown, shoulder/arm, top
for (x0, y0, x1, y1) in [(450, 30, 560, 200), (430, 260, 520, 330), (380, 340, 470, 470), (500, 360, 560, 480), (560, 200, 610, 330)]:
    mask[y0:y1, x0:x1] = cv2.GC_FGD

bgd = np.zeros((1, 65), np.float64)
fgd = np.zeros((1, 65), np.float64)
cv2.grabCut(img, mask, None, bgd, fgd, 8, cv2.GC_INIT_WITH_MASK)
fg = np.where((mask == cv2.GC_FGD) | (mask == cv2.GC_PR_FGD), 255, 0).astype(np.uint8)

# keep the largest blob, fill holes, soften the edge a little
n, lab, stats, _ = cv2.connectedComponentsWithStats(fg)
if n > 1:
    big = 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    fg = np.where(lab == big, 255, 0).astype(np.uint8)
fg = cv2.morphologyEx(fg, cv2.MORPH_CLOSE, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (15, 15)))
fg = cv2.GaussianBlur(fg, (0, 0), 1.5)
cv2.imwrite(out, fg)

vis = img.copy()
vis[fg < 128] = (vis[fg < 128] * 0.25).astype(np.uint8)
cv2.imwrite(preview, vis)
print("fg ratio", round(float((fg > 128).mean()), 3))
