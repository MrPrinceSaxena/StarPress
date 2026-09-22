// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Routes that require authentication
const PROTECTED_ROUTES = [
  "/account",
  "/admin",
  "/dashboard",
  "/orders",
  "/settings",
  "/saved-addresses",
];

// Routes that authenticated users should not access
const AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Refresh Supabase session and retrieve authenticated user
  const { response, user } = await updateSession(req);
  const isAuthenticated = !!user;
  const isAdmin = user?.app_metadata?.role === "ADMIN";

  // Helper to preserve refreshed cookies across all redirects
  const createRedirect = (url: URL | string) => {
    const redirectRes = NextResponse.redirect(url);
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return addSecurityHeaders(redirectRes);
  };

  // 2. Protected Routes Guard
  if (PROTECTED_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return createRedirect(loginUrl);
    }

    // Defense-in-depth: Admin routes require server-validated app_metadata.role
    if (pathname.startsWith("/admin") && !isAdmin) {
      const redirectUrl = new URL("/account", req.url);
      redirectUrl.searchParams.set("error", "AccessDenied");
      return createRedirect(redirectUrl);
    }
  }

  // 3. Auth Routes Reverse Guard (Redirect authenticated users away from /login & /register)
  if (AUTH_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
    if (isAuthenticated) {
      const destination = isAdmin ? "/admin/orders" : "/account";

      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      if (callbackUrl && !AUTH_ROUTES.some((route) => callbackUrl.startsWith(route))) {
        try {
          const parsedCallback = new URL(callbackUrl, req.url);
          if (parsedCallback.origin === req.nextUrl.origin) {
            return createRedirect(parsedCallback);
          }
        } catch {
          if (callbackUrl.startsWith("/")) {
            return createRedirect(new URL(callbackUrl, req.url));
          }
        }
      }

      return createRedirect(new URL(destination, req.url));
    }
  }

  // 4. Inforce Enterprise HTTP Security Headers
  return addSecurityHeaders(response);
}

/**
 * Apply Enterprise HTTP Security Headers
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );
  response.headers.set("X-Frame-Options", "SAMEORIGIN");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - images/ and media static assets
     */
    "/((?!_next/static|_next/image|favicon.ico|images/|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
