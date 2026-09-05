import { describe, it, expect } from 'vitest'
import { resolveErrorMessage } from '@/app/lib/error-messages'
import { describeEffect, battleErrorMessage } from '@/app/lib/battle/presentation'

describe('resolveErrorMessage', () => {
  const mapa = { not_found: 'Não encontrado.', conflict: 'Conflito.' }

  it('sem código, não há mensagem a exibir', () => {
    expect(resolveErrorMessage(mapa, undefined, 'Erro genérico.')).toBeNull()
  })

  it('traduz um código conhecido', () => {
    expect(resolveErrorMessage(mapa, 'not_found', 'Erro genérico.')).toBe('Não encontrado.')
  })

  it('código desconhecido cai no fallback em vez de vazar o código cru', () => {
    expect(resolveErrorMessage(mapa, 'algo_inesperado', 'Erro genérico.')).toBe('Erro genérico.')
  })

  it('string vazia é tratada como ausência de código', () => {
    expect(resolveErrorMessage(mapa, '', 'Erro genérico.')).toBeNull()
  })
})

describe('battleErrorMessage', () => {
  it('traduz códigos de batalha conhecidos', () => {
    expect(battleErrorMessage('illegal_move')).toContain('energia insuficiente')
    expect(battleErrorMessage('conflict')).toContain('outra aba')
  })

  it('devolve null quando não houve erro', () => {
    expect(battleErrorMessage(undefined)).toBeNull()
  })

  it('código desconhecido vira mensagem genérica', () => {
    expect(battleErrorMessage('xyz')).toBe('Ocorreu um erro inesperado.')
  })
})

describe('describeEffect', () => {
  it('descreve buff e debuff com o stat e o sinal certos', () => {
    expect(describeEffect({ type: 'BUFF', stat: 'attack', magnitude: 20 })).toBe('↑ ATQ +20%')
    expect(describeEffect({ type: 'DEBUFF', stat: 'defense', magnitude: 15 })).toBe('↓ DEF -15%')
  })

  it('cobre todos os tipos de efeito sem quebrar', () => {
    const tipos = ['BUFF', 'DEBUFF', 'DOT', 'STUN', 'COUNTER', 'SHIELD', 'HEAL', 'LIFESTEAL'] as const
    for (const type of tipos) {
      const texto = describeEffect({ type, stat: 'attack', magnitude: 10 })
      expect(texto).toBeTruthy()
      expect(texto.length).toBeGreaterThan(1)
    }
  })

  it('buff sem stat não quebra (não imprime "undefined")', () => {
    expect(describeEffect({ type: 'BUFF', magnitude: 10 })).not.toContain('undefined')
  })
})
