import { useCallback, useEffect, useRef, useState } from 'react';
import { getSession, onSessionChange } from '../services/session.js';

/** The current { user, token } session (or null); re-renders on sign-in/out. */
export function useSession() {
  const [session, setSessionState] = useState(getSession);
  useEffect(() => onSessionChange(setSessionState), []);
  return session;
}

/**
 * Runs an async loader with loading/error/data state and a manual retry.
 * Used by dashboard, history and any page that reads from the backend.
 */
export function useAsync(loader, deps = []) {
  const [state, setState] = useState({ loading: true, error: null, data: null });
  const [nonce, setNonce] = useState(0);
  const mounted = useRef(true);

  useEffect(() => {
    mounted.current = true;
    return () => {
      mounted.current = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    setState((prev) => ({ ...prev, loading: true, error: null }));

    Promise.resolve()
      .then(loader)
      .then((data) => {
        if (!active || !mounted.current) return;
        setState({ loading: false, error: null, data });
      })
      .catch((error) => {
        if (!active || !mounted.current) return;
        setState({ loading: false, error, data: null });
      });

    return () => {
      active = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [...deps, nonce]);

  const retry = useCallback(() => setNonce((n) => n + 1), []);

  return { ...state, retry };
}

/** Sets document.title while the component is mounted. */
export function useDocumentTitle(title) {
  useEffect(() => {
    const previous = document.title;
    document.title = title ? `${title} · ScamShield AI` : 'ScamShield AI';
    return () => {
      document.title = previous;
    };
  }, [title]);
}

/** Closes an overlay on Escape and returns a ref callback for focus. */
export function useEscapeKey(active, onClose) {
  useEffect(() => {
    if (!active) return undefined;
    const handler = (event) => {
      if (event.key === 'Escape') onClose?.();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [active, onClose]);
}
