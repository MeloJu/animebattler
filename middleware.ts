import { NextResponse, NextRequest } from 'next/server'

const PROTECTED_PREFIXES = ['/dashboard', '/select', '/create', '/equipment', '/battle', '/status']

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl
  const hasSession = Boolean(req.cookies.get('session')?.value)

  const isProtected = PROTECTED_PREFIXES.some(p => pathname === p || pathname.startsWith(p + '/'))

  if (isProtected && !hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/login'
    url.searchParams.set('redirect', pathname)
    return NextResponse.redirect(url)
  }

  // Whether an authenticated visitor should be bounced away from /login and
  // /register is decided by those pages themselves (a real DB-backed check
  // via getCurrentUser()), not here — a cookie can be present but stale
  // (expired, revoked, or the Session table was reset under it), and this
  // middleware has no cheap way to tell the difference. Redirecting on
  // cookie-presence alone used to trap visitors with a dead cookie: blocked
  // from reaching /login to get a fresh session, yet not actually logged in.

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/',
    '/login',
    '/register',
    '/dashboard/:path*',
    '/select/:path*',
    '/create/:path*',
    '/equipment/:path*',
    '/battle/:path*',
    '/status/:path*',
    '/characters/:path*',
  ],
}
