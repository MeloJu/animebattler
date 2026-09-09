export type Outcome = 'PLAYER_WIN' | 'ENEMY_WIN' | 'DRAW' | null
export type Side = 'PLAYER' | 'ENEMY'
export type TransformationTrigger = 'MANUAL' | 'LOW_HP' | 'ON_DAMAGE_TAKEN' | 'ENERGY_CHARGE'
export type Stat = 'attack' | 'defense' | 'speed'

/**
 * Atributo do qual uma habilidade tira força. Espelha o enum ScalingStat do
 * Prisma. Note que inclui 'energy', que NÃO é um Stat: energia não recebe
 * BUFF/DEBUFF e é lida do tamanho da reserva, não do valor atual.
 */
export type ScalingStat = 'attack' | 'defense' | 'speed' | 'energy'
/**
 * DOMINIO e o unico efeito que nao e um numero aplicado ao alvo: e um ESTADO
 * do lancador que muda as regras enquanto dura. Ver dominioAberto em engine.ts.
 */
export type EffectType =
  | 'BUFF'
  | 'DEBUFF'
  | 'DOT'
  | 'STUN'
  | 'COUNTER'
  | 'SHIELD'
  | 'HEAL'
  | 'LIFESTEAL'
  | 'DOMAIN'

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
  /**
   * A NATUREZA do dano contínuo — queimadura, veneno, sangramento, maldição.
   *
   * Existe um único EffectType DOT servindo às quatro, e é assim de propósito:
   * mecanicamente elas são a mesma coisa, dano por rodada. O que muda é como
   * se lê na tela, e sem este campo a instância não tinha como saber: só as
   * TAGS da habilidade de origem distinguem, e a instância guardava apenas o
   * nome dela.
   *
   * Opcional porque batalhas em andamento foram gravadas antes do campo.
   */
  flavor?: DotFlavor
}

/** Naturezas de dano contínuo que a tela sabe apresentar. */
export type DotFlavor = 'queimadura' | 'veneno' | 'sangramento' | 'maldicao'

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
  /**
   * Reserva defensiva. Opcional porque batalhas em andamento foram gravadas
   * antes deste campo existir — ausente vale 0, e um combatente sem stamina
   * simplesmente não consegue usar habilidade defensiva, que é o mesmo que
   * ficar sem energia para atacar.
   */
  currentStamina?: number
  maxStamina?: number
  baseMaxEnergy: number
  attack: number
  baseAttack: number
  defense: number
  baseDefense: number
  speed: number
  baseSpeed: number
  /**
   * Acurácia e agilidade não têm par `base` como os outros, porque nada as
   * modifica em batalha: não há BUFF nem transformação que mexa nelas, e elas
   * não escalam por nível. São o número da build, do começo ao fim da luta.
   */
  accuracy?: number
  agility?: number
  cooldowns: Record<string, number> // skillId -> rounds remaining
  activeTransformationId: string | null
  /**
   * Fração descontada do custo de energia de toda habilidade, vinda de traço
   * passivo. -0.3 = 30% mais barato. Opcional porque batalhas em andamento
   * foram gravadas antes deste campo existir; ausente vale 0.
   */
  energyCostModifier?: number
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
  kind: 'ATTACK' | 'TRANSFORM' | 'SUPPORT' | 'STUNNED' | 'DOT_TICK' | 'CLASH' | 'DOMAIN_OPEN' | 'DOMAIN_CLASH' | 'DOMAIN_FALL'
  /** CLASH: a natureza do choque ('beam', 'espada', 'fisico'). */
  clashTag?: string
  skillId: string | null // null = Basic Attack (synthesized, not a DB row)
  skillName: string
  transformationId?: string
  damage?: number
  isCrit?: boolean
  /** ATTACK: o golpe passou por counter/escudo porque o dono tinha dominio aberto. */
  acertoGarantido?: boolean
  /** ATTACK: o golpe passou longe — ver resolverAcerto. */
  errou?: boolean
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
  /**
   * Confiabilidade da habilidade em si, 0-100. Ausente vale 100, que é o
   * comportamento antigo de nunca errar.
   */
  precision?: number
  effects: SkillEffect[]
  scalingStat: ScalingStat
  /**
   * Marcadores temáticos da habilidade — 'beam', 'espada', 'fogo'. O schema
   * as chamava de "flavor only"; o clash é o primeiro lugar onde elas decidem
   * alguma coisa.
   */
  tags: string[]
}

/** Traço passivo já resolvido para uso no motor. Ver model Trait. */
export type TraitDef = {
  name: string
  energyModifier: number
  attackModifier: number
  defenseModifier: number
  speedModifier: number
  flatHpBonus: number
  flatAttackBonus: number
  flatDefenseBonus: number
  flatSpeedBonus: number
  energyCostModifier: number
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
  /** Vida por rodada. Opcional: transformações antigas não tinham o campo. */
  drainHpPerTurn?: number
  /** Se ativar gasta a rodada. Ausente vale true — o comportamento antigo. */
  consumesTurn?: boolean
  /** Energia cobrada uma vez, na ativação. */
  activationCost?: number
  triggerType: TransformationTrigger
  triggerPayload: unknown
}

/**
 * Bônus PLANO somado aos stats base: árvore de habilidade, equipamento e
 * pontos de atributo. Energia e stamina entram aqui desde que existe alocação
 * livre — antes só HP, ataque, defesa e velocidade recebiam bônus, e um
 * personagem não tinha como investir nas duas reservas.
 */
export type StatBonus = {
  hp: number
  attack: number
  defense: number
  speed: number
  energy: number
  stamina: number
  accuracy?: number
  agility?: number
  intelligence?: number
}

export type BaseStats = {
  hp: number
  attack: number
  defense: number
  speed: number
  energy: number
  stamina: number
  /**
   * Acurácia, agilidade e inteligência.
   *
   * Opcionais porque batalhas em andamento foram gravadas antes deles: um
   * combatente sem os três cai no valor neutro, e acurácia igual à agilidade
   * dá evasão zero — ou seja, batalha antiga se comporta exatamente como se
   * comportava. Ver ATRIBUTO_NEUTRO.
   */
  accuracy?: number
  agility?: number
  intelligence?: number
}

export type PlayerAction =
  | { kind: 'ATTACK'; skillId: string | null }
  | { kind: 'TRANSFORM'; transformationId: string }
