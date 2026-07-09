import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/app/lib/prisma'
import { createSession, hashPassword } from '@/app/lib/auth'

const MIN_PASSWORD_LENGTH = 8

const REGISTER_ERROR_MESSAGES: Record<string, string> = {
  missing_fields: 'Preencha todos os campos.',
  weak_password: `A senha precisa ter pelo menos ${MIN_PASSWORD_LENGTH} caracteres.`,
  already_exists: 'Username ou email já está em uso.',
}

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const { error } = await searchParams
  const errorMessage = error ? REGISTER_ERROR_MESSAGES[error] ?? 'Ocorreu um erro.' : null

  async function registerAction(formData: FormData) {
    "use server"
    const username = String(formData.get('username') || '').trim().toLowerCase()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')

    if (!username || !email || !password) redirect('/register?error=missing_fields')
    if (password.length < MIN_PASSWORD_LENGTH) redirect('/register?error=weak_password')

    const passwordHash = await hashPassword(password)
    let userId: string
    try {
      const user = await prisma.user.create({ data: { username, email, passwordHash } })
      userId = user.id
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2002') {
        redirect('/register?error=already_exists')
      }
      throw e
    }

    await createSession(userId)
    redirect('/select')
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
      {errorMessage && (
        <div className="mb-4 rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
      )}
      <form action={registerAction} className="card p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">Username</label>
          <input name="username" className="w-full rounded-md border border-black/10 px-3 py-2 bg-white" placeholder="yourname" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input type="email" name="email" className="w-full rounded-md border border-black/10 px-3 py-2 bg-white" placeholder="you@example.com" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Password</label>
          <input type="password" name="password" minLength={MIN_PASSWORD_LENGTH} className="w-full rounded-md border border-black/10 px-3 py-2 bg-white" />
        </div>
        <div className="pt-2">
          <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm">Register</button>
        </div>
      </form>
    </main>
  )
}
