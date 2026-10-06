import { Router } from 'express';
import db from '../db.js';
import config from '../config.js';
import { remember } from '../lib/cache.js';
import { siteLocals, loadSectionData, faqItemsFor, preparedSections, pageSettings, withHeadingIds, tocOf } from '../lib/render.js';
import {
  buildMeta, orgSchema, websiteSchema, webPageSchema, breadcrumbSchema, faqSchema, serviceSchema, packagesSchema, articleSchema, graph, absUrl, baseUrl,
} from '../lib/seo.js';
import { getCategory, getSystemPage, getPageBySlug } from '../lib/content.js';
import { plain, truncate, readingMinutes, stripTags } from '../lib/text.js';
import { trackView, BOT } from '../lib/analytics.js';
import { cleanRich } from '../lib/sanitize.js';

const router = Router();

// المسارات المحجوزة التي لا يمكن أن تكون صفحات هبوط
export const RESERVED = new Set(['admin', 'api', 'services', 'insights', 'uploads', 'img', 'css', 'js', 'fonts', 'vendor', 'sitemap.xml', 'robots.txt', 'manifest.webmanifest', 'favicon.ico', 'home', 'index', 'index.html', 'pages', 'assets', 'login', 'logout', 'lp', 'search']);

const SYSTEM_PATHS = { '/': 'home' };

router.use(async (req, res, next) => {
  try {
    await siteLocals(req, res);
    next();
  } catch (e) {
    next(e);
  }
});

// رؤوس SEO/التخزين لكل صفحة HTML (تشمل صفحة 404 لأنها تُرسم بعد هذا الموجّه)
router.use((req, res, next) => {
  const render = res.render.bind(res);
  res.render = (view, locals, cb) => {
    // noindex عبر الرأس أيضًا (يغطي حالات تجاهل الميتا) — وكل شيء على الدومين التجريبي
    if (!config.allowIndexing || locals?.meta?.noindex) res.set('X-Robots-Tag', 'noindex, nofollow');
    // HTML لا يُخزَّن بدون إعادة تحقق (ETag)، ولا يُخزَّن إطلاقًا لمستخدمي اللوحة
    if (!res.get('Cache-Control')) res.set('Cache-Control', req.user ? 'private, no-store' : 'no-cache');
    return render(view, locals, cb);
  };
  next();
});

// أول قسم ظاهر إن كان بطلًا بصورة ← نحمّل صورته مبكرًا (LCP)
function heroPreload(sections, imgFor) {
  const first = sections.find((s) => !s.hidden);
  if (!first) return null;
  if (first.type === 'hero_home') return imgFor(first.data.image, 'home_hero') || null;
  if (first.type === 'hero_page') return imgFor(first.data.image, first.data.image_slot) || null;
  return null;
}

// المعاينة متاحة فقط لمستخدمي لوحة التحكم
function isPreview(req) {
  return Boolean(req.query.preview && req.user);
}

function crumbsFor(...items) {
  return [{ label: 'الرئيسية', url: '/' }, ...items];
}

