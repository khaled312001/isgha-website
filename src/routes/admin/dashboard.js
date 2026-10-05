// الرئيسية والتقارير وتقرير PDF
// كل التجميع في SQL (فهارس created_at / المفتاح الأساسي day,…) ثم تشكيل خفيف للرسوم
import { Router } from 'express';
import db from '../../db.js';
import config from '../../config.js';
import { can, requirePerm } from '../../lib/auth.js';
import { IMAGE_SLOTS } from '../../content/image-slots.js';
import { riyadhDay, arDigits, arDate } from '../../lib/text.js';
import { wrap, leadSource, LEAD_STATUSES, LEAD_STATUS_MAP } from './util.js';

const router = Router();
const DAY = 86400000;
const RZ = "CONVERT_TZ(created_at, '+00:00', '+03:00')";
const RIYADH_DAY = `DATE(${RZ})`;
const RANGES = [7, 30, 90, 365];

// ─── التواريخ ───
function dayList(n, skip = 0) {
  const out = [];
  const today = new Date(`${riyadhDay()}T00:00:00Z`);
  for (let i = n - 1 + skip; i >= skip; i -= 1) out.push(new Date(today.getTime() - i * DAY).toISOString().slice(0, 10));
  return out;
}
// بداية اليوم بتوقيت الرياض قبل n يوم (بالـ UTC)
function sinceDate(days) {
  const start = new Date(`${riyadhDay()}T00:00:00+03:00`);
  return new Date(start.getTime() - (days - 1) * DAY);
}
const dstr = (d) => (d instanceof Date ? d.toISOString().slice(0, 10) : String(d).slice(0, 10));
const sum = (a) => a.reduce((x, y) => x + y, 0);
const parseRange = (v) => (RANGES.includes(Number(v)) ? Number(v) : 30);
const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
function dayText(s, year = false) {
  const [y, m, d] = s.split('-').map(Number);
  return arDigits(`${d} ${AR_MONTHS[m - 1]}${year ? ` ${y}` : ''}`);
}
const periodText = (days) => `${dayText(days[0], days[0].slice(0, 4) !== days[days.length - 1].slice(0, 4))} – ${dayText(days[days.length - 1], true)}`;
const RANGE_LABEL = { 7: 'آخر ٧ أيام', 30: 'آخر ٣٠ يومًا', 90: 'آخر ٩٠ يومًا', 365: 'آخر سنة' };

// ─── تنسيق الأرقام بالعربية (فواصل الآلاف ٬ والعشرية ٫) ───
function nf(n, dec = 0) {
  const x = Number(n) || 0;
  const s = x.toLocaleString('en-US', { minimumFractionDigits: dec, maximumFractionDigits: dec });
  return arDigits(s.replace(/,/g, '٬').replace(/\./g, '٫'));
}
const pctText = (v) => (v == null ? '—' : `${nf(v, v > 0 && v < 10 ? 1 : 0)}٪`);
const rate = (a, b) => (b ? (a / b) * 100 : null);

// تغيّر مقارنةً بالفترة السابقة (الارتفاع جيد في كل مؤشراتنا)
function delta(cur, prev, vs) {
  if (!prev) return cur ? { cls: 'up', text: 'جديد', vs } : null;
  const p = Math.round(((cur - prev) / prev) * 100);
  return { cls: p > 0 ? 'up' : p < 0 ? 'down' : 'flat', text: `${nf(Math.abs(p))}٪`, vs };
}
function deltaPts(cur, prev, vs) {
  if (cur == null || prev == null) return null;
  const d = Math.round((cur - prev) * 10) / 10;
  return { cls: d > 0 ? 'up' : d < 0 ? 'down' : 'flat', text: `${nf(Math.abs(d), Math.abs(d) < 10 ? 1 : 0)} نقطة`, vs };
}
function duration(mins) {
  if (mins == null) return null;
  if (mins < 60) return `${nf(Math.max(1, Math.round(mins)))} دقيقة`;
  if (mins < 1440) { const h = mins / 60; return `${nf(h, h < 10 ? 1 : 0)} ساعة`; }
  const d = mins / 1440; return `${nf(d, d < 10 ? 1 : 0)} يوم`;
}

// تجميع سلسلة يومية إلى أسابيع (لفترة السنة) — آخر دلو ينتهي اليوم
function bucketize(days, size) {
  if (size <= 1) return { labels: days, fold: (a) => a };
  const groups = [];
  for (let end = days.length; end > 0; end -= size) groups.unshift([Math.max(0, end - size), end]);
  return { labels: groups.map(([a]) => days[a]), fold: (arr) => groups.map(([a, b]) => sum(arr.slice(a, b))) };
}

