import { field, HttpError, route } from '../../lib/http';
import { isLocked, recordFailure, recordSuccess } from '../../lib/login-guard';
import { verifyPassword } from '../../lib/security';
import { startSession } from '../../lib/session';
import { supabase } from '../../lib/supabase';
import { verifyTelegramInitData } from '../../lib/telegram';

const DENIED = 'Ruxsat yo‘q yoki parol noto‘g‘ri';

export default route('POST', async (req, res) => {
  const initData = field(req.body, 'init_data', 4096);
  const password = field(req.body, 'password', 200);

  const token = process.env.TELEGRAM_BOT_TOKEN;
  if (!token) throw new Error('TELEGRAM_BOT_TOKEN yo‘q');
  const tgUser = verifyTelegramInitData(initData, token);

  const { data: admin } = await supabase
    .from('admins')
    .select('id, password_hash, is_active, failed_attempts, locked_until')
    .eq('telegram_id', tgUser.id)
    .maybeSingle();

  const pwOk = await verifyPassword(password, admin?.password_hash);
  if (!admin || !admin.is_active || !pwOk || isLocked(admin.locked_until)) {
    if (admin) await recordFailure(admin.id, admin.failed_attempts);
    throw new HttpError(403, DENIED);
  }

  await recordSuccess(admin.id);
  await startSession(req, res, admin.id, 'telegram_password');
  res.status(200).json({ ok: true });
});