export async function renderSectionPage(req, res, page, { crumbs = null, extraNodes = [], preview = false } = {}) {
  const S = res.locals.S;
  if (preview && page.draft_sections) page.sections = page.draft_sections;
  const sections = preparedSections(page);
  const D = await loadSectionData(sections);
  const settings = pageSettings(page);
  page.settings = settings;
  const isHome = page.system_key === 'home';
  const path = isHome ? '/' : `/${page.slug}`;
  const firstHero = sections.find((s) => !s.hidden && ['hero_home', 'hero_page', 'hero_lead'].includes(s.type));
  const meta = buildMeta(req, S, {
    title: page.meta_title || (isHome ? S.seo_default_title : plain(firstHero?.data?.title) || page.title),
    description: page.meta_description || (firstHero?.data?.lead ? truncate(firstHero.data.lead, 160) : null),
    image: page.og_image,
    noindex: page.noindex || page.status !== 'published' || preview,
    path,
    fullTitle: isHome,
  });
  const base = meta.base;
  const pageCrumbs = crumbs || (isHome ? null : crumbsFor({ label: plain(page.title), url: path }));
  const faqs = faqItemsFor(sections, D);
  const pageType = { contact: 'ContactPage', about: 'AboutPage', services: 'CollectionPage' }[page.system_key] || 'WebPage';
  // الباقات التفصيلية (صفحة الباقات) ← OfferCatalog؛ البطاقات المختصرة في الرئيسية لا تكفي
  const showsPackages = D.packages.length && sections.some((s) => !s.hidden && s.type === 'packages' && s.data.show_details);
  const nodes = [
    orgSchema(base, S, res.locals.navCats),
    websiteSchema(base, S),
    webPageSchema(base, meta, { type: pageType, crumbs: Boolean(pageCrumbs) }),
    pageCrumbs ? breadcrumbSchema(base, pageCrumbs, meta.canonical) : null,
    faqs.length ? faqSchema(faqs, meta.canonical) : null,
    showsPackages ? packagesSchema(base, meta, D.packages) : null,
    ...extraNodes,
  ];
  res.locals.clientCfg.pageId = page.id;
  const preloadImage = heroPreload(sections, res.locals.imgFor);
  if (!preview) {
    if (page.status === 'published' && !BOT.test(req.get('user-agent') || '')) db('pages').where({ id: page.id }).increment('views', 1).catch(() => {});
    trackView(req, res);
  }
  res.render('pages/page.njk', {
    page, sections, D, meta, jsonld: graph(nodes), crumbs: pageCrumbs, preloadImage,
    layout: page.layout, bodyClass: `pg-${page.kind} pg-${page.slug}`, isPreview: preview,
  });
}

// ─── الرئيسية ───
router.get('/', async (req, res, next) => {
  try {
    const page = await getSystemPage('home');
    if (!page) return next();
    await renderSectionPage(req, res, { ...page }, { preview: isPreview(req) });
  } catch (e) { next(e); }
});

// ─── الخدمات ───
router.get('/services', async (req, res, next) => {
  try {
    const page = await getSystemPage('services');
    if (!page) return next();
    await renderSectionPage(req, res, { ...page }, { crumbs: crumbsFor({ label: 'خدماتنا', url: '/services' }), preview: isPreview(req) });
  } catch (e) { next(e); }
});

router.get('/services/:cat', async (req, res, next) => {
  try {
    const cat = await getCategory(req.params.cat);
    if (!cat) return next();
    const S = res.locals.S;
    const D = await loadSectionData([{ type: 'practice_areas', data: {}, hidden: false }]);
    const crumbs = crumbsFor({ label: 'خدماتنا', url: '/services' }, { label: cat.title, url: cat.url });
    const meta = buildMeta(req, S, { title: cat.meta_title || `${cat.title} — ${S.brand_short}`, description: cat.meta_description || cat.intro || cat.summary, image: cat.image, path: cat.url });
    const base = meta.base;
    const tail = await tailSections('service_tail');
    const tailD = await loadSectionData(tail);
    trackView(req, res);
    res.render('pages/service-category.njk', {
      cat, crumbs, meta, D: { ...tailD, areas: D.areas }, tailSections: tail,
      // نفس صورة البطل في القالب (imgFor(cat.image, 'service_' + slug)) — عنصر LCP على الجوال
      preloadImage: res.locals.imgFor(cat.image, `service_${cat.slug}`) || null,
      jsonld: graph([
        orgSchema(base, S, res.locals.navCats),
        websiteSchema(base, S),
        webPageSchema(base, meta, { crumbs: true }),
        serviceSchema(base, meta, { name: cat.title, description: cat.summary || cat.intro, serviceType: cat.title, catalog: cat.services }),
        breadcrumbSchema(base, crumbs, meta.canonical),
      ]),
    });
  } catch (e) { next(e); }
});

