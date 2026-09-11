import type { Side, TurnResult } from './types'

/**
 * O que ACONTECEU com cada lutador na rodada — para a tela poder ENCENAR.
 *
 * POR QUE ISTO EXISTE. A batalha é resolvida no servidor: o clique manda um
 * form, o servidor grava a rodada e a página re-renderiza com os números
 * novos. O navegador nunca presencia o golpe, ele recebe o "depois" já
 * pronto — e não se anima um impacto que o cliente não viu acontecer.
 *
 * Esta função reconstrói o impacto a partir dos turnos que o motor já grava,
 * que é a única fonte confiável do que houve. Nada aqui é decisão nova de
 * jogo: é tradução do log para o vocabulário da animação.
 *
 * ATRIBUIR O DANO AO LADO CERTO É A PARTE DELICADA, porque `side` significa
 * coisas diferentes conforme o tipo do turno:
 *
 *   ATTACK/SUPPORT  `side` é quem AGIU — o dano cai no lado oposto.
 *   contra-atacado  o dano refletido volta para quem AGIU, não para o alvo.
 *   DOT_TICK        `side` é quem SOFRE — veneno/queimadura é do próprio dono.
 *   GUARD_BREAK     `side` é quem TEVE a guarda partida (ver engine.ts).
 *
 * Trocar qualquer um desses faz o lutador errado tremer na tela, que é pior
 * que não animar nada: vira informação falsa em cima de informação certa.
 */
export type ImpactoNoLutador = {
  /** Soma de tudo que este lado sofreu na rodada. */
  dano: number
  /**
   * A severidade do PIOR golpe sofrido, não a soma. É o que decide a
   * intensidade do movimento — e vem do motor, que é quem conhece a vida
   * máxima do alvo: 30 de dano é um arranhão num tanque e quase um terço de
   * um conjurador.
   */
  severidade: NonNullable<TurnResult['severidade']> | null
  /** Algum dos golpes sofridos foi crítico. */
  critico: boolean
  /** A guarda deste lado se partiu — ele perde a rodada seguinte. */
  guardaQuebrada: boolean
}

const ORDEM_DE_SEVERIDADE: NonNullable<TurnResult['severidade']>[] = [
  'raspao',
  'solido',
  'pesado',
  'devastador',
]

function oposto(side: Side): Side {
  return side === 'PLAYER' ? 'ENEMY' : 'PLAYER'
}

function vazio(): ImpactoNoLutador {
  return { dano: 0, severidade: null, critico: false, guardaQuebrada: false }
}

function registra(
  alvo: ImpactoNoLutador,
  dano: number,
  severidade: TurnResult['severidade'],
  critico: boolean | undefined
) {
  alvo.dano += dano
  if (critico) alvo.critico = true
  if (!severidade) return
  const atual = alvo.severidade ? ORDEM_DE_SEVERIDADE.indexOf(alvo.severidade) : -1
  if (ORDEM_DE_SEVERIDADE.indexOf(severidade) > atual) alvo.severidade = severidade
}

/** Recebe os turnos de UMA rodada e diz o que cada lado sofreu nela. */
export function impactoDaRodada(resultados: TurnResult[]): Record<Side, ImpactoNoLutador> {
  const impacto: Record<Side, ImpactoNoLutador> = { PLAYER: vazio(), ENEMY: vazio() }

  for (const t of resultados) {
    if (t.kind === 'GUARD_BREAK') {
      impacto[t.side].guardaQuebrada = true
      continue
    }

    if (t.kind === 'DOT_TICK') {
      if (typeof t.damage === 'number' && t.damage > 0) {
        // Dano contínuo não tem severidade nem crítico: é a mesma mordida
        // toda rodada, e tratá-la como golpe faria a carta tremer por algo
        // que o jogador não acabou de sofrer.
        registra(impacto[t.side], t.damage, undefined, false)
      }
      continue
    }

    if (t.kind !== 'ATTACK' && t.kind !== 'SUPPORT') continue

    // Contra-ataque: o golpe foi negado e o troco volta para quem bateu.
    if (t.countered) {
      if (typeof t.reflectedDamage === 'number' && t.reflectedDamage > 0) {
        registra(impacto[t.side], t.reflectedDamage, undefined, false)
      }
      continue
    }

    if (typeof t.damage === 'number' && t.damage > 0) {
      registra(impacto[oposto(t.side)], t.damage, t.severidade, t.isCrit)
    }
  }

  return impacto
}