// ─── المصادر والقنوات ───
const SRC_LABELS = { direct: 'مباشر', google: 'بحث جوجل', 'google-ads': 'إعلانات جوجل', bing: 'بحث Bing', facebook: 'فيسبوك', instagram: 'إنستغرام', snapchat: 'سناب شات', tiktok: 'تيك توك', x: 'X (تويتر)', linkedin: 'لينكدإن', whatsapp: 'واتساب', youtube: 'يوتيوب', '~other': 'مصادر أخرى' };
const srcLabel = (s) => SRC_LABELS[s] || s;
// اللون يتبع المصدر نفسه لا ترتيبه (ثابت بين الفترات)
const SRC_COLOR = { google: 'c1', direct: 'c2', 'google-ads': 'c3', snapchat: 'c4', instagram: 'c5' };
const DEVICES = [['mobile', 'جوال', 'c1'], ['desktop', 'كمبيوتر', 'c2'], ['tablet', 'تابلت', 'c3']];

const CHANNEL_SQL = `CASE
  WHEN click_type IS NOT NULL AND click_type <> '' THEN CONCAT('ads:', LOWER(click_type))
  WHEN utm_source IS NOT NULL AND utm_source <> '' THEN CONCAT('utm:', LOWER(utm_source))
  WHEN referrer IS NULL OR referrer = '' THEN 'direct'
  WHEN referrer LIKE '%google.%' THEN 'org:google'
  WHEN referrer LIKE '%bing.%' THEN 'org:bing'
  WHEN referrer LIKE '%instagram.%' OR referrer LIKE '%facebook.%' THEN 'social:meta'
  WHEN referrer LIKE '%snapchat.%' THEN 'social:snap'
  WHEN referrer LIKE '%tiktok.%' THEN 'social:tiktok'
  WHEN referrer LIKE '%t.co/%' OR referrer LIKE '%twitter.%' OR referrer LIKE '%x.com%' THEN 'social:x'
  ELSE 'ref' END`;
const ADS = { google: 'إعلانات جوجل', meta: 'إعلانات ميتا', tiktok: 'إعلانات تيك توك', snap: 'إعلانات سناب', microsoft: 'إعلانات Bing', x: 'إعلانات X', linkedin: 'إعلانات لينكدإن' };
const UTM = { google: 'جوجل (رابط حملة)', facebook: 'فيسبوك', instagram: 'إنستغرام', meta: 'ميتا', snapchat: 'سناب شات', snap: 'سناب شات', tiktok: 'تيك توك', x: 'X', twitter: 'X', linkedin: 'لينكدإن', whatsapp: 'واتساب', email: 'البريد', newsletter: 'النشرة البريدية' };
const SOCIAL = { meta: 'إنستغرام / فيسبوك', snap: 'سناب شات', tiktok: 'تيك توك', x: 'X (تويتر)' };
function channelInfo(key) {
  const [kind, v] = String(key).split(':');
  if (kind === 'ads') return { label: ADS[v] || `إعلانات ${v}`, q: v };
  if (kind === 'utm') return { label: UTM[v] || v, q: v };
  if (kind === 'social') return { label: SOCIAL[v] || v, q: 'organic' };
  if (key === 'org:google') return { label: 'بحث جوجل (مجاني)', q: 'organic' };
  if (key === 'org:bing') return { label: 'بحث Bing', q: 'organic' };
  if (key === 'ref') return { label: 'مواقع تحيل إلينا', q: 'organic' };
  return { label: 'مباشر', q: 'organic' };
}

// صفوف أشرطة أفقية: أعلى (limit) والباقي «أخرى»
function barRows(rows, limit, mapRow) {
  const total = sum(rows.map((r) => Number(r.n)));
  const top = rows.slice(0, limit).map((r) => ({ n: Number(r.n), won: Number(r.won || 0), ...mapRow(r) }));
  const rest = rows.slice(limit);
  if (rest.length) top.push({ label: 'أخرى', n: sum(rest.map((r) => Number(r.n))), won: sum(rest.map((r) => Number(r.won || 0))), other: true });
  const max = Math.max(1, ...top.map((r) => r.n));
  return { total, rows: top.map((r) => ({ ...r, w: Math.max(1.5, (r.n / max) * 100), share: total ? (r.n / total) * 100 : 0 })) };
}

