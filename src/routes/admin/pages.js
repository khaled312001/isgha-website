// الصفحات وصفحات الهبوط: قائمة، إنشاء من قالب، منشئ الأقسام، مسودة ونشر، إعدادات SEO
import { Router } from 'express';
import db from '../../db.js';
import { can } from '../../lib/auth.js';
import { logActivity } from '../../lib/activity.js';
import { clearContentCache } from '../../lib/content.js';
import { forget } from '../../lib/cache.js';
import { slugify } from '../../lib/text.js';
import { coerceFields, coerceField } from '../../lib/fields.js';
import { SECTION_TYPES, SECTION_GROUPS, normalizeSections, newSection } from '../../content/sections.js';
import { PAGE_TEMPLATES } from '../../content/templates.js';
import { IMAGE_SLOTS } from '../../content/image-slots.js';
import { RESERVED } from '../public.js';
import { wrap, flash, fail, wantsJson, loadSources, pagePublicUrl, pagePreviewUrl, canPage, pagePerm } from './util.js';

const router = Router();

const SYSTEM_LABELS = {
  home: 'الرئيسية', about: 'من نحن', services: 'خدماتنا', packages: 'الباقات', beneficiaries: 'المستفيدون', contact: 'اتصل بنا',
  consultation: 'احجز استشارة', privacy: 'سياسة الخصوصية', terms: 'شروط الاستخدام', 'thank-you': 'صفحة الشكر', insights: 'المعرفة القانونية', service_tail: 'أسفل صفحات الخدمات',
};

function allowCode(user) {
  return can(user, 'marketing') || can(user, 'settings');
}

function parse(v, fb) {
  if (v && typeof v === 'object') return v;
  try { return JSON.parse(v) || fb; } catch { return fb; }
}

async function getPage(id) {
  return db('pages').where({ id: Number(id) }).first();
}

function guard(req, res, page) {
  if (!page) { res.status(404).render('admin/404.njk', { title: 'غير موجود' }); return false; }
  if (!canPage(req.user, page)) { res.status(403).render('admin/403.njk', { title: 'غير مصرّح' }); return false; }
  return true;
}

async function uniqueSlug(base, exceptId = null) {
  let slug = base || 'page';
  let i = 1;
  // eslint-disable-next-line no-await-in-loop
  while (RESERVED.has(slug) || await db('pages').where({ slug }).modify((q) => { if (exceptId) q.whereNot('id', exceptId); }).first('id')) {
    i += 1;
    slug = `${base}-${i}`;
  }
  return slug;
}

function cleanSections(list, prevSections, user) {
  const prevById = Object.fromEntries((prevSections || []).map((s) => [s.id, s.data]));
  return normalizeSections(Array.isArray(list) ? list.slice(0, 60) : []).map((s) => {
    const def = SECTION_TYPES[s.type];
    const data = coerceFields(def.fields, s.data, { allowCode: allowCode(user), prev: prevById[s.id] || {} });
    // حقول إضافية مسموحة غير ظاهرة في النموذج
    if (s.data.image_slot && IMAGE_SLOTS.some((x) => x.key === s.data.image_slot)) data.image_slot = s.data.image_slot;
    return { id: String(s.id).replace(/[^\w-]/g, '').slice(0, 20) || Math.random().toString(36).slice(2, 10), type: s.type, hidden: Boolean(s.hidden), data };
  });
}

// الصفحات الأساسية التي يجب أن تبقى منشورة دائمًا
const ALWAYS_PUBLISHED = ['home', 'thank-you', 'service_tail'];
const canUnpublish = (page) => !(page.kind === 'system' && ALWAYS_PUBLISHED.includes(page.system_key));

function afterChange(page) {
  clearContentCache();
  forget('c:page');
  if (page?.slug) forget(`c:page:${page.slug}`);
}

