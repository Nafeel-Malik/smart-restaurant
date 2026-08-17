/** Mirrors backend phone.util — keep formats in sync. */
export const PHONE_REGEX = /^\+?[0-9][0-9\s\-()]{6,18}$/

export const PHONE_ERROR_REQUIRED = 'Phone number is required'
export const PHONE_ERROR_FORMAT =
  'Phone must be 7–15 digits and may include spaces, dashes, or a leading +'

export function validatePhone(value) {
  const trimmed = String(value || '').trim()
  if (!trimmed) return PHONE_ERROR_REQUIRED
  if (!PHONE_REGEX.test(trimmed)) return PHONE_ERROR_FORMAT
  return ''
}

export function hasPhone(value) {
  return Boolean(String(value || '').trim())
}
