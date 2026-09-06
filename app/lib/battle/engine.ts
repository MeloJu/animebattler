import {
  BASIC_ATTACK_POWER,
  CRIT_BASE_CHANCE,
  CRIT_MAX_CHANCE,
  CRIT_MULTIPLIER,
  CRIT_SPEED_COEFFICIENT,
  ENERGY_REGEN_PCT,
  LEVEL_SCALING,
} from './constants'
import type {
  AppliedEffect,
  BaseStats,
  BattleState,
  CombatantState,
  Outcome,
  PlayerAction,
  SkillDef,
  SkillEffect,
  Side,
  Stat,
  StatusEffectInstance,
  TransformationDef,
  TransformationTrigger,
  TurnResult,
} from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

function makeEffectId(): string {
  return `fx-${Math.random().toString(36).slice(2, 10)}`
}

function makeCombatant(stats: BaseStats): CombatantState {
  return {
    currentHp: stats.hp,
    maxHp: stats.hp,
    baseMaxHp: stats.hp,
    currentEnergy: stats.energy,
    maxEnergy: stats.energy,
    baseMaxEnergy: stats.energy,
    attack: stats.attack,
    baseAttack: stats.attack,
    defense: stats.defense,
    baseDefense: stats.defense,
    speed: stats.speed,
    baseSpeed: stats.speed,
    cooldowns: {},
    activeTransformationId: null,
    statusEffects: [],
  }
}

/** Character base stats + flat bonuses from unlocked skill-tree nodes. Battles always start untransformed. */
export function computeBaseStats(
  character: { hp: number; attack: number; defense: number; speed: number; energy: number },
  treeBonus: { hp: number; attack: number; defense: number; speed: number }
): BaseStats {
  return {
    hp: character.hp + treeBonus.hp,
    attack: character.attack + treeBonus.attack,
    defense: character.defense + treeBonus.defense,
    speed: character.speed + treeBonus.speed,
    energy: character.energy,
  }
}

/**
 * Soma fontes de bônus plano (árvore de skills, equipamento, ...) num único
 * bloco antes dele virar stat de batalha. Existe pra que adicionar uma nova
 * fonte não signifique tocar em cada chamador de computeBaseStats.
 */
export function sumStatBonuses(
  ...bonuses: { hp: number; attack: number; defense: number; speed: number }[]
): { hp: number; attack: number; defense: number; speed: number } {
  return bonuses.reduce(
    (acc, b) => ({
      hp: acc.hp + b.hp,
      attack: acc.attack + b.attack,
      defense: acc.defense + b.defense,
      speed: acc.speed + b.speed,
    }),
    { hp: 0, attack: 0, defense: 0, speed: 0 }
  )
}

/**
 * Stats com que um combatente entra em batalha: personagem escalado pelo
 * nível, mais os bônus planos (árvore de habilidades, equipamento).
 *
 * Único lugar onde stats de batalha nascem. Antes, só o inimigo do modo
 * história escalava por nível e o jogador ficava parado — o que fazia a
 * dificuldade e a progressão divergirem até a história virar invencível.
 *
 * A ORDEM É DELIBERADA: escala primeiro, soma bônus depois. É a mesma que o
 * modo história já usava para o inimigo, então os dois lados do combate
 * passam a ter exatamente a mesma forma. E mantém árvore e equipamento como
 * impulso de começo de jogo, que perde peso relativo conforme o nível sobe —
 * a gear inicial se supera, como em qualquer RPG. Escalar os bônus junto os
 * tornaria permanentemente decisivos, que não é o desenho.
 */
export function computeFighterStats(
  character: { hp: number; attack: number; defense: number; speed: number; energy: number },
  level: number,
  bonus: { hp: number; attack: number; defense: number; speed: number }
): BaseStats {
  return computeBaseStats(scaleForLevel(character, level), bonus)
}

export function createInitialState(player: BaseStats, enemy: BaseStats): BattleState {
  return { version: 1, player: makeCombatant(player), enemy: makeCombatant(enemy), outcome: null }
}

