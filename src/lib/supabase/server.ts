import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

/**
 * 서버(Server Component / Route Handler)용 Supabase 클라이언트.
 * anon 키 + 쿠키 세션 → 로그인 사용자 컨텍스트에서 RLS 적용.
 */
export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            )
          } catch {
            // Server Component에서 호출되면 set이 막힐 수 있음 → 세션 갱신은 middleware가 담당
          }
        },
      },
    },
  )
}
