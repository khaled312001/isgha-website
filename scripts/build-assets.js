// يبني ملف الأيقونات (sprite) وينسخ مكتبات لوحة التحكم إلى public/vendor.
// يُشغَّل محليًا فقط (npm run build:assets) والناتج محفوظ في المستودع،
// لذلك لا يحتاج السيرفر أي خطوة بناء.
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const iconsDir = path.join(root, 'node_modules', '@phosphor-icons', 'core', 'assets');

// الاسم المستخدم في القوالب ← اسم أيقونة Phosphor (وزن duotone: خط + طبقة تعبئة خفيفة)
export const ICONS = {
  scale: 'scales', gavel: 'gavel', 'file-text': 'file-text', stamp: 'stamp',
  briefcase: 'briefcase', building: 'buildings', landmark: 'bank',
  'hand-heart': 'hand-heart', user: 'user', 'user-tie': 'user-circle-check', users: 'users-three',
  shield: 'shield-check', clock: 'clock', phone: 'phone', mail: 'envelope-simple', 'map-pin': 'map-pin',
  search: 'magnifying-glass', lightbulb: 'lightbulb', rocket: 'rocket-launch', eye: 'eye', 'eye-off': 'eye-slash',
  target: 'target', gem: 'diamond', award: 'seal-check', star: 'star', medal: 'medal', handshake: 'handshake',
  check: 'check', 'check-circle': 'check-circle', 'arrow-left': 'arrow-left', 'arrow-right': 'arrow-right',
  'arrow-up-left': 'arrow-up-left', 'chevron-down': 'caret-down', 'chevron-left': 'caret-left',
  'chevron-right': 'caret-right', 'chevron-up': 'caret-up',
  plus: 'plus', minus: 'minus', x: 'x', menu: 'list', lock: 'lock-simple', calendar: 'calendar-blank',
  signature: 'signature', 'chart-line': 'chart-line-up', 'trending-up': 'trend-up', home: 'house',
  truck: 'truck', calculator: 'calculator', coins: 'coins', banknote: 'money', layers: 'stack',
  settings: 'gear-six', logout: 'sign-out', dashboard: 'squares-four', inbox: 'tray',
  'file-pen': 'note-pencil', image: 'image', globe: 'globe-hemisphere-east', megaphone: 'megaphone',
  'chart-bar': 'chart-bar', 'user-cog': 'user-gear', history: 'clock-counter-clockwise', 'external-link': 'arrow-square-out',
  copy: 'copy', trash: 'trash', pencil: 'pencil-simple', grip: 'dots-six-vertical', link: 'link',
  download: 'download-simple', upload: 'upload-simple', filter: 'funnel', refresh: 'arrows-clockwise', send: 'paper-plane-tilt',
  'book-open': 'book-open-text', newspaper: 'newspaper', scroll: 'scroll', factory: 'factory',
  'message-square': 'chat-text', 'list-checks': 'list-checks', 'layout-template': 'layout',
  'panel-top': 'app-window', monitor: 'monitor', smartphone: 'device-mobile', tablet: 'device-tablet',
  'circle-help': 'question', quote: 'quotes', play: 'play', code: 'code', columns: 'columns',
  rows: 'rows', list: 'list-bullets', 'list-ordered': 'list-numbers', type: 'text-t', 'square-check': 'check-square',
  'triangle-alert': 'warning', info: 'info', bell: 'bell', activity: 'pulse',
  'mouse-pointer': 'cursor-click', percent: 'percent', zap: 'lightning', key: 'key',
  database: 'database', server: 'hard-drives', save: 'floppy-disk', undo: 'arrow-counter-clockwise', move: 'arrows-out-cardinal',
  toggle: 'toggle-right', folder: 'folder', tag: 'tag', hash: 'hash', map: 'map-trifold',
  ghost: 'ghost',
  'scan-search': 'magnifying-glass-plus', 'file-check': 'certificate', 'building-bank': 'bank', piggy: 'piggy-bank',
  baby: 'baby', heart: 'heart', 'shield-alert': 'shield-warning', receipt: 'receipt', ship: 'boat',
  crown: 'crown', compass: 'compass', route: 'path', sliders: 'sliders-horizontal', wand: 'magic-wand',
  graduation: 'graduation-cap', presentation: 'presentation-chart', 'pen-tool': 'pen-nib', notebook: 'notebook',
  clipboard: 'clipboard-text', 'circle-dot': 'radio-button', sun: 'sun', moon: 'moon', laptop: 'laptop', more: 'dots-three-vertical',
};

