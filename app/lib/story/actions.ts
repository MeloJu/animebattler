'use server'

import { redirect } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { requireUser } from '@/app/lib/session'
import { computeBaseStats, scaleForLevel } from '@/app/lib/battle/engine'
import { createBattleAndRedirect } from '@/app/lib/battle/actions'
import { getSelectedCharacter } from '@/app/lib/progression/queries'
import { getStageForUser } from './queries'

export async function startStoryBattle(stageId: string): Promise<never> {
  const user = await requireUser()

  const userCharacter = await getSelectedCharacter(user.id)
  if (!userCharacter) redirect('/select')

  const found = await getStageForUser(stageId, user.id)
  if (!found) redirect('/story?error=not_found')
  // Revalidado no servidor de propósito: a UI já esconde estágios bloqueados,
  // mas a action é alcançável por POST direto.
  if (found.locked) redirect('/story?error=locked')

  const existing = await prisma.battle.findFirst({
    where: { userId: user.id, playerCharacterId: userCharacter.id, status: 'ACTIVE' },
    select: { id: true },
  })
  if (existing) redirect(`/battle/ai/${existing.id}`)

  const { stage } = found
  const enemy = stage.enemyCharacter ?? stage.enemyMonster
  if (!enemy) redirect('/story?error=not_found')
  const enemyBase = computeBaseStats(scaleForLevel(enemy, stage.enemyLevel), { hp: 0, attack: 0, defense: 0, speed: 0 })

  return createBattleAndRedirect({
    userId: user.id,
    userCharacter,
    enemy: stage.enemyCharacterId
      ? { kind: 'character', characterId: stage.enemyCharacterId, base: enemyBase }
      : { kind: 'monster', monsterId: stage.enemyMonsterId!, base: enemyBase },
    storyStageId: stage.id,
  })
}
