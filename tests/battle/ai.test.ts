import { describe, it, expect } from 'vitest'
import { escolherLoadoutPadrao, pickAiSkill } from '@/app/lib/battle/ai'
import { createInitialState, heroi } from '@/app/lib/battle/engine'
import type { CombatantState, SkillDef } from '@/app/lib/battle/types'

const base = heroi(createInitialState(
  { hp: 100, attack: 20, defense: 10, speed: 15, energy: 100, stamina: 100 },
  { hp: 100, attack: 20, defense: 10, speed: 15, energy: 100, stamina: 100 }
))

const eu = (over: Partial<CombatantState> = {}): CombatantState => ({ ...base, ...over })

const skill = (over: Partial<SkillDef> = {}): SkillDef => ({
  id: 'sk',
  name: 'Golpe',
  power: 10,
  energyCost: 0,
  cooldown: 0,
  effects: [],
  scalingStat: 'attack',
  tags: [],
  ...over,
})

describe('pickAiSkill', () => {
  it('sem skills disponíveis, cai no ataque básico (null)', () => {
    expect(pickAiSkill(eu(), [])).toBeNull()
  })

  it('escolhe a skill de maior poder', () => {
    const escolha = pickAiSkill(eu(), [
      skill({ id: 'fraca', power: 10 }),
      skill({ id: 'forte', power: 50 }),
      skill({ id: 'media', power: 30 }),
    ])
    expect(escolha).toBe('forte')
  })

  it('empate de poder é desempatado pela menor energia', () => {
    const escolha = pickAiSkill(eu(), [
      skill({ id: 'cara', power: 30, energyCost: 40 }),
      skill({ id: 'barata', power: 30, energyCost: 5 }),
    ])
    expect(escolha).toBe('barata')
  })

  it('ignora skill em cooldown', () => {
    const escolha = pickAiSkill(eu({ cooldowns: { forte: 2 } }), [
      skill({ id: 'forte', power: 99 }),
      skill({ id: 'fraca', power: 10 }),
    ])
    expect(escolha).toBe('fraca')
  })

  it('ignora skill sem energia suficiente', () => {
    const escolha = pickAiSkill(eu({ currentEnergy: 5 }), [
      skill({ id: 'cara', power: 99, energyCost: 80 }),
      skill({ id: 'barata', power: 10, energyCost: 5 }),
    ])
    expect(escolha).toBe('barata')
  })

  it('abaixo de 40% de HP, prioriza cura mesmo tendo dano disponível', () => {
    const escolha = pickAiSkill(eu({ currentHp: 30, maxHp: 100 }), [
      skill({ id: 'dano', power: 99 }),
      skill({ id: 'cura', power: 0, effects: [{ type: 'HEAL', target: 'SELF', magnitude: 30 }] }),
    ])
    expect(escolha).toBe('cura')
  })

  it('com HP alto, ignora a cura e ataca', () => {
    const escolha = pickAiSkill(eu({ currentHp: 100, maxHp: 100 }), [
      skill({ id: 'dano', power: 99 }),
      skill({ id: 'cura', power: 0, effects: [{ type: 'HEAL', target: 'SELF', magnitude: 30 }] }),
    ])
    expect(escolha).toBe('dano')
  })

  it('com HP baixo mas sem cura disponível, ataca normalmente', () => {
    const escolha = pickAiSkill(eu({ currentHp: 10, maxHp: 100 }), [skill({ id: 'dano', power: 20 })])
    expect(escolha).toBe('dano')
  })

  it('sem skill de dano legal, usa uma de suporte em vez do ataque básico', () => {
    const escolha = pickAiSkill(eu({ cooldowns: { dano: 3 } }), [
      skill({ id: 'dano', power: 50 }),
      skill({ id: 'buff', power: 0, effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20 }] }),
    ])
    expect(escolha).toBe('buff')
  })
})

