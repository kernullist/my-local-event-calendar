import { NextResponse, type NextRequest } from 'next/server'

// cron 라우트는 자체 CRON_SECRET으로 보호되므로 Basic Auth에서 제외
const CRON_PREFIXES = ['/api/ingest', '/api/verify-status']

/**
 * 사이트 전체 Basic Auth.
 * BASIC_AUTH_USER / BASIC_AUTH_PASS 가 설정돼 있을 때만 작동(미설정 시 통과 → 로컬 개발).
 */
export function middleware(req: NextRequest) {
  const user = process.env.BASIC_AUTH_USER
  const pass = process.env.BASIC_AUTH_PASS

  // 자격 미설정이면 보호하지 않음(로컬 개발 등)
  if (!user || !pass) return NextResponse.next()

  // Vercel Cron 등 외부 트리거가 호출하는 라우트는 제외(자체 시크릿으로 보호됨)
  const { pathname } = req.nextUrl
  if (CRON_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const header = req.headers.get('authorization')
  if (header?.startsWith('Basic ')) {
    const decoded = atob(header.slice(6)) // Edge 런타임 atob
    const idx = decoded.indexOf(':')
    const u = decoded.slice(0, idx)
    const p = decoded.slice(idx + 1)
    if (u === user && p === pass) return NextResponse.next()
  }

  return new NextResponse('인증이 필요합니다.', {
    status: 401,
    headers: { 'WWW-Authenticate': 'Basic realm="로컬 이벤트 캘린더"' },
  })
}

export const config = {
  // 정적 자원/파비콘 제외, 나머지 전체 보호
  matcher: ['/((?!_next/static|_next/image|favicon.ico).*)'],
}
