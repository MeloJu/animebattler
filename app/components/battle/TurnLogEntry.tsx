import { describeEffect } from '@/app/lib/battle/presentation'
import type { TurnResult } from '@/app/lib/battle/types'

const NATUREZA_DO_CHOQUE: Record<string, string> = {
  beam: 'feixes',
  espada: 'aços',
  fisico: 'punhos',
}

export function TurnLogEntry({ turn, playerName, enemyName }: { turn: TurnResult; playerName: string; enemyName: string }) {
  const actorName = turn.side === 'PLAYER' ? playerName : enemyName

  if (turn.kind === 'TRANSFORM') {
    return (
      <>
        <span className="font-medium">{actorName}</span> se transformou em <span className="font-medium">{turn.skillName}</span>.
      </>
    )
  }
  if (turn.kind === 'CLASH') {
    // O choque é simultâneo, então não tem "ator": o vencedor é quem venceu, e
    // no empate ninguém venceu. Narrar como se alguém tivesse agido primeiro
    // contradiria a mecânica.
    const natureza = NATUREZA_DO_CHOQUE[turn.clashTag ?? ''] ?? 'golpes'
    if (turn.skillName === 'Choque equilibrado') {
      return (
        <>
          Os {natureza} se encontram e se anulam — <span className="font-medium">ninguém passa</span>.
        </>
      )
    }
    return (
      <>
        Os {natureza} se chocam, e <span className="font-medium">{actorName}</span> vence a disputa.
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
