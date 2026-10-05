// تعبئة المحتوى الأولي: npm run seed   (--force لإعادة تعبئة الأقسام الفارغة فقط، لا يحذف أي بيانات)
import db from '../src/db.js';
import { seedAll } from '../db/seed.js';

try {
  await db.migrate.latest();
  const done = await seedAll({ force: process.argv.includes('--force') });
  console.log(done ? 'تمت تعبئة المحتوى الأولي.' : 'المحتوى معبّأ مسبقًا (استخدم --force لإكمال الأقسام الناقصة).');
} catch (e) {
  console.error('فشلت التعبئة:', e.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
