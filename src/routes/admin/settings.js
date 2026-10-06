// الإعدادات العامة + الإعلانات والتتبع + مركز SEO
import { Router } from 'express';
import db from '../../db.js';
import config from '../../config.js';
import { can, requirePerm } from '../../lib/auth.js';
import { logActivity } from '../../lib/activity.js';
import { getSettings, setSettings } from '../../lib/settings.js';
import { clearContentCache } from '../../lib/content.js';
import { forget } from '../../lib/cache.js';
import { coerceFields } from '../../lib/fields.js';
import { sendMail, brandedEmail, _webhook as sendWebhook } from '../../lib/notify.js';
import { plain } from '../../lib/text.js';
import { SETTINGS_GROUPS } from '../../content/settings-schema.js';
import { IMAGE_SLOTS } from '../../content/image-slots.js';
import { baseUrl } from '../../lib/seo.js';
import { wrap, fail, pagePublicUrl } from './util.js';

const router = Router();
const GROUPS = Object.fromEntries(SETTINGS_GROUPS.map((g) => [g.key, g]));
const SETTINGS_TABS = ['general', 'navigation', 'texts', 'leads', 'smtp', 'privacy'];

function publicValues(group, S) {
  const out = {};
  const secrets = {};
  for (const f of group.fields) {
    if (f.type === 'secret') { secrets[f.name] = Boolean(S[f.name]); out[f.name] = ''; } else out[f.name] = S[f.name] ?? f.default ?? '';
  }
  return { values: out, secrets };
}

function slotImages(S) {
  return Object.fromEntries(IMAGE_SLOTS.map((s) => [s.key, S[`img_${s.key}`] || '']));
}

async function saveGroup(req, res, group) {
  const S = await getSettings();
  const input = req.body?.values || {};
  const allowCode = can(req.user, 'marketing') || can(req.user, 'settings');
  const values = coerceFields(group.fields, input, { allowCode, prev: S });
  // الحقول السرية: تُحدَّث فقط عند إدخال قيمة جديدة أو طلب مسحها
  for (const f of group.fields.filter((x) => x.type === 'secret')) {
    const v = input[f.name];
    if (input[`${f.name}__clear`]) values[f.name] = '';
    else if (typeof v === 'string' && v.trim()) values[f.name] = v.trim().slice(0, 2000);
  }
  if (values.whatsapp) values.whatsapp = String(values.whatsapp).replace(/\D/g, '');
  for (const k of ['gtm_id', 'ga4_id', 'google_ads_id', 'meta_pixel_id', 'tiktok_pixel_id', 'snap_pixel_id', 'x_pixel_id', 'linkedin_partner_id', 'clarity_id']) {
    if (k in values) values[k] = String(values[k]).replace(/[^\w-]/g, '');
  }
  if ('canonical_host' in values && values.canonical_host) {
    const v = values.canonical_host.replace(/\/+$/, '');
    values.canonical_host = /^https?:\/\//.test(v) ? v : `https://${v}`;
  }
  await setSettings(values);
  clearContentCache();
  forget('settings');
  logActivity(req, 'settings', 'settings', group.key, group.title);
  return res.json({ ok: true, message: 'تم حفظ الإعدادات.' });
}

// ─── الإعدادات العامة ───
router.get('/settings', requirePerm('settings'), (req, res) => res.redirect('/admin/settings/general'));

router.get('/settings/:group', requirePerm('settings'), wrap(async (req, res, next) => {
  const group = GROUPS[req.params.group];
  if (!group || !SETTINGS_TABS.includes(group.key)) return next();
  const S = res.locals.S;
  const { values, secrets } = publicValues(group, S);
  res.render('admin/settings.njk', {
    title: 'إعدادات الموقع', active: 'settings', group,
    tabs: SETTINGS_TABS.map((k) => GROUPS[k]),
    boot: { fields: group.fields, values, secrets, slotImages: slotImages(S), action: `/admin/settings/${group.key}` },
  });
}));

