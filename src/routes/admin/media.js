// مكتبة الوسائط + صور الموقع (الخانات مع برومبت التوليد لكل صورة)
import { Router } from 'express';
import db from '../../db.js';
import { requirePerm } from '../../lib/auth.js';
import { logActivity } from '../../lib/activity.js';
import { uploader, saveMedia, deleteMediaFile, verifyUploads } from '../../lib/upload.js';
import { setSettings } from '../../lib/settings.js';
import { clearContentCache } from '../../lib/content.js';
import { IMAGE_SLOTS, IMAGE_NEGATIVE, slotByKey } from '../../content/image-slots.js';
import { wrap, fail, paginate, wantsJson, flash } from './util.js';

const router = Router();
router.use(requirePerm('media'));

function handleUpload(req, res, next) {
  uploader.array('files', 20)(req, res, (err) => {
    if (err) {
      const msg = err.code === 'LIMIT_FILE_SIZE' ? 'حجم الملف أكبر من 12 ميجابايت.' : err.message || 'تعذر رفع الملف.';
      if (wantsJson(req)) return fail(res, 422, msg);
      flash(req, 'error', msg);
      return res.redirect(req.get('referer') || '/admin/media');
    }
    const bad = verifyUploads(req.files);
    if (bad) {
      if (wantsJson(req)) return fail(res, 422, bad);
      flash(req, 'error', bad);
      return res.redirect('/admin/media');
    }
    next();
  });
}

router.get('/', wrap(async (req, res) => {
  const q = db('media').orderBy('id', 'desc');
  const type = req.query.type;
  if (type === 'image') q.where('mime', 'like', 'image/%');
  if (type === 'pdf') q.where('mime', 'application/pdf');
  if (req.query.q) q.where((w) => w.where('original_name', 'like', `%${req.query.q}%`).orWhere('alt', 'like', `%${req.query.q}%`));
  const result = await paginate(q, req.query.page, 48);
  if (req.query.format === 'json') return res.json({ ok: true, ...result });
  const [{ size }] = await db('media').sum({ size: 'size' });
  res.render('admin/media/index.njk', { title: 'مكتبة الوسائط', active: 'media', items: result.rows, pager: result, q: req.query, totalSize: Number(size) || 0 });
}));

router.post('/upload', handleUpload, wrap(async (req, res) => {
  const files = req.files || [];
  if (!files.length) return wantsJson(req) ? fail(res, 422, 'اختر ملفًا للرفع.') : res.redirect('/admin/media');
  const saved = [];
  for (const f of files) {
    // eslint-disable-next-line no-await-in-loop
    saved.push(await saveMedia(f, req.user.id, String(req.body.alt || '').slice(0, 250)));
  }
  logActivity(req, 'upload', 'media', saved.map((s) => s.id).join(','), files.map((f) => f.originalname).join('، ').slice(0, 400));
  if (wantsJson(req)) return res.json({ ok: true, items: saved });
  flash(req, 'success', `تم رفع ${saved.length} ملف.`);
  res.redirect('/admin/media');
}));

router.post('/:id/alt', wrap(async (req, res) => {
  await db('media').where({ id: Number(req.params.id) }).update({ alt: String(req.body.alt || '').slice(0, 250) || null });
  res.json({ ok: true });
}));

router.post('/:id/delete', wrap(async (req, res) => {
  const m = await db('media').where({ id: Number(req.params.id) }).first();
  if (m) {
    await db('media').where({ id: m.id }).del();
    deleteMediaFile(m.filename);
    logActivity(req, 'delete', 'media', m.id, m.original_name);
  }
  if (wantsJson(req)) return res.json({ ok: true });
  flash(req, 'success', 'تم حذف الملف.');
  res.redirect('/admin/media');
}));

// ─── صور الموقع ───
router.get('/slots', wrap(async (req, res) => {
  const S = res.locals.S;
  const slots = IMAGE_SLOTS.map((s) => {
    const url = S[`img_${s.key}`] || '';
    return { ...s, url, custom: Boolean(url && url !== s.default) };
  });
  res.render('admin/media/slots.njk', {
    title: 'صور الموقع', active: 'slots', slots, negative: IMAGE_NEGATIVE,
    done: slots.filter((s) => s.url).length,
  });
}));

router.post('/slots/:key', handleUpload, wrap(async (req, res) => {
  const slot = slotByKey(req.params.key);
  if (!slot) return fail(res, 404, 'خانة غير معروفة.');
  let url = '';
  if (req.files?.length) {
    const m = await saveMedia(req.files[0], req.user.id, slot.label);
    url = m.url;
  } else if (typeof req.body.url === 'string') {
    url = req.body.url.trim();
    if (url && !/^(\/uploads\/|\/img\/|https:\/\/)/.test(url)) return fail(res, 422, 'رابط الصورة غير صالح.');
  }
  await setSettings({ [`img_${slot.key}`]: url });
  clearContentCache();
  logActivity(req, url ? 'upload' : 'delete', 'image_slot', slot.key, slot.label);
  // بعد الإزالة تعود الخانة للصورة الأساسية المرفقة مع الموقع (إن وُجدت)
  res.json({ ok: true, url: url || slot.default, custom: Boolean(url) });
}));

export default router;
