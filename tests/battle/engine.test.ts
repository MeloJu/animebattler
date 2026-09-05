import { describe, it, expect } from 'vitest'
import {
  computeBaseStats,
  createInitialState,
  scaleForLevel,
  hasBattleValue,
  isLegalMove,
  getCombatStat,
  isStunned,
  applyTransformation,
  resolveRound,
  sumStatBonuses,
} from '@/app/lib/battle/engine'
import type {
  BaseStats,
  CombatantState,
  SkillDef,
  SkillEffect,
  StatusEffectInstance,
  TransformationDef,
} from '@/app/lib/battle/types'

// rand() só é consultado pra decidir crítico. Fixar o valor torna o dano
// determinístico: 1 nunca critica (chance máxima é 0.35), 0 sempre critica.
const NUNCA_CRITA = () => 1
const SEMPRE_CRITA = () => 0

const stats = (over: Partial<BaseStats> = {}): BaseStats => ({
  hp: 100,
  attack: 20,
  defense: 10,
  speed: 15,
  energy: 100,
  ...over,
})

function combatant(over: Partial<CombatantState> = {}): CombatantState {
  const base = createInitialState(stats(), stats()).player
  return { ...base, ...over }
}

const efeito = (over: Partial<StatusEffectInstance> = {}): StatusEffectInstance => ({
  id: 'fx-1',
  type: 'BUFF',
  magnitude: 10,
  remainingRounds: 2,
  sourceSkillName: 'Teste',
  ...over,
})

const skill = (over: Partial<SkillDef> = {}): SkillDef => ({
  id: 'sk-1',
  name: 'Golpe',
  power: 30,
  energyCost: 10,
  cooldown: 2,
  effects: [],
  ...over,
})

const transformacao = (over: Partial<TransformationDef> = {}): TransformationDef => ({
  id: 'tr-1',
  name: 'Modo Turbo',
  levelRequirement: 1,
  energyModifier: 0,
  attackModifier: 0,
  defenseModifier: 0,
  speedModifier: 0,
  flatHpBonus: 0,
  flatAttackBonus: 0,
  flatDefenseBonus: 0,
  flatSpeedBonus: 0,
  drainPerTurn: 0,
  triggerType: 'MANUAL',
  triggerPayload: null,
  ...over,
})

/** Contexto mínimo pra resolveRound, sem skills nem transformações. */
const ctxVazio = () => ({ playerSkills: {}, enemySkills: {}, playerTransformations: {} })
const ataqueBasico = { playerAction: { kind: 'ATTACK' as const, skillId: null }, enemyAction: { skillId: null } }

describe('computeBaseStats', () => {
  it('soma os bônus da skill tree aos stats do personagem', () => {
    const r = computeBaseStats(
      { hp: 100, attack: 20, defense: 10, speed: 15, energy: 80 },
      { hp: 25, attack: 5, defense: 3, speed: 2 }
    )
    expect(r).toEqual({ hp: 125, attack: 25, defense: 13, speed: 17, energy: 80 })
  })

  it('não altera energia — a skill tree não dá bônus de energia', () => {
    const r = computeBaseStats(
      { hp: 100, attack: 20, defense: 10, speed: 15, energy: 80 },
      { hp: 0, attack: 0, defense: 0, speed: 0 }
    )
    expect(r.energy).toBe(80)
  })
})

describe('createInitialState', () => {
  it('começa com HP e energia cheios, sem transformação nem efeitos', () => {
    const s = createInitialState(stats(), stats({ hp: 200 }))
    expect(s.player.currentHp).toBe(100)
    expect(s.player.maxHp).toBe(100)
    expect(s.player.currentEnergy).toBe(100)
    expect(s.player.activeTransformationId).toBeNull()
    expect(s.player.statusEffects).toEqual([])
    expect(s.enemy.maxHp).toBe(200)
    expect(s.outcome).toBeNull()
  })

  it('guarda os valores base separados dos atuais (pra reverter transformação)', () => {
    const s = createInitialState(stats({ attack: 42 }), stats())
    expect(s.player.attack).toBe(42)
    expect(s.player.baseAttack).toBe(42)
  })
})

