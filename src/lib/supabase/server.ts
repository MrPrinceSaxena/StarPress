// src/lib/supabase/server.ts
import { createServerClient, type CookieOptions } from "@supabase/ssr";
import { cookies } from "next/headers";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://imfehlnarkbclnplhvuz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_3Oxh-fmrfNSWrEgLfhzUpQ_kKRQOvzW";

/**
 * Creates a server-side Supabase client bound to Next.js cookies.
 * For use in Server Components, Route Handlers, and Server Actions.
 */
export async function createClient() {
  const cookieStore = cookies();

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      get(name: string) {
        return cookieStore.get(name)?.value;
      },
      set(name: string, value: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value, ...options });
        } catch {
          // The `set` method was called from a Server Component.
          // Handled safely by middleware session refreshing.
        }
      },
      remove(name: string, options: CookieOptions) {
        try {
          cookieStore.set({ name, value: "", maxAge: 0, ...options });
        } catch {
          // The `delete` method was called from a Server Component.
        }
      },
    },
  });
}

/**
 * Validates the current authenticated user on the server.
 * Uses auth.getUser() which cryptographically verifies the session with Supabase Auth server.
 */
export async function getAuthenticatedUser() {
  try {
    const supabase = await createClient();
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (err) {
    console.error("[Supabase Server] Error getting authenticated user:", err);
    return null;
  }
}

/**
 * Normalized user session helper for API routes.
 * Maps Supabase user identity to application user contract.
 */
export async function getSessionUser() {
  const supabaseUser = await getAuthenticatedUser();
  if (!supabaseUser) return null;

  const email = supabaseUser.email || "";
  const metadata = supabaseUser.user_metadata || {};
  const appMetadata = supabaseUser.app_metadata || {};

  return {
    id: supabaseUser.id,
    email,
    name: metadata.name || metadata.full_name || (email ? email.split("@")[0] : "Customer"),
    phone: supabaseUser.phone || metadata.phone || null,
    role: appMetadata.role || metadata.role || "CUSTOMER",
  };
}

/**
 * Defense-in-depth server authorization check for Admin privileges.
 * NEVER trusts client-side metadata; verifies authoritative `app_metadata.role === 'ADMIN'`.
 */
export async function requireAdmin() {
  const user = await getAuthenticatedUser();
  if (!user) {
    return { authorized: false, error: "Unauthorized: No active session", user: null };
  }

  const role = user.app_metadata?.role;
  if (role !== "ADMIN") {
    return { authorized: false, error: "Forbidden: Administrative access required", user };
  }

  return { authorized: true, error: null, user };
}
