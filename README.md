# 证件照排版 · ID Photo Print

**在线使用：<https://lfkdsk.github.io/id-photo-print/>**

把护照 / 签证证件照排到一张 4×6 英寸相纸上，拿去 CVS / Walgreens 冲印只要几毛钱（约 $0.3–0.5），不用花 $16.99 买店里的 Passport Photo。

![screenshot](docs/screenshot.png)

## 功能

- **纯本地处理**：照片只在浏览器里处理，不会上传到任何服务器；无依赖、无构建、无 CDN。
- **常用尺寸**：美国护照/签证 2×2 英寸（默认）、中国护照/签证 33×48mm、一寸 25×35mm、二寸 35×49mm、申根/英国/欧盟 35×45mm、日本 35×45mm、加拿大 50×70mm，以及自定义（mm / inch）。
- **裁剪编辑**：拖动平移，双指 / 滚轮缩放，缩放滑块，±15° 旋转微调；自动按 EXIF 方向摆正 iPhone 照片。
- **参考线**：美国 2×2 显示眼睛高度带（距底边 1⅛″–1⅜″）和头部大小范围（下巴到头顶 1″–1⅜″）；其它尺寸显示中线和头部椭圆。可隐藏。
- **自动排版**：4×6（默认）、5×7、A6 相纸，300 DPI 输出（4×6 → 1800×1200 px）。自动尝试横竖两种方向取能放最多的方案；可调间距、边距，放不下时自动收紧（2×2 在 4×6 上正好 6 张）。可选灰色裁切线。
- **混排**（可选）：用一寸等小尺寸填满剩余空间。
- **导出**：JPEG（质量 0.95），文件头写入 300 DPI，文件名如 `id-photo-2x2-on-4x6.jpg`；iPhone 上可长按结果图「存储到照片」，或使用系统分享。
- **中英双语**，跟随系统深色 / 浅色模式。

## 冲印步骤（CVS）

1. 导出 JPEG，iPhone 上存到相册。
2. CVS Photo 网站或 App → Prints → **4×6**，上传。
3. **关闭**自动裁剪 / 自动增强 / Fit 等选项，保证比例不变。亚光、亮面都行。
4. 取件后用尺子确认每张正好 2 英寸，沿灰线剪开。Walgreens / Costco / Walmart 同理。

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

A static, fully client-side tool that tiles an ID / passport photo onto a 4×6 in print at 300 DPI (six 2×2 in US photos per sheet), so you can print it at CVS / Walgreens / Costco / Walmart for about $0.30–0.50 instead of paying ~$17 for "passport photos". Your photo never leaves the browser. Presets for US, China, Schengen/UK/EU, Japan, Canada and Chinese 1-inch/2-inch sizes plus custom sizes; crop editor with US head/eye guides; 4×6, 5×7 and A6 paper; cut lines; optional mixed sizes; JPEG export with a 300 DPI JFIF header. When ordering, pick a 4×6 print and turn off auto-crop / enhance. Acceptance by any authority is not guaranteed.

License: [MIT](LICENSE)
