import { PrismaClient } from "@prisma/client";

// Prevents creating a new PrismaClient on every hot-reload in dev
// (standard Next.js + Prisma pattern).
const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const db = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = db;
}
