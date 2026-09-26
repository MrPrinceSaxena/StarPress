import { db } from "@/lib/db";

export interface UserInput {
  id: string;
  email?: string | null;
  name?: string | null;
  phone?: string | null;
  role?: string;
}

/**
 * Ensures an authenticated user (from Supabase Auth or NextAuth)
 * exists in Prisma PostgreSQL `User` table to guarantee foreign key integrity
 * for orders, addresses, reviews, and profile updates.
 */
export async function ensureDbUser(user: UserInput) {
  if (!user?.id) return null;
  const email = (user.email || "").toLowerCase().trim();

  try {
    // 1. Try finding by ID or Email
    const existing = await db.user.findFirst({
      where: email ? { OR: [{ id: user.id }, { email }] } : { id: user.id },
    });

    if (existing) {
      return existing;
    }

    if (!email) {
      return null;
    }

    // 2. Create the user record in Prisma
    const isAdmin =
      user.role === "ADMIN" ||
      email === "admin@starpress.in" ||
      email === "starpress.print@gmail.com" ||
      email === "mrdigitalmarketerpro@gmail.com" ||
      email.endsWith("@starpress.in");

    return await db.user.create({
      data: {
        id: user.id,
        email,
        name: user.name || email.split("@")[0] || "Customer",
        phone: user.phone || null,
        role: isAdmin ? "ADMIN" : "CUSTOMER",
      },
    });
  } catch (error) {
    console.warn("[ensureDbUser] Notice:", (error as any)?.message);
    return null;
  }
}
