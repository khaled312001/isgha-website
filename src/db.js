import knexFactory from 'knex';
import path from 'node:path';
import config, { ROOT } from './config.js';

const db = knexFactory({
  client: 'mysql2',
  connection: {
    ...config.db,
    charset: 'utf8mb4',
    timezone: 'Z',
    dateStrings: false,
    supportBigNumbers: true,
  },
  pool: {
    min: 0,
    max: Number(process.env.DB_POOL_MAX || 5),
    idleTimeoutMillis: 30000,
    // كل الأوقات في القاعدة بتوقيت UTC، والعرض بتوقيت الرياض
    afterCreate(conn, done) {
      conn.query("SET time_zone = '+00:00'", (err) => done(err, conn));
    },
  },
  acquireConnectionTimeout: 15000,
  migrations: {
    directory: path.join(ROOT, 'db', 'migrations'),
    tableName: 'knex_migrations',
    loadExtensions: ['.js'],
  },
});

export default db;

// يحوّل نص JSON المخزَّن إلى كائن بأمان
export function parseJSON(value, fallback = null) {
  if (value === null || value === undefined || value === '') return fallback;
  if (typeof value === 'object') return value;
  try {
    return JSON.parse(value);
  } catch {
    return fallback;
  }
}

export function toJSON(value) {
  return value === undefined ? null : JSON.stringify(value);
}

export function now() {
  return new Date();
}