/**
 * Scales a combatant's raw stat block by level — story mode's enemies are
 * catalog characters/monsters with `enemyLevel` applied, so a stage's enemy
 * is stronger without needing a stat row of its own.
 */
export function scaleForLevel<T extends { hp: number; attack: number; defense: number; speed: number; energy: number }>(
  base: T,
  level: number
): T {
  const m = 1 + (level - 1) * LEVEL_SCALING
  return {
    ...base,
    hp: Math.round(base.hp * m),
    attack: Math.round(base.attack * m),
    defense: Math.round(base.defense * m),
    speed: Math.round(base.speed * m),
    energy: Math.round(base.energy * m),
  }
}

/** A skill only counts as usable in battle if it deals damage or does something (has effects) — a 0-power, no-effect row is inert data. */
export function hasBattleValue(skill: { power: number; effects: unknown }): boolean {
  return skill.power > 0 || (Array.isArray(skill.effects) && skill.effects.length > 0)
}

export function isLegalMove(combatant: CombatantState, skill: SkillDef | null): boolean {
  if (!skill) return true // Basic Attack is always legal
  const onCooldown = (combatant.cooldowns[skill.id] ?? 0) > 0
  return !onCooldown && combatant.currentEnergy >= skill.energyCost
}

/**
 * attack/defense/speed on CombatantState already bake in base stats + skill
 * tree + active transformation. BUFF/DEBUFF are deliberately NOT baked in —
 * they're summed here from statusEffects instead, so an effect expiring is
 * just removing it from the list, never "undo" arithmetic.
 */
export function getCombatStat(c: CombatantState, stat: Stat): number {
  const base = c[stat]
  let modifierPct = 0
  for (const effect of c.statusEffects) {
    if (effect.stat !== stat) continue
    if (effect.type === 'BUFF') modifierPct += effect.magnitude
    else if (effect.type === 'DEBUFF') modifierPct -= effect.magnitude
  }
  return Math.max(0, Math.round(base * (1 + modifierPct / 100)))
}

export function isStunned(c: CombatantState): boolean {
  return c.statusEffects.some((e) => e.type === 'STUN' && e.remainingRounds > 0)
}

function computeDamage(
  attacker: CombatantState,
  defender: CombatantState,
  power: number,
  rand: () => number
): { damage: number; isCrit: boolean } {
  const atk = getCombatStat(attacker, 'attack')
  const def = getCombatStat(defender, 'defense')
  const atkSpeed = getCombatStat(attacker, 'speed')
  const defSpeed = getCombatStat(defender, 'speed')
  const raw = power + atk * 0.5
  const mitigated = raw * (100 / (100 + def))
  const critChance = clamp(
    CRIT_BASE_CHANCE + Math.max(0, atkSpeed - defSpeed) * CRIT_SPEED_COEFFICIENT,
    CRIT_BASE_CHANCE,
    CRIT_MAX_CHANCE
  )
  const isCrit = rand() < critChance
  let damage = Math.max(1, Math.round(mitigated))
  if (isCrit) damage = Math.round(damage * CRIT_MULTIPLIER)
  return { damage, isCrit }
}

/** Applies damage to a defender, absorbing into an active SHIELD first. Returns the actual HP lost. */
function applyDamageWithShield(target: CombatantState, amount: number): { target: CombatantState; actualDamage: number } {
  const hpBefore = target.currentHp
  const shieldIdx = target.statusEffects.findIndex((e) => e.type === 'SHIELD' && e.remainingRounds > 0)
  if (shieldIdx === -1) {
    const currentHp = Math.max(0, target.currentHp - amount)
    return { target: { ...target, currentHp }, actualDamage: hpBefore - currentHp }
  }
  const shield = target.statusEffects[shieldIdx]
  const absorbed = Math.min(shield.magnitude, amount)
  const remaining = amount - absorbed
  const statusEffects = [...target.statusEffects]
  if (shield.magnitude - absorbed <= 0) statusEffects.splice(shieldIdx, 1)
  else statusEffects[shieldIdx] = { ...shield, magnitude: shield.magnitude - absorbed }
  const currentHp = Math.max(0, target.currentHp - remaining)
  return { target: { ...target, currentHp, statusEffects }, actualDamage: hpBefore - currentHp }
}

