/* إصغاء — هيكل لوحة التحكم: طي القائمة الجانبية، الدرج على الجوال، القوائم المنسدلة في الشريط العلوي */
(function () {
  'use strict';
  var KEY = 'isgha.adm.side';
  var root = document.documentElement;
  var body = document.body;
  var side = document.getElementById('side');
  if (!side || !body.classList.contains('shell')) return;

  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var mm = function (q) { return window.matchMedia ? window.matchMedia(q) : { matches: false }; };
  var mqMobile = mm('(max-width: 900px)');
  var mqAuto = mm('(min-width: 901px) and (max-width: 1100px)');
  function onMq(mq, fn) { if (mq.addEventListener) mq.addEventListener('change', fn); else if (mq.addListener) mq.addListener(fn); }

  function getPref() { try { return localStorage.getItem(KEY); } catch (e) { return null; } }
  function setPref(v) { try { localStorage.setItem(KEY, v); } catch (e) { /* التخزين غير متاح — تبقى الحالة لهذه الصفحة فقط */ } }
  function isMobile() { return mqMobile.matches; }
  function isCollapsed() { return root.classList.contains('side-collapsed'); }
  function isRail() { return !isMobile() && isCollapsed(); }
  function isVisible(el) { return !!(el.offsetWidth || el.offsetHeight) && getComputedStyle(el).visibility !== 'hidden'; }
  function focusables(scope) { return $$('a[href],button:not([disabled]),input:not([disabled]),select,textarea,[tabindex]:not([tabindex="-1"])', scope).filter(isVisible); }

  var toggles = $$('[data-shell-toggle]');
  var folds = $$('[data-shell-fold]');
  var subs = $$('[data-side-sub]', side);

  /* ── مزامنة حالة الأزرار لقارئات الشاشة ── */
  function sync() {
    var mob = isMobile();
    var col = isCollapsed();
    var open = body.classList.contains('side-open');
    toggles.forEach(function (b) {
      b.setAttribute('aria-expanded', String(mob ? open : !col));
      b.setAttribute('aria-label', mob ? (open ? 'إغلاق القائمة' : 'فتح القائمة') : (col ? 'توسيع القائمة الجانبية' : 'طي القائمة الجانبية'));
    });
    folds.forEach(function (b) {
      b.setAttribute('aria-expanded', String(!col));
      b.setAttribute('aria-label', col ? 'توسيع القائمة' : 'طي القائمة');
    });
    subs.forEach(function (g) {
      if (fly.group === g) return;
      g.querySelector('.side-sub-btn').setAttribute('aria-expanded', String(!isRail() && g.classList.contains('is-open')));
    });
  }

  /* ── طي / توسيع (الكمبيوتر) ── */
  function setCollapsed(on, persist) {
    hideTip();
    closeFly(false);
    root.classList.toggle('side-collapsed', on);
    if (persist) setPref(on ? 'collapsed' : 'expanded');
    sync();
  }
  function applyAuto() {
    var p = getPref();
    if (p === 'collapsed' || p === 'expanded') setCollapsed(p === 'collapsed', false);
    else setCollapsed(mqAuto.matches, false);
  }
  onMq(mqAuto, applyAuto);
  // مزامنة بين التبويبات المفتوحة
  window.addEventListener('storage', function (e) { if (e.key === KEY) applyAuto(); });

  /* ── الدرج الجانبي (الجوال والتابلت) ── */
  var lastFocus = null;
  function openDrawer() {
    lastFocus = document.activeElement;
    body.classList.add('side-open');
    sync();
    var first = $('[data-shell-close]', side) || focusables(side)[0];
    if (first) first.focus();
  }
  function closeDrawer(restore) {
    if (!body.classList.contains('side-open')) return;
    body.classList.remove('side-open');
    sync();
    if (restore !== false && lastFocus && lastFocus.focus) lastFocus.focus();
  }
  onMq(mqMobile, function () { if (!isMobile()) closeDrawer(false); hideTip(); closeFly(false); sync(); });
  // حبس التركيز داخل الدرج المفتوح
  side.addEventListener('keydown', function (e) {
    if (e.key !== 'Tab' || !isMobile() || !body.classList.contains('side-open')) return;
    var f = focusables(side);
    if (!f.length) return;
    if (e.shiftKey && document.activeElement === f[0]) { e.preventDefault(); f[f.length - 1].focus(); }
    else if (!e.shiftKey && document.activeElement === f[f.length - 1]) { e.preventDefault(); f[0].focus(); }
  });

  /* ── المجموعات الفرعية (محتوى آخر، المقالات) ── */
  subs.forEach(function (g) {
    var btn = g.querySelector('.side-sub-btn');
    btn.addEventListener('click', function (e) {
      if (isRail()) {
        e.preventDefault();
        hideTip();
        if (fly.group === g && fly.pinned) closeFly(e.detail === 0);
        else openFly(g, true, e.detail === 0);
        return;
      }
      var open = !g.classList.contains('is-open');
      g.classList.toggle('is-open', open);
      btn.setAttribute('aria-expanded', String(open));
    });
  });

  /* ── التلميح بجانب الأيقونة في الوضع المطوي ── */
  var tip = document.createElement('div');
  tip.className = 'side-tip';
  tip.setAttribute('aria-hidden', 'true');
  body.appendChild(tip);
  var tipFor = null;
  function placeBeside(el, box, mid) {
    var r = el.getBoundingClientRect();
    var sr = side.getBoundingClientRect();
    box.style.left = (sr.left - (mid ? 8 : 6)) + 'px';
    if (mid) { box.style.top = (r.top + r.height / 2) + 'px'; return; }
    var h = box.offsetHeight;
    var top = Math.min(r.top - 6, window.innerHeight - h - 8);
    box.style.top = Math.max(8, top) + 'px';
  }
  function showTip(el) {
    var label = el.getAttribute('data-tip');
    if (!label) return;
    tipFor = el;
    tip.textContent = label;
    placeBeside(el, tip, true);
    tip.classList.add('on');
  }
  function hideTip() { tipFor = null; tip.classList.remove('on'); }

  /* ── القائمة المنبثقة للمجموعات في الوضع المطوي ── */
  var fly = document.createElement('div');
  fly.className = 'side-fly';
  fly.setAttribute('role', 'group');
  fly.group = null;
  fly.pinned = false;
  fly.timer = 0;
  body.appendChild(fly);
  function cancelFlyClose() { clearTimeout(fly.timer); }
  function scheduleFlyClose() { cancelFlyClose(); fly.timer = setTimeout(function () { closeFly(false); }, 240); }
  function openFly(g, pinned, focusFirst) {
    cancelFlyClose();
    var btn = g.querySelector('.side-sub-btn');
    if (fly.group && fly.group !== g) fly.group.querySelector('.side-sub-btn').setAttribute('aria-expanded', 'false');
    if (fly.group !== g) {
      fly.innerHTML = '';
      var label = btn.getAttribute('data-tip') || '';
      var t = document.createElement('p');
      t.className = 'side-fly-title';
      t.textContent = label;
      fly.appendChild(t);
      fly.setAttribute('aria-label', label);
      $$('.side-sub-list a', g).forEach(function (a) {
        var c = document.createElement('a');
        c.href = a.getAttribute('href');
        c.className = 'side-fly-link' + (a.classList.contains('on') ? ' on' : '');
        c.textContent = a.textContent.trim();
        if (a.hasAttribute('aria-current')) c.setAttribute('aria-current', 'page');
        fly.appendChild(c);
      });
    }
    var keepPin = fly.pinned && fly.group === g;
    fly.group = g;
    fly.pinned = !!pinned || keepPin;
    btn.setAttribute('aria-expanded', 'true');
    placeBeside(btn, fly, false);
    fly.classList.add('on');
    if (focusFirst) { var f = $('a', fly); if (f) f.focus(); }
  }
  function closeFly(restoreFocus) {
    cancelFlyClose();
    if (!fly.group) return;
    var g = fly.group;
    fly.group = null;
    fly.pinned = false;
    fly.classList.remove('on');
    var btn = g.querySelector('.side-sub-btn');
    btn.setAttribute('aria-expanded', String(!isRail() && g.classList.contains('is-open')));
    if (restoreFocus) btn.focus();
  }
  function focusAfter(el) {
    var f = focusables(side);
    var i = f.indexOf(el);
    if (i > -1 && f[i + 1]) f[i + 1].focus();
  }
  fly.addEventListener('mouseenter', cancelFlyClose);
  fly.addEventListener('mouseleave', function () { if (!fly.pinned) scheduleFlyClose(); });
  fly.addEventListener('keydown', function (e) {
    var links = $$('a', fly);
    var i = links.indexOf(document.activeElement);
    if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); closeFly(true); }
    else if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      links[(i + (e.key === 'ArrowDown' ? 1 : -1) + links.length) % links.length].focus();
    } else if (e.key === 'Tab') {
      if (e.shiftKey && i <= 0) { e.preventDefault(); closeFly(true); }
      else if (!e.shiftKey && i === links.length - 1) {
        e.preventDefault();
        var btn = fly.group.querySelector('.side-sub-btn');
        closeFly(false);
        focusAfter(btn);
      }
    }
  });
  fly.addEventListener('focusout', function (e) {
    if (!fly.group) return;
    var to = e.relatedTarget;
    if (to && !fly.contains(to) && !fly.group.contains(to)) closeFly(false);
  });

  // التحويم والتركيز داخل القائمة المطوية
  side.addEventListener('mouseover', function (e) {
    if (!isRail()) return;
    var l = e.target.closest('.side-link');
    if (!l || !side.contains(l)) return;
    var g = l.closest('[data-side-sub]');
    if (g) { hideTip(); if (fly.group !== g || !fly.classList.contains('on')) openFly(g, false, false); else cancelFlyClose(); return; }
    if (fly.group && !fly.pinned) closeFly(false);
    if (tipFor !== l) showTip(l);
  });
  side.addEventListener('mouseout', function (e) {
    if (!isRail()) return;
    var l = e.target.closest('.side-link');
    if (!l || (e.relatedTarget && l.contains(e.relatedTarget))) return;
    if (tipFor === l) hideTip();
    if (l.closest('[data-side-sub]') && fly.group && !fly.pinned) scheduleFlyClose();
  });
  side.addEventListener('focusin', function (e) {
    if (!isRail()) return;
    var l = e.target.closest('.side-link[data-tip]');
    if (l && !(fly.group && fly.group.contains(l))) showTip(l);
  });
  side.addEventListener('focusout', function () { hideTip(); });
  $('.side-nav', side).addEventListener('scroll', function () { hideTip(); closeFly(false); }, { passive: true });
  window.addEventListener('resize', function () { hideTip(); closeFly(false); });

  /* ── القوائم المنسدلة في الشريط العلوي ── */
  var dds = $$('[data-dd]');
  function ddItems(dd) { return $$('[data-dd-pop] a[href],[data-dd-pop] button', dd); }
  function ddOpen(dd, focusFirst) {
    dds.forEach(function (o) { if (o !== dd) ddClose(o, false); });
    dd.classList.add('is-open');
    $('[data-dd-btn]', dd).setAttribute('aria-expanded', 'true');
    if (focusFirst) { var f = ddItems(dd)[0]; if (f) f.focus(); }
  }
  function ddClose(dd, restore) {
    if (!dd.classList.contains('is-open')) return;
    dd.classList.remove('is-open');
    var b = $('[data-dd-btn]', dd);
    b.setAttribute('aria-expanded', 'false');
    if (restore) b.focus();
  }
  dds.forEach(function (dd) {
    var b = $('[data-dd-btn]', dd);
    b.addEventListener('click', function (e) {
      if (dd.classList.contains('is-open')) ddClose(dd, false);
      else ddOpen(dd, e.detail === 0);
    });
    dd.addEventListener('keydown', function (e) {
      var open = dd.classList.contains('is-open');
      if (e.key === 'Escape' && open) { e.preventDefault(); e.stopPropagation(); ddClose(dd, true); return; }
      if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp' && e.key !== 'Home' && e.key !== 'End') return;
      e.preventDefault();
      if (!open) { ddOpen(dd, true); return; }
      var it = ddItems(dd);
      var i = it.indexOf(document.activeElement);
      var n = e.key === 'Home' ? 0 : e.key === 'End' ? it.length - 1 : (i + (e.key === 'ArrowDown' ? 1 : -1) + it.length) % it.length;
      if (i === -1 && e.key === 'ArrowUp') n = it.length - 1;
      if (it[n]) it[n].focus();
    });
    dd.addEventListener('focusout', function (e) { if (e.relatedTarget && !dd.contains(e.relatedTarget)) ddClose(dd, false); });
  });

  /* ── النقرات العامة ── */
  document.addEventListener('click', function (e) {
    var t = e.target;
    if (t.closest('[data-shell-toggle]')) {
      if (isMobile()) { if (body.classList.contains('side-open')) closeDrawer(); else openDrawer(); }
      else setCollapsed(!isCollapsed(), true);
      return;
    }
    if (t.closest('[data-shell-fold]')) { setCollapsed(!isCollapsed(), true); return; }
    if (t.closest('[data-shell-close]')) { closeDrawer(); return; }
    dds.forEach(function (dd) { if (!dd.contains(t)) ddClose(dd, false); });
    if (fly.group && !fly.contains(t) && !fly.group.contains(t)) closeFly(false);
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (fly.group) { closeFly(true); return; }
    hideTip();
    if (body.classList.contains('side-open')) closeDrawer();
  });

  /* ── روابط «+ جديد» و«تغيير كلمة المرور» ── */
  (function () {
    if (!window.URLSearchParams) return;
    var q = new URLSearchParams(location.search);
    if (q.get('new') !== '1') return;
    var d = document.getElementById('new-page');
    if (d && d.showModal && !d.open) {
      d.showModal();
      var inp = $('input[name=title]', d);
      if (inp) inp.focus();
    }
    q.delete('new');
    var s = q.toString();
    try { history.replaceState(history.state, '', location.pathname + (s ? '?' + s : '') + location.hash); } catch (er) { /* */ }
  })();
  function focusPassword() {
    if (location.hash !== '#password') return;
    var pw = $('input[name=current_password]');
    if (!pw) return;
    pw.scrollIntoView({ block: 'center' });
    pw.focus({ preventScroll: true });
  }
  focusPassword();
  window.addEventListener('hashchange', focusPassword);

  /* ── التهيئة: الحالة الصحيحة ثم تفعيل الحركة بعد أول رسم ── */
  sync();
  requestAnimationFrame(function () { requestAnimationFrame(function () { root.classList.add('shell-anim'); }); });
})();
