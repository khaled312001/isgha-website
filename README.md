# موقع شركة إصغاء للمحاماة والاستشارات القانونية

الموقع الرسمي لشركة إصغاء للمحاماة والاستشارات القانونية (isgha.sa) مع لوحة تحكم كاملة لإدارته. الموقع عربي من اليمين لليسار، ويُعرض من السيرفر (SSR) بـ Node.js وExpress وقوالب Nunjucks، والبيانات في قاعدة MySQL أو MariaDB.

أُعيد بناء المشروع من الصفر ليحل محل الموقع القديم، مع تحويلات 301 جاهزة من روابط الموقع القديم (مثل `/pages/judicial_services.html`) إلى الروابط الجديدة.

## الوثائق

| الملف | لمن | المحتوى |
|---|---|---|
| [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) | الفريق التقني | النشر على Hostinger خطوة بخطوة، المتغيرات، التحديث، الإطلاق على isgha.sa، النسخ الاحتياطي، حل المشكلات |
| [docs/DASHBOARD.md](docs/DASHBOARD.md) | موظفو الشركة | دليل استخدام لوحة التحكم: الطلبات، الصفحات، صفحات الهبوط، المحتوى، الصور، التتبع، المستخدمون |
| [docs/IMAGE-PROMPTS.md](docs/IMAGE-PROMPTS.md) | التسويق والتصميم | برومبتات توليد صور الموقع لكل خانة صورة (يُولَّد بالأمر `npm run docs:images`) |

## المزايا

### الموقع العام

- الصفحات الأساسية: الرئيسية، من نحن، خدماتنا، الباقات، المستفيدون، اتصل بنا، احجز استشارة، سياسة الخصوصية، شروط الاستخدام، صفحة الشكر.
- أقسام الخدمات (`/services/<القسم>`) وصفحة مستقلة لكل خدمة فرعية عند تفعيلها (`/services/<القسم>/<الخدمة>`).
- المعرفة القانونية (المدونة): `/insights` مع تصنيفات وفهرس تلقائي للعناوين ومقالات ذات صلة وجدولة النشر.
- نموذج تقييم قضية من ثلاث خطوات ونموذج تواصل، مع حماية من البوتات (حقل مخفي، حد أدنى لزمن التعبئة، فحص المصدر، تحديد عدد المحاولات).
- أزرار اتصال وواتساب عائمة وشريط اتصال للجوال.
- SEO تقني جاهز: عنوان ووصف لكل صفحة، Open Graph، روابط Canonical، بيانات Schema (LegalService وWebSite وBreadcrumb وFAQ وService وArticle)، خريطة موقع ديناميكية `/sitemap.xml`، و`/robots.txt` يمنع الأرشفة تلقائيًا ما دام `ALLOW_INDEXING=false`.

### لوحة التحكم (`/admin`)

