import { isLegalMove } from './engine'
import type { CombatantState, SkillDef } from './types'

const LOW_HP_HEAL_THRESHOLD = 0.4

/**
 * Dano ESPERADO de uma habilidade: poder descontado da chance de errar.
 *
 * Existe porque as duas funções abaixo ordenavam por poder cru, e com
 * precisão isso passou a estar errado. Um golpe de poder 45 com 88% de
 * precisão rende 39,6 em média — menos que um de 42 que nunca erra. Sem esta
 * conta, a precisão seria só um imposto silencioso sobre as habilidades
 * grandes, e a escolha que ela existe para criar não apareceria em lugar
 * nenhum: nem no loadout automático, nem na jogada da IA.
 *
 * Não é a conta completa de dano — ignora escala por atributo e defesa do
 * alvo — e não precisa ser. Ela serve para ORDENAR habilidades do mesmo
 * personagem, e esses dois fatores são aproximadamente iguais para todas elas.
 */
export function danoEsperado(skill: SkillDef): number {
  return skill.power * ((skill.precision ?? 100) / 100)
}

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
    (a, b) => danoEsperado(b) - danoEsperado(a) || a.energyCost - b.energyCost || a.id.localeCompare(b.id)
  )
  const escolhidas = porPoder.slice(0, slots)

  const maisBarata = [...skills].sort(
    (a, b) => a.energyCost - b.energyCost || danoEsperado(b) - danoEsperado(a) || a.id.localeCompare(b.id)
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
export function pickAiSkill(
  self: CombatantState,
  availableSkills: SkillDef[],
  /**
   * O oponente. Só é consultado para uma decisão — não abrir um domínio que
   * vai perder o choque —, e é opcional porque sem ele a IA apenas deixa de
   * fazer essa checagem.
   */
  oponente?: CombatantState
): string | null {
  const legal = availableSkills.filter((s) => isLegalMove(self, s))
  if (legal.length === 0) return null


  const hpRatio = self.maxHp > 0 ? self.currentHp / self.maxHp : 0
  if (hpRatio < LOW_HP_HEAL_THRESHOLD) {
    const heal = legal.find((s) => s.effects.some((e) => e.type === 'HEAL'))
    if (heal) return heal.id
  }

  // DOMÍNIO, antes da regra de maior poder — senão a IA nunca abriria um.
  //
  // O domínio bate MENOS que os outros golpes de nível 14, porque o valor dele
  // está no estado: três rodadas de dano amplificado que atravessa escudo e
  // counter. A regra gulosa abaixo escolhe por poder, então um chefe com
  // Expansão de Domínio escolheria qualquer outra coisa, sempre — a mecânica
  // existiria e nunca apareceria em jogo contra a IA.
  //
  // Abrir cedo é quase sempre certo, porque a amplificação vale para tudo que
  // vier depois; a única checagem é não reabrir por cima do próprio domínio,
  // que jogaria fora as rodadas restantes. Contra um domínio inimigo já aberto
  // ela também abre: deixar o outro de pé é pior que disputar, mesmo perdendo.
  if (!self.statusEffects.some((e) => e.type === 'DOMAIN')) {
    const dominio = legal.find((s) => s.effects.some((e) => e.type === 'DOMAIN'))
    const dominioInimigo = oponente?.statusEffects.find((e) => e.type === 'DOMAIN' && e.remainingRounds > 0)
    const minhaForca = dominio?.effects.find((e) => e.type === 'DOMAIN')?.magnitude ?? 0

    // Abrir um domínio mais fraco contra um já aberto é a pior jogada do jogo:
    // custa a energia, a rodada, e ainda entrega um atordoamento. Aqui a IA
    // recusa a disputa e luta normalmente, guardando o domínio para quando o
    // do outro cair. Empate ela aceita — anular os dois tira a amplificação do
    // oponente, que é um bom negócio para quem estava sem domínio.
    const disputaPerdida = dominioInimigo !== undefined && minhaForca < dominioInimigo.magnitude
    if (dominio && !disputaPerdida) return dominio.id
  }

  const damageSkills = legal
    .filter((s) => s.power > 0)
    .sort((a, b) => danoEsperado(b) - danoEsperado(a) || a.energyCost - b.energyCost)
  if (damageSkills.length > 0) return damageSkills[0].id

  const supportSkills = legal.filter((s) => s.power === 0)
  if (supportSkills.length > 0) return supportSkills[0].id

  return null
}
