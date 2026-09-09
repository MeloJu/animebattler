import {
  BASIC_ATTACK_POWER,
  CRIT_BASE_CHANCE,
  CRIT_MAX_CHANCE,
  CRIT_MULTIPLIER,
  CRIT_SPEED_COEFFICIENT,
  ENERGY_REGEN_PCT,
  STAMINA_REGEN_PCT,
  LEVEL_SCALING,
  ACERTO_MINIMO,
  ATRIBUTO_NEUTRO,
  DOMAIN_DAMAGE_BONUS,
  EVASAO_MAXIMA,
  EVASAO_POR_PONTO,
  SCALING_BASE,
  SCALING_REFERENCE,
} from './constants'
import type {
  AppliedEffect,
  BaseStats,
  BattleState,
  CombatantState,
  Outcome,
  PlayerAction,
  ScalingStat,
  SkillDef,
  SkillEffect,
  Side,
  DotFlavor,
  Stat,
  StatBonus,
  StatusEffectInstance,
  TraitDef,
  TransformationDef,
  TransformationTrigger,
  TurnResult,
} from './types'

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value))
}

/**
 * Deduz a natureza de um dano contínuo a partir das tags da habilidade.
 *
 * As tags do catálogo são bagunçadas — há 'fire' e 'fogo', 'poison' e
 * 'veneno', 'bleed' e 'sangramento' —, então a leitura aceita as duas
 * línguas. Nada disso mudava nada antes; é a segunda vez que as tags, que o
 * schema chamava de "flavor only", decidem alguma coisa.
 *
 * Sem correspondência, fica indefinido e a tela cai no genérico.
 */
export function saborDoDot(tags: string[]): DotFlavor | undefined {
  if (tags.some((t) => t === 'fogo' || t === 'fire' || t === 'burn')) return 'queimadura'
  if (tags.some((t) => t === 'veneno' || t === 'poison')) return 'veneno'
  if (tags.some((t) => t === 'sangramento' || t === 'bleed')) return 'sangramento'
  if (tags.some((t) => t === 'maldicao' || t === 'decay')) return 'maldicao'
  return undefined
}

function makeEffectId(): string {
  return `fx-${Math.random().toString(36).slice(2, 10)}`
}

function makeCombatant(stats: BaseStats, energyCostModifier = 0): CombatantState {
  return {
    currentHp: stats.hp,
    maxHp: stats.hp,
    baseMaxHp: stats.hp,
    currentEnergy: stats.energy,
    maxEnergy: stats.energy,
    currentStamina: stats.stamina,
    maxStamina: stats.stamina,
    baseMaxEnergy: stats.energy,
    attack: stats.attack,
    baseAttack: stats.attack,
    defense: stats.defense,
    baseDefense: stats.defense,
    speed: stats.speed,
    baseSpeed: stats.speed,
    accuracy: stats.accuracy,
    agility: stats.agility,
    cooldowns: {},
    activeTransformationId: null,
    energyCostModifier,
    statusEffects: [],
  }
}

/** Character base stats + flat bonuses from unlocked skill-tree nodes. Battles always start untransformed. */
export function computeBaseStats(
  character: {
    hp: number
    attack: number
    defense: number
    speed: number
    energy: number
    stamina: number
    accuracy?: number
    agility?: number
    intelligence?: number
  },
  bonus: StatBonus
): BaseStats {
  return {
    hp: character.hp + bonus.hp,
    attack: character.attack + bonus.attack,
    defense: character.defense + bonus.defense,
    speed: character.speed + bonus.speed,
    energy: character.energy + bonus.energy,
    stamina: character.stamina + bonus.stamina,
    accuracy: (character.accuracy ?? ATRIBUTO_NEUTRO) + (bonus.accuracy ?? 0),
    agility: (character.agility ?? ATRIBUTO_NEUTRO) + (bonus.agility ?? 0),
    intelligence: (character.intelligence ?? ATRIBUTO_NEUTRO) + (bonus.intelligence ?? 0),
  }
}

/**
 * Soma fontes de bônus plano (árvore de skills, equipamento, ...) num único
 * bloco antes dele virar stat de batalha. Existe pra que adicionar uma nova
 * fonte não signifique tocar em cada chamador de computeBaseStats.
 */
export const SEM_BONUS: StatBonus = {
  hp: 0,
  attack: 0,
  defense: 0,
  speed: 0,
  energy: 0,
  stamina: 0,
  accuracy: 0,
  agility: 0,
  intelligence: 0,
}

