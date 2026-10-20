"""Generate synthetic test photos: a portrait 'face' and an EXIF-rotated JPEG."""
import sys
from PIL import Image, ImageDraw

out = sys.argv[1] if len(sys.argv) > 1 else "/tmp"

# 1) Upright portrait 1200x1600 with a simple face on an off-white background
im = Image.new("RGB", (1200, 1600), (244, 244, 240))
d = ImageDraw.Draw(im)
d.ellipse((380, 300, 820, 900), fill=(232, 190, 160))          # head
d.ellipse((480, 520, 560, 570), fill=(40, 40, 40))             # eyes
d.ellipse((640, 520, 720, 570), fill=(40, 40, 40))
d.arc((520, 650, 680, 780), 20, 160, fill=(150, 60, 60), width=10)
d.rectangle((300, 980, 900, 1600), fill=(40, 70, 140))         # shoulders
d.ellipse((150, 900, 1050, 1300), fill=(40, 70, 140))
im.save(f"{out}/face.jpg", quality=92)

# 2) EXIF orientation test: displayed image is 1200x1600 (top red, middle gray, bottom blue),
#    stored as 1600x1200 pixels rotated so that Orientation=6 (rotate 90 CW) makes it upright.
disp = Image.new("RGB", (1200, 1600), (128, 128, 128))
dd = ImageDraw.Draw(disp)
dd.rectangle((0, 0, 1200, 533), fill=(220, 30, 30))
dd.rectangle((0, 1067, 1200, 1600), fill=(30, 30, 220))
stored = disp.rotate(90, expand=True)  # CCW 90 -> viewer rotates CW 90 to restore
exif = Image.Exif()
exif[0x0112] = 6
stored.save(f"{out}/exif6.jpg", quality=92, exif=exif.tobytes())
print("ok", stored.size)
