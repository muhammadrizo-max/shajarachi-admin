export async function sendOtpEmail(to: string, code: string): Promise<void> {
  const key = process.env.RESEND_API_KEY;
  const from = process.env.EMAIL_FROM;
  if (!key || !from) throw new Error('RESEND_API_KEY yoki EMAIL_FROM yo‘q');

  const r = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${key}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: 'Admin kirish kodi',
      html: `<p>Kirish kodingiz: <b>${code}</b></p><p>Kod 5 daqiqa amal qiladi. Siz so‘ramagan bo‘lsangiz, e’tibor bermang.</p>`,
    }),
  });
  if (!r.ok) throw new Error('OTP email yuborilmadi');
}
