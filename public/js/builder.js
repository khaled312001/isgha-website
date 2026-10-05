/* إصغاء — منشئ الصفحات: أقسام قابلة للسحب، نموذج لكل قسم، حفظ تلقائي للمسودة، معاينة حية، نشر */
(function () {
  'use strict';
  var B = window.BUILDER;
  var A = window.ADM;
  if (!B || !A) return;
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };
  var h = A.h;
  var icon = A.icon;

  var sections = B.sections || [];
  var current = null; // رقم القسم المفتوح
  var form = null;
  var pending = false;
  var saving = false;
  var hasDraft = B.hasDraft;
  var previewUrl = B.previewUrl;
  var panel = $('#bld-panel');
  var iframe = $('#bld-iframe');
  var savedEl = $('[data-bld-saved]');
  var statusEl = $('[data-bld-status]');
  var discardBtn = $('[data-bld-discard]');

  function uid() { return Math.random().toString(36).slice(2, 10); }
  function plain(s) { return String(s || '').replace(/==/g, '').replace(/\*\*/g, '').replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim(); }
  function typeOf(s) { return B.types[s.type] || { label: s.type, fields: [], icon: 'square-check' }; }
  function summary(s) {
    var d = s.data || {};
    return plain(d.title || d.eyebrow || d.form_title || d.tag || d.html || '') || typeOf(s).note || '';
  }
  function defaults(type) {
    var t = B.types[type]; var d = {};
    (t.fields || []).forEach(function (f) {
      var v = f.default;
      if (v === undefined) v = f.type === 'toggle' ? false : (f.type === 'list' || f.type === 'repeater') ? [] : '';
      d[f.name] = JSON.parse(JSON.stringify(v));
    });
    return d;
  }

  /* ── الحالة والحفظ ── */
  function setSaved(text) { if (savedEl) savedEl.textContent = text; }
  function markDirty() {
    pending = true;
    setSaved('جارٍ الحفظ…');
    saveSoon();
  }
  var saveSoon = A.debounce(function () { saveDraft(); }, 900);

  function collect() {
    if (form && current !== null && sections[current]) {
      var keep = sections[current].data.image_slot;
      sections[current].data = form.get();
      if (keep) sections[current].data.image_slot = keep;
    }
    return sections;
  }

  function saveDraft() {
    if (saving) { saveSoon(); return Promise.resolve(); }
    saving = true;
    return A.api('/admin/pages/' + B.id + '/draft', { body: { sections: collect() } }).then(function () {
      saving = false;
      pending = false;
      hasDraft = true;
      discardBtn.hidden = false;
      setSaved('تم حفظ المسودة · غير منشورة');
      reloadPreview();
    }).catch(function (e) {
      saving = false;
      setSaved('تعذر الحفظ');
      A.toast(e.message, 'error');
    });
  }

  /* ── المعاينة ── */
  var scrollY = 0;
  function reloadPreview(scrollTo) {
    try { scrollY = iframe.contentWindow.scrollY; } catch (e) { scrollY = 0; }
    var loading = $('.bld-loading'); if (loading) loading.hidden = false;
    var url = previewUrl + (previewUrl.indexOf('?') > -1 ? '&' : '?') + 't=' + Date.now();
    iframe.dataset.scrollTo = scrollTo || '';
    iframe.src = url;
  }
  iframe.addEventListener('load', function () {
    var loading = $('.bld-loading'); if (loading) loading.hidden = true;
    var doc;
    try { doc = iframe.contentDocument; } catch (e) { return; }
    if (!doc) return;
    var target = iframe.dataset.scrollTo;
    if (target) {
      var mk = doc.getElementById('sid-' + target);
      var el = mk && mk.nextElementSibling;
      if (el) el.scrollIntoView({ block: 'start' });
    } else {
      iframe.contentWindow.scrollTo(0, scrollY);
    }
    // إظهار كل العناصر فورًا داخل المعاينة
    $$('.rv', doc).forEach(function (x) { x.classList.add('in'); });
    // منع التنقل داخل المعاينة + الضغط على قسم يفتح إعداداته
    doc.addEventListener('click', function (e) {
      var a = e.target.closest('a');
      if (a) e.preventDefault();
      var main = doc.getElementById('main');
      var node = e.target;
      while (node && node.parentElement !== main) node = node.parentElement;
      if (!node) return;
      var prev = node;
      while (prev && !(prev.classList && prev.classList.contains('sid'))) prev = prev.previousElementSibling;
      if (prev) {
        var id = prev.getAttribute('data-sid');
        var idx = sections.findIndex(function (s) { return s.id === id; });
        if (idx > -1 && idx !== current) openSection(idx, false);
      }
    }, true);
    doc.addEventListener('submit', function (e) { e.preventDefault(); }, true);
    // بعد الضغط داخل المعاينة يبقى التركيز فيها: نمرّر اختصارات المنشئ (Ctrl+S / Esc) بدل حفظ صفحة المتصفح
    doc.addEventListener('keydown', function (e) {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveDraft(); }
      else if (e.key === 'Escape' && current !== null && !document.querySelector('dialog[open]')) { renderList(); window.focus(); }
    });
    var st = doc.createElement('style');
    st.textContent = 'main > *:not(.sid){cursor:pointer} main > *:not(.sid):hover{outline:2px dashed rgba(14,110,98,.55);outline-offset:-2px} .preview-flag{display:none}';
    doc.head.appendChild(st);
    highlight();
  });
  function highlight() {
    var doc;
    try { doc = iframe.contentDocument; } catch (e) { return; }
    if (!doc) return;
    $$('.bld-sel', doc).forEach(function (x) { x.classList.remove('bld-sel'); x.style.outline = ''; });
    if (current === null || !sections[current]) return;
    var mk = doc.getElementById('sid-' + sections[current].id);
    var el = mk && mk.nextElementSibling;
    if (el) { el.style.outline = '3px solid #0e6e62'; el.style.outlineOffset = '-3px'; el.classList.add('bld-sel'); }
  }
  function scrollPreviewTo(id) {
    var doc;
    try { doc = iframe.contentDocument; } catch (e) { return; }
    var mk = doc && doc.getElementById('sid-' + id);
    var el = mk && mk.nextElementSibling;
    if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  /* ── قائمة الأقسام ── */
  function renderList() {
    collect();
    current = null;
    form = null;
    panel.innerHTML = '';
    var list = h('ul', { class: 'sec-list' });
    sections.forEach(function (s, i) {
      var t = typeOf(s);
      var eye = h('button', { class: 'icon-btn', type: 'button', title: s.hidden ? 'إظهار' : 'إخفاء', 'aria-label': s.hidden ? 'إظهار القسم' : 'إخفاء القسم', onclick: function (e) { e.stopPropagation(); s.hidden = !s.hidden; renderList(); markDirty(); } }, [icon(s.hidden ? 'eye-off' : 'eye')]);
      var dup = h('button', { class: 'icon-btn', type: 'button', title: 'نسخ القسم', 'aria-label': 'نسخ القسم', onclick: function (e) { e.stopPropagation(); var c = JSON.parse(JSON.stringify(s)); c.id = uid(); sections.splice(i + 1, 0, c); renderList(); markDirty(); } }, [icon('copy')]);
      var del = h('button', { class: 'icon-btn', type: 'button', title: 'حذف القسم', 'aria-label': 'حذف القسم', onclick: function (e) { e.stopPropagation(); if (!confirm('حذف قسم «' + t.label + '»؟')) return; sections.splice(i, 1); renderList(); markDirty(); } }, [icon('trash')]);
      var li = h('li', { class: 'sec-item' + (s.hidden ? ' is-hidden' : ''), 'data-id': s.id, tabindex: '0', onclick: function () { openSection(i, true); }, onkeydown: function (e) { if (e.key === 'Enter') openSection(i, true); } }, [
        h('span', { class: 'grip', title: 'اسحب للترتيب' }, [icon('grip')]),
        h('span', { class: 'sec-ic' }, [icon(t.icon)]),
        h('span', { class: 'sec-txt' }, [h('b', { text: t.label }), h('small', { text: summary(s) })]),
        eye, dup, del,
      ]);
      list.appendChild(li);
    });
    panel.appendChild(h('div', { class: 'bp-head' }, [h('h3', { text: 'أقسام الصفحة (' + sections.length + ')' }), h('button', { class: 'btn btn-teal btn-sm', type: 'button', onclick: function () { openAdd(sections.length); } }, [icon('plus'), ' إضافة قسم'])]));
    var body = h('div', { class: 'bp-body' }, [
      sections.length ? list : h('div', { class: 'empty' }, [icon('layout-template'), h('p', { text: 'الصفحة فارغة — أضف أول قسم.' })]),
      h('p', { class: 'bp-note', text: 'اضغط على أي قسم لتعديله، أو اضغط عليه مباشرة في المعاينة. اسحب من ⋮⋮ لتغيير الترتيب. التعديلات تُحفظ كمسودة تلقائيًا ولا تظهر للزوار حتى تضغط «نشر».' }),
    ]);
    panel.appendChild(body);
    if (window.Sortable) {
      window.Sortable.create(list, { handle: '.grip', animation: 150, onEnd: function (e) {
        if (e.oldIndex === e.newIndex) return;
        var moved = sections.splice(e.oldIndex, 1)[0];
        sections.splice(e.newIndex, 0, moved);
        renderList();
        markDirty();
      } });
    }
    highlight();
  }

  /* ── نموذج القسم ── */
  function openSection(i, scroll) {
    collect();
    current = i;
    var s = sections[i];
    var t = typeOf(s);
    panel.innerHTML = '';
    var hideToggle = h('input', { type: 'checkbox' });
    hideToggle.checked = !s.hidden;
    hideToggle.addEventListener('change', function () { s.hidden = !hideToggle.checked; markDirty(); });
    panel.appendChild(h('div', { class: 'bp-head' }, [
      h('button', { class: 'icon-btn', type: 'button', title: 'كل الأقسام', 'aria-label': 'رجوع لكل الأقسام', onclick: renderList }, [icon('arrow-right')]),
      h('h3', { text: t.label }),
      h('label', { class: 'switch sm', title: 'ظاهر في الصفحة' }, [hideToggle, h('span')]),
    ]));
    var body = h('div', { class: 'bp-body' });
    if (t.note) body.appendChild(h('p', { class: 'bp-note', text: t.note }));
    panel.appendChild(body);
    // ربط حقل الصورة بخانة «صور الموقع» المناسبة
    var fields = (t.fields || []).map(function (f) {
      if (f.type === 'image' && s.data.image_slot && !f.slot) return Object.assign({}, f, { slot: s.data.image_slot });
      if (f.type === 'code' && !B.allowCode) return Object.assign({}, f, { hint: 'تعديل الأكواد متاح لمسؤول التسويق أو الإعدادات فقط.' });
      return f;
    });
    form = A.renderFields(body, fields, s.data, { sources: B.sources, slotImages: B.slotImages, onChange: markDirty });
    var nav = h('div', { class: 'ff-row', style: 'margin-top:8px' }, [
      h('button', { class: 'btn btn-line btn-sm', type: 'button', disabled: i === 0 ? true : null, onclick: function () { move(i, -1); } }, [icon('chevron-up'), ' تحريك لأعلى']),
      h('button', { class: 'btn btn-line btn-sm', type: 'button', disabled: i === sections.length - 1 ? true : null, onclick: function () { move(i, 1); } }, [icon('chevron-down'), ' تحريك لأسفل']),
    ]);
    body.appendChild(nav);
    body.appendChild(h('button', { class: 'btn btn-ghost btn-sm', type: 'button', onclick: function () { openAdd(i + 1); } }, [icon('plus'), ' إضافة قسم بعد هذا']));
    if (scroll) scrollPreviewTo(s.id);
    highlight();
  }
  function move(i, dir) {
    collect();
    var j = i + dir;
    if (j < 0 || j >= sections.length) return;
    var tmp = sections[i]; sections[i] = sections[j]; sections[j] = tmp;
    markDirty();
    openSection(j, false);
    setTimeout(function () { scrollPreviewTo(sections[j].id); }, 1400);
  }

  /* ── إضافة قسم ── */
  var addDlg = $('#add-section');
  var insertAt = 0;
  function openAdd(at) {
    insertAt = at;
    var box = $('#sec-types');
    box.innerHTML = '';
    B.groups.forEach(function (g) {
      var items = Object.keys(B.types).filter(function (k) { return B.types[k].group === g; });
      if (!items.length) return;
      box.appendChild(h('h4', { text: g }));
      items.forEach(function (k) {
        var t = B.types[k];
        box.appendChild(h('button', { class: 'sec-type', type: 'button', onclick: function () { addSection(k); } }, [h('span', { class: 'sec-ic' }, [icon(t.icon)]), h('span', {}, [h('b', { text: t.label }), t.note ? h('small', { class: 'hint', style: 'display:block', text: t.note }) : null])]));
      });
    });
    addDlg.showModal();
  }
  function addSection(type) {
    collect();
    addDlg.close();
    var s = { id: uid(), type: type, hidden: false, data: defaults(type) };
    sections.splice(insertAt, 0, s);
    markDirty();
    openSection(insertAt, false);
    setTimeout(function () { reloadPreview(s.id); }, 1200);
  }

  /* ── النشر والتراجع ── */
  $('[data-bld-publish]').addEventListener('click', function () {
    var btn = this;
    A.busy(btn, true);
    var go = function () {
      return A.api('/admin/pages/' + B.id + '/publish', { body: { sections: collect() } }).then(function () {
        A.busy(btn, false);
        hasDraft = false;
        pending = false;
        discardBtn.hidden = true;
        setStatus('published');
        setSaved('تم النشر — التعديلات ظاهرة للزوار الآن');
        A.toast('تم نشر الصفحة');
      });
    };
    (saving ? new Promise(function (r) { setTimeout(r, 900); }) : Promise.resolve()).then(go).catch(function (e) { A.busy(btn, false); A.toast(e.message, 'error'); });
  });
  function setStatus(st) {
    B.status = st;
    statusEl.textContent = st === 'published' ? 'منشورة' : 'مسودة';
    statusEl.className = 'pill sm ' + (st === 'published' ? 'green' : 'gray');
    if (unpubBtn) unpubBtn.hidden = st !== 'published';
  }
  var unpubBtn = $('[data-bld-unpublish]');
  if (unpubBtn) unpubBtn.addEventListener('click', function () {
    if (!confirm('إلغاء نشر هذه الصفحة؟ ستختفي من الموقع حتى تضغط «نشر» من جديد.')) return;
    A.busy(unpubBtn, true);
    A.api('/admin/pages/' + B.id + '/unpublish', { body: {} }).then(function () {
      A.busy(unpubBtn, false);
      setStatus('draft');
      A.toast('تم إلغاء النشر — الصفحة لم تعد ظاهرة للزوار');
    }).catch(function (e) { A.busy(unpubBtn, false); A.toast(e.message, 'error'); });
  });
  discardBtn.addEventListener('click', function () {
    if (!confirm('التراجع عن كل التعديلات غير المنشورة والعودة للنسخة المنشورة؟')) return;
    A.api('/admin/pages/' + B.id + '/discard', { body: {} }).then(function (j) {
      sections = j.sections || [];
      hasDraft = false; pending = false;
      discardBtn.hidden = true;
      setSaved('تم الرجوع للنسخة المنشورة');
      renderList();
      reloadPreview();
    }).catch(function (e) { A.toast(e.message, 'error'); });
  });

  /* ── الأجهزة ── */
  $$('[data-device]').forEach(function (b) {
    b.addEventListener('click', function () {
      $$('[data-device]').forEach(function (x) { x.classList.toggle('on', x === b); });
      $('.bld-frame').setAttribute('data-frame', b.getAttribute('data-device'));
    });
  });

  /* ── إعدادات الصفحة وSEO ── */
  var psDlg = $('#page-settings');
  var psForm = null;
  function psFields() {
    var sys = B.kind === 'system';
    var list = [
      { name: 'title', label: 'اسم الصفحة (داخل اللوحة وفي مسار التنقل)', type: 'text', required: true },
    ];
    if (!sys) {
      list.push({ name: 'slug', label: 'الرابط', type: 'slug', hint: 'الحروف الإنجليزية الصغيرة والأرقام والشرطة. تغيير الرابط ينشئ تحويل 301 تلقائيًا من القديم.' });
      list.push({ name: 'layout', label: 'شكل الصفحة', type: 'select', options: [['site', 'صفحة عادية (بالقائمة والفوتر)'], ['landing', 'صفحة هبوط (بدون قائمة — للإعلانات)']] });
    }
    list.push(
      { name: 'meta_title', label: 'عنوان جوجل (Title)', type: 'text', counter: 60, max: 190, hint: 'اتركه فارغًا لاستخدام عنوان القسم الأول.' },
      { name: 'meta_description', label: 'وصف جوجل (Description)', type: 'textarea', rows: 3, counter: 160, max: 320 },
      { name: 'og_image', label: 'صورة المشاركة في واتساب وتويتر (1200×630)', type: 'image' },
      { name: 'noindex', label: 'إخفاء الصفحة من محركات البحث (noindex)', type: 'toggle' },
      { name: 'thank_you_mode', label: 'بعد إرسال النموذج في هذه الصفحة', type: 'select', options: [['', 'حسب إعدادات الموقع'], ['redirect', 'تحويل لصفحة الشكر (أفضل لتتبع الإعلانات)'], ['inline', 'رسالة شكر في نفس الصفحة']] },
      { name: 'redirect_url', label: 'تحويل لرابط مخصص بعد الإرسال (اختياري)', type: 'url', hint: 'مثل: /thank-you?src=snap — يتقدّم على الخيار السابق.' }
    );
    if (B.allowCode) {
      list.push(
        { name: 'head_code', label: 'كود خاص بهذه الصفحة داخل <head>', type: 'code', hint: 'مثل بكسل حملة محددة أو كود تحويل خاص.' },
        { name: 'body_code', label: 'كود خاص قبل </body>', type: 'code' }
      );
    }
    return list;
  }
  function serp() {
    if (!psForm) return;
    var v = psForm.get();
    var title = v.meta_title || v.title || '';
    var base = (B.siteUrl || location.origin).replace(/^https?:\/\//, '');
    $('[data-serp-title]').textContent = (title + (B.kind === 'system' && B.systemKey === 'home' ? '' : (B.titleSuffix || ''))).slice(0, 70);
    $('[data-serp-desc]').textContent = (v.meta_description || 'سيُستخدم وصف الصفحة التلقائي…').slice(0, 165);
    $('[data-serp-url]').textContent = base + (B.publicUrl && B.publicUrl !== '/' ? ' › ' + decodeURIComponent(B.publicUrl.slice(1)) : '');
  }
  var serpBox = $('.serp', psDlg);
  $('[data-bld-settings]').addEventListener('click', function () {
    var box = $('#ps-fields');
    box.innerHTML = '';
    psForm = A.renderFields(box, psFields(), B.settings, { slotImages: {}, onChange: serp });
    // معاينة جوجل بجانب حقول العنوان والوصف لتُرى أثناء الكتابة
    var md = $('[data-name="meta_description"]', box);
    if (md && serpBox) md.parentNode.insertBefore(serpBox, md.nextSibling);
    serp();
    psDlg.showModal();
  });
  $('#ps-form').addEventListener('submit', function (e) {
    e.preventDefault();
    var btn = e.submitter || $('button[type=submit]', this);
    var v = psForm.get();
    A.busy(btn, true);
    A.api('/admin/pages/' + B.id + '/settings', { body: v }).then(function (j) {
      A.busy(btn, false);
      Object.assign(B.settings, v, { slug: j.slug });
      previewUrl = j.previewUrl;
      B.publicUrl = j.publicUrl;
      $('[data-bld-title]').textContent = v.title;
      var pl = $('[data-bld-preview-link]'); if (pl) pl.href = previewUrl;
      document.title = v.title + ' — لوحة تحكم إصغاء';
      psDlg.close();
      A.toast('تم حفظ إعدادات الصفحة');
      reloadPreview();
    }).catch(function (er) {
      A.busy(btn, false);
      if (er.data && er.data.field) psForm.error(er.data.field, er.message);
      A.toast(er.message, 'error');
    });
  });

  // إغلاق النوافذ عند الضغط على الخلفية
  [addDlg, psDlg].forEach(function (d) { d.addEventListener('click', function (e) { if (e.target === d) d.close(); }); });

  // حفظ فوري + تنبيه عند المغادرة قبل الحفظ
  document.addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') { e.preventDefault(); saveDraft(); }
    if (e.key === 'Escape' && current !== null && !document.querySelector('dialog[open]')) renderList();
  });
  window.addEventListener('beforeunload', function (e) { if (pending || saving) { e.preventDefault(); e.returnValue = ''; } });

  renderList();
  if (hasDraft) setSaved('توجد تعديلات غير منشورة');
})();
