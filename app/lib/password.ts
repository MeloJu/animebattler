import crypto from 'crypto'

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
