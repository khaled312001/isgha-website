# برومبتات صور موقع إصغاء — دمج الشعار

تنفيذًا لطلب العميل (البند ٤ في ملف المقترحات): تطوير صور الموقع لتعكس هوية إصغاء، بدمج الشعار في الصور بشكل احترافي ومتناسق — على الملفات الجلدية والأوراق والجدران — لا كعلامة مائية ملصقة.

- **١٤ صورة** يُضاف لها الشعار، و**٣ صور** تبقى بلا شعار عمدًا (السبب مذكور عند كل منها).
- لكل صورة برومبتان لـ ChatGPT: **(١) إضافة الشعار إلى الصورة الحالية** — الأفضل لأنها تحافظ على الصور المعتمدة، و**(٢) توليد صورة جديدة بالشعار** — عند الرغبة في تغيير الصورة كلها.
- البرومبتات نفسها موجودة في **لوحة التحكم ← صور الموقع** مع زر نسخ لكل خانة.

## ملفات الشعار للرفع

| الملف | المحتوى | متى يُستخدم |
|---|---|---|
| `docs/brand/isgha-mark-gold.png` | الرمز الذهبي فقط | الأماكن الصغيرة: ملفات جلدية، حقائب، أختام، أوراق. **الأكثر أمانًا** لأنه بلا حروف |
| `docs/brand/isgha-logo-wordmark.png` | الرمز + كلمة «إصغاء» | الأسطح الكبيرة المسطحة: لوحة جدارية، شاشة عرض |
| `docs/brand/isgha-logo.png` | الشعار الكامل مع سطري التعريف | للطباعة والمطبوعات فقط — لا يُنصح به في الصور لأن السطور الصغيرة تتشوه |
| `docs/brand/isgha-logo-white.png` | الشعار الكامل أبيض | للخلفيات الداكنة في التصاميم |

## الطريقة في ChatGPT

### (١) إضافة الشعار إلى الصورة الحالية — موصى بها

1. افتح **محادثة جديدة لكل صورة** (حتى لا تختلط الصور ببعضها).
2. ارفع **الصورة الحالية أولًا** من مجلد `public/img/site/` (اسم الملف مذكور عند كل صورة)، ثم ارفع **ملف الشعار** المذكور عندها.
3. الصق «برومبت إضافة الشعار» وأرسل.

### (٢) توليد صورة جديدة بالشعار

1. محادثة جديدة، ارفع **ملف الشعار فقط**.
2. الصق «برومبت صورة جديدة» وأرسل.

### قبل اعتماد أي صورة

- **كبّر الصورة على الشعار:** يجب أن يطابق الأصل تمامًا. إن تشوّه، أرسل في نفس المحادثة:

```text
The logo is distorted. Replace it with an exact copy of the attached logo (same shapes and proportions), keeping its placement, material and lighting. Change nothing else.
```

- **الوجوه والملابس:** في التعديل قد يغيّر ChatGPT الوجوه قليلًا. إن حدث أرسل: `Keep every face, the ghutra/shemagh and the agal exactly identical to the original image.`
- **الشعار ظاهر أكثر من اللازم:** أرسل: `Make the logo smaller and subtler, as a refined detail.`
- **المقاس:** ChatGPT يعطي ثلاثة مقاسات فقط (مربع، طولي 2:3، عرضي 3:2). لا مشكلة: الموقع يقص الصورة تلقائيًا حول نقطة تركيزها. المقاس الأقرب مذكور عند كل صورة.
- **الحفظ والرفع:** صدّر الصورة بصيغة **WebP** (جودة 80–85٪، ويفضّل أقل من 400 كيلوبايت)، ثم ارفعها في خانتها من **لوحة التحكم ← صور الموقع** فتظهر فورًا، وزر «استعادة الأساسية» يرجع الصورة القديمة عند الحاجة.

## ملخص الصور

