import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { createSession, verifyPassword } from '@/app/lib/auth'
import { getCurrentUser } from '@/app/lib/session'
import { resolveErrorMessage } from '@/app/lib/error-messages'

const LOGIN_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'Preencha usuário/email e senha.',
  invalid_credentials: 'Usuário/email ou senha incorretos.',
}

function sanitizeRedirectTarget(target: string): string {
  if (target.startsWith('/') && !target.startsWith('//')) return target
  return '/select'
}

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; redirect?: string }> }) {
  // A real DB-backed check, not middleware's cookie-presence guess - a stale
  // cookie (expired, revoked, or left over from a wiped Session table)
  // must not trap a visitor out of their own login page.
  const existingUser = await getCurrentUser()
  if (existingUser) redirect('/dashboard')

  const { error, redirect: redirectParam } = await searchParams
  const errorMessage = resolveErrorMessage(LOGIN_ERROR_MESSAGES, error, 'Ocorreu um erro.')
  const redirectTo = sanitizeRedirectTarget(redirectParam ?? '/select')

  async function loginAction(formData: FormData) {
    "use server"
    const id = String(formData.get('id') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')
    const target = sanitizeRedirectTarget(String(formData.get('redirectTo') || '/select'))
    if (!id || !password) redirect('/login?error=missing_fields')

    const user = await prisma.user.findFirst({ where: { OR: [{ email: id }, { username: id }] } })
    const ok = user ? await verifyPassword(password, user.passwordHash) : false
    if (!user || !ok) redirect('/login?error=invalid_credentials')

    await createSession(user.id)
    redirect(target)
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
      )}
      <form action={loginAction} className="card p-6 space-y-4">
        <input type="hidden" name="redirectTo" value={redirectTo} />
        <div>
          <label className="block text-sm font-medium mb-1">Username or Email</label>
          <input name="id" className="w-full rounded-md border border-black/10 px-3 py-2 bg-white" placeholder="username or you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" name="password" className="w-full rounded-md border border-black/10 px-3 py-2 bg-white" />
        </div>
        <div className="pt-2 flex items-center gap-2">
          <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm">Login</button>
          <a href="/register" className="text-sm underline">Create an account</a>
        </div>
      </form>
    </main>
  )
}
