import { describe, it, expect } from 'vitest'
import { comHeroi, createInitialState, heroi, resolveRound, vilao } from '@/app/lib/battle/engine'
import type { AcoesDaRodada, BaseStats, SkillDef } from '@/app/lib/battle/types'

/**
 * COMBO_FOLLOWUP: a finalização de uma sequência de duas ações.
 *
 * Carrega numa rodada, finaliza na outra — e quebra com QUALQUER ação
 * diferente no meio, decisão explícita: bloquear, se transformar ou ficar
 * atordoado sem escolher isso apagam a carga do mesmo jeito que atacar com
 * outra coisa. É o oposto do design mais permissivo (deixar sobreviver),
 * escolhido de propósito para exigir comprometimento real com a sequência.
 */

const NUNCA_CRITA = () => 1

const stats = (over: Partial<BaseStats> = {}): BaseStats => ({
  hp: 300,
  attack: 20,
  defense: 10,
  speed: 15,
  energy: 300,
  stamina: 300,
  ...over,
})

const carga = skillComTag('carga', ['combo:teste'])
function skillComTag(id: string, tags: string[]): SkillDef {
  return { id, name: id, power: 15, energyCost: 0, cooldown: 0, effects: [], scalingStat: 'attack', tags }
}

const finalizacao: SkillDef = {
  id: 'final',
  name: 'Finalização',
  power: 20,
  energyCost: 0,
  cooldown: 0,
  effects: [{ type: 'COMBO_FOLLOWUP', target: 'SELF', magnitude: 50, comboTag: 'combo:teste' }],
  scalingStat: 'attack',
  tags: [],
}

const semTag = skillComTag('sem-tag', [])
const outraCarga = skillComTag('outra-carga', ['combo:outra'])

function agir(
  estado: ReturnType<typeof createInitialState>,
  minhaAcao: AcoesDaRodada['aliadas'][number],
  skills: Record<string, SkillDef>
) {
  const acoes: AcoesDaRodada = { aliadas: [minhaAcao], inimigas: [{ kind: 'ATTACK', skillId: null }] }
  return resolveRound(estado, acoes, { playerSkills: skills, enemySkills: {}, playerTransformations: {} }, NUNCA_CRITA)
}

function golpe(estado: ReturnType<typeof createInitialState>, sk: SkillDef, skills: Record<string, SkillDef>) {
  return agir(estado, { kind: 'ATTACK', skillId: sk.id }, skills)
}

describe('a carga prepara e a finalização paga', () => {
  it('finalização SEM carga antes não ganha o bônus', () => {
    const base = createInitialState(stats(), stats())
    const semCarga = golpe(base, finalizacao, { final: finalizacao })
    expect(semCarga.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage).toBeGreaterThan(0)
  })

  it('carga seguida de finalização na rodada seguinte ganha o bônus', () => {
    const base = createInitialState(stats(), stats())
    const skills = { carga, final: finalizacao }

    const depoisDaCarga = golpe(base, carga, skills).state
    const semBonus = golpe(base, finalizacao, skills) // baseline: direto, sem carga
    const comBonus = golpe(depoisDaCarga, finalizacao, skills)

    const dSem = semBonus.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comBonus.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    expect(dCom / dSem).toBeCloseTo(1.5, 1)
  })

  it('a carga registra a combo-tag no estado do combatente', () => {
    const base = createInitialState(stats(), stats())
    const r = golpe(base, carga, { carga })
    expect(heroi(r.state).comboPreparado).toBe('combo:teste')
  })
})

describe('quebra com QUALQUER ação diferente no meio', () => {
  const skills = { carga, final: finalizacao, 'sem-tag': semTag, 'outra-carga': outraCarga }

  it('atacar com uma habilidade sem combo-tag apaga a carga', () => {
    const base = createInitialState(stats(), stats())
    const carregado = golpe(base, carga, skills).state
    const depoisDeOutraCoisa = golpe(carregado, semTag, skills).state
    expect(heroi(depoisDeOutraCoisa).comboPreparado).toBeUndefined()

    const r = golpe(depoisDeOutraCoisa, finalizacao, skills)
    const semNadaAntes = golpe(base, finalizacao, skills)
    expect(r.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage).toBe(
      semNadaAntes.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage
    )
  })

  it('atacar com uma carga DIFERENTE troca a tag em vez de somar', () => {
    const base = createInitialState(stats(), stats())
    const carregado = golpe(base, carga, skills).state
    const trocou = golpe(carregado, outraCarga, skills).state
    expect(heroi(trocou).comboPreparado).toBe('combo:outra')
  })

  it('bloquear no meio quebra a carga', () => {
    const base = createInitialState(stats(), stats())
    const carregado = golpe(base, carga, skills).state
    const depoisDeBloquear = agir(carregado, { kind: 'BLOCK' }, skills).state
    expect(heroi(depoisDeBloquear).comboPreparado).toBeUndefined()
  })

  it('atordoado no meio quebra a carga, mesmo sem ter escolhido isso', () => {
    const base = createInitialState(stats(), stats())
    const carregado = golpe(base, carga, skills).state
    const atordoado = comHeroi(carregado, {
      statusEffects: [{ id: 'stun-1', type: 'STUN' as const, magnitude: 1, remainingRounds: 2, sourceSkillName: 'x' }],
    })
    const depois = agir(atordoado, { kind: 'ATTACK', skillId: null }, skills).state
    expect(heroi(depois).comboPreparado).toBeUndefined()
  })

  it('usar a MESMA carga de novo mantém a preparação', () => {
    const base = createInitialState(stats(), stats())
    const primeira = golpe(base, carga, skills).state
    const segunda = golpe(primeira, carga, skills).state
    expect(heroi(segunda).comboPreparado).toBe('combo:teste')
  })
})

describe('não vira status', () => {
  it('COMBO_FOLLOWUP não aparece em statusEffects depois do golpe', () => {
    const base = createInitialState(stats(), stats())
    const carregado = golpe(base, carga, { carga, final: finalizacao }).state
    const r = golpe(carregado, finalizacao, { carga, final: finalizacao })
    expect(heroi(r.state).statusEffects).toHaveLength(0)
    expect(vilao(r.state).statusEffects).toHaveLength(0)
  })
})
