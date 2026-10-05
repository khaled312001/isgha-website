/* sx-heroes — حركة الترويسات وأقسام الهوية (بدون مكتبات) */
(function () {
  'use strict';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── بطاقات أقسام الخدمات: بقعة ضوء تتبع المؤشر + تحميل الصورة عند أول تمرير ── */
  $$('.hx-tile').forEach(function (tile) {
    var img = tile.querySelector('.hx-tile-img');
    function load() {
      if (!img || img.classList.contains('ld')) return;
      var src = img.getAttribute('data-img');
      if (!src) return;
      var pre = new Image();
      pre.onload = function () { img.style.backgroundImage = 'url("' + src.replace(/"/g, '%22') + '")'; img.classList.add('ld'); };
      pre.src = src;
    }
    tile.addEventListener('pointerenter', function (e) { if (e.pointerType !== 'touch') load(); });
    tile.addEventListener('focus', load);
    if (reduce) return;
    tile.addEventListener('pointermove', function (e) {
      var r = tile.getBoundingClientRect();
      tile.style.setProperty('--mx', (e.clientX - r.left) + 'px');
      tile.style.setProperty('--my', (e.clientY - r.top) + 'px');
    });
  });
})();
