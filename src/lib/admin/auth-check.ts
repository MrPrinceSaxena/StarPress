import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export function isUserAdmin(user: { email?: string | null; app_metadata?: any; user_metadata?: any; role?: string } | null | undefined): boolean {
  if (!user) return false;
  if (user.role === "ADMIN") return true;
  if (user.app_metadata?.role === "ADMIN") return true;
  if (user.user_metadata?.role === "ADMIN") return true;

  const email = (user.email || "").toLowerCase().trim();
  if (!email) return false;
  if (email === "admin@starpress.in") return true;
  if (email === "starpress.print@gmail.com") return true;
  if (email === "mrdigitalmarketerpro@gmail.com") return true;
  if (email.endsWith("@starpress.in")) return true;

  const adminEnv = process.env.ADMIN_EMAILS || "";
  if (adminEnv) {
    const list = adminEnv.split(",").map((e) => e.trim().toLowerCase());
    if (list.includes(email)) return true;
  }

  return false;
}

export async function verifyAdminAccess(request?: NextRequest) {
  const user = await getAuthenticatedUser();

  if (user) {
    const isAdmin = isUserAdmin(user);
    if (isAdmin) {
      return { authorized: true, user };
    }
  }

  // In local development, permit admin panel access for development & local testing
  if (process.env.NODE_ENV !== "production") {
    return {
      authorized: true,
      user: user || { email: "admin@starpress.in", id: "dev-admin", name: "Star Press Admin" },
    };
  }

  if (!user) {
    return { authorized: false, status: 401, error: "Unauthorized: Admin session required." };
  }

  return { authorized: false, status: 403, error: "Forbidden: Star Press administrative privileges required." };
}
