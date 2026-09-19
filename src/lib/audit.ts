import { db } from "@/lib/db";

export type AuditAction =
  | "LOGIN_SUCCESS"
  | "LOGIN_FAILURE"
  | "ACCOUNT_LOCKED"
  | "ACCOUNT_UNLOCKED"
  | "LOGOUT"
  | "REGISTER"
  | "PASSWORD_CHANGE"
  | "PASSWORD_RESET_REQUEST"
  | "PASSWORD_RESET_SUCCESS"
  | "EMAIL_VERIFICATION_SENT"
  | "EMAIL_VERIFIED"
  | "TWO_FACTOR_ENABLED"
  | "TWO_FACTOR_DISABLED"
  | "SESSION_REVOKED";

export interface LogAuditParams {
  userId?: string | null;
  email: string;
  action: AuditAction;
  status: "SUCCESS" | "FAILURE";
  reason?: string | null;
  ipAddress?: string | null;
  userAgent?: string | null;
}

/**
 * Log an authentication event to the AuthAuditLog table asynchronously.
 * Safe against connection drops and will never crash the calling request.
 */
export async function logAuthEvent(params: LogAuditParams): Promise<void> {
  try {
    const { userId, email, action, status, reason, ipAddress, userAgent } = params;

    // Persist to Prisma
    await (db as any).authAuditLog.create({
      data: {
        userId: userId || undefined,
        email: email.trim().toLowerCase(),
        action,
        status,
        reason: reason || undefined,
        ipAddress: ipAddress || undefined,
        userAgent: userAgent ? userAgent.slice(0, 500) : undefined,
      },
    });
  } catch (error: any) {
    // In production, log to telemetry / standard output without breaking the user request
    console.error("[audit] Failed to write auth audit log:", error?.message || error);
  }
}
