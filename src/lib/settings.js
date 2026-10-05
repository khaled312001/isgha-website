import db, { parseJSON } from '../db.js';
import { remember, forget } from './cache.js';
import { SETTINGS_GROUPS, settingDefaults } from '../content/settings-schema.js';
import { IMAGE_SLOTS } from '../content/image-slots.js';

const DEFAULTS = settingDefaults();
for (const s of IMAGE_SLOTS) DEFAULTS[`img_${s.key}`] = '';

const TYPES = {};
for (const g of SETTINGS_GROUPS) for (const f of g.fields) TYPES[f.name] = f.type;

function decode(key, raw) {
  const type = TYPES[key];
  if (type === 'repeater' || type === 'list' || type === 'json') return parseJSON(raw, DEFAULTS[key] ?? []);
  if (type === 'toggle') return raw === '1' || raw === 'true';
  return raw ?? '';
}

function encode(key, value) {
  const type = TYPES[key];
  if (type === 'repeater' || type === 'list' || type === 'json' || (value && typeof value === 'object')) return JSON.stringify(value ?? []);
  if (type === 'toggle') return value ? '1' : '0';
  return value == null ? '' : String(value);
}

export async function getSettings() {
  return remember('settings', async () => {
    const rows = await db('settings').select('key', 'value');
    const out = { ...DEFAULTS };
    for (const r of rows) out[r.key] = decode(r.key, r.value);
    // خانة صورة فارغة ← الصورة الافتراضية المرفقة مع الموقع
    for (const s of IMAGE_SLOTS) if (!out[`img_${s.key}`]) out[`img_${s.key}`] = s.default;
    return out;
  });
}

export async function setSettings(values) {
  const entries = Object.entries(values);
  if (!entries.length) return;
  await db.transaction(async (trx) => {
    for (const [key, value] of entries) {
      const v = encode(key, value);
      await trx.raw('INSERT INTO settings (`key`, `value`, updated_at) VALUES (?, ?, NOW()) ON DUPLICATE KEY UPDATE `value` = VALUES(`value`), updated_at = NOW()', [key, v]);
    }
  });
  forget('settings');
}

export function settingType(key) {
  return TYPES[key];
}
