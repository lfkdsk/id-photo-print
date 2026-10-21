/* 证件照排版 · ID Photo Print — pure client-side, no dependencies. MIT License. */
'use strict';
(() => {
  const DPI = 300;
  const MM_PER_IN = 25.4;
  const mm2px = (mm) => Math.round((mm / MM_PER_IN) * DPI);
  const $ = (id) => document.getElementById(id);

  // ---------------------------------------------------------------- data
  const PRESETS = [
    { id: 'us', w: 50.8, h: 50.8, slug: '2x2', guide: 'us',
      name: { zh: '美国护照/签证 2×2 英寸（51×51mm）', en: 'US passport / visa 2×2 in (51×51 mm)' },
      short: { zh: '2×2 英寸', en: '2×2 in' } },
    { id: 'cn', w: 33, h: 48, slug: '33x48mm',
      name: { zh: '中国护照/签证 33×48mm', en: 'China passport / visa 33×48 mm' },
      short: { zh: '33×48mm', en: '33×48 mm' } },
    { id: '1cun', w: 25, h: 35, slug: '1cun-25x35mm',
      name: { zh: '一寸 25×35mm', en: '1-inch (CN) 25×35 mm' },
      short: { zh: '一寸', en: '1-inch (25×35)' } },
    { id: '2cun', w: 35, h: 49, slug: '2cun-35x49mm',
      name: { zh: '二寸 35×49mm', en: '2-inch (CN) 35×49 mm' },
      short: { zh: '二寸', en: '2-inch (35×49)' } },
    { id: 'eu', w: 35, h: 45, slug: '35x45mm',
      name: { zh: '申根 / 英国 / 欧盟 35×45mm', en: 'Schengen / UK / EU 35×45 mm' },
      short: { zh: '35×45mm', en: '35×45 mm' } },
    { id: 'jp', w: 35, h: 45, slug: 'japan-35x45mm',
      name: { zh: '日本 35×45mm', en: 'Japan 35×45 mm' },
      short: { zh: '35×45mm', en: '35×45 mm' } },
    { id: 'ca', w: 50, h: 70, slug: '50x70mm',
      name: { zh: '加拿大 50×70mm', en: 'Canada 50×70 mm' },
      short: { zh: '50×70mm', en: '50×70 mm' } },
    { id: 'custom', w: 35, h: 45, slug: 'custom',
      name: { zh: '自定义尺寸…', en: 'Custom size…' },
      short: { zh: '自定义', en: 'custom' } },
  ];
  const PAPERS = [
    { id: '4x6', w: 152.4, h: 101.6, slug: '4x6', name: { zh: '4×6 英寸', en: '4×6 in' } },
    { id: '5x7', w: 177.8, h: 127, slug: '5x7', name: { zh: '5×7 英寸', en: '5×7 in' } },
    { id: 'a6', w: 148, h: 105, slug: 'a6', name: { zh: 'A6 105×148mm', en: 'A6 105×148 mm' } },
  ];

  // ---------------------------------------------------------------- i18n
  const I18N = {
    zh: {
      title: '证件照排版',
      subtitle: '把证件照排到 4×6 相纸上，几毛钱冲印',
      privacy: '照片只在你的浏览器本地处理，不会上传到任何服务器。',
      s1: '选择照片与尺寸', s2: '调整裁剪', s3: '排版到相纸', s4: '导出并冲印',
      upload: '选择照片 / 拍照', uploadHint: '白色或浅色背景、正面免冠，光线均匀',
      size: '证件照尺寸', width: '宽', height: '高', unit: '单位',
      editorEmpty: '先选择一张照片', cropHint: '拖动移动 · 双指或滚轮缩放',
      zoom: '缩放', rotate: '旋转', showGuides: '显示参考线', reset: '重置',
      paper: '相纸', orient: '方向', orientAuto: '自动（放最多）', orientLand: '横向', orientPort: '竖向',
      gap: '间距', margin: '边距',
      compact: '放不下时自动缩小间距/边距，多放几张',
      safe: '安全边距',
      safeHelp: '无边距冲印（CVS 等）会把整张图放大几个百分点并裁掉纸边，外边距至少留这么多。',
      safeHint: (o) => {
        const fill = o.unsafeMarginMm < 0.5
          ? `${o.unsafeMax} 张 ${o.short} 正好铺满整张 ${o.paper}`
          : `最密排 ${o.unsafeMax} 张 ${o.short} 时外边距只有 ${o.unsafeMarginMm.toFixed(1)} mm`;
        let s = `<p>${o.paper} 无边距打印会裁掉边缘、并把整张放大几个百分点；${fill}，不可能都安全。` +
          `安全排版：本纸 <b>${o.safeCount} 张</b>。</p>`;
        const sheets = o.safeCount > 0 ? `打印 ${Math.ceil(o.unsafeMax / o.safeCount)} 张 ${o.paper}` : '';
        if (o.alt) s += `<p>要 ${o.unsafeMax} 张都能用：${o.altBtn}${sheets ? '，或' + sheets : ''}。</p>`;
        else if (sheets) s += `<p>要 ${o.unsafeMax} 张都能用：${sheets}。</p>`;
        return s;
      },
      switchTo: (p) => `改用 ${p}`,
      unsafeWarn: (mm) => `⚠️ 安全边距已关闭：外边距只有 ${mm} mm。无边距冲印会放大并裁掉纸边，靠边的照片会被裁掉一部分、尺寸也会偏大，可能不能用。`,
      calibTitle: '打印校准',
      calibIntro: `<p>无边距冲印通常会把整张图放大 2–4%，印出来的照片就比标准大。校准方法：</p>
<ol><li>先按当前设置导出并打印一次；</li>
<li>用尺子量一张<b>中间</b>、四边都没被裁到的照片的宽度；</li>
<li>把量到的数字填在下面，然后重新导出、打印。</li></ol>
<p class="muted">工具会把照片（和间距）按「标准 ÷ 实测」缩小，外边距仍不小于安全边距。每种相纸分别记住。</p>`,
      calibLabel: '印出来实际量到的边长 (mm)',
      calibExpectedLabel: '标准边长（照片宽度）',
      calibReset: '清除校准',
      calibNone: '未校准，不补偿',
      calibFactor: (pct, k) => `补偿 ${pct}（×${k}）`,
      calibClamped: '（已限制在 −15% ~ +5% 之内，请确认量的是照片宽度）',
      marginInfo: (mm) => `外边距 ≥ ${mm} mm`,
      calibInfo: (pct) => `已校准 ${pct}`,
      cutlines: '灰色裁切线 / 裁切标记',
      mixed: '剩余空间用小尺寸填充', mixedSize: '填充尺寸',
      export: '生成并下载 JPEG', share: '分享 / 存储到照片', exporting: '生成中…',
      longPress: 'iPhone：长按下图 →「存储到照片」（或点上面的分享按钮），然后在 CVS / Walgreens App 里上传，冲印和排版相同的尺寸（4×6 / 5×7），并关闭自动裁剪。',
      tipsTitle: '冲印小贴士', footer: '纯静态网页，所有处理都在本地完成。',
      countMain: (n, s) => `${n} 张 ${s}`,
      countMixed: (n, s) => ` + ${n} 张 ${s}`,
      sheetInfo: (w, h, o, extra) => `${w}×${h} px · 300 DPI · ${o}${extra}`,
      land: '横向', port: '竖向',
      compacted: '为了多放几张，间距/边距已自动缩小。',
      noFit: '这个尺寸放不进所选相纸。',
      fileInfo: (n, w, h) => `${n} · ${w}×${h}`,
      exportInfo: (f, w, h, kb) => `已生成 ${f}（${w}×${h} px，300 DPI，${kb} KB）`,
      loadErr: '无法读取这张图片，请换一张 JPEG / PNG 试试。',
      legendUS: [
        ['rgba(46,204,113,.55)', '绿色带：眼睛高度（距底边 1⅛″–1⅜″）'],
        ['rgba(59,110,245,.9)', '两个虚线椭圆：头部大小范围（下巴到头顶 1″–1⅜″，即照片高度的 50%–69%）'],
      ],
      legendGeneric: [
        ['rgba(59,110,245,.9)', '虚线椭圆 / 中线：头部大致位置，具体比例请查对应国家的要求'],
      ],
      tips: `
<h3>先看这个：无边距冲印会裁边、会放大</h3>
<ul>
  <li>CVS / Walgreens 的 4×6 是<b>无边距</b>冲印：机器会把整张图放大几个百分点，超出纸边的部分直接裁掉。贴着纸边的照片会被切掉一圈，其余照片也会比标准大一点。</li>
  <li>所以默认开启<b>安全边距 3 mm</b>（可改 0–8 mm）：外边距永远不小于它。美国 2×2 在 4×6 上默认排 <b>2 张</b>，两张都完整可用。</li>
  <li>6 张 2×2 正好铺满 6×4 英寸，物理上不可能 6 张都完整。要 6 张能用的：改用 <b>5×7</b> 相纸（安全排版 6 张），或者打印 <b>3 张 4×6</b>。</li>
  <li>美国护照申请（DS-11 / DS-82）只需要<b>1 张</b>照片；一张 4×6 上的 2 张已经够用，还多一张备用。</li>
  <li>关掉安全边距可以回到「铺满」排法（4×6 上 6 张），但外圈照片会被裁，不建议。</li>
</ul>
<h3>在 CVS 冲印（约 $0.3–0.5 一张 4×6）</h3>
<ol>
  <li>点「生成并下载 JPEG」，得到一张 300 DPI 的排版图（4×6 为 1800×1200 px；iPhone 可长按图片「存储到照片」）。</li>
  <li>打开 CVS Photo 网站或 CVS App → Photo → <b>Prints</b>，选择和排版一致的尺寸（<b>4×6</b> 或 <b>5×7</b>），通常可当天门店取件。</li>
  <li>上传这张图，<b>关闭</b>所有自动裁剪 / 自动增强 / “Fit / Fill” 之类的选项，保证比例不被改。</li>
  <li>亚光（Matte）或亮面（Glossy）都可以。</li>
  <li>取件后<b>一定用尺子量</b>：美国照片每张应该正好 <b>2 英寸（50.8 mm）</b>见方。偏大就用下面的「打印校准」。然后沿灰色裁切线剪开。</li>
</ol>
<h3>打印校准（印出来偏大怎么办）</h3>
<ol>
  <li>先按默认设置打印一次。</li>
  <li>量一张<b>中间</b>、四边都没被裁到的照片的宽度，比如 52.3 mm。</li>
  <li>在第 3 步展开「打印校准」，填入 52.3。工具会把照片和间距按 50.8 ÷ 52.3 缩小（补偿约 −2.9%），外边距仍不小于安全边距。</li>
  <li>重新导出、再打印，再量一次。不同相纸（4×6 / 5×7 / A6）的放大比例可能不同，所以每种相纸分别记住。</li>
</ol>
<p>Walgreens、Costco、Walmart 的冲印同样可以，流程类似；不要选它们的「Passport Photo」服务（那个要 $15+）。</p>
<h3>官方要求（美国护照 / 签证）</h3>
<ul>
  <li>白色或米白色纯色背景，6 个月内拍摄。</li>
  <li>不戴眼镜，表情自然（不露齿或微笑都行，双眼睁开），正面对镜头，不戴帽子 / 头饰（宗教或医疗原因除外）。</li>
  <li>头部（下巴到头顶）1–1⅜ 英寸，眼睛距底边 1⅛–1⅜ 英寸——用上面的参考线对齐即可。</li>
  <li>完整要求见美国国务院官网：<a href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html" target="_blank" rel="noopener">travel.state.gov · Passport Photos</a>。其它国家请查各自官网。</li>
</ul>
<p class="warn">⚠️ 免责声明：本工具只负责按正确的物理尺寸排版，不保证照片一定会被护照/签证机构接受。背景、光线、表情、清晰度等都需要你自己确认符合要求。</p>
`,
    },
    en: {
      title: 'ID Photo Print',
      subtitle: 'Tile passport photos on a 4×6 print for under $0.50',
      privacy: 'Your photo is processed locally in your browser and is never uploaded anywhere.',
      s1: 'Photo & size', s2: 'Crop', s3: 'Layout on paper', s4: 'Export & print',
      upload: 'Choose photo / take one', uploadHint: 'Plain white/light background, facing the camera, even lighting',
      size: 'Photo size', width: 'Width', height: 'Height', unit: 'Unit',
      editorEmpty: 'Choose a photo first', cropHint: 'Drag to move · pinch or scroll to zoom',
      zoom: 'Zoom', rotate: 'Rotate', showGuides: 'Show guides', reset: 'Reset',
      paper: 'Paper', orient: 'Orientation', orientAuto: 'Auto (fit most)', orientLand: 'Landscape', orientPort: 'Portrait',
      gap: 'Gap', margin: 'Margin',
      compact: 'Shrink gap/margin automatically if it fits more photos',
      safe: 'Safe margin',
      safeHelp: 'Borderless prints (CVS etc.) enlarge the whole image a few percent and trim the paper edges — keep at least this much outer margin.',
      safeHint: (o) => {
        const fill = o.unsafeMarginMm < 0.5
          ? `${o.unsafeMax} × ${o.short} exactly fill the whole ${o.paper} sheet`
          : `packing ${o.unsafeMax} × ${o.short} leaves only ${o.unsafeMarginMm.toFixed(1)} mm of outer margin`;
        let s = `<p>Borderless ${o.paper} prints trim the edges and enlarge the image a few percent; ${fill}, so they can't all be safe. ` +
          `Safe layout: <b>${o.safeCount}</b> on this paper.</p>`;
        const sheets = o.safeCount > 0 ? `print ${Math.ceil(o.unsafeMax / o.safeCount)} sheets of ${o.paper}` : '';
        if (o.alt) s += `<p>To get ${o.unsafeMax} usable photos: ${o.altBtn}${sheets ? ', or ' + sheets : ''}.</p>`;
        else if (sheets) s += `<p>To get ${o.unsafeMax} usable photos: ${sheets}.</p>`;
        return s;
      },
      switchTo: (p) => `Use ${p}`,
      unsafeWarn: (mm) => `⚠️ Safe margin is off: outer margin is only ${mm} mm. Borderless printing enlarges and trims the edges, so the outer photos will be cut and come out too large — they may be unusable.`,
      calibTitle: 'Print calibration',
      calibIntro: `<p>Borderless printing usually enlarges the whole image by 2–4%, so photos come out too big. To calibrate:</p>
<ol><li>Export and print once with the current settings;</li>
<li>With a ruler, measure the width of a <b>center</b> photo whose edges were not trimmed;</li>
<li>Enter that number below, then export and print again.</li></ol>
<p class="muted">Photos (and gaps) are scaled by expected ÷ measured; outer margins still stay ≥ the safe margin. Saved separately for each paper size.</p>`,
      calibLabel: 'Measured edge length on the print (mm)',
      calibExpectedLabel: 'Expected (photo width)',
      calibReset: 'Reset',
      calibNone: 'Not calibrated — no compensation',
      calibFactor: (pct, k) => `Compensation ${pct} (×${k})`,
      calibClamped: ' (limited to −15% … +5% — make sure you measured the photo width)',
      marginInfo: (mm) => `margin ≥ ${mm} mm`,
      calibInfo: (pct) => `calibrated ${pct}`,
      cutlines: 'Thin gray cut lines / crop marks',
      mixed: 'Fill leftover space with a smaller size', mixedSize: 'Filler size',
      export: 'Create & download JPEG', share: 'Share / Save to Photos', exporting: 'Rendering…',
      longPress: 'iPhone: long-press the image below → "Save to Photos" (or use Share above), then upload it in the CVS / Walgreens app and order the same print size as the layout (4×6 / 5×7), with auto-crop off.',
      tipsTitle: 'Printing tips', footer: 'Static page — everything runs locally in your browser.',
      countMain: (n, s) => `${n} × ${s}`,
      countMixed: (n, s) => ` + ${n} × ${s}`,
      sheetInfo: (w, h, o, extra) => `${w}×${h} px · 300 DPI · ${o}${extra}`,
      land: 'landscape', port: 'portrait',
      compacted: 'Gap/margin were reduced automatically to fit more photos.',
      noFit: 'This photo size does not fit on the selected paper.',
      fileInfo: (n, w, h) => `${n} · ${w}×${h}`,
      exportInfo: (f, w, h, kb) => `Created ${f} (${w}×${h} px, 300 DPI, ${kb} KB)`,
      loadErr: 'Could not read this image. Please try a JPEG or PNG.',
      legendUS: [
        ['rgba(46,204,113,.55)', 'Green band: eye level (1⅛″–1⅜″ from the bottom)'],
        ['rgba(59,110,245,.9)', 'Dashed ovals: allowed head size (chin to crown 1″–1⅜″, i.e. 50–69% of the height)'],
      ],
      legendGeneric: [
        ['rgba(59,110,245,.9)', 'Dashed oval / center line: rough head position — check your country\'s exact rules'],
      ],
      tips: `
<h3>Read this first: borderless prints are cropped and enlarged</h3>
<ul>
  <li>CVS / Walgreens 4×6 prints are <b>borderless</b>: the machine enlarges the whole image by a few percent and cuts off whatever falls past the paper edge. Photos touching the edge lose a strip, and the rest come out slightly too large.</li>
  <li>That's why a <b>3 mm safe margin</b> is on by default (editable 0–8 mm): the outer margin never goes below it. US 2×2 on 4×6 therefore gives <b>2 photos</b>, both complete.</li>
  <li>Six 2×2 photos fill 6×4 in exactly, so six usable photos on one 4×6 is physically impossible. Need 6? Use <b>5×7</b> paper (6 fit safely) or print <b>three 4×6 sheets</b>.</li>
  <li>A US passport application (DS-11 / DS-82) needs only <b>1 photo</b>, so the 2 on one 4×6 already give you a spare.</li>
  <li>Turning the safe margin off brings back edge-to-edge packing (6 on 4×6), but the outer photos will be trimmed — not recommended.</li>
</ul>
<h3>Printing at CVS (about $0.30–0.50 per 4×6)</h3>
<ol>
  <li>Tap "Create &amp; download JPEG" to get a 300 DPI sheet (1800×1200 px for 4×6; on iPhone, long-press the image → Save to Photos).</li>
  <li>Open the CVS Photo website or the CVS app → Photo → <b>Prints</b> and pick the same size as the layout (<b>4×6</b> or <b>5×7</b>); usually same-day in-store pickup.</li>
  <li>Upload the sheet and turn <b>OFF</b> any auto-crop / auto-enhance / "fit / fill" options so the scale isn't changed.</li>
  <li>Matte or glossy are both fine.</li>
  <li>After pickup, <b>always measure with a ruler</b>: each US photo must be exactly <b>2 inches (50.8 mm)</b> square. If it's too big, use Print calibration below. Then cut along the gray lines.</li>
</ol>
<h3>Print calibration (photos came out too big)</h3>
<ol>
  <li>Print once with the default settings.</li>
  <li>Measure the width of a <b>center</b> photo whose edges weren't trimmed, e.g. 52.3 mm.</li>
  <li>In step 3, open "Print calibration" and enter 52.3. Photos and gaps are scaled by 50.8 ÷ 52.3 (about −2.9%), and outer margins still stay ≥ the safe margin.</li>
  <li>Export, print and measure again. Enlargement can differ per paper size (4×6 / 5×7 / A6), so it's saved per paper.</li>
</ol>
<p>Walgreens, Costco and Walmart prints work the same way. Don't order their "Passport Photo" product — that's the $15+ one.</p>
<h3>Official requirements (US passport / visa)</h3>
<ul>
  <li>Plain white or off-white background, taken within the last 6 months.</li>
  <li>No glasses, neutral expression (or a natural smile, both eyes open), facing the camera, no hats/head coverings unless for religious or medical reasons.</li>
  <li>Head (chin to crown) 1–1⅜ in, eyes 1⅛–1⅜ in from the bottom — line them up with the guides above.</li>
  <li>Full rules: <a href="https://travel.state.gov/content/travel/en/passports/how-apply/photos.html" target="_blank" rel="noopener">travel.state.gov · Passport Photos</a>. For other countries, check their official sites.</li>
</ul>
<p class="warn">⚠️ Disclaimer: this tool only lays photos out at the correct physical size. Acceptance by any passport/visa authority is not guaranteed — background, lighting, expression and sharpness are up to you.</p>
`,
    },
  };
  let lang = 'zh';
  try { const s = localStorage.getItem('idphoto.lang'); if (s === 'en' || s === 'zh') lang = s; } catch (_) { /* ignore */ }
  const t = (k) => I18N[lang][k];

  // ---------------------------------------------------------------- state
  const state = {
    src: null,        // full-resolution drawable (ImageBitmap / canvas / img)
    preview: null,    // downscaled canvas for interactive rendering
    imgW: 0, imgH: 0, fileName: '',
    crop: { cx: 0, cy: 0, span: 1, rot: 0 }, // span = image px covered by the tile height
    exportUrl: null, exportFile: null,
  };

  const el = {
    file: $('file'), fileInfo: $('fileInfo'), preset: $('preset'), customRow: $('customRow'),
    customW: $('customW'), customH: $('customH'), customUnit: $('customUnit'),
    editorWrap: $('editorWrap'), editor: $('editor'), editorCanvas: $('editorCanvas'), editorEmpty: $('editorEmpty'),
    zoom: $('zoom'), zoomOut: $('zoomOut'), rot: $('rot'), rotOut: $('rotOut'), guides: $('guides'),
    resetCrop: $('resetCrop'), guideLegend: $('guideLegend'),
    paper: $('paper'), orient: $('orient'), gap: $('gap'), margin: $('margin'), compact: $('compact'),
    safe: $('safe'), safeMm: $('safeMm'), safeHint: $('safeHint'), safeWarn: $('safeWarn'),
    calib: $('calib'), calibBadge: $('calibBadge'), calibMeasured: $('calibMeasured'), calibExpected: $('calibExpected'),
    calibFactor: $('calibFactor'), calibReset: $('calibReset'),
    cutlines: $('cutlines'), mixed: $('mixed'), mixedRow: $('mixedRow'), mixedPreset: $('mixedPreset'),
    sheetCanvas: $('sheetCanvas'), count: $('count'), sheetInfo: $('sheetInfo'), layoutNote: $('layoutNote'),
    exportBtn: $('exportBtn'), shareBtn: $('shareBtn'), exportInfo: $('exportInfo'),
    resultWrap: $('resultWrap'), resultImg: $('resultImg'), langBtn: $('langBtn'),
  };

  // ---------------------------------------------------------------- helpers
  const num = (input, def) => { const v = parseFloat(input.value); return Number.isFinite(v) ? v : def; };
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

  function currentPreset() {
    const p = PRESETS.find((x) => x.id === el.preset.value) || PRESETS[0];
    if (p.id !== 'custom') return p;
    const f = el.customUnit.value === 'in' ? MM_PER_IN : 1;
    const w = clamp(num(el.customW, 35) * f, 5, 200);
    const h = clamp(num(el.customH, 45) * f, 5, 200);
    const unit = el.customUnit.value;
    const label = `${num(el.customW, 35)}×${num(el.customH, 45)}${unit === 'in' ? (lang === 'zh' ? ' 英寸' : ' in') : 'mm'}`;
    return { ...p, w, h, slug: `${num(el.customW, 35)}x${num(el.customH, 45)}${unit}`, short: { zh: label, en: label } };
  }
  const currentPaper = () => PAPERS.find((x) => x.id === el.paper.value) || PAPERS[0];
  const mixedPreset = () => PRESETS.find((x) => x.id === el.mixedPreset.value) || PRESETS[2];

  // ---------------------------------------------------------------- persistence
  const store = {
    get(k) { try { return localStorage.getItem('idphoto.' + k); } catch (_) { return null; } },
    set(k, v) { try { if (v == null) localStorage.removeItem('idphoto.' + k); else localStorage.setItem('idphoto.' + k, v); } catch (_) { /* ignore */ } },
  };

  // ---------------------------------------------------------------- calibration
  // Per paper: { measured, expected } in mm, i.e. a tile that should be `expected` wide printed `measured` wide.
  let calib = {};
  try { calib = JSON.parse(store.get('calib') || '{}') || {}; } catch (_) { calib = {}; }
  const CAL_MIN = 0.85, CAL_MAX = 1.05;
  function calibFor(paper) {
    const c = calib[paper.id];
    if (!c || !(c.measured > 0) || !(c.expected > 0)) return { k: 1, raw: 1, active: false };
    const raw = c.expected / c.measured;
    return { k: clamp(raw, CAL_MIN, CAL_MAX), raw, active: true };
  }
  const fmtPct = (k) => { const v = Math.round((k - 1) * 1000) / 10; return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1) + '%'; };
  const fmtMm = (v) => String(Math.round(v * 10) / 10);

  // ---------------------------------------------------------------- layout
  // Fit n tiles of size `size` along length L (all px). Preferred gap g / margin m; when `compact`,
  // gap may shrink down to minGap and margin down to minMargin to fit more tiles.
  function fitAxis(L, size, g, m, compact, minGap, minMargin) {
    let n = size <= L - 2 * m ? Math.floor((L - 2 * m + g) / (size + g) + 1e-9) : 0;
    let gap = g;
    let squeezed = false;
    if (compact) {
      const n0 = size <= L - 2 * minMargin ? Math.floor((L - 2 * minMargin + minGap) / (size + minGap) + 1e-9) : 0;
      if (n0 > n) {
        n = n0; squeezed = true;
        const left = L - n * size;
        if (n > 1) {
          const even = Math.floor(left / (n + 1));                        // gap == margin
          const tight = Math.floor((left - 2 * minMargin) / (n - 1));     // margin pinned at minMargin
          gap = Math.min(g, Math.max(minGap, Math.min(even, tight)));
        }
      }
    }
    if (n <= 1) gap = 0;
    const used = n > 0 ? n * size + (n - 1) * gap : 0;
    return { n, gap, used, start: Math.floor((L - used) / 2), squeezed };
  }

  function gridTiles(grid) {
    const out = [];
    for (let j = 0; j < grid.ny; j++) {
      for (let i = 0; i < grid.nx; i++) {
        out.push({ x: grid.x0 + i * (grid.tw + grid.gx), y: grid.y0 + j * (grid.th + grid.gy), w: grid.tw, h: grid.th, preset: grid.preset });
      }
    }
    return out;
  }

  const safeMmValue = () => clamp(num(el.safeMm, 3), 0, 8);

  // `over` overrides UI settings: { paper, safe, compact, mixed }
  function computeLayout(over = {}) {
    const paper = over.paper || currentPaper();
    const preset = currentPreset();
    const safe = over.safe != null ? over.safe : el.safe.checked;
    const compact = over.compact != null ? over.compact : el.compact.checked;
    const mixed = over.mixed != null ? over.mixed : el.mixed.checked;
    const cal = calibFor(paper);
    const k = cal.k;
    const long = mm2px(Math.max(paper.w, paper.h));
    const short = mm2px(Math.min(paper.w, paper.h));
    const px = (mm) => Math.round((mm / MM_PER_IN) * DPI * k); // calibrated (pre-shrunk) size
    const tw = px(preset.w), th = px(preset.h);
    const g = px(clamp(num(el.gap, 2), 0, 20));
    const safePx = safe ? mm2px(safeMmValue()) : 0;
    const m = Math.max(mm2px(clamp(num(el.margin, 2), 0, 20)), safePx);
    const minGap = safe ? Math.min(g, Math.max(1, px(0.5))) : 0;
    const minMargin = safePx;
    const o = el.orient.value;
    const cands = [];
    if (o !== 'portrait') cands.push({ W: long, H: short, orient: 'landscape' });
    if (o !== 'landscape') cands.push({ W: short, H: long, orient: 'portrait' });
    let best = null;
    for (const c of cands) {
      const ax = fitAxis(c.W, tw, g, m, compact, minGap, minMargin);
      const ay = fitAxis(c.H, th, g, m, compact, minGap, minMargin);
      const count = ax.n * ay.n;
      if (!best || count > best.count) best = { ...c, ax, ay, count };
    }
    const { W, H, ax, ay } = best;
    const main = { x0: ax.start, y0: ay.start, nx: ax.n, ny: ay.n, tw, th, gx: ax.gap, gy: ay.gap, preset };
    let grids = best.count > 0 ? [main] : [];

    // Mixed mode: push the main grid to the top-left and fill the right / bottom strips.
    if (mixed && best.count > 0) {
      const sp = mixedPreset();
      const sw = px(sp.w), sh = px(sp.h);
      const x0 = Math.max(Math.min(ax.start, m), minMargin), y0 = Math.max(Math.min(ay.start, m), minMargin);
      const gx = Math.max(ax.gap, g), gy = Math.max(ay.gap, g);
      const mainR = x0 + ax.used, mainB = y0 + ay.used;
      const extra = [];
      // right strip (full height)
      const rStart = mainR + gx;
      const rLen = W - m - rStart;
      if (rLen >= sw) {
        const nx = Math.floor((rLen + g) / (sw + g) + 1e-9);
        const fy = fitAxis(H, sh, g, m, compact, minGap, minMargin);
        if (nx > 0 && fy.n > 0) extra.push({ x0: rStart, y0: fy.start, nx, ny: fy.n, tw: sw, th: sh, gx: g, gy: fy.gap, preset: sp });
      }
      // bottom strip (under the main grid)
      const bStart = mainB + gy;
      const bLen = H - m - bStart;
      if (bLen >= sh) {
        const ny = Math.floor((bLen + g) / (sh + g) + 1e-9);
        const nx = Math.floor((ax.used + g) / (sw + g) + 1e-9);
        if (nx > 0 && ny > 0) extra.push({ x0, y0: bStart, nx, ny, tw: sw, th: sh, gx: g, gy: g, preset: sp });
      }
      if (extra.length) grids = [{ ...main, x0, y0 }, ...extra];
    }
    const tiles = grids.flatMap(gridTiles);
    const mainCount = best.count;
    let minM = Infinity;
    for (const r of tiles) minM = Math.min(minM, r.x, r.y, W - r.x - r.w, H - r.y - r.h);
    if (!tiles.length) minM = 0;
    return { W, H, orient: best.orient, grids, tiles, mainCount, extraCount: tiles.length - mainCount,
      preset, paper, squeezed: ax.squeezed || ay.squeezed, safe, safePx, k, cal, minMargin: minM };
  }

  // Compare the safe layout against the densest (unsafe) one and look for a paper that fits that many safely.
  function safetyAdvice(layout) {
    if (!layout.safe) return null;
    const unsafe = computeLayout({ safe: false, compact: true, mixed: false });
    if (unsafe.mainCount <= layout.mainCount) return null;
    const cur = layout.paper;
    const area = (p) => p.w * p.h;
    const alt = PAPERS.filter((p) => p.id !== cur.id && area(p) >= area(cur))
      .sort((a, b) => area(a) - area(b))
      .find((p) => computeLayout({ paper: p, mixed: false }).mainCount >= unsafe.mainCount) || null;
    return { unsafeMax: unsafe.mainCount, unsafeMarginMm: (unsafe.minMargin / DPI) * MM_PER_IN, safeCount: layout.mainCount, alt };
  }

  // ---------------------------------------------------------------- rendering
  // Render the cropped photo for a w×h tile into ctx at (x, y).
  function drawCrop(ctx, src, x, y, w, h) {
    const c = state.crop;
    ctx.save();
    ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip();
    ctx.fillStyle = '#ffffff'; ctx.fillRect(x, y, w, h);
    if (src) {
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      ctx.translate(x + w / 2, y + h / 2);
      const s = h / c.span;
      ctx.scale(s, s);
      ctx.rotate((c.rot * Math.PI) / 180);
      ctx.drawImage(src, -c.cx, -c.cy, state.imgW, state.imgH);
    }
    ctx.restore();
  }

  function drawPlaceholder(ctx, x, y, w, h) {
    ctx.save();
    ctx.fillStyle = '#eef1f5'; ctx.fillRect(x, y, w, h);
    ctx.fillStyle = '#c9d0da';
    const cx = x + w / 2, r = Math.min(w, h) * 0.17;
    ctx.beginPath(); ctx.arc(cx, y + h * 0.38, r, 0, Math.PI * 2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, y + h * 1.0, w * 0.36, h * 0.36, 0, Math.PI, 0); ctx.fill();
    ctx.restore();
  }

  // High-quality tile: render at a larger size, then halve repeatedly (avoids aliasing when downscaling big photos).
  function renderTileCanvas(src, w, h) {
    const cv = document.createElement('canvas');
    cv.width = w; cv.height = h;
    const ctx = cv.getContext('2d');
    if (!src) { drawPlaceholder(ctx, 0, 0, w, h); return cv; }
    const srcPerDst = (state.crop.span / h) * (src.width / state.imgW || 1);
    let k = 1;
    while (k < 8 && srcPerDst / k > 2 && w * k * 2 * h * k * 2 <= 16e6) k *= 2;
    if (k === 1) { drawCrop(ctx, src, 0, 0, w, h); return cv; }
    let cur = document.createElement('canvas');
    cur.width = w * k; cur.height = h * k;
    drawCrop(cur.getContext('2d'), src, 0, 0, cur.width, cur.height);
    while (k > 1) {
      k /= 2;
      const nxt = k === 1 ? cv : document.createElement('canvas');
      nxt.width = w * k; nxt.height = h * k;
      const nctx = nxt.getContext('2d');
      nctx.imageSmoothingEnabled = true; nctx.imageSmoothingQuality = 'high';
      nctx.drawImage(cur, 0, 0, nxt.width, nxt.height);
      cur = nxt;
    }
    return cv;
  }

  function drawCutLines(ctx, layout, scale) {
    const lw = Math.max(1, Math.round(2 * scale));
    const ext = mm2px(4) * scale;
    const R = layout.tiles.map((r) => ({ x: r.x * scale, y: r.y * scale, w: r.w * scale, h: r.h * scale }));
    ctx.save();
    ctx.strokeStyle = '#a8a8a8';
    ctx.lineWidth = lw;
    // 1) edge extensions, visible only outside the photos (gaps & margins)
    ctx.beginPath();
    ctx.rect(0, 0, layout.W * scale, layout.H * scale);
    for (const r of R) ctx.rect(r.x, r.y, r.w, r.h);
    ctx.clip('evenodd');
    ctx.beginPath();
    const o = lw / 2;
    for (const r of R) {
      ctx.moveTo(r.x - ext, r.y - o); ctx.lineTo(r.x + r.w + ext, r.y - o);
      ctx.moveTo(r.x - ext, r.y + r.h + o); ctx.lineTo(r.x + r.w + ext, r.y + r.h + o);
      ctx.moveTo(r.x - o, r.y - ext); ctx.lineTo(r.x - o, r.y + r.h + ext);
      ctx.moveTo(r.x + r.w + o, r.y - ext); ctx.lineTo(r.x + r.w + o, r.y + r.h + ext);
    }
    ctx.stroke();
    ctx.restore();
    // 2) where photos touch (no gap), draw a hairline on the shared boundary
    ctx.save();
    ctx.strokeStyle = 'rgba(160,160,160,.9)';
    ctx.lineWidth = Math.max(1, Math.round(scale * 2));
    ctx.beginPath();
    for (const gr of layout.grids) {
      const gx = gr.gx * scale, gy = gr.gy * scale;
      const x0 = gr.x0 * scale, y0 = gr.y0 * scale, tw = gr.tw * scale, th = gr.th * scale;
      const totalW = gr.nx * tw + (gr.nx - 1) * gx, totalH = gr.ny * th + (gr.ny - 1) * gy;
      if (gr.gx < 3) for (let i = 1; i < gr.nx; i++) { const x = x0 + i * tw + (i - 0.5) * gx; ctx.moveTo(x, y0); ctx.lineTo(x, y0 + totalH); }
      if (gr.gy < 3) for (let j = 1; j < gr.ny; j++) { const y = y0 + j * th + (j - 0.5) * gy; ctx.moveTo(x0, y); ctx.lineTo(x0 + totalW, y); }
    }
    ctx.stroke();
    ctx.restore();
  }

  function renderSheet(ctx, layout, scale, src) {
    const W = Math.round(layout.W * scale), H = Math.round(layout.H * scale);
    ctx.save();
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, W, H);
    const cache = new Map();
    for (const tl of layout.tiles) {
      const x = Math.round(tl.x * scale), y = Math.round(tl.y * scale);
      const w = Math.round((tl.x + tl.w) * scale) - x, h = Math.round((tl.y + tl.h) * scale) - y;
      const key = `${w}x${h}`;
      if (!cache.has(key)) cache.set(key, renderTileCanvas(src, w, h));
      ctx.drawImage(cache.get(key), x, y);
    }
    if (el.cutlines.checked) drawCutLines(ctx, layout, scale);
    ctx.restore();
  }

  // ---------------------------------------------------------------- editor
  const editor = { cssW: 0, cssH: 0, dpr: 1 };

  function sizeEditor() {
    const p = currentPreset();
    const aspect = p.w / p.h;
    const maxW = Math.min(el.editorWrap.clientWidth || 320, 440);
    const maxH = Math.max(220, Math.min(window.innerHeight * 0.55, 520));
    let w = maxW, h = w / aspect;
    if (h > maxH) { h = maxH; w = h * aspect; }
    w = Math.round(w); h = Math.round(h);
    editor.cssW = w; editor.cssH = h;
    editor.dpr = Math.min(window.devicePixelRatio || 1, 3);
    el.editor.style.width = w + 'px';
    el.editor.style.height = h + 'px';
    el.editorCanvas.width = Math.round(w * editor.dpr);
    el.editorCanvas.height = Math.round(h * editor.dpr);
  }

  function drawEditor() {
    const ctx = el.editorCanvas.getContext('2d');
    const { cssW: w, cssH: h, dpr } = editor;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, el.editorCanvas.width, el.editorCanvas.height);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    if (state.src) drawCrop(ctx, state.preview || state.src, 0, 0, w, h);
    if (state.src && el.guides.checked) drawGuides(ctx, w, h);
  }

  function drawGuides(ctx, w, h) {
    const p = currentPreset();
    ctx.save();
    ctx.lineWidth = 1.5;
    // center line
    ctx.strokeStyle = 'rgba(255,255,255,.75)';
    ctx.setLineDash([4, 4]);
    ctx.beginPath(); ctx.moveTo(w / 2, 0); ctx.lineTo(w / 2, h); ctx.stroke();
    const oval = (top, hh, color) => {
      const ry = (hh * h) / 2, rx = ry * 0.74;
      ctx.strokeStyle = color;
      ctx.beginPath(); ctx.ellipse(w / 2, top * h + ry, rx, ry, 0, 0, Math.PI * 2); ctx.stroke();
    };
    if (p.guide === 'us') {
      // eye band: 1 1/8" – 1 3/8" from the bottom of a 2" photo
      const yTop = h * (1 - 1.375 / 2), yBot = h * (1 - 1.125 / 2);
      ctx.setLineDash([]);
      ctx.fillStyle = 'rgba(46,204,113,.18)';
      ctx.fillRect(0, yTop, w, yBot - yTop);
      ctx.strokeStyle = 'rgba(46,204,113,.9)';
      ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(0, yTop); ctx.lineTo(w, yTop); ctx.moveTo(0, yBot); ctx.lineTo(w, yBot); ctx.stroke();
      // head size band: 50%–69% of the height, eyes ~47% down from the crown
      const eye = 0.375;
      ctx.lineWidth = 2;
      oval(eye - 0.47 * 0.5, 0.5, 'rgba(59,110,245,.95)');
      oval(eye - 0.47 * 0.69, 0.69, 'rgba(59,110,245,.95)');
      // crown & chin zones on the right edge
      const zone = (a, b, label) => {
        ctx.setLineDash([]);
        ctx.fillStyle = 'rgba(59,110,245,.35)';
        ctx.fillRect(w - 8, a * h, 8, (b - a) * h);
        ctx.fillStyle = '#1d4ed8';
        ctx.font = '700 11px -apple-system, system-ui, sans-serif';
        ctx.textAlign = 'right'; ctx.textBaseline = 'middle';
        ctx.shadowColor = 'rgba(255,255,255,1)'; ctx.shadowBlur = 4;
        ctx.fillText(label, w - 12, ((a + b) / 2) * h);
        ctx.shadowBlur = 0;
      };
      zone(eye - 0.47 * 0.69, eye - 0.47 * 0.5, lang === 'zh' ? '头顶' : 'crown');
      zone(eye + 0.53 * 0.5, eye + 0.53 * 0.69, lang === 'zh' ? '下巴' : 'chin');
      ctx.fillStyle = '#047857';
      ctx.font = '700 11px -apple-system, system-ui, sans-serif';
      ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
      ctx.shadowColor = 'rgba(255,255,255,1)'; ctx.shadowBlur = 4;
      ctx.fillText(lang === 'zh' ? '眼睛' : 'eyes', 6, (yTop + yBot) / 2);
    } else {
      ctx.lineWidth = 2;
      oval(0.09, 0.62, 'rgba(59,110,245,.95)');
      ctx.strokeStyle = 'rgba(46,204,113,.9)';
      ctx.setLineDash([6, 4]);
      const ey = (0.09 + 0.47 * 0.62) * h;
      ctx.beginPath(); ctx.moveTo(0, ey); ctx.lineTo(w, ey); ctx.stroke();
    }
    ctx.restore();
  }

  function updateLegend() {
    const items = currentPreset().guide === 'us' ? t('legendUS') : t('legendGeneric');
    el.guideLegend.innerHTML = items.map(([c, s]) => `<div><span class="sw" style="background:${c}"></span>${s}</div>`).join('');
    el.guideLegend.hidden = !el.guides.checked;
  }

  // crop math -----------------------------------------------------------
  function baseSpan() {
    const p = currentPreset();
    const a = p.w / p.h;
    return Math.min(state.imgH, state.imgW / a); // "cover" fit
  }
  const zoomFromSlider = (v) => 0.5 * Math.pow(12, v / 1000);
  const sliderFromZoom = (z) => (1000 * Math.log(z / 0.5)) / Math.log(12);
  const currentZoom = () => baseSpan() / state.crop.span;

  function syncCropUI() {
    const z = currentZoom();
    el.zoom.value = String(Math.round(clamp(sliderFromZoom(z), 0, 1000)));
    el.zoomOut.textContent = z.toFixed(2) + '×';
    el.rot.value = String(state.crop.rot);
    el.rotOut.textContent = (Math.round(state.crop.rot * 10) / 10) + '°';
  }

  function resetCrop() {
    if (!state.src) return;
    state.crop = { cx: state.imgW / 2, cy: state.imgH / 2, span: baseSpan(), rot: 0 };
    lastBase = baseSpan();
    syncCropUI();
    scheduleRender();
  }

  // rotate a screen vector into image space (inverse of the draw rotation)
  function toImageVec(dx, dy) {
    const a = (-state.crop.rot * Math.PI) / 180;
    const s = editor.cssH / state.crop.span; // css px per image px
    return { x: (dx * Math.cos(a) - dy * Math.sin(a)) / s, y: (dx * Math.sin(a) + dy * Math.cos(a)) / s };
  }

  function pan(dx, dy) {
    const v = toImageVec(dx, dy);
    state.crop.cx -= v.x; state.crop.cy -= v.y;
  }

  function zoomAt(factor, px, py) {
    // px, py: css px relative to the viewport center
    const bs = baseSpan();
    const newSpan = clamp(state.crop.span / factor, bs / 6, bs / 0.5);
    const v1 = toImageVec(px, py);
    const ix = state.crop.cx + v1.x, iy = state.crop.cy + v1.y;
    state.crop.span = newSpan;
    const v2 = toImageVec(px, py);
    state.crop.cx = ix - v2.x; state.crop.cy = iy - v2.y;
  }

  // pointer / wheel ------------------------------------------------------
  const pointers = new Map();
  const cv = el.editorCanvas;
  const rel = (e) => { const r = cv.getBoundingClientRect(); return { x: e.clientX - r.left - r.width / 2, y: e.clientY - r.top - r.height / 2 }; };
  cv.addEventListener('pointerdown', (e) => {
    if (!state.src) return;
    e.preventDefault();
    try { cv.setPointerCapture(e.pointerId); } catch (_) { /* ignore */ }
    pointers.set(e.pointerId, rel(e));
  });
  cv.addEventListener('pointermove', (e) => {
    if (!pointers.has(e.pointerId)) return;
    e.preventDefault();
    const now = rel(e);
    if (pointers.size === 1) {
      const prev = pointers.get(e.pointerId);
      pan(now.x - prev.x, now.y - prev.y);
    } else if (pointers.size === 2) {
      const [idA, idB] = [...pointers.keys()];
      const other = pointers.get(idA === e.pointerId ? idB : idA);
      const prev = pointers.get(e.pointerId);
      const d0 = Math.hypot(prev.x - other.x, prev.y - other.y);
      const d1 = Math.hypot(now.x - other.x, now.y - other.y);
      const m0 = { x: (prev.x + other.x) / 2, y: (prev.y + other.y) / 2 };
      const m1 = { x: (now.x + other.x) / 2, y: (now.y + other.y) / 2 };
      if (d0 > 4) zoomAt(d1 / d0, m0.x, m0.y);
      pan(m1.x - m0.x, m1.y - m0.y);
    }
    pointers.set(e.pointerId, now);
    syncCropUI();
    scheduleRender();
  });
  const endPtr = (e) => { pointers.delete(e.pointerId); };
  cv.addEventListener('pointerup', endPtr);
  cv.addEventListener('pointercancel', endPtr);
  cv.addEventListener('lostpointercapture', endPtr);
  cv.addEventListener('wheel', (e) => {
    if (!state.src) return;
    e.preventDefault();
    const p = rel(e);
    const dy = e.deltaMode === 1 ? e.deltaY * 16 : e.deltaY;
    zoomAt(Math.exp(-dy * 0.0015), p.x, p.y);
    syncCropUI();
    scheduleRender();
  }, { passive: false });
  ['gesturestart', 'gesturechange'].forEach((n) => el.editor.addEventListener(n, (e) => e.preventDefault()));

  el.zoom.addEventListener('input', () => {
    if (!state.src) return;
    const z = zoomFromSlider(+el.zoom.value);
    zoomAt(state.crop.span / (baseSpan() / z), 0, 0);
    el.zoomOut.textContent = currentZoom().toFixed(2) + '×';
    scheduleRender();
  });
  el.rot.addEventListener('input', () => {
    state.crop.rot = +el.rot.value;
    el.rotOut.textContent = (Math.round(state.crop.rot * 10) / 10) + '°';
    scheduleRender();
  });
  el.guides.addEventListener('change', () => { updateLegend(); scheduleRender(); });
  el.resetCrop.addEventListener('click', resetCrop);

  // ---------------------------------------------------------------- image loading
  async function decode(file) {
    if (window.createImageBitmap) {
      try { return await createImageBitmap(file, { imageOrientation: 'from-image' }); } catch (_) { /* fall back */ }
      try { return await createImageBitmap(file); } catch (_) { /* fall back */ }
    }
    // <img> honours EXIF orientation in all modern browsers (CSS image-orientation: from-image)
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.decoding = 'async';
      img.src = url;
      await img.decode();
      return img;
    } finally {
      setTimeout(() => URL.revokeObjectURL(url), 1000);
    }
  }

  async function loadFile(file) {
    if (!file) return;
    let src;
    try { src = await decode(file); } catch (err) {
      console.warn(err);
      alert(t('loadErr'));
      return;
    }
    const w = src.width || src.naturalWidth, h = src.height || src.naturalHeight;
    state.src = src; state.imgW = w; state.imgH = h; state.fileName = file.name || 'photo';
    // downscaled copy for smooth interaction
    const maxDim = 1600;
    const k = Math.min(1, maxDim / Math.max(w, h));
    if (k < 1) {
      const pc = document.createElement('canvas');
      pc.width = Math.round(w * k); pc.height = Math.round(h * k);
      const pctx = pc.getContext('2d');
      pctx.imageSmoothingEnabled = true; pctx.imageSmoothingQuality = 'high';
      pctx.drawImage(src, 0, 0, pc.width, pc.height);
      state.preview = pc;
    } else {
      state.preview = src;
    }
    el.fileInfo.hidden = false;
    el.fileInfo.textContent = t('fileInfo')(state.fileName, w, h);
    el.editorEmpty.hidden = true;
    el.exportBtn.disabled = false;
    clearExport();
    resetCrop();
  }
  el.file.addEventListener('change', () => loadFile(el.file.files && el.file.files[0]));

  // ---------------------------------------------------------------- render loop
  let raf = 0;
  let lastLayout = null;
  function scheduleRender() {
    if (raf) return;
    raf = requestAnimationFrame(() => { raf = 0; renderAll(); });
  }

  function renderAll() {
    drawEditor();
    const layout = computeLayout();
    lastLayout = layout;
    // sheet preview
    const wrapW = el.sheetCanvas.parentElement.clientWidth - 28;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const cssW = Math.max(200, Math.min(wrapW, layout.W >= layout.H ? 640 : 420));
    const pxW = Math.min(1200, Math.round(cssW * dpr));
    const scale = pxW / layout.W;
    const cvs = el.sheetCanvas;
    cvs.width = Math.round(layout.W * scale);
    cvs.height = Math.round(layout.H * scale);
    cvs.style.width = cssW + 'px';
    renderSheet(cvs.getContext('2d'), layout, scale, state.preview || null);
    drawSafeZone(cvs.getContext('2d'), layout, scale);
    // count & info
    const total = layout.tiles.length;
    let txt = layout.mainCount > 0 ? t('countMain')(layout.mainCount, layout.preset.short[lang]) : '0';
    if (layout.extraCount > 0) txt += t('countMixed')(layout.extraCount, mixedPreset().short[lang]);
    el.count.textContent = txt;
    el.count.dataset.count = String(layout.mainCount);
    el.count.dataset.total = String(total);
    const marginMm = fmtMm((layout.minMargin / DPI) * MM_PER_IN);
    let extra = layout.tiles.length ? ' · ' + t('marginInfo')(marginMm) : '';
    if (layout.cal.active) extra += ' · ' + t('calibInfo')(fmtPct(layout.k));
    el.sheetInfo.textContent = t('sheetInfo')(layout.W, layout.H, t(layout.orient === 'landscape' ? 'land' : 'port'), extra);
    const note = layout.mainCount === 0 ? t('noFit') : (layout.squeezed && el.compact.checked ? t('compacted') : '');
    el.layoutNote.hidden = !note;
    el.layoutNote.textContent = note;
    el.exportBtn.disabled = !state.src || layout.mainCount === 0;
    renderSafety(layout);
    renderCalib(layout);
  }

  // Preview only (never exported): dashed outline of the safe margin, orange when it's off.
  function drawSafeZone(ctx, layout, scale) {
    const inset = (layout.safe ? layout.safePx : mm2px(3)) * scale;
    if (inset <= 0) return;
    ctx.save();
    ctx.strokeStyle = layout.safe ? 'rgba(59,110,245,.55)' : 'rgba(245,140,20,.9)';
    ctx.lineWidth = Math.max(1, scale * 3);
    ctx.setLineDash([6 * Math.max(1, scale * 3), 4 * Math.max(1, scale * 3)]);
    ctx.strokeRect(inset, inset, layout.W * scale - 2 * inset, layout.H * scale - 2 * inset);
    ctx.restore();
  }

  function renderSafety(layout) {
    const adv = safetyAdvice(layout);
    if (adv) {
      const paperName = layout.paper.name[lang];
      const altBtn = adv.alt ? `<button id="switchPaper" class="btn primary" type="button" data-paper="${adv.alt.id}">${t('switchTo')(adv.alt.name[lang])}</button>` : '';
      el.safeHint.innerHTML = t('safeHint')({ ...adv, paper: paperName, short: layout.preset.short[lang], alt: adv.alt, altBtn });
    }
    el.safeHint.hidden = !adv;
    el.safeHint.dataset.unsafeMax = adv ? String(adv.unsafeMax) : '';
    const warn = !layout.safe && layout.tiles.length > 0 && layout.minMargin < mm2px(3);
    el.safeWarn.hidden = !warn;
    if (warn) el.safeWarn.textContent = t('unsafeWarn')(fmtMm((layout.minMargin / DPI) * MM_PER_IN));
    el.safeMm.disabled = !el.safe.checked;
  }

  function renderCalib(layout) {
    const cal = layout.cal;
    el.calibExpected.textContent = `${fmtMm(layout.preset.w)} mm`;
    el.calibFactor.textContent = cal.active
      ? t('calibFactor')(fmtPct(cal.k), cal.k.toFixed(3)) + (cal.k !== cal.raw ? t('calibClamped') : '')
      : t('calibNone');
    el.calibBadge.textContent = cal.active ? fmtPct(cal.k) : '';
    el.calibBadge.classList.toggle('on', cal.active);
    el.calibReset.disabled = !cal.active;
  }

  // Show the stored measurement for the current paper, converted to the current photo width.
  function syncCalibInput() {
    const c = calib[currentPaper().id];
    if (document.activeElement === el.calibMeasured) return;
    el.calibMeasured.value = c && c.measured > 0 && c.expected > 0
      ? fmtMm((currentPreset().w * c.measured) / c.expected) : '';
  }

  // ---------------------------------------------------------------- export
  // Set JFIF APP0 density to 300 DPI (insert a JFIF header if the encoder didn't write one).
  function setJpegDpi(bytes, dpi) {
    if (bytes[0] !== 0xff || bytes[1] !== 0xd8) return bytes;
    const isJfif = bytes[2] === 0xff && bytes[3] === 0xe0 &&
      bytes[6] === 0x4a && bytes[7] === 0x46 && bytes[8] === 0x49 && bytes[9] === 0x46 && bytes[10] === 0x00;
    if (isJfif) {
      const out = bytes.slice();
      out[13] = 1; // units: dots per inch
      out[14] = dpi >> 8; out[15] = dpi & 0xff;
      out[16] = dpi >> 8; out[17] = dpi & 0xff;
      return out;
    }
    const app0 = new Uint8Array([0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x01,
      dpi >> 8, dpi & 0xff, dpi >> 8, dpi & 0xff, 0x00, 0x00]);
    const out = new Uint8Array(bytes.length + app0.length);
    out.set(bytes.subarray(0, 2), 0);
    out.set(app0, 2);
    out.set(bytes.subarray(2), 2 + app0.length);
    return out;
  }

  function clearExport() {
    if (state.exportUrl) URL.revokeObjectURL(state.exportUrl);
    state.exportUrl = null; state.exportFile = null;
    el.resultWrap.hidden = true; el.shareBtn.hidden = true; el.exportInfo.hidden = true;
  }

  async function makeExport() {
    const layout = computeLayout();
    const canvas = document.createElement('canvas');
    canvas.width = layout.W; canvas.height = layout.H;
    renderSheet(canvas.getContext('2d'), layout, 1, state.src);
    const blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', 0.95));
    const bytes = setJpegDpi(new Uint8Array(await blob.arrayBuffer()), DPI);
    const name = `id-photo-${layout.preset.slug}-on-${layout.paper.slug}.jpg`;
    canvas.width = canvas.height = 0; // free memory (iOS)
    return { blob: new Blob([bytes], { type: 'image/jpeg' }), name, layout };
  }

  el.exportBtn.addEventListener('click', async () => {
    if (!state.src) return;
    el.exportBtn.disabled = true;
    const label = el.exportBtn.textContent;
    el.exportBtn.textContent = t('exporting');
    try {
      const { blob, name, layout } = await makeExport();
      clearExport();
      const url = URL.createObjectURL(blob);
      state.exportUrl = url;
      const a = document.createElement('a');
      a.href = url; a.download = name;
      document.body.appendChild(a); a.click(); a.remove();
      el.resultImg.src = url;
      el.resultWrap.hidden = false;
      el.exportInfo.hidden = false;
      el.exportInfo.textContent = t('exportInfo')(name, layout.W, layout.H, Math.round(blob.size / 1024));
      try {
        const file = new File([blob], name, { type: 'image/jpeg' });
        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          state.exportFile = file;
          el.shareBtn.hidden = false;
        }
      } catch (_) { /* File constructor / share unsupported */ }
    } catch (err) {
      console.error(err);
      alert(String(err && err.message || err));
    } finally {
      el.exportBtn.textContent = label;
      el.exportBtn.disabled = false;
    }
  });

  el.shareBtn.addEventListener('click', async () => {
    if (!state.exportFile) return;
    try {
      await navigator.share({ files: [state.exportFile], title: state.exportFile.name });
    } catch (err) {
      if (err && err.name !== 'AbortError') console.warn(err);
    }
  });

  // ---------------------------------------------------------------- i18n apply
  function fillSelect(sel, items, keep) {
    const v = sel.value;
    sel.innerHTML = items.map((it) => `<option value="${it.id}">${it.name[lang]}</option>`).join('');
    sel.value = keep && v ? v : items[0].id;
    if (!sel.value) sel.value = items[0].id;
  }

  function applyLang(first) {
    document.documentElement.lang = lang === 'zh' ? 'zh-CN' : 'en';
    document.title = lang === 'zh' ? '证件照排版 · ID Photo Print' : 'ID Photo Print · 证件照排版';
    document.querySelectorAll('[data-i18n]').forEach((n) => {
      const v = t(n.dataset.i18n);
      if (typeof v === 'string') n.textContent = v;
    });
    document.querySelectorAll('[data-i18n-html]').forEach((n) => { n.innerHTML = t(n.dataset.i18nHtml); });
    el.langBtn.textContent = lang === 'zh' ? 'EN' : '中文';
    fillSelect(el.preset, PRESETS, !first);
    fillSelect(el.paper, PAPERS, !first);
    const mv = el.mixedPreset.value;
    fillSelect(el.mixedPreset, PRESETS.filter((p) => p.id !== 'custom'), !first);
    if (first || !mv) el.mixedPreset.value = '1cun';
    if (state.src) el.fileInfo.textContent = t('fileInfo')(state.fileName, state.imgW, state.imgH);
    updateLegend();
    scheduleRender();
  }
  el.langBtn.addEventListener('click', () => {
    lang = lang === 'zh' ? 'en' : 'zh';
    try { localStorage.setItem('idphoto.lang', lang); } catch (_) { /* ignore */ }
    applyLang(false);
  });

  // ---------------------------------------------------------------- settings wiring
  let lastBase = 0; // baseSpan() of the preset that was active before the latest change
  function onPresetChange() {
    el.customRow.hidden = el.preset.value !== 'custom';
    const zoom = state.src && lastBase ? lastBase / state.crop.span : 1;
    sizeEditor();
    if (state.src) { state.crop.span = baseSpan() / zoom; lastBase = baseSpan(); syncCropUI(); }
    updateLegend();
    clearExport();
    scheduleRender();
  }
  el.preset.addEventListener('change', () => { onPresetChange(); syncCalibInput(); });
  [el.customW, el.customH, el.customUnit].forEach((n) => n.addEventListener('input', () => { onPresetChange(); syncCalibInput(); }));

  [el.paper, el.orient, el.gap, el.margin, el.compact, el.cutlines, el.mixedPreset].forEach((n) => {
    n.addEventListener('input', () => { clearExport(); scheduleRender(); });
    n.addEventListener('change', () => { clearExport(); scheduleRender(); });
  });
  el.mixed.addEventListener('change', () => { el.mixedRow.hidden = !el.mixed.checked; clearExport(); scheduleRender(); });

  // safe margin (persisted)
  { const sv = store.get('safe'); if (sv === '0' || sv === '1') el.safe.checked = sv === '1';
    const mv = parseFloat(store.get('safeMm')); if (Number.isFinite(mv)) el.safeMm.value = String(clamp(mv, 0, 8)); }
  const onSafe = () => {
    store.set('safe', el.safe.checked ? '1' : '0');
    const v = parseFloat(el.safeMm.value);
    if (Number.isFinite(v)) store.set('safeMm', String(clamp(v, 0, 8)));
    clearExport(); scheduleRender();
  };
  el.safe.addEventListener('change', onSafe);
  el.safeMm.addEventListener('input', onSafe);
  el.safeMm.addEventListener('change', () => { el.safeMm.value = String(safeMmValue()); onSafe(); });
  el.safeHint.addEventListener('click', (e) => {
    const b = e.target.closest('#switchPaper');
    if (!b) return;
    el.paper.value = b.dataset.paper;
    syncCalibInput();
    clearExport(); scheduleRender();
  });
  el.paper.addEventListener('change', syncCalibInput);

  // print calibration (persisted per paper)
  const saveCalib = () => store.set('calib', JSON.stringify(calib));
  el.calibMeasured.addEventListener('input', () => {
    const v = parseFloat(el.calibMeasured.value);
    const id = currentPaper().id;
    if (Number.isFinite(v) && v > 0) calib[id] = { measured: v, expected: currentPreset().w };
    else delete calib[id];
    saveCalib(); clearExport(); scheduleRender();
  });
  el.calibReset.addEventListener('click', () => {
    delete calib[currentPaper().id];
    saveCalib();
    el.calibMeasured.value = '';
    clearExport(); scheduleRender();
  });

  let resizeT = 0;
  window.addEventListener('resize', () => {
    clearTimeout(resizeT);
    resizeT = setTimeout(() => { sizeEditor(); scheduleRender(); }, 80);
  });

  // ---------------------------------------------------------------- boot
  applyLang(true);
  syncCalibInput();
  sizeEditor();
  renderAll();

  // small hook for automated tests / debugging
  window.__idphoto = {
    layout: () => { const l = computeLayout(); return { W: l.W, H: l.H, orient: l.orient, main: l.mainCount, total: l.tiles.length, safe: l.safe, k: l.k, minMargin: l.minMargin, tiles: l.tiles.map(({ x, y, w, h }) => ({ x, y, w, h })) }; },
    image: () => ({ w: state.imgW, h: state.imgH }),
    setCrop: (c) => { Object.assign(state.crop, c); syncCropUI(); scheduleRender(); },
    setJpegDpi,
  };
})();
