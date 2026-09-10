import { describe, it, expect } from 'vitest'
import { createInitialState, resolveRound, vilao } from '@/app/lib/battle/engine'
import type { AcoesDaRodada, BaseStats, SkillDef } from '@/app/lib/battle/types'

/**
 * EMPILHÁVEL (stack): reaplicar a MESMA habilidade enquanto o efeito
 * anterior dela ainda está de pé SOMA a magnitude em vez de só renovar a
 * duração. Pensado pra DOT/DEBUFF — queimadura/corte que piora a cada golpe,
 * até um teto (maxStacks, padrão 3× a magnitude-base).
 *
 * Sem `stack`, bater duas vezes com a mesma skill não deixa o efeito mais
 * forte — só mantém ele vivo (comportamento antigo, testado aqui também
 * pra não regredir).
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

function skillComDot(id: string, magnitude: number, stack: boolean): SkillDef {
  return {
    id,
    name: id,
    power: 5,
    energyCost: 5,
    cooldown: 0,
    effects: [{ type: 'DOT', target: 'ENEMY', magnitude, duration: 3, stack }],
    scalingStat: 'attack',
    tags: [],
  }
}

function golpe(estado: ReturnType<typeof createInitialState>, sk: SkillDef) {
  const acoes: AcoesDaRodada = { aliadas: [{ kind: 'ATTACK', skillId: sk.id }], inimigas: [{ kind: 'ATTACK', skillId: null }] }
  return resolveRound(estado, acoes, { playerSkills: { [sk.id]: sk }, enemySkills: {}, playerTransformations: {} }, NUNCA_CRITA)
}

function dotDoInimigo(estado: ReturnType<typeof createInitialState>) {
  return vilao(estado).statusEffects.find((e) => e.type === 'DOT')
}

describe('empilhável: reaplicar soma a magnitude', () => {
  it('sem stack, reaplicar a mesma skill RENOVA sem aumentar a magnitude', () => {
    const skill = skillComDot('queima', 10, false)
    let estado = golpe(createInitialState(stats(), stats()), skill).state
    expect(dotDoInimigo(estado)!.magnitude).toBe(10)

    estado = golpe(estado, skill).state
    expect(dotDoInimigo(estado)!.magnitude).toBe(10)
  })

  it('com stack, reaplicar a mesma skill SOMA a magnitude', () => {
    const skill = skillComDot('queima', 10, true)
    let estado = golpe(createInitialState(stats(), stats()), skill).state
    expect(dotDoInimigo(estado)!.magnitude).toBe(10)

    estado = golpe(estado, skill).state
    expect(dotDoInimigo(estado)!.magnitude).toBe(20)

    estado = golpe(estado, skill).state
    expect(dotDoInimigo(estado)!.magnitude).toBe(30)
  })

  it('empilha até o teto de maxStacks (padrão 3×) e não passa disso', () => {
    const skill = skillComDot('queima', 10, true)
    let estado = createInitialState(stats(), stats())
    for (let i = 0; i < 6; i++) estado = golpe(estado, skill).state
    expect(dotDoInimigo(estado)!.magnitude).toBe(30)
  })

  it('respeita um maxStacks customizado', () => {
    const skill: SkillDef = {
      id: 'queima5',
      name: 'queima5',
      power: 5,
      energyCost: 5,
      cooldown: 0,
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 3, stack: true, maxStacks: 5 }],
      scalingStat: 'attack',
      tags: [],
    }
    let estado = createInitialState(stats(), stats())
    for (let i = 0; i < 8; i++) estado = golpe(estado, skill).state
    expect(dotDoInimigo(estado)!.magnitude).toBe(50)
  })

  it('reaplicar RENOVA a duração junto com a soma', () => {
    const skill = skillComDot('queima', 10, true)
    let estado = golpe(createInitialState(stats(), stats()), skill).state
    // deixa a duração cair pra perto do fim antes de reaplicar — ataque
    // básico sem skill, pra não introduzir um segundo DOT no meio do teste.
    estado = golpe(estado, { id: 'basico', name: 'basico', power: 0, energyCost: 0, cooldown: 0, effects: [], scalingStat: 'attack', tags: [] }).state
    expect(dotDoInimigo(estado)!.remainingRounds).toBe(2)

    estado = golpe(estado, skill).state
    expect(dotDoInimigo(estado)!.remainingRounds).toBe(3)
  })

  it('uma skill DIFERENTE não soma na pilha da outra, mesmo com stack nas duas', () => {
    const a = skillComDot('fogo-a', 10, true)
    const b = skillComDot('fogo-b', 15, true)
    let estado = golpe(createInitialState(stats(), stats()), a).state
    estado = golpe(estado, b).state
    // duas instâncias distintas, nenhuma somada na outra
    const dots = vilao(estado).statusEffects.filter((e) => e.type === 'DOT')
    expect(dots).toHaveLength(2)
    expect(dots.map((d) => d.magnitude).sort()).toEqual([10, 15])
  })

  it('um DEBUFF empilhável também soma, não só DOT', () => {
    const skill: SkillDef = {
      id: 'corrosao',
      name: 'corrosao',
      power: 5,
      energyCost: 5,
      cooldown: 0,
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 5, duration: 3, stack: true }],
      scalingStat: 'attack',
      tags: [],
    }
    let estado = golpe(createInitialState(stats(), stats()), skill).state
    estado = golpe(estado, skill).state
    const debuff = vilao(estado).statusEffects.find((e) => e.type === 'DEBUFF')
    expect(debuff!.magnitude).toBe(10)
  })

  it('a magnitude empilhada é a que o DOT realmente usa pra causar dano', () => {
    const skill = skillComDot('queima', 10, true)
    let estado = golpe(createInitialState(stats(), stats()), skill).state
    estado = golpe(estado, skill).state // magnitude agora é 20/rodada

    // A rodada seguinte também tem ataque básico dos dois lados — o que
    // importa aqui é só o tick do DOT, não o total de dano da rodada.
    const acoes: AcoesDaRodada = { aliadas: [{ kind: 'ATTACK', skillId: null }], inimigas: [{ kind: 'ATTACK', skillId: null }] }
    const r = resolveRound(estado, acoes, { playerSkills: {}, enemySkills: {}, playerTransformations: {} }, NUNCA_CRITA)
    const dotTick = r.turnResults.find((t) => t.kind === 'DOT_TICK' && t.side === 'ENEMY')
    expect(dotTick!.damage).toBe(20)
  })
})
