// جدول الجلسات يُنشأ هنا بدل الإنشاء التلقائي من express-mysql-session
// حتى لا يفشل أول طلب بعد التشغيل قبل اكتمال إنشاء الجدول
export async function up(knex) {
  await knex.raw(`
    CREATE TABLE IF NOT EXISTS \`sessions\` (
      \`session_id\` varchar(128) COLLATE utf8mb4_bin NOT NULL,
      \`expires\` int unsigned NOT NULL,
      \`data\` mediumtext COLLATE utf8mb4_bin,
      PRIMARY KEY (\`session_id\`)
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_bin
  `);
}

export async function down(knex) {
  await knex.schema.dropTableIfExists('sessions');
}
