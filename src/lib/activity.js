import db from '../db.js';

export async function logActivity(req, action, entity, entityId, summary) {
  try {
    await db('activity_log').insert({
      user_id: req.user?.id || null,
      action,
      entity,
      entity_id: entityId == null ? null : String(entityId),
      summary: summary ? String(summary).slice(0, 500) : null,
      ip: req.ip,
    });
  } catch {
    // السجل لا يجب أن يوقف العملية الأساسية
  }
}

export const ACTION_LABELS = {
  login: 'تسجيل دخول',
  logout: 'تسجيل خروج',
  create: 'إضافة',
  update: 'تعديل',
  delete: 'حذف',
  publish: 'نشر',
  unpublish: 'إلغاء نشر',
  status: 'تغيير حالة',
  upload: 'رفع ملف',
  export: 'تصدير',
  settings: 'تحديث إعدادات',
  backup: 'نسخة احتياطية',
};
