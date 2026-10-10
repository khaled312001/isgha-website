// يولّد docs/IMAGE-PROMPTS.md من خانات صور الموقع (نفس البرومبتات الظاهرة في لوحة التحكم)
// التشغيل: npm run docs:images
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { IMAGE_SLOTS, IMAGE_STYLE, IMAGE_NEGATIVE, IMAGE_NEGATIVE_LOGO, LOGO_FILES, LOGO_RULES, EXTRA_PROMPTS } from '../src/content/image-slots.js';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ar = (n) => String(n).replace(/\d/g, (d) => '٠١٢٣٤٥٦٧٨٩'[d]);

// صور بلا شعار عمدًا
const NO_LOGO = {
  ben_government: 'صورة لمبنى حكومي الطابع؛ وضع شعار الشركة عليه قد يوحي بصفة رسمية غير صحيحة.',
  ben_companies: 'منظر عام لأفق المركز المالي؛ أي شعار فيه سيبدو ملصقًا وغير طبيعي.',
  vision_skyline: 'يُكتب فوقها نص في الموقع، والشعار سيزاحم النص.',
};

const out = [];
const p = (s = '') => out.push(s);
const block = (s) => { p('```text'); p(s); p('```'); p(); };
const withLogo = IMAGE_SLOTS.filter((s) => s.logo);

p('# برومبتات صور موقع إصغاء — دمج الشعار');
p();
p('تنفيذًا لطلب العميل (البند ٤ في ملف المقترحات): تطوير صور الموقع لتعكس هوية إصغاء، بدمج الشعار في الصور بشكل احترافي ومتناسق — على الملفات الجلدية والأوراق والجدران — لا كعلامة مائية ملصقة.');
p();
p(`- **${ar(withLogo.length)} صورة** يُضاف لها الشعار، و**${ar(IMAGE_SLOTS.length - withLogo.length)} صور** تبقى بلا شعار عمدًا (السبب مذكور عند كل منها).`);
p('- لكل صورة برومبتان لـ ChatGPT: **(١) إضافة الشعار إلى الصورة الحالية** — الأفضل لأنها تحافظ على الصور المعتمدة، و**(٢) توليد صورة جديدة بالشعار** — عند الرغبة في تغيير الصورة كلها.');
p('- البرومبتات نفسها موجودة في **لوحة التحكم ← صور الموقع** مع زر نسخ لكل خانة.');
p();
p('## ملفات الشعار للرفع');
p();
p('| الملف | المحتوى | متى يُستخدم |');
p('|---|---|---|');
p(`| \`${LOGO_FILES.mark.file}\` | ${LOGO_FILES.mark.label} | الأماكن الصغيرة: ملفات جلدية، حقائب، أختام، أوراق. **الأكثر أمانًا** لأنه بلا حروف |`);
p(`| \`${LOGO_FILES.wordmark.file}\` | ${LOGO_FILES.wordmark.label} | الأسطح الكبيرة المسطحة: لوحة جدارية، شاشة عرض |`);
p('| `docs/brand/isgha-logo.png` | الشعار الكامل مع سطري التعريف | للطباعة والمطبوعات فقط — لا يُنصح به في الصور لأن السطور الصغيرة تتشوه |');
p('| `docs/brand/isgha-logo-white.png` | الشعار الكامل أبيض | للخلفيات الداكنة في التصاميم |');
p();
p('## الطريقة في ChatGPT');
p();
p('### (١) إضافة الشعار إلى الصورة الحالية — موصى بها');
p();
p('1. افتح **محادثة جديدة لكل صورة** (حتى لا تختلط الصور ببعضها).');
p('2. ارفع **الصورة الحالية أولًا** من مجلد `public/img/site/` (اسم الملف مذكور عند كل صورة)، ثم ارفع **ملف الشعار** المذكور عندها.');
p('3. الصق «برومبت إضافة الشعار» وأرسل.');
p();
p('### (٢) توليد صورة جديدة بالشعار');
p();
p('1. محادثة جديدة، ارفع **ملف الشعار فقط**.');
p('2. الصق «برومبت صورة جديدة» وأرسل.');
p();
p('### قبل اعتماد أي صورة');
p();
p('- **كبّر الصورة على الشعار:** يجب أن يطابق الأصل تمامًا. إن تشوّه، أرسل في نفس المحادثة:');
p();
block('The logo is distorted. Replace it with an exact copy of the attached logo (same shapes and proportions), keeping its placement, material and lighting. Change nothing else.');
p('- **الوجوه والملابس:** في التعديل قد يغيّر ChatGPT الوجوه قليلًا. إن حدث أرسل: `Keep every face, the ghutra/shemagh and the agal exactly identical to the original image.`');
p('- **الشعار ظاهر أكثر من اللازم:** أرسل: `Make the logo smaller and subtler, as a refined detail.`');
p('- **المقاس:** ChatGPT يعطي ثلاثة مقاسات فقط (مربع، طولي 2:3، عرضي 3:2). لا مشكلة: الموقع يقص الصورة تلقائيًا حول نقطة تركيزها. المقاس الأقرب مذكور عند كل صورة.');
p('- **الحفظ والرفع:** صدّر الصورة بصيغة **WebP** (جودة 80–85٪، ويفضّل أقل من 400 كيلوبايت)، ثم ارفعها في خانتها من **لوحة التحكم ← صور الموقع** فتظهر فورًا، وزر «استعادة الأساسية» يرجع الصورة القديمة عند الحاجة.');
p();
p('## ملخص الصور');
p();
p('| # | الصورة | الملف الحالي | الشعار | مكان الشعار |');
p('|---|---|---|---|---|');
IMAGE_SLOTS.forEach((s, i) => {
  const logo = s.logo ? LOGO_FILES[s.logo.use].label : '—';
  p(`| ${ar(i + 1)} | ${s.label} | \`${s.file}\` | ${logo} | ${s.logo ? s.logo.ar : `بلا شعار: ${NO_LOGO[s.key] || ''}`} |`);
});
p();

