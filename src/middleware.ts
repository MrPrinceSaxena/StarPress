import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const pathname = req.nextUrl.pathname;
    const token = req.nextauth.token;

    // Admin routes protection: must have role === "ADMIN"
    if (pathname.startsWith("/admin")) {
      if (token?.role !== "ADMIN") {
        const loginUrl = new URL("/login", req.url);
        loginUrl.searchParams.set("error", "AccessDenied");
        loginUrl.searchParams.set("callbackUrl", pathname);
        return NextResponse.redirect(loginUrl);
      }
    }

    return NextResponse.next();
  },
  {
    secret: process.env.NEXTAUTH_SECRET || "development-secret-key-32-chars-min",
    callbacks: {
      authorized: ({ token, req }) => {
        const pathname = req.nextUrl.pathname;
        // Require auth for /admin and /account
        if (pathname.startsWith("/admin") || pathname.startsWith("/account")) {
          return !!token;
        }
        return true;
      },
    },
    pages: {
      signIn: "/login",
    },
  }
);

export const config = {
  matcher: ["/admin/:path*", "/account/:path*"],
};
