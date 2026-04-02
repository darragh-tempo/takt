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

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Unauthenticated: allow public routes, redirect everything else to /login
  if (!user) {
    if (PUBLIC_ROUTES.has(pathname)) {
      return response;
    }
    const loginUrl = new URL('/login', request.url);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated: fetch profile for role + onboarding status
  const { data: profile } = await supabase
    .from('profiles')
    .select('role, onboarding_complete')
    .eq('id', user.id)
    .single<{ role: UserRole; onboarding_complete: boolean }>();

  const role = profile?.role;
  const dashboard = role ? ROLE_DASHBOARDS[role] : null;

  // Redirect logged-in users away from /login or / to their dashboard
  if (pathname === '/login' || pathname === '/') {
    if (dashboard) {
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
    // No profile found — let them through rather than redirect-looping
    return response;
  }

  // Allow remaining public routes (/signup, /auth/callback) for authenticated users
  if (PUBLIC_ROUTES.has(pathname)) {
    return response;
  }

  // Employee onboarding gate
  if (
    role === 'employee' &&
    profile?.onboarding_complete === false &&
    pathname !== '/employee/onboarding'
  ) {
    return NextResponse.redirect(new URL('/employee/onboarding', request.url));
  }

  // Role-based route protection
  if (role && dashboard) {
    const allowedPrefix = ROLE_PREFIXES[role];
    if (!pathname.startsWith(allowedPrefix)) {
      return NextResponse.redirect(new URL(dashboard, request.url));
    }
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|api/).*)'],
};
