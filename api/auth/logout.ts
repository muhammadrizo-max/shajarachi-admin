import { route } from '../../lib/http';
import { endSession } from '../../lib/session';

export default route('POST', async (req, res) => {
  await endSession(req, res);
  res.status(200).json({ ok: true });
});
