import type { VercelRequest, VercelResponse } from '@vercel/node';
import { clientIp, getCookie, HttpError } from './http';
import { randomToken, sha256 } from './security';
import { supabase } from './supabase';

export const SESSION_COOKIE = '__Host-sid';
const TTL_SEC = 12 * 3600;

export type Admin = { id: string; email: string; telegram_id: number | null };

export async function startSession(
  req: VercelRequest,
  res: VercelResponse,
  adminId: string,
  method: 'password_otp' | 'telegram_password'
): Promise<void> {
  const token = randomToken();
  const ip = clientIp(req);
  const { error } = await supabase.from('admin_sessions').insert({
    token_hash: sha256(token),
    admin_id: adminId,
    method,
    ip,
    user_agent: String(req.headers['user-agent'] ?? '').slice(0, 300),
    expires_at: new Date(Date.now() + TTL_SEC * 1000).toISOString(),
  });
  if (error) throw error;

  res.setHeader(
    'Set-Cookie',
    `${SESSION_COOKIE}=${token}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=${TTL_SEC}`
  );
  await supabase.from('admin_audit').insert({ admin_id: adminId, action: `login:${method}`, ip });
}

export async function currentAdmin(req: VercelRequest): Promise<Admin> {
  const token = getCookie(req, SESSION_COOKIE);
  if (!token) throw new HttpError(401, 'kirish talab qilinadi');

  const { data: s } = await supabase
    .from('admin_sessions')
    .select('admin_id, expires_at')
    .eq('token_hash', sha256(token))
    .maybeSingle();
  if (!s || new Date(s.expires_at).getTime() < Date.now()) {
    throw new HttpError(401, 'sessiya tugagan');
  }

  const { data: a } = await supabase
    .from('admins')
    .select('id, email, telegram_id, is_active')
    .eq('id', s.admin_id)
    .maybeSingle();
  if (!a?.is_active) throw new HttpError(403, 'ruxsat yo‘q');

  return { id: a.id, email: a.email, telegram_id: a.telegram_id };
}

export async function endSession(req: VercelRequest, res: VercelResponse): Promise<void> {
  const token = getCookie(req, SESSION_COOKIE);
  if (token) await supabase.from('admin_sessions').delete().eq('token_hash', sha256(token));
  res.setHeader('Set-Cookie', `${SESSION_COOKIE}=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0`);
}