describe('scaleForLevel', () => {
  it('não altera nada no nível 1', () => {
    const base = { hp: 100, attack: 20, defense: 10, speed: 15, energy: 50 }
    expect(scaleForLevel(base, 1)).toEqual(base)
  })

  it('escala 12% por nível acima de 1 (LEVEL_SCALING)', () => {
    // nível 5 => multiplicador 1 + 4*0.12 = 1.48
    const r = scaleForLevel({ hp: 100, attack: 20, defense: 10, speed: 15, energy: 50 }, 5)
    expect(r).toEqual({ hp: 148, attack: 30, defense: 15, speed: 22, energy: 74 })
  })

  it('preserva campos extras do objeto original', () => {
    const r = scaleForLevel({ hp: 10, attack: 1, defense: 1, speed: 1, energy: 1, nome: 'Hollow' }, 3)
    expect(r.nome).toBe('Hollow')
  })
})

describe('hasBattleValue', () => {
  it('aceita skill que causa dano', () => {
    expect(hasBattleValue({ power: 10, effects: [] })).toBe(true)
  })

  it('aceita skill sem dano mas com efeitos (buff/cura puros)', () => {
    expect(hasBattleValue({ power: 0, effects: [{ type: 'HEAL' }] })).toBe(true)
  })

  it('rejeita linha inerte: sem dano e sem efeito', () => {
    expect(hasBattleValue({ power: 0, effects: [] })).toBe(false)
  })

  it('rejeita quando effects não é array (dado solto vindo do banco)', () => {
    expect(hasBattleValue({ power: 0, effects: null })).toBe(false)
    expect(hasBattleValue({ power: 0, effects: 'nada' })).toBe(false)
  })
})

describe('isLegalMove', () => {
  it('ataque básico (skill null) é sempre legal, mesmo sem energia', () => {
    expect(isLegalMove(combatant({ currentEnergy: 0 }), null)).toBe(true)
  })

  it('rejeita skill em cooldown', () => {
    const c = combatant({ cooldowns: { 'sk-1': 2 } })
    expect(isLegalMove(c, skill())).toBe(false)
  })

  it('rejeita skill sem energia suficiente', () => {
    expect(isLegalMove(combatant({ currentEnergy: 9 }), skill({ energyCost: 10 }))).toBe(false)
  })

  it('aceita quando a energia é exatamente o custo', () => {
    expect(isLegalMove(combatant({ currentEnergy: 10 }), skill({ energyCost: 10 }))).toBe(true)
  })

  it('cooldown zerado não bloqueia', () => {
    expect(isLegalMove(combatant({ cooldowns: { 'sk-1': 0 } }), skill())).toBe(true)
  })
})

describe('getCombatStat', () => {
  it('devolve o valor base quando não há efeitos', () => {
    expect(getCombatStat(combatant({ attack: 20 }), 'attack')).toBe(20)
  })

  it('aplica BUFF como porcentagem', () => {
    const c = combatant({ attack: 20, statusEffects: [efeito({ type: 'BUFF', stat: 'attack', magnitude: 50 })] })
    expect(getCombatStat(c, 'attack')).toBe(30)
  })

  it('aplica DEBUFF como porcentagem negativa', () => {
    const c = combatant({ defense: 20, statusEffects: [efeito({ type: 'DEBUFF', stat: 'defense', magnitude: 25 })] })
    expect(getCombatStat(c, 'defense')).toBe(15)
  })

  it('soma buff e debuff no mesmo stat', () => {
    const c = combatant({
      attack: 100,
      statusEffects: [
        efeito({ id: 'a', type: 'BUFF', stat: 'attack', magnitude: 30 }),
        efeito({ id: 'b', type: 'DEBUFF', stat: 'attack', magnitude: 10 }),
      ],
    })
    expect(getCombatStat(c, 'attack')).toBe(120)
  })

  it('ignora efeitos de outro stat', () => {
    const c = combatant({ attack: 20, statusEffects: [efeito({ type: 'BUFF', stat: 'speed', magnitude: 100 })] })
    expect(getCombatStat(c, 'attack')).toBe(20)
  })

  it('nunca devolve valor negativo, mesmo com debuff acima de 100%', () => {
    const c = combatant({ attack: 20, statusEffects: [efeito({ type: 'DEBUFF', stat: 'attack', magnitude: 150 })] })
    expect(getCombatStat(c, 'attack')).toBe(0)
  })
})

describe('isStunned', () => {
  it('detecta stun ativo', () => {
    expect(isStunned(combatant({ statusEffects: [efeito({ type: 'STUN', remainingRounds: 1 })] }))).toBe(true)
  })

  it('stun expirado não conta', () => {
    expect(isStunned(combatant({ statusEffects: [efeito({ type: 'STUN', remainingRounds: 0 })] }))).toBe(false)
  })

  it('sem efeitos, não está atordoado', () => {
    expect(isStunned(combatant())).toBe(false)
  })
})

