import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { prisma } from '@/app/lib/prisma'
import { requireUser } from '@/app/lib/session'
import { activateTransformation, takeTurn } from '@/app/lib/battle/actions'
import { getEquippedSkills, getPlayerTransformations, loadEnemyProfile } from '@/app/lib/battle/queries'
import { isLegalMove } from '@/app/lib/battle/engine'
import { battleErrorMessage, describeEffect } from '@/app/lib/battle/presentation'
import type { BattleState, CombatantState, StatusEffectInstance, TurnResult } from '@/app/lib/battle/types'

function StatBar({ label, current, max, colorClass }: { label: string; current: number; max: number; colorClass: string }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, Math.round((current / max) * 100))) : 0
  return (
    <div>
      <div className="flex justify-between text-xs mb-1">
        <span>{label}</span>
        <span>{Math.max(0, current)} / {max}</span>
      </div>
      <div className="h-2 w-full rounded-full bg-black/10 overflow-hidden">
        <div className={`h-full ${colorClass}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function StatusBadges({ effects }: { effects: StatusEffectInstance[] }) {
  if (effects.length === 0) return null
  return (
    <div className="flex flex-wrap gap-1">
      {effects.map((e) => (
        <span key={e.id} title={e.sourceSkillName} className="text-xs rounded-full bg-black/5 px-2 py-0.5">
          {describeEffect(e)} ({e.remainingRounds})
        </span>
      ))}
    </div>
  )
}

function FighterCard({
  name,
  imageUrl,
  levelBadge,
  transformationName,
  combatant,
}: {
  name: string
  imageUrl: string | null
  levelBadge?: number
  transformationName?: string
  combatant: CombatantState
}) {
  return (
    <div className="card p-4 space-y-3">
      <div className="relative h-40 w-full rounded-lg overflow-hidden bg-gray-200">
        {imageUrl ? (
          <Image src={imageUrl} alt={name} fill className="object-cover" sizes="(max-width: 1024px) 100vw, 320px" />
        ) : (
          <div className="h-full w-full flex items-center justify-center text-sm text-gray-500">No Image</div>
        )}
        {levelBadge !== undefined && (
          <span className="absolute top-2 right-2 rounded-full bg-accent text-white text-xs font-semibold px-2 py-1">Lv.{levelBadge}</span>
        )}
      </div>
      <div className="flex items-center gap-2 flex-wrap">
        <div className="font-semibold">{name}</div>
        {transformationName && (
          <span className="text-xs rounded-full bg-accent/20 text-accent px-2 py-0.5">{transformationName}</span>
        )}
      </div>
      <StatBar label="HP" current={combatant.currentHp} max={combatant.maxHp} colorClass="bg-green-500" />
      <StatBar label="Energia" current={combatant.currentEnergy} max={combatant.maxEnergy} colorClass="bg-blue-500" />
      <StatusBadges effects={combatant.statusEffects} />
    </div>
  )
}

function TurnLogEntry({ turn, playerName, enemyName }: { turn: TurnResult; playerName: string; enemyName: string }) {
  const actorName = turn.side === 'PLAYER' ? playerName : enemyName

  if (turn.kind === 'TRANSFORM') {
    return (
      <>
        <span className="font-medium">{actorName}</span> se transformou em <span className="font-medium">{turn.skillName}</span>.
      </>
    )
  }
  if (turn.kind === 'STUNNED') {
    return (
      <>
        <span className="font-medium">{actorName}</span> estava atordoado e perdeu a vez.
      </>
    )
  }
  if (turn.kind === 'DOT_TICK') {
    return (
      <>
        <span className="font-medium">{actorName}</span> sofreu {turn.damage} de dano de <span className="font-medium">{turn.skillName}</span>.
      </>
    )
  }

  // ATTACK or SUPPORT
  return (
    <>
      <span className="font-medium">{actorName}</span> usou <span className="font-medium">{turn.skillName}</span>
      {turn.countered && (
        <>, mas foi contra-atacado{typeof turn.reflectedDamage === 'number' ? ` e sofreu ${turn.reflectedDamage} de dano refletido` : ''}</>
      )}
      {!turn.countered && typeof turn.damage === 'number' && turn.damage > 0 && (
        <> e causou {turn.damage} de dano{turn.isCrit ? ' (CRÍTICO)' : ''}</>
      )}
      {typeof turn.healed === 'number' && turn.healed > 0 && <> e curou {turn.healed} de HP</>}
      {turn.effectsApplied && turn.effectsApplied.length > 0 && (
        <> ({turn.effectsApplied.map(describeEffect).join(', ')})</>
      )}
      .
    </>
  )
}

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
