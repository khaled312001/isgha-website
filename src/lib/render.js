// تجهيز بيانات القوالب: الإعدادات، البيانات التلقائية للأقسام، دوال مساعدة
import { getSettings } from './settings.js';
import {
  getCategories, getPracticeAreas, getPackages, getBeneficiaries, getFaqs, getTestimonials, getTeam, getLatestPosts, getPackageCompareRows,
} from './content.js';
import { normalizeSections } from '../content/sections.js';
import { stripTags, escapeHtml } from './text.js';
import config from '../config.js';

export function ytId(url) {
  const m = String(url || '').match(/(?:youtu\.be\/|v=|embed\/|shorts\/)([\w-]{11})/);
  return m ? m[1] : null;
}

export function withHeadingIds(html) {
  let i = 0;
  return String(html || '').replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (all, lvl, attrs, inner) => {
    i += 1;
    if (/\sid=/.test(attrs)) return all;
    return `<h${lvl}${attrs} id="h-${i}">${inner}</h${lvl}>`;
  });
}

export function tocOf(html) {
  const out = [];
  let i = 0;
  String(html || '').replace(/<h([23])([^>]*)>([\s\S]*?)<\/h\1>/g, (all, lvl, attrs, inner) => {
    i += 1;
    const id = (attrs.match(/\sid="([^"]+)"/) || [])[1] || `h-${i}`;
    if (lvl === '2') out.push({ id, text: stripTags(inner) });
    return all;
  });
  return out;
}

// الدوال والمتغيرات المتاحة لكل قوالب الموقع
export async function siteLocals(req, res) {
  const S = await getSettings();
  const cats = await getCategories();
  res.locals.S = S;
  res.locals.navCats = cats;
  res.locals.currentPath = req.path;
  res.locals.caseTypes = S.case_types || [];
  res.locals.ts = Date.now();
  res.locals.ytId = ytId;
  res.locals.tocOf = tocOf;
  res.locals.withHeadingIds = withHeadingIds;
  res.locals.imgFor = (url, slot) => url || (slot ? S[`img_${slot}`] : '') || '';
  res.locals.clientCfg = {
    adsId: S.google_ads_id || '',
    adsLead: S.google_ads_lead_label || '',
    adsCall: S.google_ads_call_label || '',
    xLead: S.x_lead_event || '',
    liConv: S.linkedin_conversion_id || '',
    pageId: null,
  };
  return { S, cats };
}

// يحمّل البيانات التي تحتاجها الأقسام التلقائية فقط
export async function loadSectionData(sections) {
  const visible = sections.filter((s) => !s.hidden);
  const types = new Set(visible.map((s) => s.type));
  const D = { faqs: {} };
  const jobs = [];
  if (['hero_home', 'services_overview', 'specializations'].some((t) => types.has(t))) {
    jobs.push(getCategories().then((c) => { D.categories = c; D.catBySlug = Object.fromEntries(c.map((x) => [x.slug, x])); }));
  }
  if (types.has('practice_areas')) jobs.push(getPracticeAreas().then((a) => { D.areas = a; }));
  if (types.has('packages')) {
    jobs.push(getPackages().then((p) => { D.packages = p; }));
    jobs.push(getPackageCompareRows().then((r) => { D.compareRows = r; }));
  }
  if (types.has('beneficiaries')) jobs.push(getBeneficiaries().then((b) => { D.beneficiaries = b; }));
  if (visible.some((s) => s.type === 'testimonials' && s.data.source !== 'items')) jobs.push(getTestimonials().then((t) => { D.testimonials = t; }));
  for (const s of visible.filter((x) => x.type === 'faq' && x.data.source !== 'items')) {
    const g = s.data.group || 'general';
    jobs.push(getFaqs(g).then((f) => { D.faqs[g] = f; }));
  }
  if (types.has('team')) jobs.push(getTeam().then((t) => { D.team = t; }));
  if (types.has('posts_latest')) {
    const n = Number(visible.find((s) => s.type === 'posts_latest')?.data?.count || 3);
    jobs.push(getLatestPosts(Math.min(Math.max(n, 1), 12)).then((p) => { D.posts = p; }));
  }
  await Promise.all(jobs);
  D.categories ||= [];
  D.catBySlug ||= {};
  D.areas ||= [];
  D.packages ||= [];
  D.beneficiaries ||= [];
  D.testimonials ||= [];
  D.team ||= [];
  D.posts ||= [];
  D.compareRows ||= [];
  return D;
}

// الأسئلة الموجودة في الصفحة لإضافتها كـ FAQ Schema
export function faqItemsFor(sections, D) {
  const out = [];
  for (const s of sections) {
    if (s.hidden || s.type !== 'faq' || !s.data.schema) continue;
    const list = s.data.source === 'items' ? s.data.items : D.faqs[s.data.group || 'general'];
    for (const f of list || []) out.push({ q: f.q || f.question, a: f.a || f.answer });
  }
  return out;
}

export function preparedSections(page) {
  let raw = page.sections;
  if (typeof raw === 'string') {
    try { raw = JSON.parse(raw); } catch { raw = []; }
  }
  return normalizeSections(raw);
}

export function pageSettings(page) {
  if (!page.settings) return {};
  if (typeof page.settings === 'object') return page.settings;
  try { return JSON.parse(page.settings) || {}; } catch { return {}; }
}

export { escapeHtml, config };
