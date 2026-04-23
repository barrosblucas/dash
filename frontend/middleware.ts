import { NextRequest, NextResponse } from 'next/server';

const AUTH_REFRESH_COOKIE_NAME = 'dashboard_refresh_token';

export function middleware(request: NextRequest) {
  const refreshCookie = request.cookies.get(AUTH_REFRESH_COOKIE_NAME)?.value;

  if (refreshCookie) {
    return NextResponse.next();
  }

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);

  return NextResponse.redirect(loginUrl);
}

export const config = {
  matcher: ['/admin/:path*'],
};