describe('escolherLoadoutPadrao', () => {
  const s = (id: string, power: number, energyCost: number): SkillDef => ({
    id,
    name: id,
    power,
    energyCost,
    cooldown: 1,
    effects: [],
    scalingStat: 'attack',
    tags: [],
  })

  it('cabendo tudo, devolve tudo', () => {
    const todas = [s('a', 10, 10), s('b', 20, 20)]
    expect(escolherLoadoutPadrao(todas, 4)).toEqual(todas)
  })

  it('estourando os slots, corta para o tamanho', () => {
    const todas = [s('a', 10, 10), s('b', 20, 20), s('c', 30, 30), s('d', 40, 40), s('e', 50, 50)]
    expect(escolherLoadoutPadrao(todas, 3)).toHaveLength(3)
  })

  it('prioriza os golpes mais fortes', () => {
    const todas = [s('fraca', 5, 5), s('media', 25, 20), s('forte', 50, 40)]
    const r = escolherLoadoutPadrao(todas, 2).map((x) => x.id)
    expect(r).toContain('forte')
  })

  it('garante UMA opção barata, senão o turno pós-cooldown vira ataque básico', () => {
    // As quatro mais fortes são todas caríssimas; a barata tem que entrar.
    const todas = [
      s('barata', 8, 6),
      s('cara1', 50, 40),
      s('cara2', 48, 39),
      s('cara3', 46, 38),
      s('cara4', 44, 37),
    ]
    const r = escolherLoadoutPadrao(todas, 4).map((x) => x.id)
    expect(r).toContain('barata')
    expect(r).toContain('cara1')
    expect(r).toHaveLength(4)
  })

  it('é determinístico — o estado da batalha é snapshot, mesma entrada tem que dar mesma saída', () => {
    const todas = [s('a', 20, 10), s('b', 20, 10), s('c', 20, 10), s('d', 20, 10)]
    const um = escolherLoadoutPadrao(todas, 2).map((x) => x.id)
    const dois = escolherLoadoutPadrao(todas, 2).map((x) => x.id)
    expect(um).toEqual(dois)
  })

  it('sem slot nenhum, devolve vazio', () => {
    expect(escolherLoadoutPadrao([s('a', 10, 10)], 0)).toEqual([])
  })
})

describe('pickAiSkill e o domínio', () => {
  const dominio = skill({
    id: 'dominio',
    name: 'Expansão de Domínio',
    power: 30,
    effects: [{ type: 'DOMAIN', target: 'SELF', magnitude: 20, duration: 3 }],
  })
  const golpao = skill({ id: 'golpao', power: 45 })

  it('abre o domínio mesmo com um golpe mais forte disponível', () => {
    // A regra gulosa por poder escolheria 'golpao' e o domínio nunca apareceria
    // em jogo — o estado vale mais que a diferença de poder de uma rodada.
    expect(pickAiSkill(eu(), [dominio, golpao])).toBe('dominio')
  })

  it('com o próprio domínio já aberto, não reabre — reabrir jogaria fora as rodadas restantes', () => {
    const comDominioAberto = eu({
      statusEffects: [{ id: 'meu', type: 'DOMAIN', magnitude: 20, remainingRounds: 2, sourceSkillName: 'x' }],
    })
    expect(pickAiSkill(comDominioAberto, [dominio, golpao])).toBe('golpao')
  })

  it('sem energia para o domínio, segue com o que dá para pagar', () => {
    const caro = skill({ ...dominio, id: 'dominio', energyCost: 90 })
    expect(pickAiSkill(eu({ currentEnergy: 10 }), [caro, golpao])).toBe('golpao')
  })

  const comDominioInimigo = (forca: number) =>
    eu({ statusEffects: [{ id: 'dele', type: 'DOMAIN', magnitude: forca, remainingRounds: 2, sourceSkillName: 'x' }] })

  it('recusa a disputa contra um domínio mais forte — perder o choque custa a rodada e um atordoamento', () => {
    expect(pickAiSkill(eu(), [dominio, golpao], comDominioInimigo(30))).toBe('golpao')
  })

  it('aceita a disputa contra um domínio mais fraco', () => {
    expect(pickAiSkill(eu(), [dominio, golpao], comDominioInimigo(10))).toBe('dominio')
  })

  it('aceita o empate: anular os dois tira a amplificação de quem já estava com o domínio aberto', () => {
    expect(pickAiSkill(eu(), [dominio, golpao], comDominioInimigo(20))).toBe('dominio')
  })

  it('curar continua tendo prioridade sobre abrir o domínio com a vida baixa', () => {
    const cura = skill({ id: 'cura', power: 0, effects: [{ type: 'HEAL', target: 'SELF', magnitude: 30 }] })
    expect(pickAiSkill(eu({ currentHp: 20, maxHp: 100 }), [dominio, cura])).toBe('cura')
  })
})
