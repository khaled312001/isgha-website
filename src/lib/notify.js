// إشعارات الطلب الجديد: بريد + Webhook + Meta Conversions API
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import config from '../config.js';
import { getSettings } from './settings.js';
import { escapeHtml, arDate } from './text.js';
import { prettyPhone, telHref, waHref } from './phone.js';

function smtpOptions(s) {
  const host = config.smtp.host || s.smtp_host;
  const user = config.smtp.user || s.smtp_user;
  const pass = config.smtp.pass || s.smtp_pass;
  if (!host || !user || !pass) return null;
  return {
    host,
    port: Number(config.smtp.host ? config.smtp.port : s.smtp_port || 465),
    secure: config.smtp.host ? config.smtp.secure : !!s.smtp_secure,
    auth: { user, pass },
    from: config.smtp.from || s.smtp_from || user,
  };
}

export async function sendMail({ to, subject, html, replyTo }) {
  const s = await getSettings();
  const opts = smtpOptions(s);
  if (!opts) return { skipped: true, reason: 'SMTP غير مُعد' };
  const transport = nodemailer.createTransport({ host: opts.host, port: opts.port, secure: opts.secure, auth: opts.auth, connectionTimeout: 15000 });
  await transport.sendMail({ from: opts.from, to, subject, html, replyTo });
  return { ok: true };
}

const STATUS_FORM = { lead: 'طلب تقييم / استشارة', contact: 'رسالة تواصل' };

// ─── قالب البريد (جداول وأنماط مضمّنة لتعمل في Gmail وOutlook وApple Mail) ───
const C = { green: '#215d41', deep: '#143a28', gold: '#d8af4d', beige: '#f6f5e9', ink: '#141817', muted: '#6d7672', line: '#ebe8dd' };
const FONT = "'IBM Plex Sans Arabic',Tahoma,'Segoe UI',Arial,sans-serif";
const e = (v) => escapeHtml(String(v ?? ''));

function btn(href, label, bg = C.green, color = '#ffffff') {
  return `<a href="${e(href)}" style="display:inline-block;background:${bg};color:${color};text-decoration:none;font-weight:bold;font-size:14px;padding:12px 22px;border-radius:10px;margin:4px 3px">${label}</a>`;
}

// الإطار العام: ترويسة خضراء بالشعار + خط ذهبي + المحتوى + تذييل ببيانات الشركة
export function brandedEmail({ base, preheader = '', title, body, s = {} }) {
  const site = base || 'https://isgha.sa';
  const sep = ' &nbsp;·&nbsp; ';
  const contacts = [
    `<a href="${e(site)}" style="color:${C.green};text-decoration:none">${e(site.replace(/^https?:\/\//, ''))}</a>`,
    s.phone && `<a href="${e(telHref(s.phone))}" style="color:${C.green};text-decoration:none" dir="ltr">${e(prettyPhone(s.phone))}</a>`,
    s.email && `<a href="mailto:${e(s.email)}" style="color:${C.green};text-decoration:none">${e(s.email)}</a>`,
  ].filter(Boolean).join(sep);
  return `<!doctype html><html dir="rtl" lang="ar"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"><title>${title}</title></head>
<body style="margin:0;padding:0;background:${C.beige};font-family:${FONT};color:${C.ink};-webkit-text-size-adjust:100%">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${e(preheader)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${C.beige}"><tr><td align="center" style="padding:28px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;background:#ffffff;border-radius:18px;overflow:hidden;border:1px solid ${C.line}">
  <tr><td align="center" style="background:${C.green};background-image:linear-gradient(135deg,${C.green},${C.deep});padding:30px 24px 26px">
    <a href="${e(site)}" style="text-decoration:none"><img src="${e(site)}/img/email-logo.png" width="170" alt="إصغاء للمحاماة والاستشارات القانونية" style="display:block;width:170px;max-width:60%;height:auto;border:0;color:#ffffff;font-size:20px;font-weight:bold"></a>
  </td></tr>
  <tr><td style="height:4px;background:${C.gold};line-height:4px;font-size:0">&nbsp;</td></tr>
  <tr><td style="padding:30px 30px 8px;direction:rtl;text-align:right">
    <h1 style="margin:0 0 6px;font-size:22px;line-height:1.5;color:${C.ink}">${title}</h1>
    ${body}
  </td></tr>
  <tr><td style="padding:22px 30px 26px;border-top:1px solid ${C.line};background:#fbfaf5;direction:rtl;text-align:center;font-size:12.5px;line-height:1.9;color:${C.muted}">
    <b style="color:${C.green}">${e(s.site_name || 'شركة إصغاء للمحاماة والاستشارات القانونية')}</b><br>
    ${s.license_note ? `${e(s.license_note)}<br>` : ''}
    ${s.address ? `${e(s.address)}<br>` : ''}
    ${contacts}
  </td></tr>
</table>
</td></tr></table></body></html>`;
}

