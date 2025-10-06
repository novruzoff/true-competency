// middleware.ts
import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';

export async function middleware(req: NextRequest) {
  const res = NextResponse.next();
  const { pathname } = req.nextUrl;

  // Public, never require auth:
  const PUBLIC_PATHS = [
    '/signin',
    '/signup',
    '/debug',              // <-- allow the diagnostics page
    '/api/auth/callback',
    '/preview-check',
    '/api/health',
    '/api/runtime',
    '/api/auth/callback',
    '/favicon.ico',
  ];

  // Allow Next.js internals & static assets:
  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/assets') ||
    pathname.startsWith('/images') ||
    pathname.startsWith('/fonts') ||
    PUBLIC_PATHS.some((p) => pathname.startsWith(p))
  ) {
    return res;
  }

  // Only protect specific app sections (student/doctor). Everything else stays public.
  const PROTECT_PREFIXES = ['/trainee', '/instructor', '/committee'];

  // If the path isn’t protected, pass through.
  if (!PROTECT_PREFIXES.some((p) => pathname.startsWith(p))) {
    return res;
  }

  // Check session for protected paths
  const supabase = createMiddlewareClient({ req, res });
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    url.searchParams.set('redirect', pathname);
    return NextResponse.redirect(url);
  }

  return res;
}

// Apply middleware to all routes except Next.js static/image paths defined above
export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)'],
};