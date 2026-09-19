import { NextAuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import bcrypt from "bcryptjs";
import { randomUUID } from "crypto";
import { db } from "@/lib/db";
import { env } from "@/lib/env";
import { Role } from "@prisma/client";
import { logAuthEvent } from "@/lib/audit";

if (!process.env.NEXTAUTH_URL) {
  process.env.NEXTAUTH_URL = process.env.VERCEL_URL
    ? `https://${process.env.VERCEL_URL}`
    : env.NEXTAUTH_URL || "http://localhost:3000";
}

if (!process.env.NEXTAUTH_SECRET) {
  process.env.NEXTAUTH_SECRET = env.NEXTAUTH_SECRET || "fallback-secret-development-key-32-chars";
}

// Account lockout settings
const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION_MINUTES = 15;
const LOCKOUT_DURATION_MS = LOCKOUT_DURATION_MINUTES * 60 * 1000;

export const authOptions: NextAuthOptions = {
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  secret: process.env.NEXTAUTH_SECRET,
  pages: {
    signIn: "/login",
    error: "/login",
  },
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials, req) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Please provide your email and password.");
        }

        const normalizedEmail = credentials.email.trim().toLowerCase();

        // Extract client IP and user agent if forwarded in headers
        const forwardedFor = (req as any)?.headers?.["x-forwarded-for"];
        const ipAddress = forwardedFor ? forwardedFor.split(",")[0].trim() : "127.0.0.1";
        const userAgent = (req as any)?.headers?.["user-agent"] || "unknown";

        try {
          const user = await db.user.findUnique({
            where: { email: normalizedEmail },
          });

          // Constant-time execution defense against user enumeration timing attacks
          if (!user || !user.passwordHash) {
            // Fake compare to mitigate timing attacks
            await bcrypt.compare(
              credentials.password,
              "$2a$12$e8rX9Yx/qJv5yZz3YQWp.On78OqYq8bQGzQo.c61yVp1W0qG0F8x6"
            );
            await logAuthEvent({
              email: normalizedEmail,
              action: "LOGIN_FAILURE",
              status: "FAILURE",
              reason: "User not found or uncredentialed",
              ipAddress,
              userAgent,
            });
            throw new Error("Invalid email or password.");
          }

          // 1. Account Lockout Check
          const now = new Date();
          if (user.lockedUntil && user.lockedUntil > now) {
            const minutesRemaining = Math.ceil(
              (user.lockedUntil.getTime() - now.getTime()) / (60 * 1000)
            );
            await logAuthEvent({
              userId: user.id,
              email: user.email,
              action: "ACCOUNT_LOCKED",
              status: "FAILURE",
              reason: `Attempted login on locked account (${minutesRemaining}m remaining)`,
              ipAddress,
              userAgent,
            });
            throw new Error(
              `Account temporarily locked due to ${MAX_FAILED_ATTEMPTS} consecutive failed attempts. Please try again in ${minutesRemaining} minute${
                minutesRemaining === 1 ? "" : "s"
              } or reset your password.`
            );
          }

          // 2. Cryptographic Password Verification
          const isPasswordValid = await bcrypt.compare(
            credentials.password,
            user.passwordHash
          );

          if (!isPasswordValid) {
            const newFailedAttempts = (user.failedLoginAttempts || 0) + 1;
            const isNowLocked = newFailedAttempts >= MAX_FAILED_ATTEMPTS;
            const lockedUntilDate = isNowLocked ? new Date(now.getTime() + LOCKOUT_DURATION_MS) : null;

            await db.user.update({
              where: { id: user.id },
              data: {
                failedLoginAttempts: newFailedAttempts,
                lockedUntil: lockedUntilDate,
              },
            });

            await logAuthEvent({
              userId: user.id,
              email: user.email,
              action: isNowLocked ? "ACCOUNT_LOCKED" : "LOGIN_FAILURE",
              status: "FAILURE",
              reason: isNowLocked
                ? `Account locked after ${newFailedAttempts} failed attempts`
                : `Incorrect password (attempt ${newFailedAttempts}/${MAX_FAILED_ATTEMPTS})`,
              ipAddress,
              userAgent,
            });

            if (isNowLocked) {
              throw new Error(
                `Too many failed attempts. Your account has been locked for ${LOCKOUT_DURATION_MINUTES} minutes for security.`
              );
            }

            throw new Error("Invalid email or password.");
          }

          // 3. Login Successful: Reset Lockout & Record Login
          await db.user.update({
            where: { id: user.id },
            data: {
              failedLoginAttempts: 0,
              lockedUntil: null,
              lastLoginAt: now,
              lastLoginIp: ipAddress,
            },
          });

          await logAuthEvent({
            userId: user.id,
            email: user.email,
            action: "LOGIN_SUCCESS",
            status: "SUCCESS",
            ipAddress,
            userAgent,
          });

          return {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            phone: user.phone,
          };
        } catch (authError: any) {
          // Re-throw user-facing authentication errors directly
          if (
            authError.message.includes("Invalid email or password.") ||
            authError.message.includes("Account temporarily locked") ||
            authError.message.includes("Too many failed attempts") ||
            authError.message.includes("Please provide your email and password.")
          ) {
            throw authError;
          }

          console.error("[auth] Database error during credential authentication:", authError);
          throw new Error("Authentication service is temporarily unavailable. Please try again shortly.");
        }
      },
    }),

    // Optional Google OAuth (Only registered if client credentials are provided in environment)
    ...(process.env.GOOGLE_CLIENT_ID && process.env.GOOGLE_CLIENT_SECRET
      ? [
          GoogleProvider({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
          }),
        ]
      : []),
  ],
  callbacks: {
    async jwt({ token, user }) {
      const nowEpoch = Math.floor(Date.now() / 1000);

      if (user) {
        token.id = user.id;
        token.role = (user as any).role;
        token.phone = (user as any).phone;
        token.iat = nowEpoch;
        token.jti = randomUUID();
      }

      // Token Rotation: Refresh token identifier every 1 hour (3600 seconds)
      const tokenAge = nowEpoch - ((token.iat as number) || nowEpoch);
      if (tokenAge > 3600) {
        token.iat = nowEpoch;
        token.jti = randomUUID();
      }

      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        session.user.id = token.id as string;
        session.user.role = token.role as Role;
        session.user.phone = token.phone as string | null;
      }
      return session;
    },
  },
};
