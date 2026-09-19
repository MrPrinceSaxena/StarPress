import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Protect /admin and /account routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
    try {
      const secret = process.env.NEXTAUTH_SECRET || "fallback-secret-development-key-32-chars";
      const token = await getToken({
        req,
        secret,
      });

      if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return addSecurityHeaders(NextResponse.redirect(loginUrl));
      }

      // Admin routes require ADMIN role
      if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("error", "AccessDenied");
        loginUrl.searchParams.set("callbackUrl", pathname);
        return addSecurityHeaders(NextResponse.redirect(loginUrl));
      }
    } catch (error) {
      console.error("[middleware] Auth verification error:", error);
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return addSecurityHeaders(NextResponse.redirect(loginUrl));
    }
  }

  // 2. Add Comprehensive Security Headers to all passing responses
  const response = NextResponse.next();
  return addSecurityHeaders(response);
}

/**
 * Apply Enterprise HTTP Security Headers
 */
function addSecurityHeaders(response: NextResponse): NextResponse {
  // Enforce HTTPS with HSTS
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=63072000; includeSubDomains; preload"
  );

  // Prevent Clickjacking
  response.headers.set("X-Frame-Options", "SAMEORIGIN");

  // Prevent MIME-sniffing
  response.headers.set("X-Content-Type-Options", "nosniff");

  // Strict Referrer Policy
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Restrict unneeded browser features
  response.headers.set(
    "Permissions-Policy",
    "camera=(), microphone=(), geolocation=(), payment=(self)"
  );

  // Basic XSS defense
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("X-DNS-Prefetch-Control", "on");

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files with extensions (.svg, .png, .jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