| # | الصورة | الملف الحالي | الشعار | مكان الشعار |
|---|---|---|---|---|
| ١ | الترويسة الرئيسية | `isgha-home-hero.webp` | الرمز الذهبي فقط | الرمز الذهبي مطبوع بورق الذهب على غلاف الملف الجلدي الأخضر الذي يحمله |
| ٢ | من نحن (الرئيسية) | `isgha-home-about.webp` | الرمز الذهبي فقط | الرمز الذهبي كترويسة صغيرة أعلى الورقة الموضوعة على الطاولة |
| ٣ | مكتب الشركة | `isgha-about-office.webp` | الرمز + كلمة «إصغاء» | الشعار كلوحة نحاسية بارزة مثبتة على الجدار الحجري للمكتب بإضاءة دافئة |
| ٤ | فريق العمل | `isgha-about-team.webp` | الرمز الذهبي فقط | الرمز الذهبي على الملف الجلدي الأخضر في مقدمة الطاولة |
| ٥ | الخدمات القضائية | `isgha-service-judicial.webp` | الرمز الذهبي فقط | الرمز كقطعة نحاسية صغيرة على الحقيبة الجلدية التي يحملها |
| ٦ | الخدمات القانونية | `isgha-service-legal.webp` | الرمز الذهبي فقط | الرمز الذهبي في زاوية الملف الجلدي الأخضر تحت ورقة التوقيع |
| ٧ | خدمات التوثيق العدلي | `isgha-service-notary.webp` | الرمز الذهبي فقط | ختم بارز برمز إصغاء على الوثيقة بجانب الختم النحاسي + الرمز الذهبي على الملف الأخضر |
| ٨ | الخدمات المتخصصة | `isgha-service-specialized.webp` | الرمز + كلمة «إصغاء» | الشعار صغيرًا في زاوية الشريحة المعروضة على الشاشة |
| ٩ | الباقات القانونية | `isgha-packages-hero.webp` | الرمز الذهبي فقط | الرمز الذهبي على غلاف الملف الجلدي الأخضر الذي يراجعانه |
| ١٠ | المستفيدون — الأجهزة الحكومية | `isgha-ben-government.webp` | — | بلا شعار: صورة لمبنى حكومي الطابع؛ وضع شعار الشركة عليه قد يوحي بصفة رسمية غير صحيحة. |
| ١١ | المستفيدون — الشركات | `isgha-ben-companies.webp` | — | بلا شعار: منظر عام لأفق المركز المالي؛ أي شعار فيه سيبدو ملصقًا وغير طبيعي. |
| ١٢ | المستفيدون — الجمعيات | `isgha-ben-nonprofit.webp` | الرمز الذهبي فقط | الرمز الذهبي على الملفات الجلدية الخضراء فوق الطاولة |
| ١٣ | المستفيدون — رجال الأعمال | `isgha-ben-individuals.webp` | الرمز الذهبي فقط | الرمز الذهبي على صندوق الوثائق الجلدي الأخضر فوق المكتب |
| ١٤ | صفحة التواصل | `isgha-contact-office.webp` | الرمز + كلمة «إصغاء» | الشعار كلوحة نحاسية كبيرة بارزة على الجدار الأخضر خلف مكتب الاستقبال بإضاءة خلفية دافئة |
| ١٥ | صفحة الاستشارة / الهبوط | `isgha-consultation-call.webp` | الرمز الذهبي فقط | الرمز الذهبي على العلبة الجلدية الخضراء في مقدمة المكتب |
| ١٦ | شريط رؤية ٢٠٣٠ | `isgha-vision-skyline.webp` | — | بلا شعار: يُكتب فوقها نص في الموقع، والشعار سيزاحم النص. |
| ١٧ | غلاف المقالات الافتراضي | `isgha-insights-cover.webp` | الرمز الذهبي فقط | الرمز الذهبي على غلاف الكتاب الجلدي الأخضر أسفل المجموعة |

---

## ١. الترويسة الرئيسية

