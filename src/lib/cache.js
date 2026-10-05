// ذاكرة مؤقتة بسيطة داخل العملية مع مدة صلاحية.
// السيرفر قد يشغّل أكثر من عملية (Passenger)، لذلك المدة قصيرة.
const store = new Map();
const TTL = Number(process.env.CACHE_TTL_MS || 15000);

export async function remember(key, fn, ttl = TTL) {
  const hit = store.get(key);
  const t = Date.now();
  if (hit && hit.expires > t) return hit.value;
  const value = await fn();
  store.set(key, { value, expires: t + ttl });
  return value;
}

export function forget(prefix) {
  if (!prefix) return store.clear();
  for (const k of store.keys()) if (k.startsWith(prefix)) store.delete(k);
}
