// طلبات العملاء (CRM مبسّط): فلترة، حالات، ملاحظات، إسناد، تصدير
import { Router } from 'express';
import db from '../../db.js';
import { requirePerm } from '../../lib/auth.js';
import { logActivity } from '../../lib/activity.js';
import { prettyPhone } from '../../lib/phone.js';
import { cleanText } from '../../lib/sanitize.js';
import { wrap, paginate, flash, wantsJson, csvCell, leadSource, LEAD_STATUSES, LEAD_STATUS_MAP, FORM_LABELS } from './util.js';

const router = Router();
router.use(requirePerm('leads'));

const STATUS_KEYS = new Set(LEAD_STATUSES.map((s) => s[0]));

function filtered(q) {
  const query = db('leads as l').leftJoin('pages as p', 'p.id', 'l.page_id').leftJoin('users as u', 'u.id', 'l.assigned_to')
    .select('l.*', 'p.title as page_title', 'p.kind as page_kind', 'u.name as assignee');
  if (q.status && STATUS_KEYS.has(q.status)) query.where('l.status', q.status);
  else if (!q.status) query.whereNot('l.status', 'spam');
  if (q.form) query.where('l.form', q.form);
  if (q.page_id) query.where('l.page_id', Number(q.page_id));
  if (q.source) {
    if (q.source === 'ads') query.whereNotNull('l.click_type');
    else if (q.source === 'organic') query.whereNull('l.click_type').whereNull('l.utm_source');
    else query.where((w) => w.where('l.click_type', q.source).orWhere('l.utm_source', q.source));
  }
  if (q.campaign) query.where('l.utm_campaign', q.campaign);
  if (q.from) query.where('l.created_at', '>=', new Date(`${q.from}T00:00:00+03:00`));
  if (q.to) query.where('l.created_at', '<', new Date(new Date(`${q.to}T00:00:00+03:00`).getTime() + 86400000));
  if (q.assigned === 'me') query.where('l.assigned_to', q._uid);
  if (q.q) {
    const s = `%${String(q.q).trim().replace(/[%_]/g, '\\$&')}%`;
    const digits = String(q.q).replace(/\D/g, '');
    query.where((w) => {
      w.where('l.name', 'like', s).orWhere('l.email', 'like', s).orWhere('l.message', 'like', s).orWhere('l.case_type', 'like', s);
      if (digits.length >= 4) w.orWhere('l.phone', 'like', `%${digits.replace(/^0/, '')}%`);
    });
  }
  return query;
}

router.get('/', wrap(async (req, res) => {
  const q = { ...req.query, _uid: req.user.id };
  const result = await paginate(filtered(q).orderBy('l.id', 'desc'), req.query.page, 30);
  const [pages, users, statusCounts, campaigns] = await Promise.all([
    db('pages').select('id', 'title', 'kind').orderBy('kind').orderBy('title'),
    db('users').select('id', 'name').where({ is_active: true }),
    db('leads').select('status').count({ n: '*' }).groupBy('status'),
    db('leads').distinct('utm_campaign').whereNotNull('utm_campaign').limit(100),
  ]);
  const counts = Object.fromEntries(statusCounts.map((r) => [r.status, Number(r.n)]));
  res.render('admin/leads/index.njk', {
    title: 'طلبات العملاء', active: 'leads',
    leads: result.rows.map((l) => ({ ...l, source: leadSource(l), st: LEAD_STATUS_MAP[l.status] || LEAD_STATUS_MAP.new, phonePretty: prettyPhone(l.phone) })),
    pager: result, q: req.query, pages, users, counts, campaigns: campaigns.map((c) => c.utm_campaign),
    statuses: LEAD_STATUSES, formLabels: FORM_LABELS,
    qs: new URLSearchParams(Object.entries(req.query).filter(([k, v]) => k !== 'page' && v)).toString(),
  });
}));

