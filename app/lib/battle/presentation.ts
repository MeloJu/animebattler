import type { EffectType, Stat } from './types'

export type EffectLike = { type: EffectType; stat?: Stat; magnitude: number }

const STAT_LABEL: Record<Stat, string> = { attack: 'ATQ', defense: 'DEF', speed: 'VEL' }
const EFFECT_ICON: Record<EffectType, string> = {
  BUFF: '↑',
  DEBUFF: '↓',
  DOT: '🔥',
  STUN: '😵',
  COUNTER: '🔄',
  SHIELD: '🛡️',
  HEAL: '💚',
  LIFESTEAL: '🩸',
}

export function describeEffect(e: EffectLike): string {
  switch (e.type) {
    case 'BUFF':
      return `${EFFECT_ICON.BUFF} ${e.stat ? STAT_LABEL[e.stat] : ''} +${e.magnitude}%`
    case 'DEBUFF':
      return `${EFFECT_ICON.DEBUFF} ${e.stat ? STAT_LABEL[e.stat] : ''} -${e.magnitude}%`
    case 'DOT':
      return `${EFFECT_ICON.DOT} ${e.magnitude}/rodada`
    case 'STUN':
      return `${EFFECT_ICON.STUN} Atordoa`
    case 'COUNTER':
      return `${EFFECT_ICON.COUNTER} Reflete ${e.magnitude}%`
    case 'SHIELD':
      return `${EFFECT_ICON.SHIELD} Escudo ${e.magnitude}`
    case 'HEAL':
      return `${EFFECT_ICON.HEAL} Cura ${e.magnitude}`
    case 'LIFESTEAL':
      return `${EFFECT_ICON.LIFESTEAL} Vampirismo ${e.magnitude}%`
  }
}