router.post('/settings/test-email', requirePerm('settings'), wrap(async (req, res) => {
  const S = await getSettings();
  const to = String(req.body?.to || S.notify_emails || req.user.email).split(',')[0].trim();
  try {
    const r = await sendMail({
      to,
      subject: 'رسالة تجريبية من موقع إصغاء',
      html: brandedEmail({ base: baseUrl(req, S), s: S, title: 'تم إعداد البريد بنجاح ✓', preheader: 'رسالة تجريبية من موقع إصغاء', body: '<p style="margin:0 0 22px;font-size:15px;line-height:2;color:#6d7672">هذه رسالة تجريبية من لوحة تحكم موقع إصغاء. ستصلك إشعارات الطلبات الجديدة من نماذج الموقع على هذا البريد.</p>' }),
    });
    if (r.skipped) return fail(res, 422, 'أكمل بيانات SMTP أولًا (الخادم، المستخدم، كلمة المرور) ثم احفظ.');
    res.json({ ok: true, message: `تم إرسال رسالة تجريبية إلى ${to}` });
  } catch (e) {
    fail(res, 422, `تعذر الإرسال: ${e.message}`);
  }
}));

router.post('/settings/test-webhook', requirePerm('settings'), wrap(async (req, res) => {
  const S = await getSettings();
  if (!S.webhook_url) return fail(res, 422, 'أدخل رابط الـ Webhook واحفظ أولًا.');
  try {
    await sendWebhook(S, { id: 0, test: true, form: 'lead', name: 'تجربة', phone: '966500000000', case_type: 'تجاري وشركات', message: 'طلب تجريبي من لوحة التحكم', created_at: new Date().toISOString() });
    res.json({ ok: true, message: 'تم إرسال طلب تجريبي إلى الـ Webhook بنجاح.' });
  } catch (e) {
    fail(res, 422, `فشل الإرسال: ${e.message}`);
  }
}));

router.post('/settings/:group', requirePerm('settings'), wrap(async (req, res, next) => {
  const group = GROUPS[req.params.group];
  if (!group || !SETTINGS_TABS.includes(group.key)) return next();
  await saveGroup(req, res, group);
}));

// ─── الإعلانات والتتبع ───
router.get('/marketing', requirePerm('marketing'), wrap(async (req, res) => {
  const S = res.locals.S;
  const group = GROUPS.marketing;
  const { values, secrets } = publicValues(group, S);
  const landing = await db('pages').where({ status: 'published' }).select('slug', 'title', 'kind', 'system_key').orderByRaw("FIELD(kind,'landing','system','custom')");
  const integrations = [
    { name: 'Google Tag Manager', on: Boolean(S.gtm_id) },
    { name: 'Google Analytics 4', on: Boolean(S.ga4_id) },
    { name: 'Google Ads', on: Boolean(S.google_ads_id), note: S.google_ads_lead_label ? 'تحويل الطلب مفعّل' : 'أضف Label التحويل' },
    { name: 'Meta Pixel', on: Boolean(S.meta_pixel_id), note: S.meta_capi_token ? 'Conversions API مفعّل' : 'بدون Conversions API' },
    { name: 'TikTok', on: Boolean(S.tiktok_pixel_id) },
    { name: 'Snapchat', on: Boolean(S.snap_pixel_id) },
    { name: 'X (Twitter)', on: Boolean(S.x_pixel_id) },
    { name: 'LinkedIn', on: Boolean(S.linkedin_partner_id) },
    { name: 'Microsoft Clarity', on: Boolean(S.clarity_id) },
  ];
  res.render('admin/marketing.njk', {
    title: 'الإعلانات والتتبع', active: 'marketing', integrations,
    pages: landing.map((p) => ({ title: p.title, url: pagePublicUrl(p), kind: p.kind })).filter((p) => p.url && p.url !== '/thank-you'),
    boot: { fields: group.fields, values, secrets, slotImages: {}, action: '/admin/marketing' },
  });
}));

router.post('/marketing', requirePerm('marketing'), wrap(async (req, res) => saveGroup(req, res, GROUPS.marketing)));

