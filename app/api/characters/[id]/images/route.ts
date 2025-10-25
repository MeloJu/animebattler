import { NextResponse } from 'next/server'
import path from 'path'
import fs from 'fs/promises'
import { prisma } from '@/app/lib/prisma'

const exts = new Set(['.png', '.jpg', '.jpeg', '.webp'])

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const char = await prisma.character.findUnique({ where: { id: params.id } })
  if (!char) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  const dir = path.join(process.cwd(), 'public', 'images', 'characters', char.id)
  let files: string[] = []
  try {
    const entries = await fs.readdir(dir, { withFileTypes: true })
    files = entries
      .filter((e) => e.isFile() && exts.has(path.extname(e.name).toLowerCase()))
      .map((e) => `/images/characters/${char.id}/${e.name}`)
  } catch {
    files = []
  }
  return NextResponse.json({ images: files })
}
