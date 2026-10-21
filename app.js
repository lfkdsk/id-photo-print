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
      safeLong: '长边两端（左右）', safeShort: '短边两端（上下）',
      safeHelp: 'CVS 等无边距冲印（选 Fill）会把整张图放大几个百分点再裁掉纸边，6 英寸那条边的两端（横放时的左右）裁得比 4 英寸那条边的两端（上下）多，所以默认长边两端留 3 mm、短边两端 0 mm。竖排时自动对应到纸的同一条边。',
      safeHint: (o) => {
        const fill = o.unsafeMarginMm < 0.5
          ? `${o.unsafeMax} 张 ${o.short} 正好铺满整张 ${o.paper}`
          : `最密排 ${o.unsafeMax} 张 ${o.short} 时外边距只有 ${o.unsafeMarginMm.toFixed(1)} mm`;
        let s = `<p>${o.paper} 无边距冲印会放大并裁掉纸边；${fill}，外圈不可能都完整。` +
          `按安全边距排：本纸 <b>${o.safeCount} 张</b>。</p>`;
        const sheets = o.safeCount > 0 ? `打印 ${Math.ceil(o.unsafeMax / o.safeCount)} 张 ${o.paper}` : '';
        if (o.alt) s += `<p>要 ${o.unsafeMax} 张都能用：${o.altBtn}${sheets ? '，或' + sheets : ''}。</p>`;
        else if (sheets) s += `<p>要 ${o.unsafeMax} 张都能用：${sheets}。</p>`;
        return s;
      },
      switchTo: (p) => `改用 ${p}`,
      edgeNames: { top: '上', bottom: '下', left: '左', right: '右' },
      unsafeWarn: (edge, mm, ref) => `⚠️ ${edge}边的外边距只有 ${mm} mm（建议至少 ${ref} mm）。无边距冲印会放大并裁掉纸边，靠边的照片会被裁掉一部分、尺寸也会偏大，可能不能用。`,
      edgeNote: (pair) => `ℹ️ 最外侧照片的${pair}边贴着（或几乎贴着）纸边：冲印时可能被裁掉不到 1 mm 的背景或肩膀，护照照片一般可以接受。做一次「打印校准」（下方）可以把它降到最小。`,
      pairTB: '上/下', pairLR: '左/右',
      trimCost: (n, m) => `ℹ️ 按实测裁切 + 0.5 mm 余量，这张纸只能放 ${n} 张；清空短边（上下）的裁切值可以放 ${m} 张，但外侧照片的边缘会被裁掉一点。`,
      calibTitle: '打印校准',
      calibIntro: `<p>CVS 等无边距冲印（Fill）会把整张图放大 2–4% 再裁掉纸边。花一张 4×6 的钱（约 $0.44）测一次，就能把放大和裁边都补偿掉：</p>
<ol><li>点「下载校准测试页」（按当前相纸生成）；</li>
<li>在 CVS 冲印同样尺寸，选 <b>Fill</b>（填满），<b>不要选 Crop</b>；</li>
<li>取件后读四边纸边处的刻度（= 被裁掉的 mm），用尺子量中间那条 100 mm 线；</li>
<li>把数字填在下面，然后重新导出照片排版。</li></ol>
<p class="muted">照片和间距按 100 ÷ 实测 缩小（限制在 −15% ~ +5%）；每边的外边距不小于「实测裁切 + 0.5 mm」。每种相纸分别记住。</p>`,
      calibSheetBtn: '下载校准测试页',
      calibSheetInfo: (n) => `已生成 ${n}（300 DPI）`,
      calibLineLabel: '中间 100 mm 线实际量到的长度 (mm)',
      calibTrimLabel: '四边被裁掉多少 mm（读测试页上 TOP/上 等各边纸边处的刻度，比如 2 号刻度没了、3 号还在 → 约 2.5；可留空）',
      trimTop: '上 TOP', trimBottom: '下 BOTTOM', trimLeft: '左 LEFT', trimRight: '右 RIGHT',
      calibLabel: '或：印出来量到的照片边长 (mm)',
      calibExpectedLabel: '标准边长（照片宽度）',
      calibReset: '清除校准',
      calibNone: '未校准，不补偿',
      calibEnlarge: (pct) => `放大 ${pct} 已补偿`,
      calibFactor: (pct, k) => `补偿 ${pct}（×${k}）`,
      calibNoScale: '未测放大',
      calibTrims: (s) => `实测裁切 ${s} mm`,
      calibSep: '；',
      calibClamped: '（已限制在 −15% ~ +5% 之内，请确认量的数字）',
      marginInfo: (lr, tb) => `外边距 左右 ${lr} / 上下 ${tb} mm`,
      calibInfo: (pct) => `已校准 ${pct}`,
      cutlines: '灰色裁切线 / 裁切标记',
      mixed: '剩余空间用小尺寸填充', mixedSize: '填充尺寸',
      export: '生成并下载 JPEG', share: '分享 / 存储到照片', exporting: '生成中…',
      longPress: 'iPhone：长按下图 →「存储到照片」（或点上面的分享按钮），然后在 CVS / Walgreens App 里上传，冲印和排版相同的尺寸（4×6 / 5×7），裁剪方式选 Fill（不要选 Crop）。',
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
<h3>先看这个：CVS 选 Fill，不要选 Crop</h3>
<ul>
  <li>CVS 冲印 4×6 时会问你 <b>Crop</b> 还是 <b>Fill</b>：<b>Crop</b> 会把整张图缩小塞进纸里，四周多出约 3 mm 白边，照片就不到 2 英寸了，<b>不能用</b>；<b>Fill</b> 会把整张图等比放大几个百分点再裁掉纸边。本工具按 <b>Fill</b> 设计。</li>
  <li>等比放大时，6 英寸那条边两端裁掉的是 4 英寸那条边两端的 1.5 倍（同样的放大比例乘在更长的边上），所以左右（长边两端）明显比上下裁得多。</li>
  <li>默认安全边距：长边两端 <b>3 mm</b>、短边两端 <b>0 mm</b>。美国 2×2 在 4×6 上排 <b>4 张</b>（2×2 网格，横放，上下贴着纸边，左右各留约 1 英寸）。外侧照片的上/下边可能被裁掉不到 1 mm 的背景或肩膀，护照照片一般没问题；做一次打印校准可以降到最小。</li>
  <li>6 张 2×2 正好铺满 6×4 英寸，左右两端一定会被裁。要 6 张都完整：改用 <b>5×7</b> 相纸（默认排 6 张），或者打印 <b>2 张 4×6</b>。</li>
  <li>美国护照申请（DS-11 / DS-82）只需要<b>1 张</b>照片；一张 4×6 上的 4 张足够用、还有备用。</li>
