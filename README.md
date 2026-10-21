# 证件照排版 · ID Photo Print

**在线使用：<https://lfkdsk.github.io/id-photo-print/>**

把护照 / 签证证件照排到一张 4×6 英寸相纸上，拿去 CVS / Walgreens 冲印只要几毛钱（约 $0.3–0.5），不用花 $16.99 买店里的 Passport Photo。

![screenshot](docs/screenshot.png)

## 功能

- **纯本地处理**：照片只在浏览器里处理，不会上传到任何服务器；无依赖、无构建、无 CDN。
- **常用尺寸**：美国护照/签证 2×2 英寸（默认）、中国护照/签证 33×48mm、一寸 25×35mm、二寸 35×49mm、申根/英国/欧盟 35×45mm、日本 35×45mm、加拿大 50×70mm，以及自定义（mm / inch）。
- **裁剪编辑**：拖动平移，双指 / 滚轮缩放，缩放滑块，±15° 旋转微调；自动按 EXIF 方向摆正 iPhone 照片。
- **参考线**：美国 2×2 显示眼睛高度带（距底边 1⅛″–1⅜″）和头部大小范围（下巴到头顶 1″–1⅜″）；其它尺寸显示中线和头部椭圆。可隐藏。
- **自动排版**：4×6（默认）、5×7、A6 相纸，300 DPI 输出（4×6 → 1800×1200 px，5×7 → 2100×1500 px）。自动尝试横竖两种方向取能放最多的方案；可调间距、边距，放不下时自动收紧（但不会突破安全边距）。可选灰色裁切线。
- **分边安全边距**（默认开）：按纸的物理边分别设置——**长边两端**（横放时左右，6 英寸那条边的两端）默认 **3 mm**，**短边两端**（横放时上下）默认 **0 mm**；竖排时自动对应到同一条物理边。美国 2×2 在 4×6 上默认 **4 张**（2×2 网格，上下贴纸边），在 5×7 上 **6 张**。安全排版比「铺满」少时会给出提示和一键「改用 5×7」按钮；关闭安全边距可回到铺满排法（4×6 上 6 张），并显示裁边警告。
- **打印校准**：一键下载当前相纸的**校准测试页**（四边从纸边开始的毫米刻度尺 + 中间 100 mm / 50 mm 参考线 + 中英文说明，300 DPI JPEG，如 `calibration-4x6.jpg`）。印一张后填入 100 mm 线的实测长度（照片和间距按 100 ÷ 实测 缩小，限制在 −15% ~ +5%）和四边各被裁掉的 mm（每边外边距 ≥ 实测裁切 + 0.5 mm）。也兼容旧的「量一张照片边长」方式。每种相纸分别记在浏览器 localStorage 里，可一键清除。
- **混排**（可选）：用一寸等小尺寸填满剩余空间。
- **导出**：JPEG（质量 0.95），文件头写入 300 DPI，文件名如 `id-photo-2x2-on-4x6.jpg`；iPhone 上可长按结果图「存储到照片」，或使用系统分享。
- **中英双语**，跟随系统深色 / 浅色模式。

## CVS 冲印：选 Fill，不要选 Crop

CVS 冲印 4×6 时会问 **Crop** 还是 **Fill**：

- **Crop** 会把整张图缩小塞进纸里，四周多出约 3 mm 白边，照片就不到 2 英寸了——**不能用**。
- **Fill** 会把整张图等比放大几个百分点，再裁掉超出纸边的部分。本工具按 **Fill** 设计。

等比放大时，6 英寸那条边两端被裁掉的是 4 英寸那条边两端的 1.5 倍（同样的百分比乘在更长的边上），所以实测左右（长边两端）明显比上下裁得多。因此默认安全边距是长边两端 3 mm、短边两端 0 mm：

- 美国 2×2 在 4×6 上默认排 **4 张**：2×2 网格、横放，上下贴着纸边，左右各留约 1 英寸。外侧照片的上/下边可能被裁掉不到 1 mm 的背景或肩膀，护照照片一般可以接受；做一次打印校准可以降到最小。美国护照申请（DS-11 / DS-82）只需要 1 张。
- 6 张 2×2 正好铺满 6×4 英寸，左右两端一定会被裁。要 **6 张都完整**：改用 **5×7**（默认排 6 张，页面上可一键切换），或者打印 2 张 4×6。
- 各尺寸默认张数（间距 2 mm，长边两端 3 mm / 短边两端 0 mm，未校准）——4×6 / 5×7：美国 2×2 **4 / 6**，中国 33×48mm 9 / 10，一寸 16 / 20，二寸 8 / 9，申根/英国/欧盟、日本 35×45mm 8 / 9，加拿大 50×70mm 4 / 4。

## 冲印步骤（CVS，约 $0.44 一张 4×6）

