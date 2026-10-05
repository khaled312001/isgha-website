import sanitizeHtml from 'sanitize-html';

// تنظيف المحتوى المنسّق (المقالات وصفحات السياسات)
export function cleanRich(html) {
  return sanitizeHtml(String(html ?? ''), {
    allowedTags: [
      'h2', 'h3', 'h4', 'p', 'br', 'hr', 'strong', 'b', 'em', 'i', 'u', 's', 'mark', 'blockquote', 'code', 'pre',
      'ul', 'ol', 'li', 'a', 'img', 'figure', 'figcaption', 'table', 'thead', 'tbody', 'tr', 'th', 'td', 'span', 'sub', 'sup',
    ],
    allowedAttributes: {
      a: ['href', 'title', 'target', 'rel'],
      img: ['src', 'alt', 'width', 'height', 'loading'],
      '*': ['class', 'dir'],
      td: ['colspan', 'rowspan'],
      th: ['colspan', 'rowspan'],
    },
    allowedClasses: { '*': ['ql-align-center', 'ql-align-right', 'ql-align-left', 'ql-align-justify', 'ql-direction-rtl', 'ql-indent-1', 'ql-indent-2', 'note', 'lead'] },
    allowedSchemes: ['http', 'https', 'mailto', 'tel'],
    allowedSchemesAppliedToAttributes: ['href', 'src'],
    transformTags: {
      a: (tag, attribs) => {
        const out = { ...attribs };
        if (/^https?:\/\//i.test(out.href || '')) {
          out.target = '_blank';
          out.rel = 'noopener';
        }
        return { tagName: 'a', attribs: out };
      },
      img: (tag, attribs) => ({ tagName: 'img', attribs: { ...attribs, loading: 'lazy' } }),
      h1: 'h2',
    },
  });
}

// تنظيف نص عادي من أي وسوم
export function cleanText(s, max = 5000) {
  return sanitizeHtml(String(s ?? ''), { allowedTags: [], allowedAttributes: {} }).replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"').trim().slice(0, max);
}