</ul>
<h3>在 CVS 冲印（约 $0.44 一张 4×6）</h3>
<ol>
  <li>建议先花 $0.44 印一张<b>校准测试页</b>（第 3 步「打印校准」里下载），按下面的方法读数、填回去，再印正式的照片。</li>
  <li>点「生成并下载 JPEG」，得到一张 300 DPI 的排版图（4×6 为 1800×1200 px；iPhone 可长按图片「存储到照片」）。</li>
  <li>打开 CVS Photo 网站或 CVS App → Photo → <b>Prints</b>，选择和排版一致的尺寸（<b>4×6</b> 或 <b>5×7</b>），通常可当天门店取件。</li>
  <li>上传这张图，裁剪方式选 <b>Fill</b>（不要选 Crop），关闭自动增强。亚光（Matte）或亮面（Glossy）都可以。</li>
  <li>取件后<b>一定用尺子量</b>：美国照片每张应该正好 <b>2 英寸（50.8 mm）</b>见方。然后沿灰色裁切线剪开。</li>
</ol>
<h3>打印校准（推荐先做一次）</h3>
<ol>
  <li>在第 3 步展开「打印校准」，点「下载校准测试页」，得到当前相纸的测试图（如 calibration-4x6.jpg）。</li>
  <li>在 CVS 用 <b>Fill</b> 冲印这一张。</li>
  <li>测试页四边各有从纸边往里的毫米刻度尺（1 格 1 mm，每 5 mm 有数字）：看纸边处的读数，就是这一边被裁掉了几 mm（比如 2 号刻度没了、3 号还在 → 约 2.5 mm）。按测试页上印的 TOP/上、BOTTOM/下、LEFT/左、RIGHT/右 填。</li>
  <li>用尺子量中间那条 <b>100 mm</b> 线，比如量到 103.0 mm，就说明放大了 3%。</li>
  <li>把这些数字填回去，重新导出：照片和间距会按 100 ÷ 103 缩小，每边外边距不小于「实测裁切 + 0.5 mm」。每种相纸分别记住。</li>
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
      safeLong: 'Long-side ends (L/R)', safeShort: 'Short-side ends (T/B)',
      safeHelp: 'Borderless prints (CVS "Fill") enlarge the whole image a few percent and trim the paper edges; the ends of the 6 in side lose more than the ends of the 4 in side. Default: 3 mm on the long-side ends (left/right in landscape), 0 mm on the short-side ends (top/bottom); portrait layouts map to the same physical edges.',
      safeHint: (o) => {
        const fill = o.unsafeMarginMm < 0.5
          ? `${o.unsafeMax} × ${o.short} exactly fill the whole ${o.paper} sheet`
          : `packing ${o.unsafeMax} × ${o.short} leaves only ${o.unsafeMarginMm.toFixed(1)} mm of outer margin`;
        let s = `<p>Borderless ${o.paper} prints are enlarged and trimmed at the edges; ${fill}, so the outer ones can't all survive. ` +
          `With the safe margins: <b>${o.safeCount}</b> on this paper.</p>`;
        const sheets = o.safeCount > 0 ? `print ${Math.ceil(o.unsafeMax / o.safeCount)} sheets of ${o.paper}` : '';
        if (o.alt) s += `<p>To get ${o.unsafeMax} usable photos: ${o.altBtn}${sheets ? ', or ' + sheets : ''}.</p>`;
        else if (sheets) s += `<p>To get ${o.unsafeMax} usable photos: ${sheets}.</p>`;
        return s;
      },
      switchTo: (p) => `Use ${p}`,
      edgeNames: { top: 'top', bottom: 'bottom', left: 'left', right: 'right' },
      unsafeWarn: (edge, mm, ref) => `⚠️ The ${edge} outer margin is only ${mm} mm (at least ${ref} mm recommended). Borderless printing enlarges and trims the edges, so photos there will be cut and come out too large — they may be unusable.`,
      edgeNote: (pair) => `ℹ️ The outer photos' ${pair} edges sit at (or right next to) the paper edge: the print may lose under 1 mm of background or shoulder there, which is normally fine for passport photos. A print calibration (below) keeps it to a minimum.`,
      pairTB: 'top/bottom', pairLR: 'left/right',
      trimCost: (n, m) => `ℹ️ With the measured trims + 0.5 mm spare, only ${n} fit on this paper. Clearing the short-side (top/bottom) trims gives ${m}, but the outer photos will lose a sliver at the edge.`,
      calibTitle: 'Print calibration',
      calibIntro: `<p>Borderless prints (CVS "Fill") enlarge the whole image by 2–4% and trim the paper edges. One test print (about $0.44) lets you compensate both:</p>
<ol><li>Tap "Download test sheet" (made for the selected paper);</li>
<li>Print it at CVS in the same size with <b>Fill</b> — <b>not Crop</b>;</li>
<li>Read the ruler number at the paper edge on each side (= mm trimmed) and measure the 100 mm line in the middle with a ruler;</li>
<li>Enter the numbers below, then export your photo sheet again.</li></ol>
<p class="muted">Photos and gaps are scaled by 100 ÷ measured (limited to −15%…+5%); each outer margin stays ≥ measured trim + 0.5 mm. Saved separately for each paper size.</p>`,
      calibSheetBtn: 'Download test sheet',
      calibSheetInfo: (n) => `Created ${n} (300 DPI)`,
      calibLineLabel: 'Measured length of the 100 mm line (mm)',
      calibTrimLabel: 'Trimmed mm per edge (read the ruler at the paper edge next to TOP / BOTTOM / LEFT / RIGHT on the test sheet, e.g. tick 2 gone, 3 visible → about 2.5; optional)',
      trimTop: 'TOP 上', trimBottom: 'BOTTOM 下', trimLeft: 'LEFT 左', trimRight: 'RIGHT 右',
      calibLabel: 'Or: measured photo edge on a print (mm)',
      calibExpectedLabel: 'Expected (photo width)',
      calibReset: 'Reset',
      calibNone: 'Not calibrated — no compensation',
      calibEnlarge: (pct) => `enlargement ${pct} compensated`,
      calibFactor: (pct, k) => `Compensation ${pct} (×${k})`,
      calibNoScale: 'enlargement not measured',
      calibTrims: (s) => `measured trim ${s} mm`,
      calibSep: '; ',
      calibClamped: ' (limited to −15% … +5% — please double-check the number)',
      marginInfo: (lr, tb) => `margins L/R ${lr} / T/B ${tb} mm`,
      calibInfo: (pct) => `calibrated ${pct}`,
      cutlines: 'Thin gray cut lines / crop marks',
      mixed: 'Fill leftover space with a smaller size', mixedSize: 'Filler size',
      export: 'Create & download JPEG', share: 'Share / Save to Photos', exporting: 'Rendering…',
      longPress: 'iPhone: long-press the image below → "Save to Photos" (or use Share above), then upload it in the CVS / Walgreens app and order the same print size as the layout (4×6 / 5×7) with Fill (not Crop).',
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
<h3>Read this first: at CVS choose Fill, never Crop</h3>
<ul>
  <li>When ordering 4×6 prints CVS asks <b>Crop</b> or <b>Fill</b>. <b>Crop</b> shrinks the whole image to fit and leaves a ~3 mm white border, so the photos come out smaller than 2 in — <b>unusable</b>. <b>Fill</b> enlarges the whole image uniformly by a few percent and trims the edges. This tool is designed for <b>Fill</b>.</li>
  <li>With a uniform enlargement the ends of the 6 in side lose 1.5× as much as the ends of the 4 in side (same percentage of a longer side), so left/right (the long-side ends) are trimmed clearly more than top/bottom.</li>
  <li>Default safe margins: <b>3 mm</b> on the long-side ends, <b>0 mm</b> on the short-side ends. US 2×2 on 4×6 gives <b>4 photos</b> (a 2×2 grid, landscape, touching the top and bottom edges, about 1 in free at left and right). The outer photos may lose under 1 mm of background or shoulder at the top/bottom edge — normally fine for passport photos; a print calibration keeps it to a minimum.</li>
  <li>Six 2×2 photos fill 6×4 in exactly, so the left/right ends always get trimmed. Need 6 complete ones? Use <b>5×7</b> paper (6 by default) or print <b>two 4×6 sheets</b>.</li>
  <li>A US passport application (DS-11 / DS-82) needs only <b>1 photo</b>; the 4 on one 4×6 leave plenty of spares.</li>
