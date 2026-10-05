// أنواع الأقسام التي تُبنى منها الصفحات (الرئيسية، الداخلية، صفحات الهبوط)
// كل نوع له قالب في src/views/sections/<type>.njk ونموذج تعديل يُولَّد تلقائيًا في المنشئ.

const MARK = 'ضع الكلمة بين == == لتظليلها بالأصفر، مثل: ==تقييم أولي==';

const head = (tag = 'من نحن', title = 'عنوان القسم') => [
  { name: 'tag', label: 'الشارة الصغيرة', type: 'text', default: tag },
  { name: 'title', label: 'العنوان', type: 'textarea', rows: 2, hint: MARK, default: title },
  { name: 'intro', label: 'وصف مختصر', type: 'textarea', rows: 2, default: '' },
];

const bg = { name: 'bg', label: 'الخلفية', type: 'select', options: [['', 'كريمي (افتراضي)'], ['white', 'أبيض'], ['gray', 'رمادي فاتح'], ['teal', 'تركوازي'], ['ink', 'داكن']], default: '' };
const anchor = { name: 'anchor', label: 'معرّف القسم للروابط (#)', type: 'text', dir: 'ltr', default: '', hint: 'اختياري — مثال: services لتصبح الرابط /#services' };

export const SECTION_GROUPS = ['ترويسات', 'تعريف', 'خدمات ومحتوى', 'تحويل', 'عام'];

