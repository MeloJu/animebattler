'use server'

import { redirect } from 'next/navigation'
import { Prisma } from '@prisma/client'
import { prisma } from '@/app/lib/prisma'
import { hashPassword, verifyPassword } from '@/app/lib/password'
import { clearSession, createSession } from '@/app/lib/session'
import { MIN_PASSWORD_LENGTH, sanitizeRedirectTarget } from './auth-helpers'

export async function logoutAction(): Promise<void> {
  await clearSession()
  redirect('/login')
}

export async function loginAction(formData: FormData): Promise<void> {
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

export async function registerAction(formData: FormData): Promise<void> {
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