export function sumStatBonuses(...bonuses: Partial<StatBonus>[]): StatBonus {
  return bonuses.reduce<StatBonus>(
    (acc, b) => ({
      hp: acc.hp + (b.hp ?? 0),
      attack: acc.attack + (b.attack ?? 0),
      defense: acc.defense + (b.defense ?? 0),
      speed: acc.speed + (b.speed ?? 0),
      energy: acc.energy + (b.energy ?? 0),
      stamina: acc.stamina + (b.stamina ?? 0),
      accuracy: (acc.accuracy ?? 0) + (b.accuracy ?? 0),
      agility: (acc.agility ?? 0) + (b.agility ?? 0),
      intelligence: (acc.intelligence ?? 0) + (b.intelligence ?? 0),
    }),
    { ...SEM_BONUS }
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
  character: { hp: number; attack: number; defense: number; speed: number; energy: number; stamina: number },
  level: number,
  bonus: StatBonus
): BaseStats {
  return computeBaseStats(scaleForLevel(character, level), bonus)
}

/**
 * Substitui, campo a campo, os atributos de um combatente pelos do chefe.
 *
 * Um estágio de história pode dar atributos próprios ao inimigo em vez de
 * herdar os do personagem jogável correspondente. Campo nulo ou ausente
 * mantém o valor que veio da escala por nível, então dá para ajustar uma
 * dimensão só — normalmente velocidade, que é a que mais desequilibra por
 * decidir iniciativa e crítico ao mesmo tempo.
 */
export function applyBossOverrides(
  stats: BaseStats,
  overrides: {
    bossHp?: number | null
    bossAttack?: number | null
    bossDefense?: number | null
    bossSpeed?: number | null
    bossEnergy?: number | null
    bossStamina?: number | null
  }
): BaseStats {
  return {
    // O spread não é estilo: sem ele, todo atributo novo some silenciosamente
    // aqui. Foi o que aconteceu com acurácia e agilidade — o chefe caía no
    // valor neutro e a evasão contra ele mudava sem ninguém ter pedido.
    // Chefe não tem override para os três, e não deve mesmo: eles não têm
    // teto de escala como os outros.
    ...stats,
    hp: overrides.bossHp ?? stats.hp,
    attack: overrides.bossAttack ?? stats.attack,
    defense: overrides.bossDefense ?? stats.defense,
    speed: overrides.bossSpeed ?? stats.speed,
    energy: overrides.bossEnergy ?? stats.energy,
    stamina: overrides.bossStamina ?? stats.stamina,
  }
}

/**
 * O terceiro parâmetro é opcional para não obrigar todo chamador a conhecer
 * traços passivos: quem não tem traço nenhum não muda nada.
 */
/**
 * Aplica traços passivos a um bloco de atributos.
 *
 * Percentual primeiro, plano depois — a mesma ordem de computeFighterStats,
 * para que um traço de +10% não multiplique também o bônus plano de
 * equipamento e acabe valendo mais do que diz.
 */
export function applyTraits(stats: BaseStats, traits: TraitDef[]): BaseStats {
  if (traits.length === 0) return stats
  const pct = traits.reduce(
    (a, t) => ({
      hp: a.hp,
      attack: a.attack + t.attackModifier,
      defense: a.defense + t.defenseModifier,
      speed: a.speed + t.speedModifier,
      energy: a.energy + t.energyModifier,
    }),
    { hp: 0, attack: 0, defense: 0, speed: 0, energy: 0 }
  )
  const plano = traits.reduce(
    (a, t) => ({
      hp: a.hp + t.flatHpBonus,
      attack: a.attack + t.flatAttackBonus,
      defense: a.defense + t.flatDefenseBonus,
      speed: a.speed + t.flatSpeedBonus,
    }),
    { hp: 0, attack: 0, defense: 0, speed: 0 }
  )
  return {
    // Mesmo motivo do spread em applyBossOverrides: nenhum traço mexe em
    // acurácia, agilidade ou inteligência, e sem isto eles seriam apagados
    // por passar por aqui.
    ...stats,
    hp: Math.round(stats.hp) + plano.hp,
    attack: Math.round(stats.attack * (1 + pct.attack)) + plano.attack,
    defense: Math.round(stats.defense * (1 + pct.defense)) + plano.defense,
    speed: Math.round(stats.speed * (1 + pct.speed)) + plano.speed,
    energy: Math.round(stats.energy * (1 + pct.energy)),
    // Stamina não tem modificador próprio de traço, e é decisão: mais um
    // eixo por traço multiplicaria os casos sem acrescentar escolha. Um traço
    // que quisesse mexer em defesa mexe em defesa.
    stamina: stats.stamina,
  }
}

/** Soma o desconto de custo de energia de todos os traços ativos. */
export function traitEnergyCostModifier(traits: TraitDef[]): number {
  return traits.reduce((a, t) => a + t.energyCostModifier, 0)
}

export function createInitialState(
  player: BaseStats,
  enemy: BaseStats,
  passivos?: { player?: number; enemy?: number }
): BattleState {
  return {
    version: 1,
    player: makeCombatant(player, passivos?.player ?? 0),
    enemy: makeCombatant(enemy, passivos?.enemy ?? 0),
    outcome: null,
  }
}

/**
 * Custo de energia de uma habilidade para ESTE combatente, já com o desconto
 * de traço passivo. Nunca desce abaixo de 1 quando a habilidade custa algo:
 * um traço muito forte não deve tornar tudo gratuito, senão energia deixa de
 * ser recurso e a rotação de habilidades perde o sentido.
 */
export function energyCostFor(c: CombatantState, energyCost: number): number {
  if (energyCost <= 0) return 0
  const fator = 1 + (c.energyCostModifier ?? 0)
  return Math.max(1, Math.round(energyCost * fator))
}

/**
 * Scales a combatant's raw stat block by level — story mode's enemies are
 * catalog characters/monsters with `enemyLevel` applied, so a stage's enemy
 * is stronger without needing a stat row of its own.
 */
export function scaleForLevel<T extends { hp: number; attack: number; defense: number; speed: number; energy: number; stamina: number }>(
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
    stamina: Math.round(base.stamina * m),
  }
}