export const SECTION_TYPES = {
  hero_home: {
    label: 'ترويسة رئيسية بصورة', group: 'ترويسات', icon: 'panel-top',
    fields: [
      { name: 'eyebrow', label: 'السطر العلوي', type: 'text', default: 'محامون • مستشارون • محكمون • موثقون' },
      { name: 'title', label: 'العنوان الرئيسي (H1)', type: 'textarea', rows: 2, hint: MARK, default: 'شركة إصغاء ==للمحاماة== والاستشارات القانونية' },
      { name: 'lead', label: 'الوصف', type: 'textarea', rows: 3, default: '' },
      { name: 'primary_label', label: 'نص الزر الأساسي', type: 'text', default: 'احجز استشارة' },
      { name: 'primary_url', label: 'رابط الزر الأساسي', type: 'text', dir: 'ltr', default: '/consultation' },
      { name: 'show_call', label: 'زر الاتصال', type: 'toggle', default: true },
      { name: 'show_whatsapp', label: 'زر واتساب', type: 'toggle', default: true },
      { name: 'image', label: 'الصورة', type: 'image', slot: 'home_hero', default: '' },
      { name: 'image_alt', label: 'وصف الصورة (Alt)', type: 'text', default: 'محامٍ سعودي من فريق إصغاء للمحاماة' },
      { name: 'badges', label: 'شارات الثقة', type: 'list', default: ['مرخّصة من وزارة العدل', 'سرّية تامة', 'نرد خلال ساعات العمل'] },
      { name: 'card_title', label: 'البطاقة العائمة — العنوان', type: 'text', default: 'خبرة تتجاوز ١٥ عامًا' },
      { name: 'card_text', label: 'البطاقة العائمة — النص', type: 'text', default: 'في التقاضي والاستشارات والتوثيق' },
      { name: 'show_quicklinks', label: 'روابط الخدمات أسفل الترويسة', type: 'toggle', default: true },
    ],
  },
  hero_page: {
    label: 'ترويسة صفحة داخلية', group: 'ترويسات', icon: 'panel-top',
    fields: [
      { name: 'tag', label: 'الشارة', type: 'text', default: '' },
      { name: 'title', label: 'العنوان (H1)', type: 'textarea', rows: 2, hint: MARK, default: 'عنوان الصفحة' },
      { name: 'lead', label: 'الوصف', type: 'textarea', rows: 3, default: '' },
      { name: 'image', label: 'صورة جانبية (اختياري)', type: 'image', default: '' },
      { name: 'image_alt', label: 'وصف الصورة', type: 'text', default: '' },
      { name: 'cta_label', label: 'زر (اختياري)', type: 'text', default: '' },
      { name: 'cta_url', label: 'رابط الزر', type: 'text', dir: 'ltr', default: '' },
      { name: 'breadcrumbs', label: 'مسار التنقل', type: 'toggle', default: true },
    ],
  },
  hero_lead: {
    label: 'ترويسة إعلانية مع نموذج', group: 'ترويسات', icon: 'mouse-pointer',
    fields: [
      { name: 'title', label: 'العنوان (طابقه مع نص الإعلان)', type: 'textarea', rows: 2, hint: MARK, default: 'احصل على ==تقييم أولي== لقضيتك من محامٍ مختص' },
      { name: 'lead', label: 'الوصف', type: 'textarea', rows: 3, default: 'أخبرنا بقضيتك في أقل من دقيقة وسيتواصل معك محامٍ مختص خلال ساعات العمل ليوضح لك موقفك القانوني وخياراتك.' },
      { name: 'badges', label: 'شارات الثقة', type: 'list', default: ['ترخيص وزارة العدل', 'نرد خلال ساعات العمل', 'سرّية تامة'] },
      { name: 'frame_title', label: 'عنوان إطار النموذج', type: 'text', default: 'طلب تقييم قضية' },
      { name: 'frame_note', label: 'ملاحظة الإطار', type: 'text', default: 'آمن وسرّي' },
      { name: 'form_title', label: 'عنوان النموذج', type: 'text', default: 'ابدأ تقييم قضيتك مجانًا' },
      { name: 'form_sub', label: 'وصف النموذج', type: 'text', default: '٣ خطوات سريعة · أقل من دقيقة' },
      { name: 'step1_label', label: 'سؤال الخطوة الأولى', type: 'text', default: 'ما نوع قضيتك؟' },
      { name: 'case_types', label: 'الخيارات (اتركها فارغة لاستخدام إعدادات الموقع)', type: 'list', default: [] },
      { name: 'step2_label', label: 'سؤال الخطوة الثانية', type: 'text', default: 'اشرح موقفك باختصار (اختياري)' },
      { name: 'message_placeholder', label: 'مثال داخل خانة الشرح', type: 'text', default: 'مثال: لدي نزاع مع شريكي في الشركة حول…' },
      { name: 'step3_label', label: 'سؤال الخطوة الثالثة', type: 'text', default: 'إلى من نتحدث؟' },
      { name: 'ask_email', label: 'طلب البريد الإلكتروني', type: 'toggle', default: false },
      { name: 'submit_label', label: 'زر الإرسال', type: 'text', default: 'أرسل طلب التقييم' },
      { name: 'privacy_note', label: 'ملاحظة الخصوصية', type: 'text', default: 'بياناتك سرية ولا تُستخدم إلا للتواصل معك.' },
      { name: 'done_title', label: 'عنوان رسالة النجاح', type: 'text', default: 'وصلنا طلبك' },
      { name: 'done_text', label: 'نص رسالة النجاح', type: 'text', default: 'سيتواصل معك محامٍ مختص خلال ساعات العمل. إذا كان أمرك عاجلًا:' },
      { name: 'side_image', label: 'صورة جانبية (اختياري)', type: 'image', default: '' },
    ],
  },
  about_split: {
    label: 'نبذة مع صورة', group: 'تعريف', icon: 'columns',
    fields: [
      ...head('من نحن', 'نظرة عامة'),
      { name: 'body', label: 'النص', type: 'richtext', default: '<p>نص تعريفي…</p>' },
      { name: 'image', label: 'الصورة', type: 'image', slot: 'home_about', default: '' },
      { name: 'image_alt', label: 'وصف الصورة', type: 'text', default: '' },
      { name: 'image_side', label: 'مكان الصورة', type: 'select', options: [['start', 'يسار'], ['end', 'يمين']], default: 'start' },
      { name: 'badge', label: 'شارة على الصورة', type: 'text', default: '' },
      { name: 'cta_label', label: 'زر (اختياري)', type: 'text', default: '' },
      { name: 'cta_url', label: 'رابط الزر', type: 'text', dir: 'ltr', default: '' },
      bg, anchor,
    ],
  },
  pillars: {
    label: 'الرؤية والرسالة والقيم', group: 'تعريف', icon: 'target',
    fields: [
      ...head('هويتنا', 'ما نؤمن به'),
      { name: 'items', label: 'البطاقات', type: 'repeater', itemLabel: 'title', fields: [
        { name: 'icon', label: 'الأيقونة', type: 'icon' },
        { name: 'title', label: 'العنوان', type: 'text' },
        { name: 'text', label: 'النص', type: 'textarea' },
        { name: 'list', label: 'قائمة (اختياري)', type: 'list' },
      ], default: [] },
      bg, anchor,
    ],
  },
  features: {
    label: 'مميزات / نقاط قوة', group: 'تعريف', icon: 'list-checks',
    fields: [
      ...head('ما يميزنا', 'ما يميزنا'),
      { name: 'style', label: 'الشكل', type: 'select', options: [['numbered', 'مرقّم بخطوط'], ['cards', 'بطاقات بأيقونات'], ['list', 'قائمة تحريرية']], default: 'numbered' },
      { name: 'items', label: 'العناصر', type: 'repeater', itemLabel: 'title', fields: [
        { name: 'icon', label: 'الأيقونة', type: 'icon' },
        { name: 'title', label: 'العنوان', type: 'text' },
        { name: 'text', label: 'النص', type: 'textarea' },
      ], default: [] },
      bg, anchor,
    ],
  },
  services_overview: {
    label: 'الخدمات الرئيسية (تلقائي)', group: 'خدمات ومحتوى', icon: 'briefcase',
    note: 'يعرض أقسام الخدمات من «الخدمات» في لوحة التحكم.',
    fields: [
      ...head('خدماتنا', 'خدماتنا الرئيسية'),
      { name: 'max_bullets', label: 'عدد البنود في كل بطاقة', type: 'number', default: 5 },
      { name: 'show_contact', label: 'أزرار الاتصال وواتساب في البطاقات', type: 'toggle', default: true },
      bg, anchor,
    ],
  },
  specializations: {
    label: 'مجالات التخصص (تبويبات)', group: 'خدمات ومحتوى', icon: 'layers',
    note: 'يعرض خدمات قسم «الخدمات المتخصصة» كتبويبات.',
    fields: [
      ...head('مجالات تخصصنا', 'مجالات تخصصنا'),
      { name: 'category', label: 'قسم الخدمات', type: 'select', source: 'category_slugs', default: 'specialized' },
      bg, anchor,
    ],
  },
  practice_areas: {
    label: 'مجالات العمل القضائي (تلقائي)', group: 'خدمات ومحتوى', icon: 'gavel',
    fields: [
      ...head('مجالات العمل', 'مجالات العمل القضائي'),
      { name: 'show_desc', label: 'إظهار الوصف', type: 'toggle', default: true },
      bg, anchor,
    ],
  },
  packages: {
    label: 'الباقات القانونية (تلقائي)', group: 'خدمات ومحتوى', icon: 'gem',
    fields: [
      ...head('باقاتنا', 'باقاتنا القانونية'),
      { name: 'show_compare', label: 'جدول المقارنة', type: 'toggle', default: false },
      { name: 'show_details', label: 'التفاصيل الكاملة لكل باقة', type: 'toggle', default: false },
      { name: 'cards', label: 'بطاقات الباقات', type: 'toggle', default: true },
      { name: 'claim_label', label: 'البطاقة: عنوان الحد الأقصى', type: 'text', default: 'إدارة قضايا حتى' },
      { name: 'card_cta', label: 'البطاقة: نص الزر', type: 'text', default: 'تفاصيل أكثر' },
      { name: 'compare_title', label: 'المقارنة: عنوان الجدول', type: 'text', default: 'مقارنة الباقات القانونية' },
      { name: 'compare_head', label: 'المقارنة: عنوان عمود المميزات', type: 'text', default: 'المميزات' },
      { name: 'yes_label', label: 'المقارنة: معنى علامة ✓ (لقارئ الشاشة)', type: 'text', default: 'نعم' },
      { name: 'no_label', label: 'المقارنة: معنى علامة ✕ (لقارئ الشاشة)', type: 'text', default: 'لا' },
      { name: 'fact_claim', label: 'التفاصيل: عنوان الحد الأقصى', type: 'text', default: 'الحد الأقصى للمطالبة' },
      { name: 'fact_training', label: 'التفاصيل: عنوان ساعات التدريب', type: 'text', default: 'ساعات التدريب السنوية' },
      { name: 'core_title', label: 'التفاصيل: عنوان المميزات الأساسية', type: 'text', default: 'المميزات الأساسية' },
      { name: 'extra_default', label: 'التفاصيل: عنوان الخدمات الإضافية (إن لم يُحدد في الباقة)', type: 'text', default: 'الخدمات الإضافية' },
      { name: 'cta_prefix', label: 'التفاصيل: بادئة زر الطلب (إن لم يُحدد نص الزر في الباقة)', type: 'text', default: 'اطلب' },
      bg, anchor,
    ],
  },
  beneficiaries: {
    label: 'المستفيدون (تلقائي)', group: 'خدمات ومحتوى', icon: 'users',
    fields: [
      ...head('المستفيدون', 'المستفيدون من خدماتنا'),
      { name: 'style', label: 'الشكل', type: 'select', options: [['compact', 'مختصر'], ['detailed', 'تفصيلي مع الخدمات']], default: 'compact' },
      bg, anchor,
    ],
  },
  why_us: {
    label: 'لماذا نحن', group: 'تعريف', icon: 'award',
    fields: [
      ...head('لماذا إصغاء', 'لماذا تختار شركة إصغاء؟'),
      { name: 'items', label: 'الأسباب', type: 'repeater', itemLabel: 'title', fields: [
        { name: 'title', label: 'العنوان', type: 'text' },
        { name: 'text', label: 'النص', type: 'textarea' },
      ], default: [] },
      { name: 'image', label: 'صورة (اختياري)', type: 'image', default: '' },
      bg, anchor,
    ],
  },
  vision_band: {
    label: 'شريط صورة عريض', group: 'تعريف', icon: 'image',
    fields: [
      { name: 'title', label: 'العنوان', type: 'textarea', rows: 2, hint: MARK, default: 'حلول قانونية تواكب ==رؤية المملكة ٢٠٣٠==' },
      { name: 'text', label: 'النص', type: 'textarea', default: '' },
      { name: 'image', label: 'الصورة', type: 'image', slot: 'vision_skyline', default: '' },
      { name: 'cta_label', label: 'زر (اختياري)', type: 'text', default: '' },
      { name: 'cta_url', label: 'رابط الزر', type: 'text', dir: 'ltr', default: '' },
    ],
  },
  flow: {
    label: 'مخطط: من الحيرة إلى الوضوح', group: 'تحويل', icon: 'route',
    fields: [
      ...head('كيف نعمل', 'من التفاصيل المتناثرة\nإلى موقف قانوني واضح'),
      { name: 'inputs', label: 'المدخلات (٣)', type: 'list', default: ['نزاع أو خلاف', 'مستندات وعقود', 'أسئلة بلا إجابة'] },
      { name: 'center_title', label: 'المنتصف', type: 'text', default: 'إصغاء' },
      { name: 'center_sub', label: 'مراحل العمل في المنتصف', type: 'text', hint: 'افصل بين المراحل بالرمز · لتظهر كقائمة متتابعة', default: 'نُصغي · ندرس · نخطط · نرافع · نتابع' },
      { name: 'outputs', label: 'المخرجات (٣)', type: 'list', default: ['موقف قانوني واضح', 'خطة وتكلفة شفافة', 'تمثيل حتى التنفيذ'] },
      { name: 'inputs_title', label: 'عنوان عمود المدخلات', type: 'text', default: 'ما يصلنا منك' },
      { name: 'outputs_title', label: 'عنوان عمود المخرجات', type: 'text', default: 'ما تحصل عليه' },
      bg, anchor,
    ],
  },
  showcase: {
    label: 'بطاقات مميزات بواجهات مصغرة', group: 'تحويل', icon: 'layout-template',
    fields: [
      ...head('ماذا نقدّم', 'أكثر من مكتب محاماة..\nشريك قانوني يتابع معك'),
      { name: 'cards', label: 'البطاقات', type: 'repeater', itemLabel: 'title', fields: [
        { name: 'title', label: 'العنوان', type: 'text' },
        { name: 'text', label: 'النص', type: 'textarea' },
        { name: 'kind', label: 'الواجهة المصغرة', type: 'select', options: [['timeline', 'مسار القضية'], ['quote', 'عرض التكلفة'], ['updates', 'تحديثات'], ['chips', 'مجالات']] },
        { name: 'icon', label: 'الأيقونة (اختياري — تُختار تلقائيًا حسب الواجهة)', type: 'icon' },
        { name: 'items', label: 'عناصر الواجهة (سطر لكل عنصر — «العنوان: الحالة»)', type: 'list' },
      ], default: [] },
      bg, anchor,
    ],
  },
  steps: {
    label: 'خطوات (ماذا يحدث بعد الطلب)', group: 'تحويل', icon: 'list-ordered',
    fields: [
      ...head('خطوات واضحة', 'ماذا يحدث بعد إرسال طلبك؟'),
      { name: 'items', label: 'الخطوات', type: 'repeater', itemLabel: 'title', fields: [
        { name: 'icon', label: 'الأيقونة', type: 'icon' },
        { name: 'title', label: 'العنوان', type: 'text' },
        { name: 'text', label: 'النص', type: 'textarea' },
      ], default: [] },
      bg, anchor,
    ],
  },
  testimonials: {
    label: 'آراء العملاء', group: 'تحويل', icon: 'quote',
    fields: [
      ...head('قالوا عنا', 'عملاء وثقوا بنا'),
      { name: 'source', label: 'المصدر', type: 'select', options: [['db', 'من قسم آراء العملاء في اللوحة'], ['items', 'عناصر خاصة بهذا القسم']], default: 'db' },
      { name: 'items', label: 'الآراء (عند اختيار عناصر خاصة)', type: 'repeater', itemLabel: 'name', fields: [
        { name: 'quote', label: 'الرأي', type: 'textarea' },
        { name: 'name', label: 'الاسم', type: 'text' },
        { name: 'context', label: 'نوع القضية والمدينة', type: 'text' },
      ], default: [] },
      bg, anchor,
    ],
  },
  faq: {
    label: 'الأسئلة الشائعة', group: 'تحويل', icon: 'circle-help',
    fields: [
      ...head('الأسئلة الشائعة', 'قبل أن تتواصل معنا'),
      { name: 'source', label: 'المصدر', type: 'select', options: [['db', 'من قسم الأسئلة في اللوحة'], ['items', 'أسئلة خاصة بهذا القسم']], default: 'db' },
      { name: 'group', label: 'مجموعة الأسئلة', type: 'select', source: 'faq_groups', default: 'general' },
      { name: 'items', label: 'الأسئلة (عند اختيار أسئلة خاصة)', type: 'repeater', itemLabel: 'q', fields: [
        { name: 'q', label: 'السؤال', type: 'text' },
        { name: 'a', label: 'الجواب', type: 'textarea' },
      ], default: [] },
      { name: 'schema', label: 'إضافة FAQ Schema لجوجل', type: 'toggle', default: true },
      bg, anchor,
    ],
  },
  cta_band: {
    label: 'شريط دعوة لاتخاذ إجراء', group: 'تحويل', icon: 'megaphone',
    fields: [
      { name: 'tag', label: 'الشارة', type: 'text', default: 'إصغاء · استشارة أولية' },
      { name: 'title', label: 'العنوان', type: 'textarea', rows: 2, hint: MARK, default: 'لا تجعل التردد سببًا في ضياع حقك' },
      { name: 'text', label: 'النص', type: 'textarea', default: '' },
      { name: 'primary_label', label: 'الزر الأساسي', type: 'text', default: 'احجز استشارتك' },
      { name: 'primary_url', label: 'رابطه', type: 'text', dir: 'ltr', default: '/consultation', hint: 'اكتب #form للانتقال لنموذج الصفحة' },
      { name: 'show_call', label: 'زر الاتصال', type: 'toggle', default: true },
      { name: 'show_whatsapp', label: 'زر واتساب', type: 'toggle', default: true },
    ],
  },
  contact: {
    label: 'نموذج التواصل وبيانات الاتصال', group: 'تحويل', icon: 'mail',
    fields: [
      ...head('اتصل بنا', 'يسعدنا تواصلك'),
      { name: 'form_title', label: 'عنوان النموذج', type: 'text', default: 'أرسل رسالتك' },
      { name: 'submit_label', label: 'زر الإرسال', type: 'text', default: 'إرسال الرسالة' },
      { name: 'show_map', label: 'إظهار الخريطة', type: 'toggle', default: true },
      bg, anchor,
    ],
  },
  lead_form: {
    label: 'نموذج طلب (داخل الصفحة)', group: 'تحويل', icon: 'clipboard',
    fields: [
      ...head('طلب استشارة', 'ابدأ بخطوة بسيطة'),
      { name: 'form_title', label: 'عنوان النموذج', type: 'text', default: 'ابدأ تقييم قضيتك' },
      { name: 'case_types', label: 'الخيارات (فارغة = إعدادات الموقع)', type: 'list', default: [] },
      { name: 'ask_email', label: 'طلب البريد الإلكتروني', type: 'toggle', default: false },
      { name: 'submit_label', label: 'زر الإرسال', type: 'text', default: 'أرسل الطلب' },
      { name: 'points', label: 'نقاط بجانب النموذج', type: 'list', default: ['مكالمة أولية لفهم قضيتك', 'خطة وتكلفة مكتوبة قبل أي التزام', 'سرية تامة لبياناتك'] },
      { name: 'image', label: 'صورة جانبية', type: 'image', slot: 'consultation_call', default: '' },
      bg, anchor,
    ],
  },
  stats: {
    label: 'أرقام', group: 'عام', icon: 'chart-bar',
    fields: [
      ...head('', ''),
      { name: 'items', label: 'الأرقام', type: 'repeater', itemLabel: 'label', fields: [
        { name: 'value', label: 'الرقم', type: 'text' },
        { name: 'label', label: 'الوصف', type: 'text' },
      ], default: [] },
      bg, anchor,
    ],
  },
  image_text: {
    label: 'صورة ونص', group: 'عام', icon: 'columns',
    fields: [
      ...head('', 'عنوان'),
      { name: 'body', label: 'النص', type: 'richtext', default: '' },
      { name: 'bullets', label: 'نقاط', type: 'list', default: [] },
      { name: 'image', label: 'الصورة', type: 'image', default: '' },
      { name: 'image_alt', label: 'وصف الصورة', type: 'text', default: '' },
      { name: 'image_side', label: 'مكان الصورة', type: 'select', options: [['start', 'يسار'], ['end', 'يمين']], default: 'start' },
      { name: 'cta_label', label: 'زر', type: 'text', default: '' },
      { name: 'cta_url', label: 'رابط الزر', type: 'text', dir: 'ltr', default: '' },
      bg, anchor,
    ],
  },
  rich_text: {
    label: 'نص منسّق', group: 'عام', icon: 'type',
    fields: [
      { name: 'title', label: 'العنوان (اختياري)', type: 'text', default: '' },
      { name: 'body', label: 'المحتوى', type: 'richtext', default: '<p>اكتب المحتوى هنا…</p>' },
      { name: 'width', label: 'العرض', type: 'select', options: [['narrow', 'ضيّق (مقروء)'], ['wide', 'عريض']], default: 'narrow' },
      { name: 'toc', label: 'فهرس تلقائي للعناوين', type: 'toggle', default: false },
      bg, anchor,
    ],
  },
  team: {
    label: 'فريق العمل (تلقائي)', group: 'عام', icon: 'users',
    note: 'يظهر فقط عند إضافة أعضاء من «فريق العمل».',
    fields: [...head('فريقنا', 'نخبة من المحامين والمستشارين'), bg, anchor],
  },
  posts_latest: {
    label: 'أحدث المقالات (تلقائي)', group: 'عام', icon: 'newspaper',
    fields: [...head('المعرفة القانونية', 'مقالات وإرشادات قانونية'), { name: 'count', label: 'العدد', type: 'number', default: 3 }, bg, anchor],
  },
  video: {
    label: 'فيديو يوتيوب', group: 'عام', icon: 'play',
    fields: [
      ...head('', ''),
      { name: 'youtube', label: 'رابط الفيديو', type: 'text', dir: 'ltr', default: '' },
      bg, anchor,
    ],
  },
  custom_html: {
    label: 'كود HTML مخصص', group: 'عام', icon: 'code',
    note: 'للمتقدمين فقط — يُعرض كما هو.',
    fields: [{ name: 'html', label: 'HTML', type: 'code', default: '' }],
  },
};

// القيم الافتراضية لقسم جديد
export function sectionDefaults(type) {
  const def = SECTION_TYPES[type];
  if (!def) return null;
  const data = {};
  for (const f of def.fields) data[f.name] = structuredClone(f.default ?? (f.type === 'toggle' ? false : f.type === 'list' || f.type === 'repeater' ? [] : ''));
  return data;
}

export function newSection(type, data = {}) {
  return {
    id: Math.random().toString(36).slice(2, 10),
    type,
    hidden: false,
    data: { ...sectionDefaults(type), ...data },
  };
}

// يضمن أن بيانات القسم تحتوي كل الحقول (عند إضافة حقول جديدة لاحقًا)
export function normalizeSections(list) {
  if (!Array.isArray(list)) return [];
  return list
    .filter((s) => s && SECTION_TYPES[s.type])
    .map((s) => ({ id: s.id || Math.random().toString(36).slice(2, 10), type: s.type, hidden: !!s.hidden, data: { ...sectionDefaults(s.type), ...(s.data || {}) } }));
}
