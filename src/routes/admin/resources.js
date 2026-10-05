// إدارة المحتوى الموحّدة: الخدمات، الباقات، الأسئلة، المقالات، التحويلات...
import { Router } from 'express';
import db from '../../db.js';
import { can } from '../../lib/auth.js';
import { logActivity } from '../../lib/activity.js';
import { clearContentCache } from '../../lib/content.js';
import { forget } from '../../lib/cache.js';
import { slugify, plain } from '../../lib/text.js';
import { coerceFields, toStorage, fromStorage } from '../../lib/fields.js';
import { RESOURCES } from '../../content/resources.js';
import { IMAGE_SLOTS } from '../../content/image-slots.js';
import { FAQ_GROUPS } from '../../lib/content.js';
import { wrap, flash, fail, paginate, loadSources } from './util.js';

const router = Router();

function getRes(req, res) {
  const def = RESOURCES[req.params.res];
  if (!def) { res.status(404).render('admin/404.njk', { title: 'غير موجود' }); return null; }
  if (!can(req.user, def.perm)) { res.status(403).render('admin/403.njk', { title: 'غير مصرّح' }); return null; }
  return { key: req.params.res, ...def };
}

function afterChange(def) {
  clearContentCache();
  if (def.table === 'redirects') forget('redirects');
  if (def.table === 'posts' || def.table === 'post_categories') forget('c:postcats');
}

function baseQuery(def) {
  const q = db(`${def.table} as t`).select('t.*');
  if (def.table === 'services') q.leftJoin('service_categories as c', 'c.id', 't.category_id').select('c.title as _category', 'c.slug as _cat_slug');
  if (def.table === 'posts') q.leftJoin('post_categories as c', 'c.id', 't.category_id').select('c.name as _category');
  if (def.table === 'service_categories') q.select(db.raw('(SELECT COUNT(*) FROM services s WHERE s.category_id = t.id) as _count'));
  return q;
}

async function uniqueSlug(def, base, id, row) {
  let slug = base || 'item';
  let i = 1;
  for (;;) {
    const q = db(def.table).where({ slug });
    if (id) q.whereNot('id', id);
    if (def.uniqueWith) q.andWhere(def.uniqueWith, row[def.uniqueWith] ?? null);
    // eslint-disable-next-line no-await-in-loop
    if (!(await q.first('id'))) return slug;
    i += 1;
    slug = `${base}-${i}`;
  }
}

// ─── القائمة ───
router.get('/:res', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  const sources = await loadSources();
  const q = baseQuery(def);
  const filters = (def.filters || []).map((f) => ({ ...f, options: f.options || sources[f.source] || [], value: req.query[f.name] || '' }));
  for (const f of filters) if (f.value) q.where(`t.${f.name}`, f.value);
  const search = String(req.query.q || '').trim();
  if (search) {
    const like = `%${search.replace(/[%_]/g, '\\$&')}%`;
    q.where((w) => { w.where(`t.${def.titleField}`, 'like', like); if (def.fields.some((f) => f.name === 'slug')) w.orWhere('t.slug', 'like', like); });
  }
  if (def.orderBy) def.orderBy.forEach(([c, d]) => q.orderBy(`t.${c}`, d));
  else q.orderBy([{ column: 't.sort' }, { column: 't.id' }]);
  const result = await paginate(q, req.query.page, def.sortable ? 500 : 40);
  const groupLabels = Object.fromEntries(FAQ_GROUPS);
  const rows = result.rows.map((r) => ({
    ...r,
    _title: r[def.titleField],
    _group: groupLabels[r.group_key],
    _view: def.viewUrl ? def.viewUrl(r) : null,
  }));
  res.render('admin/resource/index.njk', {
    title: def.label, active: def.key === 'redirects' ? 'seo' : `r:${def.key}`, def, rows, pager: result, filters, search,
    canSort: def.sortable && !search && !filters.some((f) => f.value),
    hasActive: def.fields.some((f) => f.name === 'is_active'),
    qs: new URLSearchParams(Object.entries(req.query).filter(([k, v]) => k !== 'page' && v)).toString(),
  });
}));

