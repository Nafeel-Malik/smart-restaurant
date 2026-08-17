/** Shared phone format used across registration, addresses, and reservations. */
export const PHONE_REGEX = /^\+?[0-9][0-9\s\-()]{6,18}$/;

export const PHONE_REGEX_MESSAGE =
  'Phone must be 7–15 digits and may include spaces, dashes, or a leading +';

export function normalizePhone(value: string): string {
  return String(value || '').trim();
}

export function isValidPhone(value: string): boolean {
  return PHONE_REGEX.test(normalizePhone(value));
}
