import nunjucks from 'nunjucks';
import path from 'node:path';
import config, { ROOT } from '../config.js';
import { markup, plain, lines, splitLead, arDigits, arDate, relTime, truncate, escapeHtml } from './text.js';
import { telHref, waHref, prettyPhone } from './phone.js';
import { IMAGE_FOCUS } from '../content/image-slots.js';

export function setupViews(app) {
  const env = nunjucks.configure(path.join(ROOT, 'src', 'views'), {
    autoescape: true,
    express: app,
    noCache: !config.isProd,
    throwOnUndefined: false,
    trimBlocks: true,
    lstripBlocks: true,
  });
  app.set('view engine', 'njk');

  const safe = (s) => new nunjucks.runtime.SafeString(s);
  const v = config.assetVersion;

  env.addFilter('markup', (s) => safe(markup(s)));
  env.addFilter('plain', (s) => plain(s));
  env.addFilter('lines', (s) => lines(s));
  // قائمة روابط قابلة للتعديل من اللوحة: سطر لكل رابط بالشكل «النص | الرابط»
  env.addFilter('links', (v) => (Array.isArray(v) ? v : lines(v)).map((row) => {
    const [label, url] = String(row || '').split('|').map((x) => x.trim());
    return label ? { label, url: url || '#' } : null;
  }).filter(Boolean));
  env.addFilter('lead', (s) => splitLead(s));
  env.addFilter('ar', (s) => arDigits(s));
  env.addFilter('date', (d, withTime) => arDate(d, withTime));
  env.addFilter('rel', (d) => relTime(d));
  env.addFilter('truncate_ar', (s, n) => truncate(s, n));
  env.addFilter('tel', (s) => telHref(s));
  env.addFilter('wa', (n, msg) => waHref(n, msg));
  env.addFilter('pretty_phone', (s) => prettyPhone(s));
  env.addFilter('json', (o) => safe(JSON.stringify(o ?? null).replace(/</g, '\\u003c').replace(/>/g, '\\u003e').replace(/&/g, '\\u0026').replace(/\u2028/g, '\\u2028').replace(/\u2029/g, '\\u2029')));
  env.addFilter('pad2', (n) => arDigits(String(n).padStart(2, '0')));
  env.addFilter('some', (arr, attr, val) => (Array.isArray(arr) ? arr.some((x) => x && x[attr] === val) : false));
  env.addFilter('count_by', (arr, attr) => (Array.isArray(arr) ? arr.filter((x) => x && x[attr]).length : 0));
  env.addFilter('bytes', (n) => {
    const b = Number(n) || 0;
    if (b < 1024) return `${b} B`;
    if (b < 1048576) return `${(b / 1024).toFixed(0)} KB`;
    return `${(b / 1048576).toFixed(1)} MB`;
  });
  env.addFilter('year', (s) => String(s ?? '').replace('{year}', new Date().getFullYear()));

  // أيقونة من ملف الـ sprite
  env.addGlobal('icon', (name, cls = '') => safe(`<svg class="i ${escapeHtml(cls)}" aria-hidden="true" focusable="false"><use href="/img/icons.svg?v=${v}#i-${escapeHtml(name || 'circle-dot')}"></use></svg>`));
  env.addGlobal('asset', (p) => `${p}${p.includes('?') ? '&' : '?'}v=${v}`);
  env.addGlobal('now', () => new Date());
  env.addGlobal('imgPos', (src) => IMAGE_FOCUS[src] || '');
  env.addGlobal('range', (a, b) => Array.from({ length: b - a }, (_, i) => a + i));
  return env;
}
