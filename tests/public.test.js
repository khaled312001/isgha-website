// اختبارات الموقع العام: كل الصفحات، التحويلات، SEO، ونموذج الطلبات
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { startApp, stopApp, Client, templateLeaks } from './helpers.js';

let base;
let db;
let web;

before(async () => {
  ({ base, db } = await startApp());
  web = new Client(base);
});
after(stopApp);

const PAGES = [
  '/', '/about', '/services', '/services/judicial', '/services/legal', '/services/notary', '/services/specialized',
  '/services/judicial/litigation', '/services/judicial/case-study-pleadings', '/services/judicial/enforcement', '/services/judicial/arbitration',
  '/services/specialized/company-formation', '/services/specialized/restructuring', '/services/specialized/corporate', '/services/specialized/compliance',
  '/beneficiaries', '/contact', '/consultation', '/case-review', '/insights', '/privacy-policy', '/terms', '/thank-you',
];

test('كل صفحات الموقع تفتح بدون أخطاء قوالب', async () => {
  for (const p of PAGES) {
    const r = await web.get(p);
    assert.equal(r.status, 200, `${p} → ${r.status}`);
    assert.match(r.text, /<html lang="ar" dir="rtl"/, `${p}: لغة الصفحة`);
    assert.match(r.text, /<title>[^<]{5,}<\/title>/, `${p}: عنوان الصفحة`);
    assert.match(r.text, /<link rel="canonical" href="[^"]+"/, `${p}: الرابط الأساسي`);
    assert.deepEqual(templateLeaks(r.text), [], `${p}: آثار أخطاء في القالب`);
    for (const m of r.text.matchAll(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/g)) {
      assert.doesNotThrow(() => JSON.parse(m[1]), `${p}: JSON-LD غير صالح`);
    }
  }
});

test('الصفحة الرئيسية تعرض المحتوى الأساسي والهوية', async () => {
  const r = await web.get('/');
  assert.match(r.text, /إصغاء/);
  assert.match(r.text, /\/img\/logo\.svg/);
  assert.match(r.text, /\/css\/site\.css/);
  assert.match((await web.get('/css/site.css')).text, /IBMPlexArabic/);
  assert.match(r.text, /"@type":\s*"(LegalService|Organization)"/);
});

