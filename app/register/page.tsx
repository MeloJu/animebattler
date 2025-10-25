import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { hashPassword } from '@/app/lib/auth'
import { createSession } from '@/app/lib/auth'

export default function RegisterPage() {
  async function registerAction(formData: FormData) {
    "use server"
    const username = String(formData.get('username') || '').trim()
    const email = String(formData.get('email') || '').trim().toLowerCase()
    const password = String(formData.get('password') || '')

    if (!username || !email || !password) return

    const exists = await prisma.user.findFirst({ where: { OR: [{ email }, { username }] }, select: { id: true } })
    if (exists) return

    const passwordHash = await hashPassword(password)
    const user = await prisma.user.create({ data: { username, email, passwordHash } })
    await createSession(user.id)
    redirect('/select')
  }

  return (
    <main className="mx-auto max-w-md p-6">
      <h1 className="text-2xl font-semibold mb-4">Create your account</h1>
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
          <input type="password" name="password" className="w-full rounded-md border border-black/10 px-3 py-2 bg-white" />
        </div>
        <div className="pt-2">
          <button type="submit" className="btn-primary rounded-md px-4 py-2 text-sm">Register</button>
        </div>
      </form>
    </main>
  )
}
