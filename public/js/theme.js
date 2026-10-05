/* إصغاء — الوضع الليلي/النهاري
   السكربت المضمّن أعلى <head> يضبط data-theme قبل أول رسم؛ هذا الملف يتولى زر التبديل والحفظ ومتابعة إعداد النظام */
(function () {
  'use strict';
  var doc = document.documentElement;
  var KEY = 'isgha_theme';
  var DARK_META = '#0e1412';
  var mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;
  var meta = document.querySelector('meta[name="theme-color"]');
  var lightMeta = meta ? meta.getAttribute('content') : '';
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var animTimer = 0;

  function saved() {
    try { var v = localStorage.getItem(KEY); return v === 'dark' || v === 'light' ? v : null; } catch (e) { return null; }
  }
  function save(v) {
    try { localStorage.setItem(KEY, v); } catch (e) {}
  }
  function system() { return mq && mq.matches ? 'dark' : 'light'; }
  function current() { return doc.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }

  function sync(t) {
    if (meta) meta.setAttribute('content', t === 'dark' ? DARK_META : lightMeta);
    var buttons = document.querySelectorAll('[data-theme-toggle]');
    for (var i = 0; i < buttons.length; i++) {
      var b = buttons[i];
      b.setAttribute('aria-pressed', t === 'dark' ? 'true' : 'false');
      // التلميح يصف الوضع الذي سينتقل إليه الزائر
      b.setAttribute('data-tip', t === 'dark' ? 'الوضع النهاري' : 'الوضع الليلي');
    }
  }

  function apply(t, animate) {
    if (animate && !reduce) {
      doc.classList.add('theme-anim');
      clearTimeout(animTimer);
      animTimer = setTimeout(function () { doc.classList.remove('theme-anim'); }, 320);
    }
    doc.setAttribute('data-theme', t);
    sync(t);
  }

  // تصحيح احتياطي إن لم يعمل السكربت المضمّن
  if (!doc.getAttribute('data-theme')) doc.setAttribute('data-theme', saved() || system());
  sync(current());

  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-theme-toggle]');
    if (!b) return;
    var next = current() === 'dark' ? 'light' : 'dark';
    save(next);
    apply(next, true);
  });

  // متابعة إعداد النظام فقط ما دام الزائر لم يختر بنفسه
  function onSystem() { if (!saved()) apply(system(), true); }
  if (mq) {
    if (mq.addEventListener) mq.addEventListener('change', onSystem);
    else if (mq.addListener) mq.addListener(onSystem);
  }

  // مزامنة التبويبات المفتوحة الأخرى
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY) return;
    var v = saved();
    apply(v || system(), true);
  });
})();
