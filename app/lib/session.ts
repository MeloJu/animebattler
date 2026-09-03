import crypto from 'crypto'
import { cache } from 'react'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'

const SESSION_COOKIE = 'session'
const SESSION_DAYS = 30

// Cookie `Secure` só é aceito pelo navegador em HTTPS. Em produção com domínio
// de verdade o Caddy emite TLS sozinho e isso fica true — que é o certo. Mas
// acessando a VM pelo IP puro (HTTP), o navegador descarta o cookie em silêncio
// e o login falha sem nenhuma mensagem de erro. COOKIE_SECURE=false é a saída
// pra esse caso; ver docs/deploy-oracle.md.
const SECURE_COOKIE = process.env.COOKIE_SECURE
  ? process.env.COOKIE_SECURE === 'true'
  : process.env.NODE_ENV === 'production'

export async function createSession(userId: string) {
  const token = crypto.randomBytes(48).toString('hex')
  const expiresAt = new Date(Date.now() + SESSION_DAYS * 24 * 60 * 60 * 1000)
  await prisma.session.create({ data: { userId, token, expiresAt } })
  const cookie = (await cookies()).set({
    name: SESSION_COOKIE,
    value: token,
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    secure: SECURE_COOKIE,
    expires: expiresAt,
  })
  return cookie
}

// cache() dedupes calls within a single request — AppNav (root layout) and
// individual pages each call getCurrentUser() independently, which would
// otherwise hit the session table once per call on every navigation.
export const getCurrentUser = cache(async () => {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: true },
  })
  return session?.user ?? null
})

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
  cookieStore.set({ name: SESSION_COOKIE, value: '', path: '/', httpOnly: true, maxAge: 0 })
}

// Same as getCurrentUser(), but for the ~16 call sites that only make sense
// for a logged-in visitor (a page or action behind auth) — bails out to
// /login instead of making every caller repeat the null-check.
export async function requireUser() {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  return user
}