router.get('/services/:cat/:svc', async (req, res, next) => {
  try {
    const cat = await getCategory(req.params.cat);
    const svc = cat?.services.find((s) => s.slug === req.params.svc && s.has_page);
    if (!svc) return next();
    const S = res.locals.S;
    const crumbs = crumbsFor({ label: 'خدماتنا', url: '/services' }, { label: cat.title, url: cat.url }, { label: svc.title, url: svc.url });
    const meta = buildMeta(req, S, { title: svc.meta_title || `${svc.title} — ${cat.title}`, description: svc.meta_description || svc.summary || stripTags(svc.body), image: svc.image || cat.image, path: svc.url });
    const base = meta.base;
    trackView(req, res);
    res.render('pages/service.njk', {
      cat, svc, crumbs, meta,
      jsonld: graph([
        orgSchema(base, S, res.locals.navCats),
        websiteSchema(base, S),
        webPageSchema(base, meta, { crumbs: true }),
        serviceSchema(base, meta, { name: svc.title, description: svc.summary || stripTags(svc.body).slice(0, 300), serviceType: cat.title }),
        breadcrumbSchema(base, crumbs, meta.canonical),
      ]),
    });
  } catch (e) { next(e); }
});

async function tailSections(key) {
  const p = await getSystemPage(key);
  return p ? preparedSections(p).filter((s) => !s.hidden) : [];
}

// ─── المعرفة القانونية (المدونة) ───
const PER_PAGE = 9;
async function blogIndex(req, res, next, activeCat = null) {
  try {
    const S = res.locals.S;
    const sys = await getSystemPage('insights');
    const heroSec = sys ? preparedSections(sys).find((s) => s.type === 'hero_page') : null;
    const hero = heroSec?.data || { title: 'المعرفة القانونية', lead: '' };
    const pageNum = Math.max(1, parseInt(req.query.page, 10) || 1);
    const q = db('posts as p').leftJoin('post_categories as c', 'c.id', 'p.category_id').where('p.status', 'published').andWhere('p.published_at', '<=', new Date());
    if (activeCat) q.andWhere('p.category_id', activeCat.id);
    const [{ total }] = await q.clone().count({ total: '*' });
    const posts = await q.clone().select('p.*', 'c.name as category_name', 'c.slug as category_slug').orderBy('p.published_at', 'desc').limit(PER_PAGE).offset((pageNum - 1) * PER_PAGE);
    const cats = await remember('c:postcats', () => db('post_categories').orderBy('sort'));
    const pages = Math.max(1, Math.ceil(Number(total) / PER_PAGE));
    if (pageNum > pages) return next();
    const path = activeCat ? `/insights/category/${activeCat.slug}` : '/insights';
    const crumbs = crumbsFor({ label: 'المعرفة القانونية', url: '/insights' }, ...(activeCat ? [{ label: activeCat.name, url: path }] : []));
    const baseTitle = activeCat ? `${activeCat.name} — المعرفة القانونية` : (sys?.meta_title || plain(hero.title));
    const meta = buildMeta(req, S, {
      title: pageNum > 1 ? `${baseTitle} — صفحة ${pageNum}` : baseTitle,
      description: activeCat?.description || sys?.meta_description || hero.lead,
      path: pageNum > 1 ? `${path}?page=${pageNum}` : path,
      // صفحة بلا مقالات منشورة (المدونة أو تصنيف) = محتوى فارغ ← لا تُفهرس حتى يُنشر أول مقال
      noindex: sys?.noindex || Number(total) === 0,
    });
    const tail = sys ? preparedSections(sys).filter((s) => !s.hidden && s.type !== 'hero_page') : [];
    const D = await loadSectionData(tail);
    trackView(req, res);
    const base = meta.base;
    res.render('pages/insights.njk', {
      posts, cats, activeCat, pages, pageNum, hero, crumbs, meta, tailSections: tail, D,
      jsonld: graph([
        orgSchema(base, S, res.locals.navCats),
        websiteSchema(base, S),
        webPageSchema(base, meta, { type: 'CollectionPage', crumbs: true }),
        breadcrumbSchema(base, crumbs, meta.canonical),
        {
          '@type': 'Blog',
          '@id': `${base}/insights#blog`,
          name: plain(hero.title),
          url: absUrl(base, '/insights'),
          inLanguage: 'ar-SA',
          publisher: { '@id': `${base}/#organization` },
          blogPost: posts.map((p) => ({ '@type': 'BlogPosting', '@id': `${absUrl(base, `/insights/${p.slug}`)}#article`, headline: p.title, url: absUrl(base, `/insights/${p.slug}`) })),
        },
      ]),
    });
  } catch (e) { next(e); }
}

