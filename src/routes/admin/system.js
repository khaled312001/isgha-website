// النظام: سجل النشاط، النسخ الاحتياطي والاستعادة، الذاكرة المؤقتة، معلومات الخادم
import fs from 'node:fs';
import path from 'node:path';
import { Router } from 'express';
import multer from 'multer';
import db from '../../db.js';
import config from '../../config.js';
import { requirePerm } from '../../lib/auth.js';
import { logActivity, ACTION_LABELS } from '../../lib/activity.js';
import { forget } from '../../lib/cache.js';
import { wrap, flash, paginate } from './util.js';

const router = Router();
router.use(requirePerm('system'));

const BACKUP_TABLES = [
  'settings', 'service_categories', 'services', 'practice_areas', 'packages', 'beneficiaries', 'faqs', 'testimonials', 'team_members',
  'post_categories', 'posts', 'pages', 'redirects', 'media', 'users', 'leads', 'lead_notes',
];
const ISO = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(\.\d+)?Z$/;

function backupFiles() {
  try {
    return fs.readdirSync(config.backupsDir)
      .filter((f) => /^isgha-backup-[\w-]+\.json$/.test(f))
      .map((f) => {
        const st = fs.statSync(path.join(config.backupsDir, f));
        return { name: f, size: st.size, time: st.mtime };
      })
      .sort((a, b) => b.time - a.time);
  } catch {
    return [];
  }
}

router.get('/', wrap(async (req, res) => {
  const [version] = await db.raw('SELECT VERSION() as v');
  const counts = {};
  for (const t of ['pages', 'services', 'posts', 'leads', 'media', 'users']) {
    // eslint-disable-next-line no-await-in-loop
    const [{ n }] = await db(t).count({ n: '*' });
    counts[t] = Number(n);
  }
  const migrations = await db('knex_migrations').select('name', 'migration_time').orderBy('id', 'desc').limit(5);
  res.render('admin/system.njk', {
    title: 'النظام والنسخ الاحتياطي', active: 'system',
    info: {
      node: process.version, mysql: version?.[0]?.v, env: config.isProd ? 'إنتاج' : 'تطوير', indexing: config.allowIndexing,
      uptime: Math.round(process.uptime() / 60), memory: Math.round(process.memoryUsage().rss / 1048576), uploadsDir: config.uploadsDir,
    },
    counts, migrations, backups: backupFiles(),
  });
}));

router.get('/activity', wrap(async (req, res) => {
  const q = db('activity_log as a').leftJoin('users as u', 'u.id', 'a.user_id').select('a.*', 'u.name as user_name').orderBy('a.id', 'desc');
  if (req.query.user) q.where('a.user_id', Number(req.query.user));
  if (req.query.action) q.where('a.action', String(req.query.action));
  const result = await paginate(q, req.query.page, 50);
  const users = await db('users').select('id', 'name');
  res.render('admin/activity.njk', { title: 'سجل النشاط', active: 'system', rows: result.rows, pager: result, users, labels: ACTION_LABELS, q: req.query, qs: new URLSearchParams(Object.entries(req.query).filter(([k, v]) => k !== 'page' && v)).toString() });
}));

router.post('/cache', (req, res) => {
  forget('');
  logActivity(req, 'update', 'system', null, 'مسح الذاكرة المؤقتة');
  flash(req, 'success', 'تم تحديث الذاكرة المؤقتة — ستظهر آخر التعديلات فورًا.');
  res.redirect('/admin/system');
});

router.post('/backup', wrap(async (req, res) => {
  const data = { app: 'isgha', version: 1, created_at: new Date().toISOString(), tables: {} };
  for (const t of BACKUP_TABLES) {
    // eslint-disable-next-line no-await-in-loop
    data.tables[t] = await db(t).select('*');
  }
  const name = `isgha-backup-${new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)}.json`;
  fs.writeFileSync(path.join(config.backupsDir, name), JSON.stringify(data));
  // الاحتفاظ بآخر ١٥ نسخة فقط
  for (const old of backupFiles().slice(15)) fs.rmSync(path.join(config.backupsDir, old.name), { force: true });
  logActivity(req, 'backup', 'system', null, name);
  flash(req, 'success', 'تم إنشاء نسخة احتياطية.');
  res.redirect('/admin/system');
}));

