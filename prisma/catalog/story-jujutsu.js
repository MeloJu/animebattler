// Segundo arco de história: Jujutsu Kaisen.
//
// É um arco PARALELO ao de Bleach, não uma continuação: vai do nível 1 ao 14,
// com a mesma curva de inimigo e a mesma recompensa de XP. A razão é que o
// elenco é global — o jogador escolhe qualquer personagem de qualquer obra —
// então cada arco precisa funcionar como porta de entrada. Um arco sequencial
// (14 ao 28) exigiria esticar a curva de XP de novo e deixaria de ser jogável
// por quem começou agora.
//
// A consequência aceita é que um personagem que já terminou Bleach atravessa
// este arco com folga. Isso é replay com outro personagem, não progressão, e
// é o comportamento desejado até existir um arco de continuação de verdade.
//
// A narrativa segue o Incidente de Shibuya: dois treinos na escola, a
// escalada contra as maldições, o teste do Gojo antes de descer, e o fundo do
// poço quando Sukuna assume.

const chapter = {
  animeSlug: 'jujutsu-kaisen',
  slug: 'incidente-shibuya',
  title: 'Incidente de Shibuya',
  description:
    'Uma cortina cai sobre a estação de Shibuya e ninguém de dentro sai. Feiticeiros entram sabendo que o objetivo das maldições não é matar — é selar Satoru Gojo. Depois disso, nada segura o que vem.',
  order: 2,
};

