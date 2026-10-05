/* sx-cards — الباقات · المستفيدون · آراء العملاء · المقالات · النص المنسق · الفيديو */
(function () {
  'use strict';
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ── شريط تقدم للقوائم الأفقية (يظهر فقط حين يوجد تمرير) ── */
  $$('[data-sx-rail]').forEach(function (sc) {
    var rail = document.createElement('div');
    rail.className = 'sx-rail';
    rail.setAttribute('aria-hidden', 'true');
    rail.innerHTML = '<i></i>';
    sc.parentNode.insertBefore(rail, sc.nextSibling);
    var bar = rail.firstChild;
    function upd() {
      var max = sc.scrollWidth - sc.clientWidth;
      rail.classList.toggle('on', max > 4);
      if (max <= 4) return;
      var ratio = sc.clientWidth / sc.scrollWidth;
      var pos = Math.min(1, Math.abs(sc.scrollLeft) / max);
      bar.style.setProperty('--p', (ratio + (1 - ratio) * pos).toFixed(3));
    }
    sc.addEventListener('scroll', upd, { passive: true });
    window.addEventListener('resize', upd);
    upd();
  });

  /* ── جدول المقارنة: ظل العمود الثابت عند التمرير ── */
  $$('[data-cmp]').forEach(function (box) {
    var sc = box.querySelector('.cmp-scroll');
    if (!sc) return;
    function upd() { box.classList.toggle('is-scrolled', Math.abs(sc.scrollLeft) > 2); }
    sc.addEventListener('scroll', upd, { passive: true });
    upd();
  });

  /* ── النص المنسق: فهرس ثابت يتتبع القسم الحالي + شريط تقدم القراءة + إبراز العنوان المستهدف ── */
  $$('[data-rtx]').forEach(function (box) {
    var paper = box.querySelector('.rtx-paper');
    var toc = box.querySelector('[data-rtx-toc]');
    function hit(h) {
      if (!h) return;
      h.classList.remove('is-hit');
      void h.offsetWidth;
      h.classList.add('is-hit');
      setTimeout(function () { h.classList.remove('is-hit'); }, 2000);
    }
    if (location.hash) {
      var t0 = document.getElementById(decodeURIComponent(location.hash.slice(1)));
      if (t0 && paper && paper.contains(t0)) setTimeout(function () { hit(t0); }, 400);
    }
    if (!toc) return;
    var mq = window.matchMedia('(max-width: 960px)');
    if (mq.matches) toc.open = false;
    var links = $$('ol a', toc);
    var heads = links.map(function (a) { return document.getElementById(decodeURIComponent(a.getAttribute('href').slice(1))); });
    var bar = toc.querySelector('.rtx-prog i');
    function active(i) { links.forEach(function (a, j) { if (j === i) a.setAttribute('aria-current', 'true'); else a.removeAttribute('aria-current'); }); }
    var ticking = false;
    function onScroll() {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(function () {
        ticking = false;
        var line = 140, cur = 0;
        heads.forEach(function (h, j) { if (h && h.getBoundingClientRect().top - line <= 0) cur = j; });
        active(cur);
        if (bar && paper) {
          var r = paper.getBoundingClientRect();
          var total = r.height - window.innerHeight * 0.6;
          var p = Math.min(1, Math.max(0, (line - r.top) / Math.max(1, total)));
          bar.style.setProperty('--p', p.toFixed(3));
        }
      });
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    links.forEach(function (a, j) {
      a.addEventListener('click', function (e) {
        var h = heads[j];
        if (!h) return;
        e.preventDefault();
        h.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
        if (history.replaceState) history.replaceState(null, '', a.getAttribute('href'));
        active(j);
        setTimeout(function () { hit(h); }, reduce ? 0 : 450);
        if (mq.matches) toc.open = false;
      });
    });
  });

  /* ── آراء العملاء: شريحة بالتمرير الأصلي + أزرار ونقاط ── */
  var AR = '٠١٢٣٤٥٦٧٨٩';
  function pad2(n) { return String(n).padStart(2, '0').replace(/\d/g, function (x) { return AR[x]; }); }
  $$('[data-tst]').forEach(function (box) {
    var track = box.querySelector('[data-tst-track]');
    if (!track) return;
    var slides = $$('.tst-slide', track);
    var dots = $$('[data-tst-dot]', box);
    var prev = box.querySelector('[data-tst-prev]');
    var next = box.querySelector('[data-tst-next]');
    var cur = box.querySelector('[data-tst-cur]');
    var rtl = getComputedStyle(track).direction === 'rtl';
    var idx = -1;
    function at() { return Math.round(Math.abs(track.scrollLeft) / Math.max(1, track.clientWidth)); }
    function mark(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      if (i === idx) return;
      idx = i;
      slides.forEach(function (s, j) { s.classList.toggle('is-on', j === i); s.setAttribute('aria-hidden', j === i ? 'false' : 'true'); });
      dots.forEach(function (d, j) { if (j === i) d.setAttribute('aria-current', 'true'); else d.removeAttribute('aria-current'); });
      if (cur) cur.textContent = pad2(i + 1);
      if (prev) prev.disabled = i === 0;
      if (next) next.disabled = i === slides.length - 1;
    }
    function go(i) {
      i = Math.max(0, Math.min(slides.length - 1, i));
      track.scrollTo({ left: (rtl ? -1 : 1) * i * track.clientWidth, behavior: reduce ? 'auto' : 'smooth' });
      mark(i);
    }
    var raf = 0;
    track.addEventListener('scroll', function () { cancelAnimationFrame(raf); raf = requestAnimationFrame(function () { mark(at()); }); }, { passive: true });
    if (prev) prev.addEventListener('click', function () { go(idx - 1); });
    if (next) next.addEventListener('click', function () { go(idx + 1); });
    dots.forEach(function (d, j) { d.addEventListener('click', function () { go(j); }); });
    track.addEventListener('keydown', function (e) {
      var fwd = rtl ? 'ArrowLeft' : 'ArrowRight';
      var back = rtl ? 'ArrowRight' : 'ArrowLeft';
      if (e.key === fwd) { e.preventDefault(); go(idx + 1); }
      if (e.key === back) { e.preventDefault(); go(idx - 1); }
    });
    window.addEventListener('resize', function () { go(idx); });
    mark(0);
  });

  /* ── المستفيدون (تفصيلي): طي بقية الخدمات خلف زر «عرض كل الخدمات» ── */
  $$('.bnd-more').forEach(function (btn) {
    var box = document.getElementById(btn.getAttribute('aria-controls'));
    if (!box) return;
    var t = btn.querySelector('.t');
    function set(open) {
      btn.setAttribute('aria-expanded', open ? 'true' : 'false');
      box.classList.toggle('is-closed', !open);
      box.inert = !open;
      if (t) t.textContent = btn.getAttribute(open ? 'data-less' : 'data-more');
    }
    set(false);
    btn.hidden = false;
    btn.addEventListener('click', function () { set(btn.getAttribute('aria-expanded') !== 'true'); });
  });

  /* ── مستكشف تفاصيل الباقات: تبويبات بلوحة واحدة ظاهرة ── */
  $$('[data-pkx]').forEach(function (box) {
    var tabs = $$('[role=tab]', box);
    var panels = $$('[role=tabpanel]', box);
    if (!tabs.length) return;
    box.classList.add('is-tabs');
    function select(i, focus) {
      tabs.forEach(function (t, j) {
        var on = j === i;
        t.setAttribute('aria-selected', on ? 'true' : 'false');
        t.tabIndex = on ? 0 : -1;
        if (panels[j]) panels[j].classList.toggle('on', on);
      });
      if (focus) tabs[i].focus();
      // إبقاء التبويب المختار ظاهرًا في الشريط الأفقي على الجوال
      var list = tabs[i].parentNode;
      if (list.scrollWidth > list.clientWidth) {
        var tr = tabs[i].getBoundingClientRect(), lr = list.getBoundingClientRect();
        if (tr.left < lr.left || tr.right > lr.right) list.scrollBy({ left: tr.left - lr.left - 8, behavior: reduce ? 'auto' : 'smooth' });
      }
    }
    tabs.forEach(function (t, i) {
      t.addEventListener('click', function () { select(i); });
      t.addEventListener('keydown', function (e) {
        var vertical = getComputedStyle(t.parentNode).flexDirection === 'column';
        var next = vertical ? 'ArrowDown' : 'ArrowLeft';
        var prev = vertical ? 'ArrowUp' : 'ArrowRight';
        var k = -1;
        if (e.key === next) k = (i + 1) % tabs.length;
        else if (e.key === prev) k = (i - 1 + tabs.length) % tabs.length;
        else if (e.key === 'Home') k = 0;
        else if (e.key === 'End') k = tabs.length - 1;
        if (k > -1) { e.preventDefault(); select(k, true); }
      });
    });
    function fromHash(scroll) {
      var id = decodeURIComponent((location.hash || '').slice(1));
      if (!id) return;
      for (var j = 0; j < panels.length; j += 1) {
        if (panels[j].id === id) {
          select(j);
          if (scroll) box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          return true;
        }
      }
    }
    if (fromHash(false)) setTimeout(function () { box.scrollIntoView({ block: 'start' }); }, 60);
    window.addEventListener('hashchange', function () { fromHash(true); });
    // روابط «تفاصيل أكثر» في الصفحة نفسها تفتح التبويب المطلوب
    document.addEventListener('click', function (e) {
      var a = e.target.closest && e.target.closest('a[href*="#pk-"]');
      if (!a) return;
      var url = new URL(a.href, location.href);
      if (url.pathname !== location.pathname) return;
      var id = url.hash.slice(1);
      for (var j = 0; j < panels.length; j += 1) {
        if (panels[j].id === id) {
          e.preventDefault();
          select(j);
          if (history.replaceState) history.replaceState(null, '', '#' + id);
          box.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
          return;
        }
      }
    });
  });
})();
