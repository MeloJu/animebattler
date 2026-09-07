import { describe, it, expect } from 'vitest'
import {
  MOEDA_POR_NIVEL_NA_VITORIA,
  VITORIAS_PAGAS_POR_DIA,
  XP_POR_NIVEL_NA_VITORIA,
  inicioDoDiaUtc,
  recompensaComTeto,
  recompensaDaVitoria,
} from '@/app/lib/battle/recompensa'

describe('recompensa da batalha contra IA', () => {
  it('escala com o nível, em XP e em moeda', () => {
    expect(recompensaDaVitoria(1)).toEqual({
      xp: XP_POR_NIVEL_NA_VITORIA,
      moedas: MOEDA_POR_NIVEL_NA_VITORIA,
    })
    expect(recompensaDaVitoria(10)).toEqual({
      xp: XP_POR_NIVEL_NA_VITORIA * 10,
      moedas: MOEDA_POR_NIVEL_NA_VITORIA * 10,
    })
  })

  it('acompanha o custo de subir de nível, que também é linear', () => {
    // Este é o ponto do escalonamento: com valor fixo, o número de vitórias
    // por nível crescia sem parar e treinar virava espera em vez de preparo.
    const vitoriasParaSubir = (nivel: number) => (100 * nivel) / recompensaDaVitoria(nivel).xp
    expect(vitoriasParaSubir(2)).toBeCloseTo(vitoriasParaSubir(20))
  })

  it('paga cheio enquanto está abaixo do teto', () => {
    for (let ja = 0; ja < VITORIAS_PAGAS_POR_DIA; ja++) {
      const r = recompensaComTeto(5, ja)
      expect(r.dentroDoTeto).toBe(true)
      expect(r.xp).toBeGreaterThan(0)
      expect(r.moedas).toBeGreaterThan(0)
    }
  })

  it('no teto, zera a recompensa — mas isso não impede jogar', () => {
    // O teto corta o PAGAMENTO, não a partida: bloquear o botão puniria quem
    // perdeu as cinco primeiras lutas do dia.
    const r = recompensaComTeto(5, VITORIAS_PAGAS_POR_DIA)
    expect(r).toEqual({ xp: 0, moedas: 0, dentroDoTeto: false })
  })

  it('continua zerado bem acima do teto, sem virar negativo', () => {
    expect(recompensaComTeto(30, 99)).toEqual({ xp: 0, moedas: 0, dentroDoTeto: false })
  })

  it('o dia começa à meia-noite UTC', () => {
    const meio = new Date('2026-09-07T15:47:00.000Z')
    expect(inicioDoDiaUtc(meio).toISOString()).toBe('2026-09-07T00:00:00.000Z')
  })

  it('um instante antes da virada ainda é o dia anterior', () => {
    // O fuso é fixo de propósito: sem isso "hoje" mudaria com o relógio do
    // servidor e o jogador não teria como saber quando o teto reinicia.
    expect(inicioDoDiaUtc(new Date('2026-09-07T23:59:59.999Z')).toISOString()).toBe('2026-09-07T00:00:00.000Z')
    expect(inicioDoDiaUtc(new Date('2026-09-08T00:00:00.000Z')).toISOString()).toBe('2026-09-08T00:00:00.000Z')
  })
})
