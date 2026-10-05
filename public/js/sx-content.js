/* sx-content — حركات أقسام المحتوى (الخدمات، التبويبات، العدّادات) */
(function () {
  'use strict';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var AR = '٠١٢٣٤٥٦٧٨٩';
  var toAr = function (s) { return String(s).replace(/\d/g, function (d) { return AR[d]; }); };
  var toEn = function (s) { return String(s).replace(/[٠-٩]/g, function (d) { return AR.indexOf(d); }); };

  /* بعد انتهاء ظهور العنصر نلغي تأخير التتابع حتى لا تتأخر حركات المرور */
  document.addEventListener('transitionend', function (e) {
    var t = e.target;
    if (e.propertyName === 'opacity' && t.classList && t.classList.contains('rv') && t.classList.contains('in') && t.closest('[data-sx]')) t.classList.add('sx-done');
  });

  /* ── ١. الخدمات: ارتفاع القائمة المخفية في البطاقة الكبيرة ── */
  var cards = $$('[data-sxs-card].photo');
  function measure() {
    cards.forEach(function (c) {
      var r = c.querySelector('.sxs-reveal');
      if (r) c.style.setProperty('--rh', r.offsetHeight + 'px');
    });
  }
  if (cards.length) {
    measure();
    window.addEventListener('resize', measure);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(measure);
  }

  /* ── ٢. التبويبات: مؤشر متحرك + أسهم لوحة المفاتيح ── */
  $$('[data-sx-tabs]').forEach(function (root) {
    var list = root.querySelector('[role=tablist]');
    var tabs = $$('[role=tab]', root);
    var ind = root.querySelector('.sxt-ind');
    var mqH = window.matchMedia('(max-width: 960px)');
    var cur = Math.max(0, tabs.findIndex(function (t) { return t.getAttribute('aria-selected') === 'true'; }));

    function place() {
      var t = tabs[cur];
      if (!ind || !t) return;
      var horizontal = mqH.matches;
      list.setAttribute('aria-orientation', horizontal ? 'horizontal' : 'vertical');
      if (horizontal) {
        ind.style.height = '';
        ind.style.transform = 'translateX(' + t.offsetLeft + 'px) scaleX(' + (t.offsetWidth / 100) + ')';
      } else {
        ind.style.height = t.offsetHeight + 'px';
        ind.style.transform = 'translateY(' + t.offsetTop + 'px)';
      }
    }
    function select(i, focus) {
      cur = i;
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        var p = document.getElementById(t.getAttribute('aria-controls'));
        if (p) p.hidden = !on;
      });
      place();
      if (focus) tabs[i].focus();
      // في الجوال: أبقِ التبويب المختار ظاهرًا في الشريط الأفقي
      if (mqH.matches && list.scrollWidth > list.clientWidth) {
        var t = tabs[i];
        list.scrollTo({ left: t.offsetLeft - (list.clientWidth - t.offsetWidth) / 2, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var n = tabs.length, k = e.key, to = null;
        var rtl = getComputedStyle(root).direction === 'rtl';
        if (k === 'ArrowDown' || k === (rtl ? 'ArrowLeft' : 'ArrowRight')) to = (i + 1) % n;
        else if (k === 'ArrowUp' || k === (rtl ? 'ArrowRight' : 'ArrowLeft')) to = (i - 1 + n) % n;
        else if (k === 'Home') to = 0;
        else if (k === 'End') to = n - 1;
        if (to !== null) { e.preventDefault(); select(to, true); }
      });
    });
    place();
    requestAnimationFrame(function () { root.classList.add('is-ready'); });
    window.addEventListener('resize', place);
    if (document.fonts && document.fonts.ready) document.fonts.ready.then(place);
  });

  /* ── ٣. العدّادات: تعدّ عند الظهور بالأرقام العربية ── */
  var counters = $$('[data-count]');
  function parse(el) {
    var raw = el.getAttribute('data-count') || el.textContent;
    var en = toEn(raw);
    var m = en.match(/(\d[\d,]*(?:\.\d+)?)/);
    if (!m) return null;
    var numStr = m[1];
    return {
      pre: raw.slice(0, m.index),
      post: raw.slice(m.index + numStr.length),
      to: parseFloat(numStr.replace(/,/g, '')),
      dec: (numStr.split('.')[1] || '').length,
      comma: numStr.indexOf(',') > -1,
      ar: /[٠-٩]/.test(raw) || el.hasAttribute('data-ar'),
    };
  }
  function fmt(v, c) {
    var s = v.toFixed(c.dec);
    if (c.comma) s = s.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    if (c.ar) s = toAr(s).replace(/,/g, '٬').replace(/\./g, '٫');
    return c.pre + s + c.post;
  }
  function run(el) {
    var c = parse(el);
    if (!c || el.__sxDone) return;
    el.__sxDone = true;
    var out = el.querySelector('.sxn-v') || el;
    if (reduce) { out.textContent = fmt(c.to, c); return; }
    var dur = 1600, t0 = null;
    function step(ts) {
      if (t0 === null) t0 = ts;
      var p = Math.min(1, (ts - t0) / dur);
      var e = 1 - Math.pow(1 - p, 3);
      out.textContent = fmt(c.to * e, c);
      if (p < 1) requestAnimationFrame(step);
      else el.classList.add('is-done');
    }
    out.textContent = fmt(0, c);
    requestAnimationFrame(step);
  }
  if (counters.length) {
    counters.forEach(function (el) {
      // للاختبار والطباعة: يُنهي العدّ فورًا
      el.addEventListener('sx:finish', function () { var c = parse(el); if (c) { el.__sxDone = true; (el.querySelector('.sxn-v') || el).textContent = fmt(c.to, c); el.classList.add('is-done'); } });
    });
    if ('IntersectionObserver' in window && !reduce) {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (en) { if (en.isIntersecting) { run(en.target); io.unobserve(en.target); } });
      }, { threshold: 0.4 });
      counters.forEach(function (el) {
        var c = parse(el);
        if (c) (el.querySelector('.sxn-v') || el).textContent = fmt(0, c);
        io.observe(el);
      });
    }
  }
})();
