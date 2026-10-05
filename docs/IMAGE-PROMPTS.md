# برومبتات صور موقع إصغاء للمحاماة

دليل توليد صور الموقع بالذكاء الاصطناعي بهوية سعودية راقية تتناسق مع ألوان إصغاء. لكل صورة: مكان ظهورها، المقاس، وصف المشهد، ملاحظات القصّ، والبرومبت الكامل جاهزًا للنسخ.

> البرومبتات نفسها موجودة في **لوحة التحكم ← صور الموقع** مع زر نسخ وزر رفع لكل خانة. بعد رفع الصورة تظهر في الموقع فورًا.

## الاتجاه البصري

- **الإحساس:** فخامة هادئة (Quiet luxury) بأسلوب مجلات الأعمال الراقية؛ لقطات طبيعية غير متكلفة، بلا ابتسامات مصطنعة ولا مصافحات تقليدية.
- **الألوان:** عاجي دافئ، بيج الترافرتين، أخضر تركوازي عميق، فحمي، ولمسات نحاس مطفأ — نفس ألوان الشعار والموقع.
- **المواد:** حجر الترافرتين، خشب الجوز، الجلد الأخضر الداكن، المخمل التركوازي، النحاس، الكتان.
- **الهوية السعودية:** الثوب الأبيض بياقة مرتبة، الغترة البيضاء أو الشماغ الأحمر بعقال أسود مستوٍ، البشت للشخصيات الكبيرة، البدلات الرسمية الكحلية والفحمية، العمارة النجدية والفتحات المثلثة، النقوش الهندسية الخشبية، الدلة والفنجان، نقش السدو بلمسة خفيفة، أفق الرياض والمركز المالي.
- **الضوء:** ضوء نهار طبيعي ناعم من النوافذ، ظلال هادئة منخفضة التباين، وضوء ذهبي للمشاهد الخارجية.

### تجنّب دائمًا

- أي كتابة أو شعارات أو أعلام أو شعارات حكومية (لتجنب أي إشكال نظامي).
- المطرقة القضائية وباروكة القاضي وقاعات المحاكم الغربية — غير مستخدمة في المحاكم السعودية.
- الغترة أو العقال بشكل خاطئ أو مائل — راجع هذا التفصيل في كل صورة قبل اعتمادها.
- الأيدي المشوهة أو الأصابع الزائدة — كبّر الصورة وافحص الأيدي جيدًا.

## طريقة الاستخدام

1. انسخ البرومبت الكامل للصورة (يتضمن الأسلوب الموحّد في نهايته).
2. **Midjourney:** الصق البرومبت ثم أضف الإعدادات المكتوبة تحته (مثل `--ar 4:5 --style raw`) والبرومبت السلبي بعد `--no`.
3. **Gemini / Imagen / ChatGPT / Firefly:** الصق البرومبت كما هو واكتب في النهاية: «نسبة الصورة 4:5» حسب الخانة، وأضف: «Avoid: …» مع البرومبت السلبي.
4. **ثبات الشخصية:** ولّد صورة «الترويسة الرئيسية» أولًا، ثم استخدمها مرجعًا للشخصية في صورة «الاستشارة» (في Midjourney: `--cref رابط_الصورة`، وفي Gemini: ارفع الصورة واطلب «نفس الشخص»).
5. صدّر الصورة بصيغة **WebP** بجودة 80–85٪ وبالمقاس المذكور (يفضّل أقل من 400 كيلوبايت)، ثم ارفعها في خانتها من لوحة التحكم.

## الأسلوب الموحّد (مضاف تلقائيًا لكل برومبت)

