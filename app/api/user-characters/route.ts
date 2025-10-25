import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'

// Create a new UserCharacter from a base character + nickname
export async function POST(req: Request) {
  const user = await getCurrentUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const body = await req.json().catch(() => ({})) as { characterId?: string; nickname?: string }
  if (!body.characterId || !body.nickname) {
    return NextResponse.json({ error: 'characterId and nickname required' }, { status: 400 })
  }

  const character = await prisma.character.findUnique({ where: { id: body.characterId } })
  if (!character) return NextResponse.json({ error: 'Character not found' }, { status: 404 })

  const created = await prisma.userCharacter.create({
    data: {
      userId: user.id,
      characterId: character.id,
      nickname: body.nickname,
    },
    include: { character: true },
  })

  return NextResponse.json({ userCharacter: created })
}
