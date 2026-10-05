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