```text
Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

## البرومبت السلبي (Negative prompt)

```text
text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig, Western courtroom, scales-of-justice statue, cartoon, illustration, 3D render, CGI, plastic skin, over-smoothed faces, extra fingers, distorted hands, crooked agal, headwear worn incorrectly, sunglasses, exaggerated smiles, stock-photo handshake, oversaturated colors, harsh flash, lens flare, cluttered background, low resolution
```

## ملخص الصور المطلوبة

| # | الصورة | مكان الظهور | المقاس | النسبة |
|---|---|---|---|---|
| ١ | الترويسة الرئيسية | الصفحة الرئيسية — بجانب العنوان الرئيسي | 1200×1500 | 4:5 |
| ٢ | من نحن (الرئيسية) | الرئيسية + من نحن + الباقات — بجانب النبذة | 1600×1200 | 4:3 |
| ٣ | مكتب الشركة | صفحة من نحن — الترويسة | 1920×1080 | 16:9 |
| ٤ | فريق العمل | صفحة من نحن — قسم «لماذا إصغاء» | 1800×1200 | 3:2 |
| ٥ | الخدمات القضائية | صفحة الخدمات القضائية + صفحات خدماتها | 1600×1200 | 4:3 |
| ٦ | الخدمات القانونية | صفحة الخدمات القانونية | 1600×1200 | 4:3 |
| ٧ | خدمات التوثيق العدلي | صفحة التوثيق العدلي | 1600×1200 | 4:3 |
| ٨ | الخدمات المتخصصة | صفحة الخدمات المتخصصة (تأسيس، هيكلة، امتثال) | 1600×1200 | 4:3 |
| ٩ | الباقات القانونية | صفحة الباقات — الترويسة | 1920×1080 | 16:9 |
| ١٠ | المستفيدون — الأجهزة الحكومية | صفحة المستفيدين + الرئيسية | 1200×1200 | 1:1 |
| ١١ | المستفيدون — الشركات | صفحة المستفيدين + الرئيسية | 1200×1200 | 1:1 |
| ١٢ | المستفيدون — الجمعيات | صفحة المستفيدين + الرئيسية | 1200×1200 | 1:1 |
| ١٣ | المستفيدون — رجال الأعمال | صفحة المستفيدين + الرئيسية | 1200×1200 | 1:1 |
| ١٤ | صفحة التواصل | صفحة اتصل بنا — الترويسة | 1920×1080 | 16:9 |
| ١٥ | صفحة الاستشارة / الهبوط | صفحة احجز استشارة + صفحات الهبوط | 1200×1200 | 1:1 |
| ١٦ | شريط رؤية ٢٠٣٠ | الرئيسية + من نحن — شريط عريض عليه نص | 2400×1030 | 21:9 |
| ١٧ | غلاف المقالات الافتراضي | المعرفة القانونية — عند عدم وجود غلاف للمقال | 1600×900 | 16:9 |

---

## ١. الترويسة الرئيسية

- **مكان الظهور:** الصفحة الرئيسية — بجانب العنوان الرئيسي
- **المقاس:** 1200×1500 بكسل · **النسبة:** 4:5
- **اسم الملف المقترح:** `isgha-home-hero.webp`
- **النص البديل (Alt):** محامٍ سعودي من فريق إصغاء للمحاماة في مكتب الشركة بالرياض

**المشهد:** محامٍ سعودي في الأربعينات بالثوب الأبيض والغترة والعقال، يقف بجانب نافذة مقوّسة في مكتب راقٍ بالرياض، يمسك ملفًا جلديًا أخضر داكنًا، بنظرة هادئة منصتة — تجسيد لاسم «إصغاء».

**ملاحظات القص والتكوين:** تُعرض داخل قوس علوي (Arch) — اجعل الرأس في الثلث العلوي الأوسط مع مسافة فارغة فوقه، ولا تضع عناصر مهمة في الزوايا العلوية.

**البرومبت:**

```text
Portrait of a distinguished Saudi lawyer in his early forties standing beside a tall arched window in a refined Riyadh law office. He wears an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head. He holds a slim deep-green leather document folder at his side and has a calm, attentive expression, looking slightly off-camera as if listening carefully to someone. Behind him: warm travertine walls, walnut bookshelves with leather-bound legal volumes softly out of focus, the edge of a deep teal velvet armchair. Soft late-morning daylight from the window gently shaping his face. Vertical composition, subject centered with clear headroom above. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 4:5 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

**بديل:** لمظهر أكثر فخامة (لشريك أول): أضف «a fine charcoal bisht with a slim gold trim draped over his shoulders».

---

## ٢. من نحن (الرئيسية)

