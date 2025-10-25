import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'

export async function PATCH(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { userCharacterId?: string }
  if (!body.userCharacterId) return NextResponse.json({ error: 'userCharacterId required' }, { status: 400 })

  const uc = await prisma.userCharacter.findFirst({ where: { id: body.userCharacterId, userId: user.id }, select: { id: true } })
  if (!uc) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const updated = await prisma.user.update({ where: { id: user.id }, data: { selectedCharacterId: uc.id }, select: { id: true, selectedCharacterId: true } })
  return NextResponse.json({ ok: true, user: updated })
}