/** Applies BUFF/DEBUFF/DOT/STUN/SHIELD/COUNTER/HEAL. LIFESTEAL is handled by the caller (needs actual damage dealt). */
function applySkillEffects(
  side: Side,
  user: CombatantState,
  target: CombatantState,
  effects: SkillEffect[],
  skillName: string
): { user: CombatantState; target: CombatantState; applied: AppliedEffect[]; healed: number } {
  let newUser = user
  let newTarget = target
  const applied: AppliedEffect[] = []
  let healed = 0

  for (const effect of effects) {
    const targetSide: Side = effect.target === 'SELF' ? side : side === 'PLAYER' ? 'ENEMY' : 'PLAYER'

    if (effect.type === 'HEAL') {
      const amount = Math.min(effect.magnitude, newUser.maxHp - newUser.currentHp)
      newUser = { ...newUser, currentHp: newUser.currentHp + amount }
      healed += amount
      applied.push({ type: 'HEAL', target: side, magnitude: effect.magnitude })
      continue
    }

    const instance: StatusEffectInstance = {
      id: makeEffectId(),
      type: effect.type,
      stat: effect.stat,
      magnitude: effect.magnitude,
      remainingRounds: effect.duration ?? 1,
      sourceSkillName: skillName,
    }

    if (effect.target === 'SELF') {
      // A new COUNTER replaces any existing one instead of stacking, to keep the reflect math simple.
      const existing = effect.type === 'COUNTER' ? newUser.statusEffects.filter((e) => e.type !== 'COUNTER') : newUser.statusEffects
      newUser = { ...newUser, statusEffects: [...existing, instance] }
    } else {
      newTarget = { ...newTarget, statusEffects: [...newTarget.statusEffects, instance] }
    }
    applied.push({ type: effect.type, target: targetSide, stat: effect.stat, magnitude: effect.magnitude, duration: effect.duration })
  }

  return { user: newUser, target: newTarget, applied, healed }
}

function performSkillUse(
  side: Side,
  attacker: CombatantState,
  defender: CombatantState,
  skill: SkillDef | null,
  rand: () => number
): { attacker: CombatantState; defender: CombatantState; turnResult: TurnResult } {
  const power = skill ? skill.power : BASIC_ATTACK_POWER
  const energyCost = skill ? skill.energyCost : 0
  const effects = skill ? skill.effects : []

  let newAttacker: CombatantState = {
    ...attacker,
    currentEnergy: Math.max(0, attacker.currentEnergy - energyCost),
    cooldowns: skill ? { ...attacker.cooldowns, [skill.id]: skill.cooldown } : attacker.cooldowns,
  }
  let newDefender = defender

  let damage: number | undefined
  let isCrit: boolean | undefined
  let countered = false
  let reflectedDamage: number | undefined
  let targetHpBefore: number | undefined
  let targetHpAfter: number | undefined
  let healed = 0

  if (power > 0) {
    targetHpBefore = newDefender.currentHp
    const counterIdx = newDefender.statusEffects.findIndex((e) => e.type === 'COUNTER' && e.remainingRounds > 0)
    const computed = computeDamage(newAttacker, newDefender, power, rand)

    if (counterIdx !== -1) {
      countered = true
      const counter = newDefender.statusEffects[counterIdx]
      reflectedDamage = Math.round((computed.damage * counter.magnitude) / 100)
      newDefender = { ...newDefender, statusEffects: newDefender.statusEffects.filter((_, i) => i !== counterIdx) }
      newAttacker = { ...newAttacker, currentHp: Math.max(0, newAttacker.currentHp - reflectedDamage) }
      damage = 0
      targetHpAfter = newDefender.currentHp
    } else {
      const applied = applyDamageWithShield(newDefender, computed.damage)
      newDefender = applied.target
      damage = computed.damage
      isCrit = computed.isCrit
      targetHpAfter = newDefender.currentHp

      const lifesteal = effects.find((e) => e.type === 'LIFESTEAL')
      if (lifesteal && applied.actualDamage > 0) {
        const healAmt = Math.min(Math.round((applied.actualDamage * lifesteal.magnitude) / 100), newAttacker.maxHp - newAttacker.currentHp)
        newAttacker = { ...newAttacker, currentHp: newAttacker.currentHp + healAmt }
        healed += healAmt
      }
    }
  }

  // A countered attack didn't land, so effects aimed at the enemy shouldn't apply either —
  // but self-targeted effects (a buff/heal on the caster) still do, since the caster still acted.
  const supportEffects = effects.filter((e) => e.type !== 'LIFESTEAL' && (!countered || e.target === 'SELF'))
  const supportResult = applySkillEffects(side, newAttacker, newDefender, supportEffects, skill?.name ?? 'Ataque Básico')
  newAttacker = supportResult.user
  newDefender = supportResult.target
  healed += supportResult.healed

  const turnResult: TurnResult = {
    version: 1,
    side,
    kind: power > 0 ? 'ATTACK' : 'SUPPORT',
    skillId: skill?.id ?? null,
    skillName: skill?.name ?? 'Ataque Básico',
    damage,
    isCrit,
    countered: countered || undefined,
    reflectedDamage,
    healed: healed > 0 ? healed : undefined,
    energySpent: energyCost,
    targetHpBefore,
    targetHpAfter,
    effectsApplied: supportResult.applied.length > 0 ? supportResult.applied : undefined,
  }

  return { attacker: newAttacker, defender: newDefender, turnResult }
}

