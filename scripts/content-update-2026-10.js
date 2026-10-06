// تحديث محتوى لمرة واحدة حسب ملاحظات العميل (أكتوبر 2026) — آمن للتكرار
//   node scripts/content-update-2026-10.js
// - إلغاء الباقات: إزالتها من القائمة والفوتر، إخفاء قسمها، تحويل /packages إلى /services، الصفحة مسودة
// - اختصار الرئيسية: إخفاء أقسام مكررة (يمكن إظهارها من المنشئ)
// - نص الترخيص: «مرخّصة من الهيئة السعودية للمحامين»
import db from '../src/db.js';

const LICENSE = 'مرخّصة من الهيئة السعودية للمحامين';
const OLD_LICENSE = /مرخ[ّ]?صة من وزارة العدل|ترخيص وزارة العدل/g;
const HIDE_ON_HOME = new Set(['features', 'specializations', 'packages', 'steps', 'posts_latest']);

const parse = (v, d) => { try { return JSON.parse(v); } catch { return d; } };
const log = [];

try {
  // الإعدادات
  const nav = await db('settings').where({ key: 'nav_items' }).first();
  if (nav) {
    const items = parse(nav.value, []);
    const next = items.filter((x) => x.url !== '/packages');
    if (next.length !== items.length) { await db('settings').where({ key: 'nav_items' }).update({ value: JSON.stringify(next) }); log.push('nav: removed packages'); }
  }
  const fl = await db('settings').where({ key: 'footer_services_links' }).first();
  if (fl) {
    const lines = parse(fl.value, []);
    const next = lines.filter((l) => !String(l).includes('/packages'));
    if (next.length !== lines.length) { await db('settings').where({ key: 'footer_services_links' }).update({ value: JSON.stringify(next) }); log.push('footer: removed packages'); }
  }
  const lic = await db('settings').where({ key: 'license_note' }).first();
  if (lic && OLD_LICENSE.test(lic.value)) { await db('settings').where({ key: 'license_note' }).update({ value: LICENSE }); log.push('license_note updated'); }

  // الصفحات
  const pages = await db('pages').select('id', 'slug', 'system_key', 'status', 'sections', 'draft_sections');
  for (const p of pages) {
    const upd = {};
    for (const col of ['sections', 'draft_sections']) {
      if (!p[col]) continue;
      let txt = p[col].replace(OLD_LICENSE, LICENSE);
      if (p.system_key === 'home') {
        const secs = parse(txt, null);
        if (Array.isArray(secs)) {
          for (const s of secs) if (HIDE_ON_HOME.has(s.type)) s.hidden = true;
          txt = JSON.stringify(secs);
        }
      }
      if (txt !== p[col]) upd[col] = txt;
    }
    if (p.system_key === 'packages' && p.status !== 'draft') upd.status = 'draft';
    if (Object.keys(upd).length) {
      await db('pages').where({ id: p.id }).update({ ...upd, updated_at: new Date() });
      log.push(`page ${p.slug || '/'}: ${Object.keys(upd).join(', ')}`);
    }
  }

  // الوصف (SEO) بدون ذكر الباقات
  const home = await db('pages').where({ system_key: 'home' }).first('id', 'meta_description');
  if (home?.meta_description?.includes('وباقات قانونية للشركات')) {
    await db('pages').where({ id: home.id }).update({ meta_description: home.meta_description.replace('، وباقات قانونية للشركات.', '.') });
    log.push('home meta_description updated');
  }
  const sd = await db('settings').where({ key: 'seo_default_description' }).first();
  if (sd?.value?.includes('وباقات قانونية للشركات')) {
    await db('settings').where({ key: 'seo_default_description' }).update({ value: sd.value.replace('وباقات قانونية للشركات', 'وخدمات قانونية متخصصة للشركات') });
    log.push('seo_default_description updated');
  }

  // تحويل الباقات
  const r = await db('redirects').where({ from_path: '/packages' }).first();
  if (!r) { await db('redirects').insert({ from_path: '/packages', to_url: '/services', code: 301, is_active: true, hits: 0 }); log.push('redirect /packages → /services'); }
  else if (r.to_url !== '/services' || !r.is_active) { await db('redirects').where({ id: r.id }).update({ to_url: '/services', is_active: true }); log.push('redirect updated'); }

  console.log(log.length ? log.join('\n') : 'nothing to change');
} catch (e) {
  console.error('failed:', e.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
