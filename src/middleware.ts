// src/middleware.ts
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { updateSession } from "@/lib/supabase/middleware";

// Protected customer routes requiring standard authentication
const PROTECTED_CUSTOMER_ROUTES = [
  "/account",
  "/dashboard",
  "/orders",
  "/settings",
  "/saved-addresses",
];

// Customer authentication routes
const CUSTOMER_AUTH_ROUTES = [
  "/login",
  "/register",
  "/forgot-password",
  "/reset-password",
];

// Public e-commerce routes that should be redirected to main domain if hit on admin subdomain
const PUBLIC_STORE_ROUTES = [
  "/shop",
  "/cart",
  "/checkout",
  "/bulk-orders",
  "/custom-printing",
  "/categories",
  "/about",
  "/contact",
  "/privacy",
  "/terms",
  "/faq",
];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Refresh Supabase session and retrieve authenticated user
  const { response, user } = await updateSession(req);
  const isAuthenticated = !!user;
  const isAdmin = user?.app_metadata?.role === "ADMIN";

  // 2. Extract Host & Subdomain Detection
  const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const host = rawHost.toLowerCase().split(":")[0];
  const isAdminHost =
    host.startsWith("admin.") ||
    host === "admin" ||
    host.startsWith("admin-");

  // Helper: preserve refreshed cookies and query strings across all redirects
  const createRedirect = (destination: URL | string) => {
    const targetUrl = typeof destination === "string" ? new URL(destination, req.url) : destination;
    const redirectRes = NextResponse.redirect(targetUrl);
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return addSecurityHeaders(redirectRes);
  };

  // Helper: preserve refreshed cookies and query strings across internal rewrites
  const createRewrite = (destination: URL | string) => {
    const targetUrl = typeof destination === "string" ? new URL(destination, req.url) : destination;
    // Preserve existing search params if not explicitly overridden
    if (!targetUrl.search && req.nextUrl.search) {
      targetUrl.search = req.nextUrl.search;
    }
    const rewriteRes = NextResponse.rewrite(targetUrl);
    response.cookies.getAll().forEach((cookie) => {
      rewriteRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return addSecurityHeaders(rewriteRes);
  };

  // =========================================================================
  // SCENARIO A: Dedicated Admin Subdomain (admin.starpress.com / admin.localhost)
  // =========================================================================
  if (isAdminHost) {
    // A1. Root access ("/")
    if (pathname === "/" || pathname === "") {
      if (isAuthenticated && isAdmin) {
        const rewriteUrl = new URL("/admin/dashboard", req.url);
        rewriteUrl.search = req.nextUrl.search;
        return createRewrite(rewriteUrl);
      } else {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.search = req.nextUrl.search;
        return createRewrite(loginUrl);
      }
    }

    // A2. Subdomain login route ("/login")
    if (pathname === "/login") {
      if (isAuthenticated && isAdmin) {
        return createRedirect(new URL("/admin/dashboard", req.url));
      }
      return createRewrite(new URL("/admin/login", req.url));
    }

    // A3. All admin sections on subdomain (e.g. /dashboard, /orders, /products, /customers, etc.)
    const ADMIN_SUBDOMAIN_SECTIONS = [
      "dashboard", "orders", "products", "customers",
      "finances", "analytics", "marketing", "discounts",
      "content", "settings"
    ];

    const matchedSection = ADMIN_SUBDOMAIN_SECTIONS.find(
      (sec) => pathname === `/${sec}` || pathname.startsWith(`/${sec}/`)
    );

    if (matchedSection) {
      const dest = `/admin${pathname}`;
      if (isAuthenticated && isAdmin) {
        return createRewrite(new URL(dest, req.url));
      }
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return createRedirect(loginUrl);
    }

    // A4. Admin login page reverse guard
    if (pathname === "/admin/login") {
      if (isAuthenticated && isAdmin) {
        return createRedirect(new URL("/admin/dashboard", req.url));
      }
      return addSecurityHeaders(response);
    }

    // A5. Protect all /admin/* routes on the admin subdomain
    if (pathname.startsWith("/admin")) {
      if (!isAuthenticated || !isAdmin) {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return createRedirect(loginUrl);
      }
      return addSecurityHeaders(response);
    }

    // A6. Allow APIs and Auth callbacks through
    if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
      return addSecurityHeaders(response);
    }

    // A7. If a public store route is hit on the admin subdomain, redirect to main storefront
    if (PUBLIC_STORE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      const primaryHost = host.replace(/^admin\./, "").replace(/^admin-/, "");
      const proto = req.headers.get("x-forwarded-proto") || "https";
      const target = new URL(pathname + req.nextUrl.search, `${proto}://${primaryHost || "starpress.in"}`);
      return createRedirect(target);
    }

    return addSecurityHeaders(response);
  }

  // =========================================================================
  // SCENARIO B: Primary Customer Domain (starpress.com / localhost)
  // =========================================================================

  // B1. Admin portal requests on primary domain:
  // Redirect to admin.starpress.com if in production, or allow path-based fallback if configured / in dev
  const isProduction = process.env.NODE_ENV === "production" && host.includes("starpress");
  const allowPathFallback = process.env.FALLBACK_ADMIN_PATH === "true" || !isProduction;

  if (pathname.startsWith("/admin")) {
    // Enforce strict admin credentials on all /admin/* routes
    if (pathname !== "/admin/login") {
      if (!isAuthenticated) {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return createRedirect(loginUrl);
      }
      if (!isAdmin) {
        const redirectUrl = new URL("/account", req.url);
        redirectUrl.searchParams.set("error", "AccessDenied");
        return createRedirect(redirectUrl);
      }
    } else {
      // Visiting /admin/login while already authenticated as admin
      if (isAuthenticated && isAdmin) {
        return createRedirect(new URL("/admin/dashboard", req.url));
      }
    }
  }

  // B2. Protected Customer Routes Guard
  if (
    PROTECTED_CUSTOMER_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    if (!isAuthenticated) {
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return createRedirect(loginUrl);
    }
  }

  // B3. Customer Auth Routes Reverse Guard (/login & /register)
  if (
    CUSTOMER_AUTH_ROUTES.some(
      (route) => pathname === route || pathname.startsWith(`${route}/`)
    )
  ) {
    if (isAuthenticated) {
      // Standard customer redirect
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      if (
        callbackUrl &&
        !CUSTOMER_AUTH_ROUTES.some((route) => callbackUrl.startsWith(route))
      ) {
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

      return createRedirect(new URL("/account", req.url));
    }
  }

  // 4. Enforce Enterprise HTTP Security Headers
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
