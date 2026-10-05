// نقطة التشغيل — Hostinger (Passenger) يشغّل هذا الملف مباشرة
import http from 'node:http';
import config from './src/config.js';
import db from './src/db.js';
import { createApp } from './src/app.js';
import { startAnalyticsFlusher, flushAnalytics } from './src/lib/analytics.js';
import { ensureSeeded } from './db/seed.js';

async function prepareDb() {
  if (!config.autoMigrate) return;
  try {
    const [, done] = await db.migrate.latest();
    if (done.length) console.log('[db] migrations applied:', done.join(', '));
    await ensureSeeded();
  } catch (e) {
    console.error('[db] migration failed:', e.message);
  }
}

function boot() {
  // نبدأ الاستماع فورًا (Hostinger ينتظر listen خلال 3 ثوانٍ) والطلبات تنتظر اكتمال تجهيز القاعدة
  const ready = prepareDb();
  const app = createApp();
  startAnalyticsFlusher();
  const server = http.createServer((req, res) => { ready.then(() => app(req, res)); });
  server.listen(config.port, () => {
    console.log(`[isgha] running on port ${config.port} (${config.isProd ? 'production' : 'development'})`);
  });
  const shutdown = async () => {
    server.close();
    await flushAnalytics().catch(() => {});
    await db.destroy().catch(() => {});
    process.exit(0);
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

boot();
