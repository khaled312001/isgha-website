// أدوات مشتركة لمسارات لوحة التحكم
import db from '../../db.js';
import { FAQ_GROUPS } from '../../lib/content.js';
import { can } from '../../lib/auth.js';

export const wantsJson = (req) => req.xhr || req.is('application/json') || (req.get('accept') || '').includes('application/json');

export function flash(req, type, text) {
  req.session.flash = { type, text };
}

export function wrap(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

export function fail(res, status, error, extra = {}) {
  return res.status(status).json({ ok: false, error, ...extra });
}

export async function paginate(query, page, per = 30) {
  const p = Math.max(1, parseInt(page, 10) || 1);
  const [{ total }] = await query.clone().clearSelect().clearOrder().count({ total: '*' });
  const rows = await query.clone().limit(per).offset((p - 1) * per);
  const pages = Math.max(1, Math.ceil(Number(total) / per));
  return { rows, total: Number(total), page: p, pages, per };
}

// قيم القوائم المنسدلة المرتبطة بالبيانات
export async function loadSources() {
  const [categories, postCats] = await Promise.all([
    db('service_categories').select('id', 'slug', 'title').orderBy('sort'),
    db('post_categories').select('id', 'name').orderBy('sort'),
  ]);
  return {
    categories: categories.map((c) => [String(c.id), c.title, c.slug]),
    category_slugs: categories.map((c) => [c.slug, c.title]),
    post_categories: postCats.map((c) => [String(c.id), c.name]),
    faq_groups: FAQ_GROUPS,
  };
}

export function pagePublicUrl(page) {
  if (!page) return '/';
  if (page.system_key === 'home') return '/';
  if (page.system_key === 'services') return '/services';
  if (page.system_key === 'insights') return '/insights';
  if (page.system_key === 'thank-you') return '/thank-you';
  if (page.system_key === 'service_tail') return null;
  return `/${encodeURIComponent(page.slug)}`;
}

export function pagePreviewUrl(page) {
  if (page.system_key === 'home') return '/?preview=1';
  if (page.system_key === 'services') return '/services?preview=1';
  return `/${encodeURIComponent(page.slug)}?preview=1`;
}

export function pagePerm(page) {
  return page?.kind === 'landing' ? 'landing' : 'pages';
}

export function canPage(user, page) {
  return can(user, pagePerm(page));
}

export function csvCell(v) {
  const s = v == null ? '' : v instanceof Date ? v.toISOString() : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

export const LEAD_STATUSES = [
  ['new', 'جديد', 'blue'],
  ['contacted', 'تم التواصل', 'amber'],
  ['qualified', 'مؤهّل', 'teal'],
  ['won', 'تم التعاقد', 'green'],
  ['lost', 'لم يتم', 'gray'],
  ['spam', 'غير جاد / مزعج', 'red'],
];
export const LEAD_STATUS_MAP = Object.fromEntries(LEAD_STATUSES.map(([k, l, c]) => [k, { label: l, color: c }]));

export const FORM_LABELS = { lead: 'نموذج تقييم', contact: 'نموذج تواصل', consultation: 'طلب استشارة', landing: 'صفحة هبوط' };

// مصدر الطلب بشكل مقروء
export function leadSource(l) {
  const ads = { google: 'إعلانات جوجل', meta: 'إعلانات ميتا', tiktok: 'إعلانات تيك توك', snap: 'إعلانات سناب', microsoft: 'إعلانات Bing', x: 'إعلانات X', linkedin: 'إعلانات لينكدإن' };
  if (l.click_type && ads[l.click_type]) return ads[l.click_type];
  if (l.utm_source) return l.utm_source + (l.utm_medium ? ` / ${l.utm_medium}` : '');
  if (l.referrer) {
    try {
      const h = new URL(l.referrer).hostname.replace(/^www\./, '');
      if (/google\./.test(h)) return 'بحث جوجل';
      if (/bing\.com/.test(h)) return 'بحث Bing';
      return h;
    } catch { /* تجاهل */ }
  }
  return 'مباشر';
}