- **مكان الظهور:** الرئيسية + من نحن + الباقات — بجانب النبذة
- **المقاس:** 1600×1200 بكسل · **النسبة:** 4:3
- **اسم الملف المقترح:** `isgha-home-about.webp`
- **النص البديل (Alt):** محامو إصغاء خلال جلسة استشارة قانونية مع أحد العملاء

**المشهد:** جلسة استشارة هادئة: محامٍ بالشماغ الأحمر ينصت باهتمام لعميل (من الخلف)، وزميل ببدلة كحلية يدوّن ملاحظات، على الطاولة عقد وفناجين قهوة عربية ودلة نحاسية.

**ملاحظات القص والتكوين:** تُعرض بزوايا دائرية مع شارة صغيرة في أسفل الصورة — اترك أسفل الصورة هادئًا نسبيًا.

**البرومبت:**

```text
A calm legal consultation in the private meeting room of a Saudi law firm. A Saudi lawyer wearing an immaculate white thobe, a red-and-white checked shemagh neatly folded and secured with a black agal sitting level on the head leans slightly forward, listening intently to a client seated across a solid walnut table (the client seen from behind over the shoulder, softly out of focus). A second Saudi lawyer in a tailored navy suit writes notes in a leather notebook. On the table: a printed agreement with unreadable text, a brass fountain pen, two small Arabic coffee cups (finjan) and a polished brass dallah. Tall window with sheer linen curtains, warm afternoon light, a deep teal accent wall. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 4:3 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ٣. مكتب الشركة

- **مكان الظهور:** صفحة من نحن — الترويسة
- **المقاس:** 1920×1080 بكسل · **النسبة:** 16:9
- **اسم الملف المقترح:** `isgha-about-office.webp`
- **النص البديل (Alt):** مكتب شركة إصغاء للمحاماة والاستشارات القانونية في الرياض

**المشهد:** داخلية مكتب محاماة سعودي فاخر بدون أشخاص: أرضية ترافرتين، جدران جصية عاجية، رفوف جوز بكتب قانونية جلدية، كراسي مخملية تركوازية، ستارة خشبية بنقوش نجدية ترمي ظلالًا هندسية، وشجرة زيتون.

**ملاحظات القص والتكوين:** تظهر داخل قوس ناعم في الترويسة — اجعل مركز الثقل في وسط الصورة.

**البرومبت:**

```text
Architectural interior of an elegant Saudi law firm office in Riyadh, with no people. Travertine floor, warm ivory lime-plaster walls, a full wall of walnut shelving with leather-bound law books, two deep teal velvet armchairs around a low brass-and-marble table, a carved wooden geometric screen inspired by traditional Najdi and mashrabiya patterns casting soft patterned shadows across the floor, an olive tree in a carved stone planter, and a tall window with soft daylight. Straight verticals, calm near-symmetrical composition. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 16:9 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ٤. فريق العمل

- **مكان الظهور:** صفحة من نحن — قسم «لماذا إصغاء»
- **المقاس:** 1800×1200 بكسل · **النسبة:** 3:2
- **اسم الملف المقترح:** `isgha-about-team.webp`
- **النص البديل (Alt):** محامون سعوديون يراجعون عقدًا في قاعة اجتماعات

**المشهد:** أربعة محامين سعوديين (اثنان بالثوب والغترة، واثنان ببدلات) يراجعون عقدًا في غرفة اجتماعات زجاجية، وخلفهم أبراج مركز الملك عبدالله المالي.

**ملاحظات القص والتكوين:** صورة توضيحية للأجواء — لا تُقدَّم على أنها صورة الفريق الحقيقي. لصور الفريق الحقيقية استخدم قسم «فريق العمل».

**البرومبت:**

