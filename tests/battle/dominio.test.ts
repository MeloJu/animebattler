import { describe, it, expect } from 'vitest'
import { comHeroi, comVilao, createInitialState, heroi, resolveRound, vilao } from '@/app/lib/battle/engine'
import type { BaseStats, CombatantState, SkillDef, StatusEffectInstance } from '@/app/lib/battle/types'

/**
 * O domínio como ESTADO, não como golpe.
 *
 * O que estes testes protegem é a diferença entre as duas coisas. Antes, as
 * cinco Expansões de Domínio eram números grandes com recarga grande — nada
 * que uma habilidade comum não pudesse ser. Um teste que só checasse dano não
 * teria notado a troca, porque o dano é justamente a parte que DIMINUIU.
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

/** Uma Expansão de Domínio: golpe médio que abre o estado. */
const dominio = (id: string, nome: string, manutencao: number): SkillDef =>
  skill({
    id,
    name: nome,
    power: 30,
    energyCost: 40,
    cooldown: 6,
    tags: ['dominio', 'ultimate'],
    effects: [{ type: 'DOMAIN', target: 'SELF', magnitude: manutencao, duration: 3 }],
  })

const dominioAtivo = (c: CombatantState) => c.statusEffects.find((e) => e.type === 'DOMAIN')

const efeitoDe = (tipo: StatusEffectInstance['type'], over: Partial<StatusEffectInstance> = {}): StatusEffectInstance => ({
  id: `fx-${tipo}`,
  type: tipo,
  magnitude: 50,
  remainingRounds: 3,
  sourceSkillName: 'Preparo',
  ...over,
})

/** Jogador age, inimigo não faz nada — isola o efeito de um lado só. */
function jogadorUsa(state: ReturnType<typeof createInitialState>, sk: SkillDef, inimigoUsa: SkillDef | null = null) {
  return resolveRound(
    state,
    { playerAction: { kind: 'ATTACK', skillId: sk.id }, enemyAction: { skillId: inimigoUsa?.id ?? null } },
    {
      playerSkills: { [sk.id]: sk },
      enemySkills: inimigoUsa ? { [inimigoUsa.id]: inimigoUsa } : {},
      playerTransformations: {},
    },
    NUNCA_CRITA
  )
}

describe('abertura do domínio', () => {
  it('abre o estado no lançador e registra no log', () => {
    const s = createInitialState(stats(), stats())
    const r = jogadorUsa(s, dominio('d-1', 'Vazio Infinito', 22))

    expect(dominioAtivo(heroi(r.state))).toMatchObject({ magnitude: 22, remainingRounds: 3 })
    expect(dominioAtivo(vilao(r.state))).toBeUndefined()
    expect(r.turnResults.some((t) => t.kind === 'DOMAIN_OPEN' && t.side === 'PLAYER')).toBe(true)
  })

  it('reabrir troca o domínio em vez de acumular dois', () => {
    const s = createInitialState(stats(), stats())
    const primeiro = jogadorUsa(s, dominio('d-1', 'Vazio Infinito', 22))
    const segundo = jogadorUsa(primeiro.state, dominio('d-2', 'Outro Domínio', 15))

    expect(heroi(segundo.state).statusEffects.filter((e) => e.type === 'DOMAIN')).toHaveLength(1)
    expect(dominioAtivo(heroi(segundo.state))!.magnitude).toBe(15)
  })
})

describe('acerto garantido', () => {
  it('o golpe atravessa o escudo do oponente', () => {
    const base = createInitialState(stats(), stats())
    const comEscudo = comVilao(base, { statusEffects: [efeitoDe('SHIELD', { magnitude: 500 })] })

    const semDominio = jogadorUsa(comEscudo, skill())
    expect(vilao(semDominio.state).currentHp).toBe(200)

    const comDominio = comHeroi(comEscudo, { statusEffects: [efeitoDe('DOMAIN', { magnitude: 20 })] })
    const r = jogadorUsa(comDominio, skill())
    expect(vilao(r.state).currentHp).toBeLessThan(200)
    expect(r.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.acertoGarantido).toBe(true)
  })

  it('o golpe não é refletido pelo counter do oponente', () => {
    const base = createInitialState(stats(), stats())
    const comCounter = comVilao(base, { statusEffects: [efeitoDe('COUNTER', { magnitude: 100 })] })

    const semDominio = jogadorUsa(comCounter, skill())
    expect(semDominio.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.countered).toBe(true)
    expect(heroi(semDominio.state).currentHp).toBeLessThan(200)

    const comDominio = comHeroi(comCounter, { statusEffects: [efeitoDe('DOMAIN', { magnitude: 20 })] })
    const r = jogadorUsa(comDominio, skill())
    expect(r.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.countered).toBeUndefined()
    expect(vilao(r.state).currentHp).toBeLessThan(200)
  })

  it('amplifica o dano em 20% mesmo contra um oponente sem defesa', () => {
    // A primeira versão do domínio dava SÓ o acerto garantido, e com isso
    // abrir contra alguém desprotegido era estritamente pior que bater — o
    // poder direto da habilidade tinha caído para pagar pelo estado. Sem esta
    // amplificação o domínio é uma armadilha para quem o usa.
    const base = createInitialState(stats(), stats())
    const semDominio = jogadorUsa(base, skill())
    const comDominio = jogadorUsa(
      comHeroi(base, { statusEffects: [efeitoDe('DOMAIN', { magnitude: 20 })] }),
      skill()
    )
    const dSem = semDominio.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    const dCom = comDominio.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!.damage!
    // Razão, não igualdade exata: a amplificação entra em `raw`, antes da
    // mitigação por defesa e do arredondamento final, então reproduzir a
    // conta a partir do dano já arredondado erra por 1.
    expect(dCom / dSem).toBeCloseTo(1.2, 1)
  })
})

