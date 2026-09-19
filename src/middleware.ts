import { getToken } from "next-auth/jwt";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Protect /admin and /account routes
  if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
    try {
      const secret = process.env.NEXTAUTH_SECRET || "development-secret-key-32-chars-min";
      const token = await getToken({
        req,
        secret,
      });

      if (!token) {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }

      // Admin routes require ADMIN role
      if (pathname.startsWith("/admin") && token.role !== "ADMIN") {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("error", "AccessDenied");
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    } catch (error) {
      console.error("[middleware] Auth verification error:", error);
      const loginUrl = new URL("/login", req.url);
      loginUrl.searchParams.set("callbackUrl", pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
