import { describe, it, expect } from 'vitest'
import {
  ATRIBUTOS,
  ATRIBUTO_POR_PONTO,
  bonusDeAtributos,
  colunaDe,
  ehAtributo,
} from '@/app/lib/progression/atributos'

const zerado = {
  allocHp: 0,
  allocAttack: 0,
  allocDefense: 0,
  allocSpeed: 0,
  allocEnergy: 0,
  allocStamina: 0,
  allocAccuracy: 0,
  allocAgility: 0,
  allocIntelligence: 0,
}

describe('atributos alocáveis', () => {
  it('sem ponto gasto, não dá bônus nenhum', () => {
    expect(bonusDeAtributos(zerado)).toEqual({
      hp: 0, attack: 0, defense: 0, speed: 0, energy: 0, stamina: 0,
      accuracy: 0, agility: 0, intelligence: 0,
    })
  })

  it('converte pontos em bônus pelo valor de cada atributo', () => {
    expect(bonusDeAtributos({ ...zerado, allocHp: 3, allocAttack: 2 })).toEqual({
      hp: 30,
      attack: 4,
      defense: 0,
      speed: 0,
      energy: 0,
      stamina: 0,
      accuracy: 0,
      agility: 0,
      intelligence: 0,
    })
  })

  it('velocidade rende METADE de ataque e defesa, e isso é deliberado', () => {
    // Ela decide iniciativa E alimenta o crítico: pagar o mesmo preço faria
    // "sobe velocidade" ser a resposta certa para todo personagem.
    expect(ATRIBUTO_POR_PONTO.speed * 2).toBe(ATRIBUTO_POR_PONTO.attack)
    expect(ATRIBUTO_POR_PONTO.speed * 2).toBe(ATRIBUTO_POR_PONTO.defense)
  })

  it('as duas reservas rendem igual entre si', () => {
    expect(ATRIBUTO_POR_PONTO.energy).toBe(ATRIBUTO_POR_PONTO.stamina)
  })

  it('todo atributo tem valor por ponto e nome de coluna', () => {
    for (const a of ATRIBUTOS) {
      expect(ATRIBUTO_POR_PONTO[a]).toBeGreaterThan(0)
      expect(colunaDe(a)).toMatch(/^alloc/)
    }
  })

  it('nomes de coluna não se repetem entre atributos', () => {
    const colunas = ATRIBUTOS.map(colunaDe)
    expect(new Set(colunas).size).toBe(ATRIBUTOS.length)
  })

  it('ehAtributo rejeita entrada que não é atributo', () => {
    // A action é alcançável por POST direto, então isto é fronteira de
    // confiança e não conveniência de tipo.
    expect(ehAtributo('attack')).toBe(true)
    expect(ehAtributo('allocAttack')).toBe(false)
    expect(ehAtributo('')).toBe(false)
    expect(ehAtributo('__proto__')).toBe(false)
  })
})
