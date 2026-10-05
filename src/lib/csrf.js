import crypto from 'node:crypto';

// حماية CSRF للوحة التحكم (رمز مرتبط بالجلسة)
export function csrfToken(req) {
  if (!req.session.csrf) req.session.csrf = crypto.randomBytes(24).toString('hex');
  return req.session.csrf;
}

export function csrfProtect(req, res, next) {
  res.locals.csrf = csrfToken(req);
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) return next();
  const sent = req.get('x-csrf-token') || req.body?._csrf || req.query?._csrf;
  const expected = req.session.csrf;
  if (sent && expected && sent.length === expected.length && crypto.timingSafeEqual(Buffer.from(sent), Buffer.from(expected))) {
    return next();
  }
  if (req.xhr || req.get('accept')?.includes('application/json')) {
    return res.status(419).json({ error: 'انتهت صلاحية الصفحة، حدّثها وحاول مجددًا.' });
  }
  req.session.flash = { type: 'error', text: 'انتهت صلاحية الصفحة، أعد المحاولة.' };
  return res.redirect(req.get('referer') || '/admin');
}
