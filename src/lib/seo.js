import config from '../config.js';
import { plain, truncate, enDigits } from './text.js';
import { normalizePhone } from './phone.js';

// صورة المشاركة الافتراضية وأبعادها (public/img/og-default.jpg)
export const DEFAULT_OG_IMAGE = '/img/og-default.jpg';
const DEFAULT_OG_SIZE = { width: 1200, height: 630 };
const TITLE_MAX = 60; // تقريبًا ما تعرضه نتائج جوجل قبل القص
const DESC_MAX = 160;

// الدومين الأساسي: إعداد canonical_host ← ثم دومين الطلب ← ثم SITE_URL
export function baseUrl(req, s) {
  let host = String(s?.canonical_host || '').trim();
  if (host) {
    if (!/^https?:\/\//i.test(host)) host = `https://${host}`;
    try {
      const u = new URL(host);
      return `${u.protocol}//${u.host}`;
    } catch { /* قيمة غير صالحة ← نكمل بالبدائل */ }
  }
  if (req) {
    // خلف LiteSpeed قد لا يصل البروتوكول الأصلي؛ إن كان SITE_URL على https فلا نولّد روابط http مختلطة
    const proto = req.protocol === 'http' && /^https:/i.test(config.siteUrl) ? 'https' : req.protocol;
    return `${proto}://${req.get('host')}`;
  }
  return config.siteUrl;
}

export function absUrl(base, p) {
  if (!p) return '';
  if (/^https?:\/\//i.test(p)) {
    // رابط مطلق على نفس الدومين بـ http بينما الموقع https ← نوحّده
    if (base.startsWith('https://') && p.startsWith('http://') && p.slice(7).split('/')[0] === base.slice(8)) return `https://${p.slice(7)}`;
    return p;
  }
  if (p.startsWith('//')) return `${base.split(':')[0]}:${p}`;
  return `${base}${p.startsWith('/') ? '' : '/'}${p}`;
}

// قص على حدود الكلمات بدون كسر الكلمة
function clip(s, n) {
  const t = plain(s);
  if (t.length <= n) return t;
  return `${t.slice(0, n - 1).replace(/\s+\S*$/, '').replace(/[\s،,.:؛;—–-]+$/, '')}…`;
}

// العنوان النهائي: لاحقة كاملة إن اتسع المجال، وإلا اسم العلامة المختصر، ولا تكرار للعلامة
export function composeTitle(t, s) {
  const suffix = s.seo_title_suffix || '';
  const brand = plain(s.brand_short || '');
  if (brand && t.includes(brand)) return t;
  if (suffix && (t + suffix).length <= TITLE_MAX) return t + suffix;
  if (brand && `${t} | ${brand}`.length <= TITLE_MAX + 5) return `${t} | ${brand}`;
  return t;
}

// يبني بيانات الميتا لكل صفحة
export function buildMeta(req, s, {
  title, description, image, imageAlt, noindex, path: p, type = 'website', fullTitle = false, published, modified, section,
} = {}) {
  const base = baseUrl(req, s);
  const cleanPath = (p ?? req.path).replace(/\/+$/, '') || '/';
  const t = plain(title || s.seo_default_title || s.site_name);
  const finalTitle = fullTitle ? t : composeTitle(t, s);
  const desc = clip(description || s.seo_default_description, DESC_MAX);
  const indexable = config.allowIndexing && !noindex;
  const img = image || s.seo_og_image || DEFAULT_OG_IMAGE;
  const isDefaultImg = img === DEFAULT_OG_IMAGE || img === absUrl(base, DEFAULT_OG_IMAGE);
  const iso = (d) => (d && !Number.isNaN(new Date(d).getTime()) ? new Date(d).toISOString() : undefined);
  return {
    title: finalTitle,
    ogTitle: t,
    description: desc,
    canonical: absUrl(base, cleanPath === '/' ? '/' : cleanPath),
    image: absUrl(base, img),
    imageWidth: isDefaultImg ? DEFAULT_OG_SIZE.width : undefined,
    imageHeight: isDefaultImg ? DEFAULT_OG_SIZE.height : undefined,
    imageAlt: plain(imageAlt || (isDefaultImg ? s.site_name : t)),
    robots: indexable ? 'index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1' : 'noindex, nofollow',
    noindex: !indexable,
    type,
    published: iso(published),
    modified: iso(modified),
    section: section || undefined,
    siteName: s.site_name,
    base,
  };
}

// ─── ساعات العمل: «الأحد – الخميس · ٩ صباحًا – ٥ مساءً» ← OpeningHoursSpecification ───
const DAY_NAMES = [
  ['الأحد', 'Sunday'], ['الاحد', 'Sunday'], ['الاثنين', 'Monday'], ['الإثنين', 'Monday'], ['الثلاثاء', 'Tuesday'],
  ['الأربعاء', 'Wednesday'], ['الاربعاء', 'Wednesday'], ['الخميس', 'Thursday'], ['الجمعة', 'Friday'], ['السبت', 'Saturday'],
];
const WEEK = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
const AM = /^(صباح|ص$)/;
const PM = /^(مساء|م$|ظهر|عصر)/;

export function parseWorkingHours(str) {
  const s = enDigits(String(str || ''));
  if (!s.trim()) return null;
  const found = [];
  for (const [ar, en] of DAY_NAMES) {
    for (let i = s.indexOf(ar); i >= 0; i = s.indexOf(ar, i + ar.length)) found.push({ i, end: i + ar.length, en });
  }
  if (!found.length) return null;
  found.sort((a, b) => a.i - b.i);
  let days;
  const between = found.length === 2 ? s.slice(found[0].end, found[1].i) : '';
  if (found.length === 2 && /[–—-]|إلى|الى|حتى/.test(between)) {
    days = [];
    const a = WEEK.indexOf(found[0].en);
    const b = WEEK.indexOf(found[1].en);
    for (let k = a; ; k = (k + 1) % 7) { days.push(WEEK[k]); if (k === b || days.length > 7) break; }
  } else {
    days = [...new Set(found.map((f) => f.en))];
  }
  const rest = s.slice(found[found.length - 1].end);
  const times = [...rest.matchAll(/(\d{1,2})(?:[:.](\d{2}))?\s*(صباحًا|صباحا|صباح|مساءً|مساءا|مساء|ظهرًا|ظهرا|ظهر|عصرًا|عصرا|ص(?![؀-ۿ])|م(?![؀-ۿ]))?/g)]
    .map((m) => ({ h: Number(m[1]), m: Number(m[2] || 0), p: m[3] || '' }))
    .filter((x) => x.h <= 24 && x.m < 60);
  if (times.length !== 2) return null;
  const to24 = ({ h, p }) => (PM.test(p) && h < 12 ? h + 12 : AM.test(p) && h === 12 ? 0 : h);
  let open = to24(times[0]);
  let close = to24(times[1]);
  // «٩ – ٥» بدون صباحًا/مساءً ← الإغلاق مساءً
  if (!times[1].p && close <= open && close < 12) close += 12;
  if (!times[0].p && open > close) open -= 12;
  if (open < 0 || close > 24 || close <= open) return null;
  const hhmm = (h, m) => `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  return [{ '@type': 'OpeningHoursSpecification', dayOfWeek: days, opens: hhmm(open, times[0].m), closes: hhmm(close, times[1].m) }];
}

// «المملكة العربية السعودية – الرياض – حي الياسمين – طريق…» ← الشارع والحي فقط
function streetFrom(address, city) {
  const parts = String(address || '').split(/\s[–—-]\s|[،,]/).map((x) => x.trim()).filter(Boolean);
  const skip = new Set(['المملكة العربية السعودية', 'السعودية', 'KSA', 'Saudi Arabia', plain(city)]);
  return parts.filter((x) => !skip.has(x)).join('، ');
}

function geoFrom(s) {
  for (const v of [s.org_geo, s.map_query]) {
    const m = String(v || '').match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*,\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (m) return { '@type': 'GeoCoordinates', latitude: Number(m[1]), longitude: Number(m[2]) };
  }
  return undefined;
}

const SOCIAL_KEYS = ['social_x', 'social_linkedin', 'social_instagram', 'social_snapchat', 'social_tiktok', 'social_youtube'];
const SA_COUNTRY = { '@type': 'Country', name: 'المملكة العربية السعودية', identifier: 'SA' };

export function orgSchema(base, s, categories = []) {
  const phone = normalizePhone(s.phone);
  const same = SOCIAL_KEYS.map((k) => String(s[k] || '').trim()).filter((u) => /^https?:\/\//i.test(u));
  const city = s.city || 'الرياض';
  const logo = { '@type': 'ImageObject', '@id': `${base}/#logo`, url: absUrl(base, '/img/icon-512.png'), contentUrl: absUrl(base, '/img/icon-512.png'), width: 512, height: 512, caption: s.site_name };
  const org = {
    '@type': 'LegalService',
    '@id': `${base}/#organization`,
    name: s.org_legal_name || s.site_name,
    alternateName: s.brand_short || undefined,
    description: plain(s.seo_default_description) || undefined,
    slogan: s.site_tagline || undefined,
    url: `${base}/`,
    logo,
    image: absUrl(base, s.seo_og_image || DEFAULT_OG_IMAGE),
    telephone: phone ? `+${phone}` : undefined,
    email: s.email || undefined,
    address: {
      '@type': 'PostalAddress',
      streetAddress: streetFrom(s.address, city) || 'طريق أبي بكر الصديق، حي الياسمين',
      addressLocality: city,
      addressRegion: /الرياض/.test(city) ? 'منطقة الرياض' : undefined,
      addressCountry: 'SA',
    },
    geo: geoFrom(s),
    hasMap: s.map_link || (s.map_query ? `https://www.google.com/maps?q=${encodeURIComponent(s.map_query)}` : undefined),
    areaServed: [SA_COUNTRY, ...String(s.org_areas || '').split(/[،,]/).map((x) => x.trim()).filter(Boolean).map((name) => ({ '@type': 'City', name }))],
    contactPoint: phone ? [{ '@type': 'ContactPoint', telephone: `+${phone}`, email: s.email || undefined, contactType: 'customer service', areaServed: 'SA', availableLanguage: ['ar'] }] : undefined,
    knowsAbout: categories.length ? categories.map((c) => c.title) : undefined,
    priceRange: '$$',
    openingHoursSpecification: parseWorkingHours(s.working_hours) || undefined,
  };
  if (same.length) org.sameAs = same;
  if (s.org_founding_year) org.foundingDate = String(s.org_founding_year);
  if (categories.length) {
    org.hasOfferCatalog = {
      '@type': 'OfferCatalog',
      name: 'الخدمات القانونية',
      itemListElement: categories.map((c) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: c.title, url: absUrl(base, c.url) } })),
    };
  }
  return org;
}

