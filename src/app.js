import path from 'node:path';
import express from 'express';
import helmet from 'helmet';
import compression from 'compression';
import cookieParser from 'cookie-parser';
import session from 'express-session';
import MySQLStoreFactory from 'express-mysql-session';
import config, { ROOT } from './config.js';
import db from './db.js';
import { setupViews } from './lib/view.js';
import { loadUser } from './lib/auth.js';
import { remember } from './lib/cache.js';
import { getSettings } from './lib/settings.js';
import { siteLocals } from './lib/render.js';
import { buildMeta } from './lib/seo.js';
import { trackEvent } from './lib/analytics.js';
import publicRoutes from './routes/public.js';
import apiRoutes from './routes/api.js';
import adminRoutes from './routes/admin/index.js';

export function createApp() {
  const app = express();
  app.disable('x-powered-by');
  if (config.trustProxy !== false) app.set('trust proxy', config.trustProxy);
  setupViews(app);

  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginEmbedderPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' },
    referrerPolicy: { policy: 'strict-origin-when-cross-origin' },
    strictTransportSecurity: config.isProd ? { maxAge: 15552000, includeSubDomains: false } : false,
  }));
  app.use(compression());

  // إعادة التوجيه إلى https والدومين الأساسي (يُفعّل من .env بعد ربط الدومين)
  app.use((req, res, next) => {
    if (/^(1|true|yes|on)$/i.test(process.env.FORCE_HTTPS || '') && req.protocol === 'http' && req.method === 'GET') {
      return res.redirect(301, `https://${req.get('host')}${req.originalUrl}`);
    }
    const canon = (process.env.CANONICAL_HOST || '').replace(/^https?:\/\//, '').replace(/\/+$/, '');
    if (canon && req.method === 'GET' && req.get('host') !== canon && !req.path.startsWith('/api/')) {
      return res.redirect(301, `${req.protocol}://${canon}${req.originalUrl}`);
    }
    next();
  });

  // الملفات الثابتة
  const longCache = { maxAge: '365d', immutable: true };
  app.use('/fonts', express.static(path.join(ROOT, 'public', 'fonts'), longCache));
  app.use('/vendor', express.static(path.join(ROOT, 'public', 'vendor'), { maxAge: '30d' }));
  app.use(express.static(path.join(ROOT, 'public'), {
    maxAge: config.isProd ? '7d' : 0,
    setHeaders(res, p) {
      // ?v=<ASSET_VERSION> يتغير مع كل نشر ← تخزين سنة كاملة
      if (res.req?.query?.v && /\.(css|js|svg|png|jpe?g|webp|avif|ico|woff2?)$/.test(p)) res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
      // صور الموقع (بدون إصدار في الرابط): 30 يومًا + تحديث في الخلفية — في الإنتاج فقط حتى لا تعلق صور قديمة أثناء التطوير
      else if (config.isProd && /[\\/]img[\\/]/.test(p)) res.setHeader('Cache-Control', 'public, max-age=2592000, stale-while-revalidate=604800');
    },
  }));
  app.use('/uploads', express.static(config.uploadsDir, { maxAge: '30d', fallthrough: false }));

  app.use(cookieParser());
  app.use(express.urlencoded({ extended: true, limit: '4mb' }));
  app.use(express.json({ limit: '8mb' }));
  app.use(express.text({ type: 'text/plain', limit: '64kb' }));

  // الجلسات (لا تُنشأ إلا عند تسجيل الدخول)
  const MySQLStore = MySQLStoreFactory(session);
  const store = new MySQLStore({
    ...config.db,
    createDatabaseTable: false, // الجدول من ملف الترحيل 20261005000003_sessions
    clearExpired: true,
    checkExpirationInterval: 15 * 60 * 1000,
    expiration: 7 * 24 * 3600 * 1000,
    schema: { tableName: 'sessions' },
  });
  app.locals.sessionStore = store;
  app.use(session({
    name: 'isgha.sid',
    secret: config.sessionSecret,
    store,
    resave: false,
    saveUninitialized: false,
    rolling: true,
    cookie: { httpOnly: true, sameSite: 'lax', secure: config.isProd && process.env.COOKIE_SECURE !== 'false' ? 'auto' : false, maxAge: 12 * 3600 * 1000 },
  }));
  app.use(loadUser);

  app.get('/healthz', async (req, res) => {
    try {
      await db.raw('SELECT 1');
      res.json({ ok: true, time: new Date().toISOString() });
    } catch (e) {
      console.error('[healthz]', e.message);
      res.status(500).json({ ok: false, error: 'database' });
    }
  });

  // التحويلات (301) المُدارة من لوحة التحكم
  app.use(async (req, res, next) => {
    if (req.method !== 'GET' || req.path.startsWith('/admin') || req.path.startsWith('/api/')) return next();
    try {
      const map = await remember('redirects', async () => {
        const rows = await db('redirects').where({ is_active: true }).select('id', 'from_path', 'to_url', 'code');
        return Object.fromEntries(rows.map((r) => [r.from_path.toLowerCase(), r]));
      });
      let p;
      try { p = decodeURIComponent(req.path).toLowerCase(); } catch { p = req.path.toLowerCase(); }
      if (p.length > 1) p = p.replace(/\/+$/, '');
      const hit = map[p];
      if (hit) {
        db('redirects').where({ id: hit.id }).increment('hits', 1).catch(() => {});
        // نحتفظ بمعاملات الرابط الأصلي (gclid، utm…) حتى لا تضيع نسبة الإعلانات
        const q = req.originalUrl.slice(req.path.length).replace(/^\?/, '');
        const target = q ? `${hit.to_url}${hit.to_url.includes('?') ? '&' : '?'}${q}` : hit.to_url;
        return res.redirect(hit.code === 302 ? 302 : 301, target);
      }
      // إزالة الشرطة المائلة الأخيرة
      if (req.path.length > 1 && req.path.endsWith('/')) {
        const q = req.originalUrl.slice(req.path.length);
        // منع التحويل لدومين خارجي عبر //example.com/
        return res.redirect(301, `/${req.path.replace(/^\/+|\/+$/g, '')}${q}`);
      }
    } catch (e) {
      return next(e);
    }
    next();
  });

  app.use('/api', apiRoutes);
  app.use('/admin', adminRoutes);
  app.use('/', publicRoutes);

  // 404
  app.use(async (req, res) => {
    if (req.path.startsWith('/api/')) return res.status(404).json({ ok: false, error: 'غير موجود' });
    // تسجيل الروابط المفقودة لعرضها في التقارير (لإضافة تحويلات)
    if (req.method === 'GET' && !/\.(js|css|map|png|jpe?g|gif|svg|webp|avif|ico|woff2?|txt|xml|php)$/i.test(req.path) && !req.path.startsWith('/admin')) {
      let p404;
      try { p404 = decodeURIComponent(req.path); } catch { p404 = req.path; }
      trackEvent('404', p404.slice(0, 250));
    }
    try {
      if (!res.locals.S) await siteLocals(req, res);
      const meta = buildMeta(req, res.locals.S, { title: 'الصفحة غير موجودة', noindex: true });
      res.status(404).render('pages/404.njk', { meta });
    } catch {
      res.status(404).type('text').send('404');
    }
  });

  // الأخطاء
  // eslint-disable-next-line no-unused-vars
  app.use(async (err, req, res, next) => {
    const status = err.status || err.statusCode || 500;
    // أخطاء العميل (رابط تالف، JSON غير صالح…) لا تحتاج تتبعًا كاملًا في السجل
    if (status >= 500) console.error('[error]', req.method, req.originalUrl, err);
    else console.warn('[warn]', status, req.method, req.originalUrl, err.message);
    if (res.headersSent) return;
    if (req.path.startsWith('/api/') || req.get('accept')?.includes('application/json')) {
      const msg = status === 413 ? 'حجم البيانات كبير جدًا.' : status < 500 ? 'طلب غير صالح.' : 'حدث خطأ غير متوقع.';
      return res.status(status).json({ ok: false, error: msg });
    }
    let phone = '';
    try { phone = (await getSettings()).phone; } catch { /* القاعدة غير متاحة */ }
    res.status(status).render('pages/error.njk', { phone });
  });

  return app;
}
