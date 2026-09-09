import { describe, it, expect } from 'vitest'
import {
  comHeroi,
  createInitialState,
  custoDeErguerGuarda,
  heroi,
  podeBloquear,
  resolveRound,
} from '@/app/lib/battle/engine'
import { deveBloquear } from '@/app/lib/battle/ai'
import { BLOQUEIO_REDUCAO } from '@/app/lib/battle/constants'
import type { BaseStats, SkillDef } from '@/app/lib/battle/types'

/**
 * Bloqueio e quebra de guarda.
 *
 * A ideia central que estes testes protegem é que a STAMINA É A BARRA DE
 * GUARDA — não existe medidor novo. Bloquear converte dano de vida em dano de
 * stamina, e quando a reserva não cobre a conversão, a guarda quebra. Se
 * alguém trocar isso por um contador próprio, metade daqui falha.
 */

const NUNCA_CRITA = () => 1

const stats = (over: Partial<BaseStats> = {}): BaseStats => ({
  hp: 300,
  attack: 20,
  defense: 10,
  speed: 15,
  energy: 200,
  stamina: 200,
  ...over,
})

const skill = (over: Partial<SkillDef> = {}): SkillDef => ({
  id: 'sk-1',
  name: 'Golpe',
  power: 40,
  energyCost: 10,
  cooldown: 0,
  effects: [],
  scalingStat: 'attack',
  tags: [],
  ...over,
})

/** O inimigo ataca; o jogador escolhe bloquear ou não. */
function rodada(
  jogadorStats: BaseStats,
  inimigoStats: BaseStats,
  golpeDoInimigo: SkillDef,
  bloquear: boolean,
  estadoInicial?: ReturnType<typeof createInitialState>
) {
  const s = estadoInicial ?? createInitialState(jogadorStats, inimigoStats)
  return resolveRound(
    s,
    {
      // O jogador não ataca nos dois casos, para isolar o efeito da guarda.
      playerAction: bloquear ? { kind: 'BLOCK' } : { kind: 'ATTACK', skillId: 'inexistente' },
      enemyAction: { skillId: golpeDoInimigo.id },
    },
    { playerSkills: {}, enemySkills: { [golpeDoInimigo.id]: golpeDoInimigo }, playerTransformations: {} },
    NUNCA_CRITA
  )
}

describe('a guarda aparando', () => {
  it('reduz o dano recebido na proporção declarada', () => {
    const semGuarda = rodada(stats(), stats(), skill(), false)
    const comGuarda = rodada(stats(), stats(), skill(), true)

    const danoSem = 300 - heroi(semGuarda.state).currentHp
    const danoCom = 300 - heroi(comGuarda.state).currentHp

    expect(danoCom).toBe(danoSem - Math.round(danoSem * BLOQUEIO_REDUCAO))
    expect(comGuarda.turnResults.find((t) => t.side === 'ENEMY' && t.kind === 'ATTACK')!.bloqueado).toBe(true)
  })

  it('cobra da STAMINA exatamente o dano que impediu', () => {
    const semGuarda = rodada(stats(), stats(), skill(), false)
    const comGuarda = rodada(stats(), stats(), skill(), true)

    const danoSem = 300 - heroi(semGuarda.state).currentHp
    const impedido = Math.round(danoSem * BLOQUEIO_REDUCAO)
    const ataque = comGuarda.turnResults.find((t) => t.side === 'ENEMY' && t.kind === 'ATTACK')!

    expect(ataque.guardaGasta).toBe(impedido)
  })

  it('cobra também um custo de entrada, mesmo sem levar golpe', () => {
    // Sem isto, dois lados sem energia bloqueariam para sempre de graça e a
    // luta terminaria por tempo. É a trava contra o encastelamento eterno.
    const s = createInitialState(stats(), stats())
    const r = resolveRound(
      s,
      { playerAction: { kind: 'BLOCK' }, enemyAction: { skillId: null, bloquear: true } },
      { playerSkills: {}, enemySkills: {}, playerTransformations: {} },
      NUNCA_CRITA
    )
    expect(heroi(r.state).currentStamina!).toBeLessThan(200)
    expect(r.turnResults.filter((t) => t.kind === 'BLOCK')).toHaveLength(2)
  })

  it('quem bloqueia não ataca', () => {
    const s = createInitialState(stats(), stats())
    const golpe = skill()
    const r = resolveRound(
      s,
      { playerAction: { kind: 'BLOCK' }, enemyAction: { skillId: golpe.id, bloquear: true } },
      { playerSkills: {}, enemySkills: { [golpe.id]: golpe }, playerTransformations: {} },
      NUNCA_CRITA
    )
    expect(heroi(r.state).currentHp).toBe(300)
    expect(r.turnResults.some((t) => t.kind === 'ATTACK')).toBe(false)
  })
})

