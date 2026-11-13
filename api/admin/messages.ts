import { route } from '../../lib/http';
import { currentAdmin } from '../../lib/session';
import { supabase } from '../../lib/supabase';

function maskContact(c: string | null): string {
  if (!c) return '';
  if (c.includes('@')) {
    const [user, domain] = c.split('@');
    return `${user.slice(0, 1)}***@${domain}`;
  }
  return `***${c.slice(-3)}`;
}

export default route('GET', async (req, res) => {
  await currentAdmin(req);

  const { data, error } = await supabase
    .from('contact_messages')
    .select('id, created_at, topic, contact, message')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;

  const messages = (data ?? []).map((m) => ({
    id: m.id,
    created_at: m.created_at,
    topic: m.topic,
    contact: maskContact(m.contact),
    message: m.message,
  }));
  res.status(200).json({ messages });
});
