// Dados do modo historia. Fonte unica: consumido pelo seed (destrutivo, para
// banco novo) e pelo sync-catalog (idempotente, para producao com jogadores).
//
// Os inimigos sao referenciados por NOME, nao por id: id so existe depois de
// gravar, e nome e o que permite o mesmo dado valer em qualquer banco.

// ATRIBUTOS PRÓPRIOS DE CHEFE (bossHp, bossSpeed, bossEnergy...) entram por
// cima da escala por nível. Existem porque os mesmos números serviam a dois
// donos: Byakuya é personagem jogável E chefe do estágio 6, então qualquer
// ajuste global mexia nos dois lados ao mesmo tempo. Subir a referência de
// velocidade consertava os chefes VELOZ e derrubava a Yoruichi jogável de 44%
// para 2% — um botão, dois efeitos opostos.
//
// Campo ausente significa "usa o valor escalado do personagem". Os valores
// abaixo saíram de busca no simulador, não de gosto, e cada um tem a razão
// escrita ao lado.

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
        introDialogue: [
      { speaker: null, text: "O Sekaimon se fecha atrás de vocês. O ar do Rukongai é mais pesado do que os livros diziam." },
      { speaker: null, text: "Alguma coisa se arrasta entre as casas tortas. Máscara branca, buraco no peito." },
      { speaker: "Hollow", text: "GRAAAAH." },
      { speaker: null, text: "Não é um inimigo do Seireitei. É só a primeira coisa que apareceu." },
    ],
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
    // VELOCIDADE era a luta inteira. Com spd 16 ele agia primeiro toda rodada e
    // o Vegeta ganhava 22%; com 14, 87%. Medido varrendo hp, ataque e
    // velocidade — só a velocidade movia o número.
    //
    // O ataque sobe de 25 para 28 na mesma passada: chefe não precisa respeitar
    // o orçamento do elenco jogável, e assim o estágio continua batendo forte
    // em vez de virar apenas mais lento.
    bossSpeed: 14,
    bossAttack: 28,
        introDialogue: [
      { speaker: "Izuru Kira", text: "Não sei quem você é. Sinceramente, tanto faz." },
      { speaker: "Izuru Kira", text: "Recebi ordem de não deixar ninguém passar. É só isso que me sobrou." },
      { speaker: null, text: "A Wabisuke pende na mão dele como se pesasse mais que o braço." },
      { speaker: "Izuru Kira", text: "Cada vez que eu te acertar, você vai ficar mais pesado. Até não conseguir levantar." },
    ],
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
        introDialogue: [
      { speaker: "Renji Abarai", text: "Você veio salvar a Rukia? Você?" },
      { speaker: null, text: "Zabimaru se estende pela rua inteira, cada segmento raspando a pedra." },
      { speaker: "Renji Abarai", text: "Eu conheço ela desde antes de você existir. E nem eu consegui tirar ela de lá." },
      { speaker: "Renji Abarai", text: "Então prova que vale mais que eu. Vem." },
    ],
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
        // Kenpachi não usa kidō; a reserva grande era herança do bloco jogável.
    bossHp: 188,
    bossEnergy: 125,
        introDialogue: [
      { speaker: null, text: "O reiatsu chega antes dele. É como andar contra o vento com pedra dentro." },
      { speaker: "Kenpachi Zaraki", text: "Achei. Faz tempo que ninguém aguenta ficar de pé perto de mim." },
      { speaker: "Kenpachi Zaraki", text: "Não me interessa por que você veio. Só não morre rápido." },
      { speaker: null, text: "Ele nem sabe o nome da própria espada. Nunca precisou." },
    ],
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
        // A reserva de 282 fazia a cura dele escalar a ~35 por uso e o deixava
    // praticamente imortal. Cortar energia corta cura E dano de kidō juntos.
    bossEnergy: 225,
        introDialogue: [
      { speaker: "Mayuri Kurotsuchi", text: "Ah. Um espécime que anda sozinho até aqui. Que conveniente." },
      { speaker: "Mayuri Kurotsuchi", text: "Sabe qual é o problema de lutar comigo? Você não está lutando. Está sendo medido." },
      { speaker: null, text: "Ashisogi Jizō se abre em três lâminas. O veneno já está no ar antes do primeiro golpe." },
    ],
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
        // Velocidade 35 dava iniciativa e crítico de graça toda rodada.
    bossHp: 195,
    bossSpeed: 27,
        introDialogue: [
      { speaker: "Byakuya Kuchiki", text: "A execução da Rukia é decisão do Gotei 13. Eu não discuto decisões." },
      { speaker: null, text: "Ele solta a espada. Ela não cai — se desfaz em mil lâminas do tamanho de uma pétala." },
      { speaker: "Byakuya Kuchiki", text: "Você não vai ver os cortes. Ninguém vê." },
    ],
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
        // Gin era o caso mais extremo: só igualar a velocidade já virava a luta.
    bossSpeed: 30,
        introDialogue: [
      { speaker: "Gin Ichimaru", text: "Oh~ você chegou longe. Parabéns, de verdade." },
      { speaker: null, text: "Ele sorri sem abrir os olhos. É o tipo de sorriso que não combina com nada em volta." },
      { speaker: "Gin Ichimaru", text: "Shinsou alcança bem mais longe do que parece. Bem mais." },
      { speaker: "Gin Ichimaru", text: "Você vai descobrir isso agora, ou daqui a pouco. Tanto faz pra mim." },
    ],
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
        // Aizen tem que ser o mais duro do arco, mas derrotável com preparo.
    bossSpeed: 28,
    bossEnergy: 300,
        introDialogue: [
      { speaker: null, text: "O Sōkyoku está em pedaços. E acima de tudo, ele. Sem pressa nenhuma." },
      { speaker: "Sosuke Aizen", text: "Tudo que você viu até aqui foi porque eu deixei ver." },
      { speaker: "Sosuke Aizen", text: "Cada capitão que você enfrentou estava exatamente onde eu quis." },
      { speaker: null, text: "A Kyōka Suigetsu já foi liberada. Você só não sabe quando." },
      { speaker: "Sosuke Aizen", text: "Ninguém nunca esteve no topo do céu. Nem você, nem eu. Ainda." },
    ],
    enemyLevel: 14,
    xpReward: 2500,
    coinReward: 500,
  },
];

module.exports = { chapter, stages };
