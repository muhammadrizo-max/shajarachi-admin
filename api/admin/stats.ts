import { route } from '../../lib/http';
import { currentAdmin } from '../../lib/session';
import { supabase } from '../../lib/supabase';

export default route('GET', async (req, res) => {
  await currentAdmin(req);

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

  res.status(200).json({ total: total ?? 0, today: today ?? 0 });
});
