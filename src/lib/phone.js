import { enDigits } from './text.js';

// توحيد أرقام الجوال السعودية إلى صيغة 9665XXXXXXXX
export function normalizePhone(input) {
  let d = enDigits(input).replace(/[^\d+]/g, '');
  d = d.replace(/^\+/, '').replace(/^00/, '');
  if (/^05\d{8}$/.test(d)) return '966' + d.slice(1);
  if (/^5\d{8}$/.test(d)) return '966' + d;
  if (/^9665\d{8}$/.test(d)) return d;
  if (/^\d{8,15}$/.test(d)) return d; // رقم دولي آخر
  return '';
}

export function isValidPhone(input) {
  return normalizePhone(input).length >= 9;
}

export function telHref(phone) {
  const n = normalizePhone(phone);
  return n ? `tel:+${n}` : `tel:${String(phone || '').replace(/[^\d+]/g, '')}`;
}

export function waHref(number, message = '') {
  let n = enDigits(number || '').replace(/\D/g, '');
  if (n.startsWith('0')) n = '966' + n.slice(1);
  return `https://wa.me/${n}${message ? `?text=${encodeURIComponent(message)}` : ''}`;
}

// عرض الرقم بشكل مقروء: 055 888 2700
export function prettyPhone(phone) {
  const n = normalizePhone(phone);
  if (/^9665\d{8}$/.test(n)) {
    const local = '0' + n.slice(3);
    return `${local.slice(0, 3)} ${local.slice(3, 6)} ${local.slice(6)}`;
  }
  return phone || '';
}