```text
Four Saudi legal professionals in a glass-walled meeting room reviewing a contract together: two wear an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head, two wear tailored charcoal and navy suits. One points at a clause on the printed page while the others listen thoughtfully; natural, candid interaction, nobody looking at the camera. Through the glass, the towers of King Abdullah Financial District in soft afternoon haze. Walnut table, leather folders, a brushed-brass desk lamp. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 3:2 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ٥. الخدمات القضائية

- **مكان الظهور:** صفحة الخدمات القضائية + صفحات خدماتها
- **المقاس:** 1600×1200 بكسل · **النسبة:** 4:3
- **اسم الملف المقترح:** `isgha-service-judicial.webp`
- **النص البديل (Alt):** محامٍ سعودي في طريقه إلى جلسة قضائية

**المشهد:** محامٍ بالثوب والغترة يصعد درجات حجرية واسعة لمبنى حكومي حديث بطراز نجدي وأعمدة شاهقة، يحمل ملفات القضايا وحقيبة جلدية، في ضوء الصباح الذهبي.

**ملاحظات القص والتكوين:** بدون أي لوحات أو شعارات على المبنى. تظهر داخل قوس ناعم في ترويسة الصفحة.

**البرومبت:**

```text
A Saudi lawyer wearing an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head walking up wide pale limestone steps of a monumental modern civic building in Riyadh with tall rhythmic columns and Najdi-inspired triangular openings, carrying a slim stack of case files and a dark leather briefcase. Early-morning golden light, long elegant shadows, low-angle view, a strong sense of purpose and dignity. No signage, no emblems. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 4:3 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ٦. الخدمات القانونية

- **مكان الظهور:** صفحة الخدمات القانونية
- **المقاس:** 1600×1200 بكسل · **النسبة:** 4:3
- **اسم الملف المقترح:** `isgha-service-legal.webp`
- **النص البديل (Alt):** توقيع عقد قانوني بعد صياغته ومراجعته

**المشهد:** لقطة قريبة أنيقة لتوقيع عقد بقلم حبر أسود وذهبي، كمّ ثوب أبيض بزر فضي، ورق عاجي، ومسند مكتب جلدي أخضر، وإضاءة جانبية ناعمة.

**ملاحظات القص والتكوين:** لقطة تفاصيل (Close-up) — اجعل يد التوقيع في الثلث الأيمن أو الأيسر لا في المنتصف تمامًا.

**البرومبت:**

```text
Elegant close-up of a contract being signed: a hand emerging from a crisp white thobe sleeve with a silver cufflink signs with a black-and-gold fountain pen on heavy ivory paper with unreadable text. Beside it: a deep-green leather desk pad, a brass paperweight and a walnut document box. Soft directional side light, very shallow depth of field, rich textures of paper and leather. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 4:3 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ٧. خدمات التوثيق العدلي

- **مكان الظهور:** صفحة التوثيق العدلي
- **المقاس:** 1600×1200 بكسل · **النسبة:** 4:3
- **اسم الملف المقترح:** `isgha-service-notary.webp`
- **النص البديل (Alt):** توثيق عدلي للعقود والوكالات في إصغاء

**المشهد:** لحظة توثيق دقيقة: يد تضغط ختمًا بارزًا (بنقش هندسي بلا كتابة) على وثيقة عاجية، وملفات مرتبة بشريط أخضر داكن، ومصباح نحاسي على مكتب ترافرتين.

**ملاحظات القص والتكوين:** تجنّب أي شعار رسمي أو كتابة على الختم — نقش هندسي مجرد فقط.

**البرومبت:**

```text
A precise notarization moment: a Saudi notary's hand, white thobe sleeve visible, pressing a brass embossing seal with an abstract geometric pattern (no text, no emblem) onto an ivory document. Neatly stacked folders tied with dark-green ribbon, a brushed-brass desk lamp, a travertine desk surface. Soft overhead daylight, a calm atmosphere of precision and trust. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 4:3 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ٨. الخدمات المتخصصة

- **مكان الظهور:** صفحة الخدمات المتخصصة (تأسيس، هيكلة، امتثال)
- **المقاس:** 1600×1200 بكسل · **النسبة:** 4:3
- **اسم الملف المقترح:** `isgha-service-specialized.webp`
- **النص البديل (Alt):** جلسة استشارية لإعادة هيكلة منشأة

**المشهد:** جلسة استراتيجية في قاعة مجلس إدارة: تنفيذيون سعوديون بالثياب والبدلات يتأملون مخططًا تجريديًا على شاشة كبيرة، ونوافذ ممتدة تطل على الرياض وقت الغروب.