// ─── القائمة ───
router.get('/', wrap(async (req, res) => {
  const kind = req.query.kind === 'landing' ? 'landing' : 'site';
  const perm = kind === 'landing' ? 'landing' : 'pages';
  if (!can(req.user, perm)) return res.status(403).render('admin/403.njk', { title: 'غير مصرّح' });
  const q = db('pages').select('id', 'kind', 'system_key', 'slug', 'title', 'layout', 'status', 'noindex', 'views', 'leads', 'updated_at', 'draft_sections');
  if (kind === 'landing') q.where({ kind: 'landing' });
  else q.whereIn('kind', ['system', 'custom']);
  const rows = await q.orderByRaw("FIELD(kind,'system','custom','landing')").orderBy('id');
  const pages = rows.map((p) => ({
    ...p, hasDraft: Boolean(p.draft_sections), draft_sections: undefined,
    url: pagePublicUrl(p), sysLabel: SYSTEM_LABELS[p.system_key], canUnpublish: canUnpublish(p),
    conv: p.views ? ((p.leads / p.views) * 100).toFixed(1) : '0',
  }));
  res.render('admin/pages/index.njk', {
    title: kind === 'landing' ? 'صفحات الهبوط' : 'صفحات الموقع', active: kind === 'landing' ? 'landing' : 'pages', kind, pages,
    templates: Object.entries(PAGE_TEMPLATES).filter(([, t]) => (kind === 'landing' ? t.kind === 'landing' : t.kind !== 'landing')).map(([k, t]) => ({ key: k, ...t, build: undefined })),
  });
}));

// ─── إنشاء ───
router.post('/', wrap(async (req, res) => {
  const tplKey = String((req.body.template === 'copy' ? req.body.copy_from : req.body.template) || 'blank');
  let sections;
  let kind;
  let layout;
  let settings = {};
  let source = null;
  if (tplKey.startsWith('copy:')) {
    source = await getPage(tplKey.slice(5));
    if (!source || !canPage(req.user, source)) return res.redirect('/admin/pages');
    sections = parse(source.draft_sections || source.sections, []).map((s) => ({ ...s, id: Math.random().toString(36).slice(2, 10) }));
    kind = source.kind === 'system' ? 'custom' : source.kind;
    layout = source.layout;
    settings = parse(source.settings, {});
  } else {
    const tpl = PAGE_TEMPLATES[tplKey] || PAGE_TEMPLATES.blank;
    kind = tpl.kind;
    layout = tpl.layout;
    sections = tpl.build(String(req.body.title || '').trim());
  }
  if (!can(req.user, kind === 'landing' ? 'landing' : 'pages')) return res.status(403).render('admin/403.njk', { title: 'غير مصرّح' });
  const title = String(req.body.title || '').trim().slice(0, 190) || (source ? `${source.title} (نسخة)` : 'صفحة جديدة');
  const slug = await uniqueSlug(slugify(req.body.slug || title) || 'page');
  const [id] = await db('pages').insert({
    kind, slug, title, layout, status: 'draft', sections: JSON.stringify(sections), settings: JSON.stringify(settings),
    noindex: kind === 'landing', created_by: req.user.id, updated_by: req.user.id,
    meta_title: source?.meta_title || null, meta_description: source?.meta_description || null,
  });
  logActivity(req, 'create', 'page', id, title);
  flash(req, 'success', 'تم إنشاء الصفحة كمسودة. عدّل الأقسام ثم اضغط «نشر».');
  res.redirect(`/admin/pages/${id}`);
}));

// ─── المنشئ ───
router.get('/:id', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  if (!guard(req, res, page)) return;
  const sources = await loadSources();
  const sections = normalizeSections(parse(page.draft_sections || page.sections, []));
  const types = Object.fromEntries(Object.entries(SECTION_TYPES).map(([k, t]) => [k, { label: t.label, group: t.group, icon: t.icon, note: t.note || '', fields: t.fields }]));
  const S = res.locals.S;
  const slotImages = Object.fromEntries(IMAGE_SLOTS.map((s) => [s.key, S[`img_${s.key}`] || '']));
  res.render('admin/pages/builder.njk', {
    title: page.title, active: page.kind === 'landing' ? 'landing' : 'pages', bodyClass: 'is-builder',
    page: { ...page, settings: parse(page.settings, {}), sections: undefined, draft_sections: undefined, hasDraft: Boolean(page.draft_sections) },
    boot: {
      id: page.id, kind: page.kind, systemKey: page.system_key, status: page.status, hasDraft: Boolean(page.draft_sections), canUnpublish: canUnpublish(page),
      sections, types, groups: SECTION_GROUPS, sources, slotImages,
      slots: IMAGE_SLOTS.map((s) => ({ key: s.key, label: s.label })),
      previewUrl: pagePreviewUrl(page), publicUrl: pagePublicUrl(page),
      allowCode: allowCode(req.user),
      settings: {
        title: page.title, slug: page.slug, status: page.status, layout: page.layout, meta_title: page.meta_title || '', meta_description: page.meta_description || '',
        og_image: page.og_image || '', noindex: Boolean(page.noindex), ...{ thank_you_mode: '', redirect_url: '', head_code: '', body_code: '' }, ...parse(page.settings, {}),
      },
      siteName: S.site_name, titleSuffix: S.seo_title_suffix, siteUrl: res.locals.S.canonical_host || '',
    },
    sysLabel: SYSTEM_LABELS[page.system_key],
  });
}));