router.get('/insights', (req, res, next) => blogIndex(req, res, next));
router.get('/insights/category/:slug', async (req, res, next) => {
  const cat = await db('post_categories').where({ slug: req.params.slug }).first().catch(() => null);
  if (!cat) return next();
  return blogIndex(req, res, next, cat);
});

router.get('/insights/:slug', async (req, res, next) => {
  try {
    const S = res.locals.S;
    const post = await db('posts as p').leftJoin('post_categories as c', 'c.id', 'p.category_id')
      .select('p.*', 'c.name as category_name', 'c.slug as category_slug')
      .where('p.slug', req.params.slug).first();
    const preview = isPreview(req);
    if (!post || (!preview && (post.status !== 'published' || new Date(post.published_at) > new Date()))) return next();
    const crumbs = crumbsFor({ label: 'المعرفة القانونية', url: '/insights' }, { label: post.title, url: `/insights/${post.slug}` });
    const meta = buildMeta(req, S, {
      title: post.meta_title || post.title,
      description: post.meta_description || post.excerpt || stripTags(post.body),
      image: post.og_image || post.cover,
      imageAlt: post.title,
      path: `/insights/${post.slug}`,
      noindex: post.noindex || post.status !== 'published' || preview,
      type: 'article',
      published: post.published_at,
      modified: post.updated_at || post.published_at,
      section: post.category_name,
    });
    const body = withHeadingIds(cleanRich(post.body));
    const related = await db('posts').select('slug', 'title').where({ status: 'published' }).andWhere('id', '!=', post.id).andWhere((q) => { if (post.category_id) q.where('category_id', post.category_id); }).orderBy('published_at', 'desc').limit(4);
    if (!preview && post.status === 'published') db('posts').where({ id: post.id }).increment('views', 1).catch(() => {});
    if (!preview) trackView(req, res);
    const base = meta.base;
    res.render('pages/post.njk', {
      post, body, toc: tocOf(body), related, crumbs, meta, readMin: readingMinutes(post.body),
      // المعاينة: بلا بكسلات التتبع (نفس شرط صفحات الأقسام)
      isPreview: preview,
      jsonld: graph([
        orgSchema(base, S, res.locals.navCats),
        websiteSchema(base, S),
        webPageSchema(base, meta, { crumbs: true, image: true }),
        articleSchema(base, meta, post),
        breadcrumbSchema(base, crumbs, meta.canonical),
      ]),
    });
  } catch (e) { next(e); }
});

