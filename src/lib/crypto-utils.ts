import crypto from "crypto";

/**
 * Constant-time comparison between two strings to prevent timing attacks.
 * Returns false if either string is empty, null, or undefined.
 */
export function timingSafeCompare(a?: string | null, b?: string | null): boolean {
  if (!a || !b) return false;

  const bufA = Buffer.from(a, "utf8");
  const bufB = Buffer.from(b, "utf8");

  if (bufA.length !== bufB.length) {
    return false;
  }

  return crypto.timingSafeEqual(bufA, bufB);
}
