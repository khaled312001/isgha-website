// تنظيف القيم القادمة من نماذج لوحة التحكم حسب تعريف الحقول (نفس تعريفات المنشئ والإعدادات والمحتوى)
import { cleanRich } from './sanitize.js';

const ICON_RE = /^[a-z0-9-]{1,40}$/;

function str(v, max = 5000) {
  if (v === null || v === undefined) return '';
  return String(v).replace(/\r\n/g, '\n').trim().slice(0, max);
}

function safeUrl(v) {
  const s = str(v, 500);
  if (!s) return '';
  if (/^(\/(?!\/)|https?:\/\/|#|tel:|mailto:)/i.test(s)) return s;
  return '';
}

export function coerceField(f, v, ctx = {}) {
  switch (f.type) {
    case 'toggle':
      return v === true || v === 1 || ['1', 'true', 'on', 'yes'].includes(String(v).toLowerCase());
    case 'number': {
      if (v === '' || v === null || v === undefined) return f.default ?? 0;
      const n = Number(v);
      return Number.isFinite(n) ? n : (f.default ?? 0);
    }
    case 'list': {
      const arr = Array.isArray(v) ? v : str(v, 20000).split('\n');
      return arr.map((x) => str(x, 1000)).filter(Boolean).slice(0, 200);
    }
    case 'repeater': {
      if (!Array.isArray(v)) return [];
      return v.slice(0, 100).map((item) => coerceFields(f.fields || [], item && typeof item === 'object' ? item : {}, ctx));
    }
    case 'checks': {
      const out = {};
      const src = v && typeof v === 'object' ? v : {};
      for (const [k] of f.options || []) out[k] = coerceField({ type: 'toggle' }, src[k]);
      return out;
    }
    case 'richtext':
      return cleanRich(str(v, 200000));
    case 'code':
      // الأكواد المخصصة تُحفظ فقط لمن يملك الصلاحية، وإلا تبقى القيمة السابقة
      return ctx.allowCode ? (v == null ? '' : String(v).slice(0, 100000)) : (ctx.prev?.[f.name] ?? f.default ?? '');
    case 'image':
    case 'url':
      return safeUrl(v);
    case 'icon': {
      const s = str(v, 40);
      return ICON_RE.test(s) ? s : '';
    }
    case 'select': {
      const s = str(v, 190);
      if (f.options && !f.source) {
        return f.options.some((o) => String(o[0]) === s) ? s : String(f.default ?? (f.options[0]?.[0] ?? ''));
      }
      return s;
    }
    case 'datetime': {
      if (!v) return null;
      const d = new Date(v);
      return Number.isNaN(d.getTime()) ? null : d;
    }
    case 'email': {
      const s = str(v, 190).toLowerCase();
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s) ? s : '';
    }
    case 'slug':
      return str(v, 190).toLowerCase().replace(/[^a-z0-9؀-ۿ-]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    case 'textarea':
      return str(v, f.max || 20000);
    default:
      return str(v, f.max || 2000);
  }
}

export function coerceFields(fields, input, ctx = {}) {
  const out = {};
  const src = input && typeof input === 'object' ? input : {};
  for (const f of fields) {
    if (f.type === 'secret') continue; // تُعالج بشكل منفصل
    if (f.readonly) continue;
    out[f.name] = coerceField(f, src[f.name], ctx);
  }
  return out;
}

// تحويل القيم لصيغة التخزين في الجداول (القوائم كسطور، الكائنات كـ JSON)
export function toStorage(fields, data) {
  const row = {};
  for (const f of fields) {
    if (!(f.name in data)) continue;
    const v = data[f.name];
    if (f.virtual) continue;
    if (f.type === 'list') row[f.name] = v.join('\n');
    else if (f.type === 'checks' || f.type === 'repeater') row[f.name] = JSON.stringify(v);
    else if (f.type === 'toggle') row[f.name] = v ? 1 : 0;
    else if ((f.type === 'datetime' || f.type === 'select') && v === '') row[f.name] = null;
    else row[f.name] = v;
  }
  return row;
}

// تحويل الصف من قاعدة البيانات إلى قيم للنموذج
export function fromStorage(fields, row) {
  const out = {};
  for (const f of fields) {
    let v = row?.[f.name];
    if (f.type === 'list') v = String(v || '').split('\n').map((x) => x.trim()).filter(Boolean);
    else if (f.type === 'checks' || f.type === 'repeater') {
      try { v = typeof v === 'string' ? JSON.parse(v) : v; } catch { v = null; }
      v ||= f.type === 'repeater' ? [] : {};
    } else if (f.type === 'toggle') v = Boolean(v ?? f.default);
    else if (f.type === 'datetime') v = v ? new Date(v).toISOString() : '';
    else if (v === null || v === undefined) v = f.default ?? '';
    out[f.name] = v;
  }
  return out;
}