- منشئ الصفحات بالأقسام: ٢٨ نوع قسم (ترويسات، نبذة، خدمات، أسئلة، آراء، نماذج، أرقام، فيديو، كود مخصص...). التعديلات تُحفظ كمسودة تلقائيًا، وتُعاين داخل المنشئ على مقاس الكمبيوتر والتابلت والجوال، ولا تظهر للزوار إلا بعد «نشر». يمكن التراجع عن المسودة والعودة للنسخة المنشورة.
- صفحات الهبوط للإعلانات: قوالب جاهزة («هبوط إعلاني — تقييم قضية» و«هبوط لخدمة محددة»)، تخطيط بدون قائمة تنقل، noindex افتراضيًا، وتحويل لصفحة الشكر بعد الإرسال لتسهيل تتبع التحويلات، مع أكواد تتبع خاصة بكل صفحة.
- طلبات العملاء (CRM مبسط): ست حالات للطلب، إسناد لموظف، سجل ملاحظات، قيمة التعاقد، فلاتر (المصدر، الصفحة، الحملة، التاريخ، المسندة لي)، إجراءات جماعية، وتصدير CSV يفتح في Excel. كل طلب يحفظ مصدره: UTM ومعرّفات النقرات الإعلانية (gclid وfbclid وttclid وScCid وmsclkid وtwclid وli_fat_id) والمُحيل وصفحة الدخول.
- الإعلانات والتتبع: Google Tag Manager وGoogle Analytics 4 وGoogle Ads (تحويل الطلب وتحويل الاتصال) وMeta Pixel مع Conversions API من السيرفر (بنفس event_id لمنع التكرار) وTikTok وSnapchat وX وLinkedIn وMicrosoft Clarity، ومنشئ روابط UTM.
- مركز SEO: فحص طول العناوين والأوصاف لكل صفحة وخدمة ومقال، رموز التحقق (Google وBing وYandex وFacebook)، قواعد robots إضافية، بيانات المنشأة، وقائمة بالروابط المفقودة (404).
- التحويلات (301/302) من اللوحة، مع تحويل تلقائي عند تغيير رابط صفحة منشورة أو مقال منشور أو قسم خدمات.
- مكتبة الوسائط وصور الموقع: ١٧ خانة صورة ثابتة، لكل خانة صورة أساسية مرفقة مع الموقع وبرومبت توليد جاهز، مع زر استبدال وزر «استعادة الأساسية».
- المستخدمون والأدوار: المالك، مدير، محرر محتوى، مسوّق، مبيعات / خدمة عملاء، مع إمكانية تخصيص الصلاحيات لكل مستخدم.
- النسخ الاحتياطي والاستعادة من اللوحة (ملف JSON)، وسجل النشاط لكل عملية.
- تقارير زيارات من طرف أول: زيارات وزوار يوميًا، المصادر، الأجهزة، أداء صفحات الهبوط، الحملات، نقرات الاتصال والواتساب، وبدء تعبئة النموذج، بدون كوكيز طرف ثالث ومع استبعاد الروبوتات.

## التقنيات

| الطبقة | المستخدم |
|---|---|
| التشغيل | Node.js 22 (الحد الأدنى في `package.json` هو 20.11)، وحدات ESM |
| الخادم | Express 5، helmet، compression، express-rate-limit |
| القوالب | Nunjucks (عرض من السيرفر) |
| قاعدة البيانات | MySQL 8 أو MariaDB (السيرفر الحالي MariaDB 11.8) عبر Knex وmysql2 |
| الجلسات | express-session مع express-mysql-session (جدول `sessions`) |
| الرفع والبريد | multer، nodemailer |
| الأمان | bcryptjs، sanitize-html، حماية CSRF مبنية في المشروع |
| واجهة اللوحة | JavaScript بدون إطار، Quill (محرر النصوص)، SortableJS (الترتيب بالسحب)، Chart.js (الرسوم)، أيقونات Lucide |

مكتبات واجهة اللوحة وملف الأيقونات (`public/vendor/` و`public/img/icons.svg`) مبنية مسبقًا ومحفوظة في المستودع، فلا يحتاج السيرفر أي خطوة بناء.

## التشغيل محليًا

### المتطلبات

- Node.js 22.
- MySQL 8 أو MariaDB 10.6 فأحدث.

### الخطوات

1. أنشئ قاعدة البيانات ومستخدمًا لها (وقاعدة الاختبار إن كنت ستشغّل الاختبارات):

   ```sql
   CREATE DATABASE isgha CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE DATABASE isgha_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
   CREATE USER 'isgha'@'localhost' IDENTIFIED BY '<كلمة-مرور-قوية>';
   GRANT ALL PRIVILEGES ON isgha.* TO 'isgha'@'localhost';
   GRANT ALL PRIVILEGES ON isgha_test.* TO 'isgha'@'localhost';
   ```

   التطبيق يتصل عبر `127.0.0.1`. إذا ظهر خطأ `ER_ACCESS_DENIED_ERROR` فأنشئ المستخدم أيضًا للمضيف `'127.0.0.1'`.

