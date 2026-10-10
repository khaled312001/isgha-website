// تحديث محتوى حسب ملف «المقترحات التطويرية» من العميل (أكتوبر 2026) — آمن للتكرار
//   node scripts/content-update-2026-10-profile.js
// - نبذة الشركة، الرؤية، الرسالة، القيم (نص رسمي جديد من العميل)
// - قسم جديد في «من نحن»: نهجنا المهني في ممارسة العمل القانوني (7 منظومات عمل)
// - تعطيل تكرار عرض الخدمات في الرئيسية (بطاقات أسفل الترويسة تكرر قسم «خدماتنا الرئيسية»)
// - حذف «توثيق عقود الإيجار» من خدمات التوثيق العدلي
// - إضافة 3 خدمات متخصصة: بناء الإدارات القانونية، الصياغة التعاقدية، الحوكمة التأديبية
// - تحديث إجابة سؤال «أنا خارج الرياض» (منصات التقاضي الإلكترونية وليس ناجز فقط)
// - حذف رابط «خريطة الموقع» (XML خام) من روابط الفوتر القانونية
// - مواءمة نصوص التأسيس وإعادة الهيكلة والتحكيم ومقدمة الخدمات المتخصصة مع ملف العميل
import db from '../src/db.js';
import { CATEGORIES } from '../db/seed-content.js';

const ALIGNED_SERVICES = ['company-formation', 'restructuring', 'arbitration'];
const SERVICE_FIELDS = ['summary', 'body', 'bullets_title', 'bullets'];

const OVERVIEW_BODY =
  '<p>شركة وطنية مهنية متخصصة في تقديم الاستشارات القانونية وأعمال التوثيق النظامي، تتخذ من التحول الرقمي نهجًا، ومن الخبرة النظامية ركيزة؛ لتقديم حلول قانونية مبتكرة تحمي المراكز القانونية وتدعم استدامة ونمو الأعمال.</p>' +
  '<p>نستلهم رؤيتنا من طموح وطني واعٍ، برسالة تهدف إلى تمكين قطاع الأعمال سعيًا إلى مستقبل واعد، ومواكبة مستهدفات رؤية المملكة 2030 نحو بيئة قانونية أكثر تطورًا وكفاءة.</p>';

const PILLARS = [
  { icon: 'eye', title: 'رؤيتنا', text: 'أن تكون شركة إصغاء للمحاماة والاستشارات القانونية الشريك القانوني الوطني والدولي الأكثر موثوقية، في تقديم تقنيات وحلول قانونية مبتكرة، تُدار باحترافية رقمية، وتُسهم في تطوير البيئة القانونية في المملكة.', list: [] },
  { icon: 'target', title: 'رسالتنا', text: 'نُمكّن قطاع الأعمال عبر تقديم استشارات قانونية وتقنيات وحلول قانونية مبتكرة تقوم على التحول الرقمي والخبرة النظامية، وتُبنى على الإصغاء والثقة؛ لتحقيق حماية قانونية راسخة ونُمو مستدام.', list: [] },
  {
    icon: 'gem', title: 'قيمنا', text: '', list: ['الإصغاء', 'الموثوقية', 'الاحترافية', 'الإتقان', 'الرقمنة'],
    values: [
      { icon: 'message-square', title: 'الإصغاء', text: 'فهم عميق يقود إلى رأي قانوني سديد' },
      { icon: 'shield', title: 'الموثوقية', text: 'ثقة تُبنى بالالتزام وتُصان بالمسؤولية' },
      { icon: 'award', title: 'الاحترافية', text: 'ممارسة قانونية رفيعة وفق أعلى المعايير' },
      { icon: 'check-circle', title: 'الإتقان', text: 'عناية دقيقة بالتفاصيل تُترجم إلى أداء محكم وجودة مستدامة في النتائج' },
      { icon: 'zap', title: 'الرقمنة', text: 'ابتكار تقني يرفع الكفاءة، ويُجوّد الأداء، ويصنع قيمة مستدامة' },
    ],
  },
];

