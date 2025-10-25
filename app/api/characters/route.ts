import { NextResponse } from 'next/server'
import { prisma } from '@/app/lib/prisma'

export async function GET() {
  const characters = await prisma.character.findMany({
    include: {
      anime: true,
      affiliation: true,
      characterSkills: {
        include: { skill: true }
      }
    },
    orderBy: [{ name: 'asc' }]
  })

  const result = characters.map((c) => ({
    id: c.id,
    name: c.name,
    imageUrl: c.imageUrl,
    stats: { hp: c.hp, attack: c.attack, defense: c.defense, speed: c.speed, energy: c.energy },
    anime: { id: c.anime.id, name: c.anime.name, slug: c.anime.slug },
    affiliation: c.affiliation ? { id: c.affiliation.id, name: c.affiliation.name } : null,
    skills: c.characterSkills.map((cs) => ({ id: cs.skill.id, name: cs.skill.name, category: cs.skill.category, power: cs.skill.power }))
  }))

  return NextResponse.json({ characters: result })
}