- **مكان الظهور:** الصفحة الرئيسية — بجانب العنوان الرئيسي
- **المقاس النهائي:** 1200×1500 بكسل (4:5) · **أقرب مقاس في ChatGPT:** 2:3 portrait
- **الصورة الحالية:** `public/img/site/isgha-home-hero.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي مطبوع بورق الذهب على غلاف الملف الجلدي الأخضر الذي يحمله

**المشهد:** محامٍ سعودي في الأربعينات بالثوب الأبيض والغترة والعقال، يقف بجانب نافذة مقوّسة في مكتب راقٍ بالرياض، يمسك ملفًا جلديًا أخضر داكنًا، بنظرة هادئة منصتة — تجسيد لاسم «إصغاء».

**ملاحظات القص والتكوين:** تُعرض داخل قوس علوي (Arch) — اجعل الرأس في الثلث العلوي الأوسط مع مسافة فارغة فوقه، ولا تضع عناصر مهمة في الزوايا العلوية.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as subtle gold-foil debossing centered on the front cover of the dark-green leather folder he holds at his side. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Portrait of a distinguished Saudi lawyer in his early forties standing beside a tall arched window in a refined Riyadh law office. He wears an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head. He holds a slim deep-green leather document folder at his side and has a calm, attentive expression, looking slightly off-camera as if listening carefully to someone. Behind him: warm travertine walls, walnut bookshelves with leather-bound legal volumes softly out of focus, the edge of a deep forest-green velvet armchair. Soft late-morning daylight from the window gently shaping his face. Vertical composition, subject centered with clear headroom above. The attached logo appears as subtle gold-foil debossing centered on the front cover of the dark-green leather folder he holds at his side. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 2:3 portrait. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

**بديل:** لمظهر أكثر فخامة (لشريك أول): أضف «a fine charcoal bisht with a slim gold trim draped over his shoulders».

---

## ٢. من نحن (الرئيسية)

- **مكان الظهور:** الرئيسية + من نحن + الباقات — بجانب النبذة
- **المقاس النهائي:** 1600×1200 بكسل (4:3) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-home-about.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي كترويسة صغيرة أعلى الورقة الموضوعة على الطاولة

**المشهد:** جلسة استشارة هادئة: محامٍ بالشماغ الأحمر ينصت باهتمام لعميل (من الخلف)، وزميل ببدلة كحلية يدوّن ملاحظات، على الطاولة عقد وفناجين قهوة عربية ودلة نحاسية.

**ملاحظات القص والتكوين:** تُعرض بزوايا دائرية مع شارة صغيرة في أسفل الصورة — اترك أسفل الصورة هادئًا نسبيًا.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as a small gold letterhead emblem printed at the top center of the white document lying on the table. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: A calm legal consultation in the private meeting room of a Saudi law firm. A Saudi lawyer wearing an immaculate white thobe, a red-and-white checked shemagh neatly folded and secured with a black agal sitting level on the head leans slightly forward, listening intently to a client seated across a solid walnut table (the client seen from behind over the shoulder, softly out of focus). A second Saudi lawyer in a tailored navy suit writes notes in a leather notebook. On the table: a printed agreement with unreadable text, a brass fountain pen, two small Arabic coffee cups (finjan) and a polished brass dallah. Tall window with sheer linen curtains, warm afternoon light, a deep forest-green accent wall. The attached logo appears as a small gold letterhead emblem printed at the top center of the white document lying on the table. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ٣. مكتب الشركة

- **مكان الظهور:** صفحة من نحن — الترويسة
- **المقاس النهائي:** 1920×1080 بكسل (16:9) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-about-office.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-logo-wordmark.png` (الرمز + كلمة «إصغاء»)
- **مكان الشعار:** الشعار كلوحة نحاسية بارزة مثبتة على الجدار الحجري للمكتب بإضاءة دافئة

**المشهد:** داخلية مكتب محاماة سعودي فاخر بدون أشخاص: أرضية ترافرتين، جدران جصية عاجية، رفوف جوز بكتب قانونية جلدية، كراسي مخملية خضراء داكنة، ستارة خشبية بنقوش نجدية ترمي ظلالًا هندسية، وشجرة زيتون.

**ملاحظات القص والتكوين:** تظهر داخل قوس ناعم في الترويسة — اجعل مركز الثقل في وسط الصورة.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as an elegant brushed-brass dimensional wall sign mounted on the plain travertine wall area, softly lit by a warm hidden light. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Architectural interior of an elegant Saudi law firm office in Riyadh, with no people. Travertine floor, warm ivory lime-plaster walls, a full wall of walnut shelving with leather-bound law books, two deep forest-green velvet armchairs around a low brass-and-marble table, a carved wooden geometric screen inspired by traditional Najdi and mashrabiya patterns casting soft patterned shadows across the floor, an olive tree in a carved stone planter, and a tall window with soft daylight. Straight verticals, calm near-symmetrical composition. The attached logo appears as an elegant brushed-brass dimensional wall sign mounted on the plain travertine wall area, softly lit by a warm hidden light. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ٤. فريق العمل

- **مكان الظهور:** صفحة من نحن — قسم «لماذا إصغاء»
- **المقاس النهائي:** 1800×1200 بكسل (3:2) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-about-team.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي على الملف الجلدي الأخضر في مقدمة الطاولة

**المشهد:** أربعة محامين سعوديين (اثنان بالثوب والغترة، واثنان ببدلات) يراجعون عقدًا في غرفة اجتماعات زجاجية، وخلفهم أبراج مركز الملك عبدالله المالي.

