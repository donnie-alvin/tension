import { NextResponse } from 'next/server'
import { auth } from './auth'

export default auth((request) => {
  const isAuthenticated = Boolean(request.auth)

  if (!isAuthenticated) {
    const loginUrl = new URL('/login', request.nextUrl.origin)
    loginUrl.searchParams.set('callbackUrl', request.nextUrl.href)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
})

export const config = {
  matcher: ['/projects/:path*', '/executions/:path*', '/settings/:path*'],
}
