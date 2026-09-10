// Aplica EXECUTE, PIERCE e COMBO_STUN a habilidades existentes, sem tocar em
// poder, custo ou nos efeitos que já estavam lá.
//
// POR QUE ISTO EXISTE. Um levantamento no elenco de Bleach achou 38 das 186
// habilidades exclusivas com dano puro e nenhum efeito — entre elas golpes
// icônicos como o Getsuga Tenshō. As outras 148 quase sempre repetem o mesmo
// vocabulário de nove tipos (BUFF/DEBUFF/DOT/SHIELD/...), então mesmo "tendo
// efeito" a maioria lê igual. O que faltava não era efeito — era um jeito de
// um golpe ser mecanicamente diferente de outro por causa do que ele É na
// obra, não só de quanto poder tem.
//
// OS TRÊS PRIMEIROS EXEMPLOS, um por mecânica:
//
//   Nigeki Kessatsu: Death Sting (Suì-Fēng) ganha EXECUTE. O nome já diz o
//   que a técnica faz na obra — "dois golpes, morte certa": acertar o mesmo
//   ponto duas vezes mata o alvo. Isto é uma aproximação, não uma réplica
//   literal: um "sempre mata na segunda vez" seria um instakill, violento
//   demais pra qualquer luta ter graça. O bônus contra alvo fraco é o que dá
//   pra fazer sem quebrar o jogo.
//
//   Gran Rey Cero (Grimmjow) ganha PIERCE. Está entre as 38 de dano puro
//   hoje, e é o ultimate mais claro de "poder bruto que a obra trata como
//   devastador mesmo contra quem se defende" do elenco inteiro.
//
//   Brujería: Multi-Strike (Zommari) ganha COMBO_STUN. Ele já tinha "Amor:
//   Paralysis", que atordoa por duas rodadas — só faltava um golpe seguinte
//   pra aproveitar a brecha. O padrão de jogo que isso cria é o mesmo de
//   quem usa kidō: prender numa rodada, finalizar na outra.
//
// ACRESCENTA AO ARRAY DE EFEITOS, nunca substitui — mesmo princípio do
// tags-faltantes.js. Uma skill que já tenha o tipo de efeito não ganha
// duplicata.

const aplicacoes = [
  {
    nomeDaSkill: 'Nigeki Kessatsu: Death Sting',
    categoria: 'OTHER',
    efeitoNovo: { type: 'EXECUTE', target: 'SELF', magnitude: 60 },
  },
  {
    nomeDaSkill: 'Gran Rey Cero',
    categoria: 'OTHER',
    efeitoNovo: { type: 'PIERCE', target: 'SELF', magnitude: 40 },
  },
  {
    nomeDaSkill: 'Brujería: Multi-Strike',
    categoria: 'OTHER',
    efeitoNovo: { type: 'COMBO_STUN', target: 'SELF', magnitude: 40 },
  },
];

module.exports = { aplicacoes };
