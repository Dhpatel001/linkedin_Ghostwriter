import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/* ─── Routes that require a logged-in session ─────────────────── */
const PROTECTED_ROUTES = [
    '/dashboard',
    '/onboarding',
    '/settings',
    '/billing',
];

/* ─── Routes that logged-in users should NOT see ──────────────── */
const AUTH_ROUTES = ['/login'];

/* ─── Public routes — always accessible ───────────────────────── */
// Everything else (/, /privacy, /terms) is public

export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Read the httpOnly JWT cookie set by the backend
    const token = request.cookies.get('voicepost_token')?.value;
    const isLoggedIn = !!token;

    // 1. Protected route + no token → send to login
    const isProtected = PROTECTED_ROUTES.some((route) =>
        pathname.startsWith(route)
    );

    if (isProtected && !isLoggedIn) {
        const loginUrl = new URL('/login', request.url);
        // Preserve the original destination so we can redirect back after login
        loginUrl.searchParams.set('next', pathname);
        return NextResponse.redirect(loginUrl);
    }

    // 2. Already logged in + trying to visit /login → send to dashboard
    const isAuthRoute = AUTH_ROUTES.some((route) => pathname.startsWith(route));

    if (isAuthRoute && isLoggedIn) {
        return NextResponse.redirect(new URL('/dashboard', request.url));
    }

    return NextResponse.next();
}

export const config = {
    /*
     * Match all routes EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     * - api routes  (backend handles its own auth)
     * - public assets
     */
    matcher: [
        '/((?!_next/static|_next/image|favicon.ico|api/|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};