**ملاحظات القص والتكوين:** صورة توضيحية للأجواء — لا تُقدَّم على أنها صورة الفريق الحقيقي. لصور الفريق الحقيقية استخدم قسم «فريق العمل».

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as gold-foil debossing on the dark-green leather folder lying on the table in the foreground. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Four Saudi legal professionals in a glass-walled meeting room reviewing a contract together: two wear an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head, two wear tailored charcoal and navy suits. One points at a clause on the printed page while the others listen thoughtfully; natural, candid interaction, nobody looking at the camera. Through the glass, the towers of King Abdullah Financial District in soft afternoon haze. Walnut table, leather folders, a brushed-brass desk lamp. The attached logo appears as gold-foil debossing on the dark-green leather folder lying on the table in the foreground. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ٥. الخدمات القضائية

- **مكان الظهور:** صفحة الخدمات القضائية + صفحات خدماتها
- **المقاس النهائي:** 1600×1200 بكسل (4:3) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-service-judicial.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز كقطعة نحاسية صغيرة على الحقيبة الجلدية التي يحملها

**المشهد:** محامٍ بالثوب والغترة يصعد درجات حجرية واسعة لمبنى حكومي حديث بطراز نجدي وأعمدة شاهقة، يحمل ملفات القضايا وحقيبة جلدية، في ضوء الصباح الذهبي.

**ملاحظات القص والتكوين:** بدون أي لوحات أو شعارات على المبنى. تظهر داخل قوس ناعم في ترويسة الصفحة.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as a small polished-brass emblem plate on the front flap of the dark leather briefcase he carries. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: A Saudi lawyer wearing an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head walking up wide pale limestone steps of a monumental modern civic building in Riyadh with tall rhythmic columns and Najdi-inspired triangular openings, carrying a slim stack of case files and a dark leather briefcase. Early-morning golden light, long elegant shadows, low-angle view, a strong sense of purpose and dignity. No signage, no emblems. The attached logo appears as a small polished-brass emblem plate on the front flap of the dark leather briefcase he carries. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ٦. الخدمات القانونية

- **مكان الظهور:** صفحة الخدمات القانونية
- **المقاس النهائي:** 1600×1200 بكسل (4:3) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-service-legal.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي في زاوية الملف الجلدي الأخضر تحت ورقة التوقيع

**المشهد:** لقطة قريبة أنيقة لتوقيع عقد بقلم حبر أسود وذهبي، كمّ ثوب أبيض بزر فضي، ورق عاجي، ومسند مكتب جلدي أخضر، وإضاءة جانبية ناعمة.

**ملاحظات القص والتكوين:** لقطة تفاصيل (Close-up) — اجعل يد التوقيع في الثلث الأيمن أو الأيسر لا في المنتصف تمامًا.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as gold-foil debossing in the lower corner of the dark-green leather folder holding the paper being signed. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Elegant close-up of a contract being signed: a hand emerging from a crisp white thobe sleeve with a silver cufflink signs with a black-and-gold fountain pen on heavy ivory paper with unreadable text. Beside it: a deep-green leather desk pad, a brass paperweight and a walnut document box. Soft directional side light, very shallow depth of field, rich textures of paper and leather. The attached logo appears as gold-foil debossing in the lower corner of the dark-green leather folder holding the paper being signed. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ٧. خدمات التوثيق العدلي

- **مكان الظهور:** صفحة التوثيق العدلي
- **المقاس النهائي:** 1600×1200 بكسل (4:3) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-service-notary.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** ختم بارز برمز إصغاء على الوثيقة بجانب الختم النحاسي + الرمز الذهبي على الملف الأخضر

**المشهد:** لحظة توثيق دقيقة: يد تضغط ختمًا بارزًا (بنقش هندسي بلا كتابة) على وثيقة عاجية، وملفات مرتبة بشريط أخضر داكن، ومصباح نحاسي على مكتب ترافرتين.

**ملاحظات القص والتكوين:** تجنّب أي شعار رسمي أو كتابة على الختم — نقش هندسي مجرد فقط.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as a crisp blind-embossed seal impression on the ivory document right beside the brass stamp (the emblem only, no text), and as a small gold-foil emblem on the top dark-green folder of the stack. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: A precise notarization moment: a Saudi notary's hand, white thobe sleeve visible, pressing a brass embossing seal with an abstract geometric pattern (no text, no emblem) onto an ivory document. Neatly stacked folders tied with dark-green ribbon, a brushed-brass desk lamp, a travertine desk surface. Soft overhead daylight, a calm atmosphere of precision and trust. The attached logo appears as a crisp blind-embossed seal impression on the ivory document right beside the brass stamp (the emblem only, no text), and as a small gold-foil emblem on the top dark-green folder of the stack. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ٨. الخدمات المتخصصة

