import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { createSupabaseMiddlewareClient } from '@/lib/supabase-middleware';
import type { UserRole } from '@/types/database';

const PUBLIC_ROUTES = new Set(['/', '/login', '/signup', '/auth/callback']);

const ROLE_DASHBOARDS: Record<UserRole, string> = {
  employee: '/employee',
  hr_admin: '/hr',
  coach: '/coach',
  admin: '/admin',
};

const ROLE_PREFIXES: Record<UserRole, string> = {
  employee: '/employee',
  hr_admin: '/hr',
  coach: '/coach',
  admin: '/admin',
};

export async function middleware(request: NextRequest) {
  const { supabase, response } = await createSupabaseMiddlewareClient(request);
  const pathname = request.nextUrl.pathname;

  console.log('[middleware] pathname:', pathname);

  const {
    data: { user },
    error: getUserError,
  } = await supabase.auth.getUser();

  console.log('[middleware] user:', user ? `${user.id} <${user.email}>` : 'null', getUserError ? `| error: ${getUserError.message}` : '');

  // Unauthenticated: allow public routes, redirect everything else to /login
  if (!user) {
    if (PUBLIC_ROUTES.has(pathname)) {
      console.log('[middleware] decision: no user, public route → pass through');
      return response;
    }
    console.log('[middleware] decision: no user, protected route → redirect /login');
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated: fetch profile for role + onboarding status
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single<{ role: UserRole; onboarding_complete: boolean }>();

  console.log('[middleware] profile:', JSON.stringify(profile), profileError ? `| error: ${profileError.message}` : '');

  const role = profile?.role;
  const dashboard = role ? ROLE_DASHBOARDS[role] : null;

  console.log('[middleware] role:', role ?? 'null', '| dashboard:', dashboard ?? 'null');

  // Redirect logged-in users away from /login or / to their dashboard
  if (pathname === '/login' || pathname === '/') {
    if (dashboard) {
      console.log('[middleware] decision: authenticated on', pathname, '→ redirect', dashboard);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    console.log('[middleware] decision: authenticated on', pathname, 'but no profile/dashboard → pass through');
    return response;
  }

  // Allow remaining public routes (/signup, /auth/callback) for authenticated users
  if (PUBLIC_ROUTES.has(pathname)) {
    console.log('[middleware] decision: authenticated, remaining public route → pass through');
    return response;
  }

  // Employee onboarding gate
  if (
    role === 'employee' &&
    profile?.onboarding_complete === false &&
    pathname !== '/employee/onboarding'
  ) {
    console.log('[middleware] decision: employee onboarding incomplete → redirect /employee/onboarding');
    return NextResponse.redirect(new URL('/employee/onboarding', request.url));
  }

  // Role-based route protection
  if (role && dashboard) {
    const allowedPrefix = ROLE_PREFIXES[role];
    if (!pathname.startsWith(allowedPrefix)) {
      console.log('[middleware] decision: role', role, 'not allowed on', pathname, '→ redirect', dashboard);
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
  }

  console.log('[middleware] decision: pass through');
  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