function regenEnergy(c: CombatantState): CombatantState {
  const regen = Math.round(c.maxEnergy * ENERGY_REGEN_PCT)
  return { ...c, currentEnergy: Math.min(c.maxEnergy, c.currentEnergy + regen) }
}

function tickCooldowns(c: CombatantState): CombatantState {
  const cooldowns: Record<string, number> = {}
  for (const [id, remaining] of Object.entries(c.cooldowns)) {
    const next = remaining - 1
    if (next > 0) cooldowns[id] = next
  }
  return { ...c, cooldowns }
}

/** DOT damage + duration countdown for every status effect (BUFF/DEBUFF/DOT/STUN/SHIELD/COUNTER alike). */
function tickStatusEffects(side: Side, c: CombatantState): { combatant: CombatantState; results: TurnResult[] } {
  const results: TurnResult[] = []
  let hp = c.currentHp
  for (const effect of c.statusEffects) {
    if (effect.type === 'DOT' && effect.remainingRounds > 0 && hp > 0) {
      const before = hp
      hp = Math.max(0, hp - effect.magnitude)
      results.push({
        version: 1,
        side,
        kind: 'DOT_TICK',
        skillId: null,
        skillName: effect.sourceSkillName,
        damage: before - hp,
        targetHpBefore: before,
        targetHpAfter: hp,
      })
    }
  }
  const statusEffects = c.statusEffects.map((e) => ({ ...e, remainingRounds: e.remainingRounds - 1 })).filter((e) => e.remainingRounds > 0)
  return { combatant: { ...c, currentHp: hp, statusEffects }, results }
}

export function applyTransformation(c: CombatantState, t: TransformationDef): CombatantState {
  const maxHp = c.baseMaxHp + t.flatHpBonus
  const maxEnergy = Math.max(1, Math.round(c.baseMaxEnergy * (1 + t.energyModifier)))
  return {
    ...c,
    maxHp,
    currentHp: Math.min(c.currentHp + t.flatHpBonus, maxHp),
    maxEnergy,
    currentEnergy: Math.min(c.currentEnergy, maxEnergy),
    attack: Math.round((c.baseAttack + t.flatAttackBonus) * (1 + t.attackModifier)),
    defense: Math.round((c.baseDefense + t.flatDefenseBonus) * (1 + t.defenseModifier)),
    speed: Math.round((c.baseSpeed + t.flatSpeedBonus) * (1 + t.speedModifier)),
    activeTransformationId: t.id,
  }
}

