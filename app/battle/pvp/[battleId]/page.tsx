import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/app/lib/session'
import { getPvpBattleView } from '@/app/lib/pvp/queries'
import { submitPvpAction, forfeitPvpBattle } from '@/app/lib/pvp/actions'
import { getEquippedSkills } from '@/app/lib/battle/queries'
import { isLegalMove } from '@/app/lib/battle/engine'
import { battleErrorMessage, describeEffect } from '@/app/lib/battle/presentation'
import { FighterCard } from '@/app/components/battle/FighterCard'
import { TurnLogEntry } from '@/app/components/battle/TurnLogEntry'
import { LiveBattleSync } from '@/app/components/pvp/LiveBattleSync'
import type { TurnResult } from '@/app/lib/battle/types'

export default async function PvpArenaPage({
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
  const view = await getPvpBattleView(battleId, user.id)
  if (!view) notFound()

  const { battle, me, foe, state, turns } = view
  const isActive = battle.status === 'ACTIVE'
  const mySkills = await getEquippedSkills(me.userCharacter.id)

  // O motor nomeia os lados como player/enemy; o desfecho precisa ser lido na
  // perspectiva de quem está olhando, senão o convidado veria "Vitória!" ao
  // perder.
  const myOutcome = view.isHost
    ? state.outcome
    : state.outcome === 'PLAYER_WIN'
      ? 'ENEMY_WIN'
      : state.outcome === 'ENEMY_WIN'
        ? 'PLAYER_WIN'
        : state.outcome

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="heading text-2xl">
            {me.userCharacter.nickname} <span className="text-muted font-normal">vs</span> {foe.userCharacter.nickname}
          </h1>
          <div className="text-sm text-muted flex items-center gap-3 mt-1">
            <span>PvP · @{foe.username}</span>
            {isActive && <span>Rodada {battle.turnNumber}</span>}
            {isActive && <LiveBattleSync battleId={battleId} />}
          </div>
        </div>
        {isActive ? (
          <form action={forfeitPvpBattle.bind(null, battleId)}>
            <button type="submit" className="btn-ghost px-3 py-1.5 text-xs">Desistir</button>
          </form>
        ) : (
          <Link href="/battle/pvp" className="btn-ghost px-3 py-1.5 text-xs">Voltar ao lobby</Link>
        )}
      </div>

      {errorMessage && (
        <div className="card p-3 text-sm border-danger/40 text-danger">{errorMessage}</div>
      )}

      {!isActive && (
        <div className="card card-accent p-6 pl-7 space-y-3">
          <div className="heading text-xl">
            {myOutcome === 'PLAYER_WIN' && 'Vitória!'}
            {myOutcome === 'ENEMY_WIN' && 'Derrota.'}
            {myOutcome === 'DRAW' && 'Empate.'}
          </div>
          <div className="flex gap-2">
            <Link href="/battle/pvp" className="btn-primary px-4 py-2 text-sm">Nova partida</Link>
            <Link href="/dashboard" className="btn-ghost px-4 py-2 text-sm">Dashboard</Link>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-start">
        <FighterCard
          name={me.userCharacter.nickname}
          imageUrl={me.userCharacter.character.imageUrl}
          levelBadge={me.userCharacter.level}
          combatant={me.combatant}
        />

        <div className="space-y-4">
          {isActive && (
            <div className="card p-4">
              {me.submitted ? (
                <div className="text-sm">
                  <div className="font-bold text-spirit">Ação enviada ✓</div>
                  <div className="text-muted mt-1">
                    {foe.submitted
                      ? 'Resolvendo a rodada…'
                      : `Esperando ${foe.username} escolher. A rodada resolve sozinha quando ele jogar.`}
                  </div>
                </div>
              ) : (
                <div className="text-sm">
                  <div className="font-bold">Sua vez</div>
                  <div className="text-muted mt-1">
                    {foe.submitted ? `${foe.username} já escolheu — ele não vê a sua jogada.` : 'Os dois escolhem ao mesmo tempo.'}
                  </div>
                </div>
              )}
            </div>
          )}

          <div className="card p-4">
            <h2 className="heading text-sm mb-2">Histórico</h2>
            <ul className="space-y-1 text-sm max-h-72 overflow-y-auto">
              {turns.length === 0 && <li className="text-muted">Nenhuma ação ainda.</li>}
              {turns.map((turn) => (
                <li key={turn.id} className="text-muted">
                  {/* O log é gravado na perspectiva do motor (host = player);
                      os nomes são passados na mesma ordem pra bater. */}
                  <TurnLogEntry
                    turn={turn.result as unknown as TurnResult}
                    playerName={view.isHost ? me.userCharacter.nickname : foe.userCharacter.nickname}
                    enemyName={view.isHost ? foe.userCharacter.nickname : me.userCharacter.nickname}
                  />
                </li>
              ))}
            </ul>
          </div>

          {isActive && !me.submitted && (
            <div className="card p-4 space-y-3">
              <h2 className="heading text-sm">Ações</h2>
              <div className="flex flex-wrap gap-2">
                <form action={submitPvpAction.bind(null, battleId, null)}>
                  <button type="submit" className="btn-ghost px-3 py-2 text-sm">Ataque Básico</button>
                </form>
                {Object.values(mySkills).map((skill) => {
                  const legal = isLegalMove(me.combatant, skill)
                  return (
                    <form key={skill.id} action={submitPvpAction.bind(null, battleId, skill.id)}>
                      <button type="submit" disabled={!legal} className="btn-ghost px-3 py-2 text-sm text-left">
                        <div>
                          {skill.name} <span className="text-muted">({skill.energyCost} EN)</span>
                        </div>
                        {skill.effects.length > 0 && (
                          <div className="text-xs text-muted">{skill.effects.map(describeEffect).join(' · ')}</div>
                        )}
                      </button>
                    </form>
                  )
                })}
              </div>
            </div>
          )}
        </div>

        <FighterCard
          name={foe.userCharacter.nickname}
          imageUrl={foe.userCharacter.character.imageUrl}
          levelBadge={foe.userCharacter.level}
          combatant={foe.combatant}
        />
      </div>
    </main>
  )
}