**ملاحظات القص والتكوين:** المخطط على الشاشة أشكال تجريدية بلا أرقام أو كلمات.

**البرومبت:**

```text
A boardroom strategy session at dusk: Saudi executives — some in tailored navy suits, some wearing an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head — studying an abstract restructuring diagram of shapes and lines (no text, no numbers) on a large screen. Floor-to-ceiling windows reveal the Riyadh skyline at blue hour; warm interior lighting, a long walnut table with leather folders. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 4:3 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ٩. الباقات القانونية

- **مكان الظهور:** صفحة الباقات — الترويسة
- **المقاس:** 1920×1080 بكسل · **النسبة:** 16:9
- **اسم الملف المقترح:** `isgha-packages-hero.webp`
- **النص البديل (Alt):** شراكة قانونية مستمرة بين إصغاء وعملائها من الشركات

**المشهد:** صاحب منشأة ببدلة فحمية ومحامٍ بالشماغ الأحمر يسيران جنبًا إلى جنب في ردهة برج مكتبي حديث، يراجعان ملفًا جلديًا ويتحدثان بطبيعية.

**ملاحظات القص والتكوين:** بديل أرقى من «المصافحة» التقليدية. اترك مساحة هادئة على أحد الجانبين.

**البرومبت:**

```text
A Saudi business owner in a tailored charcoal suit and a Saudi lawyer wearing an immaculate white thobe, a red-and-white checked shemagh neatly folded and secured with a black agal sitting level on the head walking side by side through a bright double-height lobby of a modern Riyadh office tower, reviewing a leather folder together and talking naturally. Travertine floor, tall glass façade, indoor greenery, soft daylight. Wide composition with calm negative space on one side. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 16:9 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١٠. المستفيدون — الأجهزة الحكومية

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس:** 1200×1200 بكسل · **النسبة:** 1:1
- **اسم الملف المقترح:** `isgha-ben-government.webp`
- **النص البديل (Alt):** خدمات قانونية للأجهزة الحكومية

**المشهد:** تفصيلة معمارية لمبنى حكومي حديث بطراز نجدي: واجهة بلون الرمل بفتحات مثلثة، وسماء صافية، بدون أشخاص أو لوحات.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة — مركز الصورة هو الأهم.

**البرومبت:**

```text
Architectural detail of modern Saudi civic architecture inspired by Najdi heritage: a sand-colored rammed-earth façade with rhythmic triangular openings and deep shadows, crisp clear blue sky, clean geometric lines. No people, no signage, no emblems. Late-afternoon warm light. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 1:1 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١١. المستفيدون — الشركات

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس:** 1200×1200 بكسل · **النسبة:** 1:1
- **اسم الملف المقترح:** `isgha-ben-companies.webp`
- **النص البديل (Alt):** خدمات قانونية للشركات والكيانات التجارية

**المشهد:** أبراج مركز الملك عبدالله المالي وقت الغسق بنوافذ مضيئة، ومهنيون سعوديون بالثياب والبدلات يعبرون الساحة بحركة خفيفة.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة.

**البرومبت:**

```text
The towers of King Abdullah Financial District in Riyadh at blue hour, warm lit office windows against a deep blue sky; in the foreground a few Saudi professionals in white thobes and dark suits crossing the stone plaza, slightly motion-blurred. Elegant, ambitious mood. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 1:1 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١٢. المستفيدون — الجمعيات

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس:** 1200×1200 بكسل · **النسبة:** 1:1
- **اسم الملف المقترح:** `isgha-ben-nonprofit.webp`
- **النص البديل (Alt):** خدمات قانونية لجمعيات النفع العام

**المشهد:** اجتماع مجلس جمعية خيرية في مجلس دافئ بوسائد بنقش السدو، رجال بالثياب يتناقشون حول وثائق مع القهوة العربية — إحساس بالخدمة والثقة.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة.

**البرومبت:**