function detailRows(rows) {
  const cell = (i) => (i ? `border-top:1px solid ${C.line};` : '');
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid ${C.line};border-radius:12px;border-collapse:separate;overflow:hidden;margin:16px 0">${rows.map(([k, v], i) => `<tr><td style="padding:12px 16px;width:105px;vertical-align:top;font-size:13px;color:${C.muted};background:#fbfaf5;${cell(i)}">${k}</td><td style="padding:12px 16px;font-size:14.5px;line-height:1.8;color:${C.ink};white-space:pre-wrap;${cell(i)}">${v}</td></tr>`).join('')}</table>`;
}

// بريد فريق إصغاء: تفاصيل الطلب + أزرار تواصل سريعة مع العميل
function leadEmail(lead, adminUrl, base, s = {}) {
  const kind = STATUS_FORM[lead.form] || 'طلب جديد';
  const intl = lead.phone ? String(lead.phone).replace(/\D/g, '').replace(/^0/, '966') : '';
  const wa = intl ? waHref(intl, `مرحبًا ${lead.name || ''}، معك إصغاء للمحاماة بخصوص طلبك عبر الموقع.`) : '';
  const link = `color:${C.green};text-decoration:none`;
  const rows = [
    ['الاسم', lead.name ? `<b>${e(lead.name)}</b>` : ''],
    ['الجوال', lead.phone ? `<a href="${e(telHref(lead.phone))}" style="${link};font-weight:bold" dir="ltr">${e(prettyPhone(lead.phone))}</a>` : ''],
    ['البريد', lead.email ? `<a href="mailto:${e(lead.email)}" style="${link}">${e(lead.email)}</a>` : ''],
    ['نوع الخدمة', e(lead.case_type)],
    ['الرسالة', e(lead.message)],
    ['الصفحة', lead.page_slug !== null && lead.page_slug !== undefined ? e(`/${lead.page_slug}`) : ''],
    ['المصدر', e([lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / '))],
    ['الوقت', e(arDate(lead.created_at || new Date(), true))],
  ].filter((r) => r[1]);
  const body = `
    <p style="margin:0 0 4px"><span style="display:inline-block;background:#e8efe9;color:${C.green};font-size:12.5px;font-weight:bold;padding:4px 12px;border-radius:999px">${e(kind)}</span></p>
    <p style="margin:10px 0 0;font-size:15px;line-height:1.9;color:${C.muted}">وصل طلب جديد من الموقع، يُفضَّل التواصل مع العميل في أسرع وقت.</p>
    ${detailRows(rows)}
    <div style="text-align:center;padding:6px 0 22px">
      ${lead.phone ? btn(telHref(lead.phone), 'اتصال بالعميل') : ''}
      ${wa ? btn(wa, 'واتساب', '#1f8f5f') : ''}
      ${btn(adminUrl, 'فتح الطلب في اللوحة', C.ink)}
    </div>`;
  return brandedEmail({ base, s, title: `طلب جديد من ${e(lead.name || 'زائر')}`, preheader: `${kind} — ${lead.name || ''}${lead.case_type ? ` — ${lead.case_type}` : ''}`, body });
}

// بريد تأكيد للعميل (إن أدخل بريده في النموذج)
function clientEmail(lead, base, s = {}) {
  const first = String(lead.name || '').trim().split(/\s+/)[0];
  const rows = [
    ['نوع الطلب', e(STATUS_FORM[lead.form] || 'طلب استشارة')],
    ['الخدمة', e(lead.case_type)],
    ['رسالتك', e(lead.message)],
    ['رقم الطلب', lead.id ? `<span dir="ltr">#${e(lead.id)}</span>` : ''],
  ].filter((r) => r[1]);
  const body = `
    <p style="margin:0;font-size:15.5px;line-height:2;color:${C.ink}">أهلًا ${e(first)}،</p>
    <p style="margin:6px 0 0;font-size:15px;line-height:2;color:${C.muted}">شكرًا لتواصلك مع <b style="color:${C.green}">إصغاء للمحاماة والاستشارات القانونية</b>. استلمنا طلبك وسيتواصل معك أحد مستشارينا خلال ساعات العمل، ونتعامل مع بياناتك بسرية تامة.</p>
    ${detailRows(rows)}
    <p style="margin:0 0 6px;font-size:14px;color:${C.muted};text-align:center">تحتاج ردًّا أسرع؟</p>
    <div style="text-align:center;padding:0 0 22px">
      ${s.phone ? btn(telHref(s.phone), 'اتصل بنا') : ''}
      ${s.whatsapp ? btn(waHref(s.whatsapp, `مرحبًا، أرسلت طلبًا عبر الموقع${lead.id ? ` برقم #${lead.id}` : ''}`), 'تواصل عبر واتساب', '#1f8f5f') : ''}
    </div>`;
  return brandedEmail({ base, s, title: 'استلمنا طلبك، شكرًا لك', preheader: 'استلمنا طلبك وسيتواصل معك أحد مستشارينا قريبًا.', body });
}

const sha = (v) => crypto.createHash('sha256').update(String(v).trim().toLowerCase()).digest('hex');

async function metaCapi(s, lead, ctx) {
  if (!s.meta_pixel_id || !s.meta_capi_token) return;
  const user_data = {
    client_ip_address: ctx.ip,
    client_user_agent: ctx.userAgent,
  };
  if (lead.phone) user_data.ph = [sha(lead.phone)];
  if (lead.email) user_data.em = [sha(lead.email)];
  if (lead.name) user_data.fn = [sha(String(lead.name).split(/\s+/)[0])];
  user_data.country = [sha('sa')];
  if (ctx.fbp) user_data.fbp = ctx.fbp;
  if (ctx.fbc) user_data.fbc = ctx.fbc;
  const body = {
    data: [{
      event_name: 'Lead',
      event_time: Math.floor(Date.now() / 1000),
      event_id: lead.event_id,
      action_source: 'website',
      event_source_url: ctx.url,
      user_data,
      custom_data: { content_category: lead.case_type || lead.form },
    }],
  };
  if (s.meta_test_code) body.test_event_code = s.meta_test_code;
  const res = await fetch(`https://graph.facebook.com/v21.0/${encodeURIComponent(s.meta_pixel_id)}/events?access_token=${encodeURIComponent(s.meta_capi_token)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`Meta CAPI ${res.status}: ${(await res.text()).slice(0, 200)}`);
}

async function webhook(s, lead) {
  if (!s.webhook_url) return;
  const payload = JSON.stringify({ event: 'lead.created', lead });
  const headers = { 'Content-Type': 'application/json' };
  if (s.webhook_secret) headers['X-Isgha-Signature'] = crypto.createHmac('sha256', s.webhook_secret).update(payload).digest('hex');
  const res = await fetch(s.webhook_url, { method: 'POST', headers, body: payload, signal: AbortSignal.timeout(10000), redirect: 'follow' });
  if (!res.ok && res.status >= 400) throw new Error(`Webhook ${res.status}`);
}

// يُستدعى بعد حفظ الطلب — لا ينتظره المستخدم
export async function notifyLead(lead, ctx) {
  const s = await getSettings();
  const tasks = [];
  const to = String(s.notify_emails || '').split(',').map((x) => x.trim()).filter(Boolean);
  if (to.length) {
    tasks.push(
      sendMail({
        to: to.join(','),
        subject: `${STATUS_FORM[lead.form] || 'طلب جديد'}: ${lead.name || ''} ${lead.case_type ? '— ' + lead.case_type : ''}`.trim(),
        html: leadEmail(lead, `${ctx.base}/admin/leads/${lead.id}`, ctx.base, s),
        replyTo: lead.email || undefined,
      }).catch((e) => console.error('[notify] mail:', e.message)),
    );
  }
  // تأكيد للعميل على بريده (إن أدخله) — ردّه يصل لبريد الشركة
  if (lead.email) {
    tasks.push(
      sendMail({
        to: lead.email,
        subject: 'استلمنا طلبك — إصغاء للمحاماة والاستشارات القانونية',
        html: clientEmail(lead, ctx.base, s),
        replyTo: s.email || undefined,
      }).catch((err) => console.error('[notify] client mail:', err.message)),
    );
  }
  tasks.push(webhook(s, lead).catch((e) => console.error('[notify] webhook:', e.message)));
  tasks.push(metaCapi(s, lead, ctx).catch((e) => console.error('[notify] capi:', e.message)));
  await Promise.all(tasks);
}

export { metaCapi as _metaCapi, webhook as _webhook, leadEmail as _leadEmail, clientEmail as _clientEmail };
