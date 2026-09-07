import type { StatBonus } from '@/app/lib/battle/types'

export const ATRIBUTOS = ['hp', 'attack', 'defense', 'speed', 'energy', 'stamina'] as const
export type Atributo = (typeof ATRIBUTOS)[number]

/**
 * Quanto UM ponto de nível dá em cada atributo.
 *
 * Os valores saem do mesmo orçamento que balanceia o elenco
 * (hp + 5*ataque + 5*defesa + 4*velocidade + 0.3*energia), calibrados para
 * que gastar um ponto valha aproximadamente o mesmo em qualquer lugar — 10 de
 * orçamento. Sem isso existiria uma escolha certa e cinco erradas, que é o
 * oposto de ter atributo alocável.
 *
 * VELOCIDADE É A EXCEÇÃO, e de propósito: ela vale metade. Velocidade decide
 * a iniciativa da rodada E alimenta a chance de crítico, então um ponto nela
 * rende em duas dimensões enquanto os outros rendem em uma. Pagá-la pelo
 * mesmo preço faria "sobe velocidade" ser a resposta certa para todo
 * personagem, e a tela de atributos viraria decoração.
 *
 * Guardamos os PONTOS gastos no banco, não o bônus final. Mudar um número
 * aqui reajusta todo mundo na próxima batalha, em vez de deixar personagens
 * antigos com valores calculados por uma regra que já não existe.
 */
export const ATRIBUTO_POR_PONTO: Record<Atributo, number> = {
  hp: 10,
  attack: 2,
  defense: 2,
  speed: 1,
  energy: 12,
  stamina: 12,
}

export const ATRIBUTO_LABEL: Record<Atributo, string> = {
  hp: 'Vida',
  attack: 'Ataque',
  defense: 'Defesa',
  speed: 'Velocidade',
  energy: 'Energia',
  stamina: 'Stamina',
}

export const ATRIBUTO_AJUDA: Record<Atributo, string> = {
  hp: 'Quanto dano você aguenta antes de cair.',
  attack: 'Aumenta o dano das habilidades que escalam de ataque — golpe físico e o kit de quem é ATACANTE.',
  defense: 'Reduz o dano recebido, e é a escala das habilidades de quem é TANQUE.',
  speed: 'Decide quem age primeiro na rodada e aumenta a chance de crítico. Por render em duas coisas, cada ponto dá metade.',
  energy: 'Reserva de ataque: quantas habilidades ofensivas você lança. Também é a escala de kidō, ki e ninjutsu.',
  stamina: 'Reserva defensiva: quantas vezes você consegue usar escudo, cura e counter antes de ficar sem.',
}

type Alocacoes = {
  allocHp: number
  allocAttack: number
  allocDefense: number
  allocSpeed: number
  allocEnergy: number
  allocStamina: number
}

/** Converte pontos gastos em bônus plano, para somar aos stats do personagem. */
export function bonusDeAtributos(a: Alocacoes): StatBonus {
  return {
    hp: a.allocHp * ATRIBUTO_POR_PONTO.hp,
    attack: a.allocAttack * ATRIBUTO_POR_PONTO.attack,
    defense: a.allocDefense * ATRIBUTO_POR_PONTO.defense,
    speed: a.allocSpeed * ATRIBUTO_POR_PONTO.speed,
    energy: a.allocEnergy * ATRIBUTO_POR_PONTO.energy,
    stamina: a.allocStamina * ATRIBUTO_POR_PONTO.stamina,
  }
}

/** Nome da coluna que guarda os pontos de um atributo. */
export function colunaDe(atributo: Atributo): keyof Alocacoes {
  const mapa: Record<Atributo, keyof Alocacoes> = {
    hp: 'allocHp',
    attack: 'allocAttack',
    defense: 'allocDefense',
    speed: 'allocSpeed',
    energy: 'allocEnergy',
    stamina: 'allocStamina',
  }
  return mapa[atributo]
}

export function ehAtributo(valor: string): valor is Atributo {
  return (ATRIBUTOS as readonly string[]).includes(valor)
}
