// اختبارات لوحة التحكم: الدخول، كل الشاشات، المنشئ، المحتوى، الوسائط، الإعدادات، الصلاحيات، النسخ الاحتياطي
import { test, before, after } from 'node:test';
import assert from 'node:assert/strict';
import net from 'node:net';
import { startApp, stopApp, Client, templateLeaks, PNG_1PX, OWNER } from './helpers.js';

let base;
let db;
let admin;
let web;

before(async () => {
  ({ base, db } = await startApp());
  admin = new Client(base);
  web = new Client(base);
});
after(stopApp);

const ok = (r, label) => {
  assert.equal(r.status, 200, `${label} → ${r.status} ${r.status >= 300 && r.status < 400 ? r.location : r.text.slice(0, 300)}`);
  assert.deepEqual(templateLeaks(r.text), [], `${label}: آثار أخطاء في القالب`);
};
const bootOf = (html) => JSON.parse(html.match(/window\.BUILDER = (\{[\s\S]*?\});<\/script>/)[1]);

test('اللوحة تتطلب تسجيل الدخول', async () => {
  const r = await web.get('/admin');
  assert.equal(r.status, 302);
  assert.match(r.location, /^\/admin\/login/);
  const leads = await web.get('/admin/leads');
  assert.equal(leads.status, 302);
  const api = await web.post('/admin/pages/1/draft', { json: { sections: [] } });
  assert.ok([302, 401, 403, 419].includes(api.status));
});

test('رفض كلمة مرور خاطئة وطلب بدون CSRF', async () => {
  const c = new Client(base);
  await c.get('/admin/login');
  const bad = await c.post('/admin/login', { form: { email: OWNER.email, password: 'wrong-password' } });
  assert.equal(bad.status, 401);
  assert.match(bad.text, /alert-error/);
  c.csrf = 'x'.repeat(48);
  const noCsrf = await c.post('/admin/login', { form: { email: OWNER.email, password: OWNER.password } });
  assert.equal(noCsrf.status, 302);
  assert.equal((await c.get('/admin')).status, 302, 'لم يتم الدخول بدون رمز CSRF صحيح');
});

test('الدخول بحساب المالك', async () => {
  const r = await admin.login();
  assert.equal(r.location, '/admin');
  const home = await admin.get('/admin');
  ok(home, '/admin');
  assert.match(home.text, /مالك الاختبار/);
});

test('كل شاشات اللوحة تفتح', async () => {
  const urls = [
    '/admin', '/admin/analytics', '/admin/analytics?d=7', '/admin/analytics?d=90', '/admin/analytics?d=365',
    '/admin/leads', '/admin/leads?status=new', '/admin/leads?source=ads', '/admin/leads?q=test',
    '/admin/pages', '/admin/pages?kind=landing', '/admin/media', '/admin/media/slots', '/admin/marketing', '/admin/seo',
    '/admin/settings/general', '/admin/settings/navigation', '/admin/settings/leads', '/admin/settings/smtp', '/admin/settings/privacy',
    '/admin/users', '/admin/users/new', '/admin/users/me', '/admin/system', '/admin/system/activity',
  ];
  for (const u of urls) ok(await admin.get(u), u);
  assert.equal((await admin.get('/admin/settings')).status, 302);
  assert.equal((await admin.get('/admin/does-not-exist')).status, 404);
});

test('كل أقسام المحتوى: القائمة، إضافة جديد، وتعديل أول عنصر', async () => {
  const { RESOURCES } = await import('../src/content/resources.js');
  for (const [key, def] of Object.entries(RESOURCES)) {
    ok(await admin.get(`/admin/r/${key}`), `/admin/r/${key}`);
    ok(await admin.get(`/admin/r/${key}/new`), `/admin/r/${key}/new`);
    const row = await db(def.table).first('id');
    if (row) ok(await admin.get(`/admin/r/${key}/${row.id}`), `/admin/r/${key}/${row.id}`);
  }
  assert.equal((await admin.get('/admin/r/nope')).status, 404);
});

