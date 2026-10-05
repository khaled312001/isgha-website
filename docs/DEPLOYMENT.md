# دليل النشر على Hostinger

هذا الدليل للفريق التقني. يشرح تشغيل موقع إصغاء على استضافة Hostinger كتطبيق Node.js من hPanel، وتحديثه، ثم ربط الدومين isgha.sa به عند الإطلاق.

خطة الإطلاق: يُجهَّز الموقع على Hostinger ويُختبر أولًا، ولا تُحوَّل سجلات DNS للدومين isgha.sa إلا بعد نجاح الاختبار. طوال فترة التجهيز تبقى الأرشفة مغلقة (`ALLOW_INDEXING=false`).

في الأوامر أدناه استبدل كل قيمة بين `< >` بقيمتها الفعلية. لا تكتب كلمات المرور أو المفاتيح في أي ملف داخل Git.

## المحتويات

1. [بنية الموقع على السيرفر](#1-بنية-الموقع-على-السيرفر)
2. [إنشاء قاعدة البيانات](#2-إنشاء-قاعدة-البيانات)
3. [تطبيق Node.js في hPanel](#3-تطبيق-nodejs-في-hpanel)
4. [جلب الكود من GitHub بمفتاح نشر](#4-جلب-الكود-من-github-بمفتاح-نشر)
5. [ملف الإعدادات .env](#5-ملف-الإعدادات-env)
6. [أول تشغيل وحساب المالك](#6-أول-تشغيل-وحساب-المالك)
7. [التحديثات وإعادة التشغيل](#7-التحديثات-وإعادة-التشغيل)
8. [اختبار الموقع قبل تحويل الدومين](#8-اختبار-الموقع-قبل-تحويل-الدومين)
9. [الإطلاق: ربط isgha.sa](#9-الإطلاق-ربط-isghasa)
10. [النسخ الاحتياطي](#10-النسخ-الاحتياطي)
11. [حل المشكلات](#11-حل-المشكلات)

---

## 1. بنية الموقع على السيرفر

```text
~/domains/isgha.sa/
├── nodejs/            جذر التطبيق: الكود + .env + node_modules + tmp/
│   ├── server.js      ملف التشغيل
│   ├── .env           الإعدادات والأسرار (غير موجود في Git)
│   └── tmp/restart.txt   لمسه يعيد تشغيل التطبيق
├── public_html/
│   └── .htaccess      تولّده hPanel، لا تعدّله يدويًا
└── storage/           خارج مجلد التطبيق حتى لا يتأثر بالتحديثات
    ├── uploads/       الصور والملفات المرفوعة من اللوحة
    └── backups/       النسخ الاحتياطية المنشأة من اللوحة
```

ملف `public_html/.htaccess` الذي تولّده hPanel يوجّه كل الطلبات إلى التطبيق عبر Passenger، ويحتوي توجيهات مثل:

```apache
PassengerAppRoot /home/<SSH_USER>/domains/isgha.sa/nodejs
PassengerAppType node
PassengerNodejs /opt/alt/alt-nodejs22/root/bin/node
PassengerStartupFile server.js
PassengerRestartDir /home/<SSH_USER>/domains/isgha.sa/nodejs/tmp
```

مسار الطلب: LiteSpeed ثم Passenger ثم `server.js` على Node.js 22. التطبيق نفسه يخدم الملفات الثابتة (`/css` و`/js` و`/img` و`/uploads`)، فلا شيء آخر مطلوب داخل `public_html`.

عند الإقلاع، ومع `AUTO_MIGRATE=true`، ينفّذ `server.js` ترحيلات قاعدة البيانات، ثم يعبّئ المحتوى الأولي إن لم يكن موجودًا، ثم ينشئ حساب المالك من `ADMIN_EMAIL` و`ADMIN_PASSWORD` إذا كان جدول المستخدمين فارغًا.

## 2. إنشاء قاعدة البيانات

1. من hPanel افتح Databases ثم Management (قواعد بيانات MySQL).
2. أنشئ قاعدة بيانات ومستخدمًا بكلمة مرور قوية. hPanel يضيف بادئة لحسابك إلى الاسمين (مثل `<PREFIX>_isgha`)، فاستخدم الاسم الكامل بالبادئة في `.env`.
3. لا تنشئ أي جداول. الترحيلات تنشئها عند أول تشغيل.

نقاط مهمة:

- قاعدة البيانات على السيرفر MariaDB 11.8، وهي متوافقة مع MySQL والتطبيق يعمل عليها مباشرة.
- التطبيق يتصل بـ `DB_HOST=127.0.0.1` والمنفذ `3306`.
- لا تستخدم المضيف البعيد الذي تعرضه hPanel بصيغة `srvNNNN.hstgr.io`. هذا للاتصال من خارج Hostinger فقط.
- لا تكتب `localhost` بدل `127.0.0.1`: قد يُترجم إلى IPv6 (`::1`) ولا يملك المستخدم صلاحية الاتصال منه.

## 3. تطبيق Node.js في hPanel

تأكد من إعدادات تطبيق Node.js للموقع isgha.sa في hPanel:

| الإعداد | القيمة |
|---|---|
| إصدار Node.js | 22 |
| جذر التطبيق | `~/domains/isgha.sa/nodejs` |
| ملف التشغيل (Startup / Entry file) | `server.js` |
| أمر البناء | لا شيء. المشروع لا يحتاج خطوة بناء (المكتبات والأيقونات مبنية مسبقًا داخل المستودع) |

بعد الحفظ تكتب hPanel ملف `public_html/.htaccess` المذكور أعلاه. إذا غيّرت أي إعداد من هذه لاحقًا فاتركها تعيد توليد الملف، ولا تعدّله بيدك.

## 4. جلب الكود من GitHub بمفتاح نشر

المستودع خاص: `github.com/khaled312001/isgha-website` والفرع `main`. السيرفر يقرأ منه بمفتاح نشر (Deploy key) للقراءة فقط، محفوظ في `~/.ssh/isgha_deploy`.

### 4.1 الدخول بـ SSH وتجهيز Node.js في الجلسة

بيانات الدخول (المستخدم والمضيف والمنفذ) تجدها في hPanel ضمن SSH Access.

```bash
ssh -p <SSH_PORT> <SSH_USER>@<SSH_HOST>
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
node -v        # يجب أن يظهر v22.x
```

سطر `export PATH` مطلوب في كل جلسة SSH تشغّل فيها `node` أو `npm` بنفسك. سكربت التحديث `scripts/deploy.sh` يضبطه تلقائيًا.

### 4.2 إنشاء مفتاح النشر (مرة واحدة)

```bash
ssh-keygen -t ed25519 -f ~/.ssh/isgha_deploy -N "" -C "isgha-deploy"
cat ~/.ssh/isgha_deploy.pub
```

انسخ المفتاح العام الظاهر، ثم في GitHub افتح المستودع، Settings ثم Deploy keys ثم Add deploy key. الصق المفتاح **ولا تفعّل** خيار Allow write access.

اختبر الاتصال:

```bash
ssh -i ~/.ssh/isgha_deploy -o IdentitiesOnly=yes -T git@github.com
```

الرد المتوقع رسالة ترحيب تذكر اسم المستودع، ثم يغلق الاتصال.

### 4.3 أول جلب للكود

إذا وضعت hPanel ملفات تجريبية داخل `nodejs/` عند إنشاء التطبيق، انقلها خارج المجلد أولًا (أبقِ `tmp/` و`.env` إن وُجدا).

```bash
cd ~/domains/isgha.sa/nodejs
git init -q
git remote add origin git@github.com:khaled312001/isgha-website.git
export GIT_SSH_COMMAND="ssh -i ~/.ssh/isgha_deploy -o IdentitiesOnly=yes -o StrictHostKeyChecking=accept-new"
git fetch origin main
git reset --hard origin/main
git branch -M main
```

لا تثبّت الحزم الآن. أنشئ ملف `.env` أولًا (القسم التالي)، ثم شغّل `bash scripts/deploy.sh` كما في القسم 6.

## 5. ملف الإعدادات .env

المكان: `~/domains/isgha.sa/nodejs/.env`. الملف خارج `public_html` فلا يمكن فتحه من المتصفح، وهو مستبعد من Git، و`git reset --hard` في سكربت التحديث لا يمسّه.

```bash
cd ~/domains/isgha.sa/nodejs
cp .env.example .env
chmod 600 .env
nano .env
```

إذا ضبطت متغيرات بيئة من واجهة hPanel أيضًا فهي تتقدم على قيم `.env` (مكتبة dotenv لا تستبدل المتغيرات الموجودة). اختر مكانًا واحدًا للإعدادات حتى لا تتعارض القيم.

### 5.1 قيم فترة التجهيز (قبل تحويل الدومين)

```dotenv
NODE_ENV=production
PORT=3000
SITE_URL=https://isgha.sa
SESSION_SECRET=<سلسلة-عشوائية-48-حرفًا-على-الأقل>
ALLOW_INDEXING=false
FORCE_HTTPS=false
CANONICAL_HOST=
TRUST_PROXY=1
AUTO_MIGRATE=true

DB_HOST=127.0.0.1
DB_PORT=3306
DB_NAME=<PREFIX>_isgha
DB_USER=<PREFIX>_isgha
DB_PASSWORD=<كلمة-مرور-القاعدة>
DB_POOL_MAX=5

UPLOADS_DIR=../storage/uploads
BACKUPS_DIR=../storage/backups

ADMIN_EMAIL=<بريد-المالك>
ADMIN_NAME=<اسم-المالك>
ADMIN_PASSWORD=<كلمة-مرور-مؤقتة-قوية>

SMTP_HOST=
SMTP_PORT=465
SMTP_SECURE=true
SMTP_USER=
SMTP_PASS=
SMTP_FROM=
```

توليد `SESSION_SECRET`:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
# أو بدون Node:
openssl rand -base64 48
```

تغيير `SESSION_SECRET` لاحقًا يُخرج كل المستخدمين من اللوحة، فلا تغيّره إلا عند الحاجة.

### 5.2 شرح كل المتغيرات

| المتغير | القيمة المقترحة | المعنى |
|---|---|---|
| `NODE_ENV` | `production` | وضع الإنتاج: يشترط `SESSION_SECRET`، يفعّل HSTS والكوكي الآمن على HTTPS وتخزين القوالب مؤقتًا |
| `PORT` | `3000` | منفذ الاستماع. Passenger يدير الاتصال بالتطبيق، فلا حاجة لتغييره |
| `SITE_URL` | `https://isgha.sa` | رابط احتياطي فقط، يُستخدم عند عدم وجود طلب HTTP. الروابط القانونية (canonical) وخريطة الموقع تعتمد فعليًا على حقل «الدومين الأساسي (Canonical)» في لوحة التحكم، وإذا كان فارغًا فعلى الدومين الذي فُتح به الموقع |
| `SESSION_SECRET` | سلسلة عشوائية طويلة | توقيع كوكي الجلسة. إلزامي في الإنتاج، والتطبيق لا يعمل بدونه |
| `ALLOW_INDEXING` | `false` أثناء التجهيز، `true` بعد الإطلاق | عند `false`: كل الصفحات `noindex, nofollow` وملف robots.txt يمنع الزحف. يقبل `true` أو `1` أو `yes` أو `on` |
| `FORCE_HTTPS` | `false` أثناء التجهيز، `true` بعد تفعيل SSL | تحويل 301 من http إلى https لطلبات GET. يجب أن تكون القيمة `true` حرفيًا (القيمة `1` لا تعمل هنا) |
| `CANONICAL_HOST` | فارغ أثناء التجهيز، `isgha.sa` بعد الإطلاق | تحويل 301 لكل طلبات GET إلى هذا الدومين (مثل www.isgha.sa إلى isgha.sa). اكتب اسم الدومين فقط بدون `https://` وبدون `/` |
| `TRUST_PROXY` | `1` | عدد البروكسيات أمام التطبيق (LiteSpeed = 1). ضروري لمعرفة IP الزائر الحقيقي ومعرفة أن الاتصال HTTPS. لا تضع `true` |
| `AUTO_MIGRATE` | `true` | تنفيذ الترحيلات والتعبئة الأولية وإنشاء المالك تلقائيًا عند كل إقلاع |
| `DB_HOST` | `127.0.0.1` | مضيف قاعدة البيانات من داخل السيرفر |
| `DB_PORT` | `3306` | منفذ قاعدة البيانات |
| `DB_NAME` | الاسم الكامل بالبادئة | اسم القاعدة |
| `DB_USER` | الاسم الكامل بالبادئة | مستخدم القاعدة |
| `DB_PASSWORD` | | كلمة مرور مستخدم القاعدة |
| `DB_POOL_MAX` | `5` | أقصى عدد اتصالات للتطبيق. أبقه صغيرًا على الاستضافة المشتركة |
| `UPLOADS_DIR` | `../storage/uploads` | مجلد الملفات المرفوعة. المسار النسبي يُحسب من جذر التطبيق، فيصبح `~/domains/isgha.sa/storage/uploads`. يُنشأ تلقائيًا |
| `BACKUPS_DIR` | `../storage/backups` | مجلد النسخ الاحتياطية المنشأة من اللوحة، ويصبح `~/domains/isgha.sa/storage/backups` |
| `ADMIN_EMAIL` | بريد المالك | يُستخدم مرة واحدة فقط: إنشاء حساب المالك إذا كان جدول المستخدمين فارغًا |
| `ADMIN_NAME` | اسم المالك | اسم حساب المالك (الافتراضي «مدير الموقع») |
| `ADMIN_PASSWORD` | ١٠ أحرف فأكثر، حروف وأرقام | كلمة مرور المالك الأولى. احذفه من `.env` بعد أول دخول |
| `SMTP_HOST` | اختياري | خادم البريد الصادر. الأفضل تركه فارغًا وضبط البريد من اللوحة (انظر الملاحظة أسفل الجدول) |
| `SMTP_PORT` | `465` | منفذ SMTP |
| `SMTP_SECURE` | `true` | اتصال SSL مباشر (مع المنفذ 465) |
| `SMTP_USER` | | اسم مستخدم البريد (البريد كاملًا) |
| `SMTP_PASS` | | كلمة مرور البريد |
| `SMTP_FROM` | مثال: `إصغاء <no-reply@isgha.sa>` | اسم وعنوان المرسل |

ملاحظة عن SMTP: كل قيمة SMTP في `.env` تتقدم على مقابلها في لوحة التحكم (إعدادات الموقع ثم «البريد الصادر (SMTP)»). وإذا ضُبط `SMTP_HOST` في `.env` يُؤخذ المنفذ والاتصال الآمن من `.env` أيضًا. اضبط البريد في مكان واحد فقط، ويُفضّل اللوحة لأن فيها زر «اختبار البريد».

متغيرات متقدمة يقرؤها الكود وليست في `.env.example` (لا تحتاجها عادةً):

| المتغير | المعنى |
|---|---|
| `DATABASE_URL` | بديل لمتغيرات `DB_*` بصيغة `mysql://user:pass@host:3306/dbname` |
| `COOKIE_SECURE` | ضع `false` لإلغاء خاصية secure لكوكي الجلسة في الإنتاج (للتشخيص فقط) |
| `CACHE_TTL_MS` | مدة الذاكرة المؤقتة للمحتوى بالميلي ثانية (الافتراضي 15000) |
| `ASSET_VERSION` | رقم نسخة ملفات CSS/JS لكسر الكاش. الافتراضي وقت الإقلاع، فيتجدد مع كل إعادة تشغيل |

بعد أي تعديل على `.env` أعد تشغيل التطبيق (القسم 7.2).

## 6. أول تشغيل وحساب المالك

### 6.1 التشغيل

```bash
cd ~/domains/isgha.sa/nodejs
bash scripts/deploy.sh
```

السكربت يجلب آخر نسخة، ويثبّت الحزم بـ `npm ci --omit=dev` (لأن `node_modules` غير موجود بعد)، ثم يلمس `tmp/restart.txt`. يقلع التطبيق مع أول طلب يصل إليه.

افتح الموقع (انظر القسم 8 لطريقة فتحه قبل تحويل الدومين). عند أول إقلاع يحدث التالي:

1. تُنشأ الجداول (ثلاثة ملفات ترحيل، منها جدول الجلسات).
2. يُعبّأ المحتوى الأولي: أقسام الخدمات وخدماتها، الباقات، المستفيدون، الأسئلة الشائعة، الصفحات الأساسية، صفحة الهبوط `/case-review`، ثلاثة مقالات **كمسودات**، ثلاثة آراء عملاء **مخفية** (نماذج يجب استبدالها)، وسبعة تحويلات 301 من روابط الموقع القديم.
3. يُنشأ حساب المالك من `ADMIN_EMAIL` و`ADMIN_PASSWORD`.

تحقق من الصحة:

```bash
curl -s https://<الرابط-الذي-تختبر-عليه>/healthz
# {"ok":true,"time":"..."}
```

`/healthz` يعيد `ok: true` عندما يعمل التطبيق ويصل إلى قاعدة البيانات.

### 6.2 بعد أول دخول

1. ادخل إلى `/admin/login` ببريد المالك وكلمة مروره.
2. غيّر كلمة المرور من «حسابي» (أيقونة الترس أسفل القائمة الجانبية).
3. احذف الأسطر `ADMIN_EMAIL` و`ADMIN_NAME` و`ADMIN_PASSWORD` من `.env`، ثم أعد التشغيل. لن تُستخدم مرة أخرى لأن جدول المستخدمين لم يعد فارغًا.

### 6.3 إنشاء المالك عبر SSH (بديل)

إذا لم تضع `ADMIN_*` في `.env`، يكتب السجل تحذيرًا بأنه لا يوجد مستخدمون. أنشئ الحساب يدويًا:

```bash
cd ~/domains/isgha.sa/nodejs
export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
npm run create-admin -- --email <بريد-المالك> --name "<اسم المالك>"
```

- بدون `--password` تُولَّد كلمة مرور قوية وتُطبع **مرة واحدة**. احفظها فورًا.
- الأمر يقرأ إعدادات القاعدة من `.env` نفسه.
- يمكن استخدامه لاحقًا لاستعادة الدخول: تشغيله على بريد موجود يعيد تعيين كلمة المرور ويفعّل الحساب ويفك قفل المحاولات.
- الدور الافتراضي `owner`. عند إعادة تعيين كلمة مرور مستخدم غير مالك مرّر دوره، مثل `--role editor`، وإلا يتحول إلى مالك. الأدوار المتاحة: `owner` و`admin` و`editor` و`marketer` و`sales`.

## 7. التحديثات وإعادة التشغيل

### 7.1 نشر تحديث

1. خذ نسخة احتياطية من اللوحة: «النظام والنسخ» ثم «إنشاء نسخة الآن».
2. على السيرفر:

   ```bash
   cd ~/domains/isgha.sa/nodejs && bash scripts/deploy.sh
   ```

3. تحقق: `/healthz` يعيد `ok: true`، وفي اللوحة صفحة «النظام والنسخ» تعرض آخر الترحيلات تحت «آخر تحديثات قاعدة البيانات».

ما يفعله `scripts/deploy.sh`:

| الخطوة | التفاصيل |
|---|---|
| جلب الكود | `git fetch origin main` بمفتاح النشر `~/.ssh/isgha_deploy` |
| مطابقة الفرع | `git reset --hard origin/main`: أي تعديل يدوي على ملفات المستودع داخل السيرفر يُمسح. الملفات غير المتتبعة (`.env` و`node_modules` و`tmp/`) لا تتأثر |
| تثبيت الحزم | `npm ci --omit=dev` فقط إذا تغيّر `package-lock.json` أو لم يوجد `node_modules` |
| إعادة التشغيل | `touch tmp/restart.txt` |
| الترحيلات | تعمل تلقائيًا عند الإقلاع التالي (`AUTO_MIGRATE=true`) |

يمكن تغيير قيم السكربت بمتغيرات بيئة عند تشغيله: `NODE_BIN` (مجلد Node، الافتراضي `/opt/alt/alt-nodejs22/root/bin`)، و`DEPLOY_KEY` (مسار المفتاح)، و`BRANCH` (الافتراضي `main`). مثال: `BRANCH=hotfix bash scripts/deploy.sh`.

لا تعدّل الكود على السيرفر مباشرة. التعديل يكون في المستودع ثم يُنشر بالسكربت.

### 7.2 إعادة التشغيل فقط

بعد تعديل `.env` أو عند الحاجة:

```bash
touch ~/domains/isgha.sa/nodejs/tmp/restart.txt
```

يعيد Passenger تشغيل التطبيق مع الطلب التالي. زر إعادة التشغيل في صفحة تطبيق Node.js في hPanel يؤدي الغرض نفسه.

### 7.3 الرجوع لنسخة سابقة

```bash
cd ~/domains/isgha.sa/nodejs
git log --oneline -10
git reset --hard <COMMIT>
touch tmp/restart.txt
```

هذا رجوع مؤقت: التشغيل التالي لـ `deploy.sh` يعيد السيرفر إلى `origin/main`، فالحل الدائم يكون بعكس التعديل في المستودع. إذا كان التحديث المعيب أضاف ترحيلًا لقاعدة البيانات، فالأسلم استعادة النسخة الاحتياطية التي أخذتها قبل التحديث بدل التراجع اليدوي عن الترحيل.

## 8. اختبار الموقع قبل تحويل الدومين

ما دام DNS للدومين isgha.sa يشير إلى الاستضافة القديمة، افتح نسخة Hostinger بإحدى طريقتين:

1. **رابط المعاينة المؤقت** من hPanel إن كان متاحًا لموقعك.
2. **ملف hosts في جهازك:** أضف سطرًا يوجّه الدومين إلى IP السيرفر (من hPanel):

   ```text
   <SERVER_IP>  isgha.sa www.isgha.sa
   ```

   الملف في Windows: `C:\Windows\System32\drivers\etc\hosts` (افتح المحرر كمسؤول)، وفي macOS وLinux: `/etc/hosts`. افتح `http://isgha.sa` (قد لا تعمل https قبل إصدار شهادة SSL). احذف السطر بعد الاختبار.

أثناء هذه الفترة أبقِ `ALLOW_INDEXING=false` و`FORCE_HTTPS=false` و`CANONICAL_HOST` فارغًا.

ما يُختبر:

- كل الصفحات تفتح بدون أخطاء، والصور تظهر.
- الدخول إلى `/admin` وتعديل صفحة ونشرها.
- إرسال نموذج من `/consultation` و`/contact` و`/case-review`، وظهور الطلب في «طلبات العملاء».
- ضبط البريد في اللوحة ثم «اختبار البريد»، ووصول إشعار الطلب.
- رفع صورة من «صور الموقع» وظهورها، ثم التأكد أنها في `~/domains/isgha.sa/storage/uploads`.

## 9. الإطلاق: ربط isgha.sa

### 9.1 قبل التحويل

1. قبلها بيوم على الأقل: اخفض TTL لسجلات `A` الخاصة بـ `isgha.sa` و`www` إلى 300 ثانية عند مزوّد DNS الحالي، حتى ينتشر التغيير بسرعة.
2. راجع سجلات البريد. إذا كان بريد الشركة عند مزوّد آخر فلا تمس سجلات `MX` و`TXT` (SPF وDKIM).
3. خذ نسخة احتياطية من اللوحة.

### 9.2 تحويل DNS

- الطريقة الأسلم: غيّر سجل `A` للجذر `isgha.sa` وسجل `www` (سجل `A` أو `CNAME` إلى `isgha.sa`) ليشيرا إلى IP سيرفر Hostinger، واترك بقية السجلات كما هي.
- إذا قررت نقل الـ Nameservers كلها إلى Hostinger، فأنشئ في DNS Hostinger نسخة من كل السجلات الحالية (خاصة `MX` و`TXT`) **قبل** النقل، وإلا يتوقف البريد.

تحقق من الانتشار: `nslookup isgha.sa` و`nslookup www.isgha.sa` يجب أن يعيدا IP السيرفر.

### 9.3 شهادة SSL

بعد انتشار DNS ثبّت شهادة SSL المجانية من hPanel (قسم SSL) لـ `isgha.sa` و`www.isgha.sa`، وتأكد أن `https://isgha.sa` يفتح بدون تحذير. لا تعدّل `public_html/.htaccess` بيدك.

### 9.4 تحديث الإعدادات

في `.env`:

```dotenv
SITE_URL=https://isgha.sa
CANONICAL_HOST=isgha.sa
FORCE_HTTPS=true
ALLOW_INDEXING=true
```

ثم أعد التشغيل: `touch ~/domains/isgha.sa/nodejs/tmp/restart.txt`

وفي لوحة التحكم: «محركات البحث SEO» ثم حقل «الدومين الأساسي (Canonical)» اكتب `https://isgha.sa` واحفظ. هذا الحقل هو ما تبني عليه روابط canonical وخريطة الموقع وسطر Sitemap في robots.txt والرابط داخل إيميلات إشعار الطلبات.

لاحظ الفرق بين الإعدادين: `CANONICAL_HOST` في `.env` اسم دومين فقط (`isgha.sa`) ويُستخدم للتحويل، وحقل اللوحة رابط كامل (`https://isgha.sa`) ويُستخدم في الروابط.

### 9.5 التحقق بعد الإطلاق

```bash
curl -sI http://isgha.sa/ | grep -i location        # https://isgha.sa/
curl -sI https://www.isgha.sa/ | grep -i location   # https://isgha.sa/
curl -s https://isgha.sa/robots.txt                 # Allow: / وسطر Sitemap: https://isgha.sa/sitemap.xml
curl -s https://isgha.sa/sitemap.xml | head -5      # الروابط تبدأ بـ https://isgha.sa
curl -s https://isgha.sa/healthz
```

وافتح مصدر الصفحة الرئيسية وتأكد أن `<meta name="robots">` قيمته `index, follow, max-image-preview:large`.

روابط الموقع القديم يجب أن تتحول 301:

| الرابط القديم | الرابط الجديد |
|---|---|
| `/index.html` | `/` |
| `/pages/beneficiaries.html` | `/beneficiaries` |
| `/pages/judicial_services.html` | `/services/judicial` |
| `/pages/legal_services.html` | `/services/legal` |
| `/pages/notary_services.html` | `/services/notary` |
| `/pages/specialized_services.html` | `/services/specialized` |
| `/pages/packages_details.html` | `/packages` |

```bash
for p in /index.html /pages/beneficiaries.html /pages/judicial_services.html /pages/legal_services.html /pages/notary_services.html /pages/specialized_services.html /pages/packages_details.html; do
  printf "%s -> " "$p"; curl -s -o /dev/null -w "%{http_code} %{redirect_url}\n" "https://isgha.sa$p"
done
```

إذا كان في الموقع القديم روابط أخرى مهمة، أضف لها تحويلات من «التحويلات (301)» في اللوحة. وبعد أيام من الإطلاق راجع «روابط لا تعمل (404)» في «محركات البحث SEO».

### 9.6 Google Search Console

1. أضف الموقع في Google Search Console. إن اخترت التحقق بوسم HTML فانسخ قيمة `content` فقط والصقها في «Google Search Console — رمز التحقق» في «محركات البحث SEO» واحفظ، ثم اضغط Verify.
2. أرسل خريطة الموقع: `https://isgha.sa/sitemap.xml`.
3. اطلب فهرسة الصفحة الرئيسية من أداة فحص الرابط.
4. اختياري: كرر الخطوات في Bing Webmaster Tools (حقل «Bing Webmaster — رمز التحقق»).

### 9.7 اختبار الطلبات والإشعارات والبكسلات

1. افتح `https://isgha.sa/case-review?utm_source=test&utm_medium=cpc&utm_campaign=launch-test` وأرسل طلبًا تجريبيًا.
2. في «طلبات العملاء» تأكد من ظهور الطلب، وأن «مصدر العميل (الإسناد)» يعرض `test / cpc` والحملة `launch-test`.
3. تأكد من وصول إيميل الإشعار إلى العناوين في «إرسال إشعار كل طلب جديد إلى»، ومن عمل الرابط داخله. إن كان هناك Webhook فاستخدم «اختبار الـ Webhook».
4. البكسلات: ضع رمزًا في «Meta — Test Event Code» واحفظ، وتأكد من وصول حدث Lead في Test Events داخل Meta Events Manager من المتصفح، ومن السيرفر أيضًا إذا كان «Meta Conversions API — Access Token» مضبوطًا، ثم احذف الرمز. راجع GA4 (Realtime) وأدوات التحقق من بقية المنصات.
5. غيّر حالة الطلبات التجريبية إلى «غير جاد / مزعج» أو احذفها.
6. راجع بطاقة «جاهزية الموقع» في الرئيسية حتى تكتمل البنود، وتأكد من استبدال آراء العملاء النموذجية ومراجعة المقالات قانونيًا قبل نشرها.

## 10. النسخ الاحتياطي

### 10.1 من لوحة التحكم

- «النظام والنسخ» ثم «إنشاء نسخة الآن» يكتب ملف JSON في `~/domains/isgha.sa/storage/backups` باسم `isgha-backup-<التاريخ>.json`، ويُحتفظ بآخر ١٥ نسخة فقط.
- النسخة تشمل: الإعدادات، الخدمات وأقسامها، مجالات العمل، الباقات، المستفيدين، الأسئلة، آراء العملاء، الفريق، المقالات وتصنيفاتها، الصفحات، التحويلات، سجلات الوسائط، المستخدمين، الطلبات وملاحظاتها.
- لا تشمل: **ملفات الصور نفسها**، وسجل النشاط، وإحصاءات الزيارات، والجلسات.
- النسخ لا تُنشأ تلقائيًا. أنشئ نسخة قبل كل تحديث وقبل أي تعديل كبير، ونزّل نسخة دورية إلى مكان خارج السيرفر.
- الملف يحتوي بيانات العملاء وبصمات كلمات المرور وكلمة مرور SMTP ورموز التتبع السرية. احفظه في مكان خاص.

### 10.2 الصور والملفات المرفوعة

انسخها بشكل منفصل:

```bash
cd ~/domains/isgha.sa/storage
tar -czf ~/isgha-uploads-$(date +%F).tar.gz uploads
```

ثم نزّل الملف عبر مدير الملفات أو SFTP واحذفه من السيرفر.

### 10.3 نسخة SQL كاملة

```bash
mariadb-dump -h 127.0.0.1 -u <DB_USER> -p <DB_NAME> | gzip > ~/isgha-db-$(date +%F).sql.gz
```

(إن لم يوجد `mariadb-dump` استخدم `mysqldump` بنفس الخيارات.) يمكن أيضًا التصدير من phpMyAdmin في hPanel. ونسخ Hostinger التلقائية، حسب الخطة، طبقة حماية إضافية وليست بديلًا عن نسخك.

### 10.4 الاستعادة

- **من اللوحة (المالك فقط):** «النظام والنسخ» ثم «الاستعادة من نسخة». اختر نسخة محفوظة أو ارفع ملف `.json`، واكتب كلمة «استعادة» للتأكيد. الاستعادة تستبدل محتوى الجداول المذكورة بالكامل. المستخدمون الحاليون يبقون كما هم ما لم تفعّل «استعادة المستخدمين أيضًا». أنشئ نسخة من الوضع الحالي قبل الاستعادة.
- **من ملف SQL:** استورده من phpMyAdmin أو بـ `gunzip < <FILE>.sql.gz | mariadb -h 127.0.0.1 -u <DB_USER> -p <DB_NAME>`، ثم أعد تشغيل التطبيق.
- **الصور:** فك الأرشيف داخل `~/domains/isgha.sa/storage/`.

## 11. حل المشكلات

### أين أجد السجلات؟

- صفحة تطبيق Node.js في hPanel تعرض سجلات التشغيل (مخرجات `console`).
- رسائل الإقلاع الطبيعية: `[db] migrations applied: ...` و`[seed] ...` ثم `[isgha] running on port ... (production)`.
- الأخطاء تبدأ بـ `[error]` أو `[db] migration failed:` أو `[notify] mail:` أو `[notify] capi:` أو `[notify] webhook:`.
- لتشخيص الاتصال بقاعدة البيانات بنفس إعدادات `.env`:

  ```bash
  cd ~/domains/isgha.sa/nodejs
  export PATH=/opt/alt/alt-nodejs22/root/bin:$PATH
  npm run migrate      # النتيجة الطبيعية: «قاعدة البيانات محدّثة.»
  ```

- لرؤية خطأ الإقلاع مباشرة شغّل التطبيق مؤقتًا على منفذ آخر ثم أوقفه بـ Ctrl+C: `PORT=3999 node server.js`

### الموقع يعرض 503 أو صفحة خطأ Passenger

| السبب المحتمل | الحل |
|---|---|
| `SESSION_SECRET is required in production` في السجل | أضف `SESSION_SECRET` إلى `.env` وأعد التشغيل |
| `node_modules` ناقص أو فشل `npm ci` | شغّل `bash scripts/deploy.sh` من جديد وراقب الأخطاء |
| إصدار Node.js خاطئ | تأكد أن إعدادات التطبيق في hPanel على Node 22 وأن `.htaccess` يشير إلى `/opt/alt/alt-nodejs22/root/bin/node` |
| ملف التشغيل خاطئ | ملف التشغيل يجب أن يكون `server.js` وجذر التطبيق `~/domains/isgha.sa/nodejs` |
| خطأ صلاحيات `EACCES` على مجلد الرفع أو النسخ | تأكد أن `UPLOADS_DIR` و`BACKUPS_DIR` يشيران إلى `../storage/...` وأن المجلد قابل للكتابة لمستخدم الحساب |

### أخطاء قاعدة البيانات

| الرسالة | السبب والحل |
|---|---|
| `ECONNREFUSED` | `DB_HOST` أو `DB_PORT` خطأ. استخدم `127.0.0.1` و`3306`، وليس `srvNNNN.hstgr.io` ولا `localhost` |
| `ER_ACCESS_DENIED_ERROR` | اسم المستخدم أو كلمة المرور خطأ، أو المستخدم غير مرتبط بالقاعدة في hPanel. انتبه للبادئة في الاسم |
| `ER_BAD_DB_ERROR` | اسم القاعدة خطأ. اكتب الاسم الكامل بالبادئة |
| `[db] migration failed: ...` | التطبيق يقلع رغم ذلك، لكن صفحات كثيرة ستفشل. اقرأ الرسالة وشغّل `npm run migrate` لرؤية التفاصيل |
| `/healthz` يعيد `ok: false` | التطبيق يعمل لكنه لا يصل لقاعدة البيانات. راجع ما سبق |

### ERR_TOO_MANY_REDIRECTS

- `FORCE_HTTPS=true` مع `TRUST_PROXY=0` أو `false`: التطبيق لا يرى أن الاتصال HTTPS فيحوّل بلا نهاية. أعد `TRUST_PROXY=1`.
- `CANONICAL_HOST` مكتوب بصيغة خاطئة (فيه `https://` أو `/`). اكتب `isgha.sa` فقط.
- `CANONICAL_HOST` مضبوط قبل أن يشير DNS إلى السيرفر: كل الطلبات تُحوَّل إلى الدومين الذي ما زال على الاستضافة القديمة. أفرغه حتى يوم الإطلاق.

### لا أستطيع الدخول إلى اللوحة

- «محاولات كثيرة. انتظر ربع ساعة ثم حاول مجددًا.»: تجاوزت ١٢ محاولة دخول من نفس عنوان IP خلال ربع ساعة، فانتظر.
- «تم إيقاف الدخول مؤقتًا بسبب محاولات متكررة»: ٦ محاولات خاطئة على الحساب. انتظر ربع ساعة أو أعد تعيين كلمة المرور بـ `create-admin` (القسم 6.3).
- «انتهت صلاحية الصفحة، أعد المحاولة»: حدّث صفحة الدخول وحاول مجددًا.
- الدخول يعود لصفحة الدخول دائمًا: تأكد من وجود جدول `sessions` (ينشئه الترحيل) بتشغيل `npm run migrate`.

### إيميلات إشعار الطلبات لا تصل

1. في اللوحة: «إعدادات الموقع» ثم «البريد الصادر (SMTP)» ثم «اختبار البريد». رسالة الخطأ تظهر مباشرة.
2. تأكد أن قيم SMTP في `.env` فارغة أو صحيحة، لأنها تتقدم على قيم اللوحة.
3. تأكد أن «إرسال إشعار كل طلب جديد إلى» في تبويب «النماذج والعملاء» فيه بريد صحيح.
4. إذا وصل البريد إلى الرسائل المزعجة فراجع سجلات SPF وDKIM للدومين عند مزوّد البريد.
5. ابحث في السجل عن `[notify] mail:`.

### التعديلات لا تظهر في الموقع

- المحتوى يُخزَّن مؤقتًا ١٥ ثانية فقط. انتظر قليلًا، أو من «النظام والنسخ» اضغط «تحديث الذاكرة المؤقتة».
- إن كانت شبكة CDN من Hostinger مفعّلة للموقع فامسح الكاش منها.

### اختفت الصور بعد تحديث

تحقق أن `UPLOADS_DIR` يشير إلى `../storage/uploads` وليس إلى مجلد داخل `nodejs/`. استعد الصور من أرشيف `uploads` الاحتياطي.

### git fetch يفشل بـ Permission denied (publickey)

- المفتاح العام غير مضاف في Deploy keys للمستودع، أو أُضيف لمستودع آخر.
- مسار المفتاح ليس `~/.ssh/isgha_deploy`. مرّر المسار الصحيح: `DEPLOY_KEY=<المسار> bash scripts/deploy.sh`.
- اختبر بـ `ssh -i ~/.ssh/isgha_deploy -o IdentitiesOnly=yes -T git@github.com`.

### Google ما زال لا يؤرشف الموقع

تأكد أن `ALLOW_INDEXING=true` في `.env` وأن التطبيق أُعيد تشغيله، وأن صفحة «محركات البحث SEO» تعرض «الأرشفة مفتوحة»، وأن robots.txt لم يعد يحتوي `Disallow: /`.