describe('applyTransformation', () => {
  it('aplica bônus planos e multiplicadores sobre os stats BASE', () => {
    const c = combatant({ attack: 20, baseAttack: 20 })
    const t = transformacao({ flatAttackBonus: 10, attackModifier: 0.5 })
    // (20 + 10) * 1.5 = 45
    expect(applyTransformation(c, t).attack).toBe(45)
  })

  it('aumenta HP máximo e atual pelo bônus plano', () => {
    const c = combatant({ currentHp: 50, maxHp: 100, baseMaxHp: 100 })
    const r = applyTransformation(c, transformacao({ flatHpBonus: 40 }))
    expect(r.maxHp).toBe(140)
    expect(r.currentHp).toBe(90)
  })

  it('não deixa o HP atual passar do novo máximo', () => {
    const c = combatant({ currentHp: 100, maxHp: 100, baseMaxHp: 100 })
    const r = applyTransformation(c, transformacao({ flatHpBonus: 20 }))
    expect(r.currentHp).toBeLessThanOrEqual(r.maxHp)
    expect(r.currentHp).toBe(120)
  })

  it('reduz energia atual se o novo máximo for menor', () => {
    const c = combatant({ currentEnergy: 100, maxEnergy: 100, baseMaxEnergy: 100 })
    const r = applyTransformation(c, transformacao({ energyModifier: -0.5 }))
    expect(r.maxEnergy).toBe(50)
    expect(r.currentEnergy).toBe(50)
  })

  it('registra qual transformação está ativa', () => {
    const r = applyTransformation(combatant(), transformacao({ id: 'ssj' }))
    expect(r.activeTransformationId).toBe('ssj')
  })

  it('recalcula a partir da base, então transformar duas vezes não acumula', () => {
    const c = combatant({ attack: 20, baseAttack: 20 })
    const t = transformacao({ attackModifier: 1 })
    expect(applyTransformation(applyTransformation(c, t), t).attack).toBe(40)
  })
})

describe('resolveRound — dano e energia', () => {
  it('ataque básico tira HP do inimigo', () => {
    const s = createInitialState(stats(), stats())
    const { state, turnResults } = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(state.enemy.currentHp).toBeLessThan(100)
    expect(turnResults.some((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')).toBe(true)
  })

  it('crítico multiplica o dano por 1.5', () => {
    const s = createInitialState(stats(), stats())
    const normal = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    const critico = resolveRound(s, ataqueBasico, ctxVazio(), SEMPRE_CRITA)
    const dNormal = normal.turnResults.find((t) => t.side === 'PLAYER')!.damage!
    const dCritico = critico.turnResults.find((t) => t.side === 'PLAYER')!.damage!
    expect(dCritico).toBe(Math.round(dNormal * 1.5))
    expect(critico.turnResults.find((t) => t.side === 'PLAYER')!.isCrit).toBe(true)
  })

  it('defesa alta reduz o dano recebido', () => {
    const fraco = createInitialState(stats(), stats({ defense: 0 }))
    const forte = createInitialState(stats(), stats({ defense: 200 }))
    const dFraco = resolveRound(fraco, ataqueBasico, ctxVazio(), NUNCA_CRITA).turnResults.find((t) => t.side === 'PLAYER')!.damage!
    const dForte = resolveRound(forte, ataqueBasico, ctxVazio(), NUNCA_CRITA).turnResults.find((t) => t.side === 'PLAYER')!.damage!
    expect(dForte).toBeLessThan(dFraco)
  })

  it('dano mínimo é 1, mesmo com defesa absurda', () => {
    const s = createInitialState(stats({ attack: 1 }), stats({ defense: 100000 }))
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.turnResults.find((t) => t.side === 'PLAYER')!.damage).toBeGreaterThanOrEqual(1)
  })

  it('usar skill consome energia e coloca em cooldown', () => {
    const s = createInitialState(stats(), stats())
    const sk = skill({ energyCost: 25, cooldown: 3 })
    const r = resolveRound(
      s,
      { playerAction: { kind: 'ATTACK', skillId: 'sk-1' }, enemyAction: { skillId: null } },
      { ...ctxVazio(), playerSkills: { 'sk-1': sk } },
      NUNCA_CRITA
    )
    // energia regenera 8% (8) no início da rodada e depois paga 25
    expect(r.state.player.currentEnergy).toBe(100 - 25)
    expect(r.state.player.cooldowns['sk-1']).toBe(3)
  })

  it('energia regenera 8% do máximo no início da rodada', () => {
    const s = createInitialState(stats(), stats())
    s.player.currentEnergy = 50
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.player.currentEnergy).toBe(58)
  })

  it('energia regenerada não passa do máximo', () => {
    const s = createInitialState(stats(), stats())
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.player.currentEnergy).toBe(100)
  })
})

