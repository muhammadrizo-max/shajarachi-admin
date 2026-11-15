const loaders = {
  'lib/http': () => import('../lib/http'),
  'lib/security': () => import('../lib/security'),
  'lib/supabase': () => import('../lib/supabase'),
  'lib/session': () => import('../lib/session'),
  'lib/login-guard': () => import('../lib/login-guard'),
  'lib/mailer': () => import('../lib/mailer'),
  'lib/otp': () => import('../lib/otp'),
  'lib/telegram': () => import('../lib/telegram'),
  'api/auth/login': () => import('./auth/login'),
  'api/auth/verify': () => import('./auth/verify'),
  'api/auth/telegram': () => import('./auth/telegram'),
  'api/auth/logout': () => import('./auth/logout'),
  'api/admin/me': () => import('./admin/me'),
  'api/admin/stats': () => import('./admin/stats'),
  'api/admin/messages': () => import('./admin/messages'),
};

export default async function handler(req, res) {
  const result = {};
  for (const [name, load] of Object.entries(loaders)) {
    try {
      await load();
      result[name] = 'ok';
    } catch (e) {
      result[name] = `ERROR: ${(e && e.message) || String(e)}`.slice(0, 400);
    }
  }
  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(result);
}
