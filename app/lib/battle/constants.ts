import type { ScalingStat } from './types'

export const ENERGY_REGEN_PCT = 0.08
export const MAX_ROUNDS = 50

export const CRIT_BASE_CHANCE = 0.05
export const CRIT_MAX_CHANCE = 0.35
export const CRIT_SPEED_COEFFICIENT = 0.01
export const CRIT_MULTIPLIER = 1.5

export const BASIC_ATTACK_POWER = 12

/**
 * Bônus que uma habilidade ganha do atributo de escala, quando quem lança é
 * exatamente a média do elenco naquele atributo. Equivale ao antigo
 * ataque * 0.5 para um personagem de ataque médio (19.8 * 0.5 = 9.9).
 */
export const SCALING_BASE = 10

/**
 * Média do elenco em cada atributo, usada para NORMALIZAR a escala.
 *
 * POR QUE NORMALIZAR: a primeira versão disto era um coeficiente fixo por
 * atributo, calibrado por "paridade de arquétipo". Estava errado, e a
 * simulação mostrou: o Vegeta caiu de 81% para 0% de vitória no estágio 2.
 *
 * A causa é que os atributos vivem em escalas numéricas diferentes — ataque
 * vai de 15 a 26, energia de 95 a 170. Todo personagem tem uma reserva de
 * energia grande, inclusive os que não são conjuradores, então qualquer
 * coeficiente que fizesse energia valer a pena para um CONJURADOR fazia
 * energia valer a pena para TODO MUNDO. Trocava "ataque é rei" por "energia
 * é rei", que é o mesmo defeito com outro nome.
 *
 * Normalizando, o bônus deixa de perguntar "quantos pontos você tem" e passa
 * a perguntar "quão acima da média você está NESTE atributo". Aí 26 de ataque
 * (1.31x a média) e 170 de energia (1.38x) valem quase o mesmo, e a escolha
 * de build volta a ser sobre o personagem em vez de sobre qual número é
 * naturalmente maior.
 *
 * Os valores saem do elenco real. Se a média mudar muito com personagens
 * novos, estes números precisam ser revisados junto — por isso estão aqui,
 * num lugar só, e não espalhados.
 */
export const SCALING_REFERENCE: Record<ScalingStat, number> = {
  attack: 19.8,
  defense: 12.4,
  speed: 13.9,
  energy: 165,
}

export const XP_ON_WIN = 25
export const XP_ON_LOSS = 5

// Fração do xpReward que uma REJOGADA de estágio já concluído paga. Antes era
// 1 (valor cheio, sem limite), o que fazia repetir o mesmo estágio ser o
// caminho mais rápido do jogo. Ver battleXpGained.
export const STORY_REPLAY_XP_RATIO = 0.5
export const XP_PER_LEVEL = 100 // xp needed for level N -> N+1 is N * XP_PER_LEVEL

// A normal AI battle pays XP_ON_WIN/XP_ON_LOSS as-is. Raids multiply by the
// Monster's own `tier` instead (see loadEnemyProfile) — a harder Hollow is
// worth more XP without a separate reward table.
export const NORMAL_BATTLE_XP_MULTIPLIER = 1

export const NPC_WINS_ON_WIN = 1

// Diferença de nível máxima aceita no pareamento de PvP, para cima ou para
// baixo. Com os dois lados escalando por nível, uma diferença grande deixa de
// ser vantagem e vira atropelo — e desistir passa a ser a única jogada
// racional do lado fraco. O custo é esperar mais na fila.
export const PVP_LEVEL_RANGE = 2

// How much an enemy's stats scale per level above 1, used to turn a story
// stage's `enemyLevel` into an actual stat block (see engine.ts's
// scaleForLevel). Story mode is its first caller, but this is combatant
// scaling math, not a story-specific rule.
export const LEVEL_SCALING = 0.12
