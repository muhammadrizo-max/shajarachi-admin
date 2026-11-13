import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, handleAuthError } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    requireAdmin(req.headers['x-telegram-init-data'] as string | undefined);

    const { count: total, error: e1 } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true });
    if (e1) throw e1;

    const since = new Date(Date.now() - 86_400_000).toISOString();
    const { count: today, error: e2 } = await supabase
      .from('contact_messages')
      .select('*', { count: 'exact', head: true })
      .gte('created_at', since);
    if (e2) throw e2;

    return res.status(200).json({ total: total ?? 0, today: today ?? 0 });
  } catch (e) {
    return handleAuthError(e, res);
  }
}
