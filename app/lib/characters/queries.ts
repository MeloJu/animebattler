import { prisma } from '@/app/lib/prisma'

// listCharacters() and getCharacterById() are NOT built on one shared
// `include`: the list page doesn't order characterSkills, the detail page
// orders them by skill name. Merging them into one include object would
// either silently re-sort the list page's skill badges or need a param
// threading the difference back in — not worth it for two fields.

export function listCharacters() {
  return prisma.character.findMany({
    include: {
      anime: true,
      affiliation: true,
      characterSkills: { include: { skill: true } },
    },
    orderBy: { name: 'asc' },
  })
}

export function getCharacterById(id: string) {
  return prisma.character.findUnique({
    where: { id },
    include: {
      anime: true,
      affiliation: true,
      characterSkills: { include: { skill: true }, orderBy: { skill: { name: 'asc' } } },
    },
  })
}