2. انسخ ملف الإعدادات ثم عدّله:

   ```bash
   cp .env.example .env
   ```

   أهم القيم للتطوير المحلي:

   ```dotenv
   NODE_ENV=development
   PORT=3000
   SITE_URL=http://localhost:3000
   DB_HOST=127.0.0.1
   DB_PORT=3306
   DB_NAME=isgha
   DB_USER=isgha
   DB_PASSWORD=<كلمة-مرور-القاعدة>
   UPLOADS_DIR=storage/uploads
   BACKUPS_DIR=storage/backups
   ```

   غيّر `NODE_ENV` إلى `development` محليًا، لأن وضع `production` يتطلب `SESSION_SECRET` ويفعّل تخزين القوالب مؤقتًا. القيم الكاملة وشرحها في [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

3. ثبّت الحزم:

   ```bash
   npm install
   ```

4. أنشئ الجداول وعبّئ المحتوى الأولي:

   ```bash
   npm run migrate
   npm run seed
   ```

5. أنشئ حساب المالك:

   ```bash
   npm run create-admin -- --email you@example.com --name "الاسم"
   ```

   بدون `--password` تُولَّد كلمة مرور قوية وتُطبع مرة واحدة. الخيار `--role` يحدد الدور (الافتراضي `owner`).

6. شغّل خادم التطوير:

   ```bash
   npm run dev
   ```

   الموقع على `http://localhost:3000` واللوحة على `http://localhost:3000/admin`.

عند كل تشغيل للخادم، ومع `AUTO_MIGRATE=true` (الافتراضي)، تُنفَّذ الترحيلات وتُعبّأ البيانات الأولية إن لم تكن موجودة، لذلك الخطوة ٤ اختيارية عمليًا لكنها توضّح ما يحدث.

## أوامر npm

| الأمر | ما يفعله |
|---|---|
| `npm start` | تشغيل الخادم (`node server.js`)، وهو ما تشغّله الاستضافة |
| `npm run dev` | تشغيل مع إعادة تحميل تلقائية عند تعديل `src/` أو `server.js` |
| `npm run migrate` | تنفيذ ترحيلات قاعدة البيانات. `npm run migrate -- --rollback` يتراجع عن آخر دفعة |
| `npm run seed` | تعبئة المحتوى الأولي مرة واحدة. `npm run seed -- --force` يكمل الجداول الفارغة فقط ولا يحذف أي بيانات |
| `npm run create-admin -- --email ... --name "..."` | إنشاء حساب أو تحديثه. خيارات إضافية: `--role` و`--password`. تشغيله على بريد موجود يعيد تعيين كلمة المرور ويفعّل الحساب ويفك القفل |
| `npm run build:assets` | إعادة بناء ملف الأيقونات ونسخ مكتبات اللوحة إلى `public/vendor` (يحتاج devDependencies، والناتج يُحفظ في المستودع) |
| `npm test` | تشغيل الاختبارات على قاعدة `isgha_test` (انظر قسم الاختبارات) |
| `npm run docs:images` | إعادة توليد `docs/IMAGE-PROMPTS.md` من تعريف خانات الصور |

انتبه عند استخدام `create-admin` لتغيير كلمة مرور مستخدم ليس مالكًا: مرّر دوره الحالي بـ `--role` (مثل `--role editor`)، وإلا يصبح دوره `owner`.

## هيكل المشروع

```text
server.js                  نقطة التشغيل: ترحيلات + تعبئة أولية + تشغيل Express
src/
  app.js                   تجميع التطبيق: الأمان، الجلسات، التحويلات، المسارات، 404
  config.js                قراءة متغيرات البيئة (.env)
  db.js                    اتصال Knex
  routes/
    public.js              صفحات الموقع، sitemap.xml، robots.txt
    api.js                 POST /api/leads و POST /api/event
    admin/                 مسارات لوحة التحكم (index.js فيه القائمة الجانبية والدخول)
  content/
    sections.js            أنواع أقسام منشئ الصفحات وحقولها
    resources.js           أقسام المحتوى (الخدمات، الباقات، الأسئلة، المقالات، التحويلات...)
    settings-schema.js     مجموعات الإعدادات وحقولها وقيمها الافتراضية
    permissions.js         الصلاحيات والأدوار
    templates.js           قوالب الصفحات وصفحات الهبوط
    image-slots.js         خانات صور الموقع وبرومبتاتها
  lib/                     أدوات مشتركة (المصادقة، الإشعارات، SEO، الإحصاءات، الرفع...)
  views/                   قوالب Nunjucks (layouts، pages، sections، partials، admin)
db/
  migrations/              ترحيلات قاعدة البيانات
  seed.js, seed-*.js       المحتوى الأولي والتحويلات من الموقع القديم
scripts/                   أوامر npm + deploy.sh (التحديث على السيرفر)
public/                    CSS وJS والخطوط والصور والمكتبات الجاهزة
tests/                     اختبارات node:test
docs/                      الوثائق
storage/                   المكان الافتراضي للرفع والنسخ محليًا (غير مرفوع إلى Git)
```

## الاختبارات

```bash
npm test
```

- الاختبارات تستخدم قاعدة بيانات منفصلة اسمها `isgha_test` (أو القيمة في `TEST_DB_NAME`)، وترفض العمل إذا لم ينتهِ اسم القاعدة بـ `_test`.
- تحذف كل الجداول في قاعدة الاختبار في بداية كل تشغيل، ثم تبني القاعدة من الصفر (ترحيلات + محتوى أولي + حساب مالك تجريبي). لا تضع في `TEST_DB_NAME` اسم قاعدة فيها بيانات تريدها.
- يجب إنشاء القاعدة `isgha_test` مسبقًا ومنح مستخدم القاعدة صلاحياتها، وتُستخدم نفس قيم `DB_HOST` و`DB_USER` و`DB_PASSWORD` من `.env`.
- ملفات الرفع والنسخ أثناء الاختبار تذهب لمجلد مؤقت يُحذف بعد الانتهاء.
- الاختبارات تعمل بالتتابع على قاعدة واحدة مشتركة، فلا تشغّل جلستي اختبار في الوقت نفسه على نفس خادم قاعدة البيانات.
- أمر الاختبار يحتاج Node.js 22 (يستخدم نمط glob و`--test-force-exit`).

تغطي الاختبارات فتح كل صفحات الموقع واللوحة، المسودة والنشر، صفحات الهبوط، الطلبات والتصدير، التحويلات، الصلاحيات، رفع الوسائط، النسخ الاحتياطي، وترويسات الأمان.

## ملاحظات الأمان

- كلمات المرور مشفّرة بـ bcrypt، والحد الأدنى ١٠ أحرف تجمع حروفًا وأرقامًا.
- الدخول محدود بـ ١٢ محاولة كل ربع ساعة لكل عنوان IP، ويُقفل الحساب ربع ساعة بعد ٦ محاولات خاطئة متتالية.
- الجلسات في قاعدة البيانات، والكوكي `httpOnly` و`SameSite=Lax` و`secure` تلقائيًا على HTTPS في الإنتاج. الجلسة تنتهي بعد ١٢ ساعة بلا نشاط، وتغيير كلمة المرور ينهي الجلسات الأخرى لنفس المستخدم.
- كل طلبات POST في اللوحة محمية برمز CSRF، واللوحة كلها `noindex` و`no-store`.
- `SESSION_SECRET` إلزامي عند `NODE_ENV=production`، والتطبيق يرفض التشغيل بدونه.
- `TRUST_PROXY` رقم (عدد البروكسيات أمام التطبيق) وليس `true`، حتى لا يستطيع الزائر تزوير عنوان IP عبر الترويسات.
- النصوص المنسقة تُنظَّف بـ sanitize-html. حقول الكود المخصص (أكواد التتبع، قسم «كود HTML مخصص») تُحفظ فقط لمن يملك صلاحية «الإعلانات والتتبع» أو «إعدادات الموقع»، لأنها تُعرض كما هي في الموقع.
- الرفع مقصور على JPG وPNG وWebP وGIF وAVIF وPDF، حتى ١٢ ميجابايت للملف، بأسماء عشوائية.
- الاستعادة من نسخة احتياطية متاحة للمالك فقط، وفقط المالك يمنح دور المالك، ولا يمكن حذف أو تعطيل آخر مالك نشط.
- ملف `.env` لا يُرفع إلى Git. احذف `ADMIN_PASSWORD` من البيئة بعد أول تشغيل.
- كلمة مرور SMTP ورمز Meta CAPI ومفتاح الـ Webhook محفوظة في جدول الإعدادات (مخفية في الواجهة). ملفات النسخ الاحتياطي تحتويها مع بيانات العملاء وبصمات كلمات المرور، فعاملها كملفات سرية.
- سياسة CSP معطلة عمدًا لأن أكواد البكسلات والأكواد المخصصة تحتاج سكربتات من جهات خارجية.

---

## English (for developers)

**What it is.** Server-rendered Arabic (RTL) website and admin dashboard for Isgha Law Firm (isgha.sa). Node.js ESM, Express 5, Nunjucks, Knex + mysql2 (MySQL 8 / MariaDB; production runs MariaDB 11.8), sessions stored in MySQL via express-mysql-session. Deployed on Hostinger as an hPanel Node.js app behind LiteSpeed/Passenger; see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md).

