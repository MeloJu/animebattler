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
  if (turn.kind === 'DOMAIN_OPEN') {
    return (
      <>
        <span className="font-medium">{actorName}</span> expandiu{' '}
        <span className="font-medium">{turn.skillName}</span>. Dentro do domínio, os golpes dele acertam.
      </>
    )
  }
  if (turn.kind === 'DOMAIN_CLASH') {
    if (turn.skillName === 'Domínios anulados') {
      return (
        <>
          Os dois domínios se encontram e <span className="font-medium">colapsam juntos</span>.
        </>
      )
    }
    return (
      <>
        Domínio contra domínio: o de <span className="font-medium">{actorName}</span> prevalece, e o outro desaba.
      </>
    )
  }
  if (turn.kind === 'DOMAIN_FALL') {
    return (
      <>
        <span className="font-medium">{turn.skillName}</span> se fechou —{' '}
        <span className="font-medium">{actorName}</span> não tinha energia para sustentar.
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
      {/* Errar precisa ser dito com todas as letras. Sem esta linha, um golpe
          que passa longe aparece no log como "usou X." e some — indistinguível
          de uma habilidade de suporte que não faz dano. */}
      {turn.errou && <>, e o golpe passou longe</>}
      {turn.countered && (
        <>, mas foi contra-atacado{typeof turn.reflectedDamage === 'number' ? ` e sofreu ${turn.reflectedDamage} de dano refletido` : ''}</>
      )}
      {!turn.countered && typeof turn.damage === 'number' && turn.damage > 0 && (
        <>
          {' '}
          e causou {turn.damage} de dano{turn.isCrit ? ' (CRÍTICO)' : ''}
          {/* Sem isto, um golpe que atravessa escudo é indistinguível de um
              golpe contra alguém sem escudo — some justo a informação que
              justifica ter aberto o domínio. */}
          {turn.acertoGarantido && ', ignorando a defesa'}
        </>
      )}
      {typeof turn.healed === 'number' && turn.healed > 0 && <> e curou {turn.healed} de HP</>}
      {turn.effectsApplied && turn.effectsApplied.length > 0 && (
        <> ({turn.effectsApplied.map(describeEffect).join(', ')})</>
      )}
      .
    </>
  )
}
