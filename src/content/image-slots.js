import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
// خانات صور الموقع: لكل خانة مكان ظهورها ومقاسها ووصف المشهد وبرومبت التوليد
// المصدر الوحيد للبرومبتات: تظهر في لوحة التحكم ← صور الموقع، ويُولَّد منها docs/IMAGE-PROMPTS.md
// (npm run docs:images)

// الأسلوب الموحّد لكل الصور — هوية سعودية راقية بألوان إصغاء
export const IMAGE_STYLE =
  'Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. ' +
  'Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, ' +
  'true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) ' +
  'and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; ' +
  'asymmetric magazine composition. Photorealistic.';

export const IMAGE_NEGATIVE =
  'text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, ' +
  'gavel, judge wig, Western courtroom, scales-of-justice statue, cartoon, illustration, 3D render, CGI, plastic skin, ' +
  'over-smoothed faces, extra fingers, distorted hands, crooked agal, headwear worn incorrectly, sunglasses, exaggerated smiles, ' +
  'stock-photo handshake, oversaturated colors, harsh flash, lens flare, cluttered background, low resolution';

// دمج شعار إصغاء في الصور (ChatGPT: يُرفع ملف الشعار مع البرومبت) — الملفات في docs/brand
export const LOGO_FILES = {
  mark: { file: 'docs/brand/isgha-mark-gold.png', label: 'الرمز الذهبي فقط' },
  wordmark: { file: 'docs/brand/isgha-logo-wordmark.png', label: 'الرمز + كلمة «إصغاء»' },
};

export const LOGO_RULES =
  'Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. ' +
  'It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. ' +
  'Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. ' +
  'Keep it subtle and refined: a secondary detail, never the focal point.';

export const IMAGE_NEGATIVE_LOGO =
  'any text or lettering other than the provided logo, other brands\' logos, watermarks, flags, national emblems, government seals, ' +
  'gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, ' +
  'oversaturated colors, harsh flash, cluttered background';

// أقرب مقاس يدعمه ChatGPT لكل نسبة (ثم يُقص للمقاس النهائي)
const GPT_RATIO = { '4:5': '2:3 portrait', '1:1': '1:1 square', '4:3': '3:2 landscape', '3:2': '3:2 landscape', '16:9': '3:2 landscape', '21:9': '3:2 landscape' };

// وصف ثابت لملابس الشخصيات حتى تكون دقيقة وأنيقة في كل الصور
const THOBE = 'an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head';
const SHEMAGH = 'an immaculate white thobe, a red-and-white checked shemagh neatly folded and secured with a black agal sitting level on the head';

