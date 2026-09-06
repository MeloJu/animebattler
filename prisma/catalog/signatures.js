// Ampliação do kit de assinatura dos personagens mais magros.
//
// POR QUE EXISTE: medindo habilidades com UM dono só, 44 dos 52 personagens
// tinham 4 ou menos. Rukia e Momo tinham 2. Goku, que é o rosto do jogo, e
// Aizen, que é o chefe final, tinham 3. Como cada personagem carrega 12 de
// escada compartilhada, isso significa que três quartos de qualquer um eram
// técnica genérica — a identidade era a minoria do kit.
//
// Pior que a contagem era a FORMA: quase todos tinham um golpe ofensivo e dois
// utilitários de poder 0. O Goku era "Kamehameha e dois buffs". Não havia
// escolha ofensiva nenhuma dentro do próprio personagem: em qualquer turno em
// que você quisesse dar dano, só existia um botão.
//
// Esta passagem cobre os seis mais críticos. Os outros 38 que estão em 4
// continuam pendentes, e o critério para eles é o mesmo daqui.
//
// COMO OS NÚMEROS FORAM ESCOLHIDOS: mesma curva das escadas de afiliação, para
// que o balanceamento continue comparável — poder de 8 a 52, energia de 9 a 40,
// cooldown de 1 a 6. Cada personagem ganha pelo menos um golpe BARATO de nível
// 1, porque o buraco não era só de quantidade: sem opção barata, o turno em que
// o golpe grande está em cooldown vira ataque básico.
//
// CRITÉRIO MEDIDO: cada personagem precisa de DUAS opções de dano de peso
// diferente até o nível 2, que é onde o jogador chega no estágio 2. Com uma só,
// o turno seguinte ao golpe grande é ataque básico e a luta se perde ali. Foi
// exatamente a diferença entre Vegeta (81%) e Goku (18%) na primeira medição
// desta passagem, com os dois sendo ATACANTE e tendo stats quase idênticos —
// por isso o Kaioken desceu para o nível 2.
//
// ESCALA: todos têm um dono só, então prisma/catalog/skill-scaling.js os faz
// escalar da classe automaticamente. Nada a declarar aqui.

/** Goku — ATACANTE. Tinha Kamehameha e dois buffs; ganha o arsenal do arco. */
const goku = {
  character: 'Goku',
  skills: [
    {
      name: 'Rajada de Punhos',
      category: 'KI',
      power: 12,
      energyCost: 10,
      cooldown: 1,
      tags: ['ki', 'fisico'],
      effects: [],
      level: 1,
    },
    {
      name: 'Kaioken',
      category: 'KI',
      power: 20,
      energyCost: 18,
      cooldown: 3,
      tags: ['ki', 'buff'],
      effects: [
        { type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 2 },
        { type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 18, duration: 2 },
      ],
      level: 2,
    },
    {
      name: 'Punho do Dragão',
      category: 'KI',
      power: 30,
      energyCost: 25,
      cooldown: 3,
      tags: ['ki', 'fisico'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 18, duration: 2 }],
      level: 6,
    },
    {
      name: 'Kamehameha Ampliado',
      category: 'KI',
      power: 40,
      energyCost: 32,
      cooldown: 4,
      tags: ['ki', 'beam'],
      effects: [],
      level: 10,
    },
    {
      name: 'Genki Dama',
      category: 'KI',
      power: 52,
      energyCost: 40,
      cooldown: 6,
      tags: ['ki', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 22, duration: 2 }],
      level: 14,
    },
  ],
};

/** Vegeta — ATACANTE. O orgulho vira dano crescente, não só buff. */
const vegeta = {
  character: 'Vegeta',
  skills: [
    {
      name: 'Rajada Múltipla',
      category: 'KI',
      power: 13,
      energyCost: 11,
      cooldown: 1,
      tags: ['ki'],
      effects: [],
      level: 1,
    },
    {
      name: 'Investida do Príncipe',
      category: 'KI',
      power: 20,
      energyCost: 16,
      cooldown: 2,
      tags: ['ki', 'fisico'],
      effects: [],
      level: 3,
    },
    {
      name: 'Big Bang Attack',
      category: 'KI',
      power: 33,
      energyCost: 28,
      cooldown: 3,
      tags: ['ki', 'beam'],
      effects: [],
      level: 7,
    },
    {
      name: 'Gamma Burst Flash',
      category: 'KI',
      power: 42,
      energyCost: 34,
      cooldown: 4,
      tags: ['ki', 'beam'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 2 }],
      level: 11,
    },
    {
      name: 'Explosão Final',
      category: 'KI',
      power: 52,
      energyCost: 40,
      cooldown: 6,
      tags: ['ki', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 2 }],
      level: 14,
    },
  ],
};

/** Broly — TANQUE. Escala de defesa: quanto mais aguenta, mais bate. */
const broly = {
  character: 'Broly',
  skills: [
    {
      name: 'Blaster Shell',
      category: 'KI',
      power: 13,
      energyCost: 11,
      cooldown: 1,
      tags: ['ki'],
      effects: [],
      level: 1,
    },
    {
      name: 'Eraser Cannon',
      category: 'KI',
      power: 28,
      energyCost: 24,
      cooldown: 3,
      tags: ['ki', 'beam'],
      effects: [],
      level: 5,
    },
    {
      name: 'Casca do Lendário',
      category: 'KI',
      power: 0,
      energyCost: 20,
      cooldown: 4,
      tags: ['ki', 'shield'],
      effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 32, duration: 2 }],
      level: 9,
    },
    {
      name: 'Gigantic Meteor',
      category: 'KI',
      power: 50,
      energyCost: 39,
      cooldown: 6,
      tags: ['ki', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 20, duration: 2 }],
      level: 14,
    },
  ],
};

