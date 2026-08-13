'use server'

import { redirect } from 'next/navigation'
import { revalidatePath } from 'next/cache'
import { Prisma } from '@prisma/client'
import { prisma } from '@/app/lib/prisma'
import { getCurrentUser } from '@/app/lib/session'
import { computeBaseStats, createInitialState, isLegalMove, resolveRound } from './engine'
import { pickAiSkill } from './ai'
import { applyExperience } from './leveling'
import { getEquippedSkills, getPlayerTransformations, getTreeBonus, loadEnemyProfile } from './queries'
import { autoFillLoadout } from '@/app/lib/progression/queries'
import { MAX_ROUNDS, NPC_WINS_ON_WIN, XP_ON_LOSS, XP_ON_WIN } from './constants'
import type { BattleState, Outcome, PlayerAction, TurnResult } from './types'

type BattleRow = Awaited<ReturnType<typeof prisma.battle.findFirst>>

async function loadActiveBattleContext(battleId: string) {
  const user = await getCurrentUser()
  if (!user) redirect('/login')

  const battle = await prisma.battle.findFirst({ where: { id: battleId, userId: user.id } })
  if (!battle) redirect('/battle/ai?error=not_found')
  if (battle.status !== 'ACTIVE') redirect(`/battle/ai/${battleId}`)

  const userCharacter = await prisma.userCharacter.findUnique({ where: { id: battle.playerCharacterId }, include: { character: true } })
  const enemy = await loadEnemyProfile(battle)
  if (!userCharacter || !enemy) redirect(`/battle/ai?error=not_found`)

  const [playerSkills, playerTransformations] = await Promise.all([
    getEquippedSkills(userCharacter.id),
    getPlayerTransformations(userCharacter.characterId, userCharacter.level),
  ])

  return {
    battle: battle as NonNullable<BattleRow>,
    userCharacter,
    enemySkills: enemy.skills,
    xpMultiplier: enemy.xpMultiplier,
    playerSkills,
    playerTransformations,
    state: battle.state as unknown as BattleState,
  }
}

function decideDrawOrHpTiebreak(state: BattleState): Outcome {
  const playerRatio = state.player.maxHp > 0 ? state.player.currentHp / state.player.maxHp : 0
  const enemyRatio = state.enemy.maxHp > 0 ? state.enemy.currentHp / state.enemy.maxHp : 0
  if (Math.abs(playerRatio - enemyRatio) < 0.001) return 'DRAW'
  return playerRatio > enemyRatio ? 'PLAYER_WIN' : 'ENEMY_WIN'
}

async function persistRound(
  battleId: string,
  expectedTurnNumber: number,
  newState: BattleState,
  turnResults: TurnResult[],
  userCharacterId: string,
  userCharacterCharacterId: string,
  userCharacterLevel: number,
  userCharacterExperience: number,
  xpMultiplier: number
) {
  const nextTurnNumber = expectedTurnNumber + 1
  const forcedEnd = newState.outcome === null && nextTurnNumber > MAX_ROUNDS
  const finalState: BattleState = forcedEnd ? { ...newState, outcome: decideDrawOrHpTiebreak(newState) } : newState
  const isFinished = finalState.outcome !== null

  // Computed up front (pure function, no DB needed) so we know the resulting
  // level outside the transaction too, without re-fetching afterward.
  const reward = isFinished
    ? applyExperience(
        userCharacterLevel,
        userCharacterExperience,
        Math.round((finalState.outcome === 'PLAYER_WIN' ? XP_ON_WIN : finalState.outcome === 'ENEMY_WIN' ? XP_ON_LOSS : (XP_ON_WIN + XP_ON_LOSS) / 2) * xpMultiplier)
      )
    : null

  await prisma.$transaction(async (tx) => {
    const updateResult = await tx.battle.updateMany({
      where: { id: battleId, turnNumber: expectedTurnNumber },
      data: {
        state: finalState as unknown as Prisma.InputJsonValue,
        turnNumber: nextTurnNumber,
        status: isFinished ? 'FINISHED' : 'ACTIVE',
      },
    })
    if (updateResult.count === 0) throw new Error('CONCURRENT_UPDATE')

    const existingTurnCount = await tx.turn.count({ where: { battleId } })
    let actionNumber = existingTurnCount + 1
    for (const result of turnResults) {
      await tx.turn.create({
        data: {
          battleId,
          number: actionNumber++,
          actor: result.side,
          skillId: result.skillId,
          result: result as unknown as Prisma.InputJsonValue,
        },
      })
      if (result.kind === 'TRANSFORM' && result.side === 'PLAYER' && result.transformationId) {
        await tx.userCharacterTransformation.upsert({
          where: { userCharacterId_transformationId: { userCharacterId, transformationId: result.transformationId } },
          create: { userCharacterId, transformationId: result.transformationId, unlockedAtLevel: userCharacterLevel },
          update: {},
        })
      }
    }

    if (reward) {
      await tx.userCharacter.update({
        where: { id: userCharacterId },
        data: {
          level: reward.level,
          experience: reward.experience,
          pointsAvailable: { increment: reward.pointsGained },
          ...(finalState.outcome === 'PLAYER_WIN' ? { npcWins: { increment: NPC_WINS_ON_WIN } } : {}),
        },
      })
    }
  })

  // A level-up may have made new skills eligible - backfill any free loadout
  // slots with them so a win doesn't quietly leave new moves unequipped.
  if (reward && reward.level > userCharacterLevel) {
    await autoFillLoadout(userCharacterId, userCharacterCharacterId, reward.level)
  }

  // Server Actions invoked without a redirect() rely on the router refreshing
  // the current route on their own, which turned out not to happen reliably
  // for this dynamic, cookie-gated route in Next 16 — revalidate explicitly
  // instead of assuming it.
  revalidatePath(`/battle/ai/${battleId}`)
  if (isFinished) {
    revalidatePath('/dashboard')
    revalidatePath('/status')
  }
}

export async function startAiBattle(userCharacterId: string): Promise<never> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const userId = user.id

  const userCharacter = await prisma.userCharacter.findFirst({ where: { id: userCharacterId, userId }, include: { character: true } })
  if (!userCharacter) redirect('/select')

  const existing = await prisma.battle.findFirst({
    where: { userId, playerCharacterId: userCharacterId, status: 'ACTIVE', enemyCharacterId: { not: null } },
    select: { id: true },
  })
  if (existing) redirect(`/battle/ai/${existing.id}`)

  const enemyPool = await prisma.character.findMany({ where: { id: { not: userCharacter.characterId } } })
  const enemyCharacter = enemyPool[Math.floor(Math.random() * enemyPool.length)]

  const treeBonus = await getTreeBonus(userCharacterId)
  const playerBase = computeBaseStats(userCharacter.character, treeBonus)
  const enemyBase = computeBaseStats(enemyCharacter, { hp: 0, attack: 0, defense: 0, speed: 0 })
  const state = createInitialState(playerBase, enemyBase)

  const battle = await prisma.battle.create({
    data: {
      userId,
      playerCharacterId: userCharacterId,
      enemyCharacterId: enemyCharacter.id,
      status: 'ACTIVE',
      turnNumber: 1,
      state: state as unknown as Prisma.InputJsonValue,
    },
  })

  redirect(`/battle/ai/${battle.id}`)
}

export async function startRaidBattle(userCharacterId: string): Promise<never> {
  const user = await getCurrentUser()
  if (!user) redirect('/login')
  const userId = user.id

  const userCharacter = await prisma.userCharacter.findFirst({ where: { id: userCharacterId, userId }, include: { character: true } })
  if (!userCharacter) redirect('/select')

  const existing = await prisma.battle.findFirst({
    where: { userId, playerCharacterId: userCharacterId, status: 'ACTIVE', enemyMonsterId: { not: null } },
    select: { id: true },
  })
  if (existing) redirect(`/battle/ai/${existing.id}`)

  // Only the tier-1 Hollow exists for now - no selection screen yet.
  const monster = await prisma.monster.findFirst({ where: { name: 'Hollow' } })
  if (!monster) redirect('/battle/raid?error=not_found')

  const treeBonus = await getTreeBonus(userCharacterId)
  const playerBase = computeBaseStats(userCharacter.character, treeBonus)
  const enemyBase = computeBaseStats(monster, { hp: 0, attack: 0, defense: 0, speed: 0 })
  const state = createInitialState(playerBase, enemyBase)

  const battle = await prisma.battle.create({
    data: {
      userId,
      playerCharacterId: userCharacterId,
      enemyMonsterId: monster.id,
      status: 'ACTIVE',
      turnNumber: 1,
      state: state as unknown as Prisma.InputJsonValue,
    },
  })

  redirect(`/battle/ai/${battle.id}`)
}

export async function takeTurn(battleId: string, skillId: string | null): Promise<void> {
  const ctx = await loadActiveBattleContext(battleId)
  const chosenSkill = skillId ? ctx.playerSkills[skillId] ?? null : null
  if (skillId && !chosenSkill) redirect(`/battle/ai/${battleId}?error=invalid_skill`)
  if (!isLegalMove(ctx.state.player, chosenSkill)) redirect(`/battle/ai/${battleId}?error=illegal_move`)

  const playerAction: PlayerAction = { kind: 'ATTACK', skillId }
  const enemySkillId = pickAiSkill(ctx.state.enemy, Object.values(ctx.enemySkills))

  const { state: newState, turnResults } = resolveRound(
    ctx.state,
    { playerAction, enemyAction: { skillId: enemySkillId } },
    { playerSkills: ctx.playerSkills, enemySkills: ctx.enemySkills, playerTransformations: ctx.playerTransformations }
  )

  try {
    await persistRound(
      battleId,
      ctx.battle.turnNumber,
      newState,
      turnResults,
      ctx.userCharacter.id,
      ctx.userCharacter.characterId,
      ctx.userCharacter.level,
      ctx.userCharacter.experience,
      ctx.xpMultiplier
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'CONCURRENT_UPDATE') redirect(`/battle/ai/${battleId}?error=conflict`)
    throw e
  }
}

export async function activateTransformation(battleId: string, transformationId: string): Promise<void> {
  const ctx = await loadActiveBattleContext(battleId)
  if (ctx.state.player.activeTransformationId) redirect(`/battle/ai/${battleId}?error=already_transformed`)
  if (!ctx.playerTransformations[transformationId]) redirect(`/battle/ai/${battleId}?error=invalid_transformation`)

  const playerAction: PlayerAction = { kind: 'TRANSFORM', transformationId }
  const enemySkillId = pickAiSkill(ctx.state.enemy, Object.values(ctx.enemySkills))

  const { state: newState, turnResults } = resolveRound(
    ctx.state,
    { playerAction, enemyAction: { skillId: enemySkillId } },
    { playerSkills: ctx.playerSkills, enemySkills: ctx.enemySkills, playerTransformations: ctx.playerTransformations }
  )

  try {
    await persistRound(
      battleId,
      ctx.battle.turnNumber,
      newState,
      turnResults,
      ctx.userCharacter.id,
      ctx.userCharacter.characterId,
      ctx.userCharacter.level,
      ctx.userCharacter.experience,
      ctx.xpMultiplier
    )
  } catch (e) {
    if (e instanceof Error && e.message === 'CONCURRENT_UPDATE') redirect(`/battle/ai/${battleId}?error=conflict`)
    throw e
  }
}