// حفظ المسودة (تلقائي من المنشئ)
router.post('/:id/draft', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  if (!page) return fail(res, 404, 'الصفحة غير موجودة.');
  if (!canPage(req.user, page)) return fail(res, 403, 'ليس لديك صلاحية.');
  const prev = normalizeSections(parse(page.draft_sections || page.sections, []));
  const sections = cleanSections(req.body?.sections, prev, req.user);
  await db('pages').where({ id: page.id }).update({ draft_sections: JSON.stringify(sections), updated_at: new Date(), updated_by: req.user.id });
  afterChange(page);
  res.json({ ok: true, savedAt: new Date().toISOString(), count: sections.length });
}));

router.post('/:id/publish', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  if (!page) return fail(res, 404, 'الصفحة غير موجودة.');
  if (!canPage(req.user, page)) return fail(res, 403, 'ليس لديك صلاحية.');
  let sections = parse(page.draft_sections || page.sections, []);
  if (Array.isArray(req.body?.sections)) sections = cleanSections(req.body.sections, normalizeSections(sections), req.user);
  await db('pages').where({ id: page.id }).update({
    sections: JSON.stringify(sections), draft_sections: null, status: 'published', published_at: page.published_at || new Date(), updated_at: new Date(), updated_by: req.user.id,
  });
  afterChange(page);
  logActivity(req, 'publish', 'page', page.id, page.title);
  res.json({ ok: true, url: pagePublicUrl(page) });
}));

router.post('/:id/discard', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  if (!page || !canPage(req.user, page)) return fail(res, 403, 'ليس لديك صلاحية.');
  await db('pages').where({ id: page.id }).update({ draft_sections: null, updated_at: new Date() });
  afterChange(page);
  res.json({ ok: true, sections: normalizeSections(parse(page.sections, [])) });
}));

router.post('/:id/unpublish', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  const back = page?.kind === 'landing' ? '/admin/pages?kind=landing' : '/admin/pages';
  const refuse = (status, msg) => {
    if (wantsJson(req)) return fail(res, status, msg);
    flash(req, 'error', msg);
    return res.redirect(back);
  };
  if (!page || !canPage(req.user, page)) return refuse(403, 'ليس لديك صلاحية.');
  if (!canUnpublish(page)) return refuse(422, 'لا يمكن إيقاف نشر هذه الصفحة الأساسية.');
  await db('pages').where({ id: page.id }).update({ status: 'draft', updated_at: new Date() });
  afterChange(page);
  logActivity(req, 'unpublish', 'page', page.id, page.title);
  if (wantsJson(req)) return res.json({ ok: true });
  flash(req, 'success', `تم إلغاء نشر «${page.title}» — لم تعد ظاهرة للزوار.`);
  res.redirect(back);
}));