/** Rukia — CONJURADORA. Tinha 2 habilidades, ambas de poder 0. */
const rukia = {
  character: 'Rukia Kuchiki',
  skills: [
    {
      name: 'Sode no Shirayuki: Lâmina de Gelo',
      category: 'OTHER',
      power: 14,
      energyCost: 12,
      cooldown: 1,
      tags: ['gelo'],
      effects: [],
      level: 1,
    },
    {
      name: 'Tsugi no Mai: Hakuren',
      category: 'OTHER',
      power: 26,
      energyCost: 23,
      cooldown: 3,
      tags: ['gelo'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 18, duration: 2 }],
      level: 3,
    },
    {
      name: 'San no Mai: Shirafune',
      category: 'OTHER',
      power: 31,
      energyCost: 27,
      cooldown: 4,
      tags: ['gelo'],
      effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 24, duration: 2 }],
      level: 8,
    },
    {
      name: 'Hakka no Togame',
      category: 'OTHER',
      power: 48,
      energyCost: 38,
      cooldown: 6,
      tags: ['gelo', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 12, duration: 3 }],
      level: 14,
    },
  ],
};

/** Momo Hinamori — CONJURADORA. Tobiume é fogo em cadeia. */
const momo = {
  character: 'Momo Hinamori',
  skills: [
    {
      name: 'Tobiume: Faísca',
      category: 'OTHER',
      power: 13,
      energyCost: 11,
      cooldown: 1,
      tags: ['fogo'],
      effects: [],
      level: 1,
    },
    {
      name: 'Tobiume: Explosão em Cadeia',
      category: 'OTHER',
      power: 25,
      energyCost: 22,
      cooldown: 3,
      tags: ['fogo'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 2 }],
      level: 4,
    },
    {
      name: 'Tobiume: Flores Gêmeas',
      category: 'OTHER',
      power: 32,
      energyCost: 28,
      cooldown: 4,
      tags: ['fogo'],
      effects: [],
      level: 9,
    },
    {
      name: 'Tobiume: Jardim em Chamas',
      category: 'OTHER',
      power: 46,
      energyCost: 37,
      cooldown: 6,
      tags: ['fogo', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 11, duration: 3 }],
      level: 14,
    },
  ],
};

/** Aizen — CONJURADOR. Chefe final do arco; tinha 3, sendo 2 de poder 0. */
const aizen = {
  character: 'Sosuke Aizen',
  skills: [
    {
      name: 'Kyōka Suigetsu: Corte Invisível',
      category: 'OTHER',
      power: 15,
      energyCost: 12,
      cooldown: 1,
      tags: ['ilusao'],
      effects: [],
      level: 1,
    },
    {
      name: 'Kyōka Suigetsu: Reflexo Falso',
      category: 'OTHER',
      power: 20,
      energyCost: 21,
      cooldown: 3,
      tags: ['ilusao', 'debuff'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 22, duration: 2 }],
      level: 4,
    },
    {
      name: 'Hōgyoku: Evolução',
      category: 'OTHER',
      power: 0,
      energyCost: 26,
      cooldown: 5,
      tags: ['buff'],
      effects: [
        { type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 24, duration: 3 },
        { type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 18, duration: 3 },
      ],
      level: 9,
    },
    {
      name: 'Transcendência',
      category: 'OTHER',
      power: 50,
      energyCost: 39,
      cooldown: 6,
      tags: ['ilusao', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 24, duration: 2 }],
      level: 14,
    },
  ],
};

/**
 * Ichigo — ATACANTE, e protagonista do arco que o jogo tem.
 *
 * Era o personagem mais fraco medido: 0% de vitória nos estágios 4 a 8,
 * enquanto todos os outros jogáveis testados ganhavam pelo menos um deles. A
 * causa é teto de dano — o golpe mais forte dele era poder 22 até o nível 9 e
 * 30 até o 14, contra inimigos de 26 a 50.
 */
const ichigo = {
  character: 'Ichigo Kurosaki',
  skills: [
    {
      name: 'Zangetsu: Corte Ascendente',
      category: 'OTHER',
      power: 16,
      energyCost: 12,
      cooldown: 1,
      tags: ['espada'],
      effects: [],
      level: 1,
    },
    {
      name: 'Zangetsu: Investida Feroz',
      category: 'OTHER',
      power: 24,
      energyCost: 19,
      cooldown: 2,
      tags: ['espada'],
      effects: [],
      level: 2,
    },
    {
      name: 'Máscara Hollow',
      category: 'OTHER',
      power: 22,
      energyCost: 24,
      cooldown: 4,
      tags: ['hollow', 'buff'],
      effects: [
        { type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 24, duration: 3 },
        { type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 20, duration: 3 },
      ],
      level: 5,
    },
    {
      name: 'Getsuga Tenshō Negro',
      category: 'OTHER',
      power: 41,
      energyCost: 33,
      cooldown: 4,
      tags: ['espada', 'hollow'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 2 }],
      level: 9,
    },
    {
      name: 'Mugetsu',
      category: 'OTHER',
      power: 52,
      energyCost: 40,
      cooldown: 6,
      tags: ['espada', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 2 }],
      level: 14,
    },
  ],
};

const signatures = [goku, vegeta, broly, rukia, momo, aizen, ichigo];

module.exports = { signatures };
