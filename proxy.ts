import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * ==========================================
 * SECURE EDGE ROUTE GUARD (PROXY)
 * ==========================================
 * This file intercepts ALL navigation requests *before* they hit the server.
 * It strictly enforces your Route Protections at the absolute perimeter!
 */

// Add any sensitive routes here (The Dashboard, Settings, etc)
const protectedRoutes = ['/dashboard', '/']; 

// The public authentication funnel
const authRoutes = ['/sign-in', '/sign-up', '/finishSignUp'];

export function proxy(request: NextRequest) {
    const { pathname } = request.nextUrl;
    
    // 1. Unpack the invisible Secure Session Cookie
    const sessionCookie = request.cookies.get('session');

    // 2. Are they trying to access a restricted system file? Let them pass.
    if (pathname.startsWith('/_next') || pathname.startsWith('/avatars') || pathname.startsWith('/api')) {
        return NextResponse.next();
    }

    // 3. Are they trying to access a secure route WITHOUT being logged in? BOUNCE THEM TO LOGIN.
    // We strictly check exactly '/' or anything starting with '/dashboard'
    const isProtectedRoute = pathname === '/' || pathname.startsWith('/dashboard');
    
    if (isProtectedRoute && !sessionCookie) {
        const loginUrl = new URL('/sign-in', request.url);
        return NextResponse.redirect(loginUrl);
    }

    // 4. Are they returning to Login pages while ALREADY authenticated? BOUNCE THEM TO DASHBOARD.
    const isAuthRoute = authRoutes.some(route => pathname.startsWith(route));
    if (isAuthRoute && sessionCookie) {
        return NextResponse.redirect(new URL('/', request.url));
    }

    // 5. Cleared all security checks. Proceed to page render!
    return NextResponse.next();
}

/**
 * OPTIMIZER: Configures exactly which route paths trigger this guard.
 * We ignore static assets (`.png`, `.css`) so we don't waste Next.js Edge performance!
 */
export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|avatars|images).*)',
  ],
}
