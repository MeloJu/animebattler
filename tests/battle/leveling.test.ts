import { describe, it, expect } from 'vitest'
import { applyExperience } from '@/app/lib/battle/leveling'

// Regra: pra sair do nível N pro N+1 é preciso N * 100 de XP.
describe('applyExperience', () => {
  it('acumula XP sem subir de nível quando não alcança o limiar', () => {
    expect(applyExperience(1, 0, 50)).toEqual({ level: 1, experience: 50, pointsGained: 0 })
  })

  it('sobe de nível ao atingir exatamente o limiar', () => {
    expect(applyExperience(1, 0, 100)).toEqual({ level: 2, experience: 0, pointsGained: 1 })
  })

  it('carrega o excedente pro próximo nível', () => {
    expect(applyExperience(1, 0, 130)).toEqual({ level: 2, experience: 30, pointsGained: 1 })
  })

  it('sobe vários níveis de uma vez com XP suficiente', () => {
    // nível 1->2 custa 100, 2->3 custa 200: total 300
    expect(applyExperience(1, 0, 300)).toEqual({ level: 3, experience: 0, pointsGained: 2 })
  })

  it('cada nível fica progressivamente mais caro', () => {
    // no nível 5, precisa de 500 — 499 não basta
    expect(applyExperience(5, 0, 499).level).toBe(5)
    expect(applyExperience(5, 0, 500).level).toBe(6)
  })

  it('considera o XP que o personagem já tinha', () => {
    expect(applyExperience(1, 90, 10)).toEqual({ level: 2, experience: 0, pointsGained: 1 })
  })

  it('ganhar 0 de XP não muda nada', () => {
    expect(applyExperience(3, 120, 0)).toEqual({ level: 3, experience: 120, pointsGained: 0 })
  })

  it('pontos ganhos batem com a quantidade de níveis subidos', () => {
    const r = applyExperience(1, 0, 1000)
    expect(r.pointsGained).toBe(r.level - 1)
  })
})
