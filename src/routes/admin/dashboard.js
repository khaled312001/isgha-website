// الرئيسية والتقارير
import { Router } from 'express';
import db from '../../db.js';
import config from '../../config.js';
import { can, requirePerm } from '../../lib/auth.js';
import { IMAGE_SLOTS } from '../../content/image-slots.js';
import { riyadhDay, arDigits } from '../../lib/text.js';
import { wrap, leadSource, LEAD_STATUSES, LEAD_STATUS_MAP } from './util.js';

const router = Router();
const RIYADH_DAY = "DATE(CONVERT_TZ(created_at, '+00:00', '+03:00'))";

function dayList(n) {
  const out = [];
  const today = new Date(`${riyadhDay()}T00:00:00Z`);
  for (let i = n - 1; i >= 0; i -= 1) out.push(new Date(today.getTime() - i * 86400000).toISOString().slice(0, 10));
  return out;
}

function sinceDate(days) {
  // بداية اليوم بتوقيت الرياض قبل n يوم (بالـ UTC)
  const start = new Date(`${riyadhDay()}T00:00:00+03:00`);
  return new Date(start.getTime() - (days - 1) * 86400000);
}

const dstr = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));

async function leadsCount(from, to = null) {
  const q = db('leads').where('created_at', '>=', from).whereNot('status', 'spam');
  if (to) q.andWhere('created_at', '<', to);
  const [{ n }] = await q.count({ n: '*' });
  return Number(n);
}

