// المستخدمون والصلاحيات + الملف الشخصي
import { Router } from 'express';
import db from '../../db.js';
import { requirePerm, hashPassword, checkPasswordStrength } from '../../lib/auth.js';
import { logActivity } from '../../lib/activity.js';
import { PERMISSIONS, ROLES } from '../../content/permissions.js';
import { wrap, flash } from './util.js';
import bcrypt from 'bcryptjs';

const router = Router();

// ─── الملف الشخصي (لكل مستخدم) ───
router.get('/me', (req, res) => {
  res.render('admin/users/me.njk', { title: 'حسابي', active: '' });
});

router.post('/me', wrap(async (req, res) => {
  const b = req.body || {};
  const name = String(b.name || '').trim().slice(0, 120);
  const patch = { updated_at: new Date() };
  if (name) patch.name = name;
  if (b.new_password) {
    const ok = await bcrypt.compare(String(b.current_password || ''), req.user.password_hash);
    if (!ok) { flash(req, 'error', 'كلمة المرور الحالية غير صحيحة.'); return res.redirect('/admin/users/me'); }
    const weak = checkPasswordStrength(b.new_password);
    if (weak) { flash(req, 'error', weak); return res.redirect('/admin/users/me'); }
    if (b.new_password !== b.confirm_password) { flash(req, 'error', 'تأكيد كلمة المرور غير مطابق.'); return res.redirect('/admin/users/me'); }
    patch.password_hash = await hashPassword(b.new_password);
  }
  await db('users').where({ id: req.user.id }).update(patch);
  if (patch.password_hash) {
    req.session.pwv = patch.password_hash.slice(-12);
    logActivity(req, 'update', 'user', req.user.id, 'تغيير كلمة المرور');
  }
  flash(req, 'success', 'تم حفظ حسابك.');
  res.redirect('/admin/users/me');
}));

// ─── إدارة المستخدمين ───
router.use(requirePerm('users'));

router.get('/', wrap(async (req, res) => {
  const rows = await db('users').orderBy('id');
  // نفس منطق userPermissions: القائمة الفارغة تعني صلاحيات الدور الافتراضية
  const users = rows.map((u) => ({ ...u, customN: u.role === 'owner' ? 0 : formLocals(u).custom.length }));
  res.render('admin/users/index.njk', { title: 'المستخدمون', active: 'users', users, roles: ROLES });
}));

function formLocals(user) {
  let custom = [];
  try { custom = JSON.parse(user?.permissions || '[]') || []; } catch { custom = []; }
  return { roles: ROLES, permissions: PERMISSIONS, custom };
}

router.get('/new', (req, res) => {
  res.render('admin/users/form.njk', { title: 'مستخدم جديد', active: 'users', u: null, ...formLocals(null) });
});

router.get('/:id', wrap(async (req, res, next) => {
  const u = await db('users').where({ id: Number(req.params.id) }).first();
  if (!u) return next();
  res.render('admin/users/form.njk', { title: `تعديل: ${u.name}`, active: 'users', u, ...formLocals(u) });
}));

async function ownersLeft(exceptId) {
  const [{ n }] = await db('users').where({ role: 'owner', is_active: true }).whereNot('id', exceptId).count({ n: '*' });
  return Number(n);
}

async function saveUser(req, res) {
  const id = req.params.id ? Number(req.params.id) : null;
  const b = req.body || {};
  const back = id ? `/admin/users/${id}` : '/admin/users/new';
  const name = String(b.name || '').trim().slice(0, 120);
  const email = String(b.email || '').trim().toLowerCase().slice(0, 190);
  const role = ROLES[b.role] ? b.role : 'editor';
  if (!name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) { flash(req, 'error', 'أدخل الاسم وبريدًا صحيحًا.'); return res.redirect(back); }
  // المالك فقط يمنح دور المالك
  if (role === 'owner' && req.user.role !== 'owner') { flash(req, 'error', 'فقط المالك يمكنه إنشاء مالك آخر.'); return res.redirect(back); }
  const perms = (Array.isArray(b.perms) ? b.perms : b.perms ? [b.perms] : []).filter((p) => PERMISSIONS.some((x) => x[0] === p));
  const useCustom = b.custom_perms === '1' && role !== 'owner';
  // تخصيص بدون أي صلاحية محددة = صلاحيات الدور (كما في userPermissions)، فنحفظه null بوضوح وننبّه
  const emptyCustom = useCustom && !perms.length;
  const patch = { name, email, role, permissions: useCustom && perms.length ? JSON.stringify(perms) : null, is_active: b.is_active === '1' || !id, updated_at: new Date() };
  const roleNote = emptyCustom ? ` لم تُحدَّد أي صلاحية مخصصة، فطُبّقت صلاحيات دور «${ROLES[role].label}» الافتراضية.` : '';
  const dup = await db('users').where({ email }).modify((q) => { if (id) q.whereNot('id', id); }).first('id');
  if (dup) { flash(req, 'error', 'البريد مستخدم لحساب آخر.'); return res.redirect(back); }
  if (b.password) {
    const weak = checkPasswordStrength(b.password);
    if (weak) { flash(req, 'error', weak); return res.redirect(back); }
    patch.password_hash = await hashPassword(b.password);
  } else if (!id) {
    flash(req, 'error', 'أدخل كلمة مرور للمستخدم الجديد.');
    return res.redirect(back);
  }
  if (id) {
    const existing = await db('users').where({ id }).first();
    if (!existing) return res.redirect('/admin/users');
    if (existing.role === 'owner' && req.user.role !== 'owner') { flash(req, 'error', 'لا يمكنك تعديل حساب المالك.'); return res.redirect('/admin/users'); }
    if (existing.role === 'owner' && (role !== 'owner' || !patch.is_active) && (await ownersLeft(id)) === 0) {
      flash(req, 'error', 'يجب أن يبقى مالك واحد نشط على الأقل.');
      return res.redirect(back);
    }
    if (id === req.user.id) patch.is_active = true;
    await db('users').where({ id }).update(patch);
    if (id === req.user.id && patch.password_hash) req.session.pwv = patch.password_hash.slice(-12);
    logActivity(req, 'update', 'user', id, email);
    flash(req, emptyCustom ? 'warn' : 'success', `تم حفظ المستخدم.${roleNote}`);
    return res.redirect(`/admin/users/${id}`);
  }
  const [newId] = await db('users').insert(patch);
  logActivity(req, 'create', 'user', newId, email);
  flash(req, emptyCustom ? 'warn' : 'success', `تم إنشاء المستخدم. أرسل له بيانات الدخول بطريقة آمنة.${roleNote}`);
  return res.redirect('/admin/users');
}

router.post('/', wrap(saveUser));
router.post('/:id', wrap(saveUser));

router.post('/:id/delete', wrap(async (req, res) => {
  const id = Number(req.params.id);
  const u = await db('users').where({ id }).first();
  if (!u) return res.redirect('/admin/users');
  if (id === req.user.id) { flash(req, 'error', 'لا يمكنك حذف حسابك.'); return res.redirect('/admin/users'); }
  if (u.role === 'owner' && (req.user.role !== 'owner' || (await ownersLeft(id)) === 0)) { flash(req, 'error', 'لا يمكن حذف هذا المالك.'); return res.redirect('/admin/users'); }
  await db('users').where({ id }).del();
  await db('leads').where({ assigned_to: id }).update({ assigned_to: null });
  logActivity(req, 'delete', 'user', id, u.email);
  flash(req, 'success', 'تم حذف المستخدم.');
  res.redirect('/admin/users');
}));

export default router;
