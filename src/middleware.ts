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

/**
 * Robust domain & subdomain resolution helper.
 * Prevents double-subdomains (e.g. admin.www.starpress.in) and
 * determines canonical URLs for both the Storefront and the dedicated Admin portal.
 */
function resolveDomains(rawHost: string) {
  const host = rawHost.toLowerCase().split(":")[0];

  // 1. Local development
  if (host.includes("localhost") || host === "127.0.0.1") {
    const isAdminHost = host.startsWith("admin.") || host === "admin";
    return {
      host,
      isAdminHost,
      adminUrl: "http://localhost:3000/admin",
      storeUrl: "http://localhost:3000",
    };
  }

  // 2. Vercel Preview deployments (*.vercel.app)
  if (host.endsWith(".vercel.app")) {
    const isAdminHost = host.startsWith("admin.") || host.startsWith("admin-");
    return {
      host,
      isAdminHost,
      adminUrl: `https://${host}/admin`,
      storeUrl: `https://${host}`,
    };
  }

  // 3. Production custom domains (e.g. starpress.in, www.starpress.in, admin.starpress.in)
  // Clean root domain by stripping any prefixes
  const rootDomain = host
    .replace(/^admin\.www\./, "")
    .replace(/^www\.admin\./, "")
    .replace(/^admin\./, "")
    .replace(/^www\./, "");

  const isAdminHost = host === `admin.${rootDomain}` || (host.startsWith("admin.") && !host.startsWith("admin.www."));

  return {
    host,
    isAdminHost,
    adminUrl: isAdminHost ? `https://${host}` : `https://www.${rootDomain}/admin`,
    storeUrl: `https://www.${rootDomain}`,
  };
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // 1. Refresh Supabase session and retrieve authenticated user
  const { response, user } = await updateSession(req);
  const isAuthenticated = !!user;
  const isAdmin = user?.app_metadata?.role === "ADMIN";

  // 2. Extract and resolve domain details
  const rawHost = req.headers.get("x-forwarded-host") || req.headers.get("host") || "";
  const { host, isAdminHost, adminUrl, storeUrl } = resolveDomains(rawHost);

  // Helper: preserve refreshed cookies and query strings across all redirects (no-cache headers to prevent browser caching)
  const createRedirect = (destination: URL | string) => {
    const targetUrl = typeof destination === "string" ? new URL(destination, req.url) : destination;
    const redirectRes = NextResponse.redirect(targetUrl);
    redirectRes.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
    redirectRes.headers.set("Pragma", "no-cache");
    redirectRes.headers.set("Expires", "0");
    response.cookies.getAll().forEach((cookie) => {
      redirectRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return addSecurityHeaders(redirectRes);
  };

  // Helper: preserve refreshed cookies and query strings across internal rewrites
  const createRewrite = (destination: URL | string) => {
    const targetUrl = typeof destination === "string" ? new URL(destination, req.url) : destination;
    if (!targetUrl.search && req.nextUrl.search) {
      targetUrl.search = req.nextUrl.search;
    }
    const rewriteRes = NextResponse.rewrite(targetUrl);
    response.cookies.getAll().forEach((cookie) => {
      rewriteRes.cookies.set(cookie.name, cookie.value, cookie);
    });
    return addSecurityHeaders(rewriteRes);
  };

  // Fix any legacy/cached admin.www. or www.admin. requests immediately
  if (host.startsWith("admin.www.") || host.startsWith("www.admin.")) {
    const proto = req.headers.get("x-forwarded-proto") || "https";
    const cleanHost = host.replace(/^(admin\.www\.|www\.admin\.)/, "");
    return NextResponse.redirect(new URL(`${proto}://${cleanHost}/admin${pathname.replace(/^\/admin/, "")}${req.nextUrl.search}`), {
      status: 301,
      headers: { "Cache-Control": "no-store, no-cache, must-revalidate" },
    });
  }

  // =========================================================================
  // SCENARIO A: Dedicated Admin Subdomain (e.g. admin.starpress.in)
  // Activated ONLY when DNS points directly to the admin subdomain.
  // =========================================================================
  if (isAdminHost) {
    // A1. Root access ("/")
    if (pathname === "/" || pathname === "") {
      if (isAuthenticated && isAdmin) {
        return createRewrite(new URL("/admin/dashboard", req.url));
      } else {
        return createRewrite(new URL("/admin/login", req.url));
      }
    }

    // A2. Subdomain login route ("/login")
    if (pathname === "/login") {
      if (isAuthenticated && isAdmin) {
        return createRedirect(new URL("/admin/dashboard", req.url));
      }
      return createRewrite(new URL("/admin/login", req.url));
    }

    // A3. All admin sections on subdomain (e.g. /dashboard, /orders, /products, etc.)
    const ADMIN_SUBDOMAIN_SECTIONS = [
      "dashboard", "orders", "products", "customers",
      "finances", "analytics", "marketing", "discounts",
      "content", "settings"
    ];

    const matchedSection = ADMIN_SUBDOMAIN_SECTIONS.find(
      (sec) => pathname === `/${sec}` || pathname.startsWith(`/${sec}/`)
    );

    if (matchedSection) {
      if (!isAuthenticated) {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return createRedirect(loginUrl);
      }
      if (!isAdmin) {
        return createRedirect(new URL(`${storeUrl}/account?error=AccessDenied`));
      }
      return createRewrite(new URL(`/admin${pathname}`, req.url));
    }

    // A4. Direct /admin/* routes on the admin subdomain
    if (pathname.startsWith("/admin")) {
      if (pathname === "/admin/login") {
        if (isAuthenticated && isAdmin) {
          return createRedirect(new URL("/admin/dashboard", req.url));
        }
        return addSecurityHeaders(response);
      }

      if (!isAuthenticated) {
        const loginUrl = new URL("/admin/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return createRedirect(loginUrl);
      }
      if (!isAdmin) {
        return createRedirect(new URL(`${storeUrl}/account?error=AccessDenied`));
      }
      return addSecurityHeaders(response);
    }

    // A5. Allow APIs and Auth callbacks through
    if (pathname.startsWith("/api") || pathname.startsWith("/auth")) {
      return addSecurityHeaders(response);
    }

    // A6. If a public customer storefront route is hit on the admin subdomain, bounce to primary store
    if (PUBLIC_STORE_ROUTES.some((route) => pathname === route || pathname.startsWith(`${route}/`))) {
      return createRedirect(new URL(pathname + req.nextUrl.search, storeUrl));
    }

    return addSecurityHeaders(response);
  }

  // =========================================================================
  // SCENARIO B: Primary Storefront Domain (starpress.in, www.starpress.in, localhost)
  // Direct path-based admin access (/admin/*).
  // PERMANENT FIX: Never redirect /admin to a subdomain (e.g. admin.starpress.in)
  // which causes DNS_PROBE_FINISHED_NXDOMAIN when DNS is not configured.
  // =========================================================================

  // B1. Admin portal requests on storefront domain:
  // Handled directly under /admin on the current domain with strict authentication.
  if (pathname.startsWith("/admin")) {
    // Root /admin or /admin/
    if (pathname === "/admin" || pathname === "/admin/") {
      if (isAuthenticated && isAdmin) {
        return createRedirect(new URL("/admin/dashboard", req.url));
      }
      return createRedirect(new URL("/admin/login", req.url));
    }

    // Admin login route (/admin/login)
    if (pathname === "/admin/login") {
      if (isAuthenticated && isAdmin) {
        return createRedirect(new URL("/admin/dashboard", req.url));
      }
      return addSecurityHeaders(response);
    }

    // Protected admin routes (/admin/dashboard, /admin/orders, /admin/products, etc.)
    if (!isAuthenticated) {
      const loginUrl = new URL("/admin/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return createRedirect(loginUrl);
    }

    // In production, block non-admin authenticated users
    if (!isAdmin && process.env.NODE_ENV === "production") {
      return createRedirect(new URL("/account?error=AccessDenied", req.url));
    }

    return addSecurityHeaders(response);
  }

  // B2. Protected Customer Routes Guard (/account, /orders, /settings, etc.)
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
      const callbackUrl = req.nextUrl.searchParams.get("callbackUrl");
      if (
        callbackUrl &&
        !CUSTOMER_AUTH_ROUTES.some((route) => callbackUrl.startsWith(route)) &&
        !callbackUrl.startsWith("/admin")
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