// ─── البحث في الموقع ───
router.get('/search', async (req, res, next) => {
  try {
    const S = res.locals.S;
    const q = String(req.query.q || '').trim().slice(0, 80);
    const results = [];
    if (q.length >= 2) {
      const norm = (t) => plain(String(t || '')).replace(/[ً-ْـ]/g, '').replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').toLowerCase();
      const words = norm(q).split(/\s+/).filter((w) => w.length > 1);
      const score = (title, body) => {
        const t = norm(title); const b = norm(body);
        let n = 0;
        for (const w of words) { if (t.includes(w)) n += 3; else if (b.includes(w)) n += 1; else return 0; }
        return n;
      };
      const clean = (t) => String(t || '').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;|&amp;nbsp;/g, ' ').replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
      const add = (type, title, url, raw) => { const text = clean(raw); const sc = score(title, text); if (sc) results.push({ type, title: plain(title), url, text: truncate(plain(text), 170), sc }); };
      for (const c of res.locals.navCats) {
        add('خدمات', c.title, c.url, `${c.tagline || ''} ${c.summary || ''}`);
        for (const sv of c.services) if (sv.url) add('خدمات', sv.title, sv.url, `${sv.summary || ''} ${plain(sv.body || '')}`);
      }
      const posts = await db('posts').where('status', 'published').andWhere('published_at', '<=', new Date()).select('slug', 'title', 'excerpt', 'body').limit(300);
      for (const p of posts) add('مقالات', p.title, `/insights/${p.slug}`, `${p.excerpt || ''} ${plain(p.body || '')}`);
      const faqs = await db('faqs').where('is_active', true).select('question', 'answer').limit(300);
      for (const f of faqs) add('أسئلة شائعة', f.question, '/contact#faq', f.answer);
      const pages = await db('pages').where({ status: 'published', noindex: false }).whereNot('kind', 'landing').whereNotIn('system_key', ['thank-you', 'service_tail']).select('slug', 'title', 'system_key', 'meta_description');
      for (const p of pages) add('صفحات', p.title, p.system_key === 'home' ? '/' : `/${p.slug}`, p.meta_description);
      results.sort((a, b) => b.sc - a.sc);
    }
    const meta = buildMeta(req, S, { title: q ? `نتائج البحث عن «${q}»` : 'البحث في الموقع', noindex: true, path: '/search' });
    res.render('pages/search.njk', { meta, q, results: results.slice(0, 30) });
  } catch (e) { next(e); }
});

// ─── صفحة الشكر ───
router.get('/thank-you', async (req, res, next) => {
  try {
    const S = res.locals.S;
    const page = await getSystemPage('thank-you');
    const sections = page ? preparedSections(page).filter((s) => s.type !== 'hero_page') : [];
    const heroSec = page ? preparedSections(page).find((s) => s.type === 'hero_page') : null;
    const D = await loadSectionData(sections);
    const meta = buildMeta(req, S, { title: page?.meta_title || 'شكرًا لتواصلك', noindex: true, path: '/thank-you' });
    res.render('pages/thank-you.njk', { meta, sections, D, t: { title: heroSec?.data?.title, text: heroSec?.data?.lead }, page: page ? { ...page, settings: pageSettings(page) } : null });
  } catch (e) { next(e); }
});