router.get('/', wrap(async (req, res) => {
  const u = req.user;
  const S = res.locals.S;
  const days = dayList(30);
  const from30 = sinceDate(30);
  const prev30 = new Date(from30.getTime() - 30 * 86400000);
  const data = { days };

  if (can(u, 'leads')) {
    const [today, week, month, prevMonth, byStatus, recent, perDay, srcRows] = await Promise.all([
      leadsCount(sinceDate(1)),
      leadsCount(sinceDate(7)),
      leadsCount(from30),
      leadsCount(prev30, from30),
      db('leads').select('status').count({ n: '*' }).groupBy('status'),
      db('leads').orderBy('id', 'desc').limit(8),
      db('leads').select(db.raw(`${RIYADH_DAY} as d`)).count({ n: '*' }).where('created_at', '>=', from30).whereNot('status', 'spam').groupByRaw(RIYADH_DAY),
      db('leads').select('click_type', 'utm_source', 'utm_medium', 'referrer').where('created_at', '>=', from30).whereNot('status', 'spam'),
    ]);
    const statusMap = Object.fromEntries(byStatus.map((r) => [r.status, Number(r.n)]));
    const perDayMap = Object.fromEntries(perDay.map((r) => [dstr(r.d), Number(r.n)]));
    const sources = {};
    for (const l of srcRows) { const k = leadSource(l); sources[k] = (sources[k] || 0) + 1; }
    data.leads = {
      today, week, month, prevMonth,
      trend: prevMonth ? Math.round(((month - prevMonth) / prevMonth) * 100) : null,
      statuses: LEAD_STATUSES.map(([k, l, c]) => ({ key: k, label: l, color: c, n: statusMap[k] || 0 })),
      recent: recent.map((l) => ({ ...l, source: leadSource(l), st: LEAD_STATUS_MAP[l.status] })),
      series: days.map((d) => perDayMap[d] || 0),
      sources: Object.entries(sources).sort((a, b) => b[1] - a[1]).slice(0, 6),
    };
  }

  if (can(u, 'analytics')) {
    const fromDay = days[0];
    const [viewsPerDay, topPages, events] = await Promise.all([
      db('analytics_daily').select('day').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('day'),
      db('analytics_daily').select('path').sum({ v: 'views' }).where('day', '>=', fromDay).groupBy('path').orderBy('v', 'desc').limit(6),
      db('events_daily').select('type').sum({ n: 'count' }).where('day', '>=', fromDay).groupBy('type'),
    ]);
    const vMap = Object.fromEntries(viewsPerDay.map((r) => [dstr(r.day), { v: Number(r.v), u: Number(r.u) }]));
    const ev = Object.fromEntries(events.map((r) => [r.type, Number(r.n)]));
    const totalViews = viewsPerDay.reduce((a, r) => a + Number(r.v), 0);
    const totalUniques = viewsPerDay.reduce((a, r) => a + Number(r.u), 0);
    data.traffic = {
      views: totalViews, uniques: totalUniques,
      series: days.map((d) => vMap[d]?.v || 0),
      topPages: topPages.map((p) => ({ path: p.path, v: Number(p.v) })),
      calls: ev.call_click || 0, whatsapp: ev.whatsapp_click || 0, formStarts: ev.form_start || 0,
      conv: totalUniques && data.leads ? ((data.leads.month / totalUniques) * 100).toFixed(1) : null,
    };
  }

  // قائمة تجهيز الموقع قبل الإطلاق
  const imagesDone = IMAGE_SLOTS.filter((s) => S[`img_${s.key}`]).length;
  const [{ n: postsN }] = await db('posts').where({ status: 'published' }).count({ n: '*' });
  const [{ n: testiN }] = await db('testimonials').where({ is_active: true }).count({ n: '*' });
  data.checklist = [
    { done: imagesDone === IMAGE_SLOTS.length, label: `رفع صور الموقع (${arDigits(imagesDone)} من ${arDigits(IMAGE_SLOTS.length)})`, url: '/admin/media/slots', perm: 'media' },
    { done: Boolean(S.notify_emails && (S.smtp_user || config.smtp.user)), label: 'ضبط بريد استقبال إشعارات الطلبات (SMTP)', url: '/admin/settings/smtp', perm: 'settings' },
    { done: Boolean(S.gtm_id || S.ga4_id), label: 'ربط Google Analytics أو Tag Manager', url: '/admin/marketing', perm: 'marketing' },
    { done: Boolean(S.meta_pixel_id || S.tiktok_pixel_id || S.snap_pixel_id || S.google_ads_id), label: 'ربط بكسل الإعلانات (ميتا / سناب / تيك توك / جوجل)', url: '/admin/marketing', perm: 'marketing' },
    { done: Boolean(S.google_verification), label: 'التحقق من الموقع في Google Search Console', url: '/admin/seo', perm: 'seo' },
    { done: Boolean(S.map_link), label: 'إضافة رابط الموقع على خرائط جوجل', url: '/admin/settings/general', perm: 'settings' },
    { done: Number(testiN) > 0, label: 'إضافة آراء عملاء حقيقية وتفعيلها', url: '/admin/r/testimonials', perm: 'content' },
    { done: Number(postsN) > 0, label: 'نشر أول مقال في المعرفة القانونية', url: '/admin/r/posts', perm: 'posts' },
    { done: config.allowIndexing, label: 'فتح الأرشفة لمحركات البحث بعد ربط الدومين (ALLOW_INDEXING=true)', url: '/admin/seo', perm: 'seo' },
  ].filter((c) => can(u, c.perm));

  res.render('admin/dashboard.njk', { title: 'الرئيسية', active: 'dashboard', data });
}));

