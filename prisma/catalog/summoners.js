// Kits dos três invocadores: Red, Suguru Geto e Sung Jin Woo.
//
// POR QUE EXISTE: os três entraram no elenco na passagem de classes e ficaram
// com ZERO habilidades — literalmente só ataque básico, enquanto o resto do
// elenco tem de 16 a 18. Eram os únicos personagens injogáveis do jogo.
//
// INVOCAÇÃO SEM TERCEIRO COMBATENTE. A batalha assume exatamente dois lados
// (BattleState tem player e enemy), então invocação de verdade — uma criatura
// que age sozinha — é mudança de fundo no motor. Até lá, cada invocação é uma
// habilidade que representa o que aquela criatura FAZ: dano, veneno, escudo,
// atordoamento. O nome carrega a fantasia, os efeitos carregam a mecânica.
//
// PROFUNDIDADE DESIGUAL, DE PROPÓSITO. O Red tem 12 habilidades e os outros
// dois têm 6. Não é descuido: o time do Red é a identidade dele, e cada Pokémon
// traz dois golpes com cara própria. As sombras do Sung Jin Woo e os espíritos
// do Geto fazem essencialmente uma coisa cada — dano, e no caso do Geto dano
// mais maldição. Encher os dois até 12 produziria preenchimento, que diluiria
// justamente a identidade que o escalonamento de kit existe para proteger.
//
// O time do Red libera POR POKÉMON, não por golpe solto: os dois golpes de um
// Pokémon chegam juntos, então subir de nível parece capturar um companheiro
// novo em vez de ganhar um botão. Rayquaza fecha no 16, que é o topo alcançável
// com a história recurvada (termina no nível 14) mais algum treino.
//
// ESCALA: todos são assinatura de um dono só, então a regra de
// prisma/catalog/skill-scaling.js os faz escalar da classe — INVOCADOR escala
// de ENERGIA. Não é preciso declarar nada aqui.
//
// Os números seguem a mesma curva das escadas de afiliação para que o
// balanceamento continue comparável: poder de 8 a 37, energia de 9 a 35,
// cooldown de 1 a 5.

/** Red — cada Pokémon do time traz dois golpes, liberados juntos. */
const red = {
  character: 'Red',
  skills: [
    // Pikachu — o companheiro de sempre, disponível desde o começo.
    {
      name: 'Pikachu: Choque do Trovão',
      category: 'OTHER',
      power: 10,
      energyCost: 10,
      cooldown: 1,
      tags: ['pokemon', 'eletrico'],
      effects: [],
      level: 1,
    },
    {
      name: 'Pikachu: Investida Trovão',
      category: 'OTHER',
      power: 16,
      energyCost: 15,
      cooldown: 2,
      tags: ['pokemon', 'eletrico', 'stun'],
      effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 1, duration: 1 }],
      level: 1,
    },

    // Charizard — pressão de fogo, dano que continua depois do golpe.
    {
      name: 'Charizard: Lança-Chamas',
      category: 'OTHER',
      power: 18,
      energyCost: 17,
      cooldown: 2,
      tags: ['pokemon', 'fogo'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 6, duration: 2 }],
      level: 4,
    },
    {
      name: 'Charizard: Asa de Aço',
      category: 'OTHER',
      power: 21,
      energyCost: 18,
      cooldown: 2,
      tags: ['pokemon', 'voador'],
      effects: [],
      level: 4,
    },

    // Blastoise — o Pokémon que sustenta a linha: um golpe pesado e uma casca.
    {
      name: 'Blastoise: Hidrobomba',
      category: 'OTHER',
      power: 26,
      energyCost: 24,
      cooldown: 3,
      tags: ['pokemon', 'agua'],
      effects: [],
      level: 7,
    },
    {
      name: 'Blastoise: Retrair Casco',
      category: 'OTHER',
      power: 0,
      energyCost: 18,
      cooldown: 3,
      tags: ['pokemon', 'shield'],
      effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 28, duration: 2 }],
      level: 7,
    },

    // Venusaur — controle: enfraquece e drena em vez de explodir.
    {
      name: 'Venusaur: Bomba de Sementes',
      category: 'OTHER',
      power: 24,
      energyCost: 21,
      cooldown: 2,
      tags: ['pokemon', 'planta'],
      effects: [],
      level: 10,
    },
    {
      name: 'Venusaur: Semente Sanguessuga',
      category: 'OTHER',
      power: 8,
      energyCost: 22,
      cooldown: 3,
      tags: ['pokemon', 'planta', 'dreno'],
      effects: [
        { type: 'DOT', target: 'ENEMY', magnitude: 9, duration: 3 },
        { type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 14, duration: 2 },
      ],
      level: 10,
    },

    // Snorlax — massa e recuperação, o companheiro que aguenta o round ruim.
    {
      name: 'Snorlax: Corpo Pesado',
      category: 'OTHER',
      power: 30,
      energyCost: 26,
      cooldown: 3,
      tags: ['pokemon', 'normal'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 16, duration: 2 }],
      level: 13,
    },
    {
      name: 'Snorlax: Descanso',
      category: 'OTHER',
      power: 0,
      energyCost: 24,
      cooldown: 4,
      tags: ['pokemon', 'cura'],
      effects: [{ type: 'HEAL', target: 'SELF', magnitude: 30 }],
      level: 13,
    },

    // Mega Rayquaza shiny — o fecho do time, e o golpe mais caro do jogo dele.
    {
      name: 'Mega Rayquaza: Ascensão do Dragão',
      category: 'OTHER',
      power: 35,
      energyCost: 32,
      cooldown: 4,
      tags: ['pokemon', 'dragao', 'lendario'],
      effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 22, duration: 2 }],
      level: 16,
    },
    {
      name: 'Mega Rayquaza: Fúria do Céu Partido',
      category: 'OTHER',
      power: 37,
      energyCost: 35,
      cooldown: 5,
      tags: ['pokemon', 'dragao', 'lendario', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 24, duration: 2 }],
      level: 16,
    },
  ],
};

