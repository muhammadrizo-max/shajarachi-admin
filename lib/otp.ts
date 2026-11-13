import { randomUUID } from 'node:crypto';
import { sendOtpEmail } from './mailer';
import { newOtp, sha256 } from './security';
import { supabase } from './supabase';

export async function issueChallenge(
  admin: { id: string; email: string },
  method: 'password_otp' | 'telegram_otp'
): Promise<string> {
  await supabase.from('admin_login_challenges').update({ used: true }).eq('admin_id', admin.id).eq('used', false);

  const id = randomUUID();
  const code = newOtp();
  const { error } = await supabase.from('admin_login_challenges').insert({
    id,
    admin_id: admin.id,
    method,
    code_hash: sha256(`${id}:${code}`),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });
  if (error) throw error;

  await sendOtpEmail(admin.email, code);
  return id;
}
