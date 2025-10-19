// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/debug",
  "/api/auth/callback",
  "/preview-check",
  "/api/health",
  "/api/runtime",
  "/favicon.ico",
];

const PROTECT_PREFIXES = ["/trainee", "/instructor", "/committee"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Let Next internals & public routes straight through
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/assets") ||
    pathname.startsWith("/images") ||
    pathname.startsWith("/fonts") ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return NextResponse.next();
  }

  const needsAuth = PROTECT_PREFIXES.some((p) => pathname.startsWith(p));
  if (!needsAuth) return NextResponse.next(); // no auth check needed

  const res = NextResponse.next();

  // Use getAll/setAll so Supabase can refresh/rotate cookies server-side
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),          // pass through as-is
        setAll: (cookies) => {                        // write every cookie to the response
          for (const { name, value, options } of cookies) {
            res.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = req.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)"],
};