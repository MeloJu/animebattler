import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { requireUser } from '@/app/lib/session'
import { activateTransformation, takeTurn } from '@/app/lib/battle/actions'
import { getEquippedSkills, getPlayerTransformations, loadEnemyProfile } from '@/app/lib/battle/queries'
import { isLegalMove } from '@/app/lib/battle/engine'
import { battleErrorMessage, describeEffect } from '@/app/lib/battle/presentation'
import { FighterCard } from '@/app/components/battle/FighterCard'
import { TurnLogEntry } from '@/app/components/battle/TurnLogEntry'
import type { BattleState, TurnResult } from '@/app/lib/battle/types'

export default async function BattleArenaPage({
  params,
  searchParams,
}: {
  params: Promise<{ battleId: string }>
  searchParams: Promise<{ error?: string }>
}) {
  const { battleId } = await params
  const { error } = await searchParams
  const errorMessage = battleErrorMessage(error)

  const user = await requireUser()

  const battle = await prisma.battle.findFirst({ where: { id: battleId, userId: user.id } })
  if (!battle) notFound()

  const [userCharacter, enemy, turns] = await Promise.all([
    prisma.userCharacter.findUnique({ where: { id: battle.playerCharacterId }, include: { character: true } }),
    loadEnemyProfile(battle),
    prisma.turn.findMany({ where: { battleId }, orderBy: { number: 'desc' } }),
  ])
  if (!userCharacter || !enemy) notFound()

  const state = battle.state as unknown as BattleState
  const isActive = battle.status === 'ACTIVE'
  const isRaid = battle.enemyMonsterId !== null

  const [playerSkills, playerTransformations] = await Promise.all([
    getEquippedSkills(userCharacter.id),
    getPlayerTransformations(userCharacter.characterId, userCharacter.level),
  ])

  const availableTransformations = Object.values(playerTransformations).filter(
    (t) => t.triggerType === 'MANUAL' && !state.player.activeTransformationId
  )

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{userCharacter.nickname} vs {enemy.name}</h1>
          <div className="text-sm opacity-60">
            {isRaid ? 'Modo: Raid' : 'Modo: IA'}
            {isActive && ` · Rodada ${battle.turnNumber}`}
          </div>
        </div>
        <Link href={isRaid ? '/battle/raid' : '/battle/ai'} className="text-sm underline">Sair</Link>
      </div>

      {errorMessage && (
        <div className="rounded-md border border-red-300 bg-red-50 px-4 py-2 text-sm text-red-700">{errorMessage}</div>
      )}

      {!isActive && (
        <div className="card p-6 space-y-3">
          <div className="text-lg font-semibold">
            {state.outcome === 'PLAYER_WIN' && 'Vitória!'}
            {state.outcome === 'ENEMY_WIN' && 'Derrota.'}
            {state.outcome === 'DRAW' && 'Empate.'}
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="btn-primary rounded-md px-4 py-2 text-sm">Dashboard</Link>
            <Link href={isRaid ? '/battle/raid' : '/battle/ai'} className="rounded-md px-4 py-2 text-sm border border-black/10">
              {isRaid ? 'Nova Raid' : 'Nova Batalha'}
            </Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <FighterCard
          name={userCharacter.nickname}
          imageUrl={userCharacter.character.imageUrl}
          levelBadge={userCharacter.level}
          transformationName={state.player.activeTransformationId ? playerTransformations[state.player.activeTransformationId]?.name : undefined}
          combatant={state.player}
        />

        <div className="space-y-4">
          <div className="card p-4">
            <h2 className="font-semibold mb-2">Histórico</h2>
            <ul className="space-y-1 text-sm max-h-96 overflow-y-auto">
              {turns.length === 0 && <li className="opacity-60">Nenhuma ação ainda.</li>}
              {turns.map((turn) => (
                <li key={turn.id} className="opacity-80">
                  <TurnLogEntry turn={turn.result as unknown as TurnResult} playerName={userCharacter.nickname} enemyName={enemy.name} />
                </li>
              ))}
            </ul>
          </div>

          {isActive && (
            <div className="card p-4 space-y-3">
              <h2 className="font-semibold">Ações</h2>
              <div className="flex flex-wrap gap-2">
                <form action={takeTurn.bind(null, battleId, null)}>
                  <button type="submit" className="rounded-md px-3 py-2 text-sm border border-black/10 hover:bg-black/5">
                    Ataque Básico
                  </button>
                </form>
                {Object.values(playerSkills).map((skill) => {
                  const legal = isLegalMove(state.player, skill)
                  return (
                    <form key={skill.id} action={takeTurn.bind(null, battleId, skill.id)}>
                      <button
                        type="submit"
                        disabled={!legal}
                        className={`rounded-md px-3 py-2 text-sm border text-left ${legal ? 'border-black/10 hover:bg-black/5' : 'border-black/5 opacity-40 cursor-not-allowed'}`}
                      >
                        <div>{skill.name} <span className="opacity-60">({skill.energyCost} EN)</span></div>
                        {skill.effects.length > 0 && (
                          <div className="text-xs opacity-60">{skill.effects.map(describeEffect).join(' · ')}</div>
                        )}
                      </button>
                    </form>
                  )
                })}
              </div>
              {availableTransformations.length > 0 && (
                <div className="pt-2 border-t border-black/10 flex flex-wrap gap-2">
                  {availableTransformations.map((t) => (
                    <form key={t.id} action={activateTransformation.bind(null, battleId, t.id)}>
                      <button type="submit" className="rounded-md px-3 py-2 text-sm border border-accent/40 text-accent hover:bg-accent/10">
                        Transformar: {t.name}
                      </button>
                    </form>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        <FighterCard name={enemy.name} imageUrl={enemy.imageUrl} combatant={state.enemy} />
      </div>
    </main>
  )
}
