/* إصغاء — سكربت الموقع */
(function () {
  'use strict';
  var doc = document.documentElement;
  doc.classList.remove('no-js');
  var CFG = window.ISGHA || {};
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ── ظهور العناصر ── */
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } });
    }, { threshold: 0.1, rootMargin: '0px 0px -40px 0px' });
    $$('.rv').forEach(function (el) { io.observe(el); });
  } else { $$('.rv').forEach(function (el) { el.classList.add('in'); }); }
  window.ISGHA_READY = true;

  function store(k, v) { try { if (v === undefined) return JSON.parse(localStorage.getItem(k)); localStorage.setItem(k, JSON.stringify(v)); } catch (e) { return null; } }

  /* ── مصدر الزيارة (أول لمسة + آخر لمسة إعلانية) ── */
  var ATTR_KEYS = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'gclid', 'gbraid', 'wbraid', 'fbclid', 'ttclid', 'sccid', 'ScCid', 'msclkid', 'twclid', 'li_fat_id'];
  (function captureAttribution() {
    var p = new URLSearchParams(location.search);
    var hit = {};
    ATTR_KEYS.forEach(function (k) { if (p.get(k)) hit[k] = p.get(k).slice(0, 190); });
    var now = Date.now();
    var saved = store('isgha_attr');
    if (Object.keys(hit).length) {
      hit.ts = now;
      hit.landing = location.href.slice(0, 480);
      hit.referrer = (document.referrer || '').slice(0, 480);
      store('isgha_attr', hit);
    } else if (!saved || now - (saved.ts || 0) > 30 * 864e5) {
      store('isgha_attr', { ts: now, landing: location.href.slice(0, 480), referrer: (document.referrer || '').slice(0, 480) });
    }
  })();

  /* ── التتبع: يرسل الحدث لكل المنصات المفعّلة ── */
  function uid() { return 'ev_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 10); }
  function track(name, data) {
    data = data || {};
    var eid = data.event_id || uid();
    try { window.dataLayer = window.dataLayer || []; window.dataLayer.push({ event: name === 'Lead' ? 'generate_lead' : 'contact_click', method: data.method || '', case_type: data.case_type || '', event_id: eid }); } catch (e) {}
    try {
      if (window.fbq) {
        if (name === 'Lead') fbq('track', 'Lead', { content_category: data.case_type || '' }, { eventID: eid });
        else fbq('track', 'Contact', { method: data.method }, { eventID: eid });
      }
    } catch (e) {}
    try {
      if (window.gtag) {
        if (name === 'Lead') {
          gtag('event', 'generate_lead', { case_type: data.case_type || '', event_id: eid });
          if (CFG.adsId && CFG.adsLead) gtag('event', 'conversion', { send_to: CFG.adsId + '/' + CFG.adsLead, transaction_id: eid });
        } else {
          gtag('event', 'contact', { method: data.method });
          if (CFG.adsId && CFG.adsCall && data.method === 'call') gtag('event', 'conversion', { send_to: CFG.adsId + '/' + CFG.adsCall });
        }
      }
    } catch (e) {}
    try { if (window.ttq) { if (name === 'Lead') ttq.track('SubmitForm', {}, { event_id: eid }); else ttq.track('Contact', {}, { event_id: eid }); } } catch (e) {}
    try { if (window.snaptr) snaptr('track', name === 'Lead' ? 'SIGN_UP' : 'CUSTOM_EVENT_1', { client_dedup_id: eid }); } catch (e) {}
    try { if (window.twq && CFG.xLead && name === 'Lead') twq('event', CFG.xLead, { conversion_id: eid }); } catch (e) {}
    try { if (window.lintrk && CFG.liConv && name === 'Lead') lintrk('track', { conversion_id: Number(CFG.liConv) }); } catch (e) {}
    return eid;
  }
  window.isghaTrack = track;

  function beacon(type) {
    try {
      var body = JSON.stringify({ type: type, path: location.pathname, page_id: CFG.pageId || null });
      if (navigator.sendBeacon) navigator.sendBeacon('/api/event', new Blob([body], { type: 'application/json' }));
      else fetch('/api/event', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: body, keepalive: true });
    } catch (e) {}
  }

  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href]');
    if (!a) return;
    var href = a.getAttribute('href') || '';
    if (href.indexOf('tel:') === 0) { track('Contact', { method: 'call' }); beacon('call_click'); }
    else if (/wa\.me|whatsapp\.com/.test(href)) { track('Contact', { method: 'whatsapp' }); beacon('whatsapp_click'); }
  }, true);

  /* ── قائمة الجوال ── */
  var mnav = $('#mnav');
  var menuBtn = $('[data-menu-open]');
  function openMenu() {
    if (!mnav) return;
    mnav.classList.add('open'); mnav.setAttribute('aria-hidden', 'false');
    if (menuBtn) menuBtn.setAttribute('aria-expanded', 'true');
    document.body.style.overflow = 'hidden';
    var c = $('.mnav-close', mnav); if (c) setTimeout(function () { c.focus(); }, 60);
  }
  function closeMenu() {
    if (!mnav || !mnav.classList.contains('open')) return;
    mnav.classList.remove('open'); mnav.setAttribute('aria-hidden', 'true');
    if (menuBtn) { menuBtn.setAttribute('aria-expanded', 'false'); menuBtn.focus(); }
    document.body.style.overflow = '';
  }
  $$('[data-menu-open]').forEach(function (b) { b.addEventListener('click', openMenu); });
  $$('[data-menu-close]').forEach(function (b) { b.addEventListener('click', closeMenu); });
  if (mnav) $$('a', mnav).forEach(function (a) { a.addEventListener('click', closeMenu); });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeMenu();
    // حصر التنقل بلوحة المفاتيح داخل القائمة المفتوحة
    if (e.key === 'Tab' && mnav && mnav.classList.contains('open')) {
      var f = $$('a[href],button', $('.mnav-panel', mnav));
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
  });
  // إغلاق القائمة عند التحول لعرض سطح المكتب
  window.addEventListener('resize', function () { if (window.innerWidth > 1120) closeMenu(); });

  /* ── الترويسة عند التمرير ── */
  var navEl = $('[data-nav]');
  if (navEl) {
    var ticking = false;
    var onScroll = function () { navEl.classList.toggle('is-scrolled', window.scrollY > 24); ticking = false; };
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(onScroll); } }, { passive: true });
    onScroll();
  }

  /* ── التبويبات ── */
  $$('[data-tabs]').forEach(function (root) {
    var btns = $$('[role=tab]', root);
    btns.forEach(function (b, i) {
      b.addEventListener('click', function () { select(i); });
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowDown' || e.key === 'ArrowLeft') { e.preventDefault(); select((i + 1) % btns.length, true); }
        if (e.key === 'ArrowUp' || e.key === 'ArrowRight') { e.preventDefault(); select((i - 1 + btns.length) % btns.length, true); }
      });
    });
    function select(i, focus) {
      btns.forEach(function (b, j) {
        b.setAttribute('aria-selected', j === i ? 'true' : 'false');
        b.tabIndex = j === i ? 0 : -1;
        var p = document.getElementById(b.getAttribute('aria-controls'));
        if (p) p.hidden = j !== i;
      });
      if (focus) btns[i].focus();
    }
  });

  /* ── فيديو يوتيوب خفيف ── */
  $$('[data-yt]').forEach(function (v) {
    v.addEventListener('click', function () {
      var id = v.getAttribute('data-yt');
      v.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + id + '?autoplay=1&rel=0" allow="autoplay; encrypted-media; picture-in-picture" allowfullscreen title="فيديو"></iframe>';
    }, { once: true });
  });

  /* ── إرسال النماذج ── */
  function attribution() {
    var a = store('isgha_attr') || {};
    var out = { referrer: a.referrer || document.referrer || '', landing: a.landing || '' };
    ATTR_KEYS.forEach(function (k) { if (a[k]) out[k] = a[k]; });
    return out;
  }

  function submitLead(payload, btn, onDone, onError) {
    var orig = btn.innerHTML;
    btn.disabled = true;
    btn.innerHTML = 'جارٍ الإرسال…';
    payload.event_id = uid();
    payload.attr = attribution();
    payload.url = location.href;
    payload.page_id = CFG.pageId || null;
    fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify(payload) })
      .then(function (r) { return r.json().then(function (j) { return { ok: r.ok, j: j }; }); })
      .then(function (res) {
        btn.disabled = false; btn.innerHTML = orig;
        if (!res.ok || !res.j.ok) { onError(res.j && res.j.error ? res.j.error : 'تعذّر الإرسال، حاول مرة أخرى.', res.j && res.j.field); return; }
        track('Lead', { event_id: payload.event_id, case_type: payload.case_type });
        if (res.j.redirect) { setTimeout(function () { location.href = res.j.redirect; }, 450); return; }
        onDone(res.j);
      })
      .catch(function () { btn.disabled = false; btn.innerHTML = orig; onError('تعذّر الاتصال، تحقق من الإنترنت وحاول مجددًا.'); });
  }

  function fieldError(form, name, on) {
    var input = form.querySelector('[name="' + name + '"]');
    if (!input) return;
    var f = input.closest('.field');
    if (f) f.classList.toggle('err', !!on);
    if (on) input.focus();
  }
  function validPhone(v) {
    var d = String(v || '').replace(/[٠-٩]/g, function (x) { return '٠١٢٣٤٥٦٧٨٩'.indexOf(x); }).replace(/[^\d]/g, '');
    return /^(05\d{8}|5\d{8}|9665\d{8}|\d{9,15})$/.test(d);
  }

  // النموذج متعدد الخطوات
  $$('[data-mform]').forEach(function (form) {
    var cur = 1, selected = '';
    var steps = $$('.mstep', form);
    var bars = $$('.progress i', form);
    var errBox = $('.form-error', form);
    var started = false;
    function go(n) {
      cur = n;
      steps.forEach(function (s) { s.classList.toggle('active', +s.getAttribute('data-step') === n); });
      bars.forEach(function (b, i) { b.classList.toggle('on', i < n); });
      if (!started) { started = true; beacon('form_start'); }
    }
    $$('.choice button', form).forEach(function (b) {
      b.addEventListener('click', function () {
        selected = b.getAttribute('data-value');
        $$('.choice button', form).forEach(function (x) { x.classList.remove('sel'); x.setAttribute('aria-pressed', 'false'); });
        b.classList.add('sel'); b.setAttribute('aria-pressed', 'true');
        setTimeout(function () { go(2); }, 170);
      });
    });
    $$('[data-next]', form).forEach(function (b) { b.addEventListener('click', function () { go(cur + 1); }); });
    $$('[data-back]', form).forEach(function (b) { b.addEventListener('click', function () { go(Math.max(1, cur - 1)); }); });
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox && errBox.classList.remove('show');
      var name = form.elements.name.value.trim();
      var phone = form.elements.phone.value.trim();
      var email = form.elements.email ? form.elements.email.value.trim() : '';
      fieldError(form, 'name', false); fieldError(form, 'phone', false);
      if (name.length < 2) return fieldError(form, 'name', true);
      if (!validPhone(phone)) return fieldError(form, 'phone', true);
      var btn = form.querySelector('[type=submit]');
      submitLead({
        form: 'lead', name: name, phone: phone, email: email, case_type: selected,
        message: form.elements.message ? form.elements.message.value.trim() : '',
        hp: form.elements.website ? form.elements.website.value : '', ts: form.getAttribute('data-ts'),
      }, btn, function () {
        $('.form-steps', form).style.display = 'none';
        $('.form-done', form).classList.add('show');
      }, function (msg, field) {
        if (field) return fieldError(form, field, true);
        if (errBox) { errBox.textContent = msg; errBox.classList.add('show'); }
      });
    });
  });

  // نموذج التواصل
  $$('[data-cform]').forEach(function (form) {
    var errBox = $('.form-error', form);
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      errBox && errBox.classList.remove('show');
      var v = function (n) { return form.elements[n] ? form.elements[n].value.trim() : ''; };
      ['name', 'phone', 'email', 'message'].forEach(function (n) { fieldError(form, n, false); });
      if (v('name').length < 2) return fieldError(form, 'name', true);
      if (!validPhone(v('phone'))) return fieldError(form, 'phone', true);
      if (v('email') && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v('email'))) return fieldError(form, 'email', true);
      if (v('message').length < 5) return fieldError(form, 'message', true);
      var btn = form.querySelector('[type=submit]');
      submitLead({ form: 'contact', name: v('name'), phone: v('phone'), email: v('email'), case_type: v('service'), message: v('message'), hp: v('website'), ts: form.getAttribute('data-ts') }, btn, function () {
        form.querySelector('.cform-body').style.display = 'none';
        $('.form-done', form).classList.add('show');
      }, function (msg, field) {
        if (field) return fieldError(form, field, true);
        if (errBox) { errBox.textContent = msg; errBox.classList.add('show'); }
      });
    });
  });

  // روابط «#form» تنتقل لأول نموذج في الصفحة
  $$('a[href="#form"]').forEach(function (a) {
    a.addEventListener('click', function (e) {
      var f = $('[data-mform], [data-cform]');
      if (!f) return;
      e.preventDefault();
      (f.closest('.frame') || f).scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
  });

  /* ── تنبيه ملفات الارتباط ── */
  var ck = $('#cookie');
  if (ck && !store('isgha_cookie_ok')) {
    ck.classList.add('show');
    $('button', ck).addEventListener('click', function () { store('isgha_cookie_ok', 1); ck.classList.remove('show'); });
  }
})();

/* البحث في الهيدر: يفتح مربع البحث أسفل الشريط */
(function () {
  var form = document.getElementById('nav-search');
  var btn = document.querySelector('[data-search-open]');
  if (!form || !btn) return;
  var input = form.querySelector('input');
  function open() { form.hidden = false; btn.setAttribute('aria-expanded', 'true'); requestAnimationFrame(function () { form.classList.add('open'); input.focus(); }); }
  function close() { form.classList.remove('open'); btn.setAttribute('aria-expanded', 'false'); setTimeout(function () { form.hidden = true; }, 220); }
  btn.addEventListener('click', function (e) { e.preventDefault(); if (form.hidden) open(); else close(); });
  form.querySelector('[data-search-close]').addEventListener('click', close);
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && !form.hidden) { close(); btn.focus(); } });
  document.addEventListener('click', function (e) { if (!form.hidden && !form.contains(e.target) && !btn.contains(e.target)) close(); });
})();
