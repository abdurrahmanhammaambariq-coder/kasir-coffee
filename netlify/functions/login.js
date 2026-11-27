const crypto = require('crypto');

const json = (statusCode, obj) => ({
  statusCode,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(obj)
});

const sha = s => crypto.createHash('sha256').update(String(s)).digest();
const safeEqual = (a, b) => crypto.timingSafeEqual(sha(a), sha(b));
const b64 = s => Buffer.from(s).toString('base64url');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') return json(405, { error: 'Metode tidak diizinkan' });

  const { OWNER_PASSWORD, KASIR_PIN, AUTH_SECRET } = process.env;
  if (!OWNER_PASSWORD || !KASIR_PIN || !AUTH_SECRET) {
    return json(500, { error: 'Server belum diatur. Isi environment variables di Netlify.' });
  }

  let body;
  try { body = JSON.parse(event.body || '{}'); }
  catch (e) { return json(400, { error: 'Permintaan tidak valid' }); }

  const { role, secret } = body;
  const expected = role === 'owner' ? OWNER_PASSWORD : role === 'kasir' ? KASIR_PIN : null;

  if (!expected || !safeEqual(secret || '', expected)) {
    await new Promise(r => setTimeout(r, 700));
    return json(401, { error: 'Password atau PIN salah' });
  }

  const payload = b64(JSON.stringify({ role, exp: Date.now() + 12 * 3600 * 1000 }));
  const sig = crypto.createHmac('sha256', AUTH_SECRET).update(payload).digest('base64url');
  return json(200, { token: payload + '.' + sig, role });
};