// إعدادات الصفحة (العنوان، الرابط، SEO، أكواد التتبع الخاصة)
router.post('/:id/settings', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  if (!page) return fail(res, 404, 'الصفحة غير موجودة.');
  if (!canPage(req.user, page)) return fail(res, 403, 'ليس لديك صلاحية.');
  const b = req.body || {};
  const title = String(b.title || '').trim().slice(0, 190);
  if (!title) return fail(res, 422, 'العنوان مطلوب.', { field: 'title' });
  const patch = {
    title,
    meta_title: String(b.meta_title || '').trim().slice(0, 190) || null,
    meta_description: String(b.meta_description || '').trim().slice(0, 320) || null,
    og_image: coerceField({ type: 'image' }, b.og_image) || null,
    noindex: Boolean(b.noindex),
    updated_at: new Date(),
    updated_by: req.user.id,
  };
  if (page.kind !== 'system') {
    patch.layout = b.layout === 'landing' ? 'landing' : 'site';
    const wanted = slugify(b.slug || '');
    if (!wanted) return fail(res, 422, 'الرابط مطلوب.', { field: 'slug' });
    if (RESERVED.has(wanted)) return fail(res, 422, 'هذا الرابط محجوز للنظام، اختر رابطًا آخر.', { field: 'slug' });
    if (wanted !== page.slug) {
      if (await db('pages').where({ slug: wanted }).whereNot('id', page.id).first('id')) return fail(res, 422, 'الرابط مستخدم في صفحة أخرى.', { field: 'slug' });
      patch.slug = wanted;
      // تحويل تلقائي من الرابط القديم حتى لا تضيع الزيارات والأرشفة
      if (page.status === 'published') {
        await db('redirects').insert({ from_path: `/${page.slug}`, to_url: `/${wanted}`, code: 301 }).onConflict('from_path').merge({ to_url: `/${wanted}`, is_active: true, updated_at: new Date() });
        await db('redirects').where({ from_path: `/${wanted}` }).del();
        forget('redirects');
      }
    }
  }
  const prevSettings = parse(page.settings, {});
  const mode = ['', 'inline', 'redirect'].includes(b.thank_you_mode) ? b.thank_you_mode : '';
  const settings = {
    ...prevSettings,
    thank_you_mode: mode,
    redirect_url: coerceField({ type: 'url' }, b.redirect_url),
  };
  if (allowCode(req.user)) {
    settings.head_code = String(b.head_code || '').slice(0, 50000);
    settings.body_code = String(b.body_code || '').slice(0, 50000);
  }
  patch.settings = JSON.stringify(settings);
  await db('pages').where({ id: page.id }).update(patch);
  afterChange(page);
  afterChange({ slug: patch.slug });
  logActivity(req, 'update', 'page', page.id, `إعدادات: ${title}`);
  const fresh = await getPage(page.id);
  res.json({ ok: true, slug: fresh.slug, previewUrl: pagePreviewUrl(fresh), publicUrl: pagePublicUrl(fresh) });
}));

router.post('/:id/duplicate', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  if (!guard(req, res, page)) return;
  const slug = await uniqueSlug(`${page.slug.replace(/^_/, '')}-copy`);
  const sections = parse(page.draft_sections || page.sections, []).map((s) => ({ ...s, id: Math.random().toString(36).slice(2, 10) }));
  const [id] = await db('pages').insert({
    kind: page.kind === 'system' ? 'custom' : page.kind, slug, title: `${page.title} (نسخة)`, layout: page.layout, status: 'draft',
    sections: JSON.stringify(sections), settings: page.settings, meta_title: page.meta_title, meta_description: page.meta_description,
    noindex: page.kind === 'landing' ? true : page.noindex, created_by: req.user.id,
  });
  logActivity(req, 'create', 'page', id, `نسخة من ${page.title}`);
  flash(req, 'success', 'تم إنشاء نسخة من الصفحة (مسودة).');
  res.redirect(`/admin/pages/${id}`);
}));

router.post('/:id/delete', wrap(async (req, res) => {
  const page = await getPage(req.params.id);
  if (!guard(req, res, page)) return;
  if (page.kind === 'system') {
    flash(req, 'error', 'الصفحات الأساسية لا يمكن حذفها، يمكنك تعديلها أو إخفاء أقسامها.');
    return res.redirect('/admin/pages');
  }
  await db('pages').where({ id: page.id }).del();
  afterChange(page);
  logActivity(req, 'delete', 'page', page.id, page.title);
  flash(req, 'success', 'تم حذف الصفحة.');
  res.redirect(page.kind === 'landing' ? '/admin/pages?kind=landing' : '/admin/pages');
}));

// قسم جديد بقيمه الافتراضية (للمنشئ)
router.get('/section/:type', (req, res) => {
  if (!SECTION_TYPES[req.params.type]) return fail(res, 404, 'نوع غير معروف.');
  res.json({ ok: true, section: newSection(req.params.type) });
});

export { pagePerm };
export default router;
