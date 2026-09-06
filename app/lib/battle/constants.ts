export const ENERGY_REGEN_PCT = 0.08
export const MAX_ROUNDS = 50

export const CRIT_BASE_CHANCE = 0.05
export const CRIT_MAX_CHANCE = 0.35
export const CRIT_SPEED_COEFFICIENT = 0.01
export const CRIT_MULTIPLIER = 1.5

export const BASIC_ATTACK_POWER = 12

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
