// src/lib/supabase/admin.ts
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://your-project.supabase.co";
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || "";

/**
 * Privileged Supabase Admin Client using Service Role Key.
 *
 * CAUTION: NEVER expose this client or the service role key to the browser.
 * This client bypasses Row Level Security (RLS) and has full database / auth administrative privileges.
 */
export function getAdminClient() {
  if (!serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is not configured in environment variables.");
  }

  return createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * Authoritatively assign an administrative role to a user.
 * Writes directly to `app_metadata`, making it tamper-proof against client updates.
 */
export async function setAdminRole(userId: string) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role: "ADMIN" },
  });

  if (error) {
    console.error("[Supabase Admin] Failed to set admin role:", error);
    throw error;
  }

  return data.user;
}

/**
 * Revoke administrative role from a user.
 */
export async function revokeAdminRole(userId: string) {
  const adminClient = getAdminClient();
  const { data, error } = await adminClient.auth.admin.updateUserById(userId, {
    app_metadata: { role: "CUSTOMER" },
  });

  if (error) {
    console.error("[Supabase Admin] Failed to revoke admin role:", error);
    throw error;
  }

  return data.user;
}
