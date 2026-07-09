'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'

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

  revalidatePath('/status')
}
