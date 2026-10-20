"""End-to-end check with Playwright + Chromium.

usage: python3 tests/e2e.py <base_url> <img_dir> <docs_dir>
Set CHROME=/path/to/chrome to override the browser binary.
"""
import io, os, sys, struct, glob
from PIL import Image
from playwright.sync_api import sync_playwright

base, imgdir, docs = sys.argv[1], sys.argv[2], sys.argv[3]
face, exif6 = f"{imgdir}/face.jpg", f"{imgdir}/exif6.jpg"


def find_chrome():
    if os.environ.get("CHROME"):
        return os.environ["CHROME"]
    for pat in ["/opt/pw-browsers/chromium-*/chrome-linux*/chrome", "/opt/google/chrome/chrome"]:
        hits = sorted(glob.glob(pat))
        if hits:
            return hits[-1]
    return None


def jfif_density(b):
    assert b[:2] == b"\xff\xd8", "not a JPEG"
    assert b[2:4] == b"\xff\xe0" and b[6:11] == b"JFIF\x00", "no JFIF APP0 right after SOI"
    units = b[13]
    x, y = struct.unpack(">HH", b[14:18])
    return units, x, y


results = []
def check(cond, msg):
    results.append((bool(cond), msg))
    print(("PASS " if cond else "FAIL ") + msg)


def watch(page, errs):
    page.on("console", lambda m: m.type == "error" and errs.append(m.text))
    page.on("pageerror", lambda e: errs.append(str(e)))


def export(page, path):
    with page.expect_download() as dl:
        page.click("#exportBtn")
    d = dl.value
    d.save_as(path)
    return d.suggested_filename, open(path, "rb").read()