async function renderForm(req, res, def, row) {
  const sources = await loadSources();
  const values = fromStorage(def.fields, row || {});
  if (!row) {
    // تعبئة مسبقة من الرابط: ?category_id=… أو اسم أي حقل، و?from=/?to= للتحويلات (من «روابط لا تعمل»)
    const alias = def.table === 'redirects' ? { from: 'from_path', to: 'to_url' } : {};
    for (const [k, v] of Object.entries(req.query)) {
      const name = alias[k] || k;
      const f = def.fields.find((x) => x.name === name);
      if (!f || typeof v !== 'string' || !v.trim() || ['secret', 'code', 'repeater', 'checks'].includes(f.type)) continue;
      values[name] = f.type === 'list' ? [v.trim().slice(0, 500)] : v.trim().slice(0, 500);
    }
  }
  if (values.category_id != null && values.category_id !== '') values.category_id = String(values.category_id);
  const S = res.locals.S;
  res.render('admin/resource/form.njk', {
    title: row ? `تعديل ${def.singular}` : `إضافة ${def.singular}`, active: def.key === 'redirects' ? 'seo' : `r:${def.key}`, def, row,
    boot: {
      fields: def.fields, values, sources,
      slotImages: Object.fromEntries(IMAGE_SLOTS.map((s) => [s.key, S[`img_${s.key}`] || ''])),
      action: row ? `/admin/r/${def.key}/${row.id}` : `/admin/r/${def.key}`,
      back: `/admin/r/${def.key}`,
      viewUrl: row && def.viewUrl ? def.viewUrl({ ...row, _cat_slug: row._cat_slug }) : null,
    },
  });
}

router.get('/:res/new', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  await renderForm(req, res, def, null);
}));

router.get('/:res/:id', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  const row = await baseQuery(def).where('t.id', Number(req.params.id)).first();
  if (!row) return res.status(404).render('admin/404.njk', { title: 'غير موجود' });
  await renderForm(req, res, def, row);
}));

// حفظ (إضافة أو تعديل) — يستقبل JSON من نموذج اللوحة
async function save(req, res, def, id) {
  const prev = id ? await db(def.table).where({ id }).first() : null;
  if (id && !prev) return fail(res, 404, 'العنصر غير موجود.');
  const data = coerceFields(def.fields, req.body?.values || {}, { allowCode: false, prev: prev || {} });
  for (const f of def.fields) {
    if (f.required && (data[f.name] === '' || data[f.name] == null)) return fail(res, 422, `الحقل «${f.label}» مطلوب.`, { field: f.name });
    // رابط مكتوب لكنه رُفض عند التنقية — نُنبّه بدل حذفه بصمت
    const raw = req.body?.values?.[f.name];
    if (f.type === 'url' && typeof raw === 'string' && raw.trim() && !data[f.name]) return fail(res, 422, `الحقل «${f.label}» يجب أن يبدأ بـ https:// أو /`, { field: f.name });
  }
  if (def.table === 'redirects') {
    let from = String(data.from_path || '').trim();
    if (!from.startsWith('/')) from = `/${from}`;
    data.from_path = from.replace(/\/+$/, '') || '/';
    if (data.from_path === '/' || data.from_path.startsWith('/admin')) return fail(res, 422, 'لا يمكن تحويل هذا الرابط.', { field: 'from_path' });
    data.code = Number(data.code) === 302 ? 302 : 301;
    const dup = await db('redirects').where({ from_path: data.from_path }).modify((q) => { if (id) q.whereNot('id', id); }).first('id');
    if (dup) return fail(res, 422, 'يوجد تحويل لنفس الرابط مسبقًا.', { field: 'from_path' });
  }
  if (def.fields.some((f) => f.name === 'slug')) {
    const base = slugify(data.slug || data[def.slugFrom || def.titleField] || '');
    data.slug = await uniqueSlug(def, base || 'item', id, data);
  }
  if (def.table === 'posts') {
    // بدون كسور الثواني: MySQL يقرّبها لأعلى فيبدو المقال مجدولًا للمستقبل للحظة
    if (data.status === 'published' && !data.published_at) data.published_at = prev?.published_at || new Date(Math.floor(Date.now() / 1000) * 1000);
    data.category_id = data.category_id ? Number(data.category_id) : null;
  }
  if (def.table === 'services') data.category_id = Number(data.category_id);
  if (def.table === 'testimonials') data.rating = Math.min(5, Math.max(1, Math.round(Number(data.rating) || 5)));
  const row = toStorage(def.fields, data);
  row.updated_at = new Date();
  let newId = id;
  try {
    if (id) {
      await db(def.table).where({ id }).update(row);
    } else {
      if (def.sortable) {
        const [{ m }] = await db(def.table).max({ m: 'sort' });
        row.sort = (Number(m) || 0) + 10;
      }
      if (def.table === 'posts') row.author_id = req.user.id;
      [newId] = await db(def.table).insert(row);
    }
  } catch (e) {
    if (e.code === 'ER_DUP_ENTRY') return fail(res, 422, 'القيمة مستخدمة مسبقًا (الرابط أو المعرّف مكرر).');
    throw e;
  }
  // تحويل تلقائي عند تغيير رابط مقال منشور أو قسم خدمات
  if (prev && prev.slug && row.slug && prev.slug !== row.slug) {
    const map = { posts: (s) => `/insights/${s}`, service_categories: (s) => `/services/${s}`, post_categories: (s) => `/insights/category/${s}` };
    if (map[def.table] && (def.table !== 'posts' || prev.status === 'published')) {
      await db('redirects').insert({ from_path: map[def.table](prev.slug), to_url: map[def.table](row.slug), code: 301 })
        .onConflict('from_path').merge({ to_url: map[def.table](row.slug), is_active: true, updated_at: new Date() });
      forget('redirects');
    }
  }
  afterChange(def);
  const title = plain(String(data[def.titleField] || '')).slice(0, 120);
  logActivity(req, id ? 'update' : 'create', def.key, newId, title);
  // بعد الإضافة ينتقل المتصفح لصفحة التعديل، فتُعرض رسالة النجاح هناك
  if (!id) flash(req, 'success', `تمت إضافة «${title || def.singular}» — يمكنك متابعة التعديل هنا.`);
  return res.json({ ok: true, id: newId, redirect: id ? null : `/admin/r/${def.key}/${newId}`, message: id ? 'تم حفظ التعديلات.' : 'تمت الإضافة.' });
}