router.get('/export.csv', wrap(async (req, res) => {
  const rows = await filtered({ ...req.query, _uid: req.user.id }).orderBy('l.id', 'desc').limit(20000);
  const head = ['#', 'التاريخ', 'الاسم', 'الجوال', 'البريد', 'نوع القضية/الخدمة', 'الرسالة', 'الحالة', 'النموذج', 'الصفحة', 'المصدر', 'utm_source', 'utm_medium', 'utm_campaign', 'utm_term', 'utm_content', 'click_id', 'المسؤول', 'القيمة'];
  const lines = [head.map(csvCell).join(',')];
  for (const l of rows) {
    lines.push([
      l.id, l.created_at, l.name, l.phone, l.email, l.case_type, l.message, LEAD_STATUS_MAP[l.status]?.label || l.status, FORM_LABELS[l.form] || l.form,
      l.page_title || '', leadSource(l), l.utm_source, l.utm_medium, l.utm_campaign, l.utm_term, l.utm_content, l.click_id, l.assignee || '', l.value || '',
    ].map(csvCell).join(','));
  }
  logActivity(req, 'export', 'leads', null, `${rows.length} طلب`);
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="isgha-leads-${new Date().toISOString().slice(0, 10)}.csv"`);
  res.send(`﻿${lines.join('\r\n')}`);
}));

router.post('/bulk', wrap(async (req, res) => {
  const ids = (Array.isArray(req.body.ids) ? req.body.ids : String(req.body.ids || '').split(',')).map(Number).filter(Boolean).slice(0, 500);
  const action = String(req.body.action || '');
  if (!ids.length) {
    flash(req, 'error', 'اختر طلبًا واحدًا على الأقل.');
  } else if (action === 'delete') {
    await db('leads').whereIn('id', ids).del();
    logActivity(req, 'delete', 'leads', ids.join(','), `حذف ${ids.length} طلب`);
    flash(req, 'success', `تم حذف ${ids.length} طلب.`);
  } else if (STATUS_KEYS.has(action)) {
    await db('leads').whereIn('id', ids).update({ status: action, updated_at: new Date() });
    logActivity(req, 'status', 'leads', ids.join(','), `${ids.length} ← ${LEAD_STATUS_MAP[action].label}`);
    flash(req, 'success', `تم تحديث ${ids.length} طلب.`);
  }
  res.redirect(`/admin/leads${req.body.back ? `?${String(req.body.back).replace(/^\?/, '')}` : ''}`);
}));

async function loadLead(id) {
  return db('leads as l').leftJoin('pages as p', 'p.id', 'l.page_id').select('l.*', 'p.title as page_title', 'p.slug as page_slug2', 'p.kind as page_kind').where('l.id', Number(id)).first();
}

router.get('/:id', wrap(async (req, res, next) => {
  const lead = await loadLead(req.params.id);
  if (!lead) return next();
  const [notes, users, others] = await Promise.all([
    db('lead_notes as n').leftJoin('users as u', 'u.id', 'n.user_id').select('n.*', 'u.name as user_name').where('n.lead_id', lead.id).orderBy('n.id', 'desc'),
    db('users').select('id', 'name').where({ is_active: true }),
    db('leads').select('id', 'created_at', 'status', 'case_type').where('phone', lead.phone).andWhereNot('id', lead.id).orderBy('id', 'desc').limit(10),
  ]);
  let meta = {};
  try { meta = JSON.parse(lead.meta || '{}'); } catch { meta = {}; }
  const S = res.locals.S;
  const waText = `السلام عليكم ${lead.name || ''}، معك فريق ${S.brand_short || 'إصغاء'} للمحاماة بخصوص طلبك${lead.case_type ? ` (${lead.case_type})` : ''}.`;
  res.render('admin/leads/show.njk', {
    title: `طلب #${lead.id}`, active: 'leads', lead, notes, users, others, meta,
    st: LEAD_STATUS_MAP[lead.status] || LEAD_STATUS_MAP.new, statuses: LEAD_STATUSES, source: leadSource(lead), formLabels: FORM_LABELS,
    phonePretty: prettyPhone(lead.phone), waText,
    prevId: (await db('leads').where('id', '>', lead.id).orderBy('id').first('id'))?.id,
    nextId: (await db('leads').where('id', '<', lead.id).orderBy('id', 'desc').first('id'))?.id,
  });
}));

router.post('/:id/update', wrap(async (req, res, next) => {
  const lead = await db('leads').where({ id: Number(req.params.id) }).first();
  if (!lead) return next();
  const b = req.body || {};
  const patch = { updated_at: new Date() };
  const notes = [];
  if (b.status !== undefined && STATUS_KEYS.has(b.status) && b.status !== lead.status) {
    patch.status = b.status;
    if (b.status !== 'new' && !lead.contacted_at) patch.contacted_at = new Date();
    notes.push({ kind: 'status', body: `غيّر الحالة إلى «${LEAD_STATUS_MAP[b.status].label}»` });
  }
  if (b.assigned_to !== undefined) {
    const uid = Number(b.assigned_to) || null;
    if (uid !== lead.assigned_to) {
      patch.assigned_to = uid;
      const who = uid ? await db('users').where({ id: uid }).first('name') : null;
      notes.push({ kind: 'assign', body: who ? `أسند الطلب إلى ${who.name}` : 'ألغى الإسناد' });
    }
  }
  if (b.value !== undefined) {
    const v = b.value === '' ? null : Number(String(b.value).replace(/[^\d.]/g, ''));
    patch.value = Number.isFinite(v) ? v : null;
  }
  const noteText = cleanText(b.note, 3000);
  if (noteText) notes.push({ kind: 'note', body: noteText });
  await db.transaction(async (trx) => {
    await trx('leads').where({ id: lead.id }).update(patch);
    for (const n of notes) await trx('lead_notes').insert({ lead_id: lead.id, user_id: req.user.id, kind: n.kind, body: n.body });
  });
  if (patch.status) logActivity(req, 'status', 'lead', lead.id, `${lead.name} ← ${LEAD_STATUS_MAP[patch.status].label}`);
  if (wantsJson(req)) return res.json({ ok: true, status: patch.status || lead.status });
  flash(req, 'success', 'تم الحفظ.');
  res.redirect(`/admin/leads/${lead.id}`);
}));

router.post('/:id/delete', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const lead = await db('leads').where({ id }).first('name');
  await db('leads').where({ id }).del();
  logActivity(req, 'delete', 'lead', id, lead?.name);
  flash(req, 'success', 'تم حذف الطلب.');
  res.redirect('/admin/leads');
}));

export default router;