/**
 * Suguru Geto — manipulação de espíritos amaldiçoados.
 *
 * A assinatura dele é MALDIÇÃO, não dano bruto: quase todo golpe deixa algo
 * apodrecendo depois. É também o que apresenta o vocabulário de Jujutsu Kaisen
 * ao jogo, para quando o arco de história desse universo entrar.
 */
const geto = {
  character: 'Suguru Geto',
  skills: [
    {
      name: 'Espírito Amaldiçoado Menor',
      category: 'OTHER',
      power: 11,
      energyCost: 10,
      cooldown: 1,
      tags: ['maldicao'],
      effects: [],
      level: 1,
    },
    {
      name: 'Corrosão Amaldiçoada',
      category: 'OTHER',
      power: 6,
      energyCost: 14,
      cooldown: 2,
      tags: ['maldicao', 'veneno'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 3 }],
      level: 1,
    },
    {
      name: 'Invocação em Massa',
      category: 'OTHER',
      power: 22,
      energyCost: 20,
      cooldown: 2,
      tags: ['maldicao'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 6, duration: 2 }],
      level: 4,
    },
    {
      name: 'Deterioração Progressiva',
      category: 'OTHER',
      power: 4,
      energyCost: 22,
      cooldown: 3,
      tags: ['maldicao', 'debuff'],
      effects: [
        { type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 },
        { type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 3 },
      ],
      level: 8,
    },
    {
      name: 'Uzumaki: Redemoinho de Maldições',
      category: 'OTHER',
      power: 31,
      energyCost: 29,
      cooldown: 4,
      tags: ['maldicao'],
      effects: [],
      level: 12,
    },
    {
      name: 'Dragão Arco-Íris',
      category: 'OTHER',
      power: 36,
      energyCost: 34,
      cooldown: 5,
      tags: ['maldicao', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 11, duration: 3 }],
      level: 16,
    },
  ],
};

/**
 * Sung Jin Woo — o exército das sombras.
 *
 * Cada sombra é dano, com uma exceção de sustentação (Tank). É o invocador mais
 * direto dos três de propósito: a fantasia dele é quantidade e avanço, não
 * controle.
 */
const sungJinWoo = {
  character: 'Sung Jin Woo',
  skills: [
    {
      name: 'Erguer: Soldado das Sombras',
      category: 'OTHER',
      power: 12,
      energyCost: 10,
      cooldown: 1,
      tags: ['sombra'],
      effects: [],
      level: 1,
    },
    {
      name: 'Adaga do Monarca',
      category: 'OTHER',
      power: 15,
      energyCost: 13,
      cooldown: 1,
      tags: ['sombra'],
      effects: [],
      level: 1,
    },
    {
      name: 'Igris, Cavaleiro de Sangue',
      category: 'OTHER',
      power: 25,
      energyCost: 22,
      cooldown: 3,
      tags: ['sombra'],
      effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 16, duration: 2 }],
      level: 4,
    },
    {
      name: 'Tank, Muralha de Ossos',
      category: 'OTHER',
      power: 5,
      energyCost: 19,
      cooldown: 3,
      tags: ['sombra', 'shield'],
      effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 26, duration: 2 }],
      level: 8,
    },
    {
      name: 'Beru, Formiga-Rei',
      category: 'OTHER',
      power: 32,
      energyCost: 30,
      cooldown: 4,
      tags: ['sombra'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 2 }],
      level: 12,
    },
    {
      name: 'Exército das Sombras',
      category: 'OTHER',
      power: 37,
      energyCost: 35,
      cooldown: 5,
      tags: ['sombra', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 22, duration: 2 }],
      level: 16,
    },
  ],
};

const summoners = [red, geto, sungJinWoo];

module.exports = { summoners };