test('منشئ الصفحات يفتح لكل صفحة ويحمل بياناته', async () => {
  const pages = await db('pages').select('id', 'title');
  assert.ok(pages.length >= 12);
  for (const p of pages) {
    const r = await admin.get(`/admin/pages/${p.id}`);
    ok(r, `builder ${p.title}`);
    const boot = bootOf(r.text);
    assert.equal(boot.id, p.id);
    assert.ok(Array.isArray(boot.sections));
    for (const s of boot.sections) assert.ok(boot.types[s.type], `${p.title}: نوع قسم غير معروف ${s.type}`);
  }
});

test('المسودة لا تظهر للزوار حتى النشر، والمعاينة تعرضها للمسؤول', async () => {
  const page = await db('pages').where({ system_key: 'about' }).first();
  const boot = bootOf((await admin.get(`/admin/pages/${page.id}`)).text);
  const sections = structuredClone(boot.sections);
  const first = sections[0];
  first.data.title = 'عنوان تجريبي من المنشئ';
  const draft = await admin.post(`/admin/pages/${page.id}/draft`, { json: { sections } });
  assert.equal(draft.status, 200, draft.text);
  assert.equal(draft.data.ok, true);

  const pub = await web.get('/about');
  assert.doesNotMatch(pub.text, /عنوان تجريبي من المنشئ/);
  const prev = await admin.get('/about?preview=1');
  assert.match(prev.text, /عنوان تجريبي من المنشئ/);
  assert.match(prev.text, /class="preview-flag"/);
  assert.match(prev.text, /<meta name="robots" content="noindex/);
  assert.match(prev.text, new RegExp(`id="sid-${first.id}"`));

  const publish = await admin.post(`/admin/pages/${page.id}/publish`, { json: {} });
  assert.equal(publish.status, 200, publish.text);
  const after_ = await web.get('/about');
  assert.match(after_.text, /عنوان تجريبي من المنشئ/);
  const row = await db('pages').where({ id: page.id }).first();
  assert.equal(row.draft_sections, null);
});

test('إخفاء قسم وإعادة الترتيب والتراجع عن المسودة', async () => {
  const page = await db('pages').where({ system_key: 'home' }).first();
  const boot = bootOf((await admin.get(`/admin/pages/${page.id}`)).text);
  const sections = structuredClone(boot.sections);
  sections[1].hidden = true;
  sections.reverse();
  await admin.post(`/admin/pages/${page.id}/draft`, { json: { sections } });
  const saved = JSON.parse((await db('pages').where({ id: page.id }).first()).draft_sections);
  assert.equal(saved[0].id, boot.sections.at(-1).id);
  assert.equal(saved.find((s) => s.id === boot.sections[1].id).hidden, true);
  const d = await admin.post(`/admin/pages/${page.id}/discard`, { json: {} });
  assert.equal(d.status, 200);
  assert.deepEqual(d.data.sections.map((s) => s.id), boot.sections.map((s) => s.id));
});

test('المنشئ يرفض أنواع أقسام غير معروفة وينظّف النصوص', async () => {
  const page = await db('pages').where({ system_key: 'terms' }).first();
  const boot = bootOf((await admin.get(`/admin/pages/${page.id}`)).text);
  const sections = [...structuredClone(boot.sections), { id: 'evil1', type: 'not_a_type', data: {} }];
  sections[0].data.title = 'عنوان <script>alert(1)</script> نظيف';
  await admin.post(`/admin/pages/${page.id}/draft`, { json: { sections } });
  const saved = JSON.parse((await db('pages').where({ id: page.id }).first()).draft_sections);
  assert.equal(saved.find((s) => s.id === 'evil1'), undefined);
  const prev = await admin.get('/terms?preview=1');
  assert.doesNotMatch(prev.text, /<script>alert\(1\)<\/script>/);
  await admin.post(`/admin/pages/${page.id}/discard`, { json: {} });
});

test('أنواع الأقسام كلها تُعرض بدون أخطاء', async () => {
  const { SECTION_TYPES, newSection } = await import('../src/content/sections.js');
  const page = await db('pages').where({ system_key: 'terms' }).first();
  const sections = Object.keys(SECTION_TYPES).map((t) => newSection(t));
  const d = await admin.post(`/admin/pages/${page.id}/draft`, { json: { sections } });
  assert.equal(d.status, 200, d.text);
  const prev = await admin.get('/terms?preview=1');
  ok(prev, 'كل الأقسام');
  for (const s of sections) assert.match(prev.text, new RegExp(`id="sid-${s.id}"`), `قسم ${s.type}`);
  await admin.post(`/admin/pages/${page.id}/discard`, { json: {} });
});

test('إنشاء صفحة هبوط من قالب، تعديل إعداداتها، نشرها، نسخها وحذفها', async () => {
  const { PAGE_TEMPLATES } = await import('../src/content/templates.js');
  for (const key of Object.keys(PAGE_TEMPLATES)) {
    const r = await admin.post('/admin/pages', { form: { kind: PAGE_TEMPLATES[key].kind === 'landing' ? 'landing' : 'site', template: key, title: `صفحة ${key}` } });
    assert.equal(r.status, 302, `${key}: ${r.text.slice(0, 200)}`);
    assert.match(r.location, /^\/admin\/pages\/\d+$/);
    ok(await admin.get(r.location), `قالب ${key}`);
  }
  const lp = await db('pages').where({ title: 'صفحة lead-gen' }).first();
  assert.equal(lp.kind, 'landing');
  assert.equal(lp.status, 'draft');
  assert.equal((await web.get(`/${lp.slug}`)).status, 404, 'المسودة غير ظاهرة للزوار');

  const set = await admin.post(`/admin/pages/${lp.id}/settings`, {
    json: { title: 'حملة سناب — قضايا تجارية', slug: 'snap-commercial', layout: 'landing', meta_title: 'استشارة قضايا تجارية', meta_description: 'وصف', og_image: '', noindex: true, thank_you_mode: 'redirect', redirect_url: '', head_code: '<script>window.LP_HEAD=1</script>', body_code: '' },
  });
  assert.equal(set.status, 200, set.text);
  assert.equal(set.data.slug, 'snap-commercial');

  const dup = await admin.post('/admin/pages', { json: { title: 'x', slug: 'about', kind: 'landing', template: 'blank' } });
  assert.notEqual(dup.data?.slug, 'about');

  const reserved = await admin.post(`/admin/pages/${lp.id}/settings`, { json: { title: 'x', slug: 'admin' } });
  assert.equal(reserved.status, 422);

  assert.equal((await admin.post(`/admin/pages/${lp.id}/publish`, { json: {} })).status, 200);
  const live = await web.get('/snap-commercial');
  ok(live, 'صفحة الهبوط المنشورة');
  assert.match(live.text, /window\.LP_HEAD=1/);
  assert.match(live.text, /<meta name="robots" content="noindex/);
  assert.doesNotMatch(live.text, /class="site-nav|<nav class="nav/);

  // نموذج صفحة الهبوط يحوّل لصفحة الشكر
  const lead = await web.post('/api/leads', { json: { name: 'تجربة هبوط', phone: '0501234567', page_id: lp.id, ts: Date.now() - 5000, attr: { sccid: 'snap1' } } });
  assert.equal(lead.status, 200, lead.text);
  assert.equal(lead.data.redirect, '/thank-you?lp=snap-commercial');
  assert.equal((await db('leads').where({ id: lead.data.id }).first()).click_type, 'snap');

  // تغيير رابط صفحة منشورة يضيف تحويل 301
  await admin.post(`/admin/pages/${lp.id}/settings`, { json: { title: 'حملة سناب', slug: 'snap-legal', layout: 'landing', noindex: true } });
  const moved = await web.get('/snap-commercial');
  assert.equal(moved.status, 301);
  assert.equal(moved.location.replace(base, ''), '/snap-legal');

  const copy = await admin.post(`/admin/pages/${lp.id}/duplicate`, { form: {} });
  assert.equal(copy.status, 302);
  const copyId = Number(copy.location.split('/').pop());
  assert.ok(copyId && copyId !== lp.id);

  assert.equal((await admin.post(`/admin/pages/${lp.id}/unpublish`, { json: {} })).status, 200);
  assert.equal((await web.get('/snap-legal')).status, 404);
  await admin.post(`/admin/pages/${copyId}/delete`, { form: {} });
  assert.equal(await db('pages').where({ id: copyId }).first(), undefined);

  const sys = await db('pages').where({ system_key: 'home' }).first();
  await admin.post(`/admin/pages/${sys.id}/delete`, { form: {} });
  assert.ok(await db('pages').where({ id: sys.id }).first(), 'لا يمكن حذف صفحات النظام');
});

test('إدارة الخدمات: إضافة، صفحة مستقلة، تعديل الرابط، إخفاء، حذف', async () => {
  const cat = await db('service_categories').where({ slug: 'legal' }).first();
  const missing = await admin.post('/admin/r/services', { json: { values: { category_id: cat.id, title: '' } } });
  assert.equal(missing.status, 422);
  assert.equal(missing.data.field, 'title');

  const r = await admin.post('/admin/r/services', {
    json: { values: { category_id: cat.id, title: 'صياغة العقود التجارية', slug: 'contracts-drafting', summary: 'ملخص الخدمة', body: '<p>تفاصيل <strong>الخدمة</strong></p><script>x()</script>', bullets: 'بند أول\nبند ثان', has_page: true, is_active: true } },
  });
  assert.equal(r.status, 200, r.text);
  const id = r.data.id;
  const page = await web.get('/services/legal/contracts-drafting');
  ok(page, 'صفحة الخدمة الجديدة');
  assert.match(page.text, /صياغة العقود التجارية/);
  assert.match(page.text, /<strong>الخدمة<\/strong>/);
  assert.doesNotMatch(page.text, /<script>x\(\)<\/script>/);
  assert.match((await web.get('/services/legal')).text, /صياغة العقود التجارية/);

  const upd = await admin.post(`/admin/r/services/${id}`, { json: { values: { category_id: cat.id, title: 'صياغة ومراجعة العقود', slug: 'contracts-drafting', has_page: true, is_active: true } } });
  assert.equal(upd.status, 200, upd.text);
  assert.match((await web.get('/services/legal/contracts-drafting')).text, /صياغة ومراجعة العقود/);

  const tog = await admin.post(`/admin/r/services/${id}/toggle`, { json: {} });
  assert.equal(tog.data.active, false);
  assert.equal((await web.get('/services/legal/contracts-drafting')).status, 404);

  const dupl = await admin.post(`/admin/r/services/${id}/duplicate`, { form: {} });
  assert.equal(dupl.status, 302);
  await admin.post(`/admin/r/services/${id}/delete`, { form: {} });
  assert.equal(await db('services').where({ id }).first(), undefined);
});

test('ترتيب العناصر بالسحب', async () => {
  const rows = await db('faqs').orderBy('sort').select('id');
  const ids = rows.map((r) => r.id).reverse();
  const r = await admin.post('/admin/r/faqs/reorder', { json: { ids } });
  assert.equal(r.status, 200);
  const after_ = await db('faqs').orderBy('sort').select('id');
  assert.deepEqual(after_.map((x) => x.id), ids);
});

test('حذف قسم يحتوي خدمات ممنوع', async () => {
  const cat = await db('service_categories').where({ slug: 'judicial' }).first();
  await admin.post(`/admin/r/categories/${cat.id}/delete`, { form: {} });
  assert.ok(await db('service_categories').where({ id: cat.id }).first());
});

test('المقالات: نشر مقال يظهر في المدونة وخريطة الموقع', async () => {
  const r = await admin.post('/admin/r/posts', { json: { values: { title: 'دليل نظام الشركات الجديد', slug: 'companies-law-guide', excerpt: 'مقتطف', body: '<h2>مقدمة</h2><p>نص</p>', status: 'published', author_name: 'فريق إصغاء القانوني' } } });
  assert.equal(r.status, 200, r.text);
  const post = await web.get('/insights/companies-law-guide');
  ok(post, 'صفحة المقال');
  assert.match(post.text, /"@type":\s*"(Article|BlogPosting)"/);
  assert.match((await web.get('/insights')).text, /دليل نظام الشركات الجديد/);
  assert.match((await web.get('/sitemap.xml')).text, /companies-law-guide/);

  const draft = await db('posts').where({ status: 'draft' }).first();
  assert.equal((await web.get(`/insights/${draft.slug}`)).status, 404);
  assert.equal((await admin.get(`/insights/${draft.slug}?preview=1`)).status, 200);
});

test('التحويلات 301 من اللوحة', async () => {
  const bad = await admin.post('/admin/r/redirects', { json: { values: { from_path: '/admin/x', to_url: '/', code: 301, is_active: true } } });
  assert.equal(bad.status, 422);
  const r = await admin.post('/admin/r/redirects', { json: { values: { from_path: 'old-offer/', to_url: '/packages', code: 301, is_active: true } } });
  assert.equal(r.status, 200, r.text);
  const go = await web.get('/old-offer');
  assert.equal(go.status, 301);
  assert.equal(go.location.replace(base, ''), '/packages');
});

test('الطلبات: القائمة، التفاصيل، تغيير الحالة، ملاحظة، تصدير CSV، إجراء جماعي', async () => {
  const lead = await db('leads').first();
  ok(await admin.get(`/admin/leads/${lead.id}`), 'تفاصيل الطلب');
  const u = await admin.post(`/admin/leads/${lead.id}/update`, { json: { status: 'contacted', note: 'تم الاتصال بالعميل', value: '1500' } });
  assert.equal(u.status, 200, u.text);
  const row = await db('leads').where({ id: lead.id }).first();
  assert.equal(row.status, 'contacted');
  assert.equal(Number(row.value), 1500);
  assert.ok(row.contacted_at);
  assert.match((await admin.get(`/admin/leads/${lead.id}`)).text, /تم الاتصال بالعميل/);

  const csv = await admin.get('/admin/leads/export.csv');
  assert.equal(csv.status, 200);
  assert.match(csv.headers.get('content-type'), /csv/);
  assert.equal(csv.buf[0], 0xef, 'BOM لدعم العربية في Excel');

  const ids = (await db('leads').select('id')).map((x) => String(x.id));
  const bulk = await admin.post('/admin/leads/bulk', { form: { ids, action: 'qualified' } });
  assert.equal(bulk.status, 302);
  assert.equal((await db('leads').whereNot({ status: 'qualified' }).count({ n: '*' }))[0].n, 0);
});

// خادم SMTP محلي بسيط يستقبل الرسائل لاختبار إشعارات البريد فعليًا
function smtpSink() {
  const mails = [];
  const server = net.createServer((sock) => {
    let buf = '';
    let data = null;
    let mail = { rcpt: [] };
    let auth = 0;
    const say = (l) => sock.write(`${l}\r\n`);
    say('220 sink ESMTP');
    sock.on('data', (chunk) => {
      buf += chunk.toString('latin1');
      let i;
      while ((i = buf.indexOf('\r\n')) >= 0) {
        const line = buf.slice(0, i);
        buf = buf.slice(i + 2);
        if (data !== null) {
          if (line === '.') { mails.push({ ...mail, raw: Buffer.from(data, 'latin1').toString('utf8') }); data = null; mail = { rcpt: [] }; say('250 queued'); } else data += `${line.startsWith('..') ? line.slice(1) : line}\r\n`;
          continue;
        }
        if (auth) { auth -= 1; say(auth ? '334 UGFzc3dvcmQ6' : '235 ok'); continue; }
        const cmd = line.slice(0, 4).toUpperCase();
        if (cmd === 'EHLO') { say('250-sink'); say('250-AUTH PLAIN LOGIN'); say('250 8BITMIME'); }
        else if (cmd === 'HELO') say('250 sink');
        else if (cmd === 'AUTH') {
          const [, type, arg] = line.split(' ');
          if (/plain/i.test(type)) { if (arg) say('235 ok'); else { auth = 1; say('334 '); } }
          else { auth = 2; say('334 VXNlcm5hbWU6'); }
        }
        else if (cmd === 'MAIL') { mail.from = line; say('250 ok'); }
        else if (cmd === 'RCPT') { mail.rcpt.push(line.replace(/^RCPT TO:\s*/i, '').replace(/[<>]/g, '')); say('250 ok'); }
        else if (cmd === 'DATA') { data = ''; say('354 go'); }
        else if (cmd === 'QUIT') { say('221 bye'); sock.end(); }
        else say('250 ok');
      }
    });
    sock.on('error', () => {});
  });
  return new Promise((resolve) => server.listen(0, '127.0.0.1', () => resolve({ server, mails, port: server.address().port })));
}

// نص الرسالة بعد فك ترميز base64 أو quoted-printable
function mailText(raw) {
  const cut = raw.indexOf('\r\n\r\n');
  const head = raw.slice(0, cut);
  const body = raw.slice(cut + 4);
  if (/content-transfer-encoding:\s*base64/i.test(head)) return head + Buffer.from(body.replace(/\s+/g, ''), 'base64').toString('utf8');
  if (/content-transfer-encoding:\s*quoted-printable/i.test(head)) return head + Buffer.from(body.replace(/=\r?\n/g, '').replace(/=([0-9A-F]{2})/gi, (m, h) => String.fromCharCode(parseInt(h, 16))), 'latin1').toString('utf8');
  return raw;
}

test('فورم التواصل: الطلب يظهر في اللوحة ويصل إشعاره بالبريد', async () => {
  const sink = await smtpSink();
  try {
    const { SETTINGS_GROUPS } = await import('../src/content/settings-schema.js');
    const { getSettings } = await import('../src/lib/settings.js');
    const save = async (key, patch) => {
      const S = await getSettings();
      const group = SETTINGS_GROUPS.find((g) => g.key === key);
      const values = { ...Object.fromEntries(group.fields.filter((f) => f.type !== 'secret').map((f) => [f.name, S[f.name] ?? ''])), ...patch };
      const r = await admin.post(`/admin/settings/${key}`, { json: { values } });
      assert.equal(r.status, 200, r.text);
    };
    await save('smtp', { smtp_host: '127.0.0.1', smtp_port: String(sink.port), smtp_secure: false, smtp_user: 'notify@test.local', smtp_pass: 'smtp-test-pass', smtp_from: 'إصغاء <notify@test.local>' });
    await save('leads', { notify_emails: 'office@test.local, partner@test.local', thank_you_mode: 'redirect' });

    // زر «إرسال رسالة تجريبية» في الإعدادات
    const t = await admin.post('/admin/settings/test-email', { json: { to: 'office@test.local' } });
    assert.equal(t.status, 200, t.text);
    assert.equal(sink.mails.length, 1);
    assert.deepEqual(sink.mails[0].rcpt, ['office@test.local']);

    // زائر يرسل فورم التواصل
    const contact = await db('pages').where({ system_key: 'contact' }).first();
    const r = await web.post('/api/leads', { json: {
      form: 'contact', name: 'عميل تجربة البريد', phone: '0551112233', email: 'client@test.local',
      case_type: 'تأسيس شركة', message: 'أرغب في استشارة حول تأسيس شركة ذات مسؤولية محدودة.', page_id: contact.id, ts: Date.now() - 8000, attr: { utm_source: 'google', utm_campaign: 'brand' },
    } });
    assert.equal(r.status, 200, r.text);
    assert.ok(r.data.id > 0, 'الطلب حُفظ');
    assert.equal(r.data.redirect, '/thank-you');

    // يظهر في قائمة الطلبات وتفاصيله في اللوحة
    const list = await admin.get('/admin/leads');
    assert.match(list.text, /عميل تجربة البريد/);
    const detail = await admin.get(`/admin/leads/${r.data.id}`);
    assert.equal(detail.status, 200);
    assert.match(detail.text, /أرغب في استشارة حول تأسيس شركة/);
    const row = await db('leads').where({ id: r.data.id }).first();
    assert.equal(row.form, 'contact');
    assert.equal(row.utm_source, 'google');

    // ووصل الإشعار بالبريد للعنوانين + رسالة تأكيد للعميل
    for (let i = 0; i < 50 && sink.mails.length < 3; i++) await new Promise((res) => setTimeout(res, 100));
    assert.equal(sink.mails.length, 3, 'لم يصل إشعار الطلب وتأكيد العميل');
    const m = sink.mails.slice(1).find((x) => x.rcpt.includes('office@test.local'));
    assert.ok(m, 'إشعار الفريق');
    assert.deepEqual(m.rcpt.sort(), ['office@test.local', 'partner@test.local']);
    const text = mailText(m.raw);
    assert.match(text, /عميل تجربة البريد/);
    assert.match(text, /أرغب في استشارة حول تأسيس شركة/);
    assert.match(text, new RegExp(`/admin/leads/${r.data.id}`));
    assert.match(text, /email-logo\.png/, 'الشعار في الرسالة');
    assert.match(m.raw, /^Reply-To: client@test\.local/im, 'الرد على الرسالة يذهب للعميل');
    const c = sink.mails.slice(1).find((x) => x.rcpt.includes('client@test.local'));
    assert.ok(c, 'تأكيد العميل');
    assert.match(mailText(c.raw), /استلمنا طلبك/);
  } finally {
    sink.server.close();
  }
});

test('الإعدادات العامة تنعكس على الموقع', async () => {
  const { SETTINGS_GROUPS } = await import('../src/content/settings-schema.js');
  const { getSettings } = await import('../src/lib/settings.js');
  const S = await getSettings();
  const group = SETTINGS_GROUPS.find((g) => g.key === 'general');
  const values = Object.fromEntries(group.fields.map((f) => [f.name, S[f.name] ?? '']));
  values.phone = '0112223333';
  values.working_hours = 'الأحد – الخميس · ٨ص – ٤م';
  const r = await admin.post('/admin/settings/general', { json: { values } });
  assert.equal(r.status, 200, r.text);
  const home = await web.get('/contact');
  assert.match(home.text, /0112223333/);
  assert.match(home.text, /٨ص – ٤م/);
});

test('أكواد التتبع: تظهر للزوار ولا تظهر في المعاينة', async () => {
  const { SETTINGS_GROUPS } = await import('../src/content/settings-schema.js');
  const { getSettings } = await import('../src/lib/settings.js');
  const S = await getSettings();
  const group = SETTINGS_GROUPS.find((g) => g.key === 'marketing');
  const values = Object.fromEntries(group.fields.filter((f) => f.type !== 'secret').map((f) => [f.name, S[f.name] ?? '']));
  values.gtm_id = 'GTM-TEST123';
  values.meta_pixel_id = '1234567890';
  values.meta_capi_token = 'secret-token-value';
  const r = await admin.post('/admin/marketing', { json: { values } });
  assert.equal(r.status, 200, r.text);
  const S2 = await getSettings();
  assert.equal(S2.meta_capi_token, 'secret-token-value');
  const home = await web.get('/');
  assert.match(home.text, /GTM-TEST123/);
  assert.match(home.text, /1234567890/);
  assert.doesNotMatch(home.text, /secret-token-value/);
  const prev = await admin.get('/?preview=1');
  assert.doesNotMatch(prev.text, /GTM-TEST123/);
  const mk = await admin.get('/admin/marketing');
  ok(mk, 'صفحة التسويق');
  assert.doesNotMatch(mk.text, /secret-token-value/, 'لا تُعرض القيم السرية في اللوحة');

  // حفظ بدون إدخال قيمة سرية جديدة يحتفظ بالقديمة
  delete values.meta_capi_token;
  await admin.post('/admin/marketing', { json: { values } });
  assert.equal((await getSettings()).meta_capi_token, 'secret-token-value');
});

test('رفع الوسائط وربط صورة بخانة في الموقع', async () => {
  const fd = new FormData();
  fd.append('files', new Blob([PNG_1PX], { type: 'image/png' }), 'Hero Image.png');
  const up = await admin.post('/admin/media/upload', { multipart: fd });
  assert.equal(up.status, 200, up.text);
  const item = up.data.items[0];
  assert.match(item.url, /^\/uploads\/\d{4}\/\d{2}\/hero-image-[a-f0-9]+\.png$/);
  assert.equal((await web.get(item.url)).status, 200);

  const bad = new FormData();
  bad.append('files', new Blob(['<html>'], { type: 'text/html' }), 'x.html');
  assert.equal((await admin.post('/admin/media/upload', { multipart: bad })).status, 422);

  const slot = await admin.post('/admin/media/slots/home_hero', { json: { url: item.url } });
  assert.equal(slot.status, 200, slot.text);
  assert.match((await web.get('/')).text, new RegExp(item.url.replace(/\//g, '\\/')));
  const evil = await admin.post('/admin/media/slots/home_hero', { json: { url: 'javascript:alert(1)' } });
  assert.equal(evil.status, 422);

  const lib = await admin.get('/admin/media?format=json');
  assert.equal(lib.data.rows.length, 1);
  assert.equal((await admin.post(`/admin/media/${item.id}/alt`, { json: { alt: 'نص بديل' } })).status, 200);
  await admin.post(`/admin/media/${item.id}/delete`, { json: {} });
  assert.equal(await db('media').where({ id: item.id }).first(), undefined);
});

test('المستخدمون والصلاحيات', async () => {
  const create = await admin.post('/admin/users', { form: { name: 'محرر المحتوى', email: 'editor@test.local', role: 'editor', password: 'Editor#Test-2026' } });
  assert.equal(create.status, 302);
  assert.ok(await db('users').where({ email: 'editor@test.local' }).first());

  const weak = await admin.post('/admin/users', { form: { name: 'ضعيف', email: 'weak@test.local', role: 'editor', password: '123' } });
  assert.equal(weak.status, 302);
  assert.equal(await db('users').where({ email: 'weak@test.local' }).first(), undefined);

  const ed = new Client(base);
  await ed.login('editor@test.local', 'Editor#Test-2026');
  ok(await ed.get('/admin'), 'لوحة المحرر');
  ok(await ed.get('/admin/r/services'), 'المحرر: الخدمات');
  for (const u of ['/admin/settings/general', '/admin/users', '/admin/system', '/admin/marketing']) {
    assert.equal((await ed.get(u)).status, 403, `المحرر لا يصل إلى ${u}`);
  }
  // المحرر لا يستطيع إضافة أكواد للصفحات
  const page = await db('pages').where({ system_key: 'about' }).first();
  const boot = bootOf((await ed.get(`/admin/pages/${page.id}`)).text);
  assert.equal(boot.allowCode, false);
  await ed.post(`/admin/pages/${page.id}/settings`, { json: { title: page.title, head_code: '<script>evil()</script>' } });
  const settings = JSON.parse((await db('pages').where({ id: page.id }).first()).settings || '{}');
  assert.notEqual(settings.head_code, '<script>evil()</script>');

  const owner = await db('users').where({ email: OWNER.email }).first();
  await admin.post(`/admin/users/${owner.id}/delete`, { form: {} });
  assert.ok(await db('users').where({ id: owner.id }).first(), 'لا يحذف المستخدم نفسه');

  const editor = await db('users').where({ email: 'editor@test.local' }).first();
  await admin.post(`/admin/users/${editor.id}`, { form: { name: 'محرر', email: 'editor@test.local', role: 'editor', is_active: '0' } });
  assert.equal((await ed.get('/admin')).status, 302, 'الحساب الموقوف يُخرج فورًا');
});

test('تغيير كلمة المرور يُنهي الجلسات الأخرى', async () => {
  const c = new Client(base);
  await admin.post('/admin/users', { form: { name: 'مسوّق', email: 'mk@test.local', role: 'marketer', password: 'Market#Test-2026' } });
  await c.login('mk@test.local', 'Market#Test-2026');
  const other = new Client(base);
  await other.login('mk@test.local', 'Market#Test-2026');
  ok(await c.get('/admin/marketing'), 'المسوّق: التسويق');
  assert.equal((await c.get('/admin/r/services')).status, 403);
  const r = await c.post('/admin/users/me', { form: { name: 'مسوّق', current_password: 'Market#Test-2026', new_password: 'Market#New-2026', confirm_password: 'Market#New-2026' } });
  assert.equal(r.status, 302);
  assert.equal((await other.get('/admin')).status, 302, 'الجلسة القديمة انتهت');
  ok(await c.get('/admin'), 'الجلسة الحالية مستمرة');
});

test('النسخ الاحتياطي والسجل والذاكرة المؤقتة', async () => {
  const b = await admin.post('/admin/system/backup', { form: {} });
  assert.equal(b.status, 302);
  const sys = await admin.get('/admin/system');
  ok(sys, 'صفحة النظام');
  const name = sys.text.match(/isgha-backup-[\w-]+\.json/)[0];
  const dl = await admin.get(`/admin/system/backup/${name}`);
  assert.equal(dl.status, 200);
  const data = JSON.parse(dl.text);
  assert.equal(data.app, 'isgha');
  assert.ok(data.tables.pages.length >= 12);
  assert.equal((await admin.get('/admin/system/backup/..%2F..%2F.env')).status, 404);
  assert.equal((await admin.post('/admin/system/cache', { form: {} })).status, 302);
  const act = await admin.get('/admin/system/activity');
  ok(act, 'سجل النشاط');
});

test('تسجيل الخروج', async () => {
  const r = await admin.post('/admin/logout', { form: {} });
  assert.equal(r.status, 302);
  assert.equal((await admin.get('/admin')).status, 302);
});
