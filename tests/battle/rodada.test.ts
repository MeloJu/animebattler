import { describe, it, expect } from 'vitest'
import { impactoDaRodada } from '@/app/lib/battle/rodada'
import type { TurnResult } from '@/app/lib/battle/types'

/**
 * O risco que estes testes cobrem é UM: atribuir o dano ao lado errado.
 *
 * `side` significa coisas diferentes conforme o tipo do turno — quem agiu num
 * ATTACK, quem sofre num DOT_TICK, quem teve a guarda partida num
 * GUARD_BREAK. Errar isso não deixa a tela sem animação: deixa o lutador
 * ERRADO tremendo, que é informação falsa em cima de informação certa.
 */

const turno = (over: Partial<TurnResult>): TurnResult => ({
  version: 1,
  side: 'PLAYER',
  kind: 'ATTACK',
  skillId: null,
  skillName: 'Golpe',
  ...over,
})

describe('de quem é o dano', () => {
  it('ataque do jogador machuca o INIMIGO', () => {
    const r = impactoDaRodada([turno({ side: 'PLAYER', damage: 30, severidade: 'solido' })])
    expect(r.ENEMY.dano).toBe(30)
    expect(r.PLAYER.dano).toBe(0)
  })

  it('ataque do inimigo machuca o JOGADOR', () => {
    const r = impactoDaRodada([turno({ side: 'ENEMY', damage: 18, severidade: 'raspao' })])
    expect(r.PLAYER.dano).toBe(18)
    expect(r.ENEMY.dano).toBe(0)
  })

  it('dano contínuo pertence a quem SOFRE, não ao lado oposto', () => {
    const r = impactoDaRodada([turno({ side: 'PLAYER', kind: 'DOT_TICK', damage: 7 })])
    expect(r.PLAYER.dano).toBe(7)
    expect(r.ENEMY.dano).toBe(0)
  })

  it('contra-ataque devolve o dano para quem BATEU', () => {
    const r = impactoDaRodada([
      turno({ side: 'PLAYER', damage: 0, countered: true, reflectedDamage: 12 }),
    ])
    expect(r.PLAYER.dano).toBe(12)
    expect(r.ENEMY.dano).toBe(0)
  })

  it('guarda partida marca quem PERDEU a guarda', () => {
    const r = impactoDaRodada([turno({ side: 'ENEMY', kind: 'GUARD_BREAK' })])
    expect(r.ENEMY.guardaQuebrada).toBe(true)
    expect(r.PLAYER.guardaQuebrada).toBe(false)
  })
})

describe('intensidade do movimento', () => {
  it('guarda a PIOR severidade da rodada, não a última', () => {
    const r = impactoDaRodada([
      turno({ side: 'ENEMY', damage: 40, severidade: 'devastador' }),
      turno({ side: 'ENEMY', damage: 5, severidade: 'raspao' }),
    ])
    expect(r.PLAYER.severidade).toBe('devastador')
  })

  it('crítico em qualquer um dos golpes marca o lado', () => {
    const r = impactoDaRodada([
      turno({ side: 'ENEMY', damage: 10, severidade: 'raspao' }),
      turno({ side: 'ENEMY', damage: 25, severidade: 'pesado', isCrit: true }),
    ])
    expect(r.PLAYER.critico).toBe(true)
  })

  it('dano contínuo não inventa severidade nem crítico', () => {
    const r = impactoDaRodada([turno({ side: 'PLAYER', kind: 'DOT_TICK', damage: 9 })])
    expect(r.PLAYER.severidade).toBeNull()
    expect(r.PLAYER.critico).toBe(false)
  })
})

describe('o que NÃO conta como impacto', () => {
  it('golpe que errou não faz ninguém tremer', () => {
    const r = impactoDaRodada([turno({ side: 'PLAYER', errou: true, damage: 0 })])
    expect(r.ENEMY.dano).toBe(0)
    expect(r.ENEMY.severidade).toBeNull()
  })

  it('habilidade de suporte sem dano não conta', () => {
    const r = impactoDaRodada([turno({ side: 'PLAYER', kind: 'SUPPORT', damage: 0, healed: 20 })])
    expect(r.ENEMY.dano).toBe(0)
    expect(r.PLAYER.dano).toBe(0)
  })

  it('eventos de domínio e transformação passam batido', () => {
    const r = impactoDaRodada([
      turno({ side: 'PLAYER', kind: 'DOMAIN_OPEN' }),
      turno({ side: 'ENEMY', kind: 'TRANSFORM' }),
      turno({ side: 'PLAYER', kind: 'STUNNED' }),
    ])
    expect(r.PLAYER.dano).toBe(0)
    expect(r.ENEMY.dano).toBe(0)
  })
})

describe('a rodada inteira soma', () => {
  it('golpe + dano contínuo + reflexo no mesmo round', () => {
    const r = impactoDaRodada([
      turno({ side: 'PLAYER', kind: 'DOT_TICK', damage: 6 }),
      turno({ side: 'ENEMY', damage: 22, severidade: 'pesado' }),
      turno({ side: 'PLAYER', damage: 0, countered: true, reflectedDamage: 9 }),
    ])
    // Os TRES caem no jogador: 6 de veneno + 22 do golpe inimigo + 9 que
    // voltaram do contra-ataque dele = 37.
    expect(r.PLAYER.dano).toBe(37)
    expect(r.PLAYER.severidade).toBe('pesado')
    expect(r.ENEMY.dano).toBe(0)
  })
})