test('منع الأرشفة على الدومين التجريبي', async () => {
  const r = await web.get('/');
  assert.match(r.text, /<meta name="robots" content="noindex/);
  const robots = await web.get('/robots.txt');
  assert.equal(robots.status, 200);
  assert.match(robots.text, /Disallow: \/\s*$/m);
});

test('خريطة الموقع تتضمن الخدمات والصفحات بدون الصفحات المخفية', async () => {
  const r = await web.get('/sitemap.xml');
  assert.equal(r.status, 200);
  assert.match(r.headers.get('content-type'), /xml/);
  assert.match(r.text, /\/services\/judicial\/litigation<\/loc>/);
  assert.doesNotMatch(r.text, /\/packages<\/loc>/, 'الباقات ملغاة');
  assert.doesNotMatch(r.text, /thank-you|case-review|_service-tail|\/admin/);
});

test('الصفحات غير الموجودة تعيد 404 بصفحة مصممة', async () => {
  for (const p of ['/no-such-page', '/services/nope', '/services/judicial/nope', '/insights/nope', '/_service-tail']) {
    const r = await web.get(p);
    assert.equal(r.status, 404, p);
    assert.match(r.text, /<html lang="ar"/);
  }
  const bad = await web.get('/%E0%A4%A');
  assert.ok([400, 404].includes(bad.status));
});

test('روابط الموقع القديم تتحول 301 للروابط الجديدة', async () => {
  const map = {
    '/index.html': '/',
    '/pages/beneficiaries.html': '/beneficiaries',
    '/pages/judicial_services.html': '/services/judicial',
    '/pages/packages_details.html': '/services',
    '/packages': '/services',
  };
  for (const [from, to] of Object.entries(map)) {
    const r = await web.get(from);
    assert.equal(r.status, 301, from);
    assert.equal(new URL(r.location, base).pathname, to, from);
  }
});

test('التحويل يحتفظ بمعاملات الإعلان (gclid)', async () => {
  const r = await web.get('/pages/packages_details.html?gclid=abc123&utm_source=google');
  assert.equal(r.status, 301);
  const u = new URL(r.location, base);
  assert.equal(u.pathname, '/services');
  assert.equal(u.searchParams.get('gclid'), 'abc123');
  assert.equal(u.searchParams.get('utm_source'), 'google');
});

test('الشرطة المائلة الزائدة لا تسمح بتحويل لموقع خارجي', async () => {
  const r = await web.get('//evil.example/');
  assert.ok([301, 404].includes(r.status));
  if (r.location) assert.equal(new URL(r.location, base).host, new URL(base).host);
});

test('المعاينة لا تعمل للزوار غير المسجلين', async () => {
  const r = await web.get('/?preview=1');
  assert.equal(r.status, 200);
  assert.doesNotMatch(r.text, /class="preview-flag"/);
  assert.doesNotMatch(r.text, /class="sid"/);
});

test('إرسال طلب استشارة صحيح يُحفظ مع مصدر الإعلان', async () => {
  const page = await db('pages').where({ slug: 'case-review' }).first();
  const r = await web.post('/api/leads', {
    json: {
      form: 'lead', name: 'عبدالله التجربة', phone: '0551234567', case_type: 'تجاري', message: 'اختبار',
      page_id: page.id, ts: Date.now() - 6000, url: `${base}/case-review?gclid=abc`,
      attr: { gclid: 'abc123', utm_source: 'google', utm_medium: 'cpc', utm_campaign: 'brand' },
    },
  });
  assert.equal(r.status, 200, r.text);
  assert.equal(r.data.ok, true);
  assert.ok(r.data.id > 0);
  const lead = await db('leads').where({ id: r.data.id }).first();
  assert.equal(lead.phone, '966551234567');
  assert.equal(lead.click_type, 'google');
  assert.equal(lead.utm_campaign, 'brand');
  assert.equal(lead.page_id, page.id);
});

test('التحقق من بيانات النموذج', async () => {
  const noPhone = await web.post('/api/leads', { json: { name: 'محمد', phone: '123', ts: Date.now() - 6000 } });
  assert.equal(noPhone.status, 422);
  assert.equal(noPhone.data.field, 'phone');
  const noName = await web.post('/api/leads', { json: { name: '', phone: '0551234567', ts: Date.now() - 6000 } });
  assert.equal(noName.status, 422);
  const contact = await web.post('/api/leads', { json: { form: 'contact', name: 'محمد', phone: '0551234567', message: '', ts: Date.now() - 6000 } });
  assert.equal(contact.status, 422);
  assert.equal(contact.data.field, 'message');
});

test('فخ البوتات لا يحفظ الطلب', async () => {
  const before_ = (await db('leads').count({ n: '*' }))[0].n;
  const r = await web.post('/api/leads', { json: { name: 'بوت', phone: '0551234567', hp: 'x', ts: Date.now() - 6000 } });
  assert.equal(r.status, 200);
  assert.equal(r.data.id, 0);
  const after_ = (await db('leads').count({ n: '*' }))[0].n;
  assert.equal(Number(after_), Number(before_));
});

test('رفض الطلبات من مصدر خارجي', async () => {
  const r = await web.post('/api/leads', { json: { name: 'محمد', phone: '0551234567', ts: Date.now() - 6000 }, headers: { origin: 'https://evil.example' } });
  assert.equal(r.status, 403);
});

test('تسجيل أحداث الاتصال والواتساب', async () => {
  const r = await web.post('/api/event', { json: { type: 'call_click', path: '/' } });
  assert.equal(r.status, 204);
});

test('الملفات الثابتة والأيقونات', async () => {
  for (const p of ['/css/site.css', '/js/site.js', '/img/icons.svg', '/img/logo.svg', '/fonts/IBMPlexSansArabic-400-arabic.woff2', '/manifest.webmanifest', '/favicon.ico']) {
    const r = await web.get(p);
    assert.equal(r.status, 200, p);
  }
});

test('ترويسات الأمان', async () => {
  const r = await web.get('/');
  assert.equal(r.headers.get('x-content-type-options'), 'nosniff');
  assert.equal(r.headers.get('x-powered-by'), null);
});