function revertTransformation(c: CombatantState): CombatantState {
  return {
    ...c,
    maxHp: c.baseMaxHp,
    currentHp: Math.min(c.currentHp, c.baseMaxHp),
    maxEnergy: c.baseMaxEnergy,
    currentEnergy: Math.min(c.currentEnergy, c.baseMaxEnergy),
    attack: c.baseAttack,
    defense: c.baseDefense,
    speed: c.baseSpeed,
    activeTransformationId: null,
  }
}

function applyDrain(c: CombatantState, transformations: Record<string, TransformationDef>): CombatantState {
  if (!c.activeTransformationId) return c
  const t = transformations[c.activeTransformationId]
  if (!t || t.drainPerTurn <= 0) return c
  if (c.currentEnergy < t.drainPerTurn) return revertTransformation(c) // can no longer sustain it
  return { ...c, currentEnergy: c.currentEnergy - t.drainPerTurn }
}

function readNumber(payload: unknown, key: string): number | undefined {
  if (payload && typeof payload === 'object' && key in payload) {
    const value = (payload as Record<string, unknown>)[key]
    return typeof value === 'number' ? value : undefined
  }
  return undefined
}

/**
 * ON_DAMAGE_TAKEN payloads in the seed use two different shapes: a flat
 * `damageThreshold` (Broly) or a stacking `{stacks, bonusPerStack}` (Vegeta's
 * Ultra Ego). v1 does not model incremental stacking — any payload without a
 * recognizable `damageThreshold` just activates on the first hit taken.
 */
function evaluateAutoTrigger(
  trigger: TransformationTrigger,
  payload: unknown,
  ctx: { hpRatio: number; energyRatio: number; lastDamageTaken: number }
): boolean {
  switch (trigger) {
    case 'LOW_HP':
      return ctx.hpRatio <= (readNumber(payload, 'threshold') ?? 0.3)
    case 'ENERGY_CHARGE':
      return ctx.energyRatio >= (readNumber(payload, 'threshold') ?? 0.8)
    case 'ON_DAMAGE_TAKEN':
      return ctx.lastDamageTaken >= (readNumber(payload, 'damageThreshold') ?? 1)
    case 'MANUAL':
    default:
      return false
  }
}

function maybeAutoTransform(
  c: CombatantState,
  transformations: Record<string, TransformationDef>,
  triggers: TransformationTrigger[],
  lastDamageTaken: number
): { combatant: CombatantState; transformation: TransformationDef } | null {
  if (c.activeTransformationId) return null // v1: no stacking/overriding once transformed
  const hpRatio = c.maxHp > 0 ? c.currentHp / c.maxHp : 0
  const energyRatio = c.maxEnergy > 0 ? c.currentEnergy / c.maxEnergy : 0
  const candidates = Object.values(transformations).filter(
    (t) => triggers.includes(t.triggerType) && evaluateAutoTrigger(t.triggerType, t.triggerPayload, { hpRatio, energyRatio, lastDamageTaken })
  )
  if (candidates.length === 0) return null
  candidates.sort((a, b) => b.levelRequirement - a.levelRequirement)
  const chosen = candidates[0]
  return { combatant: applyTransformation(c, chosen), transformation: chosen }
}

function makeTransformResult(side: Side, t: TransformationDef): TurnResult {
  return { version: 1, side, kind: 'TRANSFORM', skillId: null, skillName: t.name, transformationId: t.id }
}

function makeStunResult(side: Side): TurnResult {
  return { version: 1, side, kind: 'STUNNED', skillId: null, skillName: 'Atordoado' }
}

