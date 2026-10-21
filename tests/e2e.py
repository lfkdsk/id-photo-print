"""End-to-end check with Playwright + Chromium.

usage: python3 tests/e2e.py <base_url> <img_dir> <docs_dir>
Set CHROME=/path/to/chrome to override the browser binary.
"""
import io, os, sys, struct, glob, math
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


SAFE_PX = 35  # 3 mm @ 300 DPI


def mm2px(mm):
    return round(mm / 25.4 * 300)


def edge_margins(l):
    t = l["tiles"]
    if not t:
        return {"top": 0, "bottom": 0, "left": 0, "right": 0}
    return {"left": min(r["x"] for r in t), "top": min(r["y"] for r in t),
            "right": min(l["W"] - r["x"] - r["w"] for r in t), "bottom": min(l["H"] - r["y"] - r["h"] for r in t)}


def long_ends(l):
    """Outer margins (px) at the two ends of the paper's long side (left/right in landscape, top/bottom in portrait)."""
    m = edge_margins(l)
    return min(m["left"], m["right"]) if l["W"] >= l["H"] else min(m["top"], m["bottom"])


def margins(l):
    m = edge_margins(l)
    return min(m.values())


def no_overlap_inside(l):
    tiles = l["tiles"]
    overlap = any(not (a["x"] + a["w"] <= b["x"] or b["x"] + b["w"] <= a["x"] or a["y"] + a["h"] <= b["y"] or b["y"] + b["h"] <= a["y"])
                  for k, a in enumerate(tiles) for b in tiles[k + 1:])
    inside = all(t["x"] >= 0 and t["y"] >= 0 and t["x"] + t["w"] <= l["W"] and t["y"] + t["h"] <= l["H"] for t in tiles)
    return not overlap and inside


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
    check(page.locator("#count").get_attribute("data-count") == "4", "empty state shows 4 tiles for 2x2 on 4x6")
    page.set_input_files("#file", face)
    page.wait_for_function("window.__idphoto.image().w > 0")
    page.wait_for_timeout(300)
    lay = page.evaluate("window.__idphoto.layout()")
    check(lay["W"] == 1800 and lay["H"] == 1200, f"layout sheet {lay['W']}x{lay['H']}")
    em = edge_margins(lay)
    check(lay["main"] == 4 and lay["safe"] and lay["orient"] == "landscape", f"US 2x2 on 4x6 default -> {lay['main']} tiles ({lay['orient']})")
    check(all(t["w"] == 600 and t["h"] == 600 for t in lay["tiles"]), "uncalibrated tiles are exactly 600x600 px")
    check(em["left"] >= SAFE_PX and em["right"] >= SAFE_PX, f"left/right margins {em['left']}/{em['right']} px >= {SAFE_PX}")
    check(em["top"] == 0 and em["bottom"] == 0 and no_overlap_inside(lay), f"rows touch top/bottom paper edges ({em['top']}/{em['bottom']} px), no overlap")
    print("  default 4x6 edges:", em)
    check(page.is_visible("#safeHint") and page.is_visible("#switchPaper"), "hint + switch button shown (4 safe < 6 max)")
    print("  hint:", page.text_content("#safeHint"))
    check(page.is_visible("#edgeNote") and page.is_hidden("#safeWarn"), "gentle note (top/bottom at paper edge), no warning")
    print("  note:", page.text_content("#edgeNote"))
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
    # each tile centre should show the face (skin colour), and the outer 3 mm should be white paper
    rgb = im.convert("RGB")
    skin = 0
    for tl in lay["tiles"]:
        r, g, b = rgb.getpixel((tl["x"] + tl["w"] // 2, tl["y"] + tl["h"] // 2 - 40))
        skin += (r > 180 and 150 < g < 215 and 120 < b < 190)
    check(skin == len(lay["tiles"]) == 4, f"face visible in {skin}/{len(lay['tiles'])} tiles")
    edge = [rgb.getpixel((x, y)) for y in range(0, 1200, 7) for x in (0, 10, 30, 1769, 1789, 1799)]
    check(all(min(p) > 235 for p in edge), "left/right 3 mm bands of the export are blank paper")
    page.wait_for_selector("#resultImg", state="visible")
    page.evaluate("window.scrollTo(0, 0)")
    page.wait_for_timeout(300)
    page.screenshot(path="/tmp/idphoto-test/desktop-top.png", full_page=False)
    page.evaluate("window.scrollTo(0, document.querySelector('.sheet-wrap').getBoundingClientRect().top + window.scrollY - 470)")
    page.wait_for_timeout(300)
    page.screenshot(path=f"{docs}/screenshot.png", full_page=False)
    page.screenshot(path="/tmp/idphoto-desktop.png", full_page=False)
    page.screenshot(path="/tmp/idphoto-test/desktop-full.png", full_page=True)

    # one-click switch to the smallest paper that fits the max count safely
    page.click("#switchPaper")
    page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    check(page.input_value("#paper") == "5x7", f"switch button -> paper {page.input_value('#paper')}")
    check((l["W"], l["H"]) in [(2100, 1500), (1500, 2100)] and l["main"] == 6, f"5x7: {l['W']}x{l['H']} with {l['main']} tiles")
    check(long_ends(l) >= SAFE_PX and no_overlap_inside(l), f"5x7 long-side-end margins {long_ends(l)} px >= {SAFE_PX}")
    check(page.is_hidden("#safeHint"), "hint hidden once the safe layout reaches the max")
    name, data = export(page, "/tmp/idphoto-test/export-5x7.jpg")
    im = Image.open(io.BytesIO(data))
    check(name == "id-photo-2x2-on-5x7.jpg" and im.size in [(2100, 1500), (1500, 2100)] and jfif_density(data) == (1, 300, 300),
          f"5x7 export {name} {im.size}")
    page.select_option("#paper", "4x6"); page.wait_for_timeout(100)
    # safe margin off -> densest packing + orange warning
    page.uncheck("#safe"); page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["main"] == 6 and not l["safe"], f"safe margin off: US 2x2 on 4x6 -> {l['main']} tiles")
    check(page.is_visible("#safeWarn") and page.is_hidden("#safeHint") and page.is_hidden("#edgeNote"), "safe off shows trim warning")
    print("  warn:", page.text_content("#safeWarn"))
    page.screenshot(path="/tmp/idphoto-test/unsafe.png")
    page.check("#safe"); page.wait_for_timeout(100)
    check(page.is_hidden("#safeWarn"), "warning hidden when safe margin is back on")

    # other presets
    def count_for(preset, paper="4x6"):
        page.select_option("#preset", preset); page.select_option("#paper", paper)
        page.wait_for_timeout(100)
        return page.evaluate("window.__idphoto.layout()")
    for preset in ["us", "cn", "1cun", "2cun", "eu", "jp", "ca"]:
        for paper in ["4x6", "5x7", "a6"]:
            l = count_for(preset, paper)
            page.uncheck("#safe"); page.wait_for_timeout(60)
            u = page.evaluate("window.__idphoto.layout()")
            page.check("#safe"); page.wait_for_timeout(60)
            hint = page.is_visible("#safeHint")
            alt = page.get_attribute("#switchPaper", "data-paper") if page.is_visible("#switchPaper") else None
            print(f"  info {preset:5s} on {paper}: default {l['main']} ({l['orient']}, edges {edge_margins(l)}) | unsafe {u['main']} | hint {hint} alt {alt}")
            if l["main"]:
                check(long_ends(l) >= SAFE_PX and no_overlap_inside(l), f"{preset} on {paper}: long-side-end margins {long_ends(l)} px")
    l = count_for("us", "5x7")
    check(l["main"] == 6, f"US 2x2 on 5x7 default -> {l['main']}")
    l = count_for("ca", "4x6")
    check(l["main"] == 4 and l["orient"] == "portrait" and long_ends(l) >= SAFE_PX,
          f"Canada 50x70 on 4x6 -> {l['main']} ({l['orient']}, 6 in ends {long_ends(l)} px)")
    # portrait mapping: the long-side margin must land on the 6 in ends (top/bottom of a portrait sheet)
    l = count_for("cn", "4x6")
    em = edge_margins(l)
    check(l["orient"] == "portrait" and l["W"] == 1200 and l["H"] == 1800 and em["top"] >= SAFE_PX and em["bottom"] >= SAFE_PX
          and l["refM"]["top"] == SAFE_PX and l["refM"]["left"] == 0 and no_overlap_inside(l),
          f"China 33x48 on 4x6: {l['main']} {l['orient']}, edges {em}")
    page.select_option("#preset", "us"); page.select_option("#orient", "portrait"); page.wait_for_timeout(100)
    l = page.evaluate("window.__idphoto.layout()")
    em = edge_margins(l)
    check(l["main"] == 4 and l["W"] == 1200 and em["top"] >= SAFE_PX and em["bottom"] >= SAFE_PX and em["left"] == 0 and em["right"] == 0,
          f"US 2x2 forced portrait: {l['main']} tiles, edges {em}")
    page.select_option("#orient", "auto")
    # mixed mode
    page.select_option("#preset", "us"); page.select_option("#paper", "a6")
    page.check("#mixed"); page.select_option("#mixedPreset", "1cun"); page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["main"] == 4 and l["total"] > l["main"], f"mixed 2x2 + 1-inch on A6: main {l['main']} total {l['total']}")
    page.screenshot(path="/tmp/idphoto-test/mixed.png")
    check(no_overlap_inside(l) and long_ends(l) >= SAFE_PX, f"mixed tiles don't overlap, long-side-end margins {long_ends(l)} px")
    page.uncheck("#mixed")
    # custom size in inches
    page.select_option("#preset", "custom"); page.select_option("#paper", "4x6")
    page.fill("#customW", "1.5"); page.select_option("#customUnit", "in"); page.fill("#customH", "2")
    page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["tiles"][0]["w"] == 450 and l["tiles"][0]["h"] == 600, f"custom 1.5x2 in -> {l['tiles'][0]['w']}x{l['tiles'][0]['h']} px")

    # print calibration: measured 52.3 mm on 4x6 -> tiles shrink by 50.8/52.3
    page.select_option("#preset", "us"); page.select_option("#paper", "4x6")
    page.click("#calib summary")
    check(page.text_content("#calibExpected").strip() == "50.8 mm", f"expected size shown: {page.text_content('#calibExpected')}")
    page.fill("#calibMeasured", "52.3"); page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    want = round(600 * 50.8 / 52.3)
    tw = l["tiles"][0]["w"]
    check(abs(tw - want) <= 1 and l["tiles"][0]["h"] == tw, f"calibrated tile {tw}px (want {want})")
    check(long_ends(l) >= SAFE_PX and l["W"] == 1800 and l["H"] == 1200 and l["main"] == 4, f"calibrated: {l['main']} tiles, long-end margins {long_ends(l)} px, sheet {l['W']}x{l['H']}")
    print("  calib:", page.text_content("#calibFactor"), "|", page.text_content("#sheetInfo"))
    check("−2.9%" in page.text_content("#calibFactor"), "factor shown as −2.9%")
    _, data = export(page, "/tmp/idphoto-test/export-calib.jpg")
    check(Image.open(io.BytesIO(data)).size == (1800, 1200), "calibrated export still 1800x1200")
    page.screenshot(path="/tmp/idphoto-test/calib.png")
    page.fill("#safeLong", "3.5"); page.wait_for_timeout(100)
    page.reload(wait_until="networkidle")
    page.wait_for_timeout(200)
    l = page.evaluate("window.__idphoto.layout()")
    check(page.input_value("#calibMeasured") == "52.3" and abs(l["tiles"][0]["w"] - want) <= 1,
          f"calibration persisted across reload ({page.input_value('#calibMeasured')}, tile {l['tiles'][0]['w']})")
    check(page.input_value("#safeLong") == "3.5" and page.input_value("#safeShort") == "0" and page.is_checked("#safe") and long_ends(l) >= 41,
          f"long-side safe margin 3.5 mm persisted (margin {long_ends(l)} px)")
    page.select_option("#paper", "5x7"); page.wait_for_timeout(100)
    l = page.evaluate("window.__idphoto.layout()")
    check(page.input_value("#calibMeasured") == "" and l["k"] == 1 and l["tiles"][0]["w"] == 600, "calibration is per paper (5x7 uncalibrated)")
    page.select_option("#paper", "4x6"); page.wait_for_timeout(100)
    # tight layout + enlarging calibration: margins must still respect the safe margin
    page.select_option("#preset", "cn"); page.wait_for_timeout(100)
    page.click("#calib summary")
    page.fill("#calibMeasured", "31.6"); page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["k"] > 1 and long_ends(l) >= 41 and no_overlap_inside(l),
          f"CN 33x48 calibrated x{l['k']:.3f}: {l['main']} tiles, long-end margins {long_ends(l)} px (safe 3.5 mm)")
    page.select_option("#preset", "us"); page.wait_for_timeout(100)
    page.click("#calibReset"); page.wait_for_timeout(100)
    page.fill("#safeLong", "3"); page.wait_for_timeout(100)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["k"] == 1 and l["tiles"][0]["w"] == 600 and page.input_value("#calibMeasured") == "", "calibration reset")

    # ---- calibration test sheet + 100 mm line + per-edge trims
    page.click("#calib summary") if not page.evaluate("document.getElementById('calib').open") else None
    for paper, size in [("5x7", (2100, 1500)), ("4x6", (1800, 1200))]:
        page.select_option("#paper", paper); page.wait_for_timeout(80)
        with page.expect_download() as dl:
            page.click("#calibSheetBtn")
        d = dl.value
        path = f"/tmp/idphoto-test/{d.suggested_filename}"
        d.save_as(path)
        data = open(path, "rb").read()
        im = Image.open(io.BytesIO(data))
        check(d.suggested_filename == f"calibration-{paper}.jpg" and im.size == size and im.format == "JPEG" and jfif_density(data) == (1, 300, 300),
              f"test sheet {d.suggested_filename} {im.size} {im.format} dpi {jfif_density(data)}")
        g = im.convert("L")
        W, H = im.size
        def ink(box):
            return g.crop(box).getextrema()[0] < 90
        bands = {"top": (0, 0, W, SAFE_PX), "bottom": (0, H - SAFE_PX, W, H), "left": (0, 0, SAFE_PX, H), "right": (W - SAFE_PX, 0, W, H)}
        got = {k: ink(b) for k, b in bands.items()}
        # the very first pixel row/column (0 mm tick) carries ink too
        got0 = {k: ink(b) for k, b in {"top": (0, 0, W, 2), "bottom": (0, H - 2, W, H), "left": (0, 0, 2, H), "right": (W - 2, 0, W, H)}.items()}
        check(all(got.values()) and all(got0.values()), f"{paper} sheet has ruler ink within 3 mm of every edge {got} and at the edge {got0}")
        # 100 mm line: its end ticks stick out 3 mm above the line; measure their distance
        hy = H / 2 + 12 / 25.4 * 300
        row = int(hy - 20)
        dark = [(x, 255 - g.getpixel((x, row))) for x in range(W) if g.getpixel((x, row)) < 200]
        def centre(pts):
            return sum(x * w for x, w in pts) / max(1, sum(w for _, w in pts))
        span = 0
        if dark:
            lo, hi = dark[0][0], dark[-1][0]
            span = centre([p for p in dark if p[0] <= lo + 6]) - centre([p for p in dark if p[0] >= hi - 6])
            span = abs(span)
        check(abs(span - 100 / 25.4 * 300) <= 1.5, f"{paper} sheet: 100 mm line end ticks {span:.1f}px apart centre-to-centre (want 1181.1)")
    page.wait_for_selector("#calibSheetImg", state="visible")
    page.fill("#calibLine", "103"); page.wait_for_timeout(150)
    l = page.evaluate("window.__idphoto.layout()")
    want = round(600 / 1.03)
    check(l["main"] == 4 and all(t["w"] == want and t["h"] == want for t in l["tiles"]) and long_ends(l) >= SAFE_PX,
          f"100 mm line measured 103 -> {l['main']} tiles of {l['tiles'][0]['w']} px (want {want})")
    check("+3.0%" in page.text_content("#calibFactor"), f"summary: {page.text_content('#calibFactor')}")

    def expected_count(l, tile, t, b, lft, r):
        """Geometric max count with gap 0: landscape uses edges as given; portrait uses the larger of each pair."""
        need = lambda mm, k: math.ceil((mm + 0.5 * k) / 25.4 * 300 - 1e-6)
        k = 1 / 1.03
        T, B, Lm, R = need(t, k), need(b, k), need(lft, k), need(r, k)
        S, Lg = 0, SAFE_PX
        T, B, Lm, R = max(T, S), max(B, S), max(Lm, Lg), max(R, Lg)
        land = ((1800 - Lm - R) // tile) * ((1200 - T - B) // tile)
        port = ((1200 - 2 * max(T, B)) // tile) * ((1800 - 2 * max(Lm, R)) // tile)
        return max(land, port), (T, B, Lm, R)

    for trims in [(0.8, 0.7, 2.1, 2.4), (1.0, 1.0, 2.5, 2.5)]:
        for sel, v in zip(["#trimTop", "#trimBottom", "#trimLeft", "#trimRight"], trims):
            page.fill(sel, str(v))
        page.wait_for_timeout(150)
        l = page.evaluate("window.__idphoto.layout()")
        em = edge_margins(l)
        exp, need = expected_count(l, want, *trims)
        ok_edges = all(em[e] >= l["refM"][e] for e in em)
        check(l["main"] == exp and ok_edges and no_overlap_inside(l),
              f"trims T{trims[0]} B{trims[1]} L{trims[2]} R{trims[3]} + line 103: {l['main']} tiles (geometric {exp}), required px {need}, actual edges {em}")
        print("  summary:", page.text_content("#calibFactor"), "| note:", page.text_content("#edgeNote") if page.is_visible("#edgeNote") else "-")
    check("上1 下1 左2.5 右2.5" in page.text_content("#calibFactor") or "T 1 B 1 L 2.5 R 2.5" in page.text_content("#calibFactor"),
          "trim summary shows all four edges")
    page.reload(wait_until="networkidle"); page.wait_for_timeout(150)
    check(page.input_value("#calibLine") == "103" and page.input_value("#trimLeft") == "2.5", "line + trims persisted per paper")
    page.select_option("#paper", "5x7"); page.wait_for_timeout(80)
    check(page.input_value("#calibLine") == "" and page.input_value("#trimLeft") == "", "5x7 has its own (empty) calibration")
    page.select_option("#paper", "4x6"); page.wait_for_timeout(80)
    page.click("#calib summary")
    page.click("#calibReset"); page.wait_for_timeout(100)
    l = page.evaluate("window.__idphoto.layout()")
    check(l["main"] == 4 and l["k"] == 1 and page.input_value("#trimTop") == "" and page.input_value("#calibLine") == "", "line/trim calibration reset")
    page.set_input_files("#file", face)
    page.wait_for_function("window.__idphoto.image().w > 0")

    # EXIF orientation
    page.select_option("#preset", "us")
    page.set_input_files("#file", exif6)
    page.wait_for_function("window.__idphoto.image().w === 1200")
    dims = page.evaluate("window.__idphoto.image()")
    check(dims == {"w": 1200, "h": 1600}, f"EXIF-6 photo decoded upright as {dims['w']}x{dims['h']}")
    page.wait_for_timeout(200)
    _, data = export(page, "/tmp/idphoto-test/export-exif.jpg")
    rgb = Image.open(io.BytesIO(data)).convert("RGB")
    t0 = page.evaluate("window.__idphoto.layout()")["tiles"][0]
    top = rgb.getpixel((t0["x"] + 300, t0["y"] + 40))
    bot = rgb.getpixel((t0["x"] + 300, t0["y"] + 560))
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
    check(m.locator("#count").get_attribute("data-count") == "4", "mobile count 4 (default safe margins)")
    check(m.is_visible("#switchPaper"), "mobile shows the switch-to-5x7 button")
    # touch drag
    b = m.locator("#editorCanvas").bounding_box()
    m.touchscreen.tap(b["x"] + b["width"] / 2, b["y"] + b["height"] / 2)
    _, data = export(m, "/tmp/idphoto-test/export-mobile.jpg")
    im = Image.open(io.BytesIO(data))
    check(im.size == (1800, 1200) and jfif_density(data) == (1, 300, 300), f"mobile export {im.size} dpi ok")
    m.evaluate("window.scrollTo(0, document.querySelector('.sheet-wrap').getBoundingClientRect().top + window.scrollY - 260)")
    m.wait_for_timeout(300)
    m.screenshot(path=f"{docs}/screenshot-mobile.png")
    m.screenshot(path="/tmp/idphoto-mobile.png")
    m.screenshot(path="/tmp/idphoto-test/mobile-full.png", full_page=True)
    check(not merrs, f"mobile console errors: {merrs}")
    mctx.close()

    # ---------------- localStorage migration: old single safe margin -> long-side value
    gctx = browser.new_context(viewport={"width": 1280, "height": 900})
    g2 = gctx.new_page()
    gerrs = []
    watch(g2, gerrs)
    g2.goto(base, wait_until="networkidle")
    g2.evaluate("localStorage.clear(); localStorage.setItem('idphoto.safeMm', '4.5'); localStorage.setItem('idphoto.safe', '1')")
    g2.reload(wait_until="networkidle"); g2.wait_for_timeout(150)
    l = g2.evaluate("window.__idphoto.layout()")
    keys = g2.evaluate("[localStorage.getItem('idphoto.safeMm'), localStorage.getItem('idphoto.safeLong')]")
    check(g2.input_value("#safeLong") == "4.5" and g2.input_value("#safeShort") == "0" and keys == [None, "4.5"]
          and long_ends(l) >= mm2px(4.5) and l["main"] == 4,
          f"old safeMm=4.5 migrated -> long {g2.input_value('#safeLong')} short {g2.input_value('#safeShort')}, keys {keys}, {l['main']} tiles")
    check(not gerrs, f"migration console errors: {gerrs}")
    gctx.close()

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
