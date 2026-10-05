// تشغيل ترحيلات قاعدة البيانات: npm run migrate  (أو npm run migrate -- --rollback)
import db from '../src/db.js';

const rollback = process.argv.includes('--rollback');
try {
  if (rollback) {
    const [batch, files] = await db.migrate.rollback();
    console.log(`تم التراجع عن الدفعة ${batch}:`, files);
  } else {
    const [batch, files] = await db.migrate.latest();
    console.log(files.length ? `تم تنفيذ الدفعة ${batch}: ${files.join(', ')}` : 'قاعدة البيانات محدّثة.');
  }
} catch (e) {
  console.error('فشل الترحيل:', e.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