```text
A board meeting of a Saudi non-profit association in a warm, modern majlis-style hall: several Saudi men in white thobes and ghutras seated around a low table with neatly arranged documents, Arabic coffee and dates; one gently presenting while others listen. Cushions with subtle Sadu-weave patterns in muted teal and ivory, soft daylight. Sense of service, community and trust. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 1:1 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١٣. المستفيدون — رجال الأعمال

- **مكان الظهور:** صفحة المستفيدين + الرئيسية
- **المقاس:** 1200×1200 بكسل · **النسبة:** 1:1
- **اسم الملف المقترح:** `isgha-ben-individuals.webp`
- **النص البديل (Alt):** خدمات قانونية لرجال الأعمال: الأوقاف والوصايا والثروات

**المشهد:** رجل أعمال سعودي وقور في الخمسينات بالثوب والغترة والعقال (وبشت داكن اختياري)، في مكتبه الخاص يراجع وثائق الأوقاف والوصايا بنظارة القراءة.

**ملاحظات القص والتكوين:** تُعرض كبطاقة مربعة — الوجه في الثلث العلوي.

**البرومبت:**

```text
Portrait of a dignified Saudi businessman in his fifties wearing an immaculate white thobe with a structured collar, a white ghutra neatly draped and secured with a black agal sitting level on the head and a fine dark bisht with a slim gold trim, seated at a walnut desk in his private study, reviewing estate documents with reading glasses in hand. Deep green leather chair, shelves of books, soft window light from the side. Calm, wise, trustworthy expression. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 1:1 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١٤. صفحة التواصل

- **مكان الظهور:** صفحة اتصل بنا — الترويسة
- **المقاس:** 1920×1080 بكسل · **النسبة:** 16:9
- **اسم الملف المقترح:** `isgha-contact-office.webp`
- **النص البديل (Alt):** استقبال مكتب إصغاء للمحاماة في حي الياسمين بالرياض

**المشهد:** منطقة استقبال مكتب إصغاء: مكتب استقبال من خشب الجوز بحواف نحاسية، جدار تركوازي، شجرة زيتون، وموظف استقبال بالثوب يرحّب بزائر في الخلفية (غير واضح).

**ملاحظات القص والتكوين:** تظهر داخل قوس ناعم — اجعل مكتب الاستقبال قريبًا من المنتصف.

**البرومبت:**

```text
The welcoming reception area of a refined Saudi law firm in Riyadh: a walnut reception desk with brushed-brass trim, warm ivory walls with one deep teal accent wall, an olive tree in a stone planter, a pair of upholstered armchairs; in the background, slightly out of focus, a Saudi receptionist in a white thobe warmly greeting a visitor. Soft daylight, inviting atmosphere. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 16:9 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١٥. صفحة الاستشارة / الهبوط

- **مكان الظهور:** صفحة احجز استشارة + صفحات الهبوط
- **المقاس:** 1200×1200 بكسل · **النسبة:** 1:1
- **اسم الملف المقترح:** `isgha-consultation-call.webp`
- **النص البديل (Alt):** محامٍ من إصغاء يستمع لاستفسار عميل عبر الهاتف

**المشهد:** محامٍ بالثوب والشماغ الأحمر في مكالمة هاتفية على مكتبه، يدوّن في دفتر جلدي بتركيز وإنصات — «نُصغي إليك أولًا».

**ملاحظات القص والتكوين:** تُعرض بجانب نموذج الطلب — نظرة المحامي باتجاه الداخل (نحو النموذج) أفضل.

**البرومبت:**

```text
A Saudi lawyer wearing an immaculate white thobe, a red-and-white checked shemagh neatly folded and secured with a black agal sitting level on the head on a phone call at his walnut desk, writing notes in a leather notebook with a fountain pen, eyes lowered in focused, empathetic listening. A closed laptop, a small finjan of Arabic coffee, warm office background softly blurred, soft window light. Feeling: "we listen to you first". Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 1:1 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١٦. شريط رؤية ٢٠٣٠

- **مكان الظهور:** الرئيسية + من نحن — شريط عريض عليه نص
- **المقاس:** 2400×1030 بكسل · **النسبة:** 21:9
- **اسم الملف المقترح:** `isgha-vision-skyline.webp`
- **النص البديل (Alt):** أفق مدينة الرياض وقت الغروب