// ─── التقارير ───
router.get('/analytics', requirePerm('analytics'), wrap(async (req, res) => {
  const range = [7, 30, 90, 365].includes(Number(req.query.d)) ? Number(req.query.d) : 30;
  const days = dayList(range);
  const fromDay = days[0];
  const from = sinceDate(range);

  const [perDay, sources, devices, pages, events, eventsByPath, leadsPerDay, leadRows, landing, notFound] = await Promise.all([
    db('analytics_daily').select('day').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('day'),
    db('analytics_daily').select('source').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('source').orderBy('v', 'desc').limit(15),
    db('analytics_daily').select('device').sum({ v: 'views' }).where('day', '>=', fromDay).groupBy('device'),
    db('analytics_daily').select('path').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('path').orderBy('v', 'desc').limit(25),
    db('events_daily').select('type').sum({ n: 'count' }).where('day', '>=', fromDay).groupBy('type'),
    db('events_daily').select('type', 'path').sum({ n: 'count' }).where('day', '>=', fromDay).whereIn('type', ['lead', 'form_start', 'call_click', 'whatsapp_click']).groupBy('type', 'path'),
    db('leads').select(db.raw(`${RIYADH_DAY} as d`)).count({ n: '*' }).where('created_at', '>=', from).whereNot('status', 'spam').groupByRaw(RIYADH_DAY),
    db('leads').select('click_type', 'utm_source', 'utm_medium', 'utm_campaign', 'referrer', 'status').where('created_at', '>=', from).whereNot('status', 'spam'),
    db('pages').where({ kind: 'landing' }).select('id', 'slug', 'title', 'status'),
    db('events_daily').select('path').sum({ n: 'count' }).where('day', '>=', fromDay).andWhere({ type: '404' }).groupBy('path').orderBy('n', 'desc').limit(15),
  ]);

  const vMap = Object.fromEntries(perDay.map((r) => [dstr(r.day), { v: Number(r.v), u: Number(r.u) }]));
  const lMap = Object.fromEntries(leadsPerDay.map((r) => [dstr(r.d), Number(r.n)]));
  const ev = Object.fromEntries(events.map((r) => [r.type, Number(r.n)]));
  const byPath = {};
  for (const r of eventsByPath) { (byPath[r.path] ||= {})[r.type] = Number(r.n); }

  const totals = {
    views: perDay.reduce((a, r) => a + Number(r.v), 0),
    uniques: perDay.reduce((a, r) => a + Number(r.u), 0),
    leads: leadRows.length,
    won: leadRows.filter((l) => l.status === 'won').length,
    calls: ev.call_click || 0, whatsapp: ev.whatsapp_click || 0, formStarts: ev.form_start || 0,
  };
  totals.conv = totals.uniques ? ((totals.leads / totals.uniques) * 100).toFixed(2) : '0';

  const leadSources = {};
  const campaigns = {};
  for (const l of leadRows) {
    const s = leadSource(l);
    leadSources[s] = (leadSources[s] || 0) + 1;
    if (l.utm_campaign) {
      const k = `${l.utm_campaign}\u0001${l.utm_source || '-'}`;
      campaigns[k] ||= { campaign: l.utm_campaign, source: l.utm_source || '—', leads: 0, won: 0 };
      campaigns[k].leads += 1;
      if (l.status === 'won') campaigns[k].won += 1;
    }
  }

  const viewsByPath = {};
  if (landing.length) {
    const rows = await db('analytics_daily').select('path').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).whereIn('path', landing.map((p) => `/${p.slug}`)).groupBy('path');
    for (const r of rows) viewsByPath[r.path] = { v: Number(r.v), u: Number(r.u) };
  }
  const lpLeads = landing.length
    ? Object.fromEntries((await db('leads').select('page_id').count({ n: '*' }).where('created_at', '>=', from).whereIn('page_id', landing.map((p) => p.id)).whereNot('status', 'spam').groupBy('page_id')).map((r) => [r.page_id, Number(r.n)]))
    : {};

  res.render('admin/analytics.njk', {
    title: 'التقارير', active: 'analytics', range,
    days, totals,
    series: { views: days.map((d) => vMap[d]?.v || 0), uniques: days.map((d) => vMap[d]?.u || 0), leads: days.map((d) => lMap[d] || 0) },
    sources: sources.map((s) => ({ source: s.source, v: Number(s.v), u: Number(s.u) })),
    devices: devices.map((d) => ({ device: d.device, v: Number(d.v) })),
    pages: pages.map((p) => {
      const e = byPath[p.path] || {};
      const u = Number(p.u);
      return { path: p.path, v: Number(p.v), u, leads: e.lead || 0, starts: e.form_start || 0, conv: u ? (((e.lead || 0) / u) * 100).toFixed(1) : '0' };
    }),
    leadSources: Object.entries(leadSources).sort((a, b) => b[1] - a[1]),
    campaigns: Object.values(campaigns).sort((a, b) => b.leads - a.leads).slice(0, 20),
    landing: landing.map((p) => {
      const v = viewsByPath[`/${p.slug}`] || { v: 0, u: 0 };
      const n = lpLeads[p.id] || 0;
      return { ...p, views: v.v, uniques: v.u, leads: n, conv: v.u ? ((n / v.u) * 100).toFixed(1) : '0' };
    }).sort((a, b) => b.leads - a.leads || b.views - a.views),
    notFound: notFound.map((r) => ({ path: r.path, n: Number(r.n) })),
  });
}));

export default router;
