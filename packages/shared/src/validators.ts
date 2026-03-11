/**
 * Validates an email address against RFC 5322 simplified pattern.
 * Covers the vast majority of real-world email formats.
 * @param email - The email string to validate
 * @returns true if the email is valid
 */
export function isValidEmail(email: string): boolean {
  if (!email || typeof email !== "string") return false;
  const pattern = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*\.[a-zA-Z]{2,}$/;
  return pattern.test(email.trim());
}

/**
 * Validates a US phone number. Accepts:
 * - (555) 123-4567
 * - 555-123-4567
 * - 5551234567
 * - +1 555 123 4567
 * - 1-555-123-4567
 * @param phone - The phone string to validate
 * @returns true if the phone number is valid
 */
export function isValidPhone(phone: string): boolean {
  if (!phone || typeof phone !== "string") return false;
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, "");
  // US numbers: 10 digits, or 11 digits starting with 1
  if (digits.length === 10) return true;
  if (digits.length === 11 && digits.startsWith("1")) return true;
  return false;
}

/**
 * Validates a US ZIP code. Accepts:
 * - 5-digit format (e.g., "90210")
 * - ZIP+4 format (e.g., "90210-1234")
 * @param zip - The ZIP code string to validate
 * @returns true if the ZIP code is valid
 */
export function isValidZip(zip: string): boolean {
  if (!zip || typeof zip !== "string") return false;
  const pattern = /^\d{5}(-\d{4})?$/;
  return pattern.test(zip.trim());
}