const stages = [
  {
    title: 'Treino na Escola',
    introText:
      'O pátio da Escola Técnica de Jujutsu de Tóquio. Megumi mantém as mãos nos bolsos, entediado. "Não vou pegar leve. Se pegasse, não serviria de treino."',
    outroText:
      'O shikigami se desfaz em fumaça e Megumi assente uma vez, de leve. Vindo dele, isso é elogio.',
    enemyCharacterName: 'Megumi Fushiguro',
    // É o TREINO da escola, e o Megumi é INVOCADOR: 137 de HP base fazia o
    // primeiro combate do arco durar mais que o chefe final de Bleach. Depois
    // que a escada de fundamentos entrou, ele ficou com arsenal de verdade
    // aqui, e o estágio caiu para 10% de vitória com o Gojo.
    bossHp: 105,
    bossEnergy: 110,
        introDialogue: [
      { speaker: null, text: "Pátio da Escola Técnica de Jujutsu de Tóquio. Fim de tarde." },
      { speaker: "Megumi Fushiguro", text: "Não vou pegar leve. Se pegasse, não serviria de treino." },
      { speaker: null, text: "Ele junta as mãos. A sombra aos pés dele se aprofunda." },
      { speaker: "Megumi Fushiguro", text: "Nue. Sai." },
    ],
    enemyLevel: 1,
    xpReward: 100,
    coinReward: 40,
  },
  {
    title: 'A Prego e Martelo',
    introText:
      'Nobara gira um prego entre os dedos. "Você não vai ganhar de mim por sorte, então nem tenta. Vem com tudo que eu devolvo."',
    outroText:
      'Ela sacode a poeira da saia, irritada mais com a poeira do que com a derrota. "Tá. Você presta."',
    enemyCharacterName: 'Nobara Kugisaki',
    // A Nobara ATACANTE no nível 2 batia rápido demais para um jogador que
    // ainda tem duas habilidades. Corta iniciativa, não dano.
    bossSpeed: 12,
    bossEnergy: 80,
        introDialogue: [
      { speaker: "Nobara Kugisaki", text: "Ouvi dizer que você passou pelo Megumi. Ele é fácil, ele avisa antes de atacar." },
      { speaker: null, text: "Ela gira um prego entre os dedos, sem olhar." },
      { speaker: "Nobara Kugisaki", text: "Eu não aviso. E não vou pedir desculpa depois." },
    ],
    enemyLevel: 2,
    xpReward: 200,
    coinReward: 60,
  },
  {
    title: 'A Maldição do Vulcão',
    introText:
      'O ar esquenta antes de Jogo aparecer. A cabeça dele é uma montanha rachada, e o que sai da fenda não é fumaça. "Humanos. Vocês nem sabem o que são."',
    outroText:
      'O calor cede de uma vez, e o chão de Shibuya volta a ser chão. Jogo recua sem morrer — maldição daquele porte não morre de primeira.',
    enemyCharacterName: 'Jogo',
        introDialogue: [
      { speaker: null, text: "A temperatura sobe antes de qualquer coisa aparecer. O asfalto começa a cheirar." },
      { speaker: "Jogo", text: "Humanos. Vocês nem sabem o que são." },
      { speaker: "Jogo", text: "Nascem do medo de vocês mesmos e depois fingem que a culpa é nossa." },
      { speaker: null, text: "A fenda na cabeça dele se abre. O que sai não é fumaça." },
    ],
    enemyLevel: 3,
    xpReward: 300,
    coinReward: 90,
  },
  {
    title: 'O Que Cresce no Concreto',
    introText:
      'Raízes rompem o piso da estação. Hanami fala devagar, quase com pena: "A floresta perdoa. Eu não sou a floresta."',
    enemyCharacterName: 'Hanami',
    outroText:
      'A casca racha e o que havia dentro se dispersa em esporos. Por um instante o ar cheira a mato molhado, e depois a metrô de novo.',
    // Hanami é TANQUE, e TANQUE acumula: HP alto, defesa alta, E as próprias
    // habilidades escalando de defesa. Era 0% para todo mundo.
    bossHp: 158,
    bossDefense: 14,
    bossEnergy: 85,
        introDialogue: [
      { speaker: null, text: "Raízes rompem o piso da estação e sobem pelas paredes." },
      { speaker: "Hanami", text: "A floresta perdoa. Ela cresce de novo, sempre." },
      { speaker: "Hanami", text: "Eu não sou a floresta." },
    ],
    enemyLevel: 5,
    xpReward: 900,
    coinReward: 130,
  },
  {
    title: 'Alma e Forma',
    introText:
      'Mahito sorri com metade do rosto costurado. "Não é o corpo que eu toco. É o que você acha que você é."',
    outroText:
      'Ele se desfaz rindo, e o riso continua depois do corpo sumir. Você não tem certeza se venceu ou se ele desistiu.',
    enemyCharacterName: 'Mahito',
    // Mesma história do Mayuri no arco de Bleach: reserva enorme inflava tudo.
    bossHp: 190,
    bossDefense: 11,
    bossEnergy: 200,
        introDialogue: [
      { speaker: "Mahito", text: "Você acha que eu toco no corpo? Que fofo." },
      { speaker: null, text: "Metade do rosto dele é costura. A outra metade sorri." },
      { speaker: "Mahito", text: "Eu toco no que você ACHA que você é. E aí eu mudo um pouquinho." },
      { speaker: "Mahito", text: "Fica quieto. Vai ser rápido, ou não." },
    ],
    enemyLevel: 7,
    xpReward: 1300,
    coinReward: 180,
  },
  {
    title: 'O Mais Forte',
    introText:
      'Gojo tira a venda e olha para você como quem confere uma conta. "Se você não passar de mim, lá embaixo você morre. Prefiro que apanhe aqui."',
    outroText:
      '"Nada mal." Ele recoloca a venda. Não é vitória — é permissão. Foi exatamente o que ele quis que fosse.',
    enemyCharacterName: 'Satoru Gojo',
    // O Gojo tem que ser duro, mas ele é um teste, não uma parede: na ficção
    // ele quer que o jogador passe.
    bossDefense: 14,
        introDialogue: [
      { speaker: null, text: "Ele tira a venda. É a primeira vez que você vê os olhos dele." },
      { speaker: "Satoru Gojo", text: "Lá embaixo tem coisa que não negocia. Se você não passar de mim, você morre lá." },
      { speaker: "Satoru Gojo", text: "Prefiro que apanhe aqui, com alguém que vai parar quando você cair." },
      { speaker: "Satoru Gojo", text: "Vem. Sem medo, senão não vale." },
    ],
    enemyLevel: 9,
    xpReward: 1700,
    coinReward: 240,
  },
  {
    title: 'A Testa Costurada',
    introText:
      'O rosto é o de Suguru Geto, mas quem fala por trás dele é outra coisa, muito mais velha. "Este corpo? Herança. O plano é meu há mil anos."',
    outroText:
      'Os espíritos amaldiçoados se dispersam sem dono. O que estava usando aquele rosto já saiu andando — e o Prisma continua selado.',
    enemyCharacterName: 'Suguru Geto',
        introDialogue: [
      { speaker: null, text: "O rosto é o de Suguru Geto. A voz que sai dele é muito mais velha." },
      { speaker: "Suguru Geto", text: "Este corpo? Herança. Peguei quando ele parou de precisar." },
      { speaker: "Suguru Geto", text: "O plano é meu há mais de mil anos. Você chegou hoje." },
      { speaker: null, text: "Atrás dele, espíritos amaldiçoados se acumulam até tapar o corredor." },
    ],
    enemyLevel: 11,
    xpReward: 2100,
    coinReward: 320,
  },
  {
    title: 'O Rei das Maldições',
    introText:
      'Quatro braços, quatro olhos, e um sorriso que conhece o fim disso. "Se ajoelhe ou não se ajoelhe. Para mim dá no mesmo."',
    outroText:
      'Sukuna recua para dentro do hospedeiro sem pressa nenhuma, como quem guarda uma faca. Shibuya acabou. Ele não.',
    enemyCharacterName: 'Ryomen Sukuna',
    // Chefe final do arco. Continua o mais duro, e derrotável com preparo.
    bossHp: 250,
    bossDefense: 18,
    bossSpeed: 28,
        introDialogue: [
      { speaker: null, text: "Quatro braços. Quatro olhos. E um sorriso que já sabe como isso termina." },
      { speaker: "Ryomen Sukuna", text: "Se ajoelhe, ou não se ajoelhe. Para mim dá no mesmo." },
      { speaker: "Ryomen Sukuna", text: "Ninguém aqui está lutando comigo. Vocês estão adiando." },
      { speaker: null, text: "Ele levanta um dedo. Só um." },
    ],
    enemyLevel: 14,
    xpReward: 2500,
    coinReward: 500,
  },
];

module.exports = { chapter, stages };