const APPROACH_TAG = 'نهجنا المهني';
const APPROACH_SECTION = {
  type: 'why_us',
  hidden: false,
  data: {
    tag: APPROACH_TAG,
    title: 'نهج مهني منظم في ==ممارسة العمل القانوني==',
    intro: 'نعتمد نهجًا مؤسسيًا منظمًا ينطلق من قيمَي الاحترافية والإتقان، يحكم تعاملنا مع العملاء والشركاء، ويُطبّق على كافة مراحل تقديم الخدمة وفق أعلى المعايير المهنية.',
    bg: 'white',
    items: [
      { icon: 'users', title: 'تجربة العميل في إصغاء', text: 'ننظّم التواصل مع عملائنا عبر قنوات معتمدة وكادر مهني متخصص، بسرعة استجابة ومتابعة دقيقة لمراحل الخدمة، ونقيس رضا العميل بمؤشرات معتمدة لتطوير التجربة باستمرار.' },
      { icon: 'chart-bar', title: 'منظومة تقارير رقمية', text: 'نُعدّ تقارير رقمية منتظمة لكل عميل وفق جدول زمني معتمد، تُبيّن الإجراءات المنجزة والخطوات المزمع اتخاذها في كل مرحلة من مراحل سير العمل.' },
      { icon: 'list-checks', title: 'منظومة إدارة المشاريع القانونية', text: 'ننتقي فريق عمل كل مشروع بعناية وفق متطلباته، ونضبط نطاقه وأهدافه بخطة عمل وجدول زمني واضحين، مع اجتماعات دورية لمتابعة سير الأعمال.' },
      { icon: 'database', title: 'المنظومة الرقمية لإدارة العمل القانوني', text: 'نعتمد منظومة رقمية متكاملة لتنظيم الملفات القانونية وحفظها بكفاءة وسرية تامة، ومتابعة مرحلية دقيقة للإجراءات، وتوظيف البيانات لدعم القرار.' },
      { icon: 'file-check', title: 'منظومة التدقيق القانوني وضمان الجودة', text: 'تخضع جميع أعمالنا القانونية لمراجعة منهجية متعددة المستويات وفق معايير مهنية معتمدة، بما يضمن الامتثال الكامل وموثوقية المخرجات.' },
      { icon: 'shield-alert', title: 'منظومة إدارة المخاطر', text: 'نبدأ بالإصغاء المبكر لمؤشرات الخطر، ثم نحلّلها ونعالجها وقائيًا، ونتابع أثرها؛ دعمًا لقرار قانوني أكثر اطمئنانًا واستدامة.' },
      { icon: 'graduation', title: 'منظومة تطوير وتنمية الكفاءات', text: 'لا نعدّ الكفاءة مهارة مكتسبة فحسب، بل نهجًا متجددًا يُنمى بالتعلم المستمر، ويترسخ بالممارسة، ويكتمل بالمعرفة النظامية.' },
    ],
  },
};

