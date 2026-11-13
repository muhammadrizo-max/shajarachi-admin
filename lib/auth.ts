import { createHmac, timingSafeEqual } from 'node:crypto';
import type { VercelResponse } from '@vercel/node';

export type AdminUser = { id: number; first_name?: string; username?: string };

export class AuthError extends Error {
  constructor(public status: 401 | 403, message: string) {
    super(message);
  }
}

export function verifyTelegramInitData(initData: string, botToken: string, maxAgeSec = 86400): AdminUser {
  const params = new URLSearchParams(initData);
  const hash = params.get('hash');
  if (!hash) throw new AuthError(401, 'hash yo‘q');
  params.delete('hash');

  const dataCheckString = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('\n');

  const secret = createHmac('sha256', 'WebAppData').update(botToken).digest();
  const computed = createHmac('sha256', secret).update(dataCheckString).digest();
  const received = Buffer.from(hash, 'hex');

  if (received.length !== computed.length || !timingSafeEqual(received, computed)) {
    throw new AuthError(401, 'imzo noto‘g‘ri');
  }

  const authDate = Number(params.get('auth_date'));
  if (!authDate || Date.now() / 1000 - authDate > maxAgeSec) {
    throw new AuthError(401, 'sessiya muddati o‘tgan');
  }

  const user = JSON.parse(params.get('user') ?? 'null') as AdminUser | null;
  if (!user?.id) throw new AuthError(401, 'foydalanuvchi yo‘q');
  return user;
}

export function requireAdmin(initData: string | undefined): AdminUser {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN yo‘q');
  if (!initData) throw new AuthError(401, 'initData yo‘q');

  const user = verifyTelegramInitData(initData, token);
  const admins = (process.env.ADMIN_TELEGRAM_IDS ?? '')
    .split(',')
    .map((s) => Number(s.trim()))
    .filter(Boolean);

  if (!admins.includes(user.id)) throw new AuthError(403, 'ruxsat yo‘q');
  return user;
}

export function handleAuthError(e: unknown, res: VercelResponse) {
  if (e instanceof AuthError) return res.status(e.status).json({ error: e.message });
  console.error('[admin]', e);
  return res.status(500).json({ error: 'server xatosi' });
}
