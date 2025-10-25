import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { createSession, verifyPassword } from '@/app/lib/auth'

export default function LoginPage() {
  async function loginAction(formData: FormData) {
    "use server"
    const id = String(formData.get('id') || '').trim() // username or email
    const password = String(formData.get('password') || '')
    if (!id || !password) return

    const user = await prisma.user.findFirst({ where: { OR: [{ email: id.toLowerCase() }, { username: id }] } })
    if (!user) return

    let ok = false
    if (user.passwordHash?.includes(':')) {
      ok = await verifyPassword(password, user.passwordHash)
    } else {
      ok = password === user.passwordHash
    }
    if (!ok) return

    await createSession(user.id)
    redirect('/select')
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Sign in</h1>
      <form action={loginAction} className="card p-6 space-y-4">
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
