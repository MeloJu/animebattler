// Precisão das habilidades: quanto o golpe erra por ser o golpe que é.
//
// É DERIVADA DO PODER, e não escrita uma a uma. São 473 habilidades com dano
// no catálogo; um campo à mão em cada uma seriam 473 oportunidades de errar e
// nenhuma regra que alguém pudesse conferir depois. A mesma decisão que já
// foi tomada para a escala por atributo e para os atributos de classe.
//
// A REGRA: quanto maior o golpe, mais largo ele é. Um soco rápido encaixa
// sempre; um Getsuga Tenshou é uma onda de energia que a pessoa do outro lado
// tem uma chance de não estar mais ali quando chega.
//
// POR QUE ISSO IMPORTA: até aqui a melhor jogada era sempre "a habilidade de
// maior número que eu consigo pagar", e a única coisa que impedia era o
// cooldown. Com precisão, o golpe grande passa a ser uma APOSTA — e o golpe
// médio confiável passa a ter um caso a favor dele. É a primeira vez que duas
// habilidades ofensivas do mesmo kit competem por algo que não seja o custo.
//
// Os números são contidos de propósito. 88% é aproximadamente um erro a cada
// oito usos: o suficiente para a escolha existir, longe do suficiente para a
// luta virar sorteio. E como a IA passou a escolher por dano ESPERADO
// (poder × precisão), ela também deixa de pegar cegamente o maior número.

const FAIXAS = [
  // Os nove golpes de 50+ e os vinte de 40-49: o topo absoluto do catálogo.
  { minimoDePoder: 40, precisao: 88 },
  { minimoDePoder: 30, precisao: 94 },
];

/**
 * A precisão de uma habilidade, dado o poder e as tags dela.
 *
 * DOMÍNIO É EXCEÇÃO e não podia deixar de ser: o estado que ele instala se
 * chama acerto garantido, e uma abertura de domínio que passa longe
 * contradiria a própria mecânica que ela liga.
 */
function precisaoDe(skill) {
  const tags = Array.isArray(skill.tags) ? skill.tags : [];
  if (tags.includes('dominio')) return 100;
  if (!skill.power || skill.power <= 0) return 100;

  const faixa = FAIXAS.find((f) => skill.power >= f.minimoDePoder);
  return faixa ? faixa.precisao : 100;
}

module.exports = { FAIXAS, precisaoDe };
