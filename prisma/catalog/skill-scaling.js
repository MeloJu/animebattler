// De qual atributo cada habilidade tira força.
//
// POR QUE EXISTE: até aqui o dano era `power + ataque * 0.5` para TODA
// habilidade, cura/escudo/veneno eram números fixos cegos a atributo, e
// energia era só mana — reserva maior deixava lançar mais vezes, nunca
// lançar mais forte. Ou seja, havia um único atributo ofensivo no jogo, e
// todo build ótimo era o mesmo build. "Suporte que sobe dano" era
// indistinguível de atacante, e subir energia num conjurador não fazia nada
// pelo poder dele.
//
// A REGRA SE DECIDE POR QUANTOS DONOS A HABILIDADE TEM, não pela categoria.
//
// 1. UM DONO SÓ = ASSINATURA -> escala da CLASSE do dono, seja qual for a
//    categoria. O Galick Gun é categoria KI, mas é o golpe do Vegeta, que é
//    ATACANTE: escala de ataque. O Santen Kesshun é da Orihime, SUPORTE:
//    escala de energia. O El Directo é do Chad, TANQUE: escala de defesa.
//
//    A primeira versão desta regra usava categoria primeiro, e o resultado
//    medido foi absurdo: o Vegeta saiu com 16 de 16 habilidades escalando de
//    energia, porque todo golpe dele é categoria KI. Isso não conserta nada,
//    só troca "ataque é rei" por "energia é rei". Identidade tem que escalar
//    do arquétipo, senão a classe do personagem não significa nada.
//
// 2. VÁRIOS DONOS = TÉCNICA COMPARTILHADA -> escala do TEMA dela. Kidō, hadō,
//    bakudō, ki, ninjutsu e genjutsu vêm de ENERGIA: pressão espiritual,
//    chakra e ki são reserva, e a reserva É a potência. Taijutsu vem de
//    ATAQUE, porque é corpo. As escadas de categoria OTHER declaram o próprio
//    atributo em skill-ladders.js.
//
//    Aqui mora a força e a fraqueza de classe que se queria: a escada de kidō
//    é aberta a todo mundo, mas um TANQUE lança um kidō fraco e um CONJURADOR
//    lança o mesmo kidō forte.
//
// O ATRITO ENTRE AS DUAS É O PONTO. Um shinigami ATACANTE tem o kit escalando
// de ataque e a escada de kidō escalando de energia: investir em ataque
// fortalece a identidade dele, investir em energia fortalece o arsenal
// genérico. É escolha de build com custo real, que antes não existia porque
// só ataque influenciava qualquer coisa.
//
// Os coeficientes que traduzem atributo em número vivem em
// app/lib/battle/constants.ts (SCALING_COEFFICIENT) e são calibrados por
// paridade de arquétipo, não por gosto.

/** Técnicas compartilhadas: a categoria já diz de onde vem a força. */
const porCategoria = {
  HADO: 'ENERGY',
  BAKUDO: 'ENERGY',
  KIDO: 'ENERGY',
  KI: 'ENERGY',
  NINJUTSU: 'ENERGY',
  GENJUTSU: 'ENERGY',
  TAIJUTSU: 'ATTACK',
};

/** Kit próprio (OTHER): o arquétipo de quem usa decide. */
const porClasse = {
  TANQUE: 'DEFENSE',
  VELOZ: 'SPEED',
  ATACANTE: 'ATTACK',
  SUPORTE: 'ENERGY',
  CONJURADOR: 'ENERGY',
  INVOCADOR: 'ENERGY',
};

/**
 * Resolve o atributo de uma habilidade.
 *
 * `classesDonas` são as classes dos personagens que têm esta habilidade no
 * kit. Uma habilidade de assinatura normalmente tem um dono só; quando tem
 * mais de um, vence a classe mais frequente, e o empate cai em ATTACK —
 * decisão consciente de que o caso ambíguo vira o comportamento antigo em
 * vez de virar surpresa.
 */
function scalingStatDe(category, classesDonas) {
  // Assinatura: um dono só. A classe dele manda, a categoria não importa.
  if (classesDonas.length === 1) return porClasse[classesDonas[0]] || 'ATTACK';

  if (porCategoria[category]) return porCategoria[category];

  const contagem = {};
  for (const c of classesDonas) {
    const stat = porClasse[c];
    if (stat) contagem[stat] = (contagem[stat] || 0) + 1;
  }
  const ordenado = Object.entries(contagem).sort((a, b) => b[1] - a[1]);
  if (!ordenado.length) return 'ATTACK';
  if (ordenado.length > 1 && ordenado[0][1] === ordenado[1][1]) return 'ATTACK';
  return ordenado[0][0];
}

module.exports = { porCategoria, porClasse, scalingStatDe };
