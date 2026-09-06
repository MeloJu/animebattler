// Dados do modo historia. Fonte unica: consumido pelo seed (destrutivo, para
// banco novo) e pelo sync-catalog (idempotente, para producao com jogadores).
//
// Os inimigos sao referenciados por NOME, nao por id: id so existe depois de
// gravar, e nome e o que permite o mesmo dado valer em qualquer banco.

// A RECOMPENSA DE XP FOI RECURVADA. Os valores antigos (60 a 500, 1880 no
// total) somavam menos que um nível 7, enquanto os inimigos dos estágios vão
// até o nível 14. Medindo o nível em que o jogador CHEGA em cada estágio
// contra o nível do inimigo dali, a folga era 0,1,1,3,4,5,6,9 — ou seja, a
// história exigia um jogador que subia três vezes mais rápido do que ela
// mesma pagava, e ficava matematicamente invencível na metade.
//
// Os valores novos (100 a 2500, 9100 no total) põem a folga em
// 0,0,0,1,1,1,1,2: o jogador está sempre um pouco abaixo do inimigo, que é o
// "exigir preparo real" pedido — treinar ou comprar equipamento antes de um
// chefe é parte esperada do jogo, não uma otimização opcional.
//
// A folga só é pequena porque a curva de nível é 50·L·(L−1): esses números
// saem dela, não de gosto. Mexer nos dois lados junto ou os dois desalinham.

const chapter = {
  animeSlug: 'bleach',
  slug: 'soul-society',
  title: 'Arco Soul Society',
  description:
    'Rukia Kuchiki foi levada para execução no Sōkyoku. Invadir o Seireitei significa atravessar o Gotei 13 inteiro — tenente por tenente, capitão por capitão.',
  order: 1,
};

const stages = [
  {
    title: 'O Portão Oeste',
    introText:
      'O Sekaimon se fecha atrás de vocês e o ar do Rukongai pesa diferente. Antes de chegar perto do Seireitei, uma alma perdida bloqueia o caminho — máscara branca, rugido de quem já foi gente.',
    outroText:
      'O Hollow se desfaz em partículas de reiatsu. Foi fácil demais. Se todo o Seireitei fosse assim, Rukia já estaria livre.',
    enemyMonsterName: 'Hollow',
    enemyLevel: 1,
    xpReward: 100,
    coinReward: 40,
  },
  {
    title: 'Primeiro Sangue',
    introText:
      'Izuru Kira aguarda de espada em punho, o olhar escondido pela franja. "Não sei quem você é. Só sei que ninguém passa daqui."',
    outroText:
      'Kira cai de joelhos, ainda tentando erguer a Wabisuke. Ele não pediu para estar ali — mas obedecer era a única coisa que lhe restava.',
    enemyCharacterName: 'Izuru Kira',
    enemyLevel: 2,
    xpReward: 200,
    coinReward: 60,
  },
  {
    title: 'O Tenente do Sexto Esquadrão',
    introText:
      'Renji Abarai bloqueia a rua inteira, Zabimaru já liberada. "Você veio salvar a Rukia? Então vai ter que passar por cima de mim. Eu tenho mais direito a isso do que você."',
    outroText:
      'Renji desaba contra a parede, rindo de raiva e alívio ao mesmo tempo. "Salva ela. Salva ela por mim."',
    enemyCharacterName: 'Renji Abarai',
    enemyLevel: 3,
    xpReward: 300,
    coinReward: 90,
  },
  {
    title: 'A Lâmina Sem Nome',
    introText:
      'O reiatsu cai sobre você como uma laje. Kenpachi Zaraki sorri, tapa-olho e cicatrizes, e larga a espada de leve no ombro. "Não corre. Faz muito tempo que ninguém me diverte."',
    outroText:
      'Kenpachi cai de costas, gargalhando para o céu. "Ótimo. Da próxima vez eu uso as duas mãos."',
    enemyCharacterName: 'Kenpachi Zaraki',
    enemyLevel: 5,
    xpReward: 900,
    coinReward: 130,
  },
  {
    title: 'Ciência e Crueldade',
    introText:
      'Mayuri Kurotsuchi inclina a cabeça, curioso do jeito errado. "Fascinante. Vou precisar do seu corpo depois — inteiro, de preferência. Mas não faço questão."',
    outroText:
      'Mayuri se liquefaz para escapar, prometendo continuar a dissecação em outra ocasião. Você não duvida.',
    enemyCharacterName: 'Mayuri Kurotsuchi',
    enemyLevel: 7,
    xpReward: 1300,
    coinReward: 180,
  },
  {
    title: 'Mil Pétalas',
    introText:
      'Byakuya Kuchiki não levanta a voz. "Você não faz ideia do que está tentando desfazer." Senbonzakura se dissolve em uma nuvem de lâminas rosa.',
    outroText:
      'O turbilhão de pétalas se assenta. Byakuya permanece de pé, mas a lâmina baixa. Pela primeira vez, ele fala de Rukia como irmã.',
    enemyCharacterName: 'Byakuya Kuchiki',
    enemyLevel: 9,
    xpReward: 1700,
    coinReward: 240,
  },
  {
    title: 'A Serpente Sorridente',
    introText:
      'Gin Ichimaru sorri sem abrir os olhos. "Ara ara. Chegou longe, hein? Que pena." Shinsō se estica antes de você registrar o movimento.',
    outroText:
      'Gin recua com o mesmo sorriso, como se nada tivesse acontecido. Ele nunca esteve lutando a sério — estava medindo.',
    enemyCharacterName: 'Gin Ichimaru',
    enemyLevel: 11,
    xpReward: 2100,
    coinReward: 320,
  },
  {
    title: 'A Traição',
    introText:
      'O Sōkyoku está destruído, mas ninguém comemora. Sōsuke Aizen desce a colina sem pressa, os óculos partidos no chão. "Ninguém jamais esteve no topo do céu. Nem você. Nem eu. Nem os deuses." Kyōka Suigetsu já foi liberada — e você não viu quando.',
    outroText:
      'Aizen sobe ao Negación, escoltado pelos Menos, e o céu se fecha. Rukia está viva. Mas a Soul Society acabou de perder muito mais do que uma execução.',
    enemyCharacterName: 'Sosuke Aizen',
    enemyLevel: 14,
    xpReward: 2500,
    coinReward: 500,
  },
];

module.exports = { chapter, stages };
