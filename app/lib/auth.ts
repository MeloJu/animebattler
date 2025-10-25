import crypto from 'crypto'
import { cookies } from 'next/headers'
import { prisma } from '@/app/lib/prisma'

const SESSION_COOKIE = 'session'
const SESSION_DAYS = 30

export async function hashPassword(password: string) {
  const salt = crypto.randomBytes(16).toString('hex')
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey as Buffer)
    })
  })
  return `scrypt:${salt}:${derivedKey.toString('hex')}`
}

export async function verifyPassword(password: string, stored: string) {
  const [scheme, salt, hash] = stored.split(':')
  if (scheme !== 'scrypt' || !salt || !hash) return false
  const derivedKey = await new Promise<Buffer>((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err)
      else resolve(derivedKey as Buffer)
    })
  })
  return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), derivedKey)
}

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
    secure: process.env.NODE_ENV === 'production',
    expires: expiresAt,
  })
  return cookie
}

export async function getSessionUser() {
  const token = (await cookies()).get(SESSION_COOKIE)?.value
  if (!token) return null
  const session = await prisma.session.findFirst({
    where: { token, expiresAt: { gt: new Date() } },
    include: { user: true },
  })
  return session?.user ?? null
}

export async function clearSession() {
  const cookieStore = await cookies()
  const token = cookieStore.get(SESSION_COOKIE)?.value
  if (token) {
    await prisma.session.deleteMany({ where: { token } })
  }
  cookieStore.set({ name: SESSION_COOKIE, value: '', path: '/', httpOnly: true, maxAge: 0 })
}
