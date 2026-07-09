import { isLegalMove } from './engine'
import type { CombatantState, SkillDef } from './types'

const LOW_HP_HEAL_THRESHOLD = 0.4

/**
 * Priority AI, not a full decision tree:
 * 1. Below 40% HP and a HEAL skill is available -> use it.
 * 2. Highest-power damage skill available -> use it (previous greedy behavior).
 * 3. No damage skill available (cooldown/energy), but a support skill is -> use it,
 *    so buffs/debuffs/shields/counters actually see play instead of always
 *    losing out to Basic Attack.
 * 4. Otherwise, Basic Attack (null).
 */
export function pickAiSkill(self: CombatantState, availableSkills: SkillDef[]): string | null {
  const legal = availableSkills.filter((s) => isLegalMove(self, s))
  if (legal.length === 0) return null

  const hpRatio = self.maxHp > 0 ? self.currentHp / self.maxHp : 0
  if (hpRatio < LOW_HP_HEAL_THRESHOLD) {
    const heal = legal.find((s) => s.effects.some((e) => e.type === 'HEAL'))
    if (heal) return heal.id
  }

  const damageSkills = legal.filter((s) => s.power > 0).sort((a, b) => b.power - a.power || a.energyCost - b.energyCost)
  if (damageSkills.length > 0) return damageSkills[0].id

  const supportSkills = legal.filter((s) => s.power === 0)
  if (supportSkills.length > 0) return supportSkills[0].id

  return null
}
