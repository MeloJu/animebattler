import { prisma } from '@/app/lib/prisma'
import { bonusDeAtributos } from './atributos'
import { SEM_BONUS } from '@/app/lib/battle/engine'
import type { StatBonus } from '@/app/lib/battle/types'

// Duplicated identically across battle/ai, battle/raid, story/actions and
// status before this: the user's selected character with its catalog
// character joined in.
export async function getSelectedCharacter(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { selectedCharacter: { include: { character: true } } },
  })
  return user?.selectedCharacter ?? null
}

// dashboard's own variant: same join, plus the user's id/name for the
// page header.
export async function getDashboardUser(userId: string) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, selectedCharacter: { include: { character: true } } },
  })
}

/** app/select's roster of created characters to choose from. */
export async function getUserCharacters(userId: string) {
  return prisma.userCharacter.findMany({ where: { userId }, include: { character: true } })
}

/** The full skill tree for a character, tier-ordered, for app/status. */
export async function getSkillTree(characterId: string) {
  return prisma.skillTreeNode.findMany({
    where: { characterId },
    include: { skill: true, prerequisites: true },
    orderBy: { tier: 'asc' },
  })
}

/** Which of this UserCharacter's tree nodes are already unlocked. */
export async function getUnlockedNodeIds(userCharacterId: string): Promise<Set<string>> {
  const rows = await prisma.userSkillUnlock.findMany({ where: { userCharacterId }, select: { nodeId: true } })
  return new Set(rows.map((r) => r.nodeId))
}

/** This UserCharacter's current loadout, one row per occupied slot. */
export async function getEquippedSkillRows(userCharacterId: string) {
  return prisma.userCharacterEquippedSkill.findMany({ where: { userCharacterId }, include: { skill: true } })
}

/**
 * Bônus vindo dos pontos de atributo gastos neste personagem.
 *
 * Busca por id em vez de receber o objeto para que quem monta uma batalha não
 * precise carregar as seis colunas de alocação — o mesmo caminho que já vale
 * para árvore de habilidade e equipamento.
 */
export async function getBonusDeAtributos(userCharacterId: string): Promise<StatBonus> {
  const uc = await prisma.userCharacter.findUnique({
    where: { id: userCharacterId },
    select: {
      allocHp: true,
      allocAttack: true,
      allocDefense: true,
      allocSpeed: true,
      allocEnergy: true,
      allocStamina: true,
      allocAccuracy: true,
      allocAgility: true,
      allocIntelligence: true,
    },
  })
  return uc ? bonusDeAtributos(uc) : SEM_BONUS
}
