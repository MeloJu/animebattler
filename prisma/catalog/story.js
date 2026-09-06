// Dados do modo historia. Fonte unica: consumido pelo seed (destrutivo, para
// banco novo) e pelo sync-catalog (idempotente, para producao com jogadores).
//
// Os inimigos sao referenciados por NOME, nao por id: id so existe depois de
// gravar, e nome e o que permite o mesmo dado valer em qualquer banco.

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
    xpReward: 60,
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
    xpReward: 90,
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
    xpReward: 130,
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
    xpReward: 180,
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
    xpReward: 240,
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
    xpReward: 300,
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
    xpReward: 380,
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
    xpReward: 500,
    coinReward: 500,
  },
];

module.exports = { chapter, stages };
