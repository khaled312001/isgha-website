// لوحة التحكم: الدخول، القائمة الجانبية، وتجميع كل الأقسام
import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../../db.js';
import { csrfProtect } from '../../lib/csrf.js';
import { attemptLogin, requireAuth, can } from '../../lib/auth.js';
import { logActivity } from '../../lib/activity.js';
import { getSettings } from '../../lib/settings.js';
import { roleLabel } from '../../content/permissions.js';
import { RESOURCES } from '../../content/resources.js';
import dashboard from './dashboard.js';
import leads from './leads.js';
import pages from './pages.js';
import resources from './resources.js';
import media from './media.js';
import settings from './settings.js';
import users from './users.js';
import system from './system.js';

const router = Router();

router.use((req, res, next) => {
  res.set('Cache-Control', 'no-store');
  res.set('X-Robots-Tag', 'noindex, nofollow');
  next();
});
router.use(csrfProtect);

function buildNav(user) {
  const r = (key) => ({ label: RESOURCES[key].label, url: `/admin/r/${key}`, icon: RESOURCES[key].icon, key: `r:${key}` });
  const groups = [
    { items: [{ label: 'الرئيسية', url: '/admin', icon: 'dashboard', key: 'dashboard' }] },
    { title: 'العملاء والتسويق', items: [
      can(user, 'leads') && { label: 'طلبات العملاء', url: '/admin/leads', icon: 'inbox', key: 'leads', badge: 'leads' },
      can(user, 'landing') && { label: 'صفحات الهبوط', url: '/admin/pages?kind=landing', icon: 'mouse-pointer', key: 'landing' },
      can(user, 'analytics') && { label: 'التقارير', url: '/admin/analytics', icon: 'chart-line', key: 'analytics' },
      can(user, 'marketing') && { label: 'الإعلانات والتتبع', url: '/admin/marketing', icon: 'megaphone', key: 'marketing' },
    ] },
    { title: 'الموقع', items: [
      can(user, 'pages') && { label: 'صفحات الموقع', url: '/admin/pages', icon: 'layout-template', key: 'pages' },
      can(user, 'content') && r('categories'),
      can(user, 'content') && r('services'),
      can(user, 'content') && r('packages'),
      can(user, 'content') && { label: 'محتوى آخر', icon: 'layers', key: 'more', children: ['areas', 'beneficiaries', 'faqs', 'testimonials', 'team'].map(r) },
      can(user, 'posts') && { label: 'المقالات', url: '/admin/r/posts', icon: 'newspaper', key: 'r:posts', children: [r('posts'), r('post_categories')] },
      can(user, 'media') && { label: 'صور الموقع', url: '/admin/media/slots', icon: 'image', key: 'slots' },
      can(user, 'media') && { label: 'مكتبة الوسائط', url: '/admin/media', icon: 'folder', key: 'media' },
    ] },
    { title: 'الإعدادات', items: [
      can(user, 'seo') && { label: 'محركات البحث SEO', url: '/admin/seo', icon: 'scan-search', key: 'seo' },
      can(user, 'settings') && { label: 'إعدادات الموقع', url: '/admin/settings', icon: 'settings', key: 'settings' },
      can(user, 'users') && { label: 'المستخدمون', url: '/admin/users', icon: 'user-cog', key: 'users' },
      can(user, 'system') && { label: 'النظام والنسخ', url: '/admin/system', icon: 'server', key: 'system' },
    ] },
  ];
  return groups.map((g) => ({ ...g, items: g.items.filter(Boolean) })).filter((g) => g.items.length);
}

router.use(async (req, res, next) => {
  try {
    res.locals.flash = req.session.flash || null;
    if (req.session.flash) delete req.session.flash;
    res.locals.S = await getSettings();
    res.locals.adminPath = req.originalUrl;
    res.locals.roleLabel = roleLabel;
    if (req.user) {
      res.locals.nav = buildNav(req.user);
      if (can(req.user, 'leads')) {
        const [{ n }] = await db('leads').where({ status: 'new' }).count({ n: '*' });
        res.locals.badges = { leads: Number(n) };
      } else res.locals.badges = {};
    }
    next();
  } catch (e) {
    next(e);
  }
});

// ─── الدخول والخروج ───
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  handler: (req, res) => res.status(429).render('admin/login.njk', { error: 'محاولات كثيرة. انتظر ربع ساعة ثم حاول مجددًا.', email: req.body?.email || '' }),
});

function safeNext(n) {
  const s = String(n || '');
  return s.startsWith('/admin') && !s.startsWith('//') ? s : '/admin';
}

router.get('/login', (req, res) => {
  if (req.user) return res.redirect(safeNext(req.query.next));
  res.render('admin/login.njk', { next: safeNext(req.query.next) });
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {};
    const result = await attemptLogin(email, password, req.ip);
    if (result.error) return res.status(401).render('admin/login.njk', { error: result.error, email, next: safeNext(req.body?.next) });
    const user = result.user;
    req.session.regenerate((err) => {
      if (err) return next(err);
      req.session.uid = user.id;
      req.session.pwv = user.password_hash.slice(-12);
      req.user = user;
      logActivity(req, 'login', 'user', user.id, user.email);
      req.session.save(() => res.redirect(safeNext(req.body?.next)));
    });
  } catch (e) {
    next(e);
  }
});

router.post('/logout', (req, res) => {
  if (req.user) logActivity(req, 'logout', 'user', req.user.id, req.user.email);
  req.session.destroy(() => {
    res.clearCookie('isgha.sid');
    res.redirect('/admin/login');
  });
});

// كل ما بعد هذا يتطلب تسجيل الدخول
router.use(requireAuth);

router.use('/', dashboard);
router.use('/leads', leads);
router.use('/pages', pages);
router.use('/r', resources);
router.use('/media', media);
router.use('/', settings);
router.use('/users', users);
router.use('/system', system);

router.use((req, res) => {
  res.status(404).render('admin/404.njk', { title: 'الصفحة غير موجودة' });
});

export default router;