// ─── الاستعلامات ───
async function leadsDaily(from) {
  const rows = await db('leads').select(db.raw(`${RIYADH_DAY} as d`)).count({ n: '*' })
    .where('created_at', '>=', from).whereNot('status', 'spam').groupByRaw(RIYADH_DAY);
  return new Map(rows.map((r) => [dstr(r.d), Number(r.n)]));
}
async function trafficDaily(fromDay) {
  const rows = await db('analytics_daily').select('day').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('day');
  return new Map(rows.map((r) => [dstr(r.day), { v: Number(r.v), u: Number(r.u) }]));
}
async function eventsDaily(fromDay) {
  const rows = await db('events_daily').select('day', 'type').sum({ n: 'count' }).where('day', '>=', fromDay)
    .whereIn('type', ['call_click', 'whatsapp_click', 'form_start', 'lead']).groupBy('day', 'type');
  const out = { call_click: new Map(), whatsapp_click: new Map(), form_start: new Map(), lead: new Map() };
  for (const r of rows) out[r.type].set(dstr(r.day), Number(r.n));
  return out;
}
async function statusCounts(from) {
  const q = db('leads').select('status').count({ n: '*' }).groupBy('status');
  if (from) q.where('created_at', '>=', from);
  return Object.fromEntries((await q).map((r) => [r.status, Number(r.n)]));
}
function leadChannels(from) {
  return db('leads').select(db.raw(`${CHANNEL_SQL} as ch`)).count({ n: '*' }).select(db.raw("SUM(status = 'won') as won"))
    .where('created_at', '>=', from).whereNot('status', 'spam').groupBy('ch').orderBy('n', 'desc').limit(40);
}
function leadCases(from) {
  const ct = "COALESCE(NULLIF(TRIM(case_type), ''), '')";
  return db('leads').select(db.raw(`${ct} as ct`)).count({ n: '*' }).select(db.raw("SUM(status = 'won') as won"))
    .where('created_at', '>=', from).whereNot('status', 'spam').groupBy('ct').orderBy('n', 'desc').limit(40);
}
async function responseMinutes(from) {
  const rows = await db('leads').select(db.raw('TIMESTAMPDIFF(MINUTE, created_at, contacted_at) as m'))
    .where('created_at', '>=', from).whereNotNull('contacted_at').whereNot('status', 'spam').orderBy('m').limit(5000);
  const v = rows.map((r) => Number(r.m)).filter((m) => m >= 0);
  if (!v.length) return null;
  const mid = Math.floor(v.length / 2);
  return { median: v.length % 2 ? v[mid] : (v[mid - 1] + v[mid]) / 2, n: v.length, within1h: Math.round((v.filter((m) => m <= 60).length / v.length) * 100) };
}

// ساعات بنظام ١٢ ساعة
const hr12 = (h) => { const x = h % 24; return { n: arDigits(x % 12 || 12), s: x < 12 ? 'ص' : 'م' }; };
function hourSpan(b) {
  const a = hr12(b * 2); const z = hr12(b * 2 + 2);
  return a.s === z.s ? `${a.n}–${z.n} ${a.s}` : `${a.n} ${a.s} – ${z.n} ${z.s}`;
}
const WEEKDAYS = [['الأحد', 'أحد'], ['الاثنين', 'اثنين'], ['الثلاثاء', 'ثلاثاء'], ['الأربعاء', 'أربعاء'], ['الخميس', 'خميس'], ['الجمعة', 'جمعة'], ['السبت', 'سبت']];
async function leadHeat(from) {
  const rows = await db('leads').select(db.raw(`DAYOFWEEK(${RZ}) as wd`), db.raw(`FLOOR(HOUR(${RZ}) / 2) as hb`)).count({ n: '*' })
    .where('created_at', '>=', from).whereNot('status', 'spam').groupBy('wd', 'hb');
  const grid = WEEKDAYS.map(() => Array(12).fill(0));
  for (const r of rows) grid[Number(r.wd) - 1][Number(r.hb)] = Number(r.n);
  const flat = grid.flatMap((row, w) => row.map((n, h) => ({ n, w, h })));
  const max = Math.max(0, ...flat.map((c) => c.n));
  const total = sum(flat.map((c) => c.n));
  const peaks = flat.filter((c) => c.n > 0).sort((a, b) => b.n - a.n).slice(0, 3).map((c) => ({ day: WEEKDAYS[c.w][0], span: hourSpan(c.h), n: c.n }));
  const dayTotals = grid.map((row) => sum(row));
  const quiet = total ? WEEKDAYS[dayTotals.indexOf(Math.min(...dayTotals))][0] : null;
  return {
    total, max, peaks, quiet,
    hours: Array.from({ length: 12 }, (_, h) => { const a = hr12(h * 2); return `${a.n}${a.s}`; }),
    rows: grid.map((row, w) => ({
      name: WEEKDAYS[w][0], short: WEEKDAYS[w][1], total: dayTotals[w],
      cells: row.map((n, h) => ({ n, l: n ? Math.max(1, Math.ceil((n / max) * 5)) : 0, label: `${WEEKDAYS[w][0]} ${hourSpan(h)}` })),
    })),
  };
}

