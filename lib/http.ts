import type { VercelRequest, VercelResponse } from '@vercel/node';

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}

export function clientIp(req: VercelRequest): string {
  const f = req.headers['x-forwarded-for'];
  const first = Array.isArray(f) ? f[0] : f?.split(',')[0];
  return first?.trim() || 'unknown';
}

export function field(body: unknown, key: string, max = 200): string {
  const v = (body as Record<string, unknown> | null | undefined)?.[key];
  if (typeof v !== 'string' || v.length === 0 || v.length > max) {
    throw new HttpError(400, 'noto‘g‘ri so‘rov');
  }
  return v;
}

export function getCookie(req: VercelRequest, name: string): string | undefined {
  const pair = (req.headers.cookie ?? '')
    .split(';')
    .map((c) => c.trim())
    .find((c) => c.startsWith(`${name}=`));
  return pair?.slice(name.length + 1);
}

export function route(
  method: 'GET' | 'POST',
  fn: (req: VercelRequest, res: VercelResponse) => Promise<void>
) {
  return async (req: VercelRequest, res: VercelResponse) => {
    try {
      if (req.method !== method) throw new HttpError(405, 'method ruxsat etilmagan');
      if (method === 'POST' && !req.headers['content-type']?.includes('application/json')) {
        throw new HttpError(415, 'json kerak');
      }
      res.setHeader('Cache-Control', 'no-store');
      await fn(req, res);
    } catch (e) {
      if (e instanceof HttpError) {
        res.status(e.status).json({ error: e.message });
        return;
      }
      console.error('[admin]', e);
      res.status(500).json({ error: 'server xatosi' });
    }
  };
}