- **مكان الظهور:** صفحة الخدمات المتخصصة (تأسيس، هيكلة، امتثال)
- **المقاس النهائي:** 1600×1200 بكسل (4:3) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-service-specialized.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-logo-wordmark.png` (الرمز + كلمة «إصغاء»)
- **مكان الشعار:** الشعار صغيرًا في زاوية الشريحة المعروضة على الشاشة

**المشهد:** جلسة استراتيجية في قاعة مجلس إدارة: تنفيذيون سعوديون بالثياب والبدلات يتأملون مخططًا تجريديًا على شاشة كبيرة، ونوافذ ممتدة تطل على الرياض وقت الغروب.

**ملاحظات القص والتكوين:** المخطط على الشاشة أشكال تجريدية بلا أرقام أو كلمات.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as a small logo in the top corner of the presentation slide on the large screen, in its original colors on the light slide background, keeping the abstract diagram. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: A boardroom strategy session at dusk: Saudi executives — some in tailored navy suits, some wearing an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head — studying an abstract restructuring diagram of shapes and lines (no text, no numbers) on a large screen. Floor-to-ceiling windows reveal the Riyadh skyline at blue hour; warm interior lighting, a long walnut table with leather folders. The attached logo appears as a small logo in the top corner of the presentation slide on the large screen, in its original colors on the light slide background, keeping the abstract diagram. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ٩. الباقات القانونية

- **مكان الظهور:** صفحة الباقات — الترويسة
- **المقاس النهائي:** 1920×1080 بكسل (16:9) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-packages-hero.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي على غلاف الملف الجلدي الأخضر الذي يراجعانه

**المشهد:** صاحب منشأة ببدلة فحمية ومحامٍ بالشماغ الأحمر يسيران جنبًا إلى جنب في ردهة برج مكتبي حديث، يراجعان ملفًا جلديًا ويتحدثان بطبيعية.

**ملاحظات القص والتكوين:** بديل أرقى من «المصافحة» التقليدية. اترك مساحة هادئة على أحد الجانبين.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as gold-foil debossing on the cover of the dark-green leather folder the two men are reviewing. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: A Saudi business owner in a tailored charcoal suit and a Saudi lawyer wearing an immaculate white thobe, a red-and-white checked shemagh neatly folded and secured with a black agal sitting level on the head walking side by side through a bright double-height lobby of a modern Riyadh office tower, reviewing a leather folder together and talking naturally. Travertine floor, tall glass façade, indoor greenery, soft daylight. Wide composition with calm negative space on one side. The attached logo appears as gold-foil debossing on the cover of the dark-green leather folder the two men are reviewing. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ١٠. المستفيدون — الأجهزة الحكومية

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس النهائي:** 1200×1200 بكسل (1:1) · **أقرب مقاس في ChatGPT:** 1:1 square
- **الصورة الحالية:** `public/img/site/isgha-ben-government.webp`
- **بلا شعار عمدًا:** صورة لمبنى حكومي الطابع؛ وضع شعار الشركة عليه قد يوحي بصفة رسمية غير صحيحة.

**المشهد:** تفصيلة معمارية لمبنى حكومي حديث بطراز نجدي: واجهة بلون الرمل بفتحات مثلثة، وسماء صافية، بدون أشخاص أو لوحات.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة — مركز الصورة هو الأهم.

**برومبت صورة جديدة (بدون شعار):**

```text
Architectural detail of modern Saudi civic architecture inspired by Najdi heritage: a sand-colored rammed-earth façade with rhythmic triangular openings and deep shadows, crisp clear blue sky, clean geometric lines. No people, no signage, no emblems. Late-afternoon warm light. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 1:1 square. Avoid: text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig, Western courtroom, scales-of-justice statue, cartoon, illustration, 3D render, CGI, plastic skin, over-smoothed faces, extra fingers, distorted hands, crooked agal, headwear worn incorrectly, sunglasses, exaggerated smiles, stock-photo handshake, oversaturated colors, harsh flash, lens flare, cluttered background, low resolution.
```

---

## ١١. المستفيدون — الشركات

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس النهائي:** 1200×1200 بكسل (1:1) · **أقرب مقاس في ChatGPT:** 1:1 square
- **الصورة الحالية:** `public/img/site/isgha-ben-companies.webp`
- **بلا شعار عمدًا:** منظر عام لأفق المركز المالي؛ أي شعار فيه سيبدو ملصقًا وغير طبيعي.

**المشهد:** أبراج مركز الملك عبدالله المالي وقت الغسق بنوافذ مضيئة، ومهنيون سعوديون بالثياب والبدلات يعبرون الساحة بحركة خفيفة.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة.

**برومبت صورة جديدة (بدون شعار):**

```text
The towers of King Abdullah Financial District in Riyadh at blue hour, warm lit office windows against a deep blue sky; in the foreground a few Saudi professionals in white thobes and dark suits crossing the stone plaza, slightly motion-blurred. Elegant, ambitious mood. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 1:1 square. Avoid: text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig, Western courtroom, scales-of-justice statue, cartoon, illustration, 3D render, CGI, plastic skin, over-smoothed faces, extra fingers, distorted hands, crooked agal, headwear worn incorrectly, sunglasses, exaggerated smiles, stock-photo handshake, oversaturated colors, harsh flash, lens flare, cluttered background, low resolution.
```

---

## ١٢. المستفيدون — الجمعيات

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس النهائي:** 1200×1200 بكسل (1:1) · **أقرب مقاس في ChatGPT:** 1:1 square
- **الصورة الحالية:** `public/img/site/isgha-ben-nonprofit.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي على الملفات الجلدية الخضراء فوق الطاولة

