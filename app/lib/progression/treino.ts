import { ATRIBUTO_NEUTRO } from '@/app/lib/battle/constants'

/**
 * Treino: comprar ponto de atributo com moeda.
 *
 * POR QUE NÃO É "MAIS UM PONTO DE NÍVEL": se treino desse ponto livre, seria
 * o mesmo botão da tela de atributos com outro nome. O que ele é de verdade é
 * o SEGUNDO DESTINO DA MOEDA. Até aqui moeda só comprava equipamento — 20
 * itens, e depois de comprados o dinheiro não tinha mais uso —, enquanto a
 * batalha contra IA passou a pagar moeda todo dia. Entrada sem saída vira
 * número sem significado.
 *
 * O ganho vai para as MESMAS colunas alloc da tela de atributos, então um
 * ponto treinado e um ponto de nível valem exatamente o mesmo em batalha. O
 * que separa os dois é como se consegue: um pelo tempo de jogo, outro pelo
 * dinheiro.
 */

/** Preço do primeiro treino de um personagem. */
export const TREINO_CUSTO_BASE = 80

/**
 * Quanto o preço sobe a cada treino comprado.
 *
 * É o crescimento que substitui um teto diário: em vez de PROIBIR depois de N
 * treinos, encarece até deixar de valer a pena, e quem decide onde parar é o
 * jogador. Também protege a economia — sem ele, quem acumulasse moeda
 * compraria atributo sem limite e o nível deixaria de importar.
 *
 * Com 40, os cinco primeiros treinos custam 80, 120, 160, 200 e 240: 800 no
 * total. Uma vitória contra IA no nível 10 paga 120, e o teto diário são
 * cinco — então dá para comprar alguns por dia no começo, e cada vez menos.
 */
export const TREINO_ACRESCIMO = 40

/**
 * Desconto máximo que a inteligência pode dar no treino.
 *
 * Existe teto pela mesma razão que a evasão tem teto: sem ele, o caminho
 * ótimo seria despejar todos os pontos em inteligência primeiro para comprar
 * os outros mais barato — e um atributo que se paga sozinho não é escolha, é
 * a resposta certa. Com 40%, investir nela compensa e não se retroalimenta a
 * ponto de dominar a ordem das decisões.
 */
export const TREINO_DESCONTO_MAXIMO = 0.4

/** Quanto de desconto cada ponto de inteligência acima do neutro concede. */
export const TREINO_DESCONTO_POR_PONTO = 0.02

/**
 * Fração descontada do preço do treino, dada a inteligência do personagem.
 *
 * Conta a partir do valor NEUTRO, não de zero: um personagem que não investiu
 * nada paga o preço cheio, e é isso que faz o desconto ser resultado de uma
 * decisão em vez de um brinde que todo mundo recebe por existir.
 */
export function descontoDeInteligencia(inteligencia: number): number {
  const acimaDoNeutro = Math.max(0, inteligencia - ATRIBUTO_NEUTRO)
  return Math.min(TREINO_DESCONTO_MAXIMO, acimaDoNeutro * TREINO_DESCONTO_POR_PONTO)
}

/**
 * Quanto custa o PRÓXIMO treino de quem já comprou `treinosFeitos`.
 *
 * A inteligência é opcional e ausente vale o neutro, ou seja, preço cheio —
 * o mesmo número que a função devolvia antes de a inteligência existir.
 */
export function custoDoTreino(treinosFeitos: number, inteligencia = ATRIBUTO_NEUTRO): number {
  const cheio = TREINO_CUSTO_BASE + treinosFeitos * TREINO_ACRESCIMO
  return Math.max(1, Math.round(cheio * (1 - descontoDeInteligencia(inteligencia))))
}

/** Quantos treinos cabem em `moedas`, comprando um após o outro. */
export function treinosQueCabem(moedas: number, treinosFeitos: number, inteligencia = ATRIBUTO_NEUTRO): number {
  let n = 0
  let restante = moedas
  let feitos = treinosFeitos
  while (restante >= custoDoTreino(feitos, inteligencia)) {
    restante -= custoDoTreino(feitos, inteligencia)
    feitos += 1
    n += 1
  }
  return n
}
