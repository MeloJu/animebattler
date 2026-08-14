import { prisma } from '@/app/lib/prisma'
import { getEligiblePlayerSkills } from '@/app/lib/battle/queries'
import { getLoadoutSlotCount } from './constants'

// Duplicated identically across battle/ai, battle/raid, story/actions and
// status before this: the user's selected character with its catalog
// character joined in.
export async function getSelectedCharacter(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { selectedCharacter: { include: { character: true } } },
  })
  return user?.selectedCharacter ?? null
}

// dashboard's own variant: same join, plus the user's id/name for the
// page header.
export async function getDashboardUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, selectedCharacter: { include: { character: true } } },
  })
}

/**
 * Fills empty loadout slots with newly-eligible-but-unequipped skills, up to
 * the cap. Never touches slots that are already occupied - this only backfills
 * gaps. Called after character creation, level-up, and skill tree unlocks so
 * the player is never left with fewer usable moves than they're entitled to.
 */
export async function autoFillLoadout(userCharacterId: string, characterId: string, level: number): Promise<void> {
  const [eligible, equipped] = await Promise.all([
    getEligiblePlayerSkills(userCharacterId, characterId, level),
    prisma.userCharacterEquippedSkill.findMany({ where: { userCharacterId } }),
  ])

  const usedSlots = new Set(equipped.map((e) => e.slot))
  const freeSlots: number[] = []
  for (let slot = 0; slot < getLoadoutSlotCount(level); slot++) {
    if (!usedSlots.has(slot)) freeSlots.push(slot)
  }
  if (freeSlots.length === 0) return

  const equippedSkillIds = new Set(equipped.map((e) => e.skillId))
  const candidates = Object.keys(eligible).filter((skillId) => !equippedSkillIds.has(skillId))
  if (candidates.length === 0) return

  await prisma.$transaction(
    candidates
      .slice(0, freeSlots.length)
      .map((skillId, i) => prisma.userCharacterEquippedSkill.create({ data: { userCharacterId, skillId, slot: freeSlots[i] } }))
  )
}
