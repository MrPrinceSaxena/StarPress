import { z } from "zod";

/**
 * Enterprise Password Complexity Policy:
 * - Minimum 12 characters
 * - At least 1 uppercase letter ([A-Z])
 * - At least 1 lowercase letter ([a-z])
 * - At least 1 digit ([0-9])
 * - At least 1 special symbol ([!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?])
 */

export const PASSWORD_MIN_LENGTH = 12;

export interface PasswordEvaluation {
  isValid: boolean;
  score: number; // 0 (empty) to 4 (enterprise)
  strength: "weak" | "fair" | "good" | "strong";
  errors: string[];
}

export function evaluatePassword(password: string): PasswordEvaluation {
  const errors: string[] = [];

  if (!password || password.length < PASSWORD_MIN_LENGTH) {
    errors.push(`Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`);
  }
  if (!/[A-Z]/.test(password)) {
    errors.push("Password must contain at least one uppercase letter (A-Z).");
  }
  if (!/[a-z]/.test(password)) {
    errors.push("Password must contain at least one lowercase letter (a-z).");
  }
  if (!/[0-9]/.test(password)) {
    errors.push("Password must contain at least one number (0-9).");
  }
  if (!/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) {
    errors.push("Password must contain at least one special character (!@#$%^&*...).");
  }

  // Calculate score based on met conditions
  let criteriaMet = 0;
  if (password.length >= PASSWORD_MIN_LENGTH) criteriaMet++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) criteriaMet++;
  if (/[0-9]/.test(password)) criteriaMet++;
  if (/[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/.test(password)) criteriaMet++;

  let strength: "weak" | "fair" | "good" | "strong" = "weak";
  if (criteriaMet === 4 && password.length >= 14) strength = "strong";
  else if (criteriaMet >= 3) strength = "good";
  else if (criteriaMet >= 2) strength = "fair";

  return {
    isValid: errors.length === 0,
    score: criteriaMet,
    strength,
    errors,
  };
}

export const strongPasswordSchema = z
  .string()
  .min(PASSWORD_MIN_LENGTH, `Password must be at least ${PASSWORD_MIN_LENGTH} characters long.`)
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter (A-Z).")
  .regex(/[a-z]/, "Password must contain at least one lowercase letter (a-z).")
  .regex(/[0-9]/, "Password must contain at least one number (0-9).")
  .regex(
    /[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]/,
    "Password must contain at least one special character (!@#$%^&*...)."
  );

export const registerSchema = z.object({
  name: z
    .string()
    .min(2, "Name must be at least 2 characters.")
    .max(80, "Name cannot exceed 80 characters.")
    .trim(),
  email: z
    .string()
    .email("Please provide a valid corporate or personal email address.")
    .max(120, "Email cannot exceed 120 characters.")
    .trim()
    .toLowerCase(),
  password: strongPasswordSchema,
  phone: z
    .string()
    .regex(/^[0-9+ -]{10,15}$/, "Please enter a valid phone number (10-15 digits).")
    .optional()
    .or(z.literal("")),
});

export const loginSchema = z.object({
  email: z.string().email("Please provide a valid email address.").trim().toLowerCase(),
  password: z.string().min(1, "Password is required."),
});

export const passwordResetRequestSchema = z.object({
  email: z.string().email("Please provide a valid email address.").trim().toLowerCase(),
});

export const passwordResetConfirmSchema = z.object({
  token: z.string().min(16, "Invalid or missing reset token."),
  newPassword: strongPasswordSchema,
});
