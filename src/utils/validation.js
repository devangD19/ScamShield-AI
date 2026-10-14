/**
 * Shared client-side validation helpers.
 * Validation only improves messaging - the backend remains authoritative.
 */

export const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateEmail(value) {
  const email = (value || '').trim();
  if (!email) return 'Email address is required.';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address.';
  return '';
}

export function validateOptionalEmail(value) {
  const email = (value || '').trim();
  if (!email) return '';
  if (!EMAIL_PATTERN.test(email)) return 'Enter a valid email address, or leave this blank.';
  return '';
}

export function validateRequired(value, label) {
  if (!value || !String(value).trim()) return `${label} is required.`;
  return '';
}

export function passwordIssues(value) {
  const password = value || '';
  if (!password) return 'Password is required.';
  if (password.length < 8) return 'Password must be at least 8 characters long.';
  if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
    return 'Password must contain at least one letter and one number.';
  }
  return '';
}