const NEW_SPECIALIZED_SERVICES = [
  {
    slug: 'legal-department', title: 'تأسيس وبناء الإدارات القانونية', icon: 'layers',
    summary: 'تأسيس إدارات قانونية مؤسسية تُدار وفق أرقى الممارسات النظامية، وتتكامل مع الهيكل التنظيمي للمنشأة.',
    body: '<p>تضطلع إصغاء بدور فاعل من خلال تقديم خدماتها في تأسيس إدارات قانونية مؤسسية، تُدار وفق أرقى الممارسات النظامية، وبما يُحقق التكامل مع الهيكل التنظيمي للمنشأة.</p>',
    bullets_title: 'وتتضمن هذه الخدمات:',
    bullets: [
      'تحليل الوضع القانوني القائم للمنشأة وتحديد احتياجاتها النظامية.',
      'إعداد الهيكل التنظيمي للإدارة القانونية وتحديد اختصاصاتها.',
      'تنظيم الصلاحيات والمسؤوليات الوظيفية ذات الصلة.',
      'تطوير نماذج العمل القانونية.',
      'اختيار وترشيح الكفاءات القانونية القادرة على دعم أعمال الإدارة القانونية.',
      'مرافقة تشغيل الإدارة القانونية وضمان استقرارها المؤسسي.',
      'مواءمة الدور القانوني مع الرؤية والاستراتيجية العامة للمنشأة.',
      'تطوير مؤشرات أداء تعكس نضج وكفاءة العمل القانوني.',
      'ترسيخ التكامل المؤسسي بين الإدارة القانونية وبقية الإدارات.',
    ],
  },
  {
    slug: 'contract-drafting', title: 'الصياغة التعاقدية والمراجعة القانونية', icon: 'file-pen',
    summary: 'صياغة ومراجعة متخصصة للعقود تكفل وضوح الالتزامات وحماية المصالح.',
    body: '<p>انطلاقًا من كون الصياغة التعاقدية الأساس الذي تُبنى عليه الثقة التعاقدية، تُقدم إصغاء حلولًا قانونية متخصصة في صياغة ومراجعة العقود، تكفل وضوح الالتزامات وحماية المصالح.</p>',
    bullets_title: 'وتضم هذه الخدمات:',
    bullets: [
      'مراجعة العقود القائمة للتحقق من سلامتها النظامية وتقييم مخاطرها التعاقدية.',
      'تطوير وإعادة هيكلة الصياغة التعاقدية بما يضمن وضوح الالتزامات وسلامة التنفيذ.',
      'المساندة القانونية في التفاوض على البنود والشروط التعاقدية.',
      'تقديم الخيارات والمسارات القانونية المناسبة لإنهاء أو فسخ العقود وفق الأنظمة ذات الصلة.',
      'صياغة وتنظيم العلاقات التعاقدية في الاستثمارات طويلة الأجل برؤية قانونية متقدمة توازن بين المصالح.',
    ],
  },
  {
    slug: 'labor-discipline', title: 'الحوكمة التأديبية والتحقيق العمالي', icon: 'shield-alert',
    summary: 'إدارة التحقيقات العمالية والإجراءات التأديبية بمنهجية قانونية منظمة تعزز الانضباط الوظيفي.',
    body: '<p>تتولى إصغاء إدارة التحقيقات العمالية والإجراءات التأديبية من خلال منهجية قانونية منظمة، تراعي متطلبات نظام العمل ولوائح المنشأة، وتسهم في تعزيز الانضباط الوظيفي واستقرار بيئة العمل.</p>',
    bullets_title: 'وتتفرع من هذه الخدمة:',
    bullets: [
      'تقديم إرشاد قانوني استباقي يهدف إلى تفادي المخالفات العمالية قبل نشوئها.',
      'مباشرة التحقيقات العمالية في المخالفات الوظيفية وإدارتها باحترافية.',
      'مراجعة وتحديث لوائح الجزاءات بما يضمن اتساقها مع الأنظمة واللوائح ذات الصلة.',
      'تعزيز سلامة القرارات التأديبية بما يحد من فرص الاعتراض والطعن عليها.',
      'تأهيل وتدريب لجان التحقيق على آليات التحقيق النظامي.',
      'ترسيخ ثقافة الامتثال والانضباط كجزء من الحوكمة المؤسسية.',
    ],
  },
];

const NAJIZ_FAQ_ANSWER = 'نعم. نمثّل عملاءنا أمام الجهات القضائية في مختلف مناطق المملكة، ومعظم إجراءات التقاضي اليوم تتم إلكترونيًا عبر المنصات القضائية المعتمدة، وليس عبر الحضور الشخصي فقط.';

const parse = (v, d) => { try { return JSON.parse(v); } catch { return d; } };
const join = (arr) => (arr || []).join('\n');
const log = [];

