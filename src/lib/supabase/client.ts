// src/lib/supabase/client.ts
import { createBrowserClient } from "@supabase/ssr";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://imfehlnarkbclnplhvuz.supabase.co";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "sb_publishable_3Oxh-fmrfNSWrEgLfhzUpQ_kKRQOvzW";

export function isSupabaseConfigured(): boolean {
  return true;
}

/**
 * Creates or retrieves a singleton Supabase browser client.
 * Uses @supabase/ssr to store session state in secure cookies for Next.js App Router.
 */
let clientInstance: ReturnType<typeof createBrowserClient> | null = null;

export function createClient() {
  if (typeof window === "undefined") {
    return createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  if (!clientInstance) {
    clientInstance = createBrowserClient(supabaseUrl, supabaseAnonKey);
  }

  return clientInstance;
}

export const supabase = createClient();