**المشهد:** اجتماع مجلس جمعية خيرية في مجلس دافئ بوسائد بنقش السدو، رجال بالثياب يتناقشون حول وثائق مع القهوة العربية — إحساس بالخدمة والثقة.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as gold-foil debossing on the dark-green leather folders arranged on the low table. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: A board meeting of a Saudi non-profit association in a warm, modern majlis-style hall: several Saudi men in white thobes and ghutras seated around a low table with neatly arranged documents, Arabic coffee and dates; one gently presenting while others listen. Cushions with subtle Sadu-weave patterns in muted forest green, gold and ivory, soft daylight. Sense of service, community and trust. The attached logo appears as gold-foil debossing on the dark-green leather folders arranged on the low table. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 1:1 square. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ١٣. المستفيدون — رجال الأعمال

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس النهائي:** 1200×1200 بكسل (1:1) · **أقرب مقاس في ChatGPT:** 1:1 square
- **الصورة الحالية:** `public/img/site/isgha-ben-individuals.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي على صندوق الوثائق الجلدي الأخضر فوق المكتب

**المشهد:** رجل أعمال سعودي وقور في الخمسينات بالثوب والغترة والعقال (وبشت داكن اختياري)، في مكتبه الخاص يراجع وثائق الأوقاف والوصايا بنظارة القراءة.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة — الوجه في الثلث العلوي.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as gold-foil debossing on the front of the dark-green leather document box on his desk. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Portrait of a dignified Saudi businessman in his fifties wearing an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head and a fine dark bisht with a slim gold trim, seated at a walnut desk in his private study, reviewing estate documents with reading glasses in hand. Deep green leather chair, shelves of books, soft window light from the side. Calm, wise, trustworthy expression. The attached logo appears as gold-foil debossing on the front of the dark-green leather document box on his desk. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 1:1 square. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ١٤. صفحة التواصل

- **مكان الظهور:** صفحة اتصل بنا — الترويسة
- **المقاس النهائي:** 1920×1080 بكسل (16:9) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-contact-office.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-logo-wordmark.png` (الرمز + كلمة «إصغاء»)
- **مكان الشعار:** الشعار كلوحة نحاسية كبيرة بارزة على الجدار الأخضر خلف مكتب الاستقبال بإضاءة خلفية دافئة

**المشهد:** منطقة استقبال مكتب إصغاء: مكتب استقبال من خشب الجوز بحواف نحاسية، جدار أخضر داكن، شجرة زيتون، وموظف استقبال بالثوب يرحّب بزائر في الخلفية (غير واضح).