// ─── مركز SEO ───
function audit(title, desc, opts = {}) {
  const issues = [];
  const t = plain(title || '');
  const d = plain(desc || '');
  if (!t) issues.push(['err', 'بدون عنوان']);
  else if (t.length > 65) issues.push(['warn', `العنوان طويل (${t.length})`]);
  else if (t.length < 15) issues.push(['warn', 'العنوان قصير']);
  if (!d) issues.push([opts.descRequired === false ? 'warn' : 'err', 'بدون وصف']);
  else if (d.length > 165) issues.push(['warn', `الوصف طويل (${d.length})`]);
  else if (d.length < 70) issues.push(['warn', 'الوصف قصير']);
  return issues;
}

router.get('/seo', requirePerm('seo'), wrap(async (req, res) => {
  const S = res.locals.S;
  const [pages, cats, services, posts, redirectsN, notFound] = await Promise.all([
    db('pages').select('id', 'kind', 'system_key', 'slug', 'title', 'meta_title', 'meta_description', 'noindex', 'status').whereNot('system_key', 'service_tail').orWhereNull('system_key'),
    db('service_categories').select('id', 'slug', 'title', 'meta_title', 'meta_description', 'intro', 'is_active'),
    db('services as s').join('service_categories as c', 'c.id', 's.category_id').select('s.id', 's.slug', 's.title', 's.meta_title', 's.meta_description', 's.summary', 's.has_page', 'c.slug as cat').where('s.has_page', true),
    db('posts').select('id', 'slug', 'title', 'meta_title', 'meta_description', 'excerpt', 'status', 'noindex'),
    db('redirects').count({ n: '*' }).first(),
    db('events_daily').select('path').sum({ n: 'count' }).where({ type: '404' }).groupBy('path').orderBy('n', 'desc').limit(10),
  ]);
  const rows = [];
  for (const p of pages) {
    if (p.system_key === 'thank-you') continue;
    rows.push({ type: p.kind === 'landing' ? 'صفحة هبوط' : 'صفحة', title: p.title, url: pagePublicUrl(p), edit: `/admin/pages/${p.id}`, noindex: p.noindex || p.kind === 'landing', draft: p.status !== 'published', metaTitle: p.meta_title, metaDesc: p.meta_description, issues: p.system_key === 'home' ? audit(S.seo_default_title, p.meta_description || S.seo_default_description) : audit(p.meta_title || p.title, p.meta_description) });
  }
  for (const c of cats) rows.push({ type: 'قسم خدمات', title: c.title, url: `/services/${c.slug}`, edit: `/admin/r/categories/${c.id}`, draft: !c.is_active, metaTitle: c.meta_title, metaDesc: c.meta_description, issues: audit(c.meta_title || c.title, c.meta_description || c.intro) });
  for (const s of services) rows.push({ type: 'خدمة', title: s.title, url: `/services/${s.cat}/${s.slug}`, edit: `/admin/r/services/${s.id}`, metaTitle: s.meta_title, metaDesc: s.meta_description, issues: audit(s.meta_title || s.title, s.meta_description || s.summary) });
  for (const p of posts) rows.push({ type: 'مقال', title: p.title, url: `/insights/${p.slug}`, edit: `/admin/r/posts/${p.id}`, noindex: p.noindex, draft: p.status !== 'published', metaTitle: p.meta_title, metaDesc: p.meta_description, issues: audit(p.meta_title || p.title, p.meta_description || p.excerpt) });

  const group = GROUPS.seo;
  const { values, secrets } = publicValues(group, S);
  res.render('admin/seo.njk', {
    title: 'محركات البحث SEO', active: 'seo', rows,
    stats: { total: rows.length, ok: rows.filter((r) => !r.issues.length).length, errors: rows.filter((r) => r.issues.some((i) => i[0] === 'err')).length },
    indexing: config.allowIndexing, redirectsN: Number(redirectsN?.n || 0),
    notFound: notFound.map((r) => ({ path: r.path, n: Number(r.n) })),
    boot: { fields: group.fields, values, secrets, slotImages: {}, action: '/admin/seo' },
  });
}));

router.post('/seo', requirePerm('seo'), wrap(async (req, res) => saveGroup(req, res, GROUPS.seo)));

export default router;
