// حسابات التواصل الاجتماعي الرسمية لإصغاء — تُضاف فقط إن كانت الخانة فارغة (آمن للتكرار)
//   node scripts/content-update-2026-10-social.js
import db from '../src/db.js';
import { setSettings } from '../src/lib/settings.js';
import { settingDefaults } from '../src/content/settings-schema.js';

const KEYS = ['social_x', 'social_instagram', 'social_tiktok', 'social_snapchat'];

try {
  const defaults = settingDefaults();
  const rows = await db('settings').whereIn('key', KEYS).select('key', 'value');
  const current = Object.fromEntries(rows.map((r) => [r.key, String(r.value || '').trim()]));
  const patch = {};
  for (const k of KEYS) if (!current[k]) patch[k] = defaults[k];
  if (Object.keys(patch).length) await setSettings(patch);
  console.log(Object.keys(patch).length ? Object.entries(patch).map(([k, v]) => `${k} = ${v}`).join('\n') : 'nothing to change');
} catch (e) {
  console.error('failed:', e.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