function patchSections(text, patchers) {
  const secs = parse(text, null);
  if (!Array.isArray(secs)) return null;
  let changed = false;
  for (const p of patchers) changed = p(secs) || changed;
  return changed ? JSON.stringify(secs) : null;
}

// ─── مُصحِّحات أقسام الصفحة (كل واحد يُرجع true إن عدّل شيئًا) ───
function fixQuicklinks(secs) {
  const s = secs.find((x) => x.type === 'hero_home');
  if (s && s.data.show_quicklinks !== false) { s.data.show_quicklinks = false; return true; }
  return false;
}
function fixOverviewBody(secs) {
  const s = secs.find((x) => x.type === 'about_split');
  if (s && s.data.body !== OVERVIEW_BODY) { s.data.body = OVERVIEW_BODY; return true; }
  return false;
}
function fixPillars(secs) {
  const s = secs.find((x) => x.type === 'pillars');
  if (s && JSON.stringify(s.data.items) !== JSON.stringify(PILLARS)) { s.data.items = PILLARS; return true; }
  return false;
}
function addApproachSection(secs) {
  if (secs.some((x) => x.type === 'why_us' && x.data?.tag === APPROACH_TAG)) return false;
  const i = secs.findIndex((x) => x.type === 'features' && x.data?.tag === 'ما يميزنا');
  const at = i >= 0 ? i + 1 : secs.findIndex((x) => x.type === 'why_us');
  const sec = { id: Math.random().toString(36).slice(2, 10), ...JSON.parse(JSON.stringify(APPROACH_SECTION)) };
  if (at >= 0) secs.splice(at, 0, sec); else secs.push(sec);
  return true;
}

