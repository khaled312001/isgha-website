// إحصاءات زيارات خفيفة من طرف أول، تُجمَّع في الذاكرة وتُكتب للقاعدة كل ١٥ ثانية
import db from '../db.js';
import { riyadhDay } from './text.js';

export const BOT = /bot|crawl|spider|slurp|facebookexternalhit|preview|monitor|curl|wget|python|headless|lighthouse|pingdom|uptime/i;
const views = new Map();
const events = new Map();

function device(ua) {
  if (/ipad|tablet/i.test(ua)) return 'tablet';
  if (/mobi|android|iphone/i.test(ua)) return 'mobile';
  return 'desktop';
}

function sourceOf(req) {
  const q = req.query || {};
  if (q.utm_source) return String(q.utm_source).toLowerCase().slice(0, 60);
  if (q.gclid || q.gbraid || q.wbraid) return 'google-ads';
  if (q.fbclid) return 'facebook';
  if (q.ttclid) return 'tiktok';
  if (q.ScCid || q.sccid) return 'snapchat';
  const ref = req.get('referer');
  if (!ref) return 'direct';
  try {
    const host = new URL(ref).hostname.replace(/^www\./, '');
    if (host === req.hostname.replace(/^www\./, '')) return 'internal';
    if (/google\./.test(host)) return 'google';
    if (/bing\./.test(host)) return 'bing';
    if (/(facebook|fb)\./.test(host)) return 'facebook';
    if (/instagram\./.test(host)) return 'instagram';
    if (/(t\.co|twitter|x\.com)/.test(host)) return 'x';
    if (/snapchat/.test(host)) return 'snapchat';
    if (/tiktok/.test(host)) return 'tiktok';
    if (/linkedin|lnkd/.test(host)) return 'linkedin';
    if (/whatsapp|wa\.me/.test(host)) return 'whatsapp';
    return host.slice(0, 60);
  } catch {
    return 'direct';
  }
}

export function trackView(req, res) {
  const ua = req.get('user-agent') || '';
  if (!ua || BOT.test(ua)) return;
  const day = riyadhDay();
  let source = sourceOf(req);
  // الزيارة الداخلية تُحسب بمصدرها الأول المحفوظ في الجلسة
  if (source === 'internal') source = req.cookies?.isrc || 'direct';
  else if (req.cookies?.isrc !== source) res.cookie('isrc', source, { maxAge: 30 * 60 * 1000, httpOnly: true, sameSite: 'lax' });
  const unique = req.cookies?.ivd !== day;
  if (unique) res.cookie('ivd', day, { maxAge: 2 * 24 * 3600 * 1000, httpOnly: true, sameSite: 'lax' });
  let p;
  try { p = decodeURIComponent(req.path); } catch { p = req.path; }
  p = p.slice(0, 250) || '/';
  const key = [day, p, source, device(ua)].join('\u0001');
  const cur = views.get(key) || { views: 0, uniques: 0 };
  cur.views += 1;
  if (unique) cur.uniques += 1;
  views.set(key, cur);
}

export function trackEvent(type, p = '') {
  const key = [riyadhDay(), type, String(p).slice(0, 250)].join('\u0001');
  events.set(key, (events.get(key) || 0) + 1);
}

let flushing = false;
export async function flushAnalytics() {
  if (flushing || (!views.size && !events.size)) return;
  flushing = true;
  const v = [...views.entries()];
  const e = [...events.entries()];
  views.clear();
  events.clear();
  try {
    for (const [key, c] of v) {
      const [day, p, source, dev] = key.split('\u0001');
      await db.raw(
        'INSERT INTO analytics_daily (day, path, source, device, views, uniques) VALUES (?, ?, ?, ?, ?, ?) ON DUPLICATE KEY UPDATE views = views + VALUES(views), uniques = uniques + VALUES(uniques)',
        [day, p, source, dev, c.views, c.uniques],
      );
    }
    for (const [key, count] of e) {
      const [day, type, p] = key.split('\u0001');
      await db.raw('INSERT INTO events_daily (day, type, path, count) VALUES (?, ?, ?, ?) ON DUPLICATE KEY UPDATE count = count + VALUES(count)', [day, type, p, count]);
    }
  } catch (err) {
    console.error('[analytics] flush failed:', err.message);
  } finally {
    flushing = false;
  }
}

let timer = null;
export function startAnalyticsFlusher() {
  if (timer) return;
  timer = setInterval(flushAnalytics, 15000);
  timer.unref?.();
  const stop = async () => {
    await flushAnalytics();
  };
  process.once('beforeExit', stop);
}