describe('quebra de guarda', () => {
  // Stamina baixa demais para pagar o que o golpe traria.
  const fragil = stats({ stamina: 12 })

  it('o golpe entra INTEIRO quando a reserva não cobre', () => {
    const semGuarda = rodada(stats(), stats(), skill(), false)
    const quebrando = rodada(fragil, stats(), skill(), true)

    const danoSem = 300 - heroi(semGuarda.state).currentHp
    const danoQuebrando = 300 - heroi(quebrando.state).currentHp
    expect(danoQuebrando).toBe(danoSem)
    expect(quebrando.turnResults.find((t) => t.side === 'ENEMY' && t.kind === 'ATTACK')!.bloqueado).toBeUndefined()
  })

  it('zera a stamina e atordoa quem bloqueou', () => {
    const r = rodada(fragil, stats(), skill(), true)
    expect(heroi(r.state).currentStamina).toBe(0)
    expect(heroi(r.state).statusEffects.some((e) => e.type === 'STUN')).toBe(true)
    expect(r.turnResults.some((t) => t.kind === 'GUARD_BREAK' && t.side === 'PLAYER')).toBe(true)
  })

  it('acontece no golpe que ESTOURA a reserva, não quando ela já está vazia', () => {
    // É o que permite ao atacante gastar um golpe grande de propósito para
    // forçar a quebra — a jogada que a mecânica existe para criar.
    const golpeGrande = skill({ power: 90 })
    const golpePequeno = skill({ id: 'sk-2', power: 6 })

    const comReservaMedia = stats({ stamina: 30 })
    expect(heroi(rodada(comReservaMedia, stats(), golpePequeno, true).state).statusEffects).toHaveLength(0)
    expect(
      heroi(rodada(comReservaMedia, stats(), golpeGrande, true).state).statusEffects.some((e) => e.type === 'STUN')
    ).toBe(true)
  })

  it('sem stamina para o custo de entrada, a guarda nem sobe', () => {
    // A reserva zerada NÃO basta para este teste: a stamina regenera no início
    // da rodada, antes da ação. O custo de entrada é maior que a regeneração
    // justamente para que encastelar tenha fim — ver BLOQUEIO_CUSTO_BASE —,
    // então uma reserva pequena com máximo alto é o caso que de fato falha.
    const s = createInitialState(stats({ stamina: 200 }), stats())
    const seco = comHeroi(s, { currentStamina: 0 })
    expect(podeBloquear(heroi(seco))).toBe(false)

    const golpe = skill()
    const r = resolveRound(
      seco,
      { playerAction: { kind: 'BLOCK' }, enemyAction: { skillId: golpe.id } },
      { playerSkills: {}, enemySkills: { [golpe.id]: golpe }, playerTransformations: {} },
      NUNCA_CRITA
    )
    expect(r.turnResults.some((t) => t.kind === 'BLOCK')).toBe(false)
    // Sem guarda, o golpe entra inteiro — mas não há quebra nem atordoamento,
    // porque não houve guarda para quebrar.
    expect(heroi(r.state).statusEffects.some((e) => e.type === 'STUN')).toBe(false)
  })

  it('atordoado não consegue bloquear — perder a rodada é a punição inteira', () => {
    const s = createInitialState(stats(), stats())
    const atordoado = comHeroi(s, {
        statusEffects: [
          { id: 'st', type: 'STUN' as const, magnitude: 1, remainingRounds: 2, sourceSkillName: 'x' },
        ],
    })
    const golpe = skill()
    const r = resolveRound(
      atordoado,
      { playerAction: { kind: 'BLOCK' }, enemyAction: { skillId: golpe.id } },
      { playerSkills: {}, enemySkills: { [golpe.id]: golpe }, playerTransformations: {} },
      NUNCA_CRITA
    )
    expect(r.turnResults.some((t) => t.kind === 'BLOCK')).toBe(false)
    expect(heroi(r.state).currentStamina).toBe(200)
  })
})

describe('o custo de erguer a guarda', () => {
  it('escala com a reserva máxima — cada classe aguenta o que a stamina dela permite', () => {
    const suporte = heroi(createInitialState(stats({ stamina: 175 }), stats()))
    const conjurador = heroi(createInitialState(stats({ stamina: 75 }), stats()))
    expect(custoDeErguerGuarda(suporte)).toBeGreaterThan(custoDeErguerGuarda(conjurador))
  })

  it('nunca é zero, nem para quem tem reserva mínima', () => {
    const semNada = heroi(createInitialState(stats({ stamina: 1 }), stats()))
    expect(custoDeErguerGuarda(semNada)).toBeGreaterThanOrEqual(1)
  })
})

describe('quando a IA decide bloquear', () => {
  const cheio = () => heroi(createInitialState(stats(), stats()))
  const semEnergia = () => ({ ...cheio(), currentEnergy: 0 })

  it('bloqueia quando todo o arsenal ofensivo está impagável', () => {
    expect(deveBloquear(semEnergia(), [skill({ energyCost: 50 })])).toBe(true)
  })

  it('não bloqueia se ainda há golpe pagável', () => {
    expect(deveBloquear(semEnergia(), [skill({ energyCost: 0 })])).toBe(false)
  })

  it('não bloqueia quem não tem arsenal nenhum — aí o básico É a jogada', () => {
    // Sem esta regra, dois combatentes sem habilidade bloqueiam para sempre e
    // a luta empata por MAX_ROUNDS. Foi o que a simulação mostrou.
    expect(deveBloquear(semEnergia(), [])).toBe(false)
  })

  it('prefere a habilidade de suporte pagável à guarda', () => {
    // Escudo e cura continuam valendo depois da rodada; o bloqueio, não.
    const suporte = skill({ id: 'sup', power: 0, energyCost: 0, effects: [{ type: 'HEAL', target: 'SELF', magnitude: 20 }] })
    expect(deveBloquear(semEnergia(), [skill({ energyCost: 50 }), suporte])).toBe(false)
  })

  it('não bloqueia sem stamina para o custo de entrada', () => {
    const seco = { ...semEnergia(), currentStamina: 0 }
    expect(deveBloquear(seco, [skill({ energyCost: 50 })])).toBe(false)
  })
})
