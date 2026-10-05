import path from 'node:path';
import fs from 'node:fs';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

export const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

dotenv.config({ path: path.join(ROOT, '.env'), quiet: true });

const env = process.env;
const bool = (v, d = false) => (v === undefined || v === '' ? d : ['1', 'true', 'yes', 'on'].includes(String(v).toLowerCase()));

const isProd = env.NODE_ENV === 'production';

function resolveDir(p, fallback) {
  const dir = p ? (path.isAbsolute(p) ? p : path.join(ROOT, p)) : path.join(ROOT, fallback);
  fs.mkdirSync(dir, { recursive: true });
  return dir;
}

// Hostinger يضع بيانات القاعدة كـ DB_HOST/DB_NAME... أو DATABASE_URL
function dbFromEnv() {
  if (env.DATABASE_URL) {
    const u = new URL(env.DATABASE_URL);
    return {
      host: u.hostname,
      port: Number(u.port || 3306),
      user: decodeURIComponent(u.username),
      password: decodeURIComponent(u.password),
      database: u.pathname.replace(/^\//, ''),
    };
  }
  return {
    host: env.DB_HOST || '127.0.0.1',
    port: Number(env.DB_PORT || 3306),
    user: env.DB_USER || 'root',
    password: env.DB_PASSWORD || '',
    database: env.DB_NAME || 'isgha',
  };
}

const config = {
  isProd,
  port: Number(env.PORT || 3000),
  siteUrl: (env.SITE_URL || 'http://localhost:3000').replace(/\/$/, ''),
  sessionSecret: env.SESSION_SECRET || (isProd ? '' : 'dev-only-secret-change-me'),
  // عدد البروكسيات أمام التطبيق (LiteSpeed في Hostinger = 1). لا نستخدم true حتى لا يُزوَّر عنوان IP
  trustProxy: (() => {
    const v = String(env.TRUST_PROXY ?? '1').trim().toLowerCase();
    if (['false', '0', 'no', 'off', ''].includes(v)) return false;
    if (v === 'true') return 1;
    return /^\d+$/.test(v) ? Number(v) : v;
  })(),
  autoMigrate: bool(env.AUTO_MIGRATE, true),
  // على الدومين التجريبي نمنع الأرشفة حتى لا تتكرر النتائج في جوجل
  allowIndexing: bool(env.ALLOW_INDEXING, false),
  db: dbFromEnv(),
  uploadsDir: resolveDir(env.UPLOADS_DIR, 'storage/uploads'),
  backupsDir: resolveDir(env.BACKUPS_DIR, 'storage/backups'),
  smtp: {
    host: env.SMTP_HOST || '',
    port: Number(env.SMTP_PORT || 465),
    secure: bool(env.SMTP_SECURE, true),
    user: env.SMTP_USER || '',
    pass: env.SMTP_PASS || '',
    from: env.SMTP_FROM || '',
  },
  assetVersion: env.ASSET_VERSION || String(Math.floor(Date.now() / 1000)),
};

if (isProd && !config.sessionSecret) {
  throw new Error('SESSION_SECRET is required in production (.env)');
}

export default config;
