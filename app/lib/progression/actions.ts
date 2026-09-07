'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/app/lib/prisma'
import { requireUser } from '@/app/lib/session'
import { getEligiblePlayerSkills } from '@/app/lib/battle/queries'
import { escolherLoadoutPadrao } from '@/app/lib/battle/ai'
import { getLoadoutSlotCount } from './constants'

type Db = Prisma.TransactionClient | typeof prisma

/**
 * Fills empty loadout slots with newly-eligible-but-unequipped skills, up to
 * the cap. Never touches slots that are already occupied - this only backfills
 * gaps. Called after character creation, level-up, and skill tree unlocks so
 * the player is never left with fewer usable moves than they're entitled to.
 *
 * `db` defaults to the top-level client, matching the two standalone call
 * sites below (unlockSkillNode, and the post-battle level-up check in
 * battle/actions.ts). Passing an interactive-transaction client instead (as
 * createCharacter does, to make character creation atomic) skips the
 * internal `$transaction` batch below — Prisma doesn't support nesting one
 * transaction inside another — and just awaits the creates in sequence,
 * which is already atomic by virtue of the caller's own transaction.
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
  const candidates = Object.values(eligible).filter((skill) => !equippedSkillIds.has(skill.id))
  if (candidates.length === 0) return

  // Mesma regra que monta o arsenal do inimigo. Antes isto era
  // Object.keys(...).slice(), ou seja, as primeiras que o banco devolvesse:
  // o jogador começava com quatro habilidades quaisquer, e podia perfeitamente
  // não ter o próprio golpe principal equipado.
  const creates = escolherLoadoutPadrao(candidates, freeSlots.length)
    .map((s) => s.id)
    .map((skillId, i) => db.userCharacterEquippedSkill.create({ data: { userCharacterId, skillId, slot: freeSlots[i] } }))

  if (db === prisma) {
    await prisma.$transaction(creates)
  } else {
    for (const c of creates) await c
  }
}

export async function selectCharacter(formData: FormData): Promise<void> {
  const user = await requireUser()
  const userCharacterId = String(formData.get('userCharacterId'))
  await prisma.user.update({ where: { id: user.id }, data: { selectedCharacterId: userCharacterId } })
  redirect('/dashboard')
}

export async function createCharacter(formData: FormData): Promise<void> {
  const user = await requireUser()
  const characterId = String(formData.get('characterId'))
  const nickname = String(formData.get('nickname') || '').trim() || 'Hero'

  // Atomic: a UserCharacter that got created but never became selected (or
  // never got its starter loadout) would leave the player stuck. redirect()
  // throws, so it happens strictly after the transaction resolves — inside
  // it, that throw would trigger a rollback instead of a clean redirect.
  await prisma.$transaction(async (tx) => {
    const uc = await tx.userCharacter.create({ data: { userId: user.id, characterId, nickname }, select: { id: true } })
    await tx.user.update({ where: { id: user.id }, data: { selectedCharacterId: uc.id } })
    await autoFillLoadout(uc.id, characterId, 1, tx)
  })

  redirect('/dashboard')
}

export async function unlockSkillNode(userCharacterId: string, nodeId: string): Promise<void> {
  const user = await requireUser()

  const userCharacter = await prisma.userCharacter.findFirst({ where: { id: userCharacterId, userId: user.id } })
  if (!userCharacter) redirect('/status?error=not_found')

  const node = await prisma.skillTreeNode.findUnique({ where: { id: nodeId }, include: { prerequisites: true } })
  if (!node || node.characterId !== userCharacter.characterId) redirect('/status?error=invalid_node')

  const existingUnlock = await prisma.userSkillUnlock.findUnique({
    where: { userCharacterId_nodeId: { userCharacterId, nodeId } },
  })
  if (existingUnlock) redirect('/status')

  if (userCharacter.pointsAvailable < node.pointCost) redirect('/status?error=insufficient_points')

  if (node.prerequisites.length > 0) {
    const unlockedPrereqs = await prisma.userSkillUnlock.findMany({
      where: { userCharacterId, nodeId: { in: node.prerequisites.map((p) => p.id) } },
      select: { nodeId: true },
    })
    const unlockedIds = new Set(unlockedPrereqs.map((u) => u.nodeId))
    const allMet = node.prerequisites.every((p) => unlockedIds.has(p.id))
    if (!allMet) redirect('/status?error=missing_prerequisite')
  }

  await prisma.$transaction([
    prisma.userSkillUnlock.create({ data: { userCharacterId, nodeId } }),
    prisma.userCharacter.update({ where: { id: userCharacterId }, data: { pointsAvailable: { decrement: node.pointCost } } }),
  ])

  // If this node grants a skill and a loadout slot is free, equip it automatically.
  await autoFillLoadout(userCharacterId, userCharacter.characterId, userCharacter.level)

  revalidatePath('/status')
}

// Bound as equipSkill.bind(null, userCharacterId, slot) on a <form> whose
// <select name="skillId"> supplies the one remaining piece of data - Next
// server actions fold any params past the bound ones into a single FormData.
export async function equipSkill(userCharacterId: string, slot: number, formData: FormData): Promise<void> {
  const user = await requireUser()

  const skillId = String(formData.get('skillId') || '')
  if (!skillId) redirect('/status?error=invalid_skill')

  const userCharacter = await prisma.userCharacter.findFirst({ where: { id: userCharacterId, userId: user.id } })
  if (!userCharacter) redirect('/status?error=not_found')

  if (!Number.isInteger(slot) || slot < 0 || slot >= getLoadoutSlotCount(userCharacter.level)) redirect('/status?error=invalid_slot')

  const eligible = await getEligiblePlayerSkills(userCharacterId, userCharacter.characterId, userCharacter.level)
  if (!eligible[skillId]) redirect('/status?error=invalid_skill')

  await prisma.$transaction([
    // Clear whatever currently occupies this slot, and clear this skill from
    // any other slot it might already be equipped in, before placing it here.
    prisma.userCharacterEquippedSkill.deleteMany({ where: { userCharacterId, OR: [{ slot }, { skillId }] } }),
    prisma.userCharacterEquippedSkill.create({ data: { userCharacterId, skillId, slot } }),
  ])

  revalidatePath('/status')
}

export async function unequipSkill(userCharacterId: string, slot: number): Promise<void> {
  const user = await requireUser()

  const userCharacter = await prisma.userCharacter.findFirst({ where: { id: userCharacterId, userId: user.id } })
  if (!userCharacter) redirect('/status?error=not_found')

  await prisma.userCharacterEquippedSkill.deleteMany({ where: { userCharacterId, slot } })

  revalidatePath('/status')
}
