// قوالب جاهزة لإنشاء صفحات هبوط وصفحات جديدة بنقرة واحدة
import { newSection as S } from './sections.js';

const STEPS = [
  { icon: 'inbox', title: 'نستقبل طلبك', text: 'يصل فورًا ويُسند لمحامٍ مختص في نوع قضيتك.' },
  { icon: 'phone', title: 'مكالمة أولية', text: 'نستمع لك ونوضح موقفك القانوني وخياراتك.' },
  { icon: 'file-check', title: 'خطة وتكلفة مكتوبة', text: 'عرض واضح بالخطة والتكلفة كاملة قبل أي التزام.' },
  { icon: 'square-check', title: 'أنت من يقرر', text: 'لا التزام قبل موافقتك — القرار يعود لك.' },
];

export const PAGE_TEMPLATES = {
  'lead-gen': {
    label: 'هبوط إعلاني — تقييم قضية',
    desc: 'نموذج من ٣ خطوات أعلى الصفحة + مخطط العمل + الخطوات + الأسئلة. مثالي لإعلانات جوجل وسناب وتيك توك.',
    kind: 'landing', layout: 'landing', icon: 'mouse-pointer',
    build: (title) => [
      S('hero_lead', title ? { title } : {}),
      S('flow'),
      S('steps', { items: STEPS, bg: 'white' }),
      S('cta_band', { title: 'لا تجعل التردد سببًا في ضياع حقك', primary_label: 'ابدأ تقييم قضيتك', primary_url: '#form', tag: 'إصغاء · تقييم أولي' }),
      S('faq', { group: 'consultation' }),
    ],
  },
  'service-ad': {
    label: 'هبوط لخدمة محددة',
    desc: 'لإعلان خدمة واحدة (مثل تأسيس الشركات أو التوثيق): ترويسة بنموذج + مميزات + خطوات + أسئلة.',
    kind: 'landing', layout: 'landing', icon: 'target',
    build: (title) => [
      S('hero_lead', { title: title || 'خدمة ==تأسيس الشركات== من الاستشارة حتى السجل التجاري', lead: 'فريق متخصص يتولى إجراءات التأسيس وصياغة عقد التأسيس واللوائح، مع متابعة كاملة لدى الجهات المختصة.', frame_title: 'طلب خدمة', form_title: 'اطلب عرض سعر مجاني', submit_label: 'أرسل الطلب' }),
      S('features', { tag: 'ماذا تشمل الخدمة', title: 'كل ما تحتاجه ==في مكان واحد==', style: 'cards', items: [
        { icon: 'lightbulb', title: 'استشارة الشكل النظامي', text: 'نوصي بالشكل الأنسب لنشاطك وشركائك.' },
        { icon: 'file-pen', title: 'صياغة الوثائق', text: 'عقد التأسيس والنظام الأساسي ولوائح الحوكمة.' },
        { icon: 'landmark', title: 'الإجراءات الحكومية', text: 'متابعة كاملة لدى وزارة التجارة والجهات ذات العلاقة.' },
        { icon: 'shield', title: 'امتثال من البداية', text: 'تأسيس سليم يحميك من النزاعات لاحقًا.' },
      ], bg: 'white' }),
      S('steps', { items: STEPS }),
      S('cta_band', { title: 'ابدأ اليوم ==بخطوة واضحة==', primary_label: 'اطلب عرض السعر', primary_url: '#form' }),
      S('faq', { group: 'services', bg: 'white' }),
    ],
  },
  'content': {
    label: 'صفحة محتوى للموقع',
    desc: 'صفحة داخلية بترويسة ونص منسق — للصفحات التعريفية أو القانونية.',
    kind: 'custom', layout: 'site', icon: 'file-text',
    build: (title) => [
      S('hero_page', { title: title || 'عنوان الصفحة', lead: '' }),
      S('rich_text', { body: '<p>اكتب محتوى الصفحة هنا…</p>' }),
      S('cta_band', {}),
    ],
  },
  blank: {
    label: 'صفحة فارغة',
    desc: 'ابدأ من الصفر وأضف الأقسام التي تريدها.',
    kind: 'custom', layout: 'site', icon: 'plus',
    build: (title) => [S('hero_page', { title: title || 'عنوان الصفحة' })],
  },
};
