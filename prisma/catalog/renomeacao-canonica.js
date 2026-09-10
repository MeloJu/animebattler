// Habilidades renomeadas para refletir a obra, sem tocar em mecânica.
//
// POR QUE ESTE ARQUIVO EXISTE. Um levantamento no elenco de Bleach mostrou 186
// habilidades exclusivas (uma por dono), das quais boa parte carrega nome
// inventado — sub-técnicas compostas em cima de um zanpakutō real ("Haineko:
// Corrosão Total", quando Haineko na obra tem UMA habilidade sem sub-nomes) e,
// mais comum ainda, um passivo de personalidade genérico por personagem
// ("Iron Resolve", "Lazy Confidence", "Cold Calculation") que não existe na
// obra em lugar nenhum.
//
// A REGRA DE FONTE, na ordem em que se aplica: (1) nome usado no anime/mangá —
// confiança alta; (2) o sistema numérico de kidō, que a obra estabelece ir até
// 99 mesmo sem mostrar todos em tela — usar o número é canônico mesmo sem
// nome de tela; (3) onde não sobra nada disso, uma ação GENÉRICA sem título
// pomposo — "golpe de espada", não um nome de técnica inventado fingindo ser
// canônico. Termos de jogo oficial (Brave Souls e similares) entram quando
// confirmados, mas não são citados de memória sem certeza: um "nome oficial"
// fabricado seria o mesmo problema disfarçado.
//
// SÓ O NOME MUDA, NÃO O NÚMERO. Poder, custo, efeito e nível de requisito
// continuam exatamente onde estavam — trocar o rótulo não é trocar o
// balanceamento, e por isso esta passagem não precisa de nova medição.
//
// CADA ENTRADA REGISTRA A FONTE, para a próxima pessoa (ou eu, daqui a um
// mês) não precisar refazer a pesquisa nem confiar cegamente na anterior.

const renomeacoes = [
  // KENPACHI ZARAKI é o caso mais difícil do elenco: na obra ele não usa
  // NENHUMA técnica nomeada — a caracterização dele é justamente essa, ele só
  // balança a espada. Mesmo assim, quatro momentos/traços canônicos bem
  // conhecidos encaixam exatamente nos efeitos que o kit já tinha.
  {
    nomeAntigo: 'Battle Fury',
    categoria: 'OTHER',
    nomeNovo: 'Remover o Tapa-Olho',
    fonte: 'anime/mangá — o tapa-olho sela boa parte do reiatsu dele; removê-lo é um momento recorrente (contra Ichigo, entre outros) que libera poder de verdade.',
  },
  {
    nomeAntigo: "Intimidating Bloodlust",
    categoria: 'OTHER',
    nomeNovo: 'Pressão Assassina',
    fonte: 'anime/mangá — o reiatsu dele sozinho já derruba ou paralisa quem tem vontade fraca, mostrado várias vezes contra oponentes menores.',
  },
  {
    nomeAntigo: 'Nozarashi Unleashed',
    categoria: 'OTHER',
    nomeNovo: 'Nozarashi',
    fonte: 'anime/mangá — o nome verdadeiro da zanpakutō dele, revelado tarde na obra; dizê-lo em voz alta é o próprio ato de poder.',
  },
  {
    nomeAntigo: "Berserker's Endurance",
    categoria: 'OTHER',
    nomeNovo: 'Teimosia de Kenpachi',
    fonte: 'anime/mangá — ele segue lutando através de ferimentos que derrubariam qualquer outro; é caracterização repetida, não uma técnica com nome.',
  },
  {
    nomeAntigo: 'Reckless Slash',
    categoria: 'OTHER',
    nomeNovo: 'Golpe Bruto',
    fonte: 'GENÉRICO DE PROPÓSITO — ele não tem golpe básico nomeado na obra; dar um nome pomposo aqui seria inventar o que a obra deliberadamente não dá a ele.',
  },
];

module.exports = { renomeacoes };