router.post('/:res', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  await save(req, res, def, null);
}));

router.post('/:res/reorder', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  if (!def.sortable) return fail(res, 422, 'هذا القسم لا يدعم الترتيب.');
  const ids = (req.body?.ids || []).map(Number).filter(Boolean).slice(0, 1000);
  await db.transaction(async (trx) => {
    for (let i = 0; i < ids.length; i += 1) {
      // eslint-disable-next-line no-await-in-loop
      await trx(def.table).where({ id: ids[i] }).update({ sort: (i + 1) * 10 });
    }
  });
  afterChange(def);
  res.json({ ok: true });
}));

router.post('/:res/:id', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  await save(req, res, def, Number(req.params.id));
}));

router.post('/:res/:id/toggle', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  const row = await db(def.table).where({ id: Number(req.params.id) }).first();
  if (!row || !('is_active' in row)) return fail(res, 404, 'غير موجود.');
  await db(def.table).where({ id: row.id }).update({ is_active: !row.is_active });
  afterChange(def);
  logActivity(req, 'update', def.key, row.id, `${row[def.titleField]} ← ${row.is_active ? 'مخفي' : 'ظاهر'}`);
  res.json({ ok: true, active: !row.is_active });
}));

router.post('/:res/:id/duplicate', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  const row = await db(def.table).where({ id: Number(req.params.id) }).first();
  if (!row) return res.redirect(`/admin/r/${def.key}`);
  const copy = { ...row };
  delete copy.id;
  delete copy.created_at;
  copy.updated_at = new Date();
  if ('slug' in copy) copy.slug = await uniqueSlug(def, `${row.slug}-copy`, null, row);
  if (def.table === 'redirects') copy.from_path = `${row.from_path}-copy`;
  if (def.titleField in copy) copy[def.titleField] = `${row[def.titleField]} (نسخة)`.slice(0, 190);
  if ('status' in copy && def.table === 'posts') { copy.status = 'draft'; copy.views = 0; }
  if ('hits' in copy) copy.hits = 0;
  const [id] = await db(def.table).insert(copy);
  afterChange(def);
  logActivity(req, 'create', def.key, id, `نسخة: ${row[def.titleField]}`);
  flash(req, 'success', 'تم إنشاء نسخة.');
  res.redirect(`/admin/r/${def.key}/${id}`);
}));

router.post('/:res/:id/delete', wrap(async (req, res) => {
  const def = getRes(req, res);
  if (!def) return;
  const id = Number(req.params.id);
  const row = await db(def.table).where({ id }).first();
  if (row) {
    if (def.table === 'service_categories') {
      const [{ n }] = await db('services').where({ category_id: id }).count({ n: '*' });
      if (Number(n) > 0 && req.body.confirm_cascade !== '1') {
        flash(req, 'error', `هذا القسم يحتوي ${n} خدمة. احذف الخدمات أو انقلها أولًا.`);
        return res.redirect(`/admin/r/${def.key}`);
      }
    }
    await db(def.table).where({ id }).del();
    afterChange(def);
    logActivity(req, 'delete', def.key, id, String(row[def.titleField] || '').slice(0, 120));
    flash(req, 'success', 'تم الحذف.');
  }
  res.redirect(`/admin/r/${def.key}`);
}));

export default router;