/** A skill only counts as usable in battle if it deals damage or does something (has effects) — a 0-power, no-effect row is inert data. */
export function hasBattleValue(skill: { power: number; effects: unknown }): boolean {
  return skill.power > 0 || (Array.isArray(skill.effects) && skill.effects.length > 0)
}

/**
 * Se esta habilidade é paga com STAMINA em vez de energia.
 *
 * A regra é derivada do que a habilidade FAZ, e não de um campo escrito à
 * mão: é defensiva quando não causa dano nenhum e traz proteção — escudo,
 * cura, counter, ou buff em si mesmo. Deriva porque são 581 habilidades no
 * catálogo, e um campo novo em cada uma seria 581 oportunidades de errar.
 *
 * A exigência de poder ZERO é o que impede o abuso óbvio: uma habilidade que
 * bate forte E dá escudo continua saindo da energia, senão o atacante pagaria
 * o próprio dano com a barra defensiva.
 *
 * O efeito de jogo é a decisão que a stamina existe para criar: atacar e se
 * proteger deixam de disputar a mesma barra, então quem tem reserva defensiva
 * alta aguenta muitas rodadas — e o adversário precisa estourar antes de ela
 * voltar, em vez de simplesmente esperar.
 */
export function custaStamina(skill: SkillDef): boolean {
  if (skill.power > 0) return false
  return skill.effects.some(
    (e) => e.type === 'SHIELD' || e.type === 'HEAL' || e.type === 'COUNTER' || (e.type === 'BUFF' && e.target === 'SELF')
  )
}

/** Quanto o combatente tem da reserva que ESTA habilidade consome. */
function reservaPara(c: CombatantState, skill: SkillDef): number {
  return custaStamina(skill) ? c.currentStamina ?? 0 : c.currentEnergy
}

