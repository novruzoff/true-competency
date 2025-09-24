import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const PUBLIC_PATHS = new Set(['/', '/signin', '/topics']);

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (
    pathname.startsWith('/_next') ||       // Next internal assets
    pathname.startsWith('/api') ||         // your API routes if any
    pathname.startsWith('/favicon') ||     // favicon.ico, etc.
    /\.[a-zA-Z0-9]+$/.test(pathname)       // any file with extension (e.g., /TC_Logo.png)
  ) {
    return NextResponse.next();
  }

  // public routes that don't require auth
  const isPublic = PUBLIC_PATHS.has(pathname);

  // Supabase sets these cookies when authenticated
  const token = req.cookies.get('sb-access-token')?.value;

  if (!isPublic && !token) {
    const url = req.nextUrl.clone();
    url.pathname = '/signin';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// apply to all routes
export const config = {
  matcher: ['/((?!_next/static|_next/image).*)'],
};
