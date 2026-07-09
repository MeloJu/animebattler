import { XP_PER_LEVEL } from './constants'

/** xp needed to go from `level` to `level + 1` is `level * XP_PER_LEVEL` */
export function applyExperience(
  level: number,
  experience: number,
  xpGained: number
): { level: number; experience: number; pointsGained: number } {
  let newLevel = level
  let newXp = experience + xpGained
  let pointsGained = 0
  while (newXp >= newLevel * XP_PER_LEVEL) {
    newXp -= newLevel * XP_PER_LEVEL
    newLevel += 1
    pointsGained += 1
  }
  return { level: newLevel, experience: newXp, pointsGained }
}