IMAGE_SLOTS.forEach((s, i) => {
  p('---');
  p();
  p(`## ${ar(i + 1)}. ${s.label}`);
  p();
  p(`- **مكان الظهور:** ${s.page}`);
  p(`- **المقاس النهائي:** ${s.size} بكسل (${s.ratio}) · **أقرب مقاس في ChatGPT:** ${s.gpt_ratio}`);
  p(`- **الصورة الحالية:** \`public/img/site/${s.file}\``);
  if (s.logo) {
    p(`- **ملف الشعار المرفوع:** \`${LOGO_FILES[s.logo.use].file}\` (${LOGO_FILES[s.logo.use].label})`);
    p(`- **مكان الشعار:** ${s.logo.ar}`);
  } else {
    p(`- **بلا شعار عمدًا:** ${NO_LOGO[s.key] || ''}`);
  }
  p();
  p(`**المشهد:** ${s.scene}`);
  p();
  if (s.notes) { p(`**ملاحظات القص والتكوين:** ${s.notes}`); p(); }
  if (s.logo) {
    p('**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:');
    p();
    block(s.edit);
    p('**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:');
    p();
    block(s.chatgpt);
  } else {
    p('**برومبت صورة جديدة (بدون شعار):**');
    p();
    block(`${s.prompt} Aspect ratio ${s.gpt_ratio}. Avoid: ${IMAGE_NEGATIVE}.`);
  }
  if (s.variant) { p(`**بديل:** ${s.variant}`); p(); }
});

p('---');
p();
p('## أغلفة المقالات (اختيارية)');
p();
p('تُرفع من صفحة تعديل المقال ← صورة الغلاف. ارفع ملف الرمز الذهبي مع كل برومبت.');
p();
EXTRA_PROMPTS.forEach((e) => {
  p(`### ${e.title} (${e.size} · ${e.ratio})`);
  p();
  block(e.logo
    ? `The attached image is the official logo of Isgha Law Firm. Create a new photograph: ${e.subject} The attached logo appears ${e.logo.place}. ${LOGO_RULES} ${IMAGE_STYLE} Aspect ratio 3:2 landscape. Avoid: ${IMAGE_NEGATIVE_LOGO}.`
    : `${e.subject} ${IMAGE_STYLE}`);
});

p('## مرجع: الأسلوب الموحّد');
p();
p('مضاف تلقائيًا داخل كل برومبت أعلاه — بألوان هوية إصغاء: الأخضر `#215d41`، الذهبي `#d8af4d`، البيج `#f6f5e9`.');
p();
block(IMAGE_STYLE);
p('## مرجع: قواعد الشعار');
p();
block(LOGO_RULES);
p('## مرجع: البرومبت السلبي');
p();
p('للبرومبتات التي فيها الشعار:');
p();
block(IMAGE_NEGATIVE_LOGO);
p('للصور بدون شعار (ويصلح مع Midjourney بعد `--no`):');
p();
block(IMAGE_NEGATIVE);
p('## صور فريق العمل');
p();
p('صور أعضاء الفريق يجب أن تكون **صورًا حقيقية** لهم (لا تُولَّد بالذكاء الاصطناعي). للحصول على مظهر موحّد اطلب من المصوّر: خلفية جدار جصي عاجي، ضوء نافذة جانبي ناعم، لقطة نصفية بنسبة 4:5، الثوب والغترة والعقال أو البدلة الرسمية، وتعبير هادئ واثق.');
p();
p('> الصور المولّدة بالذكاء الاصطناعي توضيحية للأجواء فقط؛ لا تُقدَّم على أنها صور لموظفين أو عملاء حقيقيين.');
p();

const file = path.join(ROOT, 'docs', 'IMAGE-PROMPTS.md');
fs.mkdirSync(path.dirname(file), { recursive: true });
fs.writeFileSync(file, `${out.join('\n')}\n`);
console.log(`كُتب ${path.relative(ROOT, file)} (${IMAGE_SLOTS.length} صورة، ${withLogo.length} بالشعار)`);
