// إنشاء أو تحديث حساب مدير:
//   npm run create-admin -- --email you@example.com --name "الاسم" [--role owner] [--password "..."]
// إذا لم تُمرَّر كلمة مرور تُولَّد كلمة قوية وتُطبع مرة واحدة.
import crypto from 'node:crypto';
import db from '../src/db.js';
import { hashPassword, checkPasswordStrength } from '../src/lib/auth.js';
import { ROLES } from '../src/content/permissions.js';

function arg(name) {
  const i = process.argv.indexOf(`--${name}`);
  return i > -1 ? process.argv[i + 1] : undefined;
}

const email = String(arg('email') || process.env.ADMIN_EMAIL || '').trim().toLowerCase();
const name = arg('name') || process.env.ADMIN_NAME || 'مدير الموقع';
const roleArg = arg('role');
const role = roleArg || 'owner';
let password = arg('password') || process.env.ADMIN_PASSWORD || '';

try {
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error('أدخل بريدًا صحيحًا: --email you@example.com');
  if (!ROLES[role]) throw new Error(`الدور غير معروف. المتاح: ${Object.keys(ROLES).join(', ')}`);
  let generated = false;
  if (!password) {
    password = crypto.randomBytes(12).toString('base64url') + '7a';
    generated = true;
  }
  const weak = checkPasswordStrength(password);
  if (weak) throw new Error(weak);
  await db.migrate.latest();
  const hash = await hashPassword(password);
  const existing = await db('users').where({ email }).first();
  if (existing) {
    // إعادة تعيين كلمة المرور تحافظ على الدور الحالي ما لم يُمرَّر --role
    const newRole = roleArg || existing.role;
    await db('users').where({ id: existing.id }).update({ password_hash: hash, role: newRole, is_active: true, failed_logins: 0, locked_until: null, updated_at: new Date() });
    console.log(`تم تحديث الحساب: ${email} (${newRole})`);
  } else {
    await db('users').insert({ name, email, password_hash: hash, role, is_active: true });
    console.log(`تم إنشاء الحساب: ${email} (${role})`);
  }
  if (generated) console.log(`كلمة المرور (احفظها الآن ولن تظهر مجددًا): ${password}`);
} catch (e) {
  console.error('خطأ:', e.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
