import { prisma } from '@/app/lib/prisma'

/**
 * Números reais do catálogo para a landing.
 *
 * São consultados em vez de escritos à mão de propósito: a versão anterior
 * anunciava "50K+ jogadores" e "500+ personagens" num projeto solo com 49
 * personagens. Número inventado em portfólio é pior que número pequeno —
 * quem avalia abre o app e confere. Consultando, eles também não têm como
 * desatualizar quando o seed crescer.
 */
export async function getLandingStats() {
  const [characters, skills, transformations, equipment, stages, animes] = await Promise.all([
    prisma.character.count(),
    prisma.skill.count(),
    prisma.transformation.count(),
    prisma.equipment.count(),
    prisma.storyStage.count(),
    prisma.anime.findMany({
      select: { name: true, slug: true, _count: { select: { characters: true } } },
      orderBy: { characters: { _count: 'desc' } },
    }),
  ])

  return {
    characters,
    skills,
    transformations,
    equipment,
    stages,
    animes: animes.filter((a) => a._count.characters > 0),
  }
}