**المشهد:** بانوراما لأفق الرياض وقت الغسق: برج المملكة وأبراج المركز المالي، سماء كهرمانية تتدرج إلى الأزرق العميق، وأضواء المدينة تبدأ بالتوهج.

**ملاحظات القص والتكوين:** يوضع فوقها نص في الأسفل جهة اليمين مع تدرّج داكن — اجعل الثلث السفلي هادئًا وأقل تفاصيل.

**البرومبت:**

```text
Ultra-wide panoramic view of the Riyadh skyline at dusk featuring Kingdom Centre and the King Abdullah Financial District towers, warm amber sky gradually fading into deep blue, city lights starting to glow. The lower third is calm and darker with fewer details. Aspirational, serene mood. Landscape photography. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 21:9 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## ١٧. غلاف المقالات الافتراضي

- **مكان الظهور:** المعرفة القانونية — عند عدم وجود غلاف للمقال
- **المقاس:** 1600×900 بكسل · **النسبة:** 16:9
- **اسم الملف المقترح:** `isgha-insights-cover.webp`
- **النص البديل (Alt):** المعرفة القانونية من إصغاء

**المشهد:** طبيعة صامتة على مكتب من الجوز: مجلدات قانونية بأغلفة خضراء وعاجية (بلا عناوين مقروءة)، ميزان نحاسي صغير، نظارة قراءة، وفنجان قهوة عربية في ضوء الصباح.

**ملاحظات القص والتكوين:** تُستخدم كغلاف بديل للمقالات — تكوين أفقي متوازن.

**البرومبت:**

```text
Still life on a walnut desk: a stack of leather-bound law books with deep-green and ivory spines (titles unreadable), a small antique brass balance scale, reading glasses, and a finjan of Arabic coffee beside a brass dallah. Soft directional morning light, calm editorial mood, shallow depth of field. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

**إعدادات Midjourney:** `--ar 16:9 --style raw --no text, letters, Arabic or Latin writing, logos, watermarks, signage, flags, national emblems, government seals, coat of arms, gavel, judge wig`

---

## صور إضافية اختيارية

أغلفة للمقالات حسب التصنيف (ترفع من صفحة تعديل المقال ← صورة الغلاف):

### غلاف مقال — الشركات والأعمال (1600×900 · 16:9)

```text
Overhead flat-lay on a travertine desk: a company incorporation folder in deep green leather, a brass fountain pen, a stamped ivory document with unreadable text, a small potted olive branch. Balanced editorial composition. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

### غلاف مقال — التقاضي والتنفيذ (1600×900 · 16:9)

```text
Detail of a lawyer's hands in a white thobe sleeve organizing case files with colored tabs on a walnut table, a leather briefcase beside them, warm morning light through tall windows. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

### غلاف مقال — التوثيق والعقود (1600×900 · 16:9)

```text
Close-up of two hands exchanging a signed ivory agreement across a walnut table, one in a white thobe sleeve, one in a navy suit sleeve, a brass pen resting between them, shallow depth of field. Quiet-luxury editorial photography for a premier Saudi law firm, in the style of a high-end business magazine feature. Shot on a Hasselblad X2D medium-format camera, 80mm lens at f/2.8, soft natural daylight, gentle low-contrast shadows, true-to-life skin texture, fine film grain. Refined palette of warm ivory, travertine beige, deep teal-green and charcoal, with subtle brushed-brass accents. Calm, confident and dignified mood; unposed and natural; generous negative space; asymmetric magazine composition. Photorealistic.
```

### صور فريق العمل

صور أعضاء الفريق يجب أن تكون **صورًا حقيقية** لهم (لا تُولَّد بالذكاء الاصطناعي). للحصول على مظهر موحّد اطلب من المصوّر: خلفية جدار جصي عاجي، ضوء نافذة جانبي ناعم، لقطة نصفية بنسبة 4:5، الثوب والغترة والعقال أو البدلة الرسمية، وتعبير هادئ واثق.

> الصور المولّدة بالذكاء الاصطناعي توضيحية للأجواء فقط؛ لا تُقدَّم على أنها صور لموظفين أو عملاء حقيقيين.