// قمع التحويل: كل مرحلة مقارنةً بالسابقة، وأكبر تسرّب بعد مرحلة «بدء النموذج»
function funnel(stages) {
  const out = stages.map((s, i) => {
    const prev = stages[i - 1];
    const r = i && prev.n ? (s.n / prev.n) * 100 : null;
    return { ...s, rate: r, rateText: r == null ? '' : pctText(r), of: prev?.label, drop: i ? Math.max(0, prev.n - s.n) : 0, w: i ? Math.min(100, Math.max(r ? 1.5 : 0, r || 0)) : 100 };
  });
  let leak = -1;
  out.forEach((s, i) => { if (i >= 2 && out[i - 1].n > 0 && s.rate != null && (leak < 0 || s.rate < out[leak].rate)) leak = i; });
  if (leak > 0) out[leak].leak = true;
  const first = out[0]; const last = out[out.length - 1];
  return { stages: out, overall: first?.n ? pctText((last.n / first.n) * 100) : null, from: first?.label, to: last?.label };
}

function pipeline(counts) {
  const keys = LEAD_STATUSES.filter(([k]) => k !== 'spam');
  const total = sum(keys.map(([k]) => counts[k] || 0));
  return {
    total, spam: counts.spam || 0,
    segs: keys.map(([k, label, color]) => {
      const n = counts[k] || 0;
      return { key: k, label, color, n, share: total ? (n / total) * 100 : 0, shareText: pctText(total ? (n / total) * 100 : 0) };
    }),
  };
}

const all = async (jobs) => {
  const keys = Object.keys(jobs);
  const vals = await Promise.all(keys.map((k) => jobs[k]));
  return Object.fromEntries(keys.map((k, i) => [k, vals[i]]));
};

