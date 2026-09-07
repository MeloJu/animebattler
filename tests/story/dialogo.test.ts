import { describe, it, expect } from 'vitest'
import { parseDialogo } from '@/app/lib/story/queries'

// O diálogo é uma coluna Json, então nada no banco garante o formato. Estes
// testes existem para que conteúdo malformado encurte a cena em vez de
// derrubar a tela do estágio.
describe('parseDialogo', () => {
  it('lê falas bem formadas', () => {
    expect(parseDialogo([{ speaker: 'Kira', text: 'Ninguém passa.' }])).toEqual([
      { speaker: 'Kira', text: 'Ninguém passa.' },
    ])
  })

  it('speaker nulo é narração e sobrevive', () => {
    expect(parseDialogo([{ speaker: null, text: 'O portão se fecha.' }])).toEqual([
      { speaker: null, text: 'O portão se fecha.' },
    ])
  })

  it('speaker ausente vira narração', () => {
    expect(parseDialogo([{ text: 'Sem dono.' }])).toEqual([{ speaker: null, text: 'Sem dono.' }])
  })

  it('descarta linha sem texto em vez de renderizar fala vazia', () => {
    expect(parseDialogo([{ speaker: 'Kira' }, { speaker: 'Kira', text: '' }])).toEqual([])
  })

  it('descarta lixo no meio e mantém o resto', () => {
    const r = parseDialogo([{ speaker: 'A', text: 'um' }, null, 42, 'texto solto', { speaker: 'B', text: 'dois' }])
    expect(r).toEqual([
      { speaker: 'A', text: 'um' },
      { speaker: 'B', text: 'dois' },
    ])
  })

  it('speaker que não é string vira narração', () => {
    expect(parseDialogo([{ speaker: 7, text: 'oi' }])).toEqual([{ speaker: null, text: 'oi' }])
  })

  it('valor que não é array devolve cena vazia', () => {
    expect(parseDialogo(null)).toEqual([])
    expect(parseDialogo(undefined)).toEqual([])
    expect(parseDialogo({ speaker: 'A', text: 'x' })).toEqual([])
  })
})
