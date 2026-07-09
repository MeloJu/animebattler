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

  if ((pathname === '/login' || pathname === '/register') && hasSession) {
    const url = req.nextUrl.clone()
    url.pathname = '/dashboard'
    return NextResponse.redirect(url)
  }

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
