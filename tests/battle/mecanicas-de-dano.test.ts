import { describe, it, expect } from 'vitest'
import { comVilao, createInitialState, heroi, resolveRound, vilao } from '@/app/lib/battle/engine'
import { EXECUCAO_LIMIAR_HP } from '@/app/lib/battle/constants'
import type { AcoesDaRodada, BaseStats, SkillDef } from '@/app/lib/battle/types'

/**
 * Três modificadores de dano que não existiam: EXECUTE, PIERCE, COMBO_STUN.
 *
 * O que os três têm em comum, e o que estes testes protegem acima de tudo, é
 * que NENHUM vira status persistente em ninguém. Eles descrevem uma
 * propriedade do GOLPE, consumida inteira dentro do mesmo golpe que a
 * carrega — diferente de BUFF/DEBUFF/SHIELD, que ficam na carta até
 * expirarem. Se um dia alguém adicionar um quarto tipo desses e esquecer de
 * filtrá-lo do caminho genérico, ele vira um status fantasma que nunca
 * deveria existir — e é exatamente isso que os testes de "não vira status"
 * de cada seção travam.
 */

const NUNCA_CRITA = () => 1

const stats = (over: Partial<BaseStats> = {}): BaseStats => ({
  hp: 200,
  attack: 20,
  defense: 10,
  speed: 15,
  energy: 200,
  stamina: 100,
  ...over,
})

const skill = (over: Partial<SkillDef> = {}): SkillDef => ({
  id: 'sk-1',
  name: 'Golpe',
  power: 30,
  energyCost: 10,
  cooldown: 2,
  effects: [],
  scalingStat: 'attack',
  tags: [],
  ...over,
})

function golpe(estado: ReturnType<typeof createInitialState>, sk: SkillDef) {
  const acoes: AcoesDaRodada = { aliadas: [{ kind: 'ATTACK', skillId: sk.id }], inimigas: [{ kind: 'ATTACK', skillId: null }] }
  return resolveRound(estado, acoes, { playerSkills: { [sk.id]: sk }, enemySkills: {}, playerTransformations: {} }, NUNCA_CRITA)
}

describe('EXECUTE — dano de acabamento', () => {
  it('não muda nada acima do limiar de vida', () => {
    const alvoCheio = createInitialState(stats(), stats())
    const semExecute = golpe(alvoCheio, skill())
    const comExecute = golpe(alvoCheio, skill({ effects: [{ type: 'EXECUTE', target: 'SELF', magnitude: 50 }] }))

    const dSem = semExecute.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comExecute.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(dCom).toBe(dSem)
  })

  it('dá o bônus quando o alvo está no limiar ou abaixo dele', () => {
    const vidaNoLimiar = Math.round(200 * EXECUCAO_LIMIAR_HP)
    const alvoFraco = comVilao(createInitialState(stats(), stats()), { currentHp: vidaNoLimiar })

    const semExecute = golpe(alvoFraco, skill())
    const comExecute = golpe(alvoFraco, skill({ effects: [{ type: 'EXECUTE', target: 'SELF', magnitude: 50 }] }))

    const dSem = semExecute.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comExecute.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(dCom / dSem).toBeCloseTo(1.5, 1)
  })

  it('não dá o bônus um ponto de vida acima do limiar', () => {
    const vidaAcima = Math.round(200 * EXECUCAO_LIMIAR_HP) + 5
    const alvo = comVilao(createInitialState(stats(), stats()), { currentHp: vidaAcima })

    const semExecute = golpe(alvo, skill())
    const comExecute = golpe(alvo, skill({ effects: [{ type: 'EXECUTE', target: 'SELF', magnitude: 50 }] }))

    const dSem = semExecute.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comExecute.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(dCom).toBe(dSem)
  })

  it('não vira status: some da carta depois do golpe', () => {
    const alvoFraco = comVilao(createInitialState(stats(), stats()), { currentHp: 10 })
    const r = golpe(alvoFraco, skill({ effects: [{ type: 'EXECUTE', target: 'SELF', magnitude: 50 }] }))
    expect(heroi(r.state).statusEffects).toHaveLength(0)
    expect(vilao(r.state).statusEffects).toHaveLength(0)
  })
})