describe('resolveRound — efeitos de status', () => {
  it('SHIELD absorve o dano antes do HP', () => {
    const s = createInitialState(stats(), stats())
    s.enemy.statusEffects = [efeito({ type: 'SHIELD', magnitude: 1000, remainingRounds: 5 })]
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.enemy.currentHp).toBe(100)
  })

  it('COUNTER anula o ataque e reflete parte do dano no atacante', () => {
    const s = createInitialState(stats(), stats())
    s.enemy.statusEffects = [efeito({ type: 'COUNTER', magnitude: 50, remainingRounds: 5 })]
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    const golpe = r.turnResults.find((t) => t.side === 'PLAYER' && t.kind === 'ATTACK')!
    expect(golpe.countered).toBe(true)
    expect(golpe.damage).toBe(0)
    expect(golpe.reflectedDamage).toBeGreaterThan(0)
    expect(r.state.player.currentHp).toBeLessThan(100)
  })

  it('COUNTER é consumido depois de refletir uma vez', () => {
    const s = createInitialState(stats(), stats())
    s.enemy.statusEffects = [efeito({ type: 'COUNTER', magnitude: 50, remainingRounds: 5 })]
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.enemy.statusEffects.filter((e) => e.type === 'COUNTER')).toHaveLength(0)
  })

  it('DOT tira HP no início da rodada e gera um resultado próprio', () => {
    const s = createInitialState(stats(), stats())
    s.enemy.statusEffects = [efeito({ type: 'DOT', magnitude: 15, remainingRounds: 3, sourceSkillName: 'Veneno' })]
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    const tick = r.turnResults.find((t) => t.kind === 'DOT_TICK')
    expect(tick).toBeDefined()
    expect(tick!.damage).toBe(15)
    expect(tick!.skillName).toBe('Veneno')
  })

  it('quem está atordoado perde o turno', () => {
    const s = createInitialState(stats(), stats())
    s.enemy.statusEffects = [efeito({ type: 'STUN', remainingRounds: 3 })]
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.turnResults.some((t) => t.side === 'ENEMY' && t.kind === 'STUNNED')).toBe(true)
    expect(r.state.player.currentHp).toBe(100) // inimigo não atacou
  })

  it('efeitos perdem uma rodada de duração e somem ao zerar', () => {
    const s = createInitialState(stats(), stats())
    s.enemy.statusEffects = [efeito({ type: 'BUFF', stat: 'attack', magnitude: 10, remainingRounds: 1 })]
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.enemy.statusEffects).toHaveLength(0)
  })

  it('HEAL não cura acima do HP máximo', () => {
    const s = createInitialState(stats(), stats())
    s.player.currentHp = 95
    const cura: SkillEffect = { type: 'HEAL', target: 'SELF', magnitude: 999 }
    const r = resolveRound(
      s,
      { playerAction: { kind: 'ATTACK', skillId: 'cura' }, enemyAction: { skillId: null } },
      { ...ctxVazio(), playerSkills: { cura: skill({ id: 'cura', power: 0, effects: [cura] }) } },
      NUNCA_CRITA
    )
    expect(r.state.player.currentHp).toBeLessThanOrEqual(100)
  })

  it('LIFESTEAL cura o atacante em % do dano causado', () => {
    const s = createInitialState(stats(), stats())
    s.player.currentHp = 50
    const roubo: SkillEffect = { type: 'LIFESTEAL', target: 'SELF', magnitude: 100 }
    const r = resolveRound(
      s,
      { playerAction: { kind: 'ATTACK', skillId: 'vamp' }, enemyAction: { skillId: null } },
      { ...ctxVazio(), playerSkills: { vamp: skill({ id: 'vamp', power: 30, effects: [roubo] }) } },
      NUNCA_CRITA
    )
    expect(r.state.player.currentHp).toBeGreaterThan(50 - 30)
  })
})