const SLOTS = [
  {
    key: 'home_hero', label: 'الترويسة الرئيسية', page: 'الصفحة الرئيسية — بجانب العنوان الرئيسي', ratio: '4:5', size: '1200×1500',
    logo: { use: 'mark', place: 'as subtle gold-foil debossing centered on the front cover of the dark-green leather folder he holds at his side', ar: 'الرمز الذهبي مطبوع بورق الذهب على غلاف الملف الجلدي الأخضر الذي يحمله' },
    scene: 'محامٍ سعودي في الأربعينات بالثوب الأبيض والغترة والعقال، يقف بجانب نافذة مقوّسة في مكتب راقٍ بالرياض، يمسك ملفًا جلديًا أخضر داكنًا، بنظرة هادئة منصتة — تجسيد لاسم «إصغاء».',
    notes: 'تُعرض داخل قوس علوي (Arch) — اجعل الرأس في الثلث العلوي الأوسط مع مسافة فارغة فوقه، ولا تضع عناصر مهمة في الزوايا العلوية.',
    alt: 'محامٍ سعودي من فريق إصغاء للمحاماة في مكتب الشركة بالرياض',
    subject: `Portrait of a distinguished Saudi lawyer in his early forties standing beside a tall arched window in a refined Riyadh law office. He wears ${THOBE}. He holds a slim deep-green leather document folder at his side and has a calm, attentive expression, looking slightly off-camera as if listening carefully to someone. Behind him: warm travertine walls, walnut bookshelves with leather-bound legal volumes softly out of focus, the edge of a deep forest-green velvet armchair. Soft late-morning daylight from the window gently shaping his face. Vertical composition, subject centered with clear headroom above.`,
    variant: 'لمظهر أكثر فخامة (لشريك أول): أضف «a fine charcoal bisht with a slim gold trim draped over his shoulders».',
  },
  {
    key: 'home_about', label: 'من نحن (الرئيسية)', page: 'الرئيسية + من نحن + الباقات — بجانب النبذة', ratio: '4:3', size: '1600×1200',
    logo: { use: 'mark', place: 'as a small gold letterhead emblem printed at the top center of the white document lying on the table', ar: 'الرمز الذهبي كترويسة صغيرة أعلى الورقة الموضوعة على الطاولة' },
    scene: 'جلسة استشارة هادئة: محامٍ بالشماغ الأحمر ينصت باهتمام لعميل (من الخلف)، وزميل ببدلة كحلية يدوّن ملاحظات، على الطاولة عقد وفناجين قهوة عربية ودلة نحاسية.',
    notes: 'تُعرض بزوايا دائرية مع شارة صغيرة في أسفل الصورة — اترك أسفل الصورة هادئًا نسبيًا.',
    alt: 'محامو إصغاء خلال جلسة استشارة قانونية مع أحد العملاء',
    subject: `A calm legal consultation in the private meeting room of a Saudi law firm. A Saudi lawyer wearing ${SHEMAGH} leans slightly forward, listening intently to a client seated across a solid walnut table (the client seen from behind over the shoulder, softly out of focus). A second Saudi lawyer in a tailored navy suit writes notes in a leather notebook. On the table: a printed agreement with unreadable text, a brass fountain pen, two small Arabic coffee cups (finjan) and a polished brass dallah. Tall window with sheer linen curtains, warm afternoon light, a deep forest-green accent wall.`,
  },
  {
    key: 'about_office', label: 'مكتب الشركة', page: 'صفحة من نحن — الترويسة', ratio: '16:9', size: '1920×1080',
    logo: { use: 'wordmark', place: 'as an elegant brushed-brass dimensional wall sign mounted on the plain travertine wall area, softly lit by a warm hidden light', ar: 'الشعار كلوحة نحاسية بارزة مثبتة على الجدار الحجري للمكتب بإضاءة دافئة' },
    scene: 'داخلية مكتب محاماة سعودي فاخر بدون أشخاص: أرضية ترافرتين، جدران جصية عاجية، رفوف جوز بكتب قانونية جلدية، كراسي مخملية خضراء داكنة، ستارة خشبية بنقوش نجدية ترمي ظلالًا هندسية، وشجرة زيتون.',
    notes: 'تظهر داخل قوس ناعم في الترويسة — اجعل مركز الثقل في وسط الصورة.',
    alt: 'مكتب شركة إصغاء للمحاماة والاستشارات القانونية في الرياض',
    subject: 'Architectural interior of an elegant Saudi law firm office in Riyadh, with no people. Travertine floor, warm ivory lime-plaster walls, a full wall of walnut shelving with leather-bound law books, two deep forest-green velvet armchairs around a low brass-and-marble table, a carved wooden geometric screen inspired by traditional Najdi and mashrabiya patterns casting soft patterned shadows across the floor, an olive tree in a carved stone planter, and a tall window with soft daylight. Straight verticals, calm near-symmetrical composition.',
  },
  {
    key: 'about_team', label: 'فريق العمل', page: 'صفحة من نحن — قسم «لماذا إصغاء»', ratio: '3:2', size: '1800×1200',
    logo: { use: 'mark', place: 'as gold-foil debossing on the dark-green leather folder lying on the table in the foreground', ar: 'الرمز الذهبي على الملف الجلدي الأخضر في مقدمة الطاولة' },
    scene: 'أربعة محامين سعوديين (اثنان بالثوب والغترة، واثنان ببدلات) يراجعون عقدًا في غرفة اجتماعات زجاجية، وخلفهم أبراج مركز الملك عبدالله المالي.',
    notes: 'صورة توضيحية للأجواء — لا تُقدَّم على أنها صورة الفريق الحقيقي. لصور الفريق الحقيقية استخدم قسم «فريق العمل».',
    alt: 'محامون سعوديون يراجعون عقدًا في قاعة اجتماعات',
    subject: `Four Saudi legal professionals in a glass-walled meeting room reviewing a contract together: two wear ${THOBE}, two wear tailored charcoal and navy suits. One points at a clause on the printed page while the others listen thoughtfully; natural, candid interaction, nobody looking at the camera. Through the glass, the towers of King Abdullah Financial District in soft afternoon haze. Walnut table, leather folders, a brushed-brass desk lamp.`,
  },
  {
    key: 'service_judicial', label: 'الخدمات القضائية', page: 'صفحة الخدمات القضائية + صفحات خدماتها', ratio: '4:3', size: '1600×1200',
    logo: { use: 'mark', place: 'as a small polished-brass emblem plate on the front flap of the dark leather briefcase he carries', ar: 'الرمز كقطعة نحاسية صغيرة على الحقيبة الجلدية التي يحملها' },
    scene: 'محامٍ بالثوب والغترة يصعد درجات حجرية واسعة لمبنى حكومي حديث بطراز نجدي وأعمدة شاهقة، يحمل ملفات القضايا وحقيبة جلدية، في ضوء الصباح الذهبي.',
    notes: 'بدون أي لوحات أو شعارات على المبنى. تظهر داخل قوس ناعم في ترويسة الصفحة.',
    alt: 'محامٍ سعودي في طريقه إلى جلسة قضائية',
    subject: `A Saudi lawyer wearing ${THOBE} walking up wide pale limestone steps of a monumental modern civic building in Riyadh with tall rhythmic columns and Najdi-inspired triangular openings, carrying a slim stack of case files and a dark leather briefcase. Early-morning golden light, long elegant shadows, low-angle view, a strong sense of purpose and dignity. No signage, no emblems.`,
  },
  {
    key: 'service_legal', label: 'الخدمات القانونية', page: 'صفحة الخدمات القانونية', ratio: '4:3', size: '1600×1200',
    logo: { use: 'mark', place: 'as gold-foil debossing in the lower corner of the dark-green leather folder holding the paper being signed', ar: 'الرمز الذهبي في زاوية الملف الجلدي الأخضر تحت ورقة التوقيع' },
    scene: 'لقطة قريبة أنيقة لتوقيع عقد بقلم حبر أسود وذهبي، كمّ ثوب أبيض بزر فضي، ورق عاجي، ومسند مكتب جلدي أخضر، وإضاءة جانبية ناعمة.',
    notes: 'لقطة تفاصيل (Close-up) — اجعل يد التوقيع في الثلث الأيمن أو الأيسر لا في المنتصف تمامًا.',
    alt: 'توقيع عقد قانوني بعد صياغته ومراجعته',
    subject: 'Elegant close-up of a contract being signed: a hand emerging from a crisp white thobe sleeve with a silver cufflink signs with a black-and-gold fountain pen on heavy ivory paper with unreadable text. Beside it: a deep-green leather desk pad, a brass paperweight and a walnut document box. Soft directional side light, very shallow depth of field, rich textures of paper and leather.',
  },
  {
    key: 'service_notary', label: 'خدمات التوثيق العدلي', page: 'صفحة التوثيق العدلي', ratio: '4:3', size: '1600×1200',
    logo: { use: 'mark', place: 'as a crisp blind-embossed seal impression on the ivory document right beside the brass stamp (the emblem only, no text), and as a small gold-foil emblem on the top dark-green folder of the stack', ar: 'ختم بارز برمز إصغاء على الوثيقة بجانب الختم النحاسي + الرمز الذهبي على الملف الأخضر' },
    scene: 'لحظة توثيق دقيقة: يد تضغط ختمًا بارزًا (بنقش هندسي بلا كتابة) على وثيقة عاجية، وملفات مرتبة بشريط أخضر داكن، ومصباح نحاسي على مكتب ترافرتين.',
    notes: 'تجنّب أي شعار رسمي أو كتابة على الختم — نقش هندسي مجرد فقط.',
    alt: 'توثيق عدلي للعقود والوكالات في إصغاء',
    subject: 'A precise notarization moment: a Saudi notary\'s hand, white thobe sleeve visible, pressing a brass embossing seal with an abstract geometric pattern (no text, no emblem) onto an ivory document. Neatly stacked folders tied with dark-green ribbon, a brushed-brass desk lamp, a travertine desk surface. Soft overhead daylight, a calm atmosphere of precision and trust.',
  },
  {
    key: 'service_specialized', label: 'الخدمات المتخصصة', page: 'صفحة الخدمات المتخصصة (تأسيس، هيكلة، امتثال)', ratio: '4:3', size: '1600×1200',
    logo: { use: 'wordmark', place: 'as a small logo in the top corner of the presentation slide on the large screen, in its original colors on the light slide background, keeping the abstract diagram', ar: 'الشعار صغيرًا في زاوية الشريحة المعروضة على الشاشة' },
    scene: 'جلسة استراتيجية في قاعة مجلس إدارة: تنفيذيون سعوديون بالثياب والبدلات يتأملون مخططًا تجريديًا على شاشة كبيرة، ونوافذ ممتدة تطل على الرياض وقت الغروب.',
    notes: 'المخطط على الشاشة أشكال تجريدية بلا أرقام أو كلمات.',
    alt: 'جلسة استشارية لإعادة هيكلة منشأة',
    subject: `A boardroom strategy session at dusk: Saudi executives — some in tailored navy suits, some wearing ${THOBE} — studying an abstract restructuring diagram of shapes and lines (no text, no numbers) on a large screen. Floor-to-ceiling windows reveal the Riyadh skyline at blue hour; warm interior lighting, a long walnut table with leather folders.`,
  },
  {
    key: 'packages_hero', label: 'الباقات القانونية', page: 'صفحة الباقات — الترويسة', ratio: '16:9', size: '1920×1080',
    logo: { use: 'mark', place: 'as gold-foil debossing on the cover of the dark-green leather folder the two men are reviewing', ar: 'الرمز الذهبي على غلاف الملف الجلدي الأخضر الذي يراجعانه' },
    scene: 'صاحب منشأة ببدلة فحمية ومحامٍ بالشماغ الأحمر يسيران جنبًا إلى جنب في ردهة برج مكتبي حديث، يراجعان ملفًا جلديًا ويتحدثان بطبيعية.',
    notes: 'بديل أرقى من «المصافحة» التقليدية. اترك مساحة هادئة على أحد الجانبين.',
    alt: 'شراكة قانونية مستمرة بين إصغاء وعملائها من الشركات',
    subject: `A Saudi business owner in a tailored charcoal suit and a Saudi lawyer wearing ${SHEMAGH} walking side by side through a bright double-height lobby of a modern Riyadh office tower, reviewing a leather folder together and talking naturally. Travertine floor, tall glass façade, indoor greenery, soft daylight. Wide composition with calm negative space on one side.`,
  },
  {
    key: 'ben_government', label: 'المستفيدون — الأجهزة الحكومية', page: 'صفحة المستفيدين + الرئيسية', ratio: '1:1', size: '1200×1200',
    scene: 'تفصيلة معمارية لمبنى حكومي حديث بطراز نجدي: واجهة بلون الرمل بفتحات مثلثة، وسماء صافية، بدون أشخاص أو لوحات.',
    notes: 'تُعرض كبطاقة مربعة — مركز الصورة هو الأهم.',
    alt: 'خدمات قانونية للأجهزة الحكومية',
    subject: 'Architectural detail of modern Saudi civic architecture inspired by Najdi heritage: a sand-colored rammed-earth façade with rhythmic triangular openings and deep shadows, crisp clear blue sky, clean geometric lines. No people, no signage, no emblems. Late-afternoon warm light.',
  },
  {
    key: 'ben_companies', label: 'المستفيدون — الشركات', page: 'صفحة المستفيدين + الرئيسية', ratio: '1:1', size: '1200×1200',
    scene: 'أبراج مركز الملك عبدالله المالي وقت الغسق بنوافذ مضيئة، ومهنيون سعوديون بالثياب والبدلات يعبرون الساحة بحركة خفيفة.',
    notes: 'تُعرض كبطاقة مربعة.',
    alt: 'خدمات قانونية للشركات والكيانات التجارية',
    subject: 'The towers of King Abdullah Financial District in Riyadh at blue hour, warm lit office windows against a deep blue sky; in the foreground a few Saudi professionals in white thobes and dark suits crossing the stone plaza, slightly motion-blurred. Elegant, ambitious mood.',
  },
  {
    key: 'ben_nonprofit', label: 'المستفيدون — الجمعيات', page: 'صفحة المستفيدين + الرئيسية', ratio: '1:1', size: '1200×1200',
    logo: { use: 'mark', place: 'as gold-foil debossing on the dark-green leather folders arranged on the low table', ar: 'الرمز الذهبي على الملفات الجلدية الخضراء فوق الطاولة' },
    scene: 'اجتماع مجلس جمعية خيرية في مجلس دافئ بوسائد بنقش السدو، رجال بالثياب يتناقشون حول وثائق مع القهوة العربية — إحساس بالخدمة والثقة.',
    notes: 'تُعرض كبطاقة مربعة.',
    alt: 'خدمات قانونية لجمعيات النفع العام',
    subject: 'A board meeting of a Saudi non-profit association in a warm, modern majlis-style hall: several Saudi men in white thobes and ghutras seated around a low table with neatly arranged documents, Arabic coffee and dates; one gently presenting while others listen. Cushions with subtle Sadu-weave patterns in muted forest green, gold and ivory, soft daylight. Sense of service, community and trust.',
  },
  {
    key: 'ben_individuals', label: 'المستفيدون — رجال الأعمال', page: 'صفحة المستفيدين + الرئيسية', ratio: '1:1', size: '1200×1200',
    logo: { use: 'mark', place: 'as gold-foil debossing on the front of the dark-green leather document box on his desk', ar: 'الرمز الذهبي على صندوق الوثائق الجلدي الأخضر فوق المكتب' },
    scene: 'رجل أعمال سعودي وقور في الخمسينات بالثوب والغترة والعقال (وبشت داكن اختياري)، في مكتبه الخاص يراجع وثائق الأوقاف والوصايا بنظارة القراءة.',
    notes: 'تُعرض كبطاقة مربعة — الوجه في الثلث العلوي.',
    alt: 'خدمات قانونية لرجال الأعمال: الأوقاف والوصايا والثروات',
    subject: `Portrait of a dignified Saudi businessman in his fifties wearing ${THOBE} and a fine dark bisht with a slim gold trim, seated at a walnut desk in his private study, reviewing estate documents with reading glasses in hand. Deep green leather chair, shelves of books, soft window light from the side. Calm, wise, trustworthy expression.`,
  },
  {
    key: 'contact_office', label: 'صفحة التواصل', page: 'صفحة اتصل بنا — الترويسة', ratio: '16:9', size: '1920×1080',
    logo: { use: 'wordmark', place: 'as a large, elegant brushed-brass dimensional logo sign mounted on the deep-green wall panel behind the reception desk, rendered entirely in brass for contrast, with a soft warm backlight halo', ar: 'الشعار كلوحة نحاسية كبيرة بارزة على الجدار الأخضر خلف مكتب الاستقبال بإضاءة خلفية دافئة' },
    scene: 'منطقة استقبال مكتب إصغاء: مكتب استقبال من خشب الجوز بحواف نحاسية، جدار أخضر داكن، شجرة زيتون، وموظف استقبال بالثوب يرحّب بزائر في الخلفية (غير واضح).',
    notes: 'تظهر داخل قوس ناعم — اجعل مكتب الاستقبال قريبًا من المنتصف.',
    alt: 'استقبال مكتب إصغاء للمحاماة في حي الياسمين بالرياض',
    subject: 'The welcoming reception area of a refined Saudi law firm in Riyadh: a walnut reception desk with brushed-brass trim, warm ivory walls with one deep forest-green accent wall, an olive tree in a stone planter, a pair of upholstered armchairs; in the background, slightly out of focus, a Saudi receptionist in a white thobe warmly greeting a visitor. Soft daylight, inviting atmosphere.',
  },
  {
    key: 'consultation_call', label: 'صفحة الاستشارة / الهبوط', page: 'صفحة احجز استشارة + صفحات الهبوط', ratio: '1:1', size: '1200×1200',
    logo: { use: 'mark', place: 'as gold-foil debossing on the dark-green leather desk box in the foreground', ar: 'الرمز الذهبي على العلبة الجلدية الخضراء في مقدمة المكتب' },
    scene: 'محامٍ بالثوب والشماغ الأحمر في مكالمة هاتفية على مكتبه، يدوّن في دفتر جلدي بتركيز وإنصات — «نُصغي إليك أولًا».',
    notes: 'تُعرض بجانب نموذج الطلب — نظرة المحامي باتجاه الداخل (نحو النموذج) أفضل.',
    alt: 'محامٍ من إصغاء يستمع لاستفسار عميل عبر الهاتف',
    subject: `A Saudi lawyer wearing ${SHEMAGH} on a phone call at his walnut desk, writing notes in a leather notebook with a fountain pen, eyes lowered in focused, empathetic listening. A closed laptop, a small finjan of Arabic coffee, warm office background softly blurred, soft window light. Feeling: "we listen to you first".`,
  },
  {
    key: 'vision_skyline', label: 'شريط رؤية ٢٠٣٠', page: 'الرئيسية + من نحن — شريط عريض عليه نص', ratio: '21:9', size: '2400×1030',
    scene: 'بانوراما لأفق الرياض وقت الغسق: برج المملكة وأبراج المركز المالي، سماء كهرمانية تتدرج إلى الأزرق العميق، وأضواء المدينة تبدأ بالتوهج.',
    notes: 'يوضع فوقها نص في الأسفل جهة اليمين مع تدرّج داكن — اجعل الثلث السفلي هادئًا وأقل تفاصيل.',
    alt: 'أفق مدينة الرياض وقت الغروب',
    subject: 'Ultra-wide panoramic view of the Riyadh skyline at dusk featuring Kingdom Centre and the King Abdullah Financial District towers, warm amber sky gradually fading into deep blue, city lights starting to glow. The lower third is calm and darker with fewer details. Aspirational, serene mood. Landscape photography.',
  },
  {
    key: 'insights_cover', label: 'غلاف المقالات الافتراضي', page: 'المعرفة القانونية — عند عدم وجود غلاف للمقال', ratio: '16:9', size: '1600×900',
    logo: { use: 'mark', place: 'as gold-foil debossing on the cover of the dark-green leather book at the bottom of the stack', ar: 'الرمز الذهبي على غلاف الكتاب الجلدي الأخضر أسفل المجموعة' },
    scene: 'طبيعة صامتة على مكتب من الجوز: مجلدات قانونية بأغلفة خضراء وعاجية (بلا عناوين مقروءة)، ميزان نحاسي صغير، نظارة قراءة، وفنجان قهوة عربية في ضوء الصباح.',
    notes: 'تُستخدم كغلاف بديل للمقالات — تكوين أفقي متوازن.',
    alt: 'المعرفة القانونية من إصغاء',
    subject: 'Still life on a walnut desk: a stack of leather-bound law books with deep-green and ivory spines (titles unreadable), a small antique brass balance scale, reading glasses, and a finjan of Arabic coffee beside a brass dallah. Soft directional morning light, calm editorial mood, shallow depth of field.',
  },
];

