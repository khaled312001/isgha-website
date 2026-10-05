// أدوات الاختبار: قاعدة بيانات اختبار نظيفة + تشغيل التطبيق + عميل HTTP يحفظ الكوكيز
import os from 'node:os';
import fs from 'node:fs';
import path from 'node:path';

// تُضبط قبل تحميل أي ملف من التطبيق (dotenv لا يستبدل القيم الموجودة)
process.env.DB_NAME = process.env.TEST_DB_NAME || 'isgha_test';
process.env.NODE_ENV = 'test';
process.env.ALLOW_INDEXING = 'false';
process.env.FORCE_HTTPS = 'false';
process.env.ADMIN_EMAIL = '';
process.env.ADMIN_PASSWORD = '';
const TMP = fs.mkdtempSync(path.join(os.tmpdir(), 'isgha-test-'));
process.env.UPLOADS_DIR = path.join(TMP, 'uploads');
process.env.BACKUPS_DIR = path.join(TMP, 'backups');

export const OWNER = { email: 'owner@test.local', password: 'Owner#Test-2026', name: 'مالك الاختبار' };

let server;
let db;
let app;

export async function startApp() {
  if (!/_test$/.test(process.env.DB_NAME)) throw new Error('قاعدة الاختبار يجب أن ينتهي اسمها بـ _test');
  db = (await import('../src/db.js')).default;
  // تفريغ قاعدة الاختبار بالكامل ثم بناؤها من الصفر
  const [tables] = await db.raw('SELECT table_name AS t FROM information_schema.tables WHERE table_schema = DATABASE()');
  await db.raw('SET FOREIGN_KEY_CHECKS = 0');
  for (const { t } of tables) await db.schema.dropTableIfExists(t);
  await db.raw('SET FOREIGN_KEY_CHECKS = 1');
  await db.migrate.latest();
  const { seedAll } = await import('../db/seed.js');
  await seedAll({ force: true });
  const { hashPassword } = await import('../src/lib/auth.js');
  await db('users').insert({ name: OWNER.name, email: OWNER.email, password_hash: await hashPassword(OWNER.password), role: 'owner', is_active: true });
  const { createApp } = await import('../src/app.js');
  app = createApp();
  await new Promise((resolve) => { server = app.listen(0, '127.0.0.1', resolve); });
  return { base: `http://127.0.0.1:${server.address().port}`, db };
}

export async function stopApp() {
  server?.closeAllConnections?.();
  await new Promise((resolve) => (server ? server.close(resolve) : resolve()));
  await app?.locals.sessionStore?.close().catch(() => {});
  const { flushAnalytics } = await import('../src/lib/analytics.js');
  await flushAnalytics().catch(() => {});
  await db?.destroy();
  fs.rmSync(TMP, { recursive: true, force: true });
}

export class Client {
  constructor(base) {
    this.base = base;
    this.cookies = new Map();
    this.csrf = '';
  }

  async req(method, url, { json, form, multipart, headers = {} } = {}) {
    const h = { ...headers };
    if (this.cookies.size) h.cookie = [...this.cookies].map(([k, v]) => `${k}=${v}`).join('; ');
    let body;
    if (json !== undefined) {
      h['content-type'] = 'application/json';
      h.accept = 'application/json';
      if (this.csrf) h['x-csrf-token'] = this.csrf;
      body = JSON.stringify(json);
    } else if (form) {
      h['content-type'] = 'application/x-www-form-urlencoded';
      const p = new URLSearchParams();
      p.append('_csrf', this.csrf);
      for (const [k, v] of Object.entries(form)) (Array.isArray(v) ? v : [v]).forEach((x) => p.append(k, x));
      body = p.toString();
    } else if (multipart) {
      if (this.csrf) h['x-csrf-token'] = this.csrf;
      h.accept = 'application/json';
      body = multipart;
    }
    const res = await fetch(this.base + url, { method, headers: h, body, redirect: 'manual' });
    for (const c of res.headers.getSetCookie()) {
      const [kv] = c.split(';');
      const i = kv.indexOf('=');
      const v = kv.slice(i + 1);
      if (!v || /expires=Thu, 01 Jan 1970/i.test(c)) this.cookies.delete(kv.slice(0, i));
      else this.cookies.set(kv.slice(0, i), v);
    }
    const buf = Buffer.from(await res.arrayBuffer());
    const text = buf.toString('utf8');
    let data = null;
    if ((res.headers.get('content-type') || '').includes('json')) {
      try { data = JSON.parse(text); } catch { data = null; }
    }
    const m = text.match(/<meta name="csrf" content="([^"]+)"/) || text.match(/name="_csrf" value="([^"]+)"/);
    if (m) this.csrf = m[1];
    return { status: res.status, headers: res.headers, text, data, buf, location: res.headers.get('location') };
  }

  get(url, o) { return this.req('GET', url, o); }

  post(url, o) { return this.req('POST', url, o); }

  async login(email = OWNER.email, password = OWNER.password) {
    await this.get('/admin/login');
    const r = await this.post('/admin/login', { form: { email, password, next: '/admin' } });
    if (r.status !== 302) throw new Error(`فشل الدخول (${r.status})`);
    await this.get('/admin'); // يحدّث رمز CSRF بعد تجديد الجلسة
    return r;
  }
}

// يتحقق أن الصفحة لا تحتوي آثار أخطاء في القوالب (undefined أو [object Object] في النص الظاهر)
export function templateLeaks(html) {
  const visible = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, '')
    .replace(/<style\b[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');
  const out = [];
  for (const re of [/\bundefined\b/, /\[object Object\]/, /\bNaN\b/, /Template render error/i, /\{\{|\}\}|\{%|%\}/]) {
    const m = visible.match(re);
    if (m) out.push(visible.slice(Math.max(0, m.index - 80), m.index + 80).replace(/\s+/g, ' '));
  }
  return out;
}

// صورة PNG صغيرة صالحة (1×1) للاختبار
export const PNG_1PX = Buffer.from('89504e470d0a1a0a0000000d49484452000000010000000108060000001f15c4890000000d49444154789c6360f8cfc0f01f0005000201a3d3c2d00000000049454e44ae426082', 'hex');