**Quick start**

```bash
cp .env.example .env          # set NODE_ENV=development and DB_* values
npm install
npm run migrate
npm run seed
npm run create-admin -- --email you@example.com --name "Your Name"
npm run dev                   # http://localhost:3000 and /admin
```

**How the pieces fit**

- `server.js` runs `db.migrate.latest()` and `ensureSeeded()` on boot when `AUTO_MIGRATE` is true (default), then starts Express. `ensureSeeded()` creates the owner from `ADMIN_EMAIL`/`ADMIN_PASSWORD` only when the `users` table is empty.
- Pages (`pages` table) are lists of sections stored as JSON. Section types live in `src/content/sections.js`; each type has a template at `src/views/sections/<type>.njk`. The builder form is generated from the field definitions. Edits go to `draft_sections`; publishing copies them into `sections`.
- CRUD screens for services, packages, FAQs, posts, redirects, etc. are generated from `src/content/resources.js`. Settings screens come from `src/content/settings-schema.js`. Roles and permissions are in `src/content/permissions.js`.
- Leads are posted to `POST /api/leads`; notifications (SMTP email, signed webhook, Meta Conversions API) run after the response in `src/lib/notify.js`.
- First-party analytics are aggregated in memory and flushed every 15 seconds to `analytics_daily` / `events_daily` (`src/lib/analytics.js`).
- Content is cached in-process for 15 seconds (`CACHE_TTL_MS`); admin writes clear the relevant keys.

**Scripts:** `start`, `dev`, `migrate` (`-- --rollback`), `seed` (`-- --force`), `create-admin` (`--email --name [--role] [--password]`), `build:assets`, `test`, `docs:images`. `scripts/deploy.sh` is the server-side update script (fetch, hard reset to `origin/main`, `npm ci --omit=dev` when the lockfile changed, `touch tmp/restart.txt`).

**Tests:** `npm test` drops every table in the `isgha_test` database (override with `TEST_DB_NAME`, must end in `_test`), migrates, seeds and runs the suites sequentially. Create that database first. Requires Node 22. Do not run two test sessions against the same database server at once.

**Environment:** every variable is documented in [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md). Code-only extras not in `.env.example`: `DATABASE_URL`, `COOKIE_SECURE`, `CACHE_TTL_MS`, `ASSET_VERSION`, `TEST_DB_NAME`.
