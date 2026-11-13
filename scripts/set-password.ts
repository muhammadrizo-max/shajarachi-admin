import { hashPassword } from '../lib/security';
import { supabase } from '../lib/supabase';

const [email, login] = process.argv.slice(2);
const password = process.env.ADMIN_PASSWORD;
const loginNorm = login?.trim().toLowerCase() ?? '';

if (!email || !/^[a-z0-9]{3,32}$/.test(loginNorm) || !password || password.length < 12) {
  console.error('Foydalanish: ADMIN_PASSWORD=... npm run set-password -- email login');
  process.exit(1);
}

const { data, error } = await supabase
  .from('admins')
  .update({
    login: loginNorm,
    password_hash: await hashPassword(password),
    failed_attempts: 0,
    locked_until: null,
  })
  .eq('email', email.trim().toLowerCase())
  .select('id');

if (error) throw error;
if (!data?.length) {
  console.error('Bunday email topilmadi. Avval create-admin ni ishga tushiring.');
  process.exit(1);
}
console.log('Login va parol yangilandi');