// ═══════════ الرئيسية ═══════════
router.get('/', wrap(async (req, res) => {
  const u = req.user;
  const S = res.locals.S;
  const N = 30;
  const days = dayList(N);
  const prevDays = dayList(N, N);
  const from = sinceDate(N);
  const prevFrom = new Date(from.getTime() - N * DAY);
  const canLeads = can(u, 'leads');
  const canAn = can(u, 'analytics');
  const VS = 'عن الـ٣٠ يومًا السابقة';
  const data = { days, period: periodText(days) };

  const jobs = {};
  if (canLeads || canAn) jobs.leadsDay = leadsDaily(prevFrom);
  if (canLeads) {
    jobs.statusAll = statusCounts(null);
    jobs.statusPeriod = statusCounts(from);
    jobs.recent = db('leads').orderBy('id', 'desc').limit(8);
    jobs.channels = leadChannels(from);
    jobs.cases = leadCases(from);
    jobs.heat = leadHeat(sinceDate(90));
    jobs.resp = responseMinutes(from);
    jobs.oldestNew = db('leads').where({ status: 'new' }).min({ t: 'created_at' }).first();
  }
  if (canAn) {
    jobs.traffic = trafficDaily(prevDays[0]);
    jobs.events = eventsDaily(prevDays[0]);
  }
  const r = await all(jobs);

  const pick = (map, list, f = (x) => x) => list.map((d) => (map.has(d) ? f(map.get(d)) : 0));
  const leadsCur = r.leadsDay ? pick(r.leadsDay, days) : [];
  const leadsPrev = r.leadsDay ? pick(r.leadsDay, prevDays) : [];
  const month = sum(leadsCur);
  const prevMonth = sum(leadsPrev);
  const kpis = [];

  if (canLeads) {
    const sp = r.statusPeriod;
    const valid = sum(Object.entries(sp).filter(([k]) => k !== 'spam').map(([, n]) => n));
    const best = leadsCur.reduce((b, n, i) => (n > b.n ? { n, i } : b), { n: 0, i: -1 });
    const ch = barRows(r.channels, 6, (x) => { const c = channelInfo(x.ch); return { label: c.label, href: `/admin/leads?source=${encodeURIComponent(c.q)}` }; });
    const cs = barRows(r.cases, 6, (x) => ({ label: x.ct || 'غير محدد', href: x.ct ? `/admin/leads?q=${encodeURIComponent(x.ct)}` : null }));
    data.leads = {
      today: leadsCur[N - 1] || 0, week: sum(leadsCur.slice(-7)), month, prevMonth,
      waiting: r.statusAll.new || 0,
      oldestNew: r.oldestNew?.t || null,
      pipeline: pipeline(r.statusAll),
      resp: r.resp ? { text: duration(r.resp.median), within1h: r.resp.within1h, n: r.resp.n } : null,
      recent: r.recent.map((l) => ({ ...l, source: leadSource(l), st: LEAD_STATUS_MAP[l.status] || LEAD_STATUS_MAP.new })),
      channels: ch, cases: cs,
      heat: r.heat,
      valid,
      won: sp.won || 0,
      trend: {
        type: 'line', labels: days, fmt: 'int', unit: 'طلب',
        series: [
          { label: 'آخر ٣٠ يومًا', data: leadsCur, color: 'teal', fill: true },
          { label: 'الـ٣٠ يومًا السابقة', data: leadsPrev, dates: prevDays, color: 'prev', dashed: true },
        ],
      },
      hasTrend: month + prevMonth > 0,
      avg: nf(month / N, month / N < 10 ? 1 : 0),
      best: best.i >= 0 ? { n: best.n, day: dayText(days[best.i]) } : null,
      delta: delta(month, prevMonth, VS),
    };
    data.funnelLeads = { leads: valid, contacted: (sp.contacted || 0) + (sp.qualified || 0) + (sp.won || 0) + (sp.lost || 0), qualified: (sp.qualified || 0) + (sp.won || 0), won: sp.won || 0 };
    kpis.push({ icon: 'inbox', tone: 'teal', label: 'طلبات آخر ٣٠ يومًا', value: nf(month), delta: data.leads.delta, spark: leadsCur, sparkColor: 'teal', href: '/admin/leads' });
  }

  if (canAn) {
    const uCur = pick(r.traffic, days, (x) => x.u);
    const uPrev = pick(r.traffic, prevDays, (x) => x.u);
    const vCur = pick(r.traffic, days, (x) => x.v);
    const ev = r.events;
    const calls = pick(ev.call_click, days); const wa = pick(ev.whatsapp_click, days);
    const callsPrev = sum(pick(ev.call_click, prevDays)); const waPrev = sum(pick(ev.whatsapp_click, prevDays));
    const visitors = sum(uCur); const prevVisitors = sum(uPrev);
    const conv = rate(month, visitors); const convPrev = rate(prevMonth, prevVisitors);
    const contacts = sum(calls) + sum(wa);
    data.traffic = {
      visitors, views: sum(vCur), conv, convText: pctText(conv),
      calls: sum(calls), wa: sum(wa), formStarts: sum(pick(ev.form_start, days)),
      combo: {
        type: 'multiples', labels: days, fmt: 'int',
        panels: [
          { label: 'الزوار', data: uCur, kind: 'area', color: 'gold', unit: 'زائر' },
          { label: 'الطلبات', data: leadsCur, kind: 'bar', color: 'teal', unit: 'طلب' },
        ],
        derived: { label: 'معدل التحويل', num: 1, den: 0, fmt: 'pct' },
      },
      hasCombo: visitors + month > 0,
      contactsChart: {
        type: 'line', labels: days, fmt: 'int',
        series: [
          { label: 'واتساب', data: wa, color: 'c1', icon: 'whatsapp' },
          { label: 'اتصال هاتفي', data: calls, color: 'c2', icon: 'phone' },
        ],
      },
      hasContacts: contacts > 0,
      waShare: contacts ? Math.round((sum(wa) / contacts) * 100) : 0,
      contactsDelta: delta(contacts, callsPrev + waPrev, VS),
    };
    kpis.push({ icon: 'users', label: 'زوار آخر ٣٠ يومًا', value: nf(visitors), delta: delta(visitors, prevVisitors, VS), spark: uCur, sparkColor: 'gold', sub: `${nf(sum(vCur))} مشاهدة` });
    kpis.push({ icon: 'percent', tone: 'yellow', label: 'معدل التحويل', value: pctText(conv), delta: deltaPts(conv, convPrev, VS), sub: 'طلبات ÷ زوار' });
    kpis.push({ icon: 'phone', label: 'نقرات الاتصال والواتساب', value: nf(contacts), delta: data.traffic.contactsDelta, spark: days.map((_, i) => calls[i] + wa[i]), sparkColor: 'c1', sub: `${nf(sum(calls))} اتصال · ${nf(sum(wa))} واتساب` });
  }

  if (canLeads && !canAn) {
    kpis.push({ icon: 'calendar', label: 'آخر ٧ أيام', value: nf(data.leads.week), sub: `اليوم: ${nf(data.leads.today)}`, spark: leadsCur.slice(-14), sparkColor: 'teal' });
    kpis.push({ icon: 'clock', tone: 'yellow', label: 'بانتظار التواصل', value: nf(data.leads.waiting), sub: 'طلبات بحالة «جديد»', href: '/admin/leads?status=new' });
    if (data.leads.resp) kpis.push({ icon: 'zap', label: 'زمن الرد المعتاد', value: data.leads.resp.text, sub: `${nf(data.leads.resp.within1h)}٪ خلال ساعة` });
  }
  data.kpis = kpis;

  // قمع التحويل للفترة
  const stages = [];
  if (canAn) stages.push({ label: 'الزوار', n: data.traffic.visitors, icon: 'users' }, { label: 'بدأوا تعبئة النموذج', n: data.traffic.formStarts, icon: 'clipboard' });
  if (canLeads) {
    const f = data.funnelLeads;
    stages.push({ label: 'أرسلوا طلبًا', n: f.leads, icon: 'inbox' }, { label: 'تم التواصل معهم', n: f.contacted, icon: 'phone' }, { label: 'مؤهَّلون', n: f.qualified, icon: 'check-circle' }, { label: 'تم التعاقد', n: f.won, icon: 'award' });
  } else if (canAn) stages.push({ label: 'أرسلوا طلبًا', n: month, icon: 'inbox' });
  data.funnel = stages.length > 1 && stages[0].n > 0 ? funnel(stages) : null;

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

  res.render('admin/dashboard.njk', { title: 'الرئيسية', active: 'dashboard', data, nf });
}));