// نسبة العرض للارتفاع بصيغة Midjourney
const MJ_AR = { '4:5': '4:5', '4:3': '4:3', '16:9': '16:9', '3:2': '3:2', '1:1': '1:1', '21:9': '21:9' };

// نقطة التركيز في كل صورة (object-position) حتى تُقص جيدًا في كل مقاسات العرض
const FOCUS = {
  home_hero: '50% 22%',
  home_about: '50% 50%',
  about_office: '40% 45%',
  about_team: '50% 48%',
  service_judicial: '40% 25%',
  service_legal: '58% 60%',
  service_notary: '80% 50%',
  service_specialized: '100% 30%',
  packages_hero: '42% 45%',
  ben_government: '50% 50%',
  ben_companies: '50% 60%',
  ben_nonprofit: '50% 50%',
  ben_individuals: '50% 40%',
  contact_office: '68% 40%',
  consultation_call: '40% 45%',
  vision_skyline: '50% 55%',
  insights_cover: '35% 60%',
};

const SITE_IMG_DIR = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', '..', 'public', 'img', 'site');

export const IMAGE_SLOTS = SLOTS.map((s) => {
  const file = `isgha-${s.key.replace(/_/g, '-')}.webp`;
  return {
    ...s,
    prompt: `${s.subject} ${IMAGE_STYLE}`,
    mj: `--ar ${MJ_AR[s.ratio] || s.ratio} --style raw`,
    gpt_ratio: GPT_RATIO[s.ratio] || '3:2 landscape',
    // ChatGPT: صورة جديدة مع الشعار المرفق
    chatgpt: s.logo
      ? `The attached image is the official logo of Isgha Law Firm. Create a new photograph: ${s.subject} The attached logo appears ${s.logo.place}. ${LOGO_RULES} ${IMAGE_STYLE} Aspect ratio ${GPT_RATIO[s.ratio] || '3:2 landscape'}. Avoid: ${IMAGE_NEGATIVE_LOGO}.`
      : '',
    // ChatGPT: إضافة الشعار إلى الصورة الحالية (تُرفع الصورة الحالية ثم الشعار)
    edit: s.logo
      ? `Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 ${s.logo.place}. ${LOGO_RULES} Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.`
      : '',
    file,
    // الصورة المرفقة مع الموقع — تُستخدم ما لم تُرفع صورة أخرى من اللوحة
    default: fs.existsSync(path.join(SITE_IMG_DIR, file)) ? `/img/site/${file}` : '',
    focus: FOCUS[s.key] || '50% 50%',
  };
});