// شعارات المنصات بوزن fill (مصمتة) لأنها أوضح وأقرب للشعار الرسمي
const BRAND = {
  whatsapp: 'whatsapp-logo', 'x-brand': 'x-logo', tiktok: 'tiktok-logo', linkedin: 'linkedin-logo',
  instagram: 'instagram-logo', youtube: 'youtube-logo', snapchat: 'snapchat-logo',
};

// رموز الواجهة الصغيرة (أسهم، إغلاق، علامة صح…) بوزن regular لأن طبقة duotone تشوّهها
const UI_REGULAR = new Set([
  'more',
  'check', 'plus', 'minus', 'x', 'menu', 'grip', 'list', 'list-ordered', 'hash', 'percent', 'activity', 'type', 'code', 'quote',
  'arrow-left', 'arrow-right', 'arrow-up-left', 'chevron-down', 'chevron-left', 'chevron-right', 'chevron-up',
  'external-link', 'refresh', 'undo', 'move', 'link', 'trending-up', 'rows', 'columns',
]);

// أشكال خاصة غير موجودة في المكتبة
const CUSTOM = {
  diamond: '<path d="M128 20 236 128 128 236 20 128z"/>',
};

function symbolFrom(weight, file) {
  const p = path.join(iconsDir, weight, `${file}${weight === 'regular' ? '' : `-${weight}`}.svg`);
  if (!fs.existsSync(p)) return null;
  return fs.readFileSync(p, 'utf8').replace(/^[\s\S]*?<svg[^>]*>/, '').replace(/<\/svg>\s*$/, '').trim();
}

function buildSprite() {
  const symbols = [];
  const missing = [];
  const add = (name, weight, file) => {
    const inner = symbolFrom(weight, file);
    if (!inner) { missing.push(`${name} → ${file} (${weight})`); return; }
    symbols.push(`<symbol id="i-${name}" viewBox="0 0 256 256" fill="currentColor">${inner}</symbol>`);
  };
  for (const [name, file] of Object.entries(ICONS)) add(name, UI_REGULAR.has(name) ? 'regular' : 'duotone', file);
  for (const [name, file] of Object.entries(BRAND)) add(name, 'fill', file);
  for (const [name, inner] of Object.entries(CUSTOM)) symbols.push(`<symbol id="i-${name}" viewBox="0 0 256 256" fill="currentColor">${inner}</symbol>`);
  const sprite = `<svg xmlns="http://www.w3.org/2000/svg" style="display:none">${symbols.join('')}</svg>`;
  fs.writeFileSync(path.join(root, 'public', 'img', 'icons.svg'), sprite);
  const names = symbols.map((x) => x.match(/id="i-([^"]+)"/)[1]);
  fs.writeFileSync(path.join(root, 'src', 'content', 'icon-names.json'), JSON.stringify(names, null, 0));
  console.log(`icons: ${symbols.length} symbols, ${(sprite.length / 1024).toFixed(1)}KB`);
  if (missing.length) console.warn('missing icons:\n  ' + missing.join('\n  '));
}

function copyVendor() {
  const v = path.join(root, 'public', 'vendor');
  fs.mkdirSync(v, { recursive: true });
  const nm = (p) => path.join(root, 'node_modules', p);
  const files = [
    ['quill/dist/quill.js', 'quill.js'],
    ['quill/dist/quill.snow.css', 'quill.snow.css'],
    ['chart.js/dist/chart.umd.min.js', 'chart.umd.min.js'],
    ['sortablejs/Sortable.min.js', 'sortable.min.js'],
  ];
  const done = [];
  for (const [from, to] of files) {
    if (!fs.existsSync(nm(from))) continue;
    fs.copyFileSync(nm(from), path.join(v, to));
    done.push(to);
  }
  console.log(done.length ? `vendor copied: ${done.join(', ')}` : 'vendor: dev packages not installed — keeping the prebuilt files in public/vendor');
}

// على الخادم يثبّت npm حزم التشغيل فقط (NODE_ENV=production)، فتُستخدم الملفات المبنية مسبقًا والمحفوظة في المستودع
fs.mkdirSync(path.join(root, 'src', 'content'), { recursive: true });
if (fs.existsSync(iconsDir)) buildSprite();
else console.log('icons: @phosphor-icons/core not installed — keeping the prebuilt public/img/icons.svg');
copyVendor();
