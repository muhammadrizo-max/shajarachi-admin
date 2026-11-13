import type { VercelRequest, VercelResponse } from '@vercel/node';
import { requireAdmin, handleAuthError } from '../../lib/auth';
import { supabase } from '../../lib/supabase';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'GET') return res.status(405).end();

  try {
    requireAdmin(req.headers['x-telegram-init-data'] as string | undefined);

    const { data, error } = await supabase
      .from('contact_messages')
      .select('id, created_at, topic, contact, message')
      .order('created_at', { ascending: false })
      .limit(50);
    if (error) throw error;

    return res.status(200).json({ messages: data ?? [] });
  } catch (e) {
    return handleAuthError(e, res);
  }
}
