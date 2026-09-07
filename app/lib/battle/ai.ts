import { isLegalMove } from './engine'
import type { CombatantState, SkillDef } from './types'

const LOW_HP_HEAL_THRESHOLD = 0.4

/**
 * Escolhe um loadout padrão a partir das habilidades disponíveis.
 *
 * Usada pelos DOIS lados: monta o arsenal do inimigo e preenche os slots
 * vazios do jogador. Ter uma regra só é o ponto — enquanto eram duas, cada
 * lado errava de um jeito diferente.
 *
 * POR QUE EXISTE, LADO DO INIMIGO: até aqui ele entrava em batalha com TODAS as
 * habilidades do personagem, sem filtro de nível e sem teto de quantidade,
 * enquanto o jogador só leva o que cabe nos slots do loadout — 4 no começo do
 * jogo. Um Izuru Kira de nível 2 chegava com o arsenal inteiro que ele teria
 * algum dia, kidō de alto nível incluído.
 *
 * Isso também explica a queixa de que "a IA não tem cooldown". Ela tem: o
 * cooldown decrementa dos dois lados a cada rodada. O que acontecia é que,
 * com vinte e poucas habilidades, sempre sobrava outra grande fora de
 * cooldown — três kidō pesados seguidos eram três kidō DIFERENTES.
 *
 * A escolha imita o que um jogador faria: os golpes mais fortes que couberem,
 * mas garantindo UM barato. Sem o barato, o turno seguinte ao golpe grande é
 * ataque básico — o mesmo critério que já tinha sido medido para os kits de
 * assinatura dos personagens jogáveis.
 *
 * POR QUE EXISTE, LADO DO JOGADOR: o preenchimento automático usava
 * `Object.keys(eligible)`, que é a ordem em que o banco devolveu as linhas, e
 * pegava as primeiras. Ou seja, o jogador começava com quatro habilidades
 * QUAISQUER — o Galick Gun do Vegeta podia ficar de fora enquanto um buff
 * entrava. Ele sempre pôde trocar à mão, mas o padrão não devia ser sorteio.
 *
 * É determinístico de propósito: o estado da batalha é gravado como snapshot
 * na criação, então a mesma entrada tem que dar sempre o mesmo loadout.
 */
export function escolherLoadoutPadrao(skills: SkillDef[], slots: number): SkillDef[] {
  if (slots <= 0) return []
  if (skills.length <= slots) return skills

  // Desempate por id mantém a ordem estável quando poder e custo empatam.
  const porPoder = [...skills].sort(
    (a, b) => b.power - a.power || a.energyCost - b.energyCost || a.id.localeCompare(b.id)
  )
  const escolhidas = porPoder.slice(0, slots)

  const maisBarata = [...skills].sort(
    (a, b) => a.energyCost - b.energyCost || b.power - a.power || a.id.localeCompare(b.id)
  )[0]
  if (!escolhidas.some((s) => s.id === maisBarata.id)) {
    escolhidas[escolhidas.length - 1] = maisBarata
  }
  return escolhidas
}


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
