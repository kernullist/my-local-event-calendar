/**
 * Cron/관리 전용 라우트 인증.
 * - Vercel Cron 은 `Authorization: Bearer <CRON_SECRET>` 헤더를 자동 첨부한다.
 * - 수동 트리거는 동일 헤더 또는 `?secret=<CRON_SECRET>` 쿼리로 허용.
 */
export function isAuthorizedCron(req: Request): boolean {
  const secret = process.env.CRON_SECRET
  if (!secret) return false

  const auth = req.headers.get('authorization')
  if (auth === `Bearer ${secret}`) return true

  const url = new URL(req.url)
  return url.searchParams.get('secret') === secret
}