export function resolveRound(
  state: BattleState,
  input: {
    playerAction: PlayerAction
    enemyAction: { skillId: string | null }
  },
  ctx: {
    playerSkills: Record<string, SkillDef>
    enemySkills: Record<string, SkillDef>
    playerTransformations: Record<string, TransformationDef>
  },
  rand: () => number = Math.random
): { state: BattleState; turnResults: TurnResult[] } {
  let player = { ...state.player }
  let enemy = { ...state.enemy }
  const turnResults: TurnResult[] = []

  // 1. Start of round: energy regen, cooldown tick, DOT tick + status-duration tick (both sides)
  player = tickCooldowns(regenEnergy(player))
  enemy = tickCooldowns(regenEnergy(enemy))
  const playerUpkeep = tickStatusEffects('PLAYER', player)
  player = playerUpkeep.combatant
  turnResults.push(...playerUpkeep.results)
  const enemyUpkeep = tickStatusEffects('ENEMY', enemy)
  enemy = enemyUpkeep.combatant
  turnResults.push(...enemyUpkeep.results)

  // 2. Reactive/passive auto-transform checks that fire at round start.
  // Enemy (a bare Character, not a UserCharacter) never has unlocked
  // transformations in v1, so only the player is checked here.
  const startAuto = maybeAutoTransform(player, ctx.playerTransformations, ['LOW_HP', 'ENERGY_CHARGE'], 0)
  if (startAuto) {
    player = startAuto.combatant
    turnResults.push(makeTransformResult('PLAYER', startAuto.transformation))
  }

  // 3. Resolve actions in effective-speed order (ties go to the player)
  const order: Side[] = getCombatStat(player, 'speed') >= getCombatStat(enemy, 'speed') ? ['PLAYER', 'ENEMY'] : ['ENEMY', 'PLAYER']

  for (const side of order) {
    if (player.currentHp <= 0 || enemy.currentHp <= 0) break

    if (side === 'PLAYER') {
      if (isStunned(player)) {
        turnResults.push(makeStunResult('PLAYER'))
        continue
      }
      if (input.playerAction.kind === 'TRANSFORM') {
        const t = ctx.playerTransformations[input.playerAction.transformationId]
        if (t) {
          player = applyTransformation(player, t)
          turnResults.push(makeTransformResult('PLAYER', t))
        }
        continue
      }
      const skill = input.playerAction.skillId ? ctx.playerSkills[input.playerAction.skillId] ?? null : null
      const hpBefore = player.currentHp
      const result = performSkillUse('PLAYER', player, enemy, skill, rand)
      player = result.attacker
      enemy = result.defender
      turnResults.push(result.turnResult)

      // Being countered costs the player HP too (reflected damage) — check the same trigger.
      const selfDamageTaken = hpBefore - player.currentHp
      if (selfDamageTaken > 0 && player.currentHp > 0) {
        const auto = maybeAutoTransform(player, ctx.playerTransformations, ['ON_DAMAGE_TAKEN'], selfDamageTaken)
        if (auto) {
          player = auto.combatant
          turnResults.push(makeTransformResult('PLAYER', auto.transformation))
        }
      }
    } else {
      if (isStunned(enemy)) {
        turnResults.push(makeStunResult('ENEMY'))
        continue
      }
      const skill = input.enemyAction.skillId ? ctx.enemySkills[input.enemyAction.skillId] ?? null : null
      const result = performSkillUse('ENEMY', enemy, player, skill, rand)
      enemy = result.attacker
      player = result.defender
      turnResults.push(result.turnResult)

      if (player.currentHp > 0) {
        const damageAuto = maybeAutoTransform(player, ctx.playerTransformations, ['ON_DAMAGE_TAKEN'], result.turnResult.damage ?? 0)
        if (damageAuto) {
          player = damageAuto.combatant
          turnResults.push(makeTransformResult('PLAYER', damageAuto.transformation))
        }
      }
    }
  }

  // 4. End of round: drain active transformations (player only, per above)
  player = applyDrain(player, ctx.playerTransformations)

  // 5. Outcome
  let outcome: Outcome = state.outcome
  if (player.currentHp <= 0 && enemy.currentHp <= 0) outcome = 'DRAW'
  else if (enemy.currentHp <= 0) outcome = 'PLAYER_WIN'
  else if (player.currentHp <= 0) outcome = 'ENEMY_WIN'

  return { state: { ...state, player, enemy, outcome }, turnResults }
}