describe('resolveRound — ordem, transformação e desfecho', () => {
  it('quem tem mais velocidade age primeiro', () => {
    const s = createInitialState(stats({ speed: 1 }), stats({ speed: 100 }))
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    const ataques = r.turnResults.filter((t) => t.kind === 'ATTACK')
    expect(ataques[0].side).toBe('ENEMY')
  })

  it('empate de velocidade favorece o jogador', () => {
    const s = createInitialState(stats({ speed: 10 }), stats({ speed: 10 }))
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.turnResults.filter((t) => t.kind === 'ATTACK')[0].side).toBe('PLAYER')
  })

  it('ação TRANSFORM aplica a transformação e não ataca', () => {
    const s = createInitialState(stats(), stats())
    const t = transformacao({ id: 'ssj', attackModifier: 1 })
    const r = resolveRound(
      s,
      { playerAction: { kind: 'TRANSFORM', transformationId: 'ssj' }, enemyAction: { skillId: null } },
      { ...ctxVazio(), playerTransformations: { ssj: t } },
      NUNCA_CRITA
    )
    expect(r.state.player.activeTransformationId).toBe('ssj')
    expect(r.turnResults.some((x) => x.kind === 'TRANSFORM')).toBe(true)
    expect(r.turnResults.some((x) => x.side === 'PLAYER' && x.kind === 'ATTACK')).toBe(false)
  })

  it('transformação com LOW_HP dispara sozinha quando o HP está baixo', () => {
    const s = createInitialState(stats(), stats())
    s.player.currentHp = 20 // 20% <= 30% padrão
    const t = transformacao({ id: 'rage', triggerType: 'LOW_HP', triggerPayload: { threshold: 0.3 } })
    const r = resolveRound(s, ataqueBasico, { ...ctxVazio(), playerTransformations: { rage: t } }, NUNCA_CRITA)
    expect(r.state.player.activeTransformationId).toBe('rage')
  })

  it('transformação com drain reverte quando falta energia pra sustentar', () => {
    const s = createInitialState(stats(), stats())
    s.player.currentEnergy = 0
    s.player.activeTransformationId = 'caro'
    const t = transformacao({ id: 'caro', drainPerTurn: 50, attackModifier: 1 })
    const r = resolveRound(s, ataqueBasico, { ...ctxVazio(), playerTransformations: { caro: t } }, NUNCA_CRITA)
    expect(r.state.player.activeTransformationId).toBeNull()
    expect(r.state.player.attack).toBe(r.state.player.baseAttack)
  })

  it('zerar o HP do inimigo resulta em PLAYER_WIN', () => {
    const s = createInitialState(stats({ attack: 500 }), stats({ hp: 1, defense: 0 }))
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.outcome).toBe('PLAYER_WIN')
  })

  it('HP nunca fica negativo', () => {
    const s = createInitialState(stats({ attack: 9999 }), stats({ hp: 1, defense: 0 }))
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.enemy.currentHp).toBe(0)
  })

  it('batalha já encerrada não é sobrescrita por uma rodada sem morte', () => {
    const s = createInitialState(stats(), stats())
    s.outcome = 'PLAYER_WIN'
    const r = resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(r.state.outcome).toBe('PLAYER_WIN')
  })

  it('não muta o estado recebido (pureza)', () => {
    const s = createInitialState(stats(), stats())
    const copia = structuredClone(s)
    resolveRound(s, ataqueBasico, ctxVazio(), NUNCA_CRITA)
    expect(s).toEqual(copia)
  })
})

describe('sumStatBonuses', () => {
  it('sem fontes, devolve tudo zerado', () => {
    expect(sumStatBonuses()).toEqual({ hp: 0, attack: 0, defense: 0, speed: 0 })
  })

  it('soma árvore de skills e equipamento campo a campo', () => {
    const arvore = { hp: 10, attack: 2, defense: 1, speed: 0 }
    const equipamento = { hp: 8, attack: 0, defense: 3, speed: 5 }
    expect(sumStatBonuses(arvore, equipamento)).toEqual({ hp: 18, attack: 2, defense: 4, speed: 5 })
  })

  it('bônus negativo (ex: Fragmento de Máscara Hollow) subtrai', () => {
    expect(sumStatBonuses({ hp: 20, attack: 0, defense: 0, speed: 0 }, { hp: -10, attack: 12, defense: 0, speed: 0 })).toEqual({
      hp: 10,
      attack: 12,
      defense: 0,
      speed: 0,
    })
  })

  it('aceita mais de duas fontes', () => {
    const um = { hp: 1, attack: 1, defense: 1, speed: 1 }
    expect(sumStatBonuses(um, um, um)).toEqual({ hp: 3, attack: 3, defense: 3, speed: 3 })
  })
})
