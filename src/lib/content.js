// استعلامات المحتوى المشتركة بين الموقع ولوحة التحكم (مع ذاكرة مؤقتة)
import db, { parseJSON } from '../db.js';
import { remember, forget } from './cache.js';
import { lines } from './text.js';

export const FAQ_GROUPS = [
  ['general', 'عامة'],
  ['consultation', 'الاستشارة والتقييم'],
  ['packages', 'الباقات'],
  ['services', 'الخدمات'],
];

export function clearContentCache() {
  forget('c:');
}

export async function getCategories() {
  return remember('c:categories', async () => {
    const cats = await db('service_categories').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]);
    const services = await db('services').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]);
    return cats.map((c) => ({
      ...c,
      bullets: lines(c.bullets),
      url: `/services/${c.slug}`,
      services: services
        .filter((s) => s.category_id === c.id)
        .map((s) => ({ ...s, bullets: lines(s.bullets), url: s.has_page ? `/services/${c.slug}/${s.slug}` : null })),
    }));
  });
}

export async function getCategory(slug) {
  const cats = await getCategories();
  return cats.find((c) => c.slug === slug) || null;
}

export async function getPracticeAreas() {
  return remember('c:areas', () => db('practice_areas').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]));
}

export async function getPackages() {
  return remember('c:packages', async () => {
    const rows = await db('packages').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]);
    return rows.map((p) => ({
      ...p,
      highlights: lines(p.highlights),
      core_features: lines(p.core_features),
      extra_features: lines(p.extra_features),
      compare: parseJSON(p.compare, {}),
    }));
  });
}

export async function getBeneficiaries() {
  return remember('c:beneficiaries', async () => {
    const rows = await db('beneficiaries').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]);
    return rows.map((b) => ({ ...b, items: lines(b.items) }));
  });
}

export async function getFaqs(group) {
  return remember(`c:faqs:${group || 'all'}`, () => {
    const q = db('faqs').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]);
    if (group) q.andWhere({ group_key: group });
    return q;
  });
}

export async function getTestimonials() {
  return remember('c:testimonials', () => db('testimonials').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]));
}

export async function getTeam() {
  return remember('c:team', () => db('team_members').where({ is_active: true }).orderBy([{ column: 'sort' }, { column: 'id' }]));
}

export async function getLatestPosts(limit = 3) {
  return remember(`c:posts:latest:${limit}`, () =>
    db('posts as p')
      .leftJoin('post_categories as c', 'c.id', 'p.category_id')
      .select('p.*', 'c.name as category_name', 'c.slug as category_slug')
      .where('p.status', 'published')
      .andWhere('p.published_at', '<=', new Date())
      .orderBy('p.published_at', 'desc')
      .limit(limit),
  );
}

export async function getPageBySlug(slug) {
  return remember(`c:page:${slug}`, () => db('pages').where({ slug }).first());
}

export async function getSystemPage(key) {
  return remember(`c:sys:${key}`, () => db('pages').where({ system_key: key }).first());
}

export async function getPackageCompareRows() {
  return remember('c:compare-rows', async () => {
    const row = await db('settings').where({ key: 'package_compare_rows' }).first();
    return parseJSON(row?.value, DEFAULT_COMPARE_ROWS);
  });
}

export const DEFAULT_COMPARE_ROWS = [
  { key: 'max_claim', label: 'قيمة المطالبة القصوى', field: 'max_claim' },
  { key: 'training_hours', label: 'ساعات التدريب السنوية', field: 'training_hours' },
  { key: 'case_management', label: 'إدارة القضايا' },
  { key: 'workshops', label: 'ورش العمل المتخصصة' },
  { key: 'pause_switch', label: 'إمكانية الإيقاف/الاستبدال' },
];
