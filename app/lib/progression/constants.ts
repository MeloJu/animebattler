export const BASE_LOADOUT_SLOTS = 4
export const MAX_LOADOUT_SLOTS = 6
export const LEVELS_PER_LOADOUT_SLOT = 3

/** 4 slots at level 1, +1 every LEVELS_PER_LOADOUT_SLOT levels, capped at MAX_LOADOUT_SLOTS. */
export function getLoadoutSlotCount(level: number): number {
  return Math.min(MAX_LOADOUT_SLOTS, BASE_LOADOUT_SLOTS + Math.floor((level - 1) / LEVELS_PER_LOADOUT_SLOT))
}
