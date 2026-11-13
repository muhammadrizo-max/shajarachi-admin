import { createClient, type SupabaseClient } from '@supabase/supabase-js';

let client: SupabaseClient | null = null;

function getClient(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Supabase env yo‘q: SUPABASE_URL yoki SUPABASE_SERVICE_ROLE_KEY');
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Import paytida yiqilmaydi, xato faqat so'rov paytida JSON bo'lib qaytadi
export const supabase = new Proxy({} as SupabaseClient, {
  get(_, prop) {
    const c = getClient() as unknown as Record<string | symbol, unknown>;
    const v = c[prop];
    return typeof v === 'function' ? v.bind(c) : v;
  },
});
