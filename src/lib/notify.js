// إشعارات الطلب الجديد: بريد + Webhook + Meta Conversions API
import crypto from 'node:crypto';
import nodemailer from 'nodemailer';
import config from '../config.js';
import { getSettings } from './settings.js';
import { escapeHtml, arDate } from './text.js';
import { prettyPhone } from './phone.js';

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

function leadEmail(lead, adminUrl) {
  const rows = [
    ['الاسم', lead.name],
    ['الجوال', prettyPhone(lead.phone)],
    ['البريد', lead.email],
    ['النوع', lead.case_type],
    ['الرسالة', lead.message],
    ['الصفحة', lead.page_slug ? `/${lead.page_slug}` : ''],
    ['المصدر', [lead.utm_source, lead.utm_medium, lead.utm_campaign].filter(Boolean).join(' / ')],
    ['التاريخ', arDate(lead.created_at || new Date(), true)],
  ].filter((r) => r[1]);
  return `<!doctype html><html dir="rtl" lang="ar"><body style="margin:0;background:#faf9f4;font-family:Tahoma,Arial,sans-serif;color:#141817">
  <div style="max-width:560px;margin:24px auto;background:#fff;border:1px solid #e7e5dc;border-radius:16px;overflow:hidden">
    <div style="background:#215d41;color:#fff;padding:18px 22px;font-size:17px;font-weight:bold">${escapeHtml(STATUS_FORM[lead.form] || 'طلب جديد')} — إصغاء</div>
    <table style="width:100%;border-collapse:collapse;font-size:14px">${rows.map(([k, v]) => `<tr><td style="padding:10px 22px;color:#6d7672;width:90px;vertical-align:top;border-bottom:1px solid #f1f0ea">${k}</td><td style="padding:10px 22px;border-bottom:1px solid #f1f0ea;white-space:pre-wrap">${escapeHtml(v)}</td></tr>`).join('')}</table>
    <div style="padding:18px 22px"><a href="${escapeHtml(adminUrl)}" style="display:inline-block;background:#141817;color:#fff;text-decoration:none;padding:11px 20px;border-radius:10px">فتح الطلب في لوحة التحكم</a></div>
  </div></body></html>`;
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
        html: leadEmail(lead, `${ctx.base}/admin/leads/${lead.id}`),
        replyTo: lead.email || undefined,
      }).catch((e) => console.error('[notify] mail:', e.message)),
    );
  }
  tasks.push(webhook(s, lead).catch((e) => console.error('[notify] webhook:', e.message)));
  tasks.push(metaCapi(s, lead, ctx).catch((e) => console.error('[notify] capi:', e.message)));
  await Promise.all(tasks);
}

export { metaCapi as _metaCapi, webhook as _webhook };