describe('manutenção', () => {
  it('cobra energia por rodada de quem mantém aberto', () => {
    const base = createInitialState(stats(), stats())
    const comDominio = comHeroi(base, { currentEnergy: 100, statusEffects: [efeitoDe('DOMAIN', { magnitude: 20 })] })
    const r = jogadorUsa(comDominio, skill({ energyCost: 0 }))

    // 100 + 16 de regeneração (8% de 200) − 20 de manutenção.
    expect(heroi(r.state).currentEnergy).toBe(96)
  })

  it('o domínio cai quando não há energia para sustentar', () => {
    const base = createInitialState(stats(), stats())
    const semGas = comHeroi(base, { currentEnergy: 0, statusEffects: [efeitoDe('DOMAIN', { magnitude: 90 })] })
    const r = jogadorUsa(semGas, skill({ energyCost: 0 }))

    expect(dominioAtivo(heroi(r.state))).toBeUndefined()
    expect(r.turnResults.some((t) => t.kind === 'DOMAIN_FALL' && t.side === 'PLAYER')).toBe(true)
  })

  it('expira sozinho ao fim da duração', () => {
    const base = createInitialState(stats(), stats())
    let s = jogadorUsa(base, dominio('d-1', 'Vazio Infinito', 5)).state
    for (let i = 0; i < 3; i++) s = jogadorUsa(s, skill({ energyCost: 0 })).state
    expect(dominioAtivo(heroi(s))).toBeUndefined()
  })
})

describe('choque de domínios', () => {
  const abrirNoInimigo = (manutencao: number) => {
    const base = createInitialState(stats(), stats())
    return comVilao(base, { statusEffects: [efeitoDe('DOMAIN', { magnitude: manutencao })] })
  }

  it('o domínio de manutenção mais cara vence e atordoa o outro', () => {
    const r = jogadorUsa(abrirNoInimigo(13), dominio('d-1', 'Vazio Infinito', 22))

    expect(dominioAtivo(heroi(r.state))!.magnitude).toBe(22)
    expect(dominioAtivo(vilao(r.state))).toBeUndefined()
    expect(vilao(r.state).statusEffects.some((e) => e.type === 'STUN')).toBe(true)
    expect(r.turnResults.some((t) => t.kind === 'DOMAIN_CLASH' && t.side === 'PLAYER')).toBe(true)
  })

  it('abrir um domínio mais fraco custa a rodada: o seu nem chega a abrir', () => {
    const r = jogadorUsa(abrirNoInimigo(22), dominio('d-1', 'Jardim Sombrio', 13))

    expect(dominioAtivo(heroi(r.state))).toBeUndefined()
    expect(dominioAtivo(vilao(r.state))!.magnitude).toBe(22)
    expect(heroi(r.state).statusEffects.some((e) => e.type === 'STUN')).toBe(true)
  })

  it('domínios equivalentes se anulam e derrubam os dois donos', () => {
    const r = jogadorUsa(abrirNoInimigo(20), dominio('d-1', 'Santuário Malévolo', 20))

    expect(dominioAtivo(heroi(r.state))).toBeUndefined()
    expect(dominioAtivo(vilao(r.state))).toBeUndefined()
    expect(heroi(r.state).statusEffects.some((e) => e.type === 'STUN')).toBe(true)
    expect(vilao(r.state).statusEffects.some((e) => e.type === 'STUN')).toBe(true)
    expect(r.turnResults.some((t) => t.kind === 'DOMAIN_CLASH' && t.skillName === 'Domínios anulados')).toBe(true)
  })
})
