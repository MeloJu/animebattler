import { prisma } from '@/app/lib/prisma'
import type { SkillDef, SkillEffect, TransformationDef } from './types'

function parseEffects(json: unknown): SkillEffect[] {
  return Array.isArray(json) ? (json as SkillEffect[]) : []
}

function hasBattleValue(skill: { power: number; effects: unknown }): boolean {
  return skill.power > 0 || parseEffects(skill.effects).length > 0
}

export function toSkillDef(skill: { id: string; name: string; power: number; energyCost: number; cooldown: number; effects: unknown }): SkillDef {
  return {
    id: skill.id,
    name: skill.name,
    power: skill.power,
    energyCost: skill.energyCost,
    cooldown: skill.cooldown,
    effects: parseEffects(skill.effects),
  }
}

export function toTransformationDef(t: {
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
  triggerType: string
  triggerPayload: unknown
}): TransformationDef {
  return {
    id: t.id,
    name: t.name,
    levelRequirement: t.levelRequirement,
    energyModifier: t.energyModifier,
    attackModifier: t.attackModifier,
    defenseModifier: t.defenseModifier,
    speedModifier: t.speedModifier,
    flatHpBonus: t.flatHpBonus,
    flatAttackBonus: t.flatAttackBonus,
    flatDefenseBonus: t.flatDefenseBonus,
    flatSpeedBonus: t.flatSpeedBonus,
    drainPerTurn: t.drainPerTurn,
    triggerType: t.triggerType as TransformationDef['triggerType'],
    triggerPayload: t.triggerPayload,
  }
}

export async function getTreeBonus(userCharacterId: string) {
  const unlocks = await prisma.userSkillUnlock.findMany({ where: { userCharacterId }, include: { node: true } })
  return unlocks.reduce(
    (acc, u) => ({
      hp: acc.hp + u.node.flatHpBonus,
      attack: acc.attack + u.node.flatAttackBonus,
      defense: acc.defense + u.node.flatDefenseBonus,
      speed: acc.speed + u.node.flatSpeedBonus,
    }),
    { hp: 0, attack: 0, defense: 0, speed: 0 }
  )
}

export async function getEligiblePlayerSkills(userCharacterId: string, characterId: string, level: number): Promise<Record<string, SkillDef>> {
  const [levelSkills, treeUnlocks] = await Promise.all([
    prisma.characterSkill.findMany({ where: { characterId, requiredLevel: { lte: level } }, include: { skill: true } }),
    prisma.userSkillUnlock.findMany({ where: { userCharacterId }, include: { node: { include: { skill: true } } } }),
  ])
  const skills: Record<string, SkillDef> = {}
  for (const cs of levelSkills) {
    if (hasBattleValue(cs.skill)) skills[cs.skill.id] = toSkillDef(cs.skill)
  }
  for (const unlock of treeUnlocks) {
    const skill = unlock.node.skill
    if (skill && hasBattleValue(skill)) skills[skill.id] = toSkillDef(skill)
  }
  return skills
}

export async function getEnemySkills(characterId: string): Promise<Record<string, SkillDef>> {
  const rows = await prisma.characterSkill.findMany({ where: { characterId }, include: { skill: true } })
  const skills: Record<string, SkillDef> = {}
  for (const cs of rows) {
    if (hasBattleValue(cs.skill)) skills[cs.skill.id] = toSkillDef(cs.skill)
  }
  return skills
}

export async function getPlayerTransformations(characterId: string, level: number): Promise<Record<string, TransformationDef>> {
  const rows = await prisma.transformation.findMany({ where: { characterId, levelRequirement: { lte: level } } })
  const result: Record<string, TransformationDef> = {}
  for (const t of rows) result[t.id] = toTransformationDef(t)
  return result
}

const BATTLE_ERROR_MESSAGES: Record<string, string> = {
  not_found: 'Batalha não encontrada.',
  invalid_skill: 'Essa habilidade não está disponível pro seu personagem.',
  illegal_move: 'Você não pode usar essa habilidade agora (energia insuficiente ou em cooldown).',
  invalid_transformation: 'Essa transformação não está disponível pro seu personagem.',
  already_transformed: 'Você já está transformado nessa batalha.',
  conflict: 'Essa rodada já foi resolvida em outra aba — a tela foi atualizada.',
}

export function battleErrorMessage(code: string | undefined): string | null {
  if (!code) return null
  return BATTLE_ERROR_MESSAGES[code] ?? 'Ocorreu um erro inesperado.'
}
