// تعبئة قاعدة البيانات بالمحتوى الأولي — تعمل مرة واحدة فقط (أو عند طلبها صراحة)
import db, { toJSON } from '../src/db.js';
import { hashPassword, checkPasswordStrength } from '../src/lib/auth.js';
import { DEFAULT_COMPARE_ROWS } from '../src/lib/content.js';
import { buildPages } from './seed-pages.js';
import { POST_COVERS } from '../src/content/image-slots.js';
import {
  CATEGORIES, PRACTICE_AREAS, PACKAGES, BENEFICIARIES, FAQS, TESTIMONIALS, POST_CATEGORIES, POSTS, REDIRECTS,
} from './seed-content.js';

const MARKER = 'seeded_at';
const join = (arr) => (arr || []).join('\n');

async function isEmpty(table) {
  const row = await db(table).first();
  return !row;
}

async function seedSettings(trx) {
  await trx('settings')
    .insert([{ key: 'package_compare_rows', value: JSON.stringify(DEFAULT_COMPARE_ROWS) }])
    .onConflict('key').ignore();
}

async function seedServices(trx) {
  if (await trx('service_categories').first()) return;
  let sort = 0;
  for (const c of CATEGORIES) {
    sort += 10;
    const [catId] = await trx('service_categories').insert({
      slug: c.slug, title: c.title, nav_title: c.nav_title, icon: c.icon, tagline: c.tagline, summary: c.summary,
      intro: c.intro, body: c.body || null, bullets: join(c.bullets), sort, is_active: true,
      meta_title: c.meta_title, meta_description: c.meta_description,
    });
    let s = 0;
    for (const svc of c.services) {
      s += 10;
      await trx('services').insert({
        category_id: catId, slug: svc.slug, title: svc.title, icon: svc.icon, summary: svc.summary, body: svc.body,
        bullets_title: svc.bullets_title, bullets: join(svc.bullets), has_page: svc.has_page ?? true, sort: s, is_active: true,
      });
    }
  }
}

async function seedSimple(trx) {
  if (!(await trx('practice_areas').first())) {
    await trx('practice_areas').insert(PRACTICE_AREAS.map(([title, description, icon], i) => ({ title, description, icon, sort: (i + 1) * 10 })));
  }
  if (!(await trx('packages').first())) {
    await trx('packages').insert(PACKAGES.map((p, i) => ({
      slug: p.slug, name: p.name, tagline: p.tagline, icon: p.icon, badge: p.badge || null, is_featured: !!p.is_featured,
      max_claim: p.max_claim, training_hours: p.training_hours, highlights: join(p.highlights), core_features: join(p.core_features),
      extra_title: p.extra_title, extra_features: join(p.extra_features), compare: toJSON(p.compare), cta_text: `اطلب ${p.name}`,
      sort: (i + 1) * 10,
    })));
  }
  if (!(await trx('beneficiaries').first())) {
    await trx('beneficiaries').insert(BENEFICIARIES.map((b, i) => ({ slug: b.slug, title: b.title, summary: b.summary, icon: b.icon, items: join(b.items), sort: (i + 1) * 10 })));
  }
  if (!(await trx('faqs').first())) {
    await trx('faqs').insert(FAQS.map(([group_key, question, answer], i) => ({ group_key, question, answer, sort: (i + 1) * 10 })));
  }
  if (!(await trx('testimonials').first())) {
    // نماذج غير منشورة: لا تُعرض حتى يستبدلها العميل بآراء حقيقية ويفعّلها
    await trx('testimonials').insert(TESTIMONIALS.map(([name, context, quote], i) => ({ name, context, quote, rating: 5, sort: (i + 1) * 10, is_active: false })));
  }
  if (!(await trx('post_categories').first())) {
    await trx('post_categories').insert(POST_CATEGORIES.map(([slug, name, description], i) => ({ slug, name, description, sort: (i + 1) * 10 })));
  }
  if (!(await trx('posts').first())) {
    const cats = await trx('post_categories').select('id', 'slug');
    const bySlug = Object.fromEntries(cats.map((c) => [c.slug, c.id]));
    // مسودات — تحتاج مراجعة الفريق القانوني قبل النشر
    await trx('posts').insert(POSTS.map((p) => ({
      slug: p.slug, title: p.title, excerpt: p.excerpt, body: p.body, category_id: bySlug[p.category] || null,
      cover: POST_COVERS[p.category] || null, author_name: 'فريق إصغاء القانوني', status: 'draft',
    })));
  }
  if (!(await trx('redirects').first())) {
    await trx('redirects').insert(REDIRECTS.map(([from_path, to_url]) => ({ from_path, to_url, code: 301 })));
  }
}

async function seedPages(trx) {
  const existing = new Set((await trx('pages').select('slug')).map((p) => p.slug));
  for (const p of buildPages()) {
    if (existing.has(p.slug)) continue;
    await trx('pages').insert({
      kind: p.kind, system_key: p.system_key || null, slug: p.slug, title: p.title, layout: p.layout || 'site',
      status: p.status || 'published', sections: JSON.stringify(p.sections), settings: JSON.stringify(p.settings || {}),
      meta_title: p.meta_title || null, meta_description: p.meta_description || null, noindex: !!p.noindex,
    });
  }
}

// إنشاء حساب المالك من متغيرات البيئة (أول تشغيل فقط)
async function seedOwner() {
  if (!(await isEmpty('users'))) return;
  const email = (process.env.ADMIN_EMAIL || '').trim().toLowerCase();
  const password = process.env.ADMIN_PASSWORD || '';
  const weak = password ? checkPasswordStrength(password) : 'missing';
  if (!email || weak) {
    if (email && password) console.warn(`[seed] ADMIN_PASSWORD ضعيفة: ${weak}`);
    console.warn('[seed] لا يوجد مستخدمون. أنشئ حساب المالك: npm run create-admin -- --email you@example.com --name "الاسم"');
    return;
  }
  await db('users').insert({ name: process.env.ADMIN_NAME || 'مدير الموقع', email, password_hash: await hashPassword(password), role: 'owner', is_active: true });
  console.log(`[seed] تم إنشاء حساب المالك: ${email}`);
}

export async function seedAll({ force = false } = {}) {
  const done = await db('settings').where({ key: MARKER }).first();
  if (done && !force) return false;
  await db.transaction(async (trx) => {
    await seedSettings(trx);
    await seedServices(trx);
    await seedSimple(trx);
    await seedPages(trx);
    await trx('settings').insert({ key: MARKER, value: new Date().toISOString() }).onConflict('key').merge();
  });
  return true;
}

// تُستدعى عند تشغيل الخادم: تعبئة المحتوى الأولي إن لم يكن موجودًا + حساب المالك
export async function ensureSeeded() {
  const seeded = await seedAll();
  if (seeded) console.log('[seed] تمت تعبئة المحتوى الأولي');
  await seedOwner();
}
