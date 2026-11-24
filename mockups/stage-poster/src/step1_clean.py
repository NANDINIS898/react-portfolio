"""Remove the white overlay text from the photo by inpainting."""
import sys
import cv2
import numpy as np

src, out, mask_out = sys.argv[1], sys.argv[2], sys.argv[3]
img = cv2.imread(src)
h, w = img.shape[:2]

hsv = cv2.cvtColor(img, cv2.COLOR_BGR2HSV)
v = hsv[..., 2].astype(np.int16)
s = hsv[..., 1].astype(np.int16)

# bright, unsaturated pixels inside the text block on the left
mask = ((v > 150) & (s < 70)).astype(np.uint8) * 255
region = np.zeros_like(mask)
region[120:370, 0:370] = 255
mask = cv2.bitwise_and(mask, region)
# grow it to swallow the anti-aliased edges and any dark shadow
mask = cv2.dilate(mask, cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (9, 9)), iterations=2)

clean = cv2.inpaint(img, mask, 9, cv2.INPAINT_TELEA)
# the background is out of focus anyway: blur only the repaired area so it
# matches the bokeh instead of showing inpaint streaks
blur = cv2.GaussianBlur(clean, (0, 0), 6)
soft = cv2.GaussianBlur(mask, (0, 0), 6).astype(np.float32)[..., None] / 255.0
clean = (clean * (1 - soft) + blur * soft).astype(np.uint8)

cv2.imwrite(out, clean)
cv2.imwrite(mask_out, mask)
print("text px:", int((mask > 0).sum()))