export function websiteSchema(base, s) {
  return {
    '@type': 'WebSite',
    '@id': `${base}/#website`,
    url: `${base}/`,
    name: s.site_name,
    alternateName: s.brand_short || undefined,
    description: plain(s.seo_default_description) || undefined,
    inLanguage: 'ar-SA',
    publisher: { '@id': `${base}/#organization` },
  };
}

// عقدة الصفحة نفسها (WebPage / CollectionPage / ContactPage …)
export function webPageSchema(base, meta, { type = 'WebPage', crumbs = false, image = false } = {}) {
  return {
    '@type': type,
    '@id': `${meta.canonical}#webpage`,
    url: meta.canonical,
    name: meta.title,
    description: meta.description || undefined,
    inLanguage: 'ar-SA',
    isPartOf: { '@id': `${base}/#website` },
    about: { '@id': `${base}/#organization` },
    breadcrumb: crumbs ? { '@id': `${meta.canonical}#breadcrumb` } : undefined,
    primaryImageOfPage: image ? { '@type': 'ImageObject', url: meta.image } : undefined,
    datePublished: meta.published,
    dateModified: meta.modified,
  };
}

export function breadcrumbSchema(base, crumbs, pageUrl) {
  return {
    '@type': 'BreadcrumbList',
    '@id': pageUrl ? `${pageUrl}#breadcrumb` : undefined,
    itemListElement: crumbs.map((c, i) => ({ '@type': 'ListItem', position: i + 1, name: plain(c.label), item: absUrl(base, c.url) })),
  };
}

