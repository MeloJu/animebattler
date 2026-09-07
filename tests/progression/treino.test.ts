import { describe, it, expect } from 'vitest'
import {
  TREINO_ACRESCIMO,
  TREINO_CUSTO_BASE,
  custoDoTreino,
  treinosQueCabem,
} from '@/app/lib/progression/treino'

describe('preço do treino', () => {
  it('o primeiro custa o valor base', () => {
    expect(custoDoTreino(0)).toBe(TREINO_CUSTO_BASE)
  })

  it('cada treino comprado encarece o próximo', () => {
    expect(custoDoTreino(1)).toBe(TREINO_CUSTO_BASE + TREINO_ACRESCIMO)
    expect(custoDoTreino(5)).toBe(TREINO_CUSTO_BASE + 5 * TREINO_ACRESCIMO)
  })

  it('o preço nunca deixa de subir', () => {
    // É o crescimento que substitui um teto diário: em vez de proibir,
    // encarece até deixar de valer a pena.
    for (let n = 0; n < 30; n++) {
      expect(custoDoTreino(n + 1)).toBeGreaterThan(custoDoTreino(n))
    }
  })
})

describe('quantos treinos cabem no saldo', () => {
  it('sem moeda, nenhum', () => {
    expect(treinosQueCabem(0, 0)).toBe(0)
    expect(treinosQueCabem(TREINO_CUSTO_BASE - 1, 0)).toBe(0)
  })

  it('conta comprando um após o outro, com o preço subindo', () => {
    // 80 + 120 = 200 compra dois; 199 compra só um.
    const dois = custoDoTreino(0) + custoDoTreino(1)
    expect(treinosQueCabem(dois, 0)).toBe(2)
    expect(treinosQueCabem(dois - 1, 0)).toBe(1)
  })

  it('quem já treinou muito compra menos com o mesmo dinheiro', () => {
    const saldo = 1000
    expect(treinosQueCabem(saldo, 20)).toBeLessThan(treinosQueCabem(saldo, 0))
  })

  it('saldo enorme não trava nem devolve infinito', () => {
    const n = treinosQueCabem(1_000_000, 0)
    expect(n).toBeGreaterThan(0)
    expect(Number.isFinite(n)).toBe(true)
  })
})
