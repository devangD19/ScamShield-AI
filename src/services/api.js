import axios from 'axios';
import { clearSession, getSession } from './session.js';

/**
 * Central Axios instance for every backend call.
 *
 * Base URL comes from VITE_API_BASE_URL (see .env.example). When it is not
 * set, development talks to the local backend and production builds use
 * the same origin they are served from (Flask serves the built app).
 * All requests are prefixed with /api/v1 and share one timeout.
 * The signed-in user's token is attached automatically.
 * Errors are normalised into a single ApiError shape so pages can
 * show friendly messages without ever faking a successful response.
 */

const configuredBaseUrl = import.meta.env.VITE_API_BASE_URL;

export const API_BASE_URL = (
  configuredBaseUrl !== undefined
    ? configuredBaseUrl
    : import.meta.env.DEV
      ? 'http://localhost:8000'
      : ''
).replace(/\/+$/, '');

export const API_TIMEOUT = Number(import.meta.env.VITE_API_TIMEOUT) || 15000;

export const CONNECTION_ERROR_MESSAGE =
  'Unable to connect to the analysis service. Please check that the backend is running and try again.';

export class ApiError extends Error {
  constructor(message, { kind = 'unknown', status = null, details = null } = {}) {
    super(message);
    this.name = 'ApiError';
    this.kind = kind; // 'network' | 'timeout' | 'http' | 'invalid' | 'cancelled'
    this.status = status;
    this.details = details;
  }
}

const client = axios.create({
  baseURL: `${API_BASE_URL}/api/v1`,
  timeout: API_TIMEOUT,
  headers: { 'Content-Type': 'application/json' },
});

client.interceptors.request.use((config) => {
  const token = getSession()?.token;
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

function messageForStatus(status, detail) {
  if (typeof detail === 'string' && detail.trim()) return detail;
  if (status === 400 || status === 422) {
    return 'The request was rejected by the analysis service. Please review the form fields and try again.';
  }
  if (status === 401 || status === 403) {
    return 'You are not authorised to perform this action. Please check your access and try again.';
  }
  if (status === 404) {
    return 'The requested record was not found. It may have been deleted already.';
  }
  if (status === 429) {
    return 'Too many requests were sent to the analysis service. Please wait a moment and try again.';
  }
  if (status >= 500) {
    return 'The analysis service hit an internal error. Please try again in a moment.';
  }
  return `The request failed with status ${status}.`;
}

/**
 * Performs a request and never resolves with an empty/bogus success.
 * Any failure is thrown as an ApiError with a human-readable message.
 */
export async function request(config) {
  try {
    const response = await client.request(config);
    const payload = response.data;

    // 204 No Content (e.g. DELETE) and empty string bodies are valid successes.
    if (response.status === 204 || payload === '' || payload === undefined) {
      return {};
    }

    if (payload === null || typeof payload !== 'object') {
      throw new ApiError('The analysis service returned an unreadable response.', {
        kind: 'invalid',
        status: response.status,
        details: payload,
      });
    }

    return payload;
  } catch (error) {
    if (error instanceof ApiError) throw error;

    if (axios.isCancel?.(error) || error.code === 'ERR_CANCELED') {
      throw new ApiError('The request was cancelled.', { kind: 'cancelled' });
    }

    if (error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT') {
      throw new ApiError(
        'The analysis service took too long to respond. Please check your connection and try again.',
        { kind: 'timeout' }
      );
    }

    if (error.response) {
      const { status, data } = error.response;
      const detail = data?.detail ?? data?.message;

      // Expired/invalid session: sign out and send the user to the login page.
      if (status === 401 && getSession()) {
        clearSession();
        if (!window.location.pathname.startsWith('/login')) {
          window.location.assign('/login?expired=1');
        }
      }

      throw new ApiError(messageForStatus(status, detail), {
        kind: 'http',
        status,
        details: data,
      });
    }

    // No response at all: server down, wrong URL, CORS, offline.
    throw new ApiError(CONNECTION_ERROR_MESSAGE, { kind: 'network' });
  }
}

export function isConnectionError(error) {
  return (
    error instanceof ApiError && (error.kind === 'network' || error.kind === 'timeout')
  );
}

/** Extracts a safe, human-readable message from any thrown value. */
export function toUserMessage(error, fallback = 'Something went wrong. Please try again.') {
  if (error instanceof ApiError) return error.message;
  if (error?.message && typeof error.message === 'string') return error.message;
  return fallback;
}

export default client;
