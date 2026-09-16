import crypto from 'node:crypto';

function decryptToken(token, secret) {
  const [ivB64, tagB64, encB64] = String(token || '').split('.');
  if (!ivB64 || !tagB64 || !encB64) throw new Error('Invalid reset token');
  const key = crypto.createHash('sha256').update(secret).digest();
  const decipher = crypto.createDecipheriv('aes-256-gcm', key, Buffer.from(ivB64, 'base64url'));
  decipher.setAuthTag(Buffer.from(tagB64, 'base64url'));
  const plain = Buffer.concat([decipher.update(Buffer.from(encB64, 'base64url')), decipher.final()]);
  return JSON.parse(plain.toString('utf8'));
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secret = process.env.RESET_SECRET;
  if (!secret) return res.status(500).json({ error: 'Password reset service is not configured.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const data = decryptToken(body.resetToken, secret);
    const otp = String(body.otp || '').trim();
    if (Date.now() > Number(data.exp)) return res.status(400).json({ error: 'OTP expired. Request a new code.' });
    if (!/^\d{6}$/.test(otp) || otp !== data.otp) return res.status(400).json({ error: 'Incorrect OTP.' });
    return res.status(200).json({ ok: true, email: data.email });
  } catch (e) {
    return res.status(400).json({ error: 'Invalid or expired reset request.' });
  }
}
