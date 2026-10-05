// مسودات الصفحات: المنشئ يحفظ في المسودة، والنشر ينقلها للصفحة الحية
export async function up(knex) {
  await knex.schema.alterTable('pages', (t) => {
    t.text('draft_sections', 'longtext');
    t.datetime('published_at');
    t.integer('updated_by').unsigned();
  });
  await knex.schema.alterTable('leads', (t) => {
    t.decimal('value', 12, 2);
    t.datetime('contacted_at');
  });
}

export async function down(knex) {
  await knex.schema.alterTable('pages', (t) => {
    t.dropColumn('draft_sections');
    t.dropColumn('published_at');
    t.dropColumn('updated_by');
  });
  await knex.schema.alterTable('leads', (t) => {
    t.dropColumn('value');
    t.dropColumn('contacted_at');
  });
}