function safeBackupPath(name) {
  if (!/^isgha-backup-[\w-]+\.json$/.test(String(name))) return null;
  const full = path.join(config.backupsDir, name);
  return fs.existsSync(full) ? full : null;
}

// ملفات النسخ تحتوي كلمات المرور المشفّرة والمفاتيح السرية وبيانات العملاء: التنزيل والحذف للمالك فقط
function ownerOnly(req, res, next) {
  if (req.user.role === 'owner') return next();
  flash(req, 'error', 'تنزيل النسخ الاحتياطية وحذفها متاح لمالك الحساب فقط.');
  return res.redirect('/admin/system');
}

router.get('/backup/:name', ownerOnly, (req, res) => {
  const full = safeBackupPath(req.params.name);
  if (!full) return res.status(404).send('غير موجود');
  logActivity(req, 'export', 'backup', null, req.params.name);
  res.download(full);
});

router.post('/backup/:name/delete', ownerOnly, (req, res) => {
  const full = safeBackupPath(req.params.name);
  if (full) {
    fs.rmSync(full, { force: true });
    logActivity(req, 'delete', 'backup', null, req.params.name);
  }
  flash(req, 'success', 'تم حذف النسخة.');
  res.redirect('/admin/system');
});

const restoreUpload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 80 * 1024 * 1024, files: 1 } });

async function restore(data, req) {
  if (data?.app !== 'isgha' || !data.tables) throw new Error('الملف ليس نسخة احتياطية صالحة لهذا الموقع.');
  const keepUsers = !req.body?.include_users;
  const tables = BACKUP_TABLES.filter((t) => Array.isArray(data.tables[t]) && !(keepUsers && t === 'users'));
  // المعاملة تعمل على اتصال واحد مخصّص؛ إعادة فحص المفاتيح في finally تضمن ألا يعود
  // هذا الاتصال للمجمّع وFOREIGN_KEY_CHECKS معطّل حتى لو فشلت الاستعادة (ثم يُتراجع عنها)
  await db.transaction(async (trx) => {
    await trx.raw('SET FOREIGN_KEY_CHECKS = 0');
    try {
      for (const t of tables) {
        // eslint-disable-next-line no-await-in-loop
        await trx(t).del();
        const rows = data.tables[t].map((r) => Object.fromEntries(Object.entries(r).map(([k, v]) => [k, typeof v === 'string' && ISO.test(v) ? new Date(v) : v])));
        for (let i = 0; i < rows.length; i += 200) {
          // eslint-disable-next-line no-await-in-loop
          await trx(t).insert(rows.slice(i, i + 200));
        }
      }
    } finally {
      // لا نُخفي الخطأ الأصلي إن فشل هذا أيضًا (الاتصال المعطوب يُستبعد من المجمّع)
      await trx.raw('SET FOREIGN_KEY_CHECKS = 1').catch(() => {});
    }
  });
  forget('');
  return tables.length;
}

router.post('/restore', restoreUpload.single('file'), wrap(async (req, res) => {
  if (req.user.role !== 'owner') { flash(req, 'error', 'الاستعادة متاحة للمالك فقط.'); return res.redirect('/admin/system'); }
  if (req.body?.confirm !== 'استعادة') { flash(req, 'error', 'اكتب كلمة «استعادة» للتأكيد.'); return res.redirect('/admin/system'); }
  let data;
  try {
    const src = req.file ? req.file.buffer.toString('utf8') : (safeBackupPath(req.body?.name) && fs.readFileSync(safeBackupPath(req.body.name), 'utf8'));
    data = JSON.parse(src || 'null');
  } catch {
    flash(req, 'error', 'تعذر قراءة الملف.');
    return res.redirect('/admin/system');
  }
  try {
    const n = await restore(data, req);
    logActivity(req, 'backup', 'system', null, `استعادة ${n} جدول`);
    flash(req, 'success', `تمت الاستعادة بنجاح (${n} جدول).`);
  } catch (e) {
    flash(req, 'error', `فشلت الاستعادة: ${e.message}`);
  }
  res.redirect('/admin/system');
}));

export default router;
