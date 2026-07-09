export type Outcome = 'PLAYER_WIN' | 'ENEMY_WIN' | 'DRAW' | null
export type Side = 'PLAYER' | 'ENEMY'
export type TransformationTrigger = 'MANUAL' | 'LOW_HP' | 'ON_DAMAGE_TAKEN' | 'ENERGY_CHARGE'
export type Stat = 'attack' | 'defense' | 'speed'
export type EffectType = 'BUFF' | 'DEBUFF' | 'DOT' | 'STUN' | 'COUNTER' | 'SHIELD' | 'HEAL' | 'LIFESTEAL'

// Mechanical definition attached to a Skill (Skill.effects in the DB). A
// skill can carry several of these alongside its normal power-based damage
// (e.g. a strike that also applies a bleed DOT).
export type SkillEffect = {
  type: EffectType
  target: 'SELF' | 'ENEMY'
  stat?: Stat // BUFF/DEBUFF only
  magnitude: number // % for BUFF/DEBUFF/LIFESTEAL, flat amount for DOT/SHIELD/HEAL, % reflected for COUNTER
  duration?: number // rounds; absent = instantaneous (HEAL, LIFESTEAL)
}

// A live instance of an effect sitting on a combatant mid-battle.
export type StatusEffectInstance = {
  id: string
  type: EffectType
  stat?: Stat
  magnitude: number
  remainingRounds: number
  sourceSkillName: string
}

// A combatant's stats are split into "base" (character + skill tree bonuses,
// fixed for the whole battle) and "current" (base, or transformed if a
// transformation is active) so a transformation can be cleanly reverted
// (e.g. when its drainPerTurn can no longer be paid) without losing the
// pre-transformation baseline. Buff/debuff modifiers are NOT baked into
// these fields — they're read live off statusEffects via getCombatStat()
// so expiry never requires "undoing" arithmetic.
export type CombatantState = {
  currentHp: number
  maxHp: number
  baseMaxHp: number
  currentEnergy: number
  maxEnergy: number
  baseMaxEnergy: number
  attack: number
  baseAttack: number
  defense: number
  baseDefense: number
  speed: number
  baseSpeed: number
  cooldowns: Record<string, number> // skillId -> rounds remaining
  activeTransformationId: string | null
  statusEffects: StatusEffectInstance[]
}

export type BattleState = {
  version: 1
  player: CombatantState
  enemy: CombatantState
  outcome: Outcome
}

export type AppliedEffect = {
  type: EffectType
  target: Side
  stat?: Stat
  magnitude: number
  duration?: number
}

export type TurnResult = {
  version: 1
  side: Side
  kind: 'ATTACK' | 'TRANSFORM' | 'SUPPORT' | 'STUNNED' | 'DOT_TICK'
  skillId: string | null // null = Basic Attack (synthesized, not a DB row)
  skillName: string
  transformationId?: string
  damage?: number
  isCrit?: boolean
  countered?: boolean // true if this attack was negated + reflected by the defender's COUNTER
  reflectedDamage?: number // damage dealt back to the attacker when countered
  healed?: number // self-heal amount (HEAL or LIFESTEAL)
  energySpent?: number
  targetHpBefore?: number
  targetHpAfter?: number
  effectsApplied?: AppliedEffect[]
}

export type SkillDef = {
  id: string
  name: string
  power: number
  energyCost: number
  cooldown: number
  effects: SkillEffect[]
}

export type TransformationDef = {
  id: string
  name: string
  levelRequirement: number
  energyModifier: number
  attackModifier: number
  defenseModifier: number
  speedModifier: number
  flatHpBonus: number
  flatAttackBonus: number
  flatDefenseBonus: number
  flatSpeedBonus: number
  drainPerTurn: number
  triggerType: TransformationTrigger
  triggerPayload: unknown
}

export type BaseStats = {
  hp: number
  attack: number
  defense: number
  speed: number
  energy: number
}

export type PlayerAction =
  | { kind: 'ATTACK'; skillId: string | null }
  | { kind: 'TRANSFORM'; transformationId: string }
