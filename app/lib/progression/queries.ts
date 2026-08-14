import { Prisma } from '@prisma/client'
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

/** app/select's roster of created characters to choose from. */
export async function getUserCharacters(userId: string) {
  return prisma.userCharacter.findMany({ where: { userId }, include: { character: true } })
}

/** The full skill tree for a character, tier-ordered, for app/status. */
export async function getSkillTree(characterId: string) {
  return prisma.skillTreeNode.findMany({
    where: { characterId },
    include: { skill: true, prerequisites: true },
    orderBy: { tier: 'asc' },
  })
}

/** Which of this UserCharacter's tree nodes are already unlocked. */
export async function getUnlockedNodeIds(userCharacterId: string): Promise<Set<string>> {
  const rows = await prisma.userSkillUnlock.findMany({ where: { userCharacterId }, select: { nodeId: true } })
  return new Set(rows.map((r) => r.nodeId))
}

/** This UserCharacter's current loadout, one row per occupied slot. */
export async function getEquippedSkillRows(userCharacterId: string) {
  return prisma.userCharacterEquippedSkill.findMany({ where: { userCharacterId }, include: { skill: true } })
}

type Db = Prisma.TransactionClient | typeof prisma

/**
 * Fills empty loadout slots with newly-eligible-but-unequipped skills, up to
 * the cap. Never touches slots that are already occupied - this only backfills
 * gaps. Called after character creation, level-up, and skill tree unlocks so
 * the player is never left with fewer usable moves than they're entitled to.
 *
 * `db` defaults to the top-level client, matching the two standalone call
 * sites (unlockSkillNode, and the post-battle level-up check). Passing an
 * interactive-transaction client instead (as createCharacter does, to make
 * character creation atomic) skips the internal `$transaction` batch below —
 * Prisma doesn't support nesting one transaction inside another — and just
 * awaits the creates in sequence, which is already atomic by virtue of the
 * caller's own transaction.
 */
export async function autoFillLoadout(userCharacterId: string, characterId: string, level: number, db: Db = prisma): Promise<void> {
  const [eligible, equipped] = await Promise.all([
    getEligiblePlayerSkills(userCharacterId, characterId, level),
    db.userCharacterEquippedSkill.findMany({ where: { userCharacterId } }),
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

  const creates = candidates
    .slice(0, freeSlots.length)
    .map((skillId, i) => db.userCharacterEquippedSkill.create({ data: { userCharacterId, skillId, slot: freeSlots[i] } }))

  if (db === prisma) {
    await prisma.$transaction(creates)
  } else {
    for (const c of creates) await c
  }
}
