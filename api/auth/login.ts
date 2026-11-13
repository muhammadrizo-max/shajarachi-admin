import { field, HttpError, route } from '../../lib/http';
import { isLocked, recordFailure, recordSuccess } from '../../lib/login-guard';
import { issueChallenge } from '../../lib/otp';
import { verifyPassword } from '../../lib/security';
import { startSession } from '../../lib/session';
import { supabase } from '../../lib/supabase';

const BAD = 'Login yoki parol noto‘g‘ri';
// 0 qilsangiz, har bir kirishda email kodi so'raladi
const OTP_AFTER_FAILS = 2;

export default route('POST', async (req, res) => {
  const login = field(req.body, 'login', 32).trim().toLowerCase();
  const password = field(req.body, 'password', 200);

  const { data: admin } = await supabase
    .from('admins')
    .select('id, email, password_hash, is_active, failed_attempts, locked_until')
    .eq('login', login)
    .maybeSingle();

  if (!admin || !admin.is_active) {
    await verifyPassword(password, null);
    throw new HttpError(401, BAD);
  }
  if (isLocked(admin.locked_until)) {
    throw new HttpError(429, 'Juda ko‘p urinish. 15 daqiqadan keyin qayta urining.');
  }

  const ok = await verifyPassword(password, admin.password_hash);

  if (!ok) {
    await recordFailure(admin.id, admin.failed_attempts);
    if (admin.failed_attempts + 1 < OTP_AFTER_FAILS) throw new HttpError(401, BAD);
    const challengeId = await issueChallenge(admin, 'password_otp');
    res.status(200).json({ step: 'otp', challenge_id: challengeId });
    return;
  }

  if (admin.failed_attempts < OTP_AFTER_FAILS) {
    await recordSuccess(admin.id);
    await startSession(req, res, admin.id, 'password');
    res.status(200).json({ step: 'done' });
    return;
  }

  const challengeId = await issueChallenge(admin, 'password_otp');
  res.status(200).json({ step: 'otp', challenge_id: challengeId });
});
