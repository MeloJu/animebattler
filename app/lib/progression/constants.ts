export const BASE_LOADOUT_SLOTS = 4

/**
 * Teto de slots do loadout.
 *
 * Era 6, alcançado no nível 7 — escolhido quando a história inteira pagava
 * 1880 XP e terminava o jogador no nível 7, ou seja, o teto batia exatamente
 * no fim do conteúdo e nunca mais crescia. Com a história recurvada para 9100
 * XP o arco termina no nível 14, então o teto podia subir junto.
 *
 * 8 é escolha de variedade de build, não de poder: um personagem tem hoje 16
 * a 18 habilidades disponíveis e só podia levar 6, o que deixava a maior parte
 * do arsenal decorativa. Com a escala por atributo, levar mais opções passou a
 * significar escolher entre linhas de dano diferentes (assinatura escalando do
 * arquétipo, escada escalando do tema) em vez de só levar as de maior poder.
 *
 * Não deixa o jogador mais forte de graça: energia e cooldown continuam sendo
 * o limite real dentro da batalha.
 */
export const MAX_LOADOUT_SLOTS = 8

export const LEVELS_PER_LOADOUT_SLOT = 3

/** 4 slots at level 1, +1 every LEVELS_PER_LOADOUT_SLOT levels, capped at MAX_LOADOUT_SLOTS. */
export function getLoadoutSlotCount(level: number): number {
  return Math.min(MAX_LOADOUT_SLOTS, BASE_LOADOUT_SLOTS + Math.floor((level - 1) / LEVELS_PER_LOADOUT_SLOT))
}
