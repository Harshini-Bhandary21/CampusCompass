import { getToken } from 'next-auth/jwt'
import { NextResponse } from 'next/server'

const DASHBOARD_BY_ROLE = {
  admin: '/admin/dashboard',
  teacher: '/teacher/dashboard',
  student: '/student/dashboard',
}

export async function middleware(request) {
  const token = await getToken({ req: request, secret: process.env.NEXTAUTH_SECRET })
  const { pathname } = request.nextUrl

  const isProtected = ['/student', '/teacher', '/admin'].some(prefix => pathname.startsWith(prefix))

  if (!token && isProtected) {
    return NextResponse.redirect(new URL('/auth/signin', request.url))
  }

  if (token && pathname === '/auth/signin') {
    return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE[token.role] || '/', request.url))
  }

  if (token) {
    if (token.role === 'student' && (pathname.startsWith('/teacher') || pathname.startsWith('/admin'))) {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE.student, request.url))
    }
    if (token.role === 'teacher' && (pathname.startsWith('/admin') || pathname.startsWith('/student'))) {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE.teacher, request.url))
    }
    if (token.role === 'admin' && (pathname.startsWith('/teacher') || pathname.startsWith('/student'))) {
      return NextResponse.redirect(new URL(DASHBOARD_BY_ROLE.admin, request.url))
    }
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|mp4|glb)$).*)'],
}
