import crypto from 'crypto';
import { cookies } from 'next/headers';

const COOKIE_NAME = 'nnn_admin';
const SESSION_VALUE = 'admin-session';
const MAX_AGE_SECONDS = 60 * 60 * 8; // 8 hours

function getSecret() {
  // Falls back to a dev-only value so `npm run dev` works before you've set
  // up .env.local. Set SESSION_SECRET yourself before deploying anywhere real.
  return process.env.SESSION_SECRET || 'dev-secret-do-not-use-in-production';
}

function sign(value) {
  return crypto.createHmac('sha256', getSecret()).update(value).digest('hex');
}

export function isAdminAuthenticated() {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return false;
  const expected = sign(SESSION_VALUE);
  // Constant-time comparison so response timing can't leak the token.
  const a = Buffer.from(token);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return crypto.timingSafeEqual(a, b);
}

export function setAdminCookie() {
  cookies().set(COOKIE_NAME, sign(SESSION_VALUE), {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: MAX_AGE_SECONDS,
  });
}

export function clearAdminCookie() {
  cookies().delete(COOKIE_NAME);
}
