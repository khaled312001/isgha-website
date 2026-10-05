// صلاحيات لوحة التحكم والأدوار الجاهزة
export const PERMISSIONS = [
  ['leads', 'طلبات العملاء'],
  ['pages', 'الصفحات والأقسام'],
  ['landing', 'صفحات الهبوط'],
  ['content', 'الخدمات والباقات والمحتوى'],
  ['posts', 'المقالات'],
  ['media', 'مكتبة الوسائط وصور الموقع'],
  ['seo', 'محركات البحث والتحويلات'],
  ['marketing', 'الإعلانات والتتبع'],
  ['analytics', 'التقارير والإحصاءات'],
  ['settings', 'إعدادات الموقع'],
  ['users', 'المستخدمون والصلاحيات'],
  ['system', 'النظام والنسخ الاحتياطي'],
];

export const ROLES = {
  owner: { label: 'المالك', perms: PERMISSIONS.map((p) => p[0]) },
  admin: { label: 'مدير', perms: PERMISSIONS.map((p) => p[0]).filter((p) => p !== 'users') },
  editor: { label: 'محرر محتوى', perms: ['pages', 'content', 'posts', 'media', 'seo'] },
  marketer: { label: 'مسوّق', perms: ['leads', 'landing', 'media', 'seo', 'marketing', 'analytics'] },
  sales: { label: 'مبيعات / خدمة عملاء', perms: ['leads'] },
};

export function roleLabel(role) {
  return ROLES[role]?.label || role;
}
