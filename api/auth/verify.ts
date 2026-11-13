import { field, HttpError, route } from '../../lib/http';
import { recordSuccess } from '../../lib/login-guard';
import { safeEqual, sha256 } from '../../lib/security';
import { startSession } from '../../lib/session';
import { supabase } from '../../lib/supabase';

const MAX_ATTEMPTS = 5;

export default route('POST', async (req, res) => {
  const challengeId = field(req.body, 'challenge_id', 64);
  const code = field(req.body, 'code', 6);

  const { data: c } = await supabase
    .from('admin_login_challenges')
    .select('id, admin_id, code_hash, attempts, used, expires_at')
    .eq('id', challengeId)
    .maybeSingle();

  if (!c || c.used || c.attempts >= MAX_ATTEMPTS || new Date(c.expires_at).getTime() < Date.now()) {
    throw new HttpError(401, 'Kod yaroqsiz yoki muddati o‘tgan. Qaytadan kiring.');
  }

  if (!safeEqual(c.code_hash, sha256(`${challengeId}:${code}`))) {
    await supabase.from('admin_login_challenges').update({ attempts: c.attempts + 1 }).eq('id', challengeId);
    throw new HttpError(401, 'Kod noto‘g‘ri');
  }

  await supabase.from('admin_login_challenges').update({ used: true }).eq('id', challengeId);
  await recordSuccess(c.admin_id);
  await startSession(req, res, c.admin_id, 'password_otp');
  res.status(200).json({ ok: true });
});
