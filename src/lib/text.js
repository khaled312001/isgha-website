// أدوات النصوص العربية والتنسيق

const ESC = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
export function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"']/g, (c) => ESC[c]);
}

// ==كلمة== ← تظليل بالماركر الأصفر، **كلمة** ← غامق، سطر جديد ← <br>
export function markup(s) {
  return escapeHtml(s)
    .replace(/==(.+?)==/g, '<mark>$1</mark>')
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\r?\n/g, '<br>');
}

// يحذف رموز التنسيق للاستخدام في العناوين والوصف
export function plain(s) {
  return String(s ?? '').replace(/==|\*\*/g, '').replace(/\s+/g, ' ').trim();
}

// تحويل نص متعدد الأسطر أو مصفوفة إلى قائمة عناصر
export function lines(v) {
  if (Array.isArray(v)) return v.map((x) => String(x).trim()).filter(Boolean);
  if (v == null) return [];
  const s = String(v).trim();
  if (s.startsWith('[')) {
    try {
      const arr = JSON.parse(s);
      if (Array.isArray(arr)) return arr.map((x) => String(x).trim()).filter(Boolean);
    } catch { /* نص عادي */ }
  }
  return s.split(/\r?\n/).map((x) => x.trim()).filter(Boolean);
}

// «العنوان: الوصف» ← { title, text }
export function splitLead(item) {
  const s = String(item ?? '');
  const idx = s.indexOf(':');
  if (idx > 0 && idx < 90) return { title: s.slice(0, idx).trim(), text: s.slice(idx + 1).trim() };
  return { title: '', text: s.trim() };
}

const AR_DIGITS = '٠١٢٣٤٥٦٧٨٩';
export function arDigits(n) {
  return String(n ?? '').replace(/\d/g, (d) => AR_DIGITS[d]);
}
export function enDigits(s) {
  return String(s ?? '').replace(/[٠-٩]/g, (d) => AR_DIGITS.indexOf(d)).replace(/[۰-۹]/g, (d) => '۰۱۲۳۴۵۶۷۸۹'.indexOf(d));
}

// slug يدعم العربية والإنجليزية
export function slugify(input, { arabic = true } = {}) {
  let s = enDigits(String(input ?? '')).toLowerCase().trim();
  s = s.replace(/[ً-ٰٟـ]/g, ''); // التشكيل والتطويل
  s = s.replace(/[أإآ]/g, 'ا');
  const allowed = arabic ? /[^a-z0-9ء-ي\s-]/g : /[^a-z0-9\s-]/g;
  s = s.replace(allowed, ' ').replace(/[\s_]+/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
  return s.slice(0, 120);
}

export function truncate(s, n = 160) {
  const t = plain(s);
  if (t.length <= n) return t;
  return t.slice(0, n).replace(/\s+\S*$/, '') + '…';
}

export function stripTags(html) {
  return String(html ?? '').replace(/<style[\s\S]*?<\/style>/gi, ' ').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/\s+/g, ' ').trim();
}

export function readingMinutes(html) {
  const words = stripTags(html).split(' ').filter(Boolean).length;
  return Math.max(1, Math.round(words / 180));
}

const AR_MONTHS = ['يناير', 'فبراير', 'مارس', 'أبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
export function arDate(d, withTime = false) {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(x.getTime())) return '';
  // التاريخ بتوقيت الرياض
  const r = new Date(x.getTime() + 3 * 3600 * 1000);
  let out = `${r.getUTCDate()} ${AR_MONTHS[r.getUTCMonth()]} ${r.getUTCFullYear()}`;
  if (withTime) {
    let h = r.getUTCHours();
    const m = String(r.getUTCMinutes()).padStart(2, '0');
    const suffix = h >= 12 ? 'م' : 'ص';
    h = h % 12 || 12;
    out += ` · ${h}:${m} ${suffix}`;
  }
  return out;
}

export function relTime(d) {
  if (!d) return '';
  const x = d instanceof Date ? d : new Date(d);
  const s = Math.round((Date.now() - x.getTime()) / 1000);
  if (s < 60) return 'الآن';
  if (s < 3600) return `قبل ${Math.round(s / 60)} د`;
  if (s < 86400) return `قبل ${Math.round(s / 3600)} س`;
  if (s < 86400 * 7) return `قبل ${Math.round(s / 86400)} يوم`;
  return arDate(x);
}

export function riyadhDay(d = new Date()) {
  const r = new Date(d.getTime() + 3 * 3600 * 1000);
  return r.toISOString().slice(0, 10);
}
