import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import config from '../config.js';
import db from '../db.js';

const ALLOWED = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
  'application/pdf': '.pdf',
};

const storage = multer.diskStorage({
  destination(req, file, cb) {
    const d = new Date();
    const sub = `${d.getFullYear()}/${String(d.getMonth() + 1).padStart(2, '0')}`;
    const dir = path.join(config.uploadsDir, sub);
    fs.mkdirSync(dir, { recursive: true });
    file.subdir = sub;
    cb(null, dir);
  },
  filename(req, file, cb) {
    const base = path.parse(file.originalname).name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'file';
    cb(null, `${base}-${crypto.randomBytes(4).toString('hex')}${ALLOWED[file.mimetype]}`);
  },
});

export const uploader = multer({
  storage,
  limits: { fileSize: 12 * 1024 * 1024, files: 20 },
  fileFilter(req, file, cb) {
    if (ALLOWED[file.mimetype]) return cb(null, true);
    cb(new Error('نوع الملف غير مسموح. المسموح: JPG, PNG, WebP, GIF, AVIF, PDF'));
  },
});

// قراءة أبعاد الصورة من ترويسة الملف بدون مكتبات أصلية
export function imageSize(file) {
  try {
    const fd = fs.openSync(file, 'r');
    const buf = Buffer.alloc(64 * 1024);
    const n = fs.readSync(fd, buf, 0, buf.length, 0);
    fs.closeSync(fd);
    const b = buf.subarray(0, n);
    if (b.readUInt32BE(0) === 0x89504e47) return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
    if (b.toString('ascii', 0, 3) === 'GIF') return { width: b.readUInt16LE(6), height: b.readUInt16LE(8) };
    if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') {
      const chunk = b.toString('ascii', 12, 16);
      if (chunk === 'VP8X') return { width: 1 + b.readUIntLE(24, 3), height: 1 + b.readUIntLE(27, 3) };
      if (chunk === 'VP8 ') return { width: b.readUInt16LE(26) & 0x3fff, height: b.readUInt16LE(28) & 0x3fff };
      if (chunk === 'VP8L') {
        const bits = b.readUInt32LE(21);
        return { width: (bits & 0x3fff) + 1, height: ((bits >> 14) & 0x3fff) + 1 };
      }
    }
    if (b[0] === 0xff && b[1] === 0xd8) {
      let i = 2;
      while (i < b.length) {
        if (b[i] !== 0xff) { i++; continue; }
        const marker = b[i + 1];
        const len = b.readUInt16BE(i + 2);
        if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker)) {
          return { width: b.readUInt16BE(i + 7), height: b.readUInt16BE(i + 5) };
        }
        i += 2 + len;
      }
    }
  } catch { /* تجاهل */ }
  return { width: null, height: null };
}

export async function saveMedia(file, userId, alt = '') {
  const url = `/uploads/${file.subdir}/${file.filename}`;
  const dims = file.mimetype.startsWith('image/') ? imageSize(file.path) : { width: null, height: null };
  const [id] = await db('media').insert({
    filename: `${file.subdir}/${file.filename}`,
    original_name: file.originalname.slice(0, 250),
    url,
    mime: file.mimetype,
    size: file.size,
    width: dims.width,
    height: dims.height,
    alt: alt || null,
    created_by: userId || null,
  });
  return { id, url, ...dims, mime: file.mimetype, size: file.size };
}

export function deleteMediaFile(filename) {
  const full = path.join(config.uploadsDir, filename);
  if (!full.startsWith(config.uploadsDir)) return;
  fs.rm(full, { force: true }, () => {});
}
