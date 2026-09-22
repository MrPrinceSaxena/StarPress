import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import type { EmailOtpType } from "@supabase/supabase-js";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const searchParams = requestUrl.searchParams;

  // Resolve true public origin from reverse proxy headers (Vercel strips external origin from request.url)
  const forwardedHost = request.headers.get("x-forwarded-host");
  const forwardedProto = request.headers.get("x-forwarded-proto") || "https";
  const host = forwardedHost || request.headers.get("host");

  let origin = host
    ? `${forwardedProto}://${host}`
    : process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || requestUrl.origin;

  // Safeguard: Never redirect to localhost in production environments
  if (origin.includes("localhost") && (process.env.NODE_ENV === "production" || process.env.VERCEL)) {
    origin = process.env.NEXT_PUBLIC_APP_URL?.replace(/\/$/, "") || "https://star-press.vercel.app";
  }

  const code = searchParams.get("code");
  const token_hash = searchParams.get("token_hash");
  const type = searchParams.get("type") as EmailOtpType | null;
  const next = searchParams.get("next") || "/account";
  const errorMsg = searchParams.get("error_description") || searchParams.get("error");

  if (errorMsg) {
    console.error("[Auth Callback] Incoming error param:", errorMsg);
    return NextResponse.redirect(`${origin}/login?error=${encodeURIComponent(errorMsg)}`);
  }

  // 1. Handle PKCE authorization code exchange (Google OAuth & standard PKCE)
  if (code) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.exchangeCodeForSession(code);

    if (!error && data?.user) {
      const isAdmin = data.user.app_metadata?.role === "ADMIN";
      let destination = next;

      if (destination === "/account" && isAdmin) {
        destination = "/admin/dashboard";
      }

      if (destination.startsWith("/") && !destination.startsWith("//")) {
        return NextResponse.redirect(`${origin}${destination}`);
      }

      try {
        const destUrl = new URL(destination, origin);
        if (destUrl.origin === origin) {
          return NextResponse.redirect(destUrl.toString());
        }
      } catch {}

      return NextResponse.redirect(`${origin}/account`);
    }
    console.error("[Auth Callback] Error exchanging code for session:", error);
  }

  // 2. Handle email verification OTP token_hash flow
  if (token_hash && type) {
    const supabase = await createClient();
    const { data, error } = await supabase.auth.verifyOtp({ token_hash, type });

    if (!error && data?.user) {
      return NextResponse.redirect(`${origin}${next.startsWith("/") ? next : "/account"}`);
    }
    console.error("[Auth Callback] Error verifying OTP token_hash:", error);
  }

  // If code / OTP exchange fails, return user to login with error
  return NextResponse.redirect(`${origin}/login?error=OAuthCallbackError`);
}
