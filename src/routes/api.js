import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import db from '../db.js';
import { getSettings } from '../lib/settings.js';
import { normalizePhone } from '../lib/phone.js';
import { cleanText } from '../lib/sanitize.js';
import { notifyLead } from '../lib/notify.js';
import { trackEvent } from '../lib/analytics.js';
import { baseUrl } from '../lib/seo.js';
import { forget } from '../lib/cache.js';

const router = Router();

const leadLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 8,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { ok: false, error: 'عدد كبير من المحاولات، حاول بعد قليل أو اتصل بنا مباشرة.' },
});

const eventLimiter = rateLimit({ windowMs: 60 * 1000, limit: 60, standardHeaders: false, legacyHeaders: false });

function sameOrigin(req) {
  const origin = req.get('origin') || req.get('referer');
  if (!origin) return true;
  try {
    return new URL(origin).host === req.get('host');
  } catch {
    return false;
  }
}

const str = (v, n) => cleanText(v, n);

router.post('/leads', leadLimiter, async (req, res) => {
  try {
    if (!sameOrigin(req)) return res.status(403).json({ ok: false, error: 'طلب غير مسموح.' });
    const b = req.body || {};
    // فخ البوتات: حقل مخفي + زمن تعبئة قصير جدًا
    const elapsed = Date.now() - Number(b.ts || 0);
    if (b.hp || (b.ts && elapsed < 2500)) {
      return res.json({ ok: true, id: 0 });
    }
    const name = str(b.name, 150);
    const phone = normalizePhone(b.phone);
    const email = str(b.email, 190).toLowerCase();
    const form = b.form === 'contact' ? 'contact' : 'lead';
    if (name.length < 2) return res.status(422).json({ ok: false, field: 'name', error: 'يرجى إدخال الاسم.' });
    if (!phone) return res.status(422).json({ ok: false, field: 'phone', error: 'يرجى إدخال رقم جوال صحيح.' });
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return res.status(422).json({ ok: false, field: 'email', error: 'البريد الإلكتروني غير صحيح.' });
    const message = str(b.message, 3000);
    if (form === 'contact' && message.length < 5) return res.status(422).json({ ok: false, field: 'message', error: 'يرجى كتابة رسالتك.' });

    let page = null;
    if (b.page_id) page = await db('pages').where({ id: Number(b.page_id) }).first('id', 'slug', 'kind', 'settings', 'system_key');

    const a = b.attr || {};
    const clickId = a.gclid || a.gbraid || a.wbraid || a.fbclid || a.ttclid || a.sccid || a.ScCid || a.msclkid || a.twclid || a.li_fat_id || '';
    const clickType = a.gclid || a.gbraid || a.wbraid ? 'google' : a.fbclid ? 'meta' : a.ttclid ? 'tiktok' : (a.sccid || a.ScCid) ? 'snap' : a.msclkid ? 'microsoft' : a.twclid ? 'x' : a.li_fat_id ? 'linkedin' : '';
    const eventId = String(b.event_id || '').replace(/[^\w-]/g, '').slice(0, 60) || `ev_${Date.now().toString(36)}`;

    const row = {
      form,
      page_id: page?.id || null,
      page_slug: page ? (page.system_key === 'home' ? '' : page.slug) : null,
      name,
      phone,
      email: email || null,
      case_type: str(b.case_type, 150) || null,
      message: message || null,
      status: 'new',
      utm_source: str(a.utm_source, 120) || null,
      utm_medium: str(a.utm_medium, 120) || null,
      utm_campaign: str(a.utm_campaign, 190) || null,
      utm_term: str(a.utm_term, 190) || null,
      utm_content: str(a.utm_content, 190) || null,
      click_id: str(clickId, 255) || null,
      click_type: clickType || null,
      referrer: str(a.referrer, 500) || null,
      landing_url: str(a.landing || b.url, 500) || null,
      ip: req.ip,
      user_agent: str(req.get('user-agent'), 300),
      event_id: eventId,
      meta: JSON.stringify({ url: str(b.url, 500) }),
    };
    const [id] = await db('leads').insert(row);
    if (page) db('pages').where({ id: page.id }).increment('leads', 1).then(() => forget('c:page')).catch(() => {});
    trackEvent('lead', page ? `/${row.page_slug}` : '/');

    const s = await getSettings();
    let pageSet = {};
    try { pageSet = page?.settings ? JSON.parse(page.settings) : {}; } catch { pageSet = {}; }
    const mode = pageSet.thank_you_mode || s.thank_you_mode;
    let redirect = null;
    if (pageSet.redirect_url) redirect = pageSet.redirect_url;
    else if (mode === 'redirect') redirect = `/thank-you${page?.slug && page.kind === 'landing' ? `?lp=${encodeURIComponent(page.slug)}` : ''}`;

    res.json({ ok: true, id, redirect });

    // الإشعارات بعد الرد على الزائر
    const ctx = {
      ip: req.ip,
      userAgent: req.get('user-agent'),
      url: str(b.url, 500) || req.get('referer'),
      fbp: req.cookies?._fbp,
      fbc: req.cookies?._fbc || (a.fbclid ? `fb.1.${Date.now()}.${a.fbclid}` : undefined),
      base: baseUrl(req, s),
    };
    notifyLead({ ...row, id, created_at: new Date() }, ctx).catch((e) => console.error('[lead notify]', e.message));
  } catch (e) {
    console.error('[api/leads]', e);
    if (!res.headersSent) res.status(500).json({ ok: false, error: 'حدث خطأ أثناء الإرسال، حاول مجددًا أو اتصل بنا.' });
  }
});

const EVENT_TYPES = new Set(['call_click', 'whatsapp_click', 'form_start']);
router.post('/event', eventLimiter, (req, res) => {
  let body = req.body;
  if (typeof body === 'string') {
    try { body = JSON.parse(body); } catch { body = {}; }
  }
  const type = String(body?.type || '');
  if (EVENT_TYPES.has(type) && sameOrigin(req)) trackEvent(type, String(body.path || '').slice(0, 250));
  res.status(204).end();
});

export default router;
