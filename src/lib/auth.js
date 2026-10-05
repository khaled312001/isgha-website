import bcrypt from 'bcryptjs';
import db, { parseJSON } from '../db.js';
import { ROLES } from '../content/permissions.js';

export async function hashPassword(pw) {
  return bcrypt.hash(String(pw), 12);
}

export function checkPasswordStrength(pw) {
  const s = String(pw || '');
  if (s.length < 10) return 'كلمة المرور يجب ألا تقل عن 10 أحرف.';
  if (!/[A-Za-zء-ي]/.test(s) || !/\d/.test(s)) return 'استخدم حروفًا وأرقامًا معًا.';
  return null;
}

export function userPermissions(user) {
  if (!user) return [];
  if (user.role === 'owner') return ROLES.owner.perms;
  const custom = parseJSON(user.permissions, null);
  if (Array.isArray(custom) && custom.length) return custom;
  return ROLES[user.role]?.perms || [];
}

export function can(user, perm) {
  if (!user) return false;
  if (user.role === 'owner') return true;
  return userPermissions(user).includes(perm);
}

let dummyHash = null;
const MAX_FAILS = 6;
const LOCK_MINUTES = 15;

export async function attemptLogin(email, password, ip) {
  const user = await db('users').where({ email: String(email || '').trim().toLowerCase() }).first();
  // نفس زمن الاستجابة تقريبًا حتى لو المستخدم غير موجود
  if (!user) {
    if (!dummyHash) dummyHash = await bcrypt.hash('not-a-real-password', 12);
    await bcrypt.compare(String(password || ''), dummyHash);
    return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
  }
  if (!user.is_active) return { error: 'هذا الحساب موقوف. تواصل مع مدير اللوحة.' };
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return { error: 'تم إيقاف الدخول مؤقتًا بسبب محاولات متكررة. حاول بعد ربع ساعة.' };
  }
  const ok = await bcrypt.compare(String(password || ''), user.password_hash);
  if (!ok) {
    const fails = (user.failed_logins || 0) + 1;
    await db('users').where({ id: user.id }).update({
      failed_logins: fails >= MAX_FAILS ? 0 : fails,
      locked_until: fails >= MAX_FAILS ? new Date(Date.now() + LOCK_MINUTES * 60000) : null,
    });
    return { error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' };
  }
  await db('users').where({ id: user.id }).update({ failed_logins: 0, locked_until: null, last_login_at: new Date(), last_login_ip: ip || null });
  return { user };
}

// يحمّل المستخدم الحالي من الجلسة
export async function loadUser(req, res, next) {
  try {
    if (req.session?.uid) {
      const user = await db('users').where({ id: req.session.uid, is_active: true }).first();
      if (user && user.password_hash.slice(-12) === req.session.pwv) {
        req.user = user;
        res.locals.me = user;
        res.locals.can = (p) => can(user, p);
      } else {
        req.session.uid = null;
      }
    }
    next();
  } catch (e) {
    next(e);
  }
}

export function requireAuth(req, res, next) {
  if (req.user) return next();
  if (req.xhr || req.get('accept')?.includes('application/json')) return res.status(401).json({ error: 'انتهت الجلسة، سجّل الدخول من جديد.' });
  const nextUrl = encodeURIComponent(req.originalUrl);
  return res.redirect(`/admin/login?next=${nextUrl}`);
}

export function requirePerm(perm) {
  return (req, res, next) => {
    if (can(req.user, perm)) return next();
    if (req.xhr || req.get('accept')?.includes('application/json')) return res.status(403).json({ error: 'ليس لديك صلاحية لهذا الإجراء.' });
    return res.status(403).render('admin/403.njk', { title: 'غير مصرّح' });
  };
}
