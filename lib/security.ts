import { createHash, randomBytes, randomInt, scrypt as scryptCb, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scryptCb) as (pw: string, salt: Buffer, len: number) => Promise<Buffer>;
const KEYLEN = 64;

export async function hashPassword(pw: string): Promise<string> {
  const salt = randomBytes(16);
  const key = await scryptAsync(pw.normalize('NFKC'), salt, KEYLEN);
  return `scrypt$${salt.toString('hex')}$${key.toString('hex')}`;
}

export async function verifyPassword(pw: string, stored: string | null | undefined): Promise<boolean> {
  const [alg, saltHex = '', keyHex = ''] = (stored ?? `scrypt$${'00'.repeat(16)}$${'00'.repeat(KEYLEN)}`).split('$');
  const salt = Buffer.from(saltHex, 'hex');
  const expected = Buffer.from(keyHex, 'hex');
  const actual = await scryptAsync(pw.normalize('NFKC'), salt, KEYLEN);
  return stored != null && alg === 'scrypt' && expected.length === KEYLEN && timingSafeEqual(actual, expected);
}

export const sha256 = (s: string): string => createHash('sha256').update(s).digest('hex');
export const randomToken = (): string => randomBytes(32).toString('base64url');
export const newOtp = (): string => String(randomInt(0, 1_000_000)).padStart(6, '0');

export function safeEqual(a: string, b: string): boolean {
  const x = Buffer.from(a);
  const y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}