try {
  // الإعدادات: حذف رابط خريطة الموقع (XML خام) من روابط الفوتر القانونية
  const fl = await db('settings').where({ key: 'footer_legal_links' }).first();
  if (fl) {
    const lines = parse(fl.value, []);
    const next = lines.filter((l) => !String(l).includes('/sitemap.xml'));
    if (next.length !== lines.length) { await db('settings').where({ key: 'footer_legal_links' }).update({ value: JSON.stringify(next) }); log.push('footer_legal_links: removed sitemap.xml'); }
  }

  // الصفحات: الرئيسية و«من نحن»
  const pages = await db('pages').select('id', 'slug', 'system_key', 'sections', 'draft_sections');
  for (const p of pages) {
    const upd = {};
    if (p.system_key === 'home') {
      for (const col of ['sections', 'draft_sections']) {
        if (!p[col]) continue;
        const next = patchSections(p[col], [fixQuicklinks, fixOverviewBody, fixPillars]);
        if (next) upd[col] = next;
      }
    }
    if (p.system_key === 'about') {
      for (const col of ['sections', 'draft_sections']) {
        if (!p[col]) continue;
        const next = patchSections(p[col], [fixOverviewBody, fixPillars, addApproachSection]);
        if (next) upd[col] = next;
      }
    }
    if (Object.keys(upd).length) {
      await db('pages').where({ id: p.id }).update({ ...upd, updated_at: new Date() });
      log.push(`page ${p.slug || '/'}: ${Object.keys(upd).join(', ')}`);
    }
  }

  // خدمات التوثيق العدلي: حذف «توثيق عقود الإيجار»
  const notary = await db('service_categories').where({ slug: 'notary' }).first();
  if (notary) {
    const bullets = (notary.bullets || '').split('\n').filter((b) => b.trim() !== 'توثيق عقود الإيجار');
    const patch = {};
    if (bullets.join('\n') !== notary.bullets) patch.bullets = bullets.join('\n');
    if (notary.summary?.includes('والإيجار')) patch.summary = notary.summary.replace('، وعقود الشركات والإيجار،', '، وعقود الشركات،');
    if (notary.meta_description?.includes('والإيجار')) patch.meta_description = notary.meta_description.replace('الشركات والإيجار', 'الشركات');
    if (Object.keys(patch).length) { await db('service_categories').where({ id: notary.id }).update(patch); log.push('notary: removed lease bullet'); }
  }

  // الخدمات المتخصصة: تحديث الملخص + إضافة 3 خدمات جديدة
  const specialized = await db('service_categories').where({ slug: 'specialized' }).first();
  if (specialized) {
    const newSummary = 'تأسيس الشركات وحوكمتها، وإعادة الهيكلة، وبناء الإدارات القانونية، والصياغة التعاقدية، والحوكمة التأديبية.';
    const newIntro = CATEGORIES.find((c) => c.slug === 'specialized').intro;
    const newBulletNames = ['تأسيس وبناء الإدارات القانونية', 'الصياغة التعاقدية والمراجعة القانونية', 'الحوكمة التأديبية والتحقيق العمالي'];
    const bullets = (specialized.bullets || '').split('\n').filter(Boolean);
    const addBullets = newBulletNames.filter((b) => !bullets.includes(b));
    const patch = {};
    if (specialized.summary !== newSummary) patch.summary = newSummary;
    if (specialized.intro !== newIntro) patch.intro = newIntro;
    if (addBullets.length) patch.bullets = [...bullets, ...addBullets].join('\n');
    if (Object.keys(patch).length) { await db('service_categories').where({ id: specialized.id }).update(patch); log.push('specialized category: summary/intro/bullets updated'); }

    const existing = await db('services').where({ category_id: specialized.id }).select('slug');
    const have = new Set(existing.map((x) => x.slug));
    let sort = (await db('services').where({ category_id: specialized.id }).max('sort as m').first())?.m || 0;
    for (const svc of NEW_SPECIALIZED_SERVICES) {
      if (have.has(svc.slug)) continue;
      sort += 10;
      await db('services').insert({
        category_id: specialized.id, slug: svc.slug, title: svc.title, icon: svc.icon, summary: svc.summary, body: svc.body,
        bullets_title: svc.bullets_title, bullets: join(svc.bullets), has_page: true, sort, is_active: true,
      });
      log.push(`service added: ${svc.slug}`);
    }
  }

  // مواءمة نصوص خدمات قائمة مع ملف العميل (المصدر: db/seed-content.js)
  for (const slug of ALIGNED_SERVICES) {
    const src = CATEGORIES.flatMap((c) => c.services).find((s) => s.slug === slug);
    const rows = await db('services').where({ slug });
    for (const row of rows) {
      const patch = {};
      for (const f of SERVICE_FIELDS) {
        const want = f === 'bullets' ? join(src[f]) : src[f];
        if (row[f] !== want) patch[f] = want;
      }
      if (Object.keys(patch).length) { await db('services').where({ id: row.id }).update(patch); log.push(`service aligned: ${slug} (${Object.keys(patch).join(', ')})`); }
    }
  }

  // سؤال «أنا خارج الرياض»: توضيح أن معظم الإجراءات تتم عبر منصات معتمدة، لا ناجز فقط
  const outOfRiyadh = await db('faqs').where('question', 'like', '%أنا خارج الرياض%');
  for (const f of outOfRiyadh) {
    if (f.answer !== NAJIZ_FAQ_ANSWER) { await db('faqs').where({ id: f.id }).update({ answer: NAJIZ_FAQ_ANSWER }); log.push(`faq #${f.id} updated`); }
  }
  const notaryFaq = await db('faqs').where({ question: 'هل تقدمون خدمات التوثيق؟' }).first();
  if (notaryFaq?.answer?.includes('والإيجار')) {
    await db('faqs').where({ id: notaryFaq.id }).update({ answer: notaryFaq.answer.replace('الشركات والإيجار', 'الشركات') });
    log.push('faq notary: removed lease mention');
  }

  console.log(log.length ? log.join('\n') : 'nothing to change');
} catch (e) {
  console.error('failed:', e.message);
  process.exitCode = 1;
} finally {
  await db.destroy();
}
