// src/middleware.ts
import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";

const PUBLIC_PATHS = [
  "/signin",
  "/signup",
  "/debug", // make protected later if you want
  "/api/auth/callback",
  "/preview-check",
  "/api/health",
  "/api/runtime",
  "/favicon.ico",
];

const PROTECT_PREFIXES = ["/trainee", "/instructor", "/committee"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Allow static & public paths
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
  const res = NextResponse.next();

  // Standardized SSR client with getAll/setAll on req/res cookies
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll().map(({ name, value }) => ({ name, value }));
        },
        setAll(cookiesToSet) {
          for (const { name, value, options } of cookiesToSet) {
            res.cookies.set(name, value, options);
          }
        },
      },
    }
  );

  // This call both verifies and silently refreshes session cookies when needed
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (needsAuth && !user) {
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