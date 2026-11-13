import { randomUUID } from 'node:crypto';
import { field, HttpError, route } from '../../lib/http';
import { sendOtpEmail } from '../../lib/mailer';
import { isLocked, recordFailure } from '../../lib/login-guard';
import { newOtp, sha256, verifyPassword } from '../../lib/security';
import { supabase } from '../../lib/supabase';

const BAD = 'Email yoki parol noto‘g‘ri';

export default route('POST', async (req, res) => {
  const email = field(req.body, 'email', 254).trim().toLowerCase();
  const password = field(req.body, 'password', 200);

  const { data: admin } = await supabase
    .from('admins')
    .select('id, email, password_hash, is_active, failed_attempts, locked_until')
    .eq('email', email)
    .maybeSingle();

  const pwOk = await verifyPassword(password, admin?.password_hash);
  if (!admin || !admin.is_active || !pwOk || isLocked(admin.locked_until)) {
    if (admin) await recordFailure(admin.id, admin.failed_attempts);
    throw new HttpError(401, BAD);
  }

  await supabase.from('admin_login_challenges').update({ used: true }).eq('admin_id', admin.id).eq('used', false);

  const challengeId = randomUUID();
  const code = newOtp();
  const { error } = await supabase.from('admin_login_challenges').insert({
    id: challengeId,
    admin_id: admin.id,
    code_hash: sha256(`${challengeId}:${code}`),
    expires_at: new Date(Date.now() + 5 * 60_000).toISOString(),
  });
  if (error) throw error;

  await sendOtpEmail(admin.email, code);
  res.status(200).json({ challenge_id: challengeId });
});
