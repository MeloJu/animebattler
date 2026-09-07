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

/** Quanto custa o PRÓXIMO treino de quem já comprou `treinosFeitos`. */
export function custoDoTreino(treinosFeitos: number): number {
  return TREINO_CUSTO_BASE + treinosFeitos * TREINO_ACRESCIMO
}

/** Quantos treinos cabem em `moedas`, comprando um após o outro. */
export function treinosQueCabem(moedas: number, treinosFeitos: number): number {
  let n = 0
  let restante = moedas
  let feitos = treinosFeitos
  while (restante >= custoDoTreino(feitos)) {
    restante -= custoDoTreino(feitos)
    feitos += 1
    n += 1
  }
  return n
}
