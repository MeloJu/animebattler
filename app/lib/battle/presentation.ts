import { resolveErrorMessage } from '@/app/lib/error-messages'
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
  DOMAIN: '🌌',
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
    // A magnitude do domínio é a manutenção por rodada, não dano: dizer só o
    // número seria enganoso, então o texto diz as duas coisas que importam —
    // que o golpe passa por defesa e quanto custa manter aberto.
    case 'DOMAIN':
      return `${EFFECT_ICON.DOMAIN} Domínio · acerto garantido · ${e.magnitude} EN/rodada`
  }
}

const BATTLE_ERROR_MESSAGES: Record<string, string> = {
  not_found: 'Batalha não encontrada.',
  invalid_skill: 'Essa habilidade não está disponível pro seu personagem.',
  illegal_move: 'Você não pode usar essa habilidade agora (energia insuficiente ou em cooldown).',
  invalid_transformation: 'Essa transformação não está disponível pro seu personagem.',
  already_transformed: 'Você já está transformado nessa batalha.',
  conflict: 'Essa rodada já foi resolvida em outra aba — a tela foi atualizada.',
  insufficient_energy: 'Energia insuficiente para liberar essa forma.',
}

export function battleErrorMessage(code: string | undefined): string | null {
  return resolveErrorMessage(BATTLE_ERROR_MESSAGES, code, 'Ocorreu um erro inesperado.')
}