// ═══════════ التقارير (الصفحة + تقرير PDF يشتركان في البيانات) ═══════════
async function analyticsData(range, user, { report = false } = {}) {
  const days = dayList(range);
  const prevDays = dayList(range, range);
  const fromDay = days[0];
  const from = sinceDate(range);
  const prevFrom = new Date(from.getTime() - range * DAY);
  const canLeads = can(user, 'leads');
  const B = bucketize(days, range > 90 ? 7 : 1);
  const VS = range === 365 ? 'عن السنة السابقة' : `عن الـ${arDigits(range)} ${range === 7 ? 'أيام' : 'يومًا'} السابقة`;

  const jobs = {
    traffic: trafficDaily(prevDays[0]),
    events: eventsDaily(prevDays[0]),
    leadsDay: leadsDaily(prevFrom),
    sources: db('analytics_daily').select('source').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('source').orderBy('u', 'desc').limit(15),
    devices: db('analytics_daily').select('device').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('device'),
    pages: db('analytics_daily').select('path').sum({ v: 'views', u: 'uniques' }).where('day', '>=', fromDay).groupBy('path').orderBy('v', 'desc').limit(25),
    eventsByPath: db('events_daily').select('type', 'path').sum({ n: 'count' }).where('day', '>=', fromDay).whereIn('type', ['lead', 'form_start', 'call_click', 'whatsapp_click']).groupBy('type', 'path'),
    status: statusCounts(from),
    channels: leadChannels(from),
    campaigns: db('leads').select('utm_campaign as campaign', db.raw("COALESCE(NULLIF(utm_source, ''), '—') as source")).count({ leads: '*' }).select(db.raw("SUM(status = 'won') as won"))
      .where('created_at', '>=', from).whereNot('status', 'spam').whereNotNull('utm_campaign').whereNot('utm_campaign', '')
      .groupBy('campaign', 'source').orderBy('leads', 'desc').limit(20),
    landing: db('pages').where({ kind: 'landing' }).select('id', 'slug', 'title', 'status').limit(30),
    notFound: db('events_daily').select('path').sum({ n: 'count' }).where('day', '>=', fromDay).andWhere({ type: '404' }).groupBy('path').orderBy('n', 'desc').limit(15),
  };
  if (report && canLeads) {
    jobs.cases = leadCases(from);
    jobs.heat = leadHeat(from);
    jobs.resp = responseMinutes(from);
  }
  const r = await all(jobs);

  const pick = (map, list, f = (x) => x) => list.map((d) => (map.has(d) ? f(map.get(d)) : 0));
  const uCur = pick(r.traffic, days, (x) => x.u); const vCur = pick(r.traffic, days, (x) => x.v);
  const uPrev = pick(r.traffic, prevDays, (x) => x.u); const vPrev = pick(r.traffic, prevDays, (x) => x.v);
  const lCur = pick(r.leadsDay, days); const lPrev = pick(r.leadsDay, prevDays);
  const ev = r.events;
  const evSum = (t, list) => sum(pick(ev[t], list));
  const sp = r.status;
  const totals = {
    views: sum(vCur), uniques: sum(uCur), leads: sum(lCur), won: sp.won || 0,
    calls: evSum('call_click', days), whatsapp: evSum('whatsapp_click', days), formStarts: evSum('form_start', days),
  };
  const prev = { views: sum(vPrev), uniques: sum(uPrev), leads: sum(lPrev), calls: evSum('call_click', prevDays), whatsapp: evSum('whatsapp_click', prevDays), formStarts: evSum('form_start', prevDays) };
  totals.conv = rate(totals.leads, totals.uniques);
  totals.convText = pctText(totals.conv);
  const deltas = {
    uniques: delta(totals.uniques, prev.uniques, VS), views: delta(totals.views, prev.views, VS), leads: delta(totals.leads, prev.leads, VS),
    conv: deltaPts(totals.conv, rate(prev.leads, prev.uniques), VS), calls: delta(totals.calls, prev.calls, VS),
    whatsapp: delta(totals.whatsapp, prev.whatsapp, VS), formStarts: delta(totals.formStarts, prev.formStarts, VS),
  };

  // المصادر عبر الزمن: أعلى ٤ مصادر + «أخرى»
  const sources = r.sources.map((s) => ({ source: s.source, label: srcLabel(s.source), v: Number(s.v), u: Number(s.u) }));
  const top = sources.slice(0, 4).map((s) => s.source);
  let sourcesChart = null;
  if (top.length) {
    const ce = `CASE WHEN source IN (${top.map(() => '?').join(',')}) THEN source ELSE '~other' END`;
    const rows = await db('analytics_daily').select('day', db.raw(`${ce} as s`, top)).sum({ u: 'uniques' }).where('day', '>=', fromDay).groupBy('day', 's');
    const by = {};
    for (const x of rows) (by[x.s] ||= new Map()).set(dstr(x.day), Number(x.u));
    const keys = [...top, ...(by['~other'] ? ['~other'] : [])];
    const used = new Set(keys.map((k) => SRC_COLOR[k]).filter(Boolean));
    const free = ['c1', 'c2', 'c3', 'c4', 'c5'].filter((c) => !used.has(c));
    const taken = new Set();
    sourcesChart = {
      type: 'stacked', labels: B.labels, bucket: range > 90 ? 7 : 1, fmt: 'int', unit: 'زائر',
      series: keys.map((k) => {
        let c = k === '~other' ? 'other' : SRC_COLOR[k];
        if (!c || taken.has(c)) c = free.shift();
        taken.add(c);
        return { label: srcLabel(k), data: B.fold(pick(by[k] || new Map(), days)), color: c };
      }),
    };
  }

  // الأجهزة (ترتيب ولون ثابتان)
  const devMap = Object.fromEntries(r.devices.map((d) => [d.device, Number(d.u)]));
  const devTotal = sum(Object.values(devMap));
  const devices = DEVICES.map(([k, label, color]) => ({ key: k, label, color, n: devMap[k] || 0, share: devTotal ? ((devMap[k] || 0) / devTotal) * 100 : 0 }));
  devices.forEach((d) => { d.shareText = pctText(d.share); });

  const byPath = {};
  for (const x of r.eventsByPath) (byPath[x.path] ||= {})[x.type] = Number(x.n);
  const pages = r.pages.map((p) => {
    const e = byPath[p.path] || {};
    const uu = Number(p.u);
    return { path: p.path, v: Number(p.v), u: uu, leads: e.lead || 0, starts: e.form_start || 0, conv: pctText(uu ? ((e.lead || 0) / uu) * 100 : 0) };
  });
  const maxV = Math.max(1, ...pages.slice(0, 10).map((p) => p.v));
  const topPages = pages.slice(0, 10).map((p) => ({
    label: p.path, n: p.v, w: Math.max(1.5, (p.v / maxV) * 100), href: p.path, ext: true,
    tip: `المشاهدات::${nf(p.v)}||الزوار::${nf(p.u)}||الطلبات::${nf(p.leads)}||التحويل::${p.conv}`,
  }));
  const sourceBars = barRows(sources.map((s) => ({ n: s.u, src: s.source })), 8, (x) => ({ label: srcLabel(x.src) }));

  // صفحات الهبوط + خط مصغّر للزوار يوميًا
  const landing = r.landing;
  let landingRows = [];
  if (landing.length) {
    const paths = landing.map((p) => `/${p.slug}`);
    const [daily, lpLeads] = await Promise.all([
      db('analytics_daily').select('path', 'day').sum({ u: 'uniques', v: 'views' }).where('day', '>=', fromDay).whereIn('path', paths).groupBy('path', 'day'),
      db('leads').select('page_id').count({ n: '*' }).where('created_at', '>=', from).whereIn('page_id', landing.map((p) => p.id)).whereNot('status', 'spam').groupBy('page_id'),
    ]);
    const dmap = {};
    for (const x of daily) (dmap[x.path] ||= new Map()).set(dstr(x.day), { u: Number(x.u), v: Number(x.v) });
    const lmap = Object.fromEntries(lpLeads.map((x) => [x.page_id, Number(x.n)]));
    landingRows = landing.map((p) => {
      const m = dmap[`/${p.slug}`] || new Map();
      const us = pick(m, days, (x) => x.u);
      const uniques = sum(us); const views = sum(pick(m, days, (x) => x.v));
      const n = lmap[p.id] || 0;
      const cr = rate(n, uniques);
      return { ...p, views, uniques, leads: n, cr: cr || 0, conv: pctText(cr || 0), spark: B.fold(us) };
    }).sort((a, b) => b.leads - a.leads || b.uniques - a.uniques);
    const maxCr = Math.max(1, ...landingRows.map((x) => x.cr));
    landingRows.forEach((x) => { x.crW = Math.max(x.cr ? 3 : 0, (x.cr / maxCr) * 100); });
  }

  const ch = barRows(r.channels, 7, (x) => { const c = channelInfo(x.ch); return { label: c.label, href: `/admin/leads?source=${encodeURIComponent(c.q)}` }; });
  const contacted = (sp.contacted || 0) + (sp.qualified || 0) + (sp.won || 0) + (sp.lost || 0);
  const valid = contacted + (sp.new || 0);
  const stages = [
    { label: 'الزوار', n: totals.uniques, icon: 'users' },
    { label: 'بدأوا تعبئة النموذج', n: totals.formStarts, icon: 'clipboard' },
    { label: 'أرسلوا طلبًا', n: valid, icon: 'inbox' },
  ];
  if (canLeads) stages.push({ label: 'تم التواصل معهم', n: contacted, icon: 'phone' }, { label: 'مؤهَّلون', n: (sp.qualified || 0) + (sp.won || 0), icon: 'check-circle' }, { label: 'تم التعاقد', n: sp.won || 0, icon: 'award' });

  const out = {
    range, rangeLabel: RANGE_LABEL[range], days, period: periodText(days), prevPeriod: periodText(prevDays), vs: VS,
    totals, deltas,
    combo: {
      type: 'multiples', labels: B.labels, bucket: range > 90 ? 7 : 1, fmt: 'int',
      panels: [
        { label: 'الزوار', data: B.fold(uCur), kind: 'area', color: 'gold', unit: 'زائر' },
        { label: 'الطلبات', data: B.fold(lCur), kind: 'bar', color: 'teal', unit: 'طلب' },
      ],
      derived: { label: 'معدل التحويل', num: 1, den: 0, fmt: 'pct' },
    },
    hasCombo: totals.uniques + totals.leads > 0,
    sources, sourcesChart, sourceBars, hasSources: sources.length > 0,
    sourcesLegend: sourcesChart ? [...sourcesChart.series].reverse().map((s) => ({ label: s.label, color: s.color, shape: 'rect' })) : [],
    sparks: { uniques: B.fold(uCur), leads: B.fold(lCur), calls: B.fold(pick(ev.call_click, days)), whatsapp: B.fold(pick(ev.whatsapp_click, days)), formStarts: B.fold(pick(ev.form_start, days)), views: B.fold(vCur) },
    devices, devTotal,
    devicesChart: { type: 'doughnut', items: devices.map((d) => ({ label: d.label, n: d.n, color: d.color })), unit: 'زائر' },
    pages, topPages,
    leadSources: ch,
    campaigns: r.campaigns.map((c) => ({ campaign: c.campaign, source: c.source, leads: Number(c.leads), won: Number(c.won || 0) })),
    landing: landingRows,
    notFound: r.notFound.map((x) => ({ path: x.path, n: Number(x.n) })),
    funnel: stages[0].n > 0 ? funnel(stages) : null,
    canLeads,
  };

  if (report) {
    const calls = pick(ev.call_click, days); const wa = pick(ev.whatsapp_click, days);
    out.contactsChart = {
      type: 'line', labels: B.labels, bucket: range > 90 ? 7 : 1, fmt: 'int',
      series: [{ label: 'واتساب', data: B.fold(wa), color: 'c1' }, { label: 'اتصال هاتفي', data: B.fold(calls), color: 'c2' }],
    };
    out.hasContacts = totals.calls + totals.whatsapp > 0;
    if (canLeads) {
      out.pipeline = pipeline(sp);
      out.cases = barRows(r.cases, 7, (x) => ({ label: x.ct || 'غير محدد' }));
      out.heat = r.heat;
      out.resp = r.resp ? { text: duration(r.resp.median), within1h: r.resp.within1h, n: r.resp.n } : null;
    }
  }
  return out;
}

router.get('/analytics', requirePerm('analytics'), wrap(async (req, res) => {
  const range = parseRange(req.query.d);
  const A = await analyticsData(range, req.user);
  res.render('admin/analytics.njk', { title: 'التقارير', active: 'analytics', ...A, nf });
}));

// تقرير قابل للطباعة / الحفظ PDF من المتصفح (عربي متّجه وواضح، بلا متصفح على الخادم)
router.get('/analytics/report', requirePerm('analytics'), wrap(async (req, res) => {
  const range = parseRange(req.query.d ?? req.query.days);
  const A = await analyticsData(range, req.user, { report: true });
  res.render('admin/report.njk', {
    title: `تقرير الأداء — ${A.rangeLabel}`, ...A, nf,
    generated: arDate(new Date(), true), autoprint: req.query.print !== '0',
  });
}));

export default router;
