import crypto from 'node:crypto';

// حماية CSRF للوحة التحكم (رمز مرتبط بالجلسة)
export function csrfToken(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  return req.session.csrf;
}

export function csrfProtect(req, res, next) {
  res.locals.csrf = csrfToken(req);
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = String(req.get('x-csrf-token') || req.body?._csrf || req.query?._csrf || '');
  const expected = req.session.csrf;
  if (sent && expected && sent.length === expected.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected))) {
    return next();
  }
  if (req.xhr || req.get('accept')?.includes('application/json')) {
    return res.status(419).json({ error: 'انتهت صلاحية الصفحة، حدّثها وحاول مجددًا.' });
  }
  req.session.flash = { type: 'error', text: 'انتهت صلاحية الصفحة، أعد المحاولة.' };
  // نرجع للصفحة السابقة فقط إن كانت من نفس الموقع (منع التحويل لمواقع خارجية)
  let back = '/admin';
  try {
    const ref = new URL(req.get('referer') || '');
    if (ref.host === req.get('host') && ref.pathname.startsWith('/admin')) back = ref.pathname + ref.search;
  } catch { /* بدون مرجع */ }
  return res.redirect(back);
}
