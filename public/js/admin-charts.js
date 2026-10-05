/* إصغاء — الرسوم البيانية في لوحة التحكم
   سمة موحّدة من متغيرات CSS · Chart.js للمنحنيات · مكوّنات HTML (أشرطة، قمع، حرارية) بتلميح واحد
   البيانات تُقرأ من <script type="application/json"> داخل كل [data-chart] ومن data-spark في الخطوط المصغّرة */
(function () {
  'use strict';
  var doc = document;
  var root = doc.documentElement;
  var AR = '٠١٢٣٤٥٦٧٨٩';
  var MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
  var WD = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  var DAY = 864e5;
  var PRINT = doc.body.classList.contains('rpt');
  var SVGNS = 'http://www.w3.org/2000/svg';

  /* ── أرقام وتواريخ عربية ── */
  function ard(s) { return String(s).replace(/\d/g, function (d) { return AR[d]; }); }
  function nf(n, dec) {
    var x = Number(n) || 0;
    dec = dec || 0;
    var s = x.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
    return ard(s.replace(/,/g, '٬').replace(/\./g, '٫'));
  }
  function fmtVal(v, fmt) {
    if (v == null || isNaN(v)) return '—';
    if (fmt === 'pct') return nf(v, v > 0 && v < 10 ? 1 : 0) + '٪';
    return nf(Math.round(v));
  }
  function pd(s) { var p = String(s).split('-'); return new Date(Date.UTC(+p[0], +p[1] - 1, +p[2])); }
  function iso(d) { return d.toISOString().slice(0, 10); }
  function dShort(s) { var d = pd(s); return ard(d.getUTCDate() + '/' + (d.getUTCMonth() + 1)); }
  function dLong(s, wd) { var d = pd(s); return (wd ? WD[d.getUTCDay()] + ' ' : '') + ard(d.getUTCDate()) + ' ' + MONTHS[d.getUTCMonth()]; }
  function dRange(a, b) {
    var x = pd(a), y = pd(b);
    if (x.getUTCMonth() === y.getUTCMonth()) return ard(x.getUTCDate()) + '–' + ard(y.getUTCDate()) + ' ' + MONTHS[y.getUTCMonth()];
    return dLong(a) + ' – ' + dLong(b);
  }

  /* ── السمة: تُقرأ من متغيرات CSS وقت التشغيل ── */
  var T = { c: {} };
  function cssVar(name, fb) { var v = getComputedStyle(root).getPropertyValue(name).trim(); return v || fb; }
  function theme() {
    T.font = cssVar('--body', 'ThmanyahText, system-ui, sans-serif');
    T.ink = cssVar('--ink', '#141817');
    T.muted = cssVar('--muted', '#6d7672');
    T.grid = cssVar('--ch-grid', '#efede6');
    T.axis = cssVar('--ch-axis', '#dedbd0');
    T.surface = cssVar('--card', '#ffffff');
    T.band = cssVar('--ch-band', 'rgba(20,24,23,.045)');
    T.c = {
      teal: cssVar('--teal', '#0e6e62'), gold: cssVar('--ch-2', '#b8891f'), heat: cssVar('--heat-4', '#2b8576'),
      c1: cssVar('--ch-1', '#008573'), c2: cssVar('--ch-2', '#b8891f'), c3: cssVar('--ch-3', '#2c5fa8'), c4: cssVar('--ch-4', '#d9734e'), c5: cssVar('--ch-5', '#8b5a9e'),
      prev: cssVar('--ch-prev', '#a3aaa6'), other: cssVar('--ch-other', '#c3c8c4'), 'teal-soft': cssVar('--ch-teal-soft', '#a9d1c9'),
    };
    ['new', 'contacted', 'qualified', 'won', 'lost'].forEach(function (k) { T.c['st-' + k] = cssVar('--st-' + k, '#9ba39e'); });
  }
  function col(k) { return T.c[k] || k || T.c.teal; }
  function rgba(hex, a) {
    var h = String(hex).trim();
    if (h.charAt(0) !== '#') return h;
    if (h.length === 4) h = '#' + h[1] + h[1] + h[2] + h[2] + h[3] + h[3];
    var n = parseInt(h.slice(1, 7), 16);
    return 'rgba(' + ((n >> 16) & 255) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')';
  }
  function el(tag, cls, text) { var e = doc.createElement(tag); if (cls) e.className = cls; if (text != null) e.textContent = text; return e; }

  /* ── التلميح الموحّد ── */
  var tipEl = null;
  function tipNode() {
    if (!tipEl) { tipEl = el('div', 'ch-tip'); tipEl.setAttribute('aria-hidden', 'true'); tipEl.hidden = true; doc.body.appendChild(tipEl); }
    return tipEl;
  }
  // rows: [{ label, value, color, key: line|rect|dash|none, sep }] — النصوص تُدرج كنص لا HTML
  function showTip(x, y, title, rows) {
    var t = tipNode();
    t.textContent = '';
    if (title) t.appendChild(el('div', 'ch-tip-t', title));
    rows.forEach(function (r) {
      var row = el('div', 'ch-tip-r' + (r.sep ? ' sep' : ''));
      var k = el('i', 'ch-key ' + (r.color ? (r.key || 'line') : 'none'));
      if (r.color) k.style.setProperty('--c', r.color);
      row.appendChild(k);
      row.appendChild(el('span', '', r.label));
      row.appendChild(el('b', '', r.value));
      t.appendChild(row);
    });
    t.hidden = false;
    var w = t.offsetWidth, h = t.offsetHeight, vw = root.clientWidth, vh = window.innerHeight, g = 16;
    var left = x - w - g; // يمين-لليسار: التلميح يسار المؤشر افتراضيًا
    if (left < 8) left = x + g;
    if (left + w > vw - 8) left = Math.max(8, vw - w - 8);
    var top = Math.max(8, Math.min(y - h / 2, vh - h - 8));
    t.style.left = Math.round(left) + 'px';
    t.style.top = Math.round(top) + 'px';
  }
  function hideTip() { if (tipEl) tipEl.hidden = true; }

  /* ── مقاييس ومجموعات Chart.js ── */
  function xScale(labels, o) {
    return {
      offset: !!o.offset,
      grid: { display: false, drawTicks: false },
      border: { display: true, color: T.axis },
      ticks: {
        display: o.ticks !== false, color: T.muted, maxRotation: 0, autoSkip: true, autoSkipPadding: 18, padding: 8, font: { size: 11 },
        callback: function (v, i) { return dShort(labels[i]); },
      },
    };
  }
  function yScale(fmt, o) {
    return {
      position: 'right', beginAtZero: true, stacked: !!o.stacked, grace: '8%',
      border: { display: false },
      grid: { color: T.grid, drawTicks: false, lineWidth: 1 },
      ticks: { color: T.muted, padding: 10, maxTicksLimit: o.maxTicks || 5, precision: 0, font: { size: 11 }, callback: function (v) { return fmtVal(v, fmt); } },
      afterFit: function (s) { s.width = o.yw || 46; },
    };
  }
  function baseOpts(cfg, o) {
    var opts = {
      responsive: true, maintainAspectRatio: false,
      animation: PRINT ? false : { duration: 550, easing: 'easeOutQuart' },
      layout: { padding: { top: 8, left: 16, right: 0, bottom: 0 } },
      interaction: { mode: 'index', intersect: false },
      events: ['mousemove', 'mouseout', 'touchstart', 'touchmove', 'click'],
      plugins: { legend: { display: false }, tooltip: { enabled: false } },
      scales: { x: xScale(cfg.labels, o), y: yScale(cfg.fmt, o) },
    };
    if (PRINT) opts.devicePixelRatio = 2;
    return opts;
  }
  function areaFill(c, a) {
    return function (ctx) {
      var area = ctx.chart.chartArea;
      if (!area) return rgba(c, a / 2);
      var g = ctx.chart.ctx.createLinearGradient(0, area.top, 0, area.bottom);
      g.addColorStop(0, rgba(c, a));
      g.addColorStop(1, rgba(c, 0.01));
      return g;
    };
  }
  function lineDs(s) {
    var c = col(s.color);
    return {
      type: 'line', label: s.label, data: s.data, borderColor: c, _c: c,
      borderWidth: s.dashed ? 1.75 : 2, borderDash: s.dashed ? [5, 4] : [], borderCapStyle: 'round', borderJoinStyle: 'round',
      pointRadius: 0, pointHoverRadius: 0, pointHitRadius: 0, tension: 0.35, cubicInterpolationMode: 'monotone',
      fill: s.fill ? 'origin' : false, backgroundColor: s.fill ? areaFill(c, 0.18) : 'transparent',
      order: s.dashed ? 2 : 1,
    };
  }
  function barDs(s) {
    var c = col(s.color);
    return { type: 'bar', label: s.label, data: s.data, backgroundColor: c, hoverBackgroundColor: c, _c: c, borderRadius: 4, borderSkipped: 'start', maxBarThickness: 16, categoryPercentage: 0.8, barPercentage: 0.88 };
  }

  // مؤشر موحّد: خط عمودي/عمود خفيف + نقاط على المنحنيات، ويتزامن عبر لوحات المجموعة
  var hoverPlugin = {
    id: 'admHover',
    afterEvent: function (chart, args) {
      var g = chart.$g, e = args.event;
      if (!g) return;
      if (e.type === 'mouseout') { g.set(null); return; }
      var a = chart.chartArea;
      if (!a || e.x < a.left - 8 || e.x > a.right + 8 || e.y < a.top - 12 || e.y > a.bottom + 26) { if (e.type !== 'click') g.set(null); return; }
      var n = chart.data.labels.length;
      var i = Math.round(chart.scales.x.getValueForPixel(e.x));
      g.set(Math.max(0, Math.min(n - 1, i)), chart, e.native);
    },
    beforeDatasetsDraw: function (chart) {
      var g = chart.$g;
      if (!g || g.idx == null || !chart.$bars) return;
      var a = chart.chartArea, x = chart.scales.x.getPixelForValue(g.idx);
      var w = Math.max(6, ((a.right - a.left) / chart.data.labels.length) * 0.92);
      var ctx = chart.ctx;
      ctx.save(); ctx.fillStyle = T.band; ctx.fillRect(x - w / 2, a.top, w, a.bottom - a.top); ctx.restore();
    },
    afterDatasetsDraw: function (chart) {
      var g = chart.$g;
      if (!g || g.idx == null) return;
      var a = chart.chartArea, x = chart.scales.x.getPixelForValue(g.idx), ctx = chart.ctx;
      ctx.save();
      if (!chart.$bars) {
        ctx.strokeStyle = T.axis; ctx.lineWidth = 1;
        ctx.beginPath(); ctx.moveTo(Math.round(x) + 0.5, a.top); ctx.lineTo(Math.round(x) + 0.5, a.bottom); ctx.stroke();
      }
      chart.data.datasets.forEach(function (ds, di) {
        if (ds.type !== 'line') return;
        var meta = chart.getDatasetMeta(di);
        var pt = meta && !meta.hidden && meta.data[g.idx];
        if (!pt) return;
        ctx.beginPath(); ctx.arc(pt.x, pt.y, 4.5, 0, Math.PI * 2);
        ctx.fillStyle = ds._c || ds.borderColor; ctx.fill();
        ctx.lineWidth = 2; ctx.strokeStyle = T.surface; ctx.stroke();
      });
      ctx.restore();
    },
  };

  function tipTitle(cfg, i) {
    var d = cfg.labels[i];
    if (cfg.bucket > 1) {
      var next = cfg.labels[i + 1];
      var end = next ? iso(new Date(pd(next).getTime() - DAY)) : iso(new Date(pd(d).getTime() + (cfg.bucket - 1) * DAY));
      return 'أسبوع ' + dRange(d, end);
    }
    return dLong(d, true);
  }
  function tipRows(cfg, i) {
    var rows = [];
    if (cfg.type === 'multiples') {
      cfg.panels.forEach(function (p) { rows.push({ label: p.label, value: fmtVal(p.data[i], cfg.fmt), color: col(p.color), key: p.kind === 'bar' ? 'rect' : 'line' }); });
      if (cfg.derived) {
        var den = cfg.panels[cfg.derived.den].data[i], num = cfg.panels[cfg.derived.num].data[i];
        rows.push({ label: cfg.derived.label, value: den ? fmtVal((num / den) * 100, 'pct') : '—', sep: true });
      }
      return rows;
    }
    var tot = 0;
    cfg.series.forEach(function (s) {
      var v = s.data[i];
      tot += v || 0;
      rows.push({ label: s.dates ? 'السابقة · ' + dLong(s.dates[i]) : s.label, value: fmtVal(v, cfg.fmt), color: col(s.color), key: s.dashed ? 'dash' : cfg.type === 'stacked' ? 'rect' : 'line' });
    });
    if (cfg.type === 'stacked') { rows.reverse(); rows.push({ label: 'الإجمالي', value: fmtVal(tot, cfg.fmt), sep: true }); }
    return rows;
  }

  function group(box, cfg) {
    var g = { cfg: cfg, charts: [], idx: null };
    var n = cfg.labels.length;
    g.add = function (c) { c.$g = g; g.charts.push(c); };
    g.set = function (i, src, native) {
      if (i !== g.idx) { g.idx = i; g.charts.forEach(function (c) { c.draw(); }); }
      if (i == null) { hideTip(); return; }
      var p = null;
      var t = native && ((native.touches && native.touches[0]) || (native.changedTouches && native.changedTouches[0]) || native);
      if (t && t.clientX != null) p = { x: t.clientX, y: t.clientY };
      else {
        var c = src || g.charts[0], r = c.canvas.getBoundingClientRect();
        p = { x: r.left + c.scales.x.getPixelForValue(i), y: r.top + (c.chartArea.top + c.chartArea.bottom) / 2 };
      }
      showTip(p.x, p.y, tipTitle(cfg, i), tipRows(cfg, i));
    };
    // لوحة المفاتيح: الأسهم تتنقل بين الأيام (المحور الزمني من اليسار لليمين)
    box.addEventListener('keydown', function (e) {
      var k = e.key;
      if (k !== 'ArrowLeft' && k !== 'ArrowRight' && k !== 'Home' && k !== 'End' && k !== 'Escape') return;
      e.preventDefault();
      if (k === 'Escape') { g.set(null); return; }
      var i = g.idx == null ? n - 1 : g.idx;
      if (k === 'ArrowRight') i = Math.min(n - 1, i + 1);
      if (k === 'ArrowLeft') i = Math.max(0, i - 1);
      if (k === 'Home') i = 0;
      if (k === 'End') i = n - 1;
      g.set(i);
    });
    box.addEventListener('focus', function () { g.set(n - 1); });
    box.addEventListener('blur', function () { g.set(null); });
    box.addEventListener('mouseleave', function () { if (doc.activeElement !== box) g.set(null); });
    return g;
  }

  function canvasIn(holder) { var cv = doc.createElement('canvas'); holder.appendChild(cv); return cv; }

  /* ── أنواع الرسوم ── */
  var BUILD = {};

  // منحنى/مساحة (مع سلسلة الفترة السابقة المتقطعة)
  BUILD.line = function (box, cfg) {
    var g = group(box, cfg);
    var chart = new window.Chart(canvasIn(box), {
      type: 'line',
      data: { labels: cfg.labels, datasets: cfg.series.map(lineDs) },
      options: baseOpts(cfg, {}),
      plugins: [hoverPlugin],
    });
    g.add(chart);
  };

  // مساحات مكدّسة: حدود بلون السطح تفصل الطبقات
  BUILD.stacked = function (box, cfg) {
    var g = group(box, cfg);
    var ds = cfg.series.map(function (s, i) {
      var c = col(s.color);
      return {
        type: 'line', label: s.label, data: s.data, _c: c, fill: i === 0 ? 'origin' : '-1',
        backgroundColor: rgba(c, 0.78), borderColor: T.surface, borderWidth: 1.5,
        pointRadius: 0, pointHoverRadius: 0, pointHitRadius: 0, tension: 0.3, cubicInterpolationMode: 'monotone',
      };
    });
    var chart = new window.Chart(canvasIn(box), {
      type: 'line', data: { labels: cfg.labels, datasets: ds },
      options: baseOpts(cfg, { stacked: true }), plugins: [hoverPlugin],
    });
    g.add(chart);
  };

  // لوحات متعددة متزامنة على محور زمني واحد (بديل المحورين)
  BUILD.multiples = function (box, cfg) {
    var g = group(box, cfg);
    var n = cfg.panels.length;
    var H = parseInt(getComputedStyle(box).getPropertyValue('--h'), 10) || 280;
    var axisH = 24, headH = 22, gap = 12;
    var plotH = Math.max(70, Math.floor((H - axisH - n * headH - (n - 1) * gap) / n));
    box.classList.add('is-multi');
    cfg.panels.forEach(function (p, i) {
      var last = i === n - 1;
      var wrap = el('div', 'ch-panel');
      var head = el('div', 'ch-panel-h');
      var key = el('i', 'ch-key ' + (p.kind === 'bar' ? 'rect' : 'line'));
      key.style.setProperty('--c', col(p.color));
      var total = p.data.reduce(function (a, b) { return a + (b || 0); }, 0);
      head.appendChild(key);
      head.appendChild(el('span', '', p.label));
      head.appendChild(el('b', '', fmtVal(total, cfg.fmt)));
      var holder = el('div', 'ch-panel-c');
      holder.style.height = (plotH + (last ? axisH : 0)) + 'px';
      wrap.appendChild(head); wrap.appendChild(holder); box.appendChild(wrap);
      var isBar = p.kind === 'bar';
      var ds = isBar ? barDs(p) : lineDs({ label: p.label, data: p.data, color: p.color, fill: true });
      var chart = new window.Chart(canvasIn(holder), {
        type: isBar ? 'bar' : 'line',
        data: { labels: cfg.labels, datasets: [ds] },
        options: baseOpts(cfg, { offset: true, ticks: last, maxTicks: 3 }),
        plugins: [hoverPlugin],
      });
      chart.$bars = isBar;
      g.add(chart);
    });
  };

  // دائرة حلقية (قليلة الأجزاء) بتلميح خارجي
  BUILD.doughnut = function (box, cfg) {
    var total = cfg.items.reduce(function (a, b) { return a + b.n; }, 0);
    var opts = {
      responsive: true, maintainAspectRatio: false, cutout: '74%', layout: { padding: 6 },
      animation: PRINT ? false : { duration: 600, easing: 'easeOutQuart' },
      plugins: {
        legend: { display: false },
        tooltip: {
          enabled: false,
          external: function (ctx) {
            var tt = ctx.tooltip;
            if (!tt || tt.opacity === 0 || !tt.dataPoints || !tt.dataPoints.length) { hideTip(); return; }
            var dp = tt.dataPoints[0], r = ctx.chart.canvas.getBoundingClientRect();
            showTip(r.left + tt.caretX, r.top + tt.caretY, dp.label, [
              { label: cfg.unit === 'زائر' ? 'الزوار' : 'العدد', value: nf(dp.raw), color: cfg.items[dp.dataIndex] ? col(cfg.items[dp.dataIndex].color) : null, key: 'rect' },
              { label: 'الحصة', value: total ? nf((dp.raw / total) * 100, 1) + '٪' : '—' },
            ]);
          },
        },
      },
    };
    if (PRINT) opts.devicePixelRatio = 2;
    new window.Chart(canvasIn(box), {
      type: 'doughnut',
      data: {
        labels: cfg.items.map(function (x) { return x.label; }),
        datasets: [{ data: cfg.items.map(function (x) { return x.n; }), backgroundColor: cfg.items.map(function (x) { return col(x.color); }), hoverBackgroundColor: cfg.items.map(function (x) { return col(x.color); }), borderColor: T.surface, borderWidth: 3, borderRadius: 5, hoverOffset: 5 }],
      },
      options: opts,
    });
    box.addEventListener('mouseleave', hideTip);
  };

  // جدول مخفي بصريًا لقارئ الشاشة (البديل النصي لكل رسم)
  function srTable(box, cfg) {
    var fig = box.closest('figure') || box.parentNode;
    var wrap = el('div', 'sr-only ch-sr');
    var tbl = el('table');
    tbl.appendChild(el('caption', '', box.getAttribute('aria-label') || ''));
    var series = cfg.type === 'multiples' ? cfg.panels : cfg.series;
    var head = el('tr');
    head.appendChild(el('th', '', cfg.bucket > 1 ? 'الأسبوع' : 'اليوم'));
    series.forEach(function (s) { head.appendChild(el('th', '', s.label)); });
    var thead = el('thead'); thead.appendChild(head); tbl.appendChild(thead);
    var tb = el('tbody');
    cfg.labels.forEach(function (d, i) {
      var tr = el('tr');
      tr.appendChild(el('th', '', tipTitle(cfg, i)));
      series.forEach(function (s) { tr.appendChild(el('td', '', fmtVal(s.data[i], cfg.fmt))); });
      tb.appendChild(tr);
    });
    tbl.appendChild(tb);
    wrap.appendChild(tbl);
    fig.appendChild(wrap);
  }

  /* ── خطوط مصغّرة SVG (بلا مكتبة) ── */
  function svgEl(tag, attrs) { var e = doc.createElementNS(SVGNS, tag); Object.keys(attrs).forEach(function (k) { e.setAttribute(k, attrs[k]); }); return e; }
  function spark(svg) {
    var vals = (svg.getAttribute('data-spark') || '').split(',').map(Number).filter(function (v) { return !isNaN(v); });
    if (vals.length < 2) return;
    var c = col(svg.getAttribute('data-color') || 'teal');
    var W = 120, H = 32, pad = 3, n = vals.length;
    var max = Math.max.apply(null, vals) || 1;
    var pts = vals.map(function (v, i) { return [(i / (n - 1)) * W, H - pad - (v / max) * (H - pad * 2)]; });
    var line = 'M' + pts.map(function (p) { return p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join(' L');
    var last = pts[n - 1];
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    svg.setAttribute('preserveAspectRatio', 'none');
    svg.textContent = '';
    svg.appendChild(svgEl('path', { d: line + ' L' + W + ' ' + H + ' L0 ' + H + ' Z', fill: rgba(c, 0.12) }));
    svg.appendChild(svgEl('path', { d: line, fill: 'none', stroke: c, 'stroke-width': '1.6', 'stroke-linejoin': 'round', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
    var dot = 'M' + last[0].toFixed(1) + ' ' + last[1].toFixed(1) + ' l0 0';
    svg.appendChild(svgEl('path', { d: dot, stroke: T.surface, 'stroke-width': '9', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
    svg.appendChild(svgEl('path', { d: dot, stroke: c, 'stroke-width': '5.5', 'stroke-linecap': 'round', 'vector-effect': 'non-scaling-stroke' }));
  }

  /* ── تلميحات مكوّنات HTML: data-tip-t (العنوان) و data-tip="تسمية::قيمة||…" ── */
  function htmlRows(t) {
    var raw = t.getAttribute('data-tip') || '';
    var c = t.getAttribute('data-tip-c');
    return raw ? raw.split('||').map(function (p, i) {
      var kv = p.split('::');
      return { label: kv[0], value: kv[1] || '', color: i === 0 && c ? col(c) : null, key: 'rect' };
    }) : [];
  }
  var htmlOn = false;
  function onPointer(e) {
    var tgt = e.target;
    if (!tgt || !tgt.closest) return;
    var t = tgt.closest('[data-tip-t]');
    if (!t) { if (htmlOn && !tgt.closest('[data-chart]')) { hideTip(); htmlOn = false; } return; }
    htmlOn = true;
    showTip(e.clientX, e.clientY, t.getAttribute('data-tip-t'), htmlRows(t));
  }
  function bindHtmlTips() {
    doc.addEventListener('pointermove', onPointer, { passive: true });
    doc.addEventListener('pointerdown', onPointer, { passive: true });
    doc.addEventListener('focusin', function (e) {
      var t = e.target.closest && e.target.closest('[data-tip-t]');
      if (!t) return;
      var r = t.getBoundingClientRect();
      htmlOn = true;
      showTip(r.left + Math.min(r.width / 2, 60), r.top + r.height / 2, t.getAttribute('data-tip-t'), htmlRows(t));
    });
    doc.addEventListener('focusout', function () { if (htmlOn) { hideTip(); htmlOn = false; } });
    doc.addEventListener('pointerleave', hideTip);
    window.addEventListener('scroll', hideTip, { passive: true });
  }

  /* ── التشغيل ── */
  var started = false;
  function init() {
    if (started) return;
    started = true;
    theme();
    Array.prototype.forEach.call(doc.querySelectorAll('svg[data-spark]'), spark);
    bindHtmlTips();
    if (window.Chart) {
      var C = window.Chart;
      C.defaults.font.family = T.font;
      C.defaults.font.size = 11;
      C.defaults.color = T.muted;
      Array.prototype.forEach.call(doc.querySelectorAll('[data-chart]'), function (box) {
        var s = box.querySelector('script[type="application/json"]');
        if (!s) return;
        var cfg;
        try { cfg = JSON.parse(s.textContent); } catch (e) { return; }
        var build = BUILD[cfg.type];
        if (!build) return;
        try {
          build(box, cfg);
          if (cfg.type !== 'doughnut') srTable(box, cfg);
        } catch (err) { if (window.console) console.error('[admin-charts]', cfg.type, err); }
      });
    }
    root.classList.add('charts-ready');
    var ev;
    try { ev = new CustomEvent('adm:charts-ready'); } catch (e) { ev = doc.createEvent('Event'); ev.initEvent('adm:charts-ready', false, false); }
    window.dispatchEvent(ev);
  }
  function start() {
    // ننتظر خط «ثمانية» حتى تُرسم الأرقام على اللوحة بالخط الصحيح من أول مرة
    var fonts = doc.fonts && doc.fonts.load ? Promise.all([doc.fonts.load('400 12px ThmanyahText'), doc.fonts.load('500 12px ThmanyahText')]) : Promise.resolve();
    fonts.then(init, init);
    setTimeout(init, 1500);
  }
  if (doc.readyState === 'loading') doc.addEventListener('DOMContentLoaded', start); else start();

  window.AdmCharts = { nf: nf, ready: function () { return started; } };
})();
