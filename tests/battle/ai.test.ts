import { describe, it, expect } from 'vitest'
import { pickAiSkill } from '@/app/lib/battle/ai'
import { createInitialState } from '@/app/lib/battle/engine'
import type { CombatantState, SkillDef } from '@/app/lib/battle/types'

const base = createInitialState(
  { hp: 100, attack: 20, defense: 10, speed: 15, energy: 100 },
  { hp: 100, attack: 20, defense: 10, speed: 15, energy: 100 }
).player

const eu = (over: Partial<CombatantState> = {}): CombatantState => ({ ...base, ...over })

const skill = (over: Partial<SkillDef> = {}): SkillDef => ({
  id: 'sk',
  name: 'Golpe',
  power: 10,
  energyCost: 0,
  cooldown: 0,
  effects: [],
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