export function isLegalMove(combatant: CombatantState, skill: SkillDef | null): boolean {
  if (!skill) return true // Basic Attack is always legal
  const onCooldown = (combatant.cooldowns[skill.id] ?? 0) > 0
  return !onCooldown && reservaPara(combatant, skill) >= energyCostFor(combatant, skill.energyCost)
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

/**
 * Valor do atributo do qual uma habilidade escala.
 *
 * Energia é lida de maxEnergy, NÃO de currentEnergy, e isso é deliberado: com
 * a energia atual, cada lançamento enfraqueceria o próximo e um conjurador
 * entraria em espiral de morte justamente por usar as habilidades dele.
 * maxEnergy é atributo de build; currentEnergy é recurso da rodada.
 *
 * Os outros três passam por getCombatStat para respeitar BUFF/DEBUFF ativos —
 * energia não tem buff porque não é um Stat.
 */
function scalingValue(c: CombatantState, stat: ScalingStat): number {
  return stat === 'energy' ? c.maxEnergy : getCombatStat(c, stat)
}

/**
 * Bônus plano que o atributo de escala soma a um valor base (poder, cura,
 * escudo). É proporcional a quão acima da média do elenco o lançador está
 * naquele atributo — ver SCALING_REFERENCE para por que não é um coeficiente
 * fixo por atributo.
 */
function scaledBonus(c: CombatantState, stat: ScalingStat): number {
  return SCALING_BASE * (scalingValue(c, stat) / SCALING_REFERENCE[stat])
}

/**
 * Quanto o alvo desvia deste atacante, de 0 ao teto.
 *
 * Só a DIFERENÇA conta, não o valor absoluto: dois personagens com agilidade
 * 18 e acurácia 18 se acertam sempre, do mesmo jeito que dois com 8 e 8. Isso
 * é o que impede a inflação — subir os dois números do elenco inteiro não
 * muda nada, e é também por isso que nenhum dos dois escala por nível.
 */
export function evasaoContra(atacante: CombatantState, alvo: CombatantState): number {
  const vantagem = (alvo.agility ?? ATRIBUTO_NEUTRO) - (atacante.accuracy ?? ATRIBUTO_NEUTRO)
  return clamp(vantagem * EVASAO_POR_PONTO, 0, EVASAO_MAXIMA)
}

/**
 * Se o golpe acerta.
 *
 * Duas coisas independentes se multiplicam, e a separação é o ponto:
 *
 * - PRECISÃO é da habilidade. Não depende de quem lança nem de quem recebe —
 *   é o golpe ser largo e difícil de encaixar. É o que permite existir uma
 *   habilidade que bate muito e erra às vezes, quebrando a regra de que a de
 *   maior número é sempre a melhor escolha.
 * - EVASÃO é do alvo, contra a acurácia de quem ataca. É build, e responde a
 *   investimento dos dois lados.
 *
 * O produto tem piso (ACERTO_MINIMO) porque as duas empilhadas poderiam
 * mandar a chance para bem abaixo do que qualquer uma prometia sozinha.
 *
 * Só vale para golpe com poder. Habilidade de suporte não erra: escudo, cura
 * e buff são lançados em si mesmo, e um escudo que falha é frustração pura —
 * o jogador gastou a rodada defensiva e não recebeu nem informação em troca.
 */
export function resolverAcerto(
  atacante: CombatantState,
  alvo: CombatantState,
  precisao: number,
  rand: () => number
): { acertou: boolean; chance: number } {
  const chance = clamp((precisao / 100) * (1 - evasaoContra(atacante, alvo)), ACERTO_MINIMO, 1)

  // NÃO CONSOME ALEATORIEDADE quando o acerto é certo, e isso não é
  // microotimização: rand() é a mesma sequência que decide crítico e choque,
  // então gastar um número a mais por golpe deslocaria toda simulação com
  // semente. Como precisão 100 contra evasão 0 é o caso de quase todo o
  // catálogo hoje, pular o sorteio faz a mecânica ser literalmente inerte
  // onde ela não se aplica — as medições de balanceamento anteriores
  // continuam valendo dígito por dígito.
  if (chance >= 1) return { acertou: true, chance: 1 }
  return { acertou: rand() < chance, chance }
}

function computeDamage(
  attacker: CombatantState,
  defender: CombatantState,
  power: number,
  scalingStat: ScalingStat,
  rand: () => number
): { damage: number; isCrit: boolean } {
  const def = getCombatStat(defender, 'defense')
  const atkSpeed = getCombatStat(attacker, 'speed')
  const defSpeed = getCombatStat(defender, 'speed')
  // Dentro do próprio domínio a técnica é amplificada — ver DOMAIN_DAMAGE_BONUS.
  const amplificacao = dominioAberto(attacker) ? 1 + DOMAIN_DAMAGE_BONUS : 1
  const raw = (power + scaledBonus(attacker, scalingStat)) * amplificacao
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
/**
 * O DOMÍNIO, e por que ele não é só uma habilidade forte.
 *
 * As cinco Expansões de Domínio eram, mecanicamente, indistinguíveis de
 * qualquer outro ultimate: poder alto, custo alto, recarga 6. A tag `dominio`
 * existia e não fazia nada. Na ficção o domínio não é um golpe — é um espaço
 * fechado onde a técnica de quem abriu ACERTA, e é isso que ele passa a ser
 * aqui.
 *
 * Enquanto um combatente tem domínio aberto:
 *
 * 1. ACERTO GARANTIDO. Os golpes dele atravessam counter e escudo. É a única
 *    coisa no jogo que faz isso, e é o que dá ao domínio um lugar próprio:
 *    contra um oponente escondido atrás de defesa, nenhum número de poder
 *    resolve — abrir o domínio resolve.
 *
 * 2. MANUTENÇÃO. Cobra energia toda rodada (a `magnitude` da instância). Sem
 *    energia, o domínio cai sozinho. É o que impede "abriu, ganhou": o dono
 *    tem uma janela, não um estado permanente.
 *
 * 3. CHOQUE DE DOMÍNIOS. Abrir o seu contra um já aberto resolve os dois na
 *    hora. Ganha o de manutenção mais cara — o domínio mais caro de sustentar
 *    é o mais refinado — e o perdedor desaba atordoado. Empate derruba os
 *    dois. Note que isto NÃO é o choque de golpes de resolverClash, que exige
 *    os dois lançarem no mesmo turno e por isso quase nunca dispara: aqui
 *    basta um domínio estar aberto quando o outro abre, que é situação comum.
 */
function dominioAberto(c: CombatantState): StatusEffectInstance | undefined {
  return c.statusEffects.find((e) => e.type === 'DOMAIN' && e.remainingRounds > 0)
}

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

/**
 * Remove a instância anterior do MESMO efeito vinda da MESMA habilidade, para
 * que reaplicar renove a duração em vez de empilhar.
 *
 * POR QUE: 132 das 524 habilidades do catálogo têm um efeito com duração maior
 * ou igual ao cooldown, ou seja, podem ser lançadas de novo antes do efeito
 * anterior expirar. Sem esta regra, cada relançamento somava mais uma cópia,
 * sem teto. O Senbonzakura do Byakuya (DOT 7 por 3 rodadas, cooldown 2) virava
 * 7, depois 14, depois 21 de dano por rodada, e a luta deixava de ser
 * vencível por qualquer jogada. Medido: o estágio 6 dava 0% de vitória mesmo
 * dando ao jogador a velocidade do inimigo E mais 50% de dano.
 *
 * A CHAVE INCLUI O ATRIBUTO de propósito: uma habilidade que aplica BUFF de
 * ataque e BUFF de defesa (o Prince's Pride do Vegeta) precisa manter os dois.
 * Só é duplicata o mesmo tipo, no mesmo atributo, da mesma habilidade.
 *
 * Habilidades DIFERENTES continuam somando — dois venenos distintos empilham,
 * que é o comportamento desejado. O que não pode é o mesmo veneno consigo.
 */
function semDuplicataDaMesmaSkill(
  efeitos: StatusEffectInstance[],
  novo: StatusEffectInstance
): StatusEffectInstance[] {
  return efeitos.filter(
    (e) => !(e.sourceSkillName === novo.sourceSkillName && e.type === novo.type && e.stat === novo.stat)
  )
}

/** Applies BUFF/DEBUFF/DOT/STUN/SHIELD/COUNTER/HEAL. LIFESTEAL is handled by the caller (needs actual damage dealt). */
function applySkillEffects(
  side: Side,
  user: CombatantState,
  target: CombatantState,
  effects: SkillEffect[],
  skillName: string,
  scalingStat: ScalingStat,
  skillTags: string[]
): { user: CombatantState; target: CombatantState; applied: AppliedEffect[]; healed: number; eventos: TurnResult[] } {
  // CURA e ESCUDO escalam junto com dano, senão um suporte que investe no
  // próprio atributo continua curando o mesmo tanto do nível 1 ao 40 — que
  // era exatamente o caso antes: magnitude era número fixo.
  //
  // DOT, BUFF e DEBUFF ficam fixos de propósito. DOT aplica por rodada e
  // multiplica pela duração, e BUFF/DEBUFF são porcentagem: os três precisam
  // de calibragem própria, e escalar junto os deixaria desproporcionais.
  const bonus = Math.round(scaledBonus(user, scalingStat))
  let newUser = user
  let newTarget = target
  const applied: AppliedEffect[] = []
  const eventos: TurnResult[] = []
  let healed = 0
  const ladoOposto: Side = side === 'PLAYER' ? 'ENEMY' : 'PLAYER'

  for (const effect of effects) {
    const targetSide: Side = effect.target === 'SELF' ? side : side === 'PLAYER' ? 'ENEMY' : 'PLAYER'

    if (effect.type === 'HEAL') {
      const total = effect.magnitude + bonus
      const amount = Math.min(total, newUser.maxHp - newUser.currentHp)
      newUser = { ...newUser, currentHp: newUser.currentHp + amount }
      healed += amount
      applied.push({ type: 'HEAL', target: side, magnitude: total })
      continue
    }

    // DOMÍNIO: estado do lançador, e a única aplicação que pode ser recusada
    // — o domínio do oponente disputa com o seu. Ver dominioAberto.
    if (effect.type === 'DOMAIN') {
      const meu: StatusEffectInstance = {
        id: makeEffectId(),
        type: 'DOMAIN',
        magnitude: effect.magnitude,
        remainingRounds: effect.duration ?? 3,
        sourceSkillName: skillName,
      }
      const dele = dominioAberto(newTarget)

      if (dele) {
        const atordoar = (c: CombatantState): CombatantState => ({
          ...c,
          statusEffects: [
            ...c.statusEffects.filter((e) => e.type !== 'DOMAIN'),
            { id: makeEffectId(), type: 'STUN', magnitude: 1, remainingRounds: 1, sourceSkillName: skillName },
          ],
        })
        const vencedor = meu.magnitude > dele.magnitude ? side : dele.magnitude > meu.magnitude ? ladoOposto : null

        if (vencedor === side) {
          newTarget = atordoar(newTarget)
          newUser = { ...newUser, statusEffects: [...newUser.statusEffects.filter((e) => e.type !== 'DOMAIN'), meu] }
        } else if (vencedor === ladoOposto) {
          newUser = atordoar(newUser)
        } else {
          // Domínios equivalentes se anulam e derrubam os dois donos.
          newUser = atordoar(newUser)
          newTarget = atordoar(newTarget)
        }

        eventos.push({
          version: 1,
          side: vencedor ?? side,
          kind: 'DOMAIN_CLASH',
          skillId: null,
          skillName: vencedor === null ? 'Domínios anulados' : skillName,
        })
        continue
      }

      newUser = { ...newUser, statusEffects: [...newUser.statusEffects.filter((e) => e.type !== 'DOMAIN'), meu] }
      eventos.push({ version: 1, side, kind: 'DOMAIN_OPEN', skillId: null, skillName })
      applied.push({ type: 'DOMAIN', target: side, magnitude: meu.magnitude, duration: meu.remainingRounds })
      continue
    }

    const instance: StatusEffectInstance = {
      id: makeEffectId(),
      type: effect.type,
      stat: effect.stat,
      magnitude: effect.type === 'SHIELD' ? effect.magnitude + bonus : effect.magnitude,
      remainingRounds: effect.duration ?? 1,
      sourceSkillName: skillName,
      ...(effect.type === 'DOT' ? { flavor: saborDoDot(skillTags) } : {}),
    }

    if (effect.target === 'SELF') {
      // A new COUNTER replaces any existing one instead of stacking, to keep the reflect math simple.
      const existing =
        effect.type === 'COUNTER'
          ? newUser.statusEffects.filter((e) => e.type !== 'COUNTER')
          : semDuplicataDaMesmaSkill(newUser.statusEffects, instance)
      newUser = { ...newUser, statusEffects: [...existing, instance] }
    } else {
      newTarget = {
        ...newTarget,
        statusEffects: [...semDuplicataDaMesmaSkill(newTarget.statusEffects, instance), instance],
      }
    }
    applied.push({ type: effect.type, target: targetSide, stat: effect.stat, magnitude: instance.magnitude, duration: effect.duration })
  }

  return { user: newUser, target: newTarget, applied, healed, eventos }
}

/** Dano que ignora escudo — ver dominioAberto. */
function aplicarDanoDireto(target: CombatantState, amount: number): { target: CombatantState; actualDamage: number } {
  const currentHp = Math.max(0, target.currentHp - amount)
  return { target: { ...target, currentHp }, actualDamage: target.currentHp - currentHp }
}

function performSkillUse(
  side: Side,
  attacker: CombatantState,
  defender: CombatantState,
  skill: SkillDef | null,
  rand: () => number
): { attacker: CombatantState; defender: CombatantState; turnResult: TurnResult; eventos: TurnResult[] } {
  const power = skill ? skill.power : BASIC_ATTACK_POWER
  const energyCost = skill ? energyCostFor(attacker, skill.energyCost) : 0
  const effects = skill ? skill.effects : []
  // Ataque básico escala de ataque: é golpe físico, não técnica.
  const scalingStat: ScalingStat = skill ? skill.scalingStat : 'attack'

  // O custo sai da reserva certa: defesa da stamina, o resto da energia.
  const daStamina = skill ? custaStamina(skill) : false
  let newAttacker: CombatantState = {
    ...attacker,
    currentEnergy: daStamina ? attacker.currentEnergy : Math.max(0, attacker.currentEnergy - energyCost),
    currentStamina: daStamina
      ? Math.max(0, (attacker.currentStamina ?? 0) - energyCost)
      : attacker.currentStamina,
    cooldowns: skill ? { ...attacker.cooldowns, [skill.id]: skill.cooldown } : attacker.cooldowns,
  }
  let newDefender = defender

  let damage: number | undefined
  let isCrit: boolean | undefined
  let errou = false
  let countered = false
  let reflectedDamage: number | undefined
  let targetHpBefore: number | undefined
  let targetHpAfter: number | undefined
  let healed = 0

  // Dentro do próprio domínio a técnica acerta: counter e escudo não valem.
  const acertoGarantido = dominioAberto(newAttacker) !== undefined

  if (power > 0) {
    targetHpBefore = newDefender.currentHp
    targetHpAfter = newDefender.currentHp

    // O acerto garantido do domínio também vence a esquiva: "a técnica acerta"
    // não pode valer contra escudo e counter e falhar contra agilidade.
    errou = acertoGarantido
      ? false
      : !resolverAcerto(newAttacker, newDefender, skill?.precision ?? 100, rand).acertou
  }

  if (power > 0 && !errou) {
    const counterIdx = acertoGarantido
      ? -1
      : newDefender.statusEffects.findIndex((e) => e.type === 'COUNTER' && e.remainingRounds > 0)
    const computed = computeDamage(newAttacker, newDefender, power, scalingStat, rand)

    if (counterIdx !== -1) {
      countered = true
      const counter = newDefender.statusEffects[counterIdx]
      reflectedDamage = Math.round((computed.damage * counter.magnitude) / 100)
      newDefender = { ...newDefender, statusEffects: newDefender.statusEffects.filter((_, i) => i !== counterIdx) }
      newAttacker = { ...newAttacker, currentHp: Math.max(0, newAttacker.currentHp - reflectedDamage) }
      damage = 0
      targetHpAfter = newDefender.currentHp
    } else {
      const applied = acertoGarantido
        ? aplicarDanoDireto(newDefender, computed.damage)
        : applyDamageWithShield(newDefender, computed.damage)
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
  // Golpe que errou não entrega efeito no alvo, pela mesma razão do counter:
  // ele não encostou. O que é lançado em si mesmo continua valendo, porque o
  // lançador agiu de qualquer forma.
  const naoEncostou = countered || errou
  const supportEffects = effects.filter((e) => e.type !== 'LIFESTEAL' && (!naoEncostou || e.target === 'SELF'))
  const supportResult = applySkillEffects(side, newAttacker, newDefender, supportEffects, skill?.name ?? 'Ataque Básico', scalingStat, skill?.tags ?? [])
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
    acertoGarantido: acertoGarantido && power > 0 ? true : undefined,
    errou: errou || undefined,
    countered: countered || undefined,
    reflectedDamage,
    healed: healed > 0 ? healed : undefined,
    energySpent: energyCost,
    targetHpBefore,
    targetHpAfter,
    effectsApplied: supportResult.applied.length > 0 ? supportResult.applied : undefined,
  }

  return { attacker: newAttacker, defender: newDefender, turnResult, eventos: supportResult.eventos }
}

function regenEnergy(c: CombatantState): CombatantState {
  const regen = Math.round(c.maxEnergy * ENERGY_REGEN_PCT)
  const maxStamina = c.maxStamina ?? 0
  const stamina = Math.min(maxStamina, (c.currentStamina ?? 0) + Math.round(maxStamina * STAMINA_REGEN_PCT))
  return {
    ...c,
    currentEnergy: Math.min(c.maxEnergy, c.currentEnergy + regen),
    currentStamina: stamina,
  }
}

/**
 * Cobra a manutenção do domínio aberto, e o derruba se não houver com que pagar.
 *
 * É o que separa o domínio de um buff permanente: quem abre tem uma janela
 * paga em energia, não um estado de graça. Roda depois da regeneração, para
 * que a regeneração possa custear a rodada.
 */
function manterDominio(side: Side, c: CombatantState): { combatant: CombatantState; results: TurnResult[] } {
  const dominio = dominioAberto(c)
  if (!dominio) return { combatant: c, results: [] }

  if (c.currentEnergy < dominio.magnitude) {
    return {
      combatant: { ...c, statusEffects: c.statusEffects.filter((e) => e !== dominio) },
      results: [{ version: 1, side, kind: 'DOMAIN_FALL', skillId: null, skillName: dominio.sourceSkillName }],
    }
  }
  return { combatant: { ...c, currentEnergy: c.currentEnergy - dominio.magnitude }, results: [] }
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

/**
 * Cobra o preço por rodada de uma forma ativa.
 *
 * SÃO DOIS PREÇOS DE NATUREZA DIFERENTE, e por isso não compartilham campo.
 * Ficar sem ENERGIA faz a forma CAIR — é o Super Saiyan 3, que se sustenta
 * enquanto houver fôlego. Ficar sem VIDA mataria — é o custo dos Oito Portões
 * e do Mangekyō, que na obra cobram o corpo.
 *
 * O dreno de vida NÃO MATA. Ao chegar em 1 de HP a forma cai e o personagem
 * fica de pé, queimado. A alternativa — deixar a própria transformação matar
 * quem a usou — é fiel à obra e péssima de jogar: o jogador perderia a luta
 * por uma escolha feita cinco rodadas antes, sem nada na tela avisando. O
 * risco continua real, porque sair da forma em 1 de HP é perder do mesmo
 * jeito na rodada seguinte; só que aí é o adversário que decide, não a
 * aritmética.
 */
function applyDrain(c: CombatantState, transformations: Record<string, TransformationDef>): CombatantState {
  if (!c.activeTransformationId) return c
  const t = transformations[c.activeTransformationId]
  if (!t) return c

  const drenoHp = t.drainHpPerTurn ?? 0
  if (t.drainPerTurn <= 0 && drenoHp <= 0) return c

  // Sem energia para sustentar, a forma cai antes de cobrar qualquer vida.
  if (t.drainPerTurn > 0 && c.currentEnergy < t.drainPerTurn) return revertTransformation(c)

  const comEnergia =
    t.drainPerTurn > 0 ? { ...c, currentEnergy: c.currentEnergy - t.drainPerTurn } : c
  if (drenoHp <= 0) return comEnergia

  if (comEnergia.currentHp <= drenoHp) {
    return { ...revertTransformation(comEnergia), currentHp: 1 }
  }
  return { ...comEnergia, currentHp: comEnergia.currentHp - drenoHp }
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

/**
 * Tags em que duas habilidades podem se CHOCAR.
 *
 * O conjunto é pequeno e explícito de propósito. As tags do catálogo são
 * bagunçadas — misturam mecânica ('buff', 'stun') com tema, e há duplicatas
 * em duas línguas ('fire' e 'fogo', 'ice' e 'gelo'). Só entram aqui as em que
 * "duas forças se encontrando" faz sentido e que TODAS causam dano: feixe
 * contra feixe é o choque de Dragon Ball, lâmina contra lâmina é o de Bleach,
 * punho contra punho é qualquer luta. Hadō e cero entram porque no arco que
 * existe é o choque que de fato acontece — dois feiticeiros lançando o mesmo
 * tipo de magia um contra o outro.
 *
 * MEDIÇÃO HONESTA: contra a IA o choque quase nunca dispara, e as taxas de
 * vitória da história ficaram IDÊNTICAS às de antes dele. O motivo não é o
 * conjunto de tags — é que pickAiSkill escolhe sempre a de maior poder e
 * portanto nunca DECIDE contestar. Este é um mecanismo de escolha humana e de
 * PvP; ele só vai brilhar quando a IA souber jogar tempo, ou contra outro
 * jogador.
 */
export const TAGS_DE_CLASH = ['beam', 'espada', 'fisico', 'hado', 'cero'] as const

/** A tag em que estas duas habilidades se chocam, ou null se não há choque. */
export function tagDeClash(a: SkillDef | null, b: SkillDef | null): string | null {
  // Ataque básico não choca, e nem habilidade que não causa dano: não há força
  // a opor.
  if (!a || !b || a.power <= 0 || b.power <= 0) return null
  return TAGS_DE_CLASH.find((t) => a.tags.includes(t) && b.tags.includes(t)) ?? null
}

/** Quanto o vencedor do choque tem o próprio golpe amplificado. */
export const CLASH_BONUS_DO_VENCEDOR = 0.35

/**
 * Margem, em fração, dentro da qual o choque termina EMPATADO e os dois
 * golpes se anulam. Sem ela, uma diferença de um ponto de poder decidiria a
 * troca inteira, o que faria o choque parecer arbitrário em vez de disputado.
 */
export const CLASH_MARGEM_DE_EMPATE = 0.12

/**
 * Resolve o choque entre dois golpes da mesma natureza.
 *
 * A força de cada lado é o poder do golpe mais o bônus do atributo de escala —
 * a mesma conta que decide o dano —, com uma variação aleatória de até 15%
 * para que o choque não seja sempre previsível a partir da ficha.
 *
 * O perdedor tem o golpe ANULADO na rodada e o vencedor bate mais forte. É por
 * isso que levar um feixe para uma luta de feixes é aposta: ganhar troca uma
 * rodada por vantagem grande, perder troca por nada.
 */
export function resolverClash(
  atacante: CombatantState,
  defensor: CombatantState,
  aSkill: SkillDef,
  bSkill: SkillDef,
  rand: () => number
): { vencedor: Side | null } {
  const forca = (c: CombatantState, sk: SkillDef) =>
    (sk.power + scaledBonus(c, sk.scalingStat)) * (0.85 + rand() * 0.3)

  const fa = forca(atacante, aSkill)
  const fb = forca(defensor, bSkill)
  const total = fa + fb
  if (total <= 0) return { vencedor: null }
  if (Math.abs(fa - fb) / total < CLASH_MARGEM_DE_EMPATE) return { vencedor: null }
  return { vencedor: fa > fb ? 'PLAYER' : 'ENEMY' }
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
  const dominioJogador = manterDominio('PLAYER', player)
  player = dominioJogador.combatant
  turnResults.push(...dominioJogador.results)
  const dominioInimigo = manterDominio('ENEMY', enemy)
  enemy = dominioInimigo.combatant
  turnResults.push(...dominioInimigo.results)

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

  // 3. CHOQUE, antes da ordem por velocidade — ele é simultâneo por natureza:
  // os dois golpes partem juntos e se encontram no meio. Resolver na ordem de
  // iniciativa faria o mais rápido "acertar primeiro" e não haveria choque.
  let habilidadeDoJogador =
    input.playerAction.kind === 'ATTACK' && input.playerAction.skillId
      ? ctx.playerSkills[input.playerAction.skillId] ?? null
      : null
  let habilidadeDoInimigo = input.enemyAction.skillId ? ctx.enemySkills[input.enemyAction.skillId] ?? null : null

  const tagChoque =
    !isStunned(player) && !isStunned(enemy) ? tagDeClash(habilidadeDoJogador, habilidadeDoInimigo) : null

  if (tagChoque && habilidadeDoJogador && habilidadeDoInimigo) {
    const { vencedor } = resolverClash(player, enemy, habilidadeDoJogador, habilidadeDoInimigo, rand)
    turnResults.push({
      version: 1,
      side: vencedor ?? 'PLAYER',
      kind: 'CLASH',
      clashTag: tagChoque,
      skillId: null,
      skillName: vencedor === null ? 'Choque equilibrado' : 'Choque',
    })

    // O perdedor tem o golpe anulado; o vencedor bate mais forte. Empate anula
    // os dois — a rodada foi gasta na disputa.
    const amplificar = (sk: SkillDef): SkillDef => ({
      ...sk,
      power: Math.round(sk.power * (1 + CLASH_BONUS_DO_VENCEDOR)),
    })
    if (vencedor === 'PLAYER') {
      habilidadeDoJogador = amplificar(habilidadeDoJogador)
      habilidadeDoInimigo = null
    } else if (vencedor === 'ENEMY') {
      habilidadeDoInimigo = amplificar(habilidadeDoInimigo)
      habilidadeDoJogador = null
    } else {
      habilidadeDoJogador = null
      habilidadeDoInimigo = null
    }
  }

  // Um golpe anulado pelo choque não vira ataque básico: a rodada foi gasta na
  // disputa. Quem NÃO estava chocando segue normalmente.
  const jogadorAnulado = tagChoque !== null && habilidadeDoJogador === null
  const inimigoAnulado = tagChoque !== null && habilidadeDoInimigo === null

  // 3b. Resolve actions in effective-speed order (ties go to the player)
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
      if (jogadorAnulado) continue
      const skill = habilidadeDoJogador
      const hpBefore = player.currentHp
      const result = performSkillUse('PLAYER', player, enemy, skill, rand)
      player = result.attacker
      enemy = result.defender
      turnResults.push(result.turnResult, ...result.eventos)

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
      if (inimigoAnulado) continue
      const skill = habilidadeDoInimigo
      const result = performSkillUse('ENEMY', enemy, player, skill, rand)
      enemy = result.attacker
      player = result.defender
      turnResults.push(result.turnResult, ...result.eventos)

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