export function serviceSchema(base, meta, { name, description, serviceType, catalog } = {}) {
  return {
    '@type': 'Service',
    '@id': `${meta.canonical}#service`,
    name: plain(name),
    description: plain(description) || meta.description || undefined,
    serviceType: serviceType ? plain(serviceType) : undefined,
    url: meta.canonical,
    provider: { '@id': `${base}/#organization` },
    areaServed: SA_COUNTRY,
    mainEntityOfPage: { '@id': `${meta.canonical}#webpage` },
    hasOfferCatalog: catalog && catalog.length ? {
      '@type': 'OfferCatalog',
      name: plain(name),
      itemListElement: catalog.map((x) => ({ '@type': 'Offer', itemOffered: { '@type': 'Service', name: plain(x.title), url: x.url ? absUrl(base, x.url) : undefined } })),
    } : undefined,
  };
}

// الباقات كـ OfferCatalog (بدون أسعار لأنها غير منشورة)
export function packagesSchema(base, meta, packages) {
  return {
    '@type': 'OfferCatalog',
    '@id': `${meta.canonical}#packages`,
    name: 'الباقات القانونية للشركات',
    url: meta.canonical,
    numberOfItems: packages.length,
    itemListElement: packages.map((p) => ({
      '@type': 'Offer',
      url: `${meta.canonical}#pk-${p.slug}`,
      offeredBy: { '@id': `${base}/#organization` },
      areaServed: SA_COUNTRY,
      itemOffered: { '@type': 'Service', name: plain(p.name), description: plain(p.tagline) || undefined, provider: { '@id': `${base}/#organization` } },
    })),
  };
}

