import { hashPassword } from '../lib/security';
import { supabase } from '../lib/supabase';

const [login, email, telegramId] = process.argv.slice(2);
const password = process.env.ADMIN_PASSWORD;
const loginNorm = login?.trim().toLowerCase() ?? '';

if (!/^[a-z0-9]{3,32}$/.test(loginNorm) || !email || !password || password.length < 12) {
  console.error('Foydalanish: ADMIN_PASSWORD=... npm run create-admin -- login email [telegram_id]');
  process.exit(1);
}

const { error } = await supabase.from('admins').insert({
  login: loginNorm,
  email: email.trim().toLowerCase(),
  telegram_id: telegramId ? Number(telegramId) : null,
  password_hash: await hashPassword(password),
});
if (error) throw error;
console.log('Admin yaratildi');