// ─── خريطة الموقع ───
router.get('/sitemap.xml', async (req, res, next) => {
  try {
    const S = res.locals.S;
    const base = baseUrl(req, S);
    const urls = [];
    const add = (loc, lastmod, priority = '0.7', changefreq = 'monthly') => urls.push({ loc: absUrl(base, loc), lastmod, priority, changefreq });
    const latest = (...ds) => ds.filter((d) => d && !Number.isNaN(new Date(d).getTime())).sort((a, b) => new Date(b) - new Date(a))[0];
    const posts = await db('posts').where({ status: 'published', noindex: false }).andWhere('published_at', '<=', new Date()).select('slug', 'category_id', 'published_at', 'updated_at');
    const newestPost = latest(...posts.map((p) => p.updated_at || p.published_at));
    // صفحات الهبوط (إعلانية) وصفحة الشكر وأقسام الخدمات المشتركة لا تدخل الخريطة
    const pages = await db('pages').where({ status: 'published', noindex: false }).andWhere((q) => q.whereNot('kind', 'landing').orWhereNull('kind')).select('slug', 'system_key', 'kind', 'updated_at');
    for (const p of pages) {
      if (['thank-you', 'service_tail'].includes(p.system_key)) continue;
      if (p.system_key === 'home') add('/', latest(p.updated_at, newestPost), '1.0', 'weekly');
      else if (p.system_key === 'insights') { if (posts.length) add('/insights', latest(p.updated_at, newestPost), '0.7', 'weekly'); }
      else if (p.system_key === 'services') add('/services', p.updated_at, '0.9');
      else add(`/${p.slug}`, p.updated_at, '0.8');
    }
    for (const c of res.locals.navCats) {
      add(c.url, latest(c.updated_at, ...c.services.map((s) => s.updated_at)), '0.9');
      for (const s of c.services) if (s.url) add(s.url, s.updated_at, '0.8');
    }
    for (const p of posts) add(`/insights/${p.slug}`, p.updated_at || p.published_at, '0.6');
    // التصنيفات التي فيها مقالات منشورة فقط (الفارغة noindex)
    const cats = await db('post_categories').select('id', 'slug', 'updated_at');
    for (const c of cats) {
      const inCat = posts.filter((p) => p.category_id === c.id);
      if (inCat.length) add(`/insights/category/${c.slug}`, latest(c.updated_at, ...inCat.map((p) => p.updated_at || p.published_at)), '0.4', 'weekly');
    }
    const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&apos;');
    const loc = (u) => { try { return encodeURI(decodeURI(u)); } catch { return encodeURI(u); } };
    const seen = new Set();
    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls.filter((u) => !seen.has(u.loc) && seen.add(u.loc)).map((u) => `  <url><loc>${esc(loc(u.loc))}</loc>${u.lastmod ? `<lastmod>${new Date(u.lastmod).toISOString().slice(0, 10)}</lastmod>` : ''}<changefreq>${u.changefreq}</changefreq><priority>${u.priority}</priority></url>`).join('\n')}\n</urlset>`;
    res.type('application/xml').set('Cache-Control', 'public, max-age=1800');
    if (!config.allowIndexing) res.set('X-Robots-Tag', 'noindex, nofollow');
    res.send(xml);
  } catch (e) { next(e); }
});

router.get('/robots.txt', (req, res) => {
  const S = res.locals.S;
  const base = baseUrl(req, S);
  // صفحة الشكر وصفحات الهبوط محمية بـ noindex (ميتا + X-Robots-Tag)؛ حجبها هنا يمنع جوجل من رؤية noindex
  const extra = String(S.robots_extra || '').trim();
  const lines = config.allowIndexing
    ? ['User-agent: *', 'Allow: /', 'Disallow: /admin', 'Disallow: /api/', 'Disallow: /*?preview=', ...(extra ? ['', extra] : []), '', `Sitemap: ${base}/sitemap.xml`]
    : ['# الموقع في وضع التجهيز — الأرشفة متوقفة (ALLOW_INDEXING=false)', 'User-agent: *', 'Disallow: /'];
  res.type('text/plain').set('Cache-Control', 'public, max-age=3600').send(`${lines.join('\n')}\n`);
});

router.get('/manifest.webmanifest', (req, res) => {
  const S = res.locals.S;
  res.type('application/manifest+json').set('Cache-Control', 'public, max-age=86400').send(JSON.stringify({
    id: '/', name: S.site_name, short_name: S.brand_short, description: plain(S.seo_default_description) || undefined,
    lang: 'ar', dir: 'rtl', start_url: '/', scope: '/', display: 'standalone',
    // يطابق <meta name="theme-color"> في site.njk
    background_color: '#faf9f4', theme_color: '#141817',
    icons: [
      { src: '/img/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/img/icon-512.png', sizes: '512x512', type: 'image/png' },
      { src: '/img/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  }));
});

// ─── الصفحات المبنية (الأساسية والمخصصة وصفحات الهبوط) ───
router.get('/:slug', async (req, res, next) => {
  try {
    const slug = String(req.params.slug || '').toLowerCase();
    if (RESERVED.has(slug)) return next();
    const page = await getPageBySlug(slug);
    if (!page) return next();
    const preview = isPreview(req);
    if (page.status !== 'published' && !preview) return next();
    if (!preview && ['thank-you', 'service_tail', 'insights', 'services'].includes(page.system_key)) return next();
    if (!preview && page.system_key === 'home') return res.redirect(301, '/');
    await renderSectionPage(req, res, { ...page }, { preview });
  } catch (e) { next(e); }
});

export default router;
