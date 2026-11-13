import { createHmac, timingSafeEqual } from 'node:crypto';
import { HttpError } from './http';

export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSec = 1800): { id: number } {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new HttpError(401, 'Telegram ma’lumoti noto‘g‘ri');
  params.delete('hash');

  const check = [...params.entries()]
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const expected = createHmac('sha256', secret).update(check).digest();
  const received = Buffer.from(hash, 'hex');
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) {
    throw new HttpError(401, 'Telegram imzosi noto‘g‘ri');
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) {
    throw new HttpError(401, 'Telegram sessiyasi eskirgan, qayta oching');
  }

  const user = JSON.parse(params.get('user') ?? 'null');
  if (!user?.id) throw new HttpError(401, 'Telegram foydalanuvchisi topilmadi');
  return { id: Number(user.id) };
}
