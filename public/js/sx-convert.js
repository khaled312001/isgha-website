/* sx-convert — حركات أقسام التحويل (الخطوات، المخطط، الأسئلة، النماذج) — يُدمج في site.js قبل النشر */
(function () {
  'use strict';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var clamp = function (v) { return v < 0 ? 0 : v > 1 ? 1 : v; };

  /* ── الخطوات: خط تقدم يُرسم مع التمرير ── */
  var tls = $$('[data-cx-tl]');
  function paintTl(tl) {
    var rail = tl.querySelector('.cx-tl-rail');
    if (!rail) return;
    var rr = rail.getBoundingClientRect();
    var vh = window.innerHeight || 800;
    var vertical = rr.height > rr.width;
    var p;
    if (reduce) p = 1;
    else if (vertical) p = clamp((vh * 0.8 - rr.top) / Math.max(rr.height, 1));
    else p = clamp((vh * 0.9 - rr.top) / (vh * 0.45));
    tl.style.setProperty('--p', p.toFixed(4));
    $$('.cx-tl-step', tl).forEach(function (st) {
      var nb = st.querySelector('.cx-tl-node').getBoundingClientRect();
      var f = vertical ? (nb.top + nb.height / 2 - rr.top) / Math.max(rr.height, 1) : (rr.right - (nb.left + nb.width / 2)) / Math.max(rr.width, 1);
      st.classList.toggle('is-on', p > 0.02 && p >= f - 0.015);
    });
  }
  if (tls.length) {
    tls.forEach(function (tl) { tl.style.setProperty('--p', reduce ? 1 : 0); });
    var ticking = false;
    var onScroll = function () {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () { ticking = false; tls.forEach(paintTl); });
    };
    tls.forEach(paintTl);
    requestAnimationFrame(function () { tls.forEach(function (tl) { tl.classList.add('cx-live'); }); });
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll);
  }

  /* ── المخطط: أسلاك منحنية تُرسم من مواقع العناصر الفعلية ── */
  var SVGNS = 'http://www.w3.org/2000/svg';
  function svgEl(tag, attrs) {
    var el = document.createElementNS(SVGNS, tag);
    Object.keys(attrs).forEach(function (k) { el.setAttribute(k, attrs[k]); });
    return el;
  }
  // موضع العنصر داخل الحاوية دون احتساب التحويلات (الدوران والإزاحة المؤقتة)
  function pos(el, root) {
    var x = 0, y = 0, w = el.offsetWidth, h = el.offsetHeight;
    while (el && el !== root) { x += el.offsetLeft; y += el.offsetTop; el = el.offsetParent; }
    return { x: x, y: y, w: w, h: h };
  }
  function drawFlow(fl) {
    var svg = fl.querySelector('.cx-fl-wires');
    var core = fl.querySelector('.cx-fl-core');
    var inCol = fl.querySelector('.cx-fl-in');
    if (!svg || !core || !inCol) return;
    while (svg.firstChild) svg.removeChild(svg.firstChild);
    if (getComputedStyle(svg).display === 'none') return;
    var W = fl.offsetWidth, H = fl.offsetHeight;
    svg.setAttribute('viewBox', '0 0 ' + W + ' ' + H);
    var c = pos(core, fl);
    var cy = c.y + c.h / 2;
    var rtl = c.x < pos(inCol, fl).x;
    var inX = rtl ? c.x + c.w + 2 : c.x - 2;
    var outX = rtl ? c.x - 2 : c.x + c.w + 2;
    function wire(box, side, i) {
      var b = pos(box, fl);
      var y = b.y + b.h / 2;
      var x = (side === 'in') === rtl ? b.x : b.x + b.w;
      var hx = side === 'in' ? inX : outX;
      var mx = (x + hx) / 2;
      var f = function (n) { return n.toFixed(1); };
      var d = side === 'in'
        ? 'M' + f(x) + ',' + f(y) + ' C' + f(mx) + ',' + f(y) + ' ' + f(mx) + ',' + f(cy) + ' ' + f(hx) + ',' + f(cy)
        : 'M' + f(hx) + ',' + f(cy) + ' C' + f(mx) + ',' + f(cy) + ' ' + f(mx) + ',' + f(y) + ' ' + f(x) + ',' + f(y);
      var path = svgEl('path', { d: d, class: 'w-' + side });
      svg.appendChild(path);
      if (side === 'out') path.style.setProperty('--len', Math.ceil(path.getTotalLength ? path.getTotalLength() : 600));
      svg.appendChild(svgEl('circle', { cx: f(x), cy: f(y), r: 3.2, class: side === 'in' ? 'j-in' : 'j-out' }));
      if (!reduce) {
        var dot = svgEl('circle', { r: side === 'in' ? 3 : 3.6, class: 'dot-' + side, opacity: 0 });
        var dur = side === 'in' ? 3.2 : 2.6;
        var beginAt = (side === 'in' ? 0.3 : 1.9) + i * 0.55;
        dot.appendChild(svgEl('animateMotion', { dur: dur + 's', begin: beginAt + 's', repeatCount: 'indefinite', path: d, keyPoints: '0;1', keyTimes: '0;1', calcMode: 'spline', keySplines: '.45 0 .25 1' }));
        dot.appendChild(svgEl('animate', { attributeName: 'opacity', dur: dur + 's', begin: beginAt + 's', repeatCount: 'indefinite', values: '0;1;1;0', keyTimes: '0;.12;.85;1' }));
        svg.appendChild(dot);
      }
    }
    $$('.cx-fl-in .cx-fl-box', fl).forEach(function (b, i) { wire(b, 'in', i); });
    $$('.cx-fl-out .cx-fl-box', fl).forEach(function (b, i) { wire(b, 'out', i); });
    svg.appendChild(svgEl('circle', { cx: inX.toFixed(1), cy: cy.toFixed(1), r: 4.5, class: 'j-in' }));
    svg.appendChild(svgEl('circle', { cx: outX.toFixed(1), cy: cy.toFixed(1), r: 4.5, class: 'j-out' }));
  }
  var flows = $$('[data-cx-flow]');
  if (flows.length) {
    var redraw = function () { flows.forEach(drawFlow); };
    redraw();
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(redraw);
    window.addEventListener('load', redraw);
    var rt;
    window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(redraw, 120); });
  }
  /* ── بطاقات الواجهات: نقاط التمرير الأفقي على الجوال ── */
  $$('[data-cx-swipe]').forEach(function (grid) {
    var dots = grid.parentNode.querySelectorAll('.cx-swipe-dots i');
    if (!dots.length) return;
    var cards = grid.children;
    var t;
    grid.addEventListener('scroll', function () {
      clearTimeout(t);
      t = setTimeout(function () {
        var step = cards.length > 1 ? Math.abs(cards[1].offsetLeft - cards[0].offsetLeft) : 1;
        var idx = Math.round(Math.abs(grid.scrollLeft) / (step || 1));
        if (grid.scrollWidth - grid.clientWidth - Math.abs(grid.scrollLeft) < 4) idx = cards.length - 1;
        for (var i = 0; i < dots.length; i++) dots[i].classList.toggle('on', i === idx);
      }, 60);
    }, { passive: true });
  });
  /* ── الأسئلة الشائعة: أكورديون بزر و aria-expanded + «عرض المزيد» ── */
  $$('[data-cx-acc]').forEach(function (list) {
    function setOpen(item, open) {
      var q = item.querySelector('.cx-qa-q');
      item.classList.toggle('is-open', open);
      if (q) q.setAttribute('aria-expanded', open ? 'true' : 'false');
    }
    list.addEventListener('click', function (e) {
      var q = e.target.closest('.cx-qa-q');
      if (q && list.contains(q)) {
        var item = q.closest('.cx-qa');
        var open = !item.classList.contains('is-open');
        // سؤال واحد مفتوح في كل مرة ليبقى القسم مختصرًا
        if (open) $$('.cx-qa.is-open', list).forEach(function (x) { if (x !== item) setOpen(x, false); });
        setOpen(item, open);
        return;
      }
      var more = e.target.closest('[data-cx-more]');
      if (more && list.contains(more)) {
        list.classList.add('is-all');
        more.setAttribute('aria-expanded', 'true');
        var first = list.querySelector('.cx-qa.is-extra .cx-qa-q');
        if (first) first.focus({ preventScroll: true });
      }
    });
  });
  /* ── النماذج: اتجاه حركة الخطوات + إزالة الخطأ فور تصحيحه (المنطق الأساسي في site.js) ── */
  $$('[data-mform]').forEach(function (form) {
    var last = 1;
    if (!('MutationObserver' in window)) return;
    new MutationObserver(function () {
      var a = form.querySelector('.mstep.active');
      var n = a ? +a.getAttribute('data-step') : 1;
      if (n !== last) { form.setAttribute('data-dir', n < last ? 'back' : 'fwd'); last = n; }
    }).observe(form, { subtree: true, attributes: true, attributeFilter: ['class'] });
  });
  function okValue(el) {
    var v = String(el.value || '').trim();
    if (el.name === 'name') return v.length >= 2;
    if (el.name === 'phone') {
      var dgt = v.replace(/[٠-٩]/g, function (x) { return String(x.charCodeAt(0) - 0x0660); }).replace(/[^\d]/g, '');
      return /^(05\d{8}|5\d{8}|9665\d{8}|\d{9,15})$/.test(dgt);
    }
    if (el.name === 'email') return !v || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
    if (el.name === 'message' && el.closest('[data-cform]')) return v.length >= 5;
    return true;
  }
  $$('[data-mform], [data-cform]').forEach(function (form) {
    var check = function (e, strict) {
      var el = e.target;
      if (!el.name || !/^(name|phone|email|message)$/.test(el.name)) return;
      var f = el.closest('.field');
      if (!f) return;
      var good = okValue(el) && String(el.value || '').trim() !== '';
      if (good) f.classList.remove('err');
      f.classList.toggle('is-ok', good && (strict || f.classList.contains('is-ok')));
    };
    form.addEventListener('input', function (e) { check(e, false); });
    form.addEventListener('focusout', function (e) { check(e, true); });
  });
})();