</ul>
<h3>Printing at CVS (about $0.44 per 4×6)</h3>
<ol>
  <li>Recommended: first spend $0.44 on a <b>calibration test sheet</b> (download it under "Print calibration" in step 3), read it as described below and enter the numbers, then print the real sheet.</li>
  <li>Tap "Create &amp; download JPEG" to get a 300 DPI sheet (1800×1200 px for 4×6; on iPhone, long-press the image → Save to Photos).</li>
  <li>Open the CVS Photo website or the CVS app → Photo → <b>Prints</b> and pick the same size as the layout (<b>4×6</b> or <b>5×7</b>); usually same-day in-store pickup.</li>
  <li>Upload the sheet, choose <b>Fill</b> (not Crop) and turn off auto-enhance. Matte or glossy are both fine.</li>
  <li>After pickup, <b>always measure with a ruler</b>: each US photo must be exactly <b>2 inches (50.8 mm)</b> square. Then cut along the gray lines.</li>
</ol>
<h3>Print calibration (recommended once)</h3>
<ol>
  <li>In step 3, open "Print calibration" and tap "Download test sheet" to get a test image for the selected paper (e.g. calibration-4x6.jpg).</li>
  <li>Print it at CVS with <b>Fill</b>.</li>
  <li>Each edge of the sheet has a mm ruler starting at the paper edge (1 tick = 1 mm, numbers every 5 mm). The reading at the paper edge is how many mm were trimmed on that side (e.g. tick 2 gone, tick 3 visible → about 2.5 mm). Use the TOP / BOTTOM / LEFT / RIGHT labels printed on the sheet.</li>
  <li>Measure the <b>100 mm</b> line in the middle with a ruler — e.g. 103.0 mm means a 3% enlargement.</li>
  <li>Enter the numbers and export again: photos and gaps are scaled by 100 ÷ 103 and every outer margin stays ≥ measured trim + 0.5 mm. Saved per paper size.</li>
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
    safe: $('safe'), safeLong: $('safeLong'), safeShort: $('safeShort'), safeHint: $('safeHint'), safeWarn: $('safeWarn'),
    edgeNote: $('edgeNote'),
    calib: $('calib'), calibBadge: $('calibBadge'), calibMeasured: $('calibMeasured'), calibExpected: $('calibExpected'),
    calibFactor: $('calibFactor'), calibReset: $('calibReset'), calibLine: $('calibLine'),
    calibSheetBtn: $('calibSheetBtn'), calibSheetInfo: $('calibSheetInfo'), calibSheetImg: $('calibSheetImg'),
    trim: { t: $('trimTop'), b: $('trimBottom'), l: $('trimLeft'), r: $('trimRight') },
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
  // Per paper (localStorage 'idphoto.calib'):
  //   line:     measured length (mm) of the 100 mm line on the test sheet  -> enlargement s = line / 100
  //   measured/expected: legacy "a tile that should be `expected` mm printed `measured` mm" (used when no line)
  //   trim:     { t, b, l, r } mm trimmed per edge, read off the test sheet rulers (landscape frame of the paper)
  let calib = {};
  try { calib = JSON.parse(store.get('calib') || '{}') || {}; } catch (_) { calib = {}; }
  const CAL_MIN = 0.85, CAL_MAX = 1.05;
  const EDGES = ['t', 'b', 'l', 'r'];
  const validTrim = (v) => typeof v === 'number' && Number.isFinite(v) && v >= 0 && v <= 15;
  function calibFor(paper) {
    const c = calib[paper.id] || {};
    let raw = 1, src = null;
    if (c.line > 0) { raw = 100 / c.line; src = 'line'; }
    else if (c.measured > 0 && c.expected > 0) { raw = c.expected / c.measured; src = 'tile'; }
    const k = src ? clamp(raw, CAL_MIN, CAL_MAX) : 1;
    let trim = null;
    if (c.trim) for (const e of EDGES) if (validTrim(c.trim[e])) (trim = trim || {})[e] = c.trim[e];
    return { k, raw, s: 1 / k, src, scaled: !!src, trim, active: !!src || !!trim };
  }
  const fmtPct = (k) => { const v = Math.round((k - 1) * 1000) / 10; return (v < 0 ? '−' : '+') + Math.abs(v).toFixed(1) + '%'; };
  const fmtMm = (v) => String(Math.round(v * 10) / 10);

  // ---------------------------------------------------------------- layout
  // Fit n tiles of size `size` along length L (all px). Preferred gap g and margins m0 / m1 (start / end);
  // when `compact`, the gap may shrink to minGap and the margins to min0 / min1 to fit more tiles.
  function fitAxis(L, size, g, m0, m1, compact, minGap, min0, min1) {
    const avail = L - m0 - m1;
    let n = size <= avail ? Math.floor((avail + g) / (size + g) + 1e-9) : 0;
    let gap = g;
    let squeezed = false;
    if (compact) {
      const avail0 = L - min0 - min1;
      const n0 = size <= avail0 ? Math.floor((avail0 + minGap) / (size + minGap) + 1e-9) : 0;
      if (n0 > n) {
        n = n0; squeezed = true;
        const left = L - n * size;
        if (n > 1) {
          const even = Math.floor(left / (n + 1));                        // gap == margin
          const tight = Math.floor((left - min0 - min1) / (n - 1));       // margins pinned at their minimum
          gap = Math.min(g, Math.max(minGap, Math.min(even, tight)));
        }
      }
    }
    if (n <= 1) gap = 0;
    const used = n > 0 ? n * size + (n - 1) * gap : 0;
    // centre on the paper, but never closer to an edge than its margin
    const lo = squeezed ? min0 : m0, hi = L - (squeezed ? min1 : m1) - used;
    const start = Math.max(lo, Math.min(hi, Math.floor((L - used) / 2)));
    return { n, gap, used, start, squeezed };
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

  // Safe margins tied to the paper's physical edges: "long" = the two ends of the long side (left/right when
  // the sheet is landscape), "short" = the two ends of the short side (top/bottom in landscape).
  const SAFE_MAX = 10;
  const safeVals = () => ({ long: clamp(num(el.safeLong, 3), 0, SAFE_MAX), short: clamp(num(el.safeShort, 0), 0, SAFE_MAX) });
  const ceilPx = (mm) => Math.ceil((mm / MM_PER_IN) * DPI - 1e-6);
  const TRIM_SPARE_MM = 0.5;
  // Required outer margins (px) in the paper's landscape frame { t, b, l, r }.
  // A trim read off the test-sheet ruler is already in image mm (the ruler is enlarged together with the image);
  // the 0.5 mm spare is physical, i.e. 0.5 / s in image mm.
  function refMargins(cal, useTrim = true) {
    const sv = safeVals();
    const L = mm2px(sv.long), S = mm2px(sv.short);
    const m = { t: S, b: S, l: L, r: L };
    if (useTrim && cal.trim) for (const e of EDGES) if (cal.trim[e] != null) m[e] = Math.max(m[e], ceilPx(cal.trim[e] + TRIM_SPARE_MM * cal.k));
    return m;
  }
  // Map landscape-frame margins onto a sheet orientation. For portrait we don't know which way the lab rotates
  // the image, so each pair uses its larger value.
  function frameMargins(m, orient) {
    if (orient === 'landscape') return { top: m.t, bottom: m.b, left: m.l, right: m.r };
    const ends = Math.max(m.l, m.r), sides = Math.max(m.t, m.b);
    return { top: ends, bottom: ends, left: sides, right: sides };
  }
  const longEnds = (orient) => (orient === 'landscape' ? ['left', 'right'] : ['top', 'bottom']);
  const shortEnds = (orient) => (orient === 'landscape' ? ['top', 'bottom'] : ['left', 'right']);
  const ZERO = { top: 0, bottom: 0, left: 0, right: 0 };

  // `over` overrides UI settings: { paper, safe, compact, mixed, noShortTrim }
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
    const um = mm2px(clamp(num(el.margin, 2), 0, 20));
    const ref = refMargins(cal);
    if (over.noShortTrim) { const S = mm2px(safeVals().short); ref.t = S; ref.b = S; }
    const minGap = 0; // when compacting, photos may touch (a hairline is drawn on the shared edge)
    const o = el.orient.value;
    const cands = [];
    if (o !== 'portrait') cands.push({ W: long, H: short, orient: 'landscape' });
    if (o !== 'landscape') cands.push({ W: short, H: long, orient: 'portrait' });
    let best = null;
    for (const c of cands) {
      const R = frameMargins(ref, c.orient);
      const mn = safe ? R : ZERO;
      const mp = { top: Math.max(um, mn.top), bottom: Math.max(um, mn.bottom), left: Math.max(um, mn.left), right: Math.max(um, mn.right) };
      const ax = fitAxis(c.W, tw, g, mp.left, mp.right, compact, minGap, mn.left, mn.right);
      const ay = fitAxis(c.H, th, g, mp.top, mp.bottom, compact, minGap, mn.top, mn.bottom);
      const count = ax.n * ay.n;
      if (!best || count > best.count) best = { ...c, ax, ay, count, R, mn, mp };
    }
    const { W, H, ax, ay, mn, mp } = best;
    const main = { x0: ax.start, y0: ay.start, nx: ax.n, ny: ay.n, tw, th, gx: ax.gap, gy: ay.gap, preset };
    let grids = best.count > 0 ? [main] : [];

    // Mixed mode: push the main grid to the top-left and fill the right / bottom strips.
    if (mixed && best.count > 0) {
      const sp = mixedPreset();
      const sw = px(sp.w), sh = px(sp.h);
      const x0 = Math.max(Math.min(ax.start, mp.left), mn.left), y0 = Math.max(Math.min(ay.start, mp.top), mn.top);
      const gx = Math.max(ax.gap, g), gy = Math.max(ay.gap, g);
      const mainR = x0 + ax.used, mainB = y0 + ay.used;
      const extra = [];
      // right strip (full height)
      const rStart = mainR + gx;
      const rLen = W - mp.right - rStart;
      if (rLen >= sw) {
        const nx = Math.floor((rLen + g) / (sw + g) + 1e-9);
        const fy = fitAxis(H, sh, g, mp.top, mp.bottom, compact, minGap, mn.top, mn.bottom);
        if (nx > 0 && fy.n > 0) extra.push({ x0: rStart, y0: fy.start, nx, ny: fy.n, tw: sw, th: sh, gx: g, gy: fy.gap, preset: sp });
      }
      // bottom strip (under the main grid)
      const bStart = mainB + gy;
      const bLen = H - mp.bottom - bStart;
      if (bLen >= sh) {
        const ny = Math.floor((bLen + g) / (sh + g) + 1e-9);
        const nx = Math.floor((ax.used + g) / (sw + g) + 1e-9);
        if (nx > 0 && ny > 0) extra.push({ x0, y0: bStart, nx, ny, tw: sw, th: sh, gx: g, gy: g, preset: sp });
      }
      if (extra.length) grids = [{ ...main, x0, y0 }, ...extra];
    }
    const tiles = grids.flatMap(gridTiles);
    const mainCount = best.count;
    const edgeM = { top: Infinity, bottom: Infinity, left: Infinity, right: Infinity };
    for (const r of tiles) {
      edgeM.left = Math.min(edgeM.left, r.x); edgeM.top = Math.min(edgeM.top, r.y);
      edgeM.right = Math.min(edgeM.right, W - r.x - r.w); edgeM.bottom = Math.min(edgeM.bottom, H - r.y - r.h);
    }
    if (!tiles.length) Object.assign(edgeM, ZERO);
    const minM = Math.min(edgeM.top, edgeM.bottom, edgeM.left, edgeM.right);
    // which sheet edges have a measured trim
    const tr = cal.trim || {};
    const has = (e) => tr[e] != null;
    const trimEdges = best.orient === 'landscape'
      ? { top: has('t'), bottom: has('b'), left: has('l'), right: has('r') }
      : { top: has('l') || has('r'), bottom: has('l') || has('r'), left: has('t') || has('b'), right: has('t') || has('b') };
    return { W, H, orient: best.orient, grids, tiles, mainCount, extraCount: tiles.length - mainCount,
      preset, paper, squeezed: ax.squeezed || ay.squeezed, safe, k, cal, minMargin: minM,
      edgeM, refM: best.R, safeM: mn, trimEdges };
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
    const E = layout.edgeM;
    let extra = layout.tiles.length ? ' · ' + t('marginInfo')(fmtMm(pxToMm(Math.min(E.left, E.right))), fmtMm(pxToMm(Math.min(E.top, E.bottom)))) : '';
    if (layout.cal.active) extra += ' · ' + t('calibInfo')(fmtPct(layout.k));
    el.sheetInfo.textContent = t('sheetInfo')(layout.W, layout.H, t(layout.orient === 'landscape' ? 'land' : 'port'), extra);
    const note = layout.mainCount === 0 ? t('noFit') : (layout.squeezed && el.compact.checked ? t('compacted') : '');
    el.layoutNote.hidden = !note;
    el.layoutNote.textContent = note;
    el.exportBtn.disabled = !state.src || layout.mainCount === 0;
    renderSafety(layout);
    renderCalib(layout);
  }

  // Preview only (never exported): dashed lines at the safe margins, orange when the safe margin is off.
  function drawSafeZone(ctx, layout, scale) {
    const R = layout.refM;
    const W = layout.W * scale, H = layout.H * scale;
    const ins = { top: R.top * scale, bottom: R.bottom * scale, left: R.left * scale, right: R.right * scale };
    if (!(ins.top || ins.bottom || ins.left || ins.right)) return;
    const lw = Math.max(1, scale * 3);
    ctx.save();
    ctx.strokeStyle = layout.safe ? 'rgba(59,110,245,.55)' : 'rgba(245,140,20,.9)';
    ctx.lineWidth = lw;
    ctx.setLineDash([6 * lw, 4 * lw]);
    ctx.beginPath();
    if (ins.top > 0) { ctx.moveTo(0, ins.top); ctx.lineTo(W, ins.top); }
    if (ins.bottom > 0) { ctx.moveTo(0, H - ins.bottom); ctx.lineTo(W, H - ins.bottom); }
    if (ins.left > 0) { ctx.moveTo(ins.left, 0); ctx.lineTo(ins.left, H); }
    if (ins.right > 0) { ctx.moveTo(W - ins.right, 0); ctx.lineTo(W - ins.right, H); }
    ctx.stroke();
    ctx.restore();
  }

  const pxToMm = (v) => (v / DPI) * MM_PER_IN;

  function renderSafety(layout) {
    const adv = safetyAdvice(layout);
    if (adv) {
      const paperName = layout.paper.name[lang];
      const altBtn = adv.alt ? `<button id="switchPaper" class="btn primary" type="button" data-paper="${adv.alt.id}">${t('switchTo')(adv.alt.name[lang])}</button>` : '';
      el.safeHint.innerHTML = t('safeHint')({ ...adv, paper: paperName, short: layout.preset.short[lang], alt: adv.alt, altBtn });
    }
    el.safeHint.hidden = !adv;
    el.safeHint.dataset.unsafeMax = adv ? String(adv.unsafeMax) : '';
    // Warn when an outer margin is below what that edge needs: the long-side ends need ≥ max(safe value, 3 mm),
    // and any edge with a measured trim needs ≥ trim + spare.
    let worst = null;
    if (layout.tiles.length) {
      const longE = longEnds(layout.orient);
      for (const e of ['top', 'bottom', 'left', 'right']) {
        let need = 0;
        if (longE.includes(e)) need = Math.max(layout.refM[e], mm2px(3));
        if (layout.trimEdges[e]) need = Math.max(need, layout.refM[e]);
        const lack = need - layout.edgeM[e];
        if (lack > 0 && (!worst || lack > worst.lack)) worst = { e, lack, need };
      }
    }
    el.safeWarn.hidden = !worst;
    el.safeWarn.dataset.edge = worst ? worst.e : '';
    if (worst) el.safeWarn.textContent = t('unsafeWarn')(t('edgeNames')[worst.e], fmtMm(pxToMm(layout.edgeM[worst.e])), fmtMm(pxToMm(worst.need)));
    // Gentle note: photos sit right at a short-side edge without a measured trim there.
    let note = '';
    if (!worst && layout.safe && layout.tiles.length) {
      const se = shortEnds(layout.orient);
      if (se.some((e) => layout.edgeM[e] < mm2px(1) && !layout.trimEdges[e])) note = t('edgeNote')(t(layout.orient === 'landscape' ? 'pairTB' : 'pairLR'));
    }
    // Measured short-side trims cost photos: say how many clearing them would give.
    if (!worst && layout.safe && layout.cal.trim && (layout.cal.trim.t != null || layout.cal.trim.b != null) && !el.mixed.checked) {
      const alt = computeLayout({ noShortTrim: true, mixed: false });
      if (alt.mainCount > layout.mainCount) note = t('trimCost')(layout.mainCount, alt.mainCount);
    }
    el.edgeNote.hidden = !note;
    el.edgeNote.textContent = note;
    el.safeLong.disabled = el.safeShort.disabled = !el.safe.checked;
  }

  function calibSummary(cal) {
    const parts = [];
    if (cal.scaled) {
      parts.push(cal.src === 'line'
        ? t('calibEnlarge')(fmtPct(1 / cal.raw)) + (cal.k !== cal.raw ? t('calibClamped') : '')
        : t('calibFactor')(fmtPct(cal.k), cal.k.toFixed(3)) + (cal.k !== cal.raw ? t('calibClamped') : ''));
    } else if (cal.trim) parts.push(t('calibNoScale'));
    if (cal.trim) {
      const L = lang === 'zh' ? { t: '上', b: '下', l: '左', r: '右' } : { t: 'T ', b: 'B ', l: 'L ', r: 'R ' };
      parts.push(t('calibTrims')(EDGES.filter((e) => cal.trim[e] != null).map((e) => L[e] + fmtMm(cal.trim[e])).join(' ')));
    }
    return parts.length ? parts.join(t('calibSep')) : t('calibNone');
  }

  function renderCalib(layout) {
    const cal = layout.cal;
    el.calibExpected.textContent = `${fmtMm(layout.preset.w)} mm`;
    el.calibFactor.textContent = calibSummary(cal);
    el.calibBadge.textContent = cal.scaled ? fmtPct(cal.k) : (cal.trim ? '✓' : '');
    el.calibBadge.classList.toggle('on', cal.active);
    el.calibReset.disabled = !cal.active;
  }

  // Show the stored values for the current paper (legacy tile measurement converted to the current photo width).
  function syncCalibInput() {
    const c = calib[currentPaper().id] || {};
    const act = document.activeElement;
    if (act !== el.calibMeasured) {
      el.calibMeasured.value = !(c.line > 0) && c.measured > 0 && c.expected > 0
        ? fmtMm((currentPreset().w * c.measured) / c.expected) : '';
    }
    if (act !== el.calibLine) el.calibLine.value = c.line > 0 ? fmtMm(c.line) : '';
    for (const e of EDGES) if (act !== el.trim[e]) el.trim[e].value = c.trim && validTrim(c.trim[e]) ? fmtMm(c.trim[e]) : '';
  }

  // ---------------------------------------------------------------- calibration test sheet
  // Landscape sheet at 300 DPI: mm rulers starting at each paper edge, a 100 mm and a 50 mm reference line,
  // and short bilingual instructions.
  function renderCalibSheet(paper) {
    const Wmm = Math.max(paper.w, paper.h), Hmm = Math.min(paper.w, paper.h);
    const W = mm2px(Wmm), H = mm2px(Hmm);
    const P = (mm) => (mm / MM_PER_IN) * DPI; // exact (fractional) px
    const cvs = document.createElement('canvas');
    cvs.width = W; cvs.height = H;
    const ctx = cvs.getContext('2d');
    ctx.fillStyle = '#ffffff'; ctx.fillRect(0, 0, W, H);
    const INK = '#000000';
    const FF = '-apple-system, "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Noto Sans CJK SC", "Helvetica Neue", Arial, sans-serif';
    const font = (px, w = 600) => `${w} ${px}px ${FF}`;
    const LW = 3; // ~0.25 mm
    ctx.fillStyle = INK;
    // rect in ruler coordinates: a = along the edge (from pos), d = depth from the edge
    const rect = (edge, pos, a0, a1, d0, d1) => {
      if (edge === 't') ctx.fillRect(pos + a0, d0, a1 - a0, d1 - d0);
      else if (edge === 'b') ctx.fillRect(pos + a0, H - d1, a1 - a0, d1 - d0);
      else if (edge === 'l') ctx.fillRect(d0, pos + a0, d1 - d0, a1 - a0);
      else ctx.fillRect(W - d1, pos + a0, d1 - d0, a1 - a0);
    };
    const pt = (edge, pos, a, d) => (edge === 't' ? [pos + a, d] : edge === 'b' ? [pos + a, H - d] : edge === 'l' ? [d, pos + a] : [W - d, pos + a]);
    function ruler(edge, pos) {
      rect(edge, pos, -LW / 2, LW / 2, 0, P(10) + LW / 2); // spine
      for (let d = 0; d <= 10; d++) {
        const D = P(d), big = d % 5 === 0;
        const len = P(big ? 3 : 1.6);
        rect(edge, pos, -LW / 2, len, d === 0 ? 0 : D - LW / 2, d === 0 ? LW : D + LW / 2);
        if (big && d > 0) {
          const [x, y] = pt(edge, pos, len + P(0.6), D);
          ctx.font = font(26, 700);
          if (edge === 't' || edge === 'b') { ctx.textAlign = 'left'; ctx.textBaseline = 'middle'; ctx.fillText(String(d), x, y); }
          else { ctx.textAlign = 'center'; ctx.textBaseline = 'top'; ctx.fillText(String(d), x, y); }
        }
      }
    }
    const NAMES = { t: 'TOP · 上', b: 'BOTTOM · 下', l: 'LEFT · 左', r: 'RIGHT · 右' };
    for (const f of [0.2, 0.5, 0.8]) { ruler('t', W * f); ruler('b', W * f); }
    for (const f of [0.25, 0.5, 0.75]) { ruler('l', H * f); ruler('r', H * f); }
    ctx.font = font(30, 700);
    ctx.textBaseline = 'middle';
    ctx.textAlign = 'center';
    ctx.fillText(NAMES.t, W * 0.5 - P(12), P(6));
    ctx.fillText(NAMES.b, W * 0.5 - P(12), H - P(6));
    ctx.textAlign = 'left'; ctx.fillText(NAMES.l, P(12.5), H * 0.5);
    ctx.textAlign = 'right'; ctx.fillText(NAMES.r, W - P(12.5), H * 0.5);

    // reference lines: 100.0 mm horizontal, 50.0 mm vertical, with end ticks (measure between the tick centres)
    const cx = W / 2, cy = H / 2, hy = cy + P(12);
    const line = (x0, y0, x1, y1, w) => { ctx.save(); ctx.strokeStyle = INK; ctx.lineWidth = w; ctx.lineCap = 'butt'; ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x1, y1); ctx.stroke(); ctx.restore(); };
    const hx0 = cx - P(50), hx1 = cx + P(50);
    line(hx0, hy, hx1, hy, 2);
    line(hx0, hy - P(3), hx0, hy + P(3), 2); line(hx1, hy - P(3), hx1, hy + P(3), 2);
    const vy0 = cy - P(25), vy1 = cy + P(25), vx = cx;
    line(vx, vy0, vx, vy1, 2);
    line(vx - P(3), vy0, vx + P(3), vy0, 2); line(vx - P(3), vy1, vx + P(3), vy1, 2);
    ctx.fillStyle = INK;
    ctx.font = font(30, 700);
    ctx.textAlign = 'center'; ctx.textBaseline = 'top';
    ctx.fillText('100.0 mm', cx - P(25), hy + P(1.2));
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    ctx.fillText('50.0 mm', vx + P(2), cy + P(19));

    // instructions
    const wrap = (text, x, y, maxW, lh) => {
      let lineStr = '', lastSpace = -1;
      const out = [];
      for (const ch of text) {
        const next = lineStr + ch;
        if (ctx.measureText(next).width > maxW && lineStr) {
          if (ch !== ' ' && lastSpace > 0 && /[A-Za-z0-9.,)]/.test(ch)) {
            out.push(lineStr.slice(0, lastSpace)); lineStr = lineStr.slice(lastSpace + 1) + ch;
          } else { out.push(lineStr); lineStr = ch === ' ' ? '' : ch; }
          lastSpace = lineStr.lastIndexOf(' ');
        } else { lineStr = next; if (ch === ' ') lastSpace = lineStr.length - 1; }
      }
      if (lineStr) out.push(lineStr);
      out.forEach((l, i) => ctx.fillText(l, x, y + i * lh));
      return y + out.length * lh;
    };
    const paperName = paper.name;
    const blocks = [
      { x: P(16), w: cx - P(22), title: `打印校准测试页 · ${paperName.zh}`, lines: [
        '1. 冲印时选 Fill（填满），不要选 Crop。',
        '2. 四边的刻度从纸边开始，1 格 = 1 mm：纸边处的读数 = 这一边被裁掉的 mm。',
        '3. 用尺子量中间 100 mm 线（两端短竖线之间）的实际长度。',
        '4. 把数字填回网页「打印校准」，重新导出照片。'] },
      { x: cx + P(6), w: W - cx - P(22), title: `Calibration test sheet · ${paperName.en}`, lines: [
        '1. Order the print with Fill, not Crop.',
        '2. Each edge has a ruler starting at the paper edge (1 tick = 1 mm): the reading at the edge = mm trimmed there.',
        '3. Measure the 100 mm line in the middle (between its end ticks) with a ruler.',
        '4. Enter the numbers under "Print calibration" and export again.'] },
    ];
    ctx.textAlign = 'left'; ctx.textBaseline = 'top';
    for (const b of blocks) {
      ctx.font = font(30, 700);
      let y = wrap(b.title, b.x, P(15), b.w, 38) + 6;
      ctx.font = font(24, 500);
      for (const l of b.lines) y = wrap(l, b.x, y, b.w, 30) + 4;
    }
    ctx.font = font(22, 500);
    ctx.fillStyle = '#444444';
    ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(`${paperName.en} · ${W}×${H} px · 300 DPI`, P(16), H - P(14));
    ctx.textAlign = 'right';
    ctx.fillText('lfkdsk.github.io/id-photo-print', W - P(16), H - P(14));
    return cvs;
  }

  async function canvasToJpeg(canvas) {
    const blob = await new Promise((res, rej) => canvas.toBlob((b) => (b ? res(b) : rej(new Error('toBlob failed'))), 'image/jpeg', 0.95));
    const bytes = setJpegDpi(new Uint8Array(await blob.arrayBuffer()), DPI);
    return new Blob([bytes], { type: 'image/jpeg' });
  }

  function download(url, name) {
    const a = document.createElement('a');
    a.href = url; a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
  }

  let calibSheetUrl = null;
  el.calibSheetBtn.addEventListener('click', async () => {
    const paper = currentPaper();
    el.calibSheetBtn.disabled = true;
    try {
      const canvas = renderCalibSheet(paper);
      const blob = await canvasToJpeg(canvas);
      canvas.width = canvas.height = 0;
      const name = `calibration-${paper.slug}.jpg`;
      if (calibSheetUrl) URL.revokeObjectURL(calibSheetUrl);
      calibSheetUrl = URL.createObjectURL(blob);
      download(calibSheetUrl, name);
      el.calibSheetImg.src = calibSheetUrl;
      el.calibSheetImg.hidden = false;
      el.calibSheetInfo.textContent = t('calibSheetInfo')(name);
    } catch (err) {
      console.error(err);
      alert(String(err && err.message || err));
    } finally {
      el.calibSheetBtn.disabled = false;
    }
  });

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
    const blob = await canvasToJpeg(canvas);
    const name = `id-photo-${layout.preset.slug}-on-${layout.paper.slug}.jpg`;
    canvas.width = canvas.height = 0; // free memory (iOS)
    return { blob, name, layout };
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
      download(url, name);
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

  // safe margins (persisted). Migration: the old single value 'safeMm' becomes the long-side value.
  { const sv = store.get('safe'); if (sv === '0' || sv === '1') el.safe.checked = sv === '1';
    let lv = parseFloat(store.get('safeLong'));
    const old = parseFloat(store.get('safeMm'));
    if (!Number.isFinite(lv) && Number.isFinite(old)) { lv = old; store.set('safeLong', String(clamp(old, 0, SAFE_MAX))); }
    if (store.get('safeMm') != null) store.set('safeMm', null);
    if (Number.isFinite(lv)) el.safeLong.value = String(clamp(lv, 0, SAFE_MAX));
    const shv = parseFloat(store.get('safeShort')); if (Number.isFinite(shv)) el.safeShort.value = String(clamp(shv, 0, SAFE_MAX)); }
  const onSafe = () => {
    store.set('safe', el.safe.checked ? '1' : '0');
    for (const [n, key] of [[el.safeLong, 'safeLong'], [el.safeShort, 'safeShort']]) {
      const v = parseFloat(n.value);
      if (Number.isFinite(v)) store.set(key, String(clamp(v, 0, SAFE_MAX)));
    }
    clearExport(); scheduleRender();
  };
  el.safe.addEventListener('change', onSafe);
  for (const n of [el.safeLong, el.safeShort]) {
    n.addEventListener('input', onSafe);
    n.addEventListener('change', () => { const sv = safeVals(); el.safeLong.value = String(sv.long); el.safeShort.value = String(sv.short); onSafe(); });
  }
  el.safeHint.addEventListener('click', (e) => {
    const b = e.target.closest('#switchPaper');
    if (!b) return;
    el.paper.value = b.dataset.paper;
    syncCalibInput();
    clearExport(); scheduleRender();
  });
  el.paper.addEventListener('change', () => { syncCalibInput(); el.calibSheetImg.hidden = true; el.calibSheetInfo.textContent = ''; });

  // print calibration (persisted per paper)
  const saveCalib = () => store.set('calib', JSON.stringify(calib));
  const calEntry = () => (calib[currentPaper().id] = calib[currentPaper().id] || {});
  const pruneCalib = () => {
    const id = currentPaper().id, c = calib[id];
    if (!c) return;
    if (c.trim && !EDGES.some((e) => validTrim(c.trim[e]))) delete c.trim;
    if (!(c.line > 0)) delete c.line;
    if (!(c.measured > 0 && c.expected > 0)) { delete c.measured; delete c.expected; }
    if (!Object.keys(c).length) delete calib[id];
  };
  const onCalib = () => { pruneCalib(); saveCalib(); clearExport(); scheduleRender(); };
  el.calibMeasured.addEventListener('input', () => {
    const v = parseFloat(el.calibMeasured.value);
    const c = calEntry();
    if (Number.isFinite(v) && v > 0) { c.measured = v; c.expected = currentPreset().w; } else { delete c.measured; delete c.expected; }
    onCalib();
  });
  el.calibLine.addEventListener('input', () => {
    const v = parseFloat(el.calibLine.value);
    const c = calEntry();
    if (Number.isFinite(v) && v > 0) c.line = v; else delete c.line;
    onCalib();
  });
  for (const e of EDGES) {
    el.trim[e].addEventListener('input', () => {
      const v = parseFloat(el.trim[e].value);
      const c = calEntry();
      c.trim = c.trim || {};
      if (validTrim(v)) c.trim[e] = v; else delete c.trim[e];
      onCalib();
    });
  }
  el.calibReset.addEventListener('click', () => {
    delete calib[currentPaper().id];
    saveCalib();
    syncCalibInput();
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
    layout: () => { const l = computeLayout(); return { W: l.W, H: l.H, orient: l.orient, main: l.mainCount, total: l.tiles.length, safe: l.safe, k: l.k, minMargin: l.minMargin, edgeM: l.edgeM, refM: l.refM, tiles: l.tiles.map(({ x, y, w, h }) => ({ x, y, w, h })) }; },
    image: () => ({ w: state.imgW, h: state.imgH }),
    setCrop: (c) => { Object.assign(state.crop, c); syncCropUI(); scheduleRender(); },
    setJpegDpi,
  };
})();
