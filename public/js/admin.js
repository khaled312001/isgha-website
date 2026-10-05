/* إصغاء — سكربت لوحة التحكم: محرك النماذج، مكتبة الوسائط، الجداول، الرسوم */
(function () {
  'use strict';
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var CSRF = ($('meta[name=csrf]') || {}).content || '';
  var ICON_V = (function () { var u = $('use[href*="icons.svg"]'); var m = u && u.getAttribute('href').match(/\?v=([^#]+)/); return m ? m[1] : ''; })();

  function h(tag, attrs, kids) {
    var el = document.createElement(tag);
    if (attrs) Object.keys(attrs).forEach(function (k) {
      var v = attrs[k];
      if (v == null || v === false) return;
      if (k === 'class') el.className = v;
      else if (k === 'text') el.textContent = v;
      else if (k === 'html') el.innerHTML = v;
      else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
      else el.setAttribute(k, v === true ? '' : v);
    });
    (kids || []).forEach(function (c) { if (c != null) el.appendChild(typeof c === 'string' ? document.createTextNode(c) : c); });
    return el;
  }
  function icon(name, cls) {
    var s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    s.setAttribute('class', 'i' + (cls ? ' ' + cls : ''));
    s.setAttribute('aria-hidden', 'true');
    var u = document.createElementNS('http://www.w3.org/2000/svg', 'use');
    u.setAttribute('href', '/img/icons.svg' + (ICON_V ? '?v=' + ICON_V : '') + '#i-' + (name || 'circle-dot'));
    s.appendChild(u);
    return s;
  }

  /* ── طلبات الشبكة ── */
  function api(url, opts) {
    opts = opts || {};
    var init = { method: opts.method || 'POST', headers: { 'x-csrf-token': CSRF, accept: 'application/json', 'x-requested-with': 'XMLHttpRequest' }, credentials: 'same-origin' };
    if (opts.form) init.body = opts.form;
    else if (opts.body !== undefined) { init.headers['content-type'] = 'application/json'; init.body = JSON.stringify(opts.body); }
    if (init.method === 'GET') delete init.body;
    return fetch(url, init).then(function (r) {
      return r.json().catch(function () { return {}; }).then(function (j) {
        if (!r.ok || j.ok === false) { var e = new Error(j.error || (r.status === 401 ? 'انتهت الجلسة، سجّل الدخول من جديد.' : 'حدث خطأ، حاول مجددًا.')); e.data = j; e.status = r.status; throw e; }
        return j;
      });
    });
  }

  function toast(msg, type) {
    var box = $('#toasts');
    if (!box) return;
    var t = h('div', { class: 'toast ' + (type || 'success'), role: 'status' }, [icon(type === 'error' ? 'triangle-alert' : 'check-circle'), h('span', { text: msg })]);
    box.appendChild(t);
    setTimeout(function () { t.style.opacity = '0'; t.style.transition = 'opacity .3s'; }, type === 'error' ? 5200 : 2800);
    setTimeout(function () { t.remove(); }, type === 'error' ? 5600 : 3200);
  }

  function busy(btn, on) { if (btn) { btn.classList.toggle('is-busy', on); btn.disabled = on; } }
  function debounce(fn, ms) { var t; return function () { var a = arguments, s = this; clearTimeout(t); t = setTimeout(function () { fn.apply(s, a); }, ms); }; }
  function copyText(text) {
    var done = function () { toast('تم النسخ'); };
    if (navigator.clipboard && window.isSecureContext) return navigator.clipboard.writeText(text).then(done);
    var ta = h('textarea', { style: 'position:fixed;opacity:0' }); ta.value = text; document.body.appendChild(ta); ta.select();
    try { document.execCommand('copy'); done(); } catch (e) { /* */ }
    ta.remove();
  }

  /* ── أيقونات متاحة (من ملف الـ sprite) ── */
  var iconNames = null;
  function loadIcons() {
    if (iconNames) return Promise.resolve(iconNames);
    return fetch('/img/icons.svg' + (ICON_V ? '?v=' + ICON_V : '')).then(function (r) { return r.text(); }).then(function (t) {
      iconNames = (t.match(/id="i-([\w-]+)"/g) || []).map(function (x) { return x.slice(6, -1); }).filter(function (n) { return ['logout', 'menu', 'x', 'chevron-down', 'chevron-up', 'grip'].indexOf(n) < 0; });
      return iconNames;
    });
  }

  /* ── نافذة منبثقة عامة ── */
  function modal(title, body, opts) {
    opts = opts || {};
    var dlg = h('dialog', { class: 'modal' + (opts.wide ? ' wide' : '') });
    var close = function () { dlg.close(); };
    dlg.appendChild(h('div', { class: 'modal-body' }, [
      h('header', { class: 'modal-head' }, [h('h3', { text: title }), h('button', { class: 'icon-btn', type: 'button', 'aria-label': 'إغلاق', onclick: close }, [icon('x')])]),
      body,
    ]));
    dlg.addEventListener('close', function () { dlg.remove(); if (opts.onClose) opts.onClose(); });
    document.body.appendChild(dlg);
    dlg.showModal();
    return { el: dlg, close: close };
  }

  /* ── مكتبة الوسائط (اختيار / رفع) ── */
  function uploadFiles(files) {
    var fd = new FormData();
    Array.prototype.forEach.call(files, function (f) { fd.append('files', f); });
    return api('/admin/media/upload', { form: fd });
  }
  function openPicker(onPick) {
    var grid = h('div', { class: 'picker-grid' });
    var page = 1;
    var more = h('button', { class: 'btn btn-line btn-sm', type: 'button', hidden: true, text: 'المزيد', onclick: function () { page += 1; load(); } });
    var file = h('input', { type: 'file', accept: 'image/*', multiple: true, hidden: true });
    var m;
    function pick(url) { onPick(url); m.close(); }
    function load(reset) {
      if (reset) { grid.innerHTML = ''; page = 1; }
      api('/admin/media?format=json&type=image&page=' + page, { method: 'GET' }).then(function (j) {
        j.rows.forEach(function (it) {
          grid.appendChild(h('button', { type: 'button', title: it.original_name || '', onclick: function () { pick(it.url); } }, [h('img', { src: it.url, alt: it.alt || '', loading: 'lazy' })]));
        });
        more.hidden = j.page >= j.pages;
        if (!j.rows.length && page === 1) grid.appendChild(h('p', { class: 'muted', text: 'المكتبة فارغة — ارفع صورة.' }));
      }).catch(function (e) { toast(e.message, 'error'); });
    }
    file.addEventListener('change', function () {
      if (!file.files.length) return;
      var b = upBtn; busy(b, true);
      uploadFiles(file.files).then(function (j) { busy(b, false); if (j.items && j.items.length === 1) return pick(j.items[0].url); load(true); toast('تم الرفع'); })
        .catch(function (e) { busy(b, false); toast(e.message, 'error'); });
    });
    var upBtn = h('button', { class: 'btn btn-teal btn-sm', type: 'button', onclick: function () { file.click(); } }, [icon('upload'), ' رفع صورة جديدة']);
    var urlIn = h('input', { class: 'sm', dir: 'ltr', placeholder: 'أو الصق رابط صورة https://…' });
    var urlBtn = h('button', { class: 'btn btn-line btn-sm', type: 'button', text: 'استخدام الرابط', onclick: function () { if (/^(https:\/\/|\/)/.test(urlIn.value.trim())) pick(urlIn.value.trim()); else toast('رابط غير صالح', 'error'); } });
    var body = h('div', {}, [h('div', { class: 'picker-top' }, [upBtn, file, h('span', { style: 'flex:1' }), urlIn, urlBtn]), grid, h('div', { class: 'center', style: 'margin-top:10px' }, [more])]);
    m = modal('اختر صورة', body, { wide: true });
    load(true);
  }

  /* ═════ محرك النماذج ═════ */
  var ARD = function (n) { return String(n).replace(/\d/g, function (d) { return '٠١٢٣٤٥٦٧٨٩'[d]; }); };

  function optionsFor(f, ctx) {
    if (f.options) return f.options;
    var src = (ctx.sources || {})[f.source] || [];
    return [['', '— اختر —']].concat(src);
  }

  function counterEl(f, input) {
    if (!f.counter) return null;
    var c = h('span', { class: 'counter' });
    var upd = function () {
      var n = (input.value || '').length;
      c.textContent = ARD(n) + ' / ' + ARD(f.counter);
      c.className = 'counter' + (n > f.counter + 5 ? ' bad' : n > f.counter ? ' warn' : '');
    };
    input.addEventListener('input', upd); upd();
    return c;
  }

  function toLocalInput(iso) {
    if (!iso) return '';
    var d = new Date(iso); if (isNaN(d)) return '';
    var p = function (n) { return String(n).padStart(2, '0'); };
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()) + 'T' + p(d.getHours()) + ':' + p(d.getMinutes());
  }

  var FIELD = {};

  FIELD.text = function (f, v, ctx) {
    var type = { email: 'email', url: 'url', number: 'number', datetime: 'datetime-local' }[f.type] || 'text';
    var input = h('input', { type: type === 'url' ? 'text' : type, dir: f.dir || (f.type === 'slug' || f.type === 'url' || f.type === 'email' ? 'ltr' : null), maxlength: f.max || null, placeholder: f.placeholder || null, min: f.min != null ? f.min : null, max: f.type === 'number' && f.max != null ? f.max : null, required: f.required || null });
    input.value = f.type === 'datetime' ? toLocalInput(v) : (v == null ? '' : v);
    input.addEventListener('input', ctx.changed);
    return { el: input, input: input, get: function () {
      if (f.type === 'number') return input.value === '' ? '' : Number(input.value);
      if (f.type === 'datetime') return input.value ? new Date(input.value).toISOString() : '';
      return input.value;
    } };
  };
  FIELD.email = FIELD.url = FIELD.slug = FIELD.number = FIELD.datetime = FIELD.text;

  FIELD.textarea = function (f, v, ctx) {
    var ta = h('textarea', { rows: f.rows || (f.type === 'code' ? 7 : 3), dir: f.dir || (f.type === 'code' ? 'ltr' : null), maxlength: f.max || null, class: f.type === 'code' ? 'code-input' : null, spellcheck: f.type === 'code' ? 'false' : null, placeholder: f.placeholder || null });
    ta.value = v == null ? '' : v;
    ta.addEventListener('input', ctx.changed);
    return { el: ta, input: ta, get: function () { return ta.value; } };
  };
  FIELD.code = FIELD.textarea;

  FIELD.secret = function (f, v, ctx) {
    var saved = ctx.secrets && ctx.secrets[f.name];
    var input = h('input', { type: 'password', dir: 'ltr', autocomplete: 'new-password', placeholder: saved ? '•••••••• محفوظ — اكتب قيمة جديدة للتغيير' : '' });
    input.addEventListener('input', ctx.changed);
    var clr = saved ? h('label', { class: 'chk small' }, [h('input', { type: 'checkbox', onchange: ctx.changed }), h('span', { text: 'مسح القيمة المحفوظة' })]) : null;
    return { el: h('div', { class: 'stack', style: 'gap:6px' }, [input, clr]), input: input, get: function () { return input.value; }, extra: function (out) { if (clr && clr.querySelector('input').checked) out[f.name + '__clear'] = true; } };
  };

  FIELD.toggle = function (f, v, ctx) {
    var cb = h('input', { type: 'checkbox' });
    cb.checked = !!v;
    cb.addEventListener('change', ctx.changed);
    return { el: h('span', { class: 'switch' }, [cb, h('span')]), input: cb, inline: true, get: function () { return cb.checked; } };
  };

  FIELD.select = function (f, v, ctx) {
    var sel = h('select');
    optionsFor(f, ctx).forEach(function (o) { var op = h('option', { value: o[0], text: o[1] }); if (String(o[0]) === String(v == null ? '' : v)) op.selected = true; sel.appendChild(op); });
    sel.addEventListener('change', ctx.changed);
    return { el: sel, input: sel, get: function () { return sel.value; } };
  };

  FIELD.list = function (f, v, ctx) {
    var ta = h('textarea', { rows: Math.min(12, Math.max(3, (v || []).length + 1)), placeholder: 'سطر لكل عنصر' });
    ta.value = (Array.isArray(v) ? v : []).join('\n');
    ta.addEventListener('input', ctx.changed);
    return { el: ta, input: ta, get: function () { return ta.value.split('\n').map(function (s) { return s.trim(); }).filter(Boolean); } };
  };

  FIELD.checks = function (f, v, ctx) {
    v = v || {};
    var box = h('div', { class: 'checks-grid' });
    var inputs = {};
    (f.options || []).forEach(function (o) {
      var cb = h('input', { type: 'checkbox' }); cb.checked = !!v[o[0]]; cb.addEventListener('change', ctx.changed);
      inputs[o[0]] = cb;
      box.appendChild(h('label', { class: 'ff-toggle' }, [h('span', { class: 'ff-label', text: o[1] }), h('span', { class: 'switch sm' }, [cb, h('span')])]));
    });
    return { el: box, get: function () { var o = {}; Object.keys(inputs).forEach(function (k) { o[k] = inputs[k].checked; }); return o; } };
  };

  FIELD.richtext = function (f, v, ctx) {
    var host = h('div', { class: 'ql-wrap' });
    var ed = h('div');
    host.appendChild(ed);
    var q = null;
    var fallback = null;
    if (window.Quill) {
      ed.innerHTML = v || '';
      setTimeout(function () {
        q = new window.Quill(ed, {
          theme: 'snow',
          placeholder: 'اكتب هنا…',
          modules: { toolbar: [[{ header: [2, 3, false] }], ['bold', 'italic', 'underline'], [{ list: 'ordered' }, { list: 'bullet' }], ['blockquote', 'link'], [{ align: [] }], ['clean']] },
        });
        q.format('direction', 'rtl'); q.format('align', 'right');
        q.history.clear();
        q.on('text-change', ctx.changed);
      });
    } else {
      fallback = h('textarea', { rows: 8 }); fallback.value = v || ''; fallback.addEventListener('input', ctx.changed); host.innerHTML = ''; host.appendChild(fallback);
    }
    return { el: host, get: function () {
      if (fallback) return fallback.value;
      if (!q) return v || '';
      if (!q.getText().trim() && !q.root.querySelector('img')) return '';
      return q.root.innerHTML.replace(/ class="ql-align-right ql-direction-rtl"/g, '').replace(/ class="ql-direction-rtl ql-align-right"/g, '');
    } };
  };

  FIELD.image = function (f, v, ctx) {
    var input = h('input', { dir: 'ltr', placeholder: '/uploads/… أو https://…', class: 'sm' });
    input.value = v || '';
    var prev = h('div', { class: 'ff-img-prev' });
    var slotKey = function () { if (f.slot) return f.slot; if (f.slotFrom && ctx.values) return (f.slotPrefix || '') + (ctx.peek ? ctx.peek(f.slotFrom) : ctx.values[f.slotFrom]); return null; };
    function paint() {
      var url = input.value.trim();
      var sk = slotKey();
      var slotUrl = !url && sk && ctx.slotImages ? ctx.slotImages[sk] : '';
      var show = url || slotUrl;
      prev.style.backgroundImage = show ? 'url("' + show.replace(/"/g, '%22') + '")' : '';
      prev.classList.toggle('is-slot', !url && !!slotUrl);
      prev.innerHTML = '';
      if (!show) prev.appendChild(icon('image'));
      rm.hidden = !url;
    }
    var rm = h('button', { class: 'btn btn-danger-ghost btn-xs', type: 'button', onclick: function () { input.value = ''; paint(); ctx.changed(); } }, [icon('trash'), ' إزالة']);
    var file = h('input', { type: 'file', accept: 'image/*', hidden: true });
    var up = h('button', { class: 'btn btn-line btn-xs', type: 'button', onclick: function () { file.click(); } }, [icon('upload'), ' رفع']);
    file.addEventListener('change', function () {
      if (!file.files.length) return;
      busy(up, true);
      uploadFiles(file.files).then(function (j) { busy(up, false); input.value = j.items[0].url; paint(); ctx.changed(); })
        .catch(function (e) { busy(up, false); toast(e.message, 'error'); });
    });
    var lib = h('button', { class: 'btn btn-line btn-xs', type: 'button', onclick: function () { openPicker(function (url) { input.value = url; paint(); ctx.changed(); }); } }, [icon('folder'), ' من المكتبة']);
    input.addEventListener('input', function () { paint(); ctx.changed(); });
    var hint = slotKey() ? h('span', { class: 'ff-hint', text: 'اتركها فارغة لاستخدام الصورة المرفوعة في «صور الموقع».' }) : null;
    paint();
    return { el: h('div', { class: 'ff-img' }, [prev, h('div', { class: 'ff-img-side' }, [h('div', { class: 'ff-img-btns' }, [lib, up, rm, file]), input, hint])]), input: input, get: function () { return input.value.trim(); }, repaint: paint };
  };

  FIELD.icon = function (f, v, ctx) {
    var input = h('input', { dir: 'ltr', class: 'sm', placeholder: 'اسم الأيقونة' });
    input.value = v || '';
    var cur = h('button', { class: 'ff-icon-cur', type: 'button', title: 'اختر أيقونة' });
    function paint() { cur.innerHTML = ''; cur.appendChild(icon(input.value || 'circle-dot')); }
    cur.addEventListener('click', function () {
      loadIcons().then(function (names) {
        var grid = h('div', { class: 'icon-grid' });
        var search = h('input', { class: 'sm', dir: 'ltr', placeholder: 'بحث بالإنجليزية: scale, gavel, building…' });
        var m;
        function draw() {
          grid.innerHTML = '';
          names.filter(function (n) { return !search.value || n.indexOf(search.value.toLowerCase()) > -1; }).forEach(function (n) {
            grid.appendChild(h('button', { type: 'button', title: n, class: n === input.value ? 'on' : null, onclick: function () { input.value = n; paint(); ctx.changed(); m.close(); } }, [icon(n)]));
          });
        }
        search.addEventListener('input', draw);
        draw();
        m = modal('اختر أيقونة', h('div', { class: 'stack' }, [search, grid]));
        search.focus();
      });
    });
    input.addEventListener('input', function () { paint(); ctx.changed(); });
    paint();
    return { el: h('div', { class: 'ff-icon' }, [cur, input]), input: input, get: function () { return input.value.trim(); } };
  };

  FIELD.repeater = function (f, v, ctx) {
    var wrap = h('div', { class: 'rep' });
    var list = h('div', { class: 'rep-list stack', style: 'gap:8px' });
    var items = [];
    function label(it, i) { var d = it.form ? it.form.get() : it.data; var t = d[f.itemLabel] || d.title || d.name || d.label || d.q; return (t ? String(t).replace(/==/g, '').slice(0, 60) : '') || ('عنصر ' + ARD(i + 1)); }
    function relabel() { items.forEach(function (it, i) { it.title.textContent = label(it, i); }); }
    function add(data, open) {
      var it = { data: data || {} };
      var body = h('div', { class: 'rep-body' });
      it.title = h('b');
      var el = h('div', { class: 'rep-item' + (open ? ' open' : '') }, [
        h('div', { class: 'rep-head', onclick: function (e) { if (e.target.closest('button')) return; el.classList.toggle('open'); } }, [
          h('span', { class: 'grip', title: 'اسحب للترتيب' }, [icon('grip')]), it.title,
          h('button', { class: 'icon-btn', type: 'button', title: 'نسخ', 'aria-label': 'نسخ', onclick: function () { var idx = items.indexOf(it); var cp = add(JSON.parse(JSON.stringify(it.form.get())), true); list.insertBefore(cp.el, el.nextSibling); items.splice(items.indexOf(cp), 1); items.splice(idx + 1, 0, cp); relabel(); ctx.changed(); } }, [icon('copy')]),
          h('button', { class: 'icon-btn', type: 'button', title: 'حذف', 'aria-label': 'حذف', onclick: function () { if (!confirm('حذف هذا العنصر؟')) return; items.splice(items.indexOf(it), 1); el.remove(); relabel(); ctx.changed(); } }, [icon('trash')]),
        ]),
        body,
      ]);
      it.el = el;
      it.form = renderFields(body, f.fields || [], it.data, { sources: ctx.sources, slotImages: ctx.slotImages, onChange: function () { relabel(); ctx.changed(); } });
      items.push(it);
      list.appendChild(el);
      return it;
    }
    (Array.isArray(v) ? v : []).forEach(function (d) { add(d, false); });
    relabel();
    var addBtn = h('button', { class: 'btn btn-line btn-sm rep-add', type: 'button', onclick: function () { var it = add({}, true); relabel(); ctx.changed(); var first = it.el.querySelector('input,textarea'); if (first) first.focus(); } }, [icon('plus'), ' إضافة']);
    wrap.appendChild(list); wrap.appendChild(addBtn);
    if (window.Sortable) window.Sortable.create(list, { handle: '.grip', animation: 150, onEnd: function () { items.sort(function (a, b) { return Array.prototype.indexOf.call(list.children, a.el) - Array.prototype.indexOf.call(list.children, b.el); }); relabel(); ctx.changed(); } });
    return { el: wrap, get: function () { return items.map(function (it) { return it.form.get(); }); } };
  };

  // يرسم الحقول داخل حاوية ويعيد دوال القراءة والتحقق
  function renderFields(container, fields, values, opts) {
    opts = opts || {};
    values = values || {};
    var ctrls = {};
    var ctx = { sources: opts.sources, slotImages: opts.slotImages, secrets: opts.secrets, values: values, changed: function () { if (opts.onChange) opts.onChange(); } };
    ctx.peek = function (name) { return ctrls[name] ? ctrls[name].get() : values[name]; };
    fields.forEach(function (f) {
      if (opts.filter && !opts.filter(f)) return;
      var maker = FIELD[f.type] || FIELD.text;
      var c = maker(f, values[f.name] !== undefined ? values[f.name] : f.default, ctx);
      ctrls[f.name] = c;
      var target = (opts.targetFor && opts.targetFor(f)) || container;
      var id = 'ff-' + Math.random().toString(36).slice(2, 8);
      if (c.input) c.input.id = id;
      var lab = h('label', { class: 'ff-label', for: id }, [h('span', {}, [f.label || f.name, f.required ? h('span', { class: 'req', text: ' *' }) : null])]);
      var cnt = c.input && counterEl(f, c.input);
      if (cnt) lab.appendChild(cnt);
      var wrap;
      if (c.inline) wrap = h('div', { class: 'ff-toggle', 'data-name': f.name }, [lab, c.el]);
      else wrap = h('div', { class: 'ff', 'data-name': f.name }, [lab, c.el, f.hint ? h('span', { class: 'ff-hint', text: f.hint }) : null]);
      if (c.inline && f.hint) wrap = h('div', { class: 'ff' }, [wrap, h('span', { class: 'ff-hint', text: f.hint })]);
      target.appendChild(wrap);
      c.wrap = wrap;
    });
    // تحديث معاينة الصور المرتبطة بحقل آخر (مثل خانة الصورة حسب الرابط)
    Object.keys(ctrls).forEach(function (k) { if (ctrls[k].repaint && ctrls[ctrls[k].repaint && k] ) { /* */ } });
    return {
      get: function () {
        var out = {};
        Object.keys(ctrls).forEach(function (k) { out[k] = ctrls[k].get(); if (ctrls[k].extra) ctrls[k].extra(out); });
        return out;
      },
      error: function (name, msg) {
        $$('.fld-err', container.ownerDocument).forEach(function (x) { x.remove(); });
        $$('.has-err', container.ownerDocument).forEach(function (x) { x.classList.remove('has-err'); });
        var c = ctrls[name];
        if (!c || !c.wrap) return;
        c.wrap.classList.add('has-err', 'fld');
        c.wrap.appendChild(h('span', { class: 'err-msg fld-err', text: msg }));
        c.wrap.scrollIntoView({ behavior: 'smooth', block: 'center' });
        if (c.input) c.input.focus();
      },
      controls: ctrls,
    };
  }

  // نموذج كامل (المحتوى / الإعدادات): رسم + حفظ + اختصار Ctrl+S + تنبيه عند المغادرة
  function mountForm(form, boot) {
    var main = $('#ff-main', form) || form;
    var seoBox = $('#ff-seo', form.ownerDocument);
    var dirty = false;
    var engine = renderFields(main, boot.fields, boot.values, {
      sources: boot.sources, slotImages: boot.slotImages, secrets: boot.secrets,
      onChange: function () { dirty = true; },
      targetFor: function (f) { if (f.group === 'seo' && seoBox) { seoBox.hidden = false; return seoBox; } return null; },
    });
    function save(btn) {
      busy(btn, true);
      return api(boot.action, { body: { values: engine.get() } }).then(function (j) {
        busy(btn, false);
        dirty = false;
        if (j.redirect) { location.href = j.redirect; return; }
        toast(j.message || 'تم الحفظ');
        if (boot.secrets) $$('input[type=password]', form).forEach(function (i) { i.value = ''; });
      }).catch(function (e) {
        busy(btn, false);
        if (e.data && e.data.field) engine.error(e.data.field, e.message);
        toast(e.message, 'error');
      });
    }
    form.addEventListener('submit', function (e) { e.preventDefault(); save(e.submitter || $('button[type=submit]', form)); });
    document.addEventListener('keydown', function (e) { if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); save($('button[type=submit]', form)); } });
    window.addEventListener('beforeunload', function (e) { if (dirty) { e.preventDefault(); e.returnValue = ''; } });
    return engine;
  }

  /* ── رسم بياني ── */
  function chart(id, cfg) {
    var el = document.getElementById(id);
    if (!el || !window.Chart) return;
    var labels = cfg.labels.map(function (d) { var p = d.split('-'); return ARD(+p[2]) + '/' + ARD(+p[1]); });
    window.Chart.defaults.font.family = 'ThmanyahText, system-ui, sans-serif';
    window.Chart.defaults.color = '#6d7672';
    new window.Chart(el, {
      data: {
        labels: labels,
        datasets: cfg.sets.filter(Boolean).map(function (s) {
          return { type: s.type || 'line', label: s.label, data: s.data, yAxisID: s.axis || 'y', borderColor: s.color, backgroundColor: s.type === 'bar' ? s.color + 'cc' : s.color + '22', fill: s.type !== 'bar' && !s.dashed, tension: .35, pointRadius: 0, pointHoverRadius: 4, borderWidth: 2, borderDash: s.dashed ? [4, 4] : [], borderRadius: 4, maxBarThickness: 14, order: s.type === 'bar' ? 2 : 1 };
        }),
      },
      options: {
        maintainAspectRatio: false, interaction: { mode: 'index', intersect: false },
        // نصف قطر علامة الدليل يُحسب من boxHeight؛ إن تجاوز boxWidth تتداخل العلامة مع النص في وضع RTL
        plugins: { legend: { position: 'bottom', rtl: true, labels: { usePointStyle: true, pointStyle: 'circle', boxWidth: 10, boxHeight: 7, padding: 18 } }, tooltip: { rtl: true, usePointStyle: true, boxPadding: 4 } },
        scales: {
          x: { grid: { display: false }, ticks: { maxTicksLimit: 10 } },
          y: { position: 'left', beginAtZero: true, grid: { color: '#efede6' }, ticks: { precision: 0 } },
          y1: { position: 'right', beginAtZero: true, grid: { display: false }, ticks: { precision: 0 } },
        },
      },
    });
  }

  /* ── منشئ روابط UTM ── */
  function utmBuilder(base) {
    var out = $('[data-utm-out]');
    if (!out) return;
    var origin = base || location.origin;
    function upd() {
      var page = ($('[data-utm=page]') || {}).value || '/';
      var u = new URL(page, origin);
      $$('[data-utm]').forEach(function (i) { var k = i.getAttribute('data-utm'); if (k !== 'page' && i.value.trim()) u.searchParams.set(k, i.value.trim().toLowerCase().replace(/\s+/g, '-')); });
      out.textContent = u.toString();
    }
    $$('[data-utm]').forEach(function (i) { i.addEventListener('input', upd); i.addEventListener('change', upd); });
    var b = $('[data-utm-copy]'); if (b) b.addEventListener('click', function () { copyText(out.textContent); });
    upd();
  }

  /* ═════ سلوكيات عامة ═════ */
  document.addEventListener('click', function (e) {
    var t = e.target;
    var c = t.closest('[data-confirm]');
    if (c && !confirm(c.getAttribute('data-confirm'))) { e.preventDefault(); e.stopImmediatePropagation(); return; }
    var cp = t.closest('[data-copy]');
    if (cp) { e.preventDefault(); copyText(cp.getAttribute('data-copy')); return; }
    if (t.closest('[data-side-open]')) document.body.classList.add('side-open');
    if (t.closest('[data-side-close]')) document.body.classList.remove('side-open');
    var mo = t.closest('[data-modal-open]');
    if (mo) { var d = document.getElementById(mo.getAttribute('data-modal-open')); if (d) d.showModal(); }
    var mc = t.closest('[data-modal-close]');
    if (mc) { var dd = mc.closest('dialog'); if (dd) dd.close(); }
    // إغلاق القوائم المنبثقة عند الضغط خارجها
    $$('details.menu[open]').forEach(function (m) { if (!m.contains(t)) m.removeAttribute('open'); });
    var row = t.closest('tr[data-href]');
    if (row && !t.closest('a,button,input,select')) location.href = row.getAttribute('data-href');
    var post = t.closest('[data-post]');
    if (post) {
      e.preventDefault();
      var body = {};
      var pf = post.getAttribute('data-post-field');
      if (pf) { var parts = pf.split(':'); var src = $(parts[1]); body[parts[0]] = src ? src.value : ''; }
      busy(post, true);
      api(post.getAttribute('data-post'), { body: body }).then(function (j) { busy(post, false); toast(j.message || 'تم'); }).catch(function (er) { busy(post, false); toast(er.message, 'error'); });
    }
  });

  // إغلاق النوافذ بالضغط على الخلفية
  $$('dialog.modal').forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); });

  // تبديل الظهور في الجداول
  document.addEventListener('change', function (e) {
    var t = e.target;
    if (t.matches('[data-toggle-url]')) {
      api(t.getAttribute('data-toggle-url'), { body: {} }).then(function (j) { t.checked = j.active; toast(j.active ? 'أصبح ظاهرًا في الموقع' : 'تم الإخفاء من الموقع'); }).catch(function (er) { t.checked = !t.checked; toast(er.message, 'error'); });
    }
    if (t.matches('[data-lead-status]')) {
      var prevCls = t.className;
      api('/admin/leads/' + t.getAttribute('data-lead-status') + '/update', { body: { status: t.value } }).then(function () {
        var map = { new: 'blue', contacted: 'amber', qualified: 'teal', won: 'green', lost: 'gray', spam: 'red' };
        t.className = 'status-select ' + (map[t.value] || '');
        var tr = t.closest('tr'); if (tr) tr.classList.toggle('is-new', t.value === 'new');
        toast('تم تحديث الحالة');
      }).catch(function (er) { t.className = prevCls; toast(er.message, 'error'); });
    }
    if (t.matches('[data-alt-url]')) {
      api(t.getAttribute('data-alt-url'), { body: { alt: t.value } }).then(function () { toast('تم حفظ الوصف'); }).catch(function (er) { toast(er.message, 'error'); });
    }
    if (t.matches('[data-copy-select]')) { var r = t.closest('.tpl'); if (r) r.querySelector('input[type=radio]').checked = true; }
  });

  // التحديد الجماعي في جدول الطلبات
  $$('[data-bulk]').forEach(function (form) {
    var bar = $('.bulkbar', form);
    var count = $('[data-bulk-count]', form);
    function upd() { var n = $$('input[name=ids]:checked', form).length; bar.hidden = !n; count.textContent = ARD(n); }
    form.addEventListener('change', function (e) {
      if (e.target.matches('[data-check-all]')) $$('input[name=ids]', form).forEach(function (c) { c.checked = e.target.checked; });
      if (e.target.matches('[data-check-all],input[name=ids]')) upd();
    });
    form.addEventListener('submit', function (e) { if (!$('select[name=action]', form).value) { e.preventDefault(); toast('اختر الإجراء أولًا', 'error'); } });
  });

  // ترتيب الصفوف بالسحب — بعد تحميل كل السكربتات (مكتبة Sortable تُحمَّل بعد هذا الملف)
  function initSortTables() {
    $$('table[data-sortable]').forEach(function (tbl) {
      if (!window.Sortable || tbl._sortable) return;
      var tbody = $('tbody', tbl);
      var before = null;
      tbl._sortable = window.Sortable.create(tbody, {
        handle: '.grip', animation: 150,
        onStart: function () { before = $$('tr[data-id]', tbody).map(function (r) { return r.getAttribute('data-id'); }).join(','); },
        onEnd: function () {
          var ids = $$('tr[data-id]', tbody).map(function (r) { return +r.getAttribute('data-id'); });
          if (ids.join(',') === before) return;
          api(tbl.getAttribute('data-sortable'), { body: { ids: ids } }).then(function () { toast('تم حفظ الترتيب'); }).catch(function (er) { toast(er.message, 'error'); });
        },
      });
    });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', initSortTables); else initSortTables();

  // رفع بالسحب والإفلات
  $$('[data-dropzone]').forEach(function (z) {
    var input = $('input[type=file]', z);
    ['dragenter', 'dragover'].forEach(function (ev) { z.addEventListener(ev, function (e) { e.preventDefault(); z.classList.add('over'); }); });
    ['dragleave', 'drop'].forEach(function (ev) { z.addEventListener(ev, function () { z.classList.remove('over'); }); });
    z.addEventListener('drop', function (e) { e.preventDefault(); if (e.dataTransfer.files.length) { input.files = e.dataTransfer.files; z.submit(); } });
    input.addEventListener('change', function () { if (input.files.length) z.submit(); });
  });

  // خانات صور الموقع
  function slotCard(key) { return $('[data-slot="' + key + '"]'); }
  function slotSet(key, payload, btn) {
    busy(btn, true);
    var opts = payload instanceof FormData ? { form: payload } : { body: payload };
    return api('/admin/media/slots/' + key, opts).then(function (j) {
      busy(btn, false);
      var card = slotCard(key);
      var box = $('.slot-img', card);
      box.innerHTML = '';
      if (j.url) box.appendChild(h('img', { src: j.url, alt: '' }));
      else box.appendChild(h('div', { class: 'ph-admin' }, [icon('image')]));
      card.classList.toggle('has', !!j.url);
      var st = $('[data-slot-state]', card);
      st.textContent = j.custom ? 'صورة مخصّصة' : j.url ? 'الصورة الأساسية' : 'بانتظار الصورة';
      st.className = 'pill ' + (j.custom ? 'green' : j.url ? 'teal' : 'gray');
      $('[data-slot-clear]', card).hidden = !j.custom;
      toast(j.custom ? 'تم تحديث الصورة في الموقع' : j.url ? 'تمت استعادة الصورة الأساسية' : 'تمت إزالة الصورة');
    }).catch(function (e) { busy(btn, false); toast(e.message, 'error'); });
  }
  $$('[data-slot-upload]').forEach(function (inp) {
    inp.addEventListener('change', function () {
      if (!inp.files.length) return;
      var fd = new FormData(); fd.append('files', inp.files[0]);
      slotSet(inp.getAttribute('data-slot-upload'), fd, inp.closest('label'));
      inp.value = '';
    });
  });
  $$('[data-slot-pick]').forEach(function (b) { b.addEventListener('click', function () { openPicker(function (url) { slotSet(b.getAttribute('data-slot-pick'), { url: url }, b); }); }); });
  $$('[data-slot-clear]').forEach(function (b) { b.addEventListener('click', function () { if (confirm(b.getAttribute('data-has-default') ? 'استعادة الصورة الأساسية لهذه الخانة؟ (الصورة الحالية تبقى في المكتبة)' : 'إزالة الصورة من هذه الخانة؟ (تبقى في المكتبة)')) slotSet(b.getAttribute('data-slot-clear'), { url: '' }, b); }); });

  // صلاحيات المستخدم المخصصة
  (function () {
    var sel = $('[data-role-select]');
    var custom = $('[data-custom-perms]');
    var grid = $('[data-perm-grid]');
    if (!sel || !grid) return;
    function upd() {
      var on = custom.checked && sel.value !== 'owner';
      grid.classList.toggle('disabled', !on);
      if (!on) { var perms = (sel.options[sel.selectedIndex].getAttribute('data-perms') || '').split(','); $$('input', grid).forEach(function (c) { c.checked = perms.indexOf(c.value) > -1; }); }
    }
    sel.addEventListener('change', upd); custom.addEventListener('change', upd); upd();
  })();

  window.ADM = { api: api, toast: toast, h: h, icon: icon, busy: busy, debounce: debounce, copy: copyText, modal: modal, openPicker: openPicker, renderFields: renderFields, mountForm: mountForm, chart: chart, utmBuilder: utmBuilder, uploadFiles: uploadFiles };
})();
