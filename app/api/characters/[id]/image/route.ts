import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function PATCH(req: Request, { params }: { params: { id: string } }) {
  const body = await req.json().catch(() => ({})) as { imageUrl?: string }
  if (!body.imageUrl) return NextResponse.json({ error: 'imageUrl required' }, { status: 400 })
  const character = await prisma.character.update({ where: { id: params.id }, data: { imageUrl: body.imageUrl } }).catch(() => null)
  if (!character) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  return NextResponse.json({ ok: true, character: { id: character.id, imageUrl: character.imageUrl } })
}
