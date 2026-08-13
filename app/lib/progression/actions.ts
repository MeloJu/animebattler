'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'
import { getEligiblePlayerSkills } from '@/app/lib/battle/queries'
import { autoFillLoadout } from './queries'
import { getLoadoutSlotCount } from './constants'

export async function unlockSkillNode(userCharacterId: string, nodeId: string): Promise<void> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

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
  const user = await getCurrentUser()
  if (!user) redirect('/login')

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
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const userCharacter = await prisma.userCharacter.findFirst({ where: { id: userCharacterId, userId: user.id } })
  if (!userCharacter) redirect('/status?error=not_found')

  await prisma.userCharacterEquippedSkill.deleteMany({ where: { userCharacterId, slot } })

  revalidatePath('/status')
}
