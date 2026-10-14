/**
 * The signed-in session ({ user, token }) returned by the backend.
 *
 * Kept in sessionStorage, so it ends when the browser tab closes.
 * Passwords are never stored.
 */

const SESSION_KEY = 'scamshield.session';
const listeners = new Set();

export function getSession() {
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    const session = raw ? JSON.parse(raw) : null;
    return session?.user && session?.token ? session : null;
  } catch {
    return null;
  }
}

export function setSession(session) {
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
  } catch {
    /* storage unavailable — the user will simply need to sign in again */
  }
  listeners.forEach((listener) => listener(session));
}

export function clearSession() {
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch {
    /* storage unavailable — nothing to clear */
  }
  listeners.forEach((listener) => listener(null));
}

/** Subscribe to sign-in / sign-out changes. Returns an unsubscribe function. */
export function onSessionChange(listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
