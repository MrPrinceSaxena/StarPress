// src/app/auth/callback/route.ts
import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  const next = searchParams.get("next") || "/account";

  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      // Determine destination based on server-verified role
      const isAdmin = data.user.app_metadata?.role === "ADMIN";
      let destination = next;

      // If generic destination was provided, route admins directly to admin console
      if (destination === "/account" && isAdmin) {
        destination = "/admin/orders";
      }

      // Open redirect defense: Ensure relative path or same origin
      if (destination.startsWith("/") && !destination.startsWith("//")) {
        return NextResponse.redirect(`${origin}${destination}`);
      }

      try {
        const destUrl = new URL(destination, origin);
        if (destUrl.origin === origin) {
          return NextResponse.redirect(destUrl.toString());
        }
      } catch {
        // Fallback to safe destination
      }

      return NextResponse.redirect(`${origin}/account`);
    }
    console.error("[Auth Callback] Error exchanging code for session:", error);
  }

  // If code exchange fails, return user to login with error
  return NextResponse.redirect(`${origin}/login?error=OAuthCallbackError`);
}
