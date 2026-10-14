import { request } from './api.js';
import { clearSession, getSession, setSession } from './session.js';

/**
 * Authentication API
 *
 * POST /api/v1/auth/register  { full_name, email, password } -> { user }
 * POST /api/v1/auth/login     { email, password }            -> { user, token }
 *
 * Passwords are sent to the backend only and never persisted by the
 * frontend - only the returned { user, token } session is kept.
 */

export { getSession, clearSession };

export async function login({ email, password }) {
  const data = await request({
    method: 'post',
    url: '/auth/login',
    data: { email: email.trim(), password },
  });
  if (!data?.user || typeof data?.token !== 'string') {
    throw new Error('The sign-in service returned an unexpected response.');
  }
  const session = { user: data.user, token: data.token };
  setSession(session);
  return session;
}

export async function register({ fullName, email, password }) {
  return request({
    method: 'post',
    url: '/auth/register',
    data: { full_name: fullName.trim(), email: email.trim(), password },
  });
}

/** Tokens are stateless, so signing out only forgets the local session. */
export function logout() {
  clearSession();
}
