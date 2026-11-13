import { field, HttpError, route } from '../../lib/http';
import { isLocked } from '../../lib/login-guard';
import { issueChallenge } from '../../lib/otp';
import { supabase } from '../../lib/supabase';
import { verifyTelegramInitData } from '../../lib/telegram';

export default route('POST', async (req, res) => {
  const initData = field(req.body, 'init_data', 4096);
  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN yo‘q');

  const tg = verifyTelegramInitData(initData, token);

  const { data: admin } = await supabase
    .from('admins')
    .select('id, email, is_active, locked_until')
    .eq('telegram_id', tg.id)
    .maybeSingle();

  if (!admin?.is_active || isLocked(admin.locked_until)) {
    throw new HttpError(403, 'Ruxsat yo‘q');
  }

  const challengeId = await issueChallenge(admin, 'telegram_otp');
  res.status(200).json({ step: 'otp', challenge_id: challengeId });
});
