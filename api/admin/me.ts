import { route } from '../../lib/http';
import { currentAdmin } from '../../lib/session';

export default route('GET', async (req, res) => {
  const admin = await currentAdmin(req);
  res.status(200).json({ email: admin.email });
});