export function faqSchema(items, pageUrl) {
  return {
    '@type': 'FAQPage',
    '@id': pageUrl ? `${pageUrl}#faq` : undefined,
    mainEntity: items.map((f) => ({ '@type': 'Question', name: plain(f.q), acceptedAnswer: { '@type': 'Answer', text: plain(f.a) } })),
  };
}

export function articleSchema(base, meta, post) {
  return {
    '@type': 'BlogPosting',
    '@id': `${meta.canonical}#article`,
    headline: truncate(post.title, 110),
    description: meta.description || undefined,
    image: [meta.image],
    datePublished: meta.published,
    dateModified: meta.modified || meta.published,
    inLanguage: 'ar-SA',
    articleSection: post.category_name || undefined,
    author: post.author_name ? { '@type': 'Person', name: plain(post.author_name) } : { '@id': `${base}/#organization` },
    publisher: { '@id': `${base}/#organization` },
    isPartOf: { '@id': `${base}/insights#blog` },
    mainEntityOfPage: { '@id': `${meta.canonical}#webpage` },
  };
}

// يحذف الحقول الفارغة (undefined) ليبقى JSON-LD نظيفًا
function prune(v) {
  if (Array.isArray(v)) return v.map(prune).filter((x) => x !== undefined);
  if (v && typeof v === 'object') {
    const out = {};
    for (const [k, x] of Object.entries(v)) {
      const y = prune(x);
      if (y !== undefined && !(Array.isArray(y) && !y.length)) out[k] = y;
    }
    return out;
  }
  return v;
}

export function graph(nodes) {
  return { '@context': 'https://schema.org', '@graph': prune(nodes.filter(Boolean)) };
}