// رابط الصورة ← نقطة التركيز (للصور الافتراضية فقط؛ الصور المرفوعة تتمركز في المنتصف)
export const IMAGE_FOCUS = Object.fromEntries(IMAGE_SLOTS.filter((s) => s.default).map((s) => [s.default, s.focus]));

// أغلفة المقالات الافتراضية حسب التصنيف
export const POST_COVERS = { 'corporate-law': '/img/site/covers/corporate-law.webp', litigation: '/img/site/covers/litigation.webp', notary: '/img/site/covers/notary.webp' };

export function slotByKey(key) {
  return IMAGE_SLOTS.find((s) => s.key === key);
}

// صور إضافية اختيارية (ليست خانات ثابتة)
export const EXTRA_PROMPTS = [
  {
    title: 'غلاف مقال — الشركات والأعمال', ratio: '16:9', size: '1600×900',
    subject: 'Overhead flat-lay on a travertine desk: a company incorporation folder in deep green leather, a brass fountain pen, a stamped ivory document with unreadable text, a small potted olive branch. Balanced editorial composition.',
    logo: { use: 'mark', place: 'as gold-foil debossing centered on the deep-green leather folder' },
  },
  {
    title: 'غلاف مقال — التقاضي والتنفيذ', ratio: '16:9', size: '1600×900',
    subject: 'Detail of a lawyer\'s hands in a white thobe sleeve organizing case files with colored tabs on a walnut table, a leather briefcase beside them, warm morning light through tall windows.',
    logo: { use: 'mark', place: 'as a small polished-brass emblem plate on the leather briefcase' },
  },
  {
    title: 'غلاف مقال — التوثيق والعقود', ratio: '16:9', size: '1600×900',
    subject: 'Close-up of two hands exchanging a signed ivory agreement across a walnut table, one in a white thobe sleeve, one in a navy suit sleeve, a brass pen resting between them, shallow depth of field.',
    logo: { use: 'mark', place: 'as a small gold letterhead emblem printed at the top of the agreement' },
  },
];