with sync_playwright() as p:
    exe = find_chrome()
    browser = p.chromium.launch(executable_path=exe) if exe else p.chromium.launch()
    print("browser:", exe or "bundled")

    # ---------------- desktop
    ctx = browser.new_context(viewport={"width": 1280, "height": 900}, accept_downloads=True)
    page = ctx.new_page()
    errs = []
    watch(page, errs)
    page.goto(base, wait_until="networkidle")
    check(page.locator("#count").get_attribute("data-count") == "6", "empty state shows 6 tiles for 2x2 on 4x6")
    page.set_input_files("#file", face)
    page.wait_for_function("window.__idphoto.image().w > 0")
    page.wait_for_timeout(300)
    lay = page.evaluate("window.__idphoto.layout()")
    check(lay["W"] == 1800 and lay["H"] == 1200, f"layout sheet {lay['W']}x{lay['H']}")
    check(lay["main"] == 6, f"US 2x2 on 4x6 -> {lay['main']} tiles")
    # drag + wheel on the editor
    box = page.locator("#editorCanvas").bounding_box()
    cx, cy = box["x"] + box["width"] / 2, box["y"] + box["height"] / 2
    page.mouse.move(cx, cy); page.mouse.down(); page.mouse.move(cx + 20, cy + 10, steps=5); page.mouse.up()
    page.mouse.wheel(0, -100)
    page.mouse.move(cx, cy); page.mouse.down(); page.mouse.move(cx - 20, cy - 10, steps=5); page.mouse.up()
    page.mouse.wheel(0, 100)
    page.click("#resetCrop")
    # align the synthetic face with the US guides (head 600 px tall, eyes at y=545)
    align = "window.__idphoto.setCrop({span: 1000, cx: 600, cy: 670, rot: 0})"
    page.evaluate(align)
    page.wait_for_timeout(200)
    name, data = export(page, "/tmp/idphoto-test/export-us.jpg")
    im = Image.open(io.BytesIO(data))
    units, dx, dy = jfif_density(data)
    check(name == "id-photo-2x2-on-4x6.jpg", f"filename {name}")
    check(im.size == (1800, 1200), f"exported size {im.size}")
    check((units, dx, dy) == (1, 300, 300), f"JFIF density units={units} {dx}x{dy}")
    check(tuple(round(v) for v in im.info.get("dpi", (0, 0))) == (300, 300), f"PIL dpi {im.info.get('dpi')}")
    # each of the 6 tile centres (600 px grid) should show the face (skin colour), not white paper
    rgb = im.convert("RGB")
    skin = 0
    for j in range(2):
        for i in range(3):
            r, g, b = rgb.getpixel((300 + 600 * i, 300 + 600 * j - 40))
            skin += (r > 180 and 150 < g < 215 and 120 < b < 190)
    check(skin == 6, f"face visible in {skin}/6 tiles")
    page.wait_for_selector("#resultImg", state="visible")
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(300)
    page.screenshot(path=f"{docs}/screenshot.png", full_page=False)
    page.screenshot(path="/tmp/idphoto-desktop.png", full_page=False)
    page.screenshot(path="/tmp/idphoto-test/desktop-full.png", full_page=True)

    # other presets
    def count_for(preset, paper="4x6"):
        page.select_option("#preset", preset); page.select_option("#paper", paper)
        page.wait_for_timeout(100)
        return page.evaluate("window.__idphoto.layout()")
    for preset, paper in [("cn", "4x6"), ("1cun", "4x6"), ("2cun", "4x6"), ("eu", "4x6"), ("ca", "4x6"), ("us", "5x7"), ("us", "a6")]:
        l = count_for(preset, paper)
        print(f"  info {preset} on {paper}: {l['main']} tiles, {l['W']}x{l['H']} {l['orient']}")
    l = count_for("ca", "4x6")
    check(l["main"] == 4 and l["orient"] == "portrait", f"Canada 50x70 on 4x6 auto-picks portrait with {l['main']}")
    # mixed mode
    page.select_option("#preset", "us"); page.select_option("#paper", "a6")
    page.check("#mixed"); page.select_option("#mixedPreset", "1cun"); page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["main"] == 4 and l["total"] > l["main"], f"mixed 2x2 + 1-inch on A6: main {l['main']} total {l['total']}")
    page.screenshot(path="/tmp/idphoto-test/mixed.png")
    tiles = l["tiles"]
    overlap = any(not (a["x"] + a["w"] <= b["x"] or b["x"] + b["w"] <= a["x"] or a["y"] + a["h"] <= b["y"] or b["y"] + b["h"] <= a["y"])
                  for k, a in enumerate(tiles) for b in tiles[k + 1:])
    inside = all(t["x"] >= 0 and t["y"] >= 0 and t["x"] + t["w"] <= l["W"] and t["y"] + t["h"] <= l["H"] for t in tiles)
    check(not overlap and inside, "mixed tiles don't overlap and stay on paper")
    page.uncheck("#mixed")
    # custom size in inches
    page.select_option("#preset", "custom"); page.select_option("#paper", "4x6")
    page.fill("#customW", "1.5"); page.select_option("#customUnit", "in"); page.fill("#customH", "2")
    page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["tiles"][0]["w"] == 450 and l["tiles"][0]["h"] == 600, f"custom 1.5x2 in -> {l['tiles'][0]['w']}x{l['tiles'][0]['h']} px")

    # EXIF orientation
    page.select_option("#preset", "us")
    page.set_input_files("#file", exif6)
    page.wait_for_function("window.__idphoto.image().w === 1200")
    dims = page.evaluate("window.__idphoto.image()")
    check(dims == {"w": 1200, "h": 1600}, f"EXIF-6 photo decoded upright as {dims['w']}x{dims['h']}")
    page.wait_for_timeout(200)
    _, data = export(page, "/tmp/idphoto-test/export-exif.jpg")
    rgb = Image.open(io.BytesIO(data)).convert("RGB")
    top, bot = rgb.getpixel((300, 40)), rgb.getpixel((300, 560))
    check(top[0] > 150 and top[2] < 100 and bot[2] > 150 and bot[0] < 100, f"EXIF tile top={top} (red) bottom={bot} (blue)")

    # language toggle + persistence
    page.click("#langBtn")
    page.wait_for_timeout(100)
    en = page.text_content("#stepPhoto h2")
    page.reload(wait_until="networkidle")
    check("Photo" in en and page.text_content("#langBtn").strip() == "中文", f"English toggle persisted ('{en.strip()}')")
    page.click("#langBtn")
    check(not errs, f"desktop console errors: {errs}")
    ctx.close()

    # ---------------- iPhone 13
    dev = dict(p.devices["iPhone 13"])
    dev.pop("default_browser_type", None)
    mctx = browser.new_context(**dev, accept_downloads=True)
    m = mctx.new_page()
    merrs = []
    watch(m, merrs)
    m.goto(base, wait_until="networkidle")
    m.set_input_files("#file", face)
    m.wait_for_function("window.__idphoto.image().w > 0")
    m.evaluate(align)
    m.wait_for_timeout(300)
    sw = m.evaluate("document.documentElement.scrollWidth")
    check(sw <= 390, f"mobile no horizontal overflow (scrollWidth={sw})")
    check(m.locator("#count").get_attribute("data-count") == "6", "mobile count 6")
    # touch drag
    b = m.locator("#editorCanvas").bounding_box()
    m.touchscreen.tap(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
    _, data = export(m, "/tmp/idphoto-test/export-mobile.jpg")
    im = Image.open(io.BytesIO(data))
    check(im.size == (1800, 1200) and jfif_density(data) == (1, 300, 300), f"mobile export {im.size} dpi ok")
    m.evaluate("window.scrollTo(0, document.getElementById('stepCrop').offsetTop - 70)")
    m.wait_for_timeout(300)
    m.screenshot(path=f"{docs}/screenshot-mobile.png")
    m.screenshot(path="/tmp/idphoto-mobile.png")
    m.screenshot(path="/tmp/idphoto-test/mobile-full.png", full_page=True)
    check(not merrs, f"mobile console errors: {merrs}")
    mctx.close()

    # ---------------- dark scheme smoke test
    dctx = browser.new_context(viewport={"width": 1280, "height": 900}, color_scheme="dark")
    d = dctx.new_page()
    derrs = []
    watch(d, derrs)
    d.goto(base, wait_until="networkidle")
    d.set_input_files("#file", face)
    d.wait_for_function("window.__idphoto.image().w > 0")
    d.evaluate(align)
    d.wait_for_timeout(300)
    d.screenshot(path="/tmp/idphoto-test/dark.png")
    check(not derrs, f"dark-mode console errors: {derrs}")
    dctx.close()
    browser.close()

failed = [m for ok, m in results if not ok]
print(f"\n{len(results) - len(failed)}/{len(results)} checks passed")
sys.exit(1 if failed else 0)
