import Link from 'next/link'
import { notFound } from 'next/navigation'
import { requireUser } from '@/app/lib/session'
import { activateTransformation, takeTurn } from '@/app/lib/battle/actions'
import { getBattleView, getEquippedSkills, getPlayerTransformations } from '@/app/lib/battle/queries'
import { getRetratosDosFalantes, getStageOutro, parseDialogo } from '@/app/lib/story/queries'
import { CenaDeDialogo } from '@/app/components/story/CenaDeDialogo'
import { battleErrorMessage } from '@/app/lib/battle/presentation'
import { FighterCard } from '@/app/components/battle/FighterCard'
import { BotaoDeForma } from '@/app/components/battle/BotaoDeForma'
import { BotaoDeHabilidade } from '@/app/components/battle/BotaoDeHabilidade'
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

  const view = await getBattleView(battleId, user.id)
  if (!view) notFound()
  const { battle, userCharacter, enemy, turns } = view

  const state = battle.state as unknown as BattleState
  const isActive = battle.status === 'ACTIVE'
  // A origem manda no rótulo e no "voltar". Uma batalha de história contra um
  // Hollow é um Monster como a raid, mas mandar o jogador pra /battle/raid o
  // tiraria do arco no meio — por isso storyStageId é checado primeiro.
  const isStory = battle.storyStageId !== null
  const isRaid = !isStory && battle.enemyMonsterId !== null
  const modeLabel = isStory ? 'Modo: História' : isRaid ? 'Modo: Raid' : 'Modo: IA'
  const backHref = isStory ? '/story' : isRaid ? '/battle/raid' : '/battle/ai'
  const backLabel = isStory ? 'Voltar à História' : isRaid ? 'Nova Raid' : 'Nova Batalha'

  const [playerSkills, playerTransformations] = await Promise.all([
    getEquippedSkills(userCharacter.id),
    getPlayerTransformations(userCharacter.characterId, userCharacter.level),
  ])

  // Desfecho do estágio, encenado no momento em que o inimigo cai. Só é
  // buscado numa VITÓRIA de história: perder não tem desfecho, e ler o
  // fechamento do arco depois de morrer seria o oposto de recompensa.
  const venceuEstagio = isStory && !isActive && state.outcome === 'PLAYER_WIN'
  const stage = venceuEstagio && battle.storyStageId ? await getStageOutro(battle.storyStageId) : null
  const desfecho = parseDialogo(stage?.outroDialogue)
  const retratosDesfecho = await getRetratosDosFalantes(
    desfecho.map((f) => f.speaker).filter((n): n is string => n !== null)
  )

  const availableTransformations = Object.values(playerTransformations).filter(
    (t) => t.triggerType === 'MANUAL' && !state.player.activeTransformationId
  )

  return (
    <main className="mx-auto max-w-6xl p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">{userCharacter.nickname} vs {enemy.name}</h1>
          <div className="text-sm opacity-60">
            {modeLabel}
            {isActive && ` · Rodada ${battle.turnNumber}`}
          </div>
        </div>
        <Link href={backHref} className="text-sm underline">Sair</Link>
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
          {desfecho.length > 0 ? (
            <CenaDeDialogo falas={desfecho} retratos={retratosDesfecho} autoAbrir>
              <Link href={backHref} className="btn-primary rounded-md px-4 py-2 text-sm">
                {backLabel}
              </Link>
            </CenaDeDialogo>
          ) : (
            <div className="flex gap-2">
              <Link href="/dashboard" className="btn-primary rounded-md px-4 py-2 text-sm">Dashboard</Link>
              <Link href={backHref} className="rounded-md px-4 py-2 text-sm border border-border">
                {backLabel}
              </Link>
            </div>
          )}
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
                  <button type="submit" className="rounded-md px-3 py-2 text-sm border border-border hover:bg-surface-raised">
                    Ataque Básico
                  </button>
                </form>
                {Object.values(playerSkills).map((skill) => (
                  <form key={skill.id} action={takeTurn.bind(null, battleId, skill.id)}>
                    <BotaoDeHabilidade skill={skill} combatente={state.player} />
                  </form>
                ))}
              </div>
              {availableTransformations.length > 0 && (
                <div className="pt-3 border-t border-border space-y-2">
                  <div className="text-xs uppercase tracking-wide opacity-45">Formas</div>
                  {availableTransformations.map((t) => (
                    <form key={t.id} action={activateTransformation.bind(null, battleId, t.id)}>
                      <BotaoDeForma forma={t} energiaAtual={state.player.currentEnergy} />
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