describe('PIERCE — ignora defesa', () => {
  it('aumenta o dano contra um alvo bem defendido', () => {
    const alvoDefendido = createInitialState(stats(), stats({ defense: 100 }))
    const semPierce = golpe(alvoDefendido, skill())
    const comPierce = golpe(alvoDefendido, skill({ effects: [{ type: 'PIERCE', target: 'SELF', magnitude: 50 }] }))

    const dSem = semPierce.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comPierce.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(dCom).toBeGreaterThan(dSem)
  })

  it('100% de perfuração equivale a lutar contra defesa zero', () => {
    const alvoDefendido = createInitialState(stats(), stats({ defense: 100 }))
    const alvoSemDefesa = createInitialState(stats(), stats({ defense: 0 }))

    const comPierceTotal = golpe(alvoDefendido, skill({ effects: [{ type: 'PIERCE', target: 'SELF', magnitude: 100 }] }))
    const semDefesaAlguma = golpe(alvoSemDefesa, skill())

    const d1 = comPierceTotal.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const d2 = semDefesaAlguma.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(d1).toBe(d2)
  })

  it('não vira status', () => {
    const alvo = createInitialState(stats(), stats())
    const r = golpe(alvo, skill({ effects: [{ type: 'PIERCE', target: 'SELF', magnitude: 50 }] }))
    expect(heroi(r.state).statusEffects).toHaveLength(0)
    expect(vilao(r.state).statusEffects).toHaveLength(0)
  })
})

describe('COMBO_STUN — a jogada de prender e finalizar', () => {
  // remainingRounds: 2, não 1 — a manutenção do início da rodada decrementa
  // ANTES do ataque acontecer, então um stun de 1 rodada expiraria bem na
  // hora em que o golpe deveria aproveitá-lo.
  const alvoAtordoado = () =>
    comVilao(createInitialState(stats(), stats()), {
      statusEffects: [{ id: 'stun-1', type: 'STUN', magnitude: 1, remainingRounds: 2, sourceSkillName: 'Bakudō' }],
    })

  it('dá o bônus quando o alvo está atordoado', () => {
    const semAlvoPreso = createInitialState(stats(), stats())
    const comCombo = skill({ effects: [{ type: 'COMBO_STUN', target: 'SELF', magnitude: 40 }] })

    const semStun = golpe(semAlvoPreso, comCombo)
    const comStun = golpe(alvoAtordoado(), comCombo)

    const dSem = semStun.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comStun.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(dCom / dSem).toBeCloseTo(1.4, 1)
  })

  it('vale tanto pra quem atordoou quanto pra quem chega depois — o status não distingue a origem', () => {
    // O Bakudō pode ter sido de um aliado, uma rodada atrás. Quem finaliza
    // não precisa ser quem prendeu.
    const comCombo = skill({ effects: [{ type: 'COMBO_STUN', target: 'SELF', magnitude: 40 }] })
    const r = golpe(alvoAtordoado(), comCombo)
    expect(r.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage).toBeGreaterThan(0)
  })

  it('não vira status', () => {
    const r = golpe(alvoAtordoado(), skill({ effects: [{ type: 'COMBO_STUN', target: 'SELF', magnitude: 40 }] }))
    expect(heroi(r.state).statusEffects).toHaveLength(0)
  })
})

describe('os três se combinam sem interferir um no outro', () => {
  it('execução e perfuração juntas multiplicam', () => {
    const alvoFracoEDefendido = comVilao(createInitialState(stats(), stats({ defense: 100 })), { currentHp: 10 })
    const semNada = golpe(createInitialState(stats(), stats({ defense: 100 })), skill())
    const comOsDois = golpe(
      alvoFracoEDefendido,
      skill({
        effects: [
          { type: 'EXECUTE', target: 'SELF', magnitude: 50 },
          { type: 'PIERCE', target: 'SELF', magnitude: 50 },
        ],
      })
    )

    const dSem = semNada.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comOsDois.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(dCom).toBeGreaterThan(dSem * 1.5)
  })
})
