// المخطط الأساسي لقاعدة البيانات
export async function up(knex) {
  await knex.schema.createTable('users', (t) => {
    t.increments('id');
    t.string('name', 120).notNullable();
    t.string('email', 190).notNullable().unique();
    t.string('password_hash', 100).notNullable();
    t.string('role', 30).notNullable().defaultTo('editor');
    t.text('permissions');
    t.boolean('is_active').notNullable().defaultTo(true);
    t.integer('failed_logins').notNullable().defaultTo(0);
    t.datetime('locked_until');
    t.datetime('last_login_at');
    t.string('last_login_ip', 64);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('settings', (t) => {
    t.string('key', 120).primary();
    t.text('value', 'longtext');
    t.timestamp('updated_at').defaultTo(knex.fn.now());
  });

  // الصفحات: الصفحات الأساسية + صفحات الهبوط + الصفحات المخصصة (كلها مبنية من أقسام)
  await knex.schema.createTable('pages', (t) => {
    t.increments('id');
    t.string('kind', 20).notNullable().defaultTo('custom'); // system | landing | custom
    t.string('system_key', 40).unique();
    t.string('slug', 190).notNullable().unique();
    t.string('title', 190).notNullable();
    t.string('layout', 20).notNullable().defaultTo('site'); // site | landing
    t.string('status', 20).notNullable().defaultTo('draft'); // draft | published
    t.text('sections', 'longtext');
    t.text('settings', 'mediumtext');
    t.string('meta_title', 190);
    t.string('meta_description', 320);
    t.string('og_image', 255);
    t.boolean('noindex').notNullable().defaultTo(false);
    t.integer('views').unsigned().notNullable().defaultTo(0);
    t.integer('leads').unsigned().notNullable().defaultTo(0);
    t.integer('created_by').unsigned();
    t.timestamps(true, true);
  });

  await knex.schema.createTable('service_categories', (t) => {
    t.increments('id');
    t.string('slug', 120).notNullable().unique();
    t.string('title', 190).notNullable();
    t.string('nav_title', 120);
    t.string('icon', 40);
    t.string('tagline', 255);
    t.text('summary');
    t.text('intro');
    t.text('body', 'longtext');
    t.text('bullets');
    t.string('image', 255);
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.string('meta_title', 190);
    t.string('meta_description', 320);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('services', (t) => {
    t.increments('id');
    t.integer('category_id').unsigned().notNullable().references('id').inTable('service_categories').onDelete('CASCADE');
    t.string('slug', 150).notNullable();
    t.string('title', 190).notNullable();
    t.string('icon', 40);
    t.text('summary');
    t.text('body', 'longtext');
    t.string('bullets_title', 190);
    t.text('bullets');
    t.string('image', 255);
    t.boolean('has_page').notNullable().defaultTo(true);
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.string('meta_title', 190);
    t.string('meta_description', 320);
    t.timestamps(true, true);
    t.unique(['category_id', 'slug']);
  });

  await knex.schema.createTable('practice_areas', (t) => {
    t.increments('id');
    t.string('title', 190).notNullable();
    t.string('description', 500);
    t.string('icon', 40);
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('packages', (t) => {
    t.increments('id');
    t.string('slug', 80).notNullable().unique();
    t.string('name', 120).notNullable();
    t.string('tagline', 255);
    t.string('icon', 40);
    t.string('badge', 60);
    t.boolean('is_featured').notNullable().defaultTo(false);
    t.string('max_claim', 80);
    t.string('training_hours', 80);
    t.text('highlights');
    t.text('core_features');
    t.string('extra_title', 120);
    t.text('extra_features');
    t.text('compare');
    t.string('price_note', 190);
    t.string('cta_text', 120);
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('beneficiaries', (t) => {
    t.increments('id');
    t.string('slug', 120).notNullable().unique();
    t.string('title', 190).notNullable();
    t.text('summary');
    t.string('icon', 40);
    t.string('image', 255);
    t.text('items');
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('faqs', (t) => {
    t.increments('id');
    t.string('group_key', 40).notNullable().defaultTo('general');
    t.string('question', 400).notNullable();
    t.text('answer').notNullable();
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
    t.index(['group_key']);
  });

  await knex.schema.createTable('testimonials', (t) => {
    t.increments('id');
    t.string('name', 120).notNullable();
    t.string('context', 190);
    t.text('quote').notNullable();
    t.tinyint('rating').notNullable().defaultTo(5);
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('team_members', (t) => {
    t.increments('id');
    t.string('name', 120).notNullable();
    t.string('title', 190);
    t.text('bio');
    t.string('photo', 255);
    t.string('linkedin', 255);
    t.integer('sort').notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('post_categories', (t) => {
    t.increments('id');
    t.string('slug', 150).notNullable().unique();
    t.string('name', 150).notNullable();
    t.string('description', 320);
    t.integer('sort').notNullable().defaultTo(0);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('posts', (t) => {
    t.increments('id');
    t.string('slug', 190).notNullable().unique();
    t.string('title', 255).notNullable();
    t.text('excerpt');
    t.text('body', 'longtext');
    t.string('cover', 255);
    t.integer('category_id').unsigned().references('id').inTable('post_categories').onDelete('SET NULL');
    t.integer('author_id').unsigned();
    t.string('author_name', 120);
    t.string('status', 20).notNullable().defaultTo('draft');
    t.datetime('published_at');
    t.string('meta_title', 190);
    t.string('meta_description', 320);
    t.string('og_image', 255);
    t.boolean('noindex').notNullable().defaultTo(false);
    t.integer('views').unsigned().notNullable().defaultTo(0);
    t.timestamps(true, true);
    t.index(['status', 'published_at']);
  });

  await knex.schema.createTable('leads', (t) => {
    t.increments('id');
    t.string('form', 30).notNullable().defaultTo('lead');
    t.integer('page_id').unsigned();
    t.string('page_slug', 190);
    t.string('name', 150);
    t.string('phone', 40);
    t.string('email', 190);
    t.string('case_type', 150);
    t.text('message');
    t.string('status', 20).notNullable().defaultTo('new');
    t.integer('assigned_to').unsigned();
    t.string('utm_source', 120);
    t.string('utm_medium', 120);
    t.string('utm_campaign', 190);
    t.string('utm_term', 190);
    t.string('utm_content', 190);
    t.string('click_id', 255);
    t.string('click_type', 20);
    t.string('referrer', 500);
    t.string('landing_url', 500);
    t.string('ip', 64);
    t.string('user_agent', 300);
    t.string('event_id', 64);
    t.text('meta');
    t.timestamps(true, true);
    t.index(['status']);
    t.index(['created_at']);
    t.index(['page_id']);
  });

  await knex.schema.createTable('lead_notes', (t) => {
    t.increments('id');
    t.integer('lead_id').unsigned().notNullable().references('id').inTable('leads').onDelete('CASCADE');
    t.integer('user_id').unsigned();
    t.string('kind', 20).notNullable().defaultTo('note');
    t.text('body').notNullable();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('media', (t) => {
    t.increments('id');
    t.string('filename', 255).notNullable();
    t.string('original_name', 255);
    t.string('url', 255).notNullable();
    t.string('mime', 80);
    t.integer('size').unsigned();
    t.integer('width').unsigned();
    t.integer('height').unsigned();
    t.string('alt', 255);
    t.integer('created_by').unsigned();
    t.timestamp('created_at').defaultTo(knex.fn.now());
  });

  await knex.schema.createTable('redirects', (t) => {
    t.increments('id');
    t.string('from_path', 255).notNullable().unique();
    t.string('to_url', 500).notNullable();
    t.smallint('code').notNullable().defaultTo(301);
    t.integer('hits').unsigned().notNullable().defaultTo(0);
    t.boolean('is_active').notNullable().defaultTo(true);
    t.timestamps(true, true);
  });

  await knex.schema.createTable('activity_log', (t) => {
    t.increments('id');
    t.integer('user_id').unsigned();
    t.string('action', 40).notNullable();
    t.string('entity', 60);
    t.string('entity_id', 60);
    t.string('summary', 500);
    t.string('ip', 64);
    t.timestamp('created_at').defaultTo(knex.fn.now());
    t.index(['created_at']);
  });

  // إحصاءات الزيارات المجمّعة يوميًا (بدون كوكيز طرف ثالث)
  await knex.schema.createTable('analytics_daily', (t) => {
    t.date('day').notNullable();
    t.string('path', 255).notNullable();
    t.string('source', 80).notNullable().defaultTo('direct');
    t.string('device', 10).notNullable().defaultTo('desktop');
    t.integer('views').unsigned().notNullable().defaultTo(0);
    t.integer('uniques').unsigned().notNullable().defaultTo(0);
    t.primary(['day', 'path', 'source', 'device']);
  });

  await knex.schema.createTable('events_daily', (t) => {
    t.date('day').notNullable();
    t.string('type', 40).notNullable();
    t.string('path', 255).notNullable().defaultTo('');
    t.integer('count').unsigned().notNullable().defaultTo(0);
    t.primary(['day', 'type', 'path']);
  });
}

export async function down(knex) {
  for (const tbl of [
    'events_daily', 'analytics_daily', 'activity_log', 'redirects', 'media', 'lead_notes', 'leads',
    'posts', 'post_categories', 'team_members', 'testimonials', 'faqs', 'beneficiaries', 'packages',
    'practice_areas', 'services', 'service_categories', 'pages', 'settings', 'users',
  ]) {
    await knex.schema.dropTableIfExists(tbl);
  }
}