**ملاحظات القص والتكوين:** تظهر داخل قوس ناعم — اجعل مكتب الاستقبال قريبًا من المنتصف.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as a large, elegant brushed-brass dimensional logo sign mounted on the deep-green wall panel behind the reception desk, rendered entirely in brass for contrast, with a soft warm backlight halo. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: The welcoming reception area of a refined Saudi law firm in Riyadh: a walnut reception desk with brushed-brass trim, warm ivory walls with one deep forest-green accent wall, an olive tree in a stone planter, a pair of upholstered armchairs; in the background, slightly out of focus, a Saudi receptionist in a white thobe warmly greeting a visitor. Soft daylight, inviting atmosphere. The attached logo appears as a large, elegant brushed-brass dimensional logo sign mounted on the deep-green wall panel behind the reception desk, rendered entirely in brass for contrast, with a soft warm backlight halo. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ١٥. صفحة الاستشارة / الهبوط

- **مكان الظهور:** صفحة احجز استشارة + صفحات الهبوط
- **المقاس النهائي:** 1200×1200 بكسل (1:1) · **أقرب مقاس في ChatGPT:** 1:1 square
- **الصورة الحالية:** `public/img/site/isgha-consultation-call.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي على العلبة الجلدية الخضراء في مقدمة المكتب

**المشهد:** محامٍ بالثوب والشماغ الأحمر في مكالمة هاتفية على مكتبه، يدوّن في دفتر جلدي بتركيز وإنصات — «نُصغي إليك أولًا».

**ملاحظات القص والتكوين:** تُعرض بجانب نموذج الطلب — نظرة المحامي باتجاه الداخل (نحو النموذج) أفضل.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as gold-foil debossing on the dark-green leather desk box in the foreground. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: A Saudi lawyer wearing an immaculate white thobe, a red-and-white checked shemagh neatly folded and secured with a black agal sitting level on the head on a phone call at his walnut desk, writing notes in a leather notebook with a fountain pen, eyes lowered in focused, empathetic listening. A closed laptop, a small finjan of Arabic coffee, warm office background softly blurred, soft window light. Feeling: "we listen to you first". The attached logo appears as gold-foil debossing on the dark-green leather desk box in the foreground. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 1:1 square. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## ١٦. شريط رؤية ٢٠٣٠

- **مكان الظهور:** الرئيسية + من نحن — شريط عريض عليه نص
- **المقاس النهائي:** 2400×1030 بكسل (21:9) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-vision-skyline.webp`
- **بلا شعار عمدًا:** يُكتب فوقها نص في الموقع، والشعار سيزاحم النص.

**المشهد:** بانوراما لأفق الرياض وقت الغسق: برج المملكة وأبراج المركز المالي، سماء كهرمانية تتدرج إلى الأزرق العميق، وأضواء المدينة تبدأ بالتوهج.

**ملاحظات القص والتكوين:** يوضع فوقها نص في الأسفل جهة اليمين مع تدرّج داكن — اجعل الثلث السفلي هادئًا وأقل تفاصيل.

**برومبت صورة جديدة (بدون شعار):**

```text
Ultra-wide panoramic view of the Riyadh skyline at dusk featuring Kingdom Centre and the King Abdullah Financial District towers, warm amber sky gradually fading into deep blue, city lights starting to glow. The lower third is calm and darker with fewer details. Aspirational, serene mood. Landscape photography. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig, Western courtroom, scales-of-justice statue, cartoon, illustration, 3D render, CGI, plastic skin, over-smoothed faces, extra fingers, distorted hands, crooked agal, headwear worn incorrectly, sunglasses, exaggerated smiles, stock-photo handshake, oversaturated colors, harsh flash, lens flare, cluttered background, low resolution.
```

---

## ١٧. غلاف المقالات الافتراضي

- **مكان الظهور:** المعرفة القانونية — عند عدم وجود غلاف للمقال
- **المقاس النهائي:** 1600×900 بكسل (16:9) · **أقرب مقاس في ChatGPT:** 3:2 landscape
- **الصورة الحالية:** `public/img/site/isgha-insights-cover.webp`
- **ملف الشعار المرفوع:** `docs/brand/isgha-mark-gold.png` (الرمز الذهبي فقط)
- **مكان الشعار:** الرمز الذهبي على غلاف الكتاب الجلدي الأخضر أسفل المجموعة

**المشهد:** طبيعة صامتة على مكتب من الجوز: مجلدات قانونية بأغلفة خضراء وعاجية (بلا عناوين مقروءة)، ميزان نحاسي صغير، نظارة قراءة، وفنجان قهوة عربية في ضوء الصباح.

**ملاحظات القص والتكوين:** تُستخدم كغلاف بديل للمقالات — تكوين أفقي متوازن.

**(١) برومبت إضافة الشعار إلى الصورة الحالية** — ارفع الصورة الحالية ثم الشعار:

```text
Two images are attached: image 1 is the current photo from our website, image 2 is the official Isgha Law Firm logo. Edit image 1 only: add the logo from image 2 as gold-foil debossing on the cover of the dark-green leather book at the bottom of the stack. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Keep everything else in image 1 exactly as it is (people, faces, clothing, poses, objects, composition, colors, lighting and framing) and keep the same aspect ratio. Photorealistic result.
```

**(٢) برومبت صورة جديدة بالشعار** — ارفع الشعار فقط:

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Still life on a walnut desk: a stack of leather-bound law books with deep-green and ivory spines (titles unreadable), a small antique brass balance scale, reading glasses, and a finjan of Arabic coffee beside a brass dallah. Soft directional morning light, calm editorial mood, shallow depth of field. The attached logo appears as gold-foil debossing on the cover of the dark-green leather book at the bottom of the stack. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

---

## أغلفة المقالات (اختيارية)

تُرفع من صفحة تعديل المقال ← صورة الغلاف. ارفع ملف الرمز الذهبي مع كل برومبت.

### غلاف مقال — الشركات والأعمال (1600×900 · 16:9)

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Overhead flat-lay on a travertine desk: a company incorporation folder in deep green leather, a brass fountain pen, a stamped ivory document with unreadable text, a small potted olive branch. Balanced editorial composition. The attached logo appears as gold-foil debossing centered on the deep-green leather folder. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

### غلاف مقال — التقاضي والتنفيذ (1600×900 · 16:9)

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Detail of a lawyer's hands in a white thobe sleeve organizing case files with colored tabs on a walnut table, a leather briefcase beside them, warm morning light through tall windows. The attached logo appears as a small polished-brass emblem plate on the leather briefcase. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

### غلاف مقال — التوثيق والعقود (1600×900 · 16:9)

```text
The attached image is the official logo of Isgha Law Firm. Create a new photograph: Close-up of two hands exchanging a signed ivory agreement across a walnut table, one in a white thobe sleeve, one in a navy suit sleeve, a brass pen resting between them, shallow depth of field. The attached logo appears as a small gold letterhead emblem printed at the top of the agreement. Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic. Aspect ratio 3:2 landscape. Avoid: any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background.
```

## مرجع: الأسلوب الموحّد

مضاف تلقائيًا داخل كل برومبت أعلاه — بألوان هوية إصغاء: الأخضر `#215d41`، الذهبي `#d8af4d`، البيج `#f6f5e9`.

```text
Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, soft beige (#f6f5e9), travertine, deep forest green (#215d41) and charcoal, with muted-gold (#d8af4d) and brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

## مرجع: قواعد الشعار

```text
Reproduce the logo faithfully: identical shapes, proportions and Arabic letterforms; do not redraw, simplify, mirror, distort or add any other text. It may be rendered in a single material color (gold foil, brushed brass or blind embossing) to suit the surface. Integrate it as a real physical element with correct perspective, curvature, lighting, shadows and material texture, so it looks photographed in place, not pasted on. Keep it subtle and refined: a secondary detail, never the focal point.
```

## مرجع: البرومبت السلبي

للبرومبتات التي فيها الشعار:

```text
any text or lettering other than the provided logo, other brands' logos, watermarks, flags, national emblems, government seals, gavel, judge wig, Western courtroom, cartoon, illustration, 3D render look, plastic skin, extra fingers, distorted hands, crooked agal, oversaturated colors, harsh flash, cluttered background
```

للصور بدون شعار (ويصلح مع Midjourney بعد `--no`):

```text
text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig, Western courtroom, scales-of-justice statue, cartoon, illustration, 3D render, CGI, plastic skin, over-smoothed faces, extra fingers, distorted hands, crooked agal, headwear worn incorrectly, sunglasses, exaggerated smiles, stock-photo handshake, oversaturated colors, harsh flash, lens flare, cluttered background, low resolution
```

## صور فريق العمل

صور أعضاء الفريق يجب أن تكون **صورًا حقيقية** لهم (لا تُولَّد بالذكاء الاصطناعي). للحصول على مظهر موحّد اطلب من المصوّر: خلفية جدار جصي عاجي، ضوء نافذة جانبي ناعم، لقطة نصفية بنسبة 4:5، الثوب والغترة والعقال أو البدلة الرسمية، وتعبير هادئ واثق.

> الصور المولّدة بالذكاء الاصطناعي توضيحية للأجواء فقط؛ لا تُقدَّم على أنها صور لموظفين أو عملاء حقيقيين.