1. **建议先印一张校准测试页**（见下），花 $0.44 换来准确尺寸。
2. 导出 JPEG，iPhone 上存到相册。
3. CVS Photo 网站或 App → Prints → 选择和排版一致的尺寸（**4×6** 或 **5×7**），上传，裁剪方式选 **Fill**（不要选 Crop），关闭自动增强。亚光、亮面都行。
4. 取件后**一定用尺子量**：每张应正好 2 英寸（50.8 mm）。沿灰线剪开。Walgreens / Costco / Walmart 同理。

## 打印校准

无边距冲印的放大比例和裁边位置因店、因机器、因相纸尺寸而不同，所以做成了可校准的：

1. 在「排版到相纸」里展开「打印校准」，点「下载校准测试页」（按当前相纸生成，如 `calibration-4x6.jpg`）；
2. 在 CVS 用同样尺寸、选 **Fill** 冲印这一张；
3. 测试页四边各有从纸边往里的毫米刻度（1 格 1 mm，每 5 mm 标数字）：纸边处的读数就是这一边被裁掉的 mm（比如 2 号刻度没了、3 号还在 → 约 2.5）。按测试页上印的 TOP/上、BOTTOM/下、LEFT/左、RIGHT/右 填；
4. 用尺子量中间的 **100 mm** 线（两端短竖线之间），比如 103.0 mm；
5. 填回去、重新导出：照片和间距按 100 ÷ 103 缩小（2×2 从 600 px 变成 583 px），每边外边距 ≥「实测裁切 + 0.5 mm」，页面会显示「放大 +3.0% 已补偿；实测裁切 上0.8 下0.7 左2.1 右2.4 mm」。如果实测的上下裁切加余量放不下两排，页面会提示，并告诉你清空上下裁切值能放几张。

校准值按相纸分别保存。

美国官方照片要求见 [travel.state.gov](https://travel.state.gov/content/travel/en/passports/how-apply/photos.html)。本工具只保证物理尺寸正确，不保证照片一定被接受。

## 本地运行 / 测试

```bash
python3 -m http.server 8000   # 打开 http://localhost:8000/
# 端到端测试（需要 Python Playwright + Chromium + Pillow）
python3 tests/make_test_images.py /tmp/idphoto-test
python3 tests/e2e.py http://localhost:8000/ /tmp/idphoto-test docs
```

---

## English

**Live: <https://lfkdsk.github.io/id-photo-print/>**

A static, fully client-side tool that tiles an ID / passport photo onto a 4×6 or 5×7 in print at 300 DPI, so you can print it at CVS / Walgreens / Costco / Walmart for well under a dollar instead of paying ~$17 for "passport photos". Your photo never leaves the browser. Presets for US, China, Schengen/UK/EU, Japan, Canada and Chinese 1-inch/2-inch sizes plus custom sizes; crop editor with US head/eye guides; 4×6, 5×7 and A6 paper; cut lines; optional mixed sizes; JPEG export with a 300 DPI JFIF header.

**At CVS choose Fill, never Crop.** CVS asks "Crop" or "Fill" for 4×6 prints. *Crop* shrinks the whole image to fit and adds a ~3 mm white border, so the photos come out smaller than 2 in — unusable. *Fill* enlarges the image uniformly by a few percent and trims the edges; this tool is built for Fill. Because the enlargement is uniform, the ends of the 6 in side lose 1.5× as much as the ends of the 4 in side, so the left/right edges are trimmed clearly more than top/bottom.

**Per-edge safe margins.** Margins are tied to the paper's physical edges: **3 mm on the long-side ends** (left/right in landscape) and **0 mm on the short-side ends** (top/bottom) by default; portrait layouts map to the same physical edges. US 2×2 on 4×6 therefore gives **4 photos** (a 2×2 grid touching the top/bottom edges, about 1 in free at left and right; the outer photos may lose under 1 mm of background/shoulder, which is fine for passport photos) and **6 on 5×7**. Six 2×2 fill 6×4 in exactly, so for six complete ones use 5×7 (one-click switch) or two 4×6 sheets. Default counts on 4×6 / 5×7: US 2×2 4 / 6, China 33×48 9 / 10, 1-inch 16 / 20, 2-inch 8 / 9, 35×45 mm 8 / 9, Canada 50×70 4 / 4.

**Print calibration (recommended: one $0.44 test print first).** "Download test sheet" creates a 300 DPI JPEG for the selected paper (`calibration-4x6.jpg`) with mm rulers starting at every paper edge, a 100.0 mm and a 50.0 mm reference line and short bilingual instructions. Print it with Fill, read the ruler number at each paper edge (= mm trimmed there; use the TOP / BOTTOM / LEFT / RIGHT labels on the sheet) and measure the 100 mm line. Enter the numbers: photos and gaps are scaled by 100 ÷ measured (clamped to −15%…+5%) and every outer margin stays ≥ measured trim + 0.5 mm. The old "measured photo edge" input still works. Saved per paper size in localStorage. Always check the result with a ruler. Acceptance by any authority is not guaranteed.

License: [MIT](LICENSE)
