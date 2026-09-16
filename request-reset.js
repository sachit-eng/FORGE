import crypto from 'node:crypto';

function tokenEncrypt(payload, secret) {
  const key = crypto.createHash('sha256').update(secret).digest();
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const body = Buffer.from(JSON.stringify(payload));
  const enc = Buffer.concat([cipher.update(body), cipher.final()]);
  const tag = cipher.getAuthTag();
  return [iv, tag, enc].map(b => b.toString('base64url')).join('.');
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const secret = process.env.RESET_SECRET;
  const resendKey = process.env.RESEND_API_KEY;
  const from = process.env.FORGE_FROM_EMAIL;
  if (!secret || !resendKey || !from) return res.status(500).json({ error: 'Password reset email service is not configured. Add RESET_SECRET, RESEND_API_KEY and FORGE_FROM_EMAIL.' });
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    const email = String(body.email || '').trim().toLowerCase();
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Enter a valid email address.' });
    const otp = String(crypto.randomInt(0, 1000000)).padStart(6, '0');
    const token = tokenEncrypt({ email, otp, exp: Date.now() + 10 * 60 * 1000 }, secret);
    const r = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from,
        to: [email],
        subject: 'FORGE password reset OTP',
        html: `<div style="font-family:Arial,sans-serif;background:#090a0c;color:#fff;padding:28px"><h2 style="margin:0 0 10px">FORGE</h2><p>Your password reset OTP is:</p><div style="font-size:34px;font-weight:800;letter-spacing:8px;margin:18px 0">${otp}</div><p>This code expires in 10 minutes. If you did not request this, ignore this email.</p></div>`
      })
    });
    const data = await r.json();
    if (!r.ok) return res.status(r.status).json({ error: data?.message || 'Could not send reset email.' });
    return res.status(200).json({ ok: true, resetToken: token, message: 'OTP sent to your email.' });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: 'Password reset request failed.' });
  }
}
