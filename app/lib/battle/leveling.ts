import { STORY_REPLAY_XP_RATIO, XP_ON_LOSS, XP_ON_WIN, XP_PER_LEVEL } from './constants'
import type { Outcome } from './types'

/**
 * Quanto XP a batalha paga.
 *
 * Um estágio de história dita o próprio valor: `xpReward` é o número que a
 * tela do estágio mostra ao jogador, então vencer tem que pagar exatamente
 * aquilo. Derrota e empate continuam pagando a tabela genérica — o prêmio do
 * estágio é recompensa de conclusão, não de participação.
 *
 * REJOGAR paga metade. Antes pagava o valor cheio, sem limite: rejogar o
 * estágio do Gin dava 380 de XP por partida, o que fazia repetir o mesmo
 * estágio ser de longe o caminho mais rápido do jogo — e tornava sem sentido
 * qualquer teto diário em outro modo. Meia recompensa mantém o arco como
 * motor de crescimento e ainda premia avançar em vez de moer o mesmo chefe.
 * Espelha o que as moedas já faziam (só pagam na primeira conclusão).
 *
 * Fora da história, vale a tabela padrão vezes o multiplicador do inimigo
 * (raids usam o `tier` do monstro; batalha normal usa 1).
 */
export function battleXpGained(
  outcome: Outcome,
  xpMultiplier: number,
  storyXpReward: number | null,
  isFirstClear = true
): number {
  if (outcome === 'PLAYER_WIN' && storyXpReward !== null) {
    return isFirstClear ? storyXpReward : Math.round(storyXpReward * STORY_REPLAY_XP_RATIO)
  }
  const base = outcome === 'PLAYER_WIN' ? XP_ON_WIN : outcome === 'ENEMY_WIN' ? XP_ON_LOSS : (XP_ON_WIN + XP_ON_LOSS) / 2
  return Math.round(base * xpMultiplier)
}

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
