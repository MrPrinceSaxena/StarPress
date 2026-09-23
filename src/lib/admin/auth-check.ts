import { NextRequest } from "next/server";
import { getAuthenticatedUser } from "@/lib/supabase/server";

export async function verifyAdminAccess(request?: NextRequest) {
  const user = await getAuthenticatedUser();
  
  if (user) {
    const isAdmin = user.app_metadata?.role === "ADMIN";
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
