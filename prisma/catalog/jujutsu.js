// Kits do elenco de Jujutsu Kaisen.
//
// Segue o critério que saiu da medição em prisma/catalog/signatures.js: DUAS
// opções de dano de peso diferente até o nível 2. Sem isso, o turno seguinte
// ao golpe grande vira ataque básico e a luta se perde ali — foi o que separou
// Vegeta (81%) de Goku (18%) antes daquela correção.
//
// Curva de liberação 1 / 2 / 5 / 9 / 14, e o 14 é o teto porque é onde a
// história recurvada termina o jogador. Os números seguem a mesma escala do
// resto: poder de 14 a 54, energia de 12 a 40, cooldown de 1 a 6.
//
// ESCALA: todos têm um dono só, então skill-scaling.js os liga à classe
// automaticamente — Gojo, Mahito e Jogo em energia; Yuji, Nobara e Sukuna em
// ataque; Megumi em energia por ser INVOCADOR; Hanami em defesa por ser
// TANQUE. Não há nada a declarar aqui.
//
// Domínio (Expansão de Domínio) é sempre o golpe de nível 14: é o ápice da
// técnica de cada um na obra, e o mais caro do kit.

const gojo = {
  character: 'Satoru Gojo',
  skills: [
    {
      name: 'Limitless: Repulsão',
      category: 'OTHER',
      power: 16,
      energyCost: 13,
      cooldown: 1,
      tags: ['maldicao', 'limitless'],
      effects: [],
      level: 1,
    },
    {
      name: 'Técnica Amaldiçoada Azul',
      category: 'OTHER',
      power: 24,
      energyCost: 20,
      cooldown: 2,
      tags: ['maldicao', 'limitless'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 18, duration: 2 }],
      level: 2,
    },
    {
      name: 'Vermelho: Repulsão Invertida',
      category: 'OTHER',
      power: 34,
      energyCost: 28,
      cooldown: 3,
      tags: ['maldicao', 'limitless'],
      effects: [],
      level: 5,
    },
    {
      name: 'Roxo: Imaginário',
      category: 'OTHER',
      power: 46,
      energyCost: 36,
      cooldown: 5,
      tags: ['maldicao', 'limitless'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 22, duration: 2 }],
      level: 9,
    },
    {
      name: 'Expansão de Domínio: Vazio Infinito',
      category: 'OTHER',
      power: 50,
      energyCost: 40,
      cooldown: 6,
      tags: ['maldicao', 'dominio', 'ultimate'],
      effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 1, duration: 1 }],
      level: 14,
    },
  ],
};

const yuji = {
  character: 'Yuji Itadori',
  skills: [
    {
      name: 'Punho Divergente',
      category: 'OTHER',
      power: 17,
      energyCost: 12,
      cooldown: 1,
      tags: ['fisico'],
      effects: [],
      level: 1,
    },
    {
      name: 'Sequência de Golpes',
      category: 'OTHER',
      power: 25,
      energyCost: 19,
      cooldown: 2,
      tags: ['fisico'],
      effects: [],
      level: 2,
    },
    {
      name: 'Chute Amaldiçoado',
      category: 'OTHER',
      power: 33,
      energyCost: 26,
      cooldown: 3,
      tags: ['fisico', 'maldicao'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 16, duration: 2 }],
      level: 5,
    },
    {
      name: 'Impacto Divergente: Segundo Tempo',
      category: 'OTHER',
      power: 43,
      energyCost: 34,
      cooldown: 4,
      tags: ['fisico'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 2 }],
      level: 9,
    },
    {
      name: 'Ressonância de Sukuna',
      category: 'OTHER',
      power: 52,
      energyCost: 40,
      cooldown: 6,
      tags: ['maldicao', 'ultimate'],
      effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 22, duration: 2 }],
      level: 14,
    },
  ],
};

const megumi = {
  character: 'Megumi Fushiguro',
  skills: [
    {
      name: 'Shikigami: Nue',
      category: 'OTHER',
      power: 15,
      energyCost: 13,
      cooldown: 1,
      tags: ['shikigami'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 10, duration: 2 }],
      level: 1,
    },
    {
      name: 'Shikigami: Cães Divinos',
      category: 'OTHER',
      power: 23,
      energyCost: 19,
      cooldown: 2,
      tags: ['shikigami'],
      effects: [],
      level: 2,
    },
    {
      name: 'Shikigami: Sapo Amaldiçoado',
      category: 'OTHER',
      power: 30,
      energyCost: 25,
      cooldown: 3,
      tags: ['shikigami'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 2 }],
      level: 5,
    },
    {
      name: 'Shikigami: Touro Máximo',
      category: 'OTHER',
      power: 42,
      energyCost: 34,
      cooldown: 5,
      tags: ['shikigami'],
      effects: [],
      level: 9,
    },
    {
      name: 'Expansão de Domínio: Jardim Sombrio',
      category: 'OTHER',
      power: 48,
      energyCost: 39,
      cooldown: 6,
      tags: ['shikigami', 'dominio', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 20, duration: 2 }],
      level: 14,
    },
  ],
};

const nobara = {
  character: 'Nobara Kugisaki',
  skills: [
    {
      name: 'Martelo e Prego',
      category: 'OTHER',
      power: 17,
      energyCost: 12,
      cooldown: 1,
      tags: ['fisico', 'maldicao'],
      effects: [],
      level: 1,
    },
    {
      name: 'Ressonância',
      category: 'OTHER',
      power: 25,
      energyCost: 20,
      cooldown: 2,
      tags: ['maldicao'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 6, duration: 2 }],
      level: 2,
    },
    {
      name: 'Boneca de Palha',
      category: 'OTHER',
      power: 32,
      energyCost: 26,
      cooldown: 3,
      tags: ['maldicao'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 9, duration: 3 }],
      level: 5,
    },
    {
      name: 'Ressonância Máxima: Hairpin',
      category: 'OTHER',
      power: 43,
      energyCost: 34,
      cooldown: 4,
      tags: ['maldicao'],
      effects: [],
      level: 9,
    },
    {
      name: 'Prego Negro',
      category: 'OTHER',
      power: 51,
      energyCost: 39,
      cooldown: 6,
      tags: ['maldicao', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 22, duration: 2 }],
      level: 14,
    },
  ],
};

const sukuna = {
  character: 'Ryomen Sukuna',
  skills: [
    {
      name: 'Corte',
      category: 'OTHER',
      power: 18,
      energyCost: 12,
      cooldown: 1,
      tags: ['maldicao'],
      effects: [],
      level: 1,
    },
    {
      name: 'Desmantelar',
      category: 'OTHER',
      power: 26,
      energyCost: 20,
      cooldown: 2,
      tags: ['maldicao'],
      effects: [],
      level: 2,
    },
    {
      name: 'Fenda',
      category: 'OTHER',
      power: 35,
      energyCost: 27,
      cooldown: 3,
      tags: ['maldicao'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 2 }],
      level: 5,
    },
    {
      name: 'Flechas de Fogo',
      category: 'OTHER',
      power: 45,
      energyCost: 35,
      cooldown: 5,
      tags: ['maldicao', 'fogo'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 2 }],
      level: 9,
    },
    {
      name: 'Expansão de Domínio: Santuário Malévolo',
      category: 'OTHER',
      power: 54,
      energyCost: 40,
      cooldown: 6,
      tags: ['maldicao', 'dominio', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 24, duration: 3 }],
      level: 14,
    },
  ],
};

const mahito = {
  character: 'Mahito',
  skills: [
    {
      name: 'Transfiguração Ociosa',
      category: 'OTHER',
      power: 15,
      energyCost: 13,
      cooldown: 1,
      tags: ['maldicao', 'alma'],
      effects: [],
      level: 1,
    },
    {
      name: 'Corpo Distorcido',
      category: 'OTHER',
      power: 23,
      energyCost: 20,
      cooldown: 2,
      tags: ['maldicao', 'alma'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 16, duration: 2 }],
      level: 2,
    },
    {
      name: 'Alma Multiplicada',
      category: 'OTHER',
      power: 31,
      energyCost: 26,
      cooldown: 3,
      tags: ['maldicao', 'alma'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 9, duration: 3 }],
      level: 5,
    },
    {
      name: 'Corpo Espiritual Instantâneo',
      category: 'OTHER',
      power: 40,
      energyCost: 33,
      cooldown: 5,
      tags: ['maldicao', 'buff'],
      effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 22, duration: 2 }],
      level: 9,
    },
    {
      name: 'Expansão de Domínio: Bairro Autoencarnado',
      category: 'OTHER',
      power: 49,
      energyCost: 39,
      cooldown: 6,
      tags: ['maldicao', 'dominio', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 11, duration: 3 }],
      level: 14,
    },
  ],
};

const jogo = {
  character: 'Jogo',
  skills: [
    {
      name: 'Brasa',
      category: 'OTHER',
      power: 16,
      energyCost: 13,
      cooldown: 1,
      tags: ['maldicao', 'fogo'],
      effects: [],
      level: 1,
    },
    {
      name: 'Meteoro Menor',
      category: 'OTHER',
      power: 24,
      energyCost: 20,
      cooldown: 2,
      tags: ['maldicao', 'fogo'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 2 }],
      level: 2,
    },
    {
      name: 'Erupção',
      category: 'OTHER',
      power: 33,
      energyCost: 27,
      cooldown: 3,
      tags: ['maldicao', 'fogo'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 9, duration: 3 }],
      level: 5,
    },
    {
      name: 'Maelstrom',
      category: 'OTHER',
      power: 43,
      energyCost: 35,
      cooldown: 5,
      tags: ['maldicao', 'fogo'],
      effects: [],
      level: 9,
    },
    {
      name: 'Expansão de Domínio: Vulcão Fechado',
      category: 'OTHER',
      power: 50,
      energyCost: 39,
      cooldown: 6,
      tags: ['maldicao', 'dominio', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 12, duration: 3 }],
      level: 14,
    },
  ],
};

const hanami = {
  character: 'Hanami',
  skills: [
    {
      name: 'Broto Amaldiçoado',
      category: 'OTHER',
      power: 15,
      energyCost: 12,
      cooldown: 1,
      tags: ['maldicao', 'natureza'],
      effects: [],
      level: 1,
    },
    {
      name: 'Raízes Estranguladoras',
      category: 'OTHER',
      power: 22,
      energyCost: 19,
      cooldown: 2,
      tags: ['maldicao', 'natureza'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 16, duration: 2 }],
      level: 2,
    },
    {
      name: 'Semente da Morte',
      category: 'OTHER',
      power: 29,
      energyCost: 25,
      cooldown: 3,
      tags: ['maldicao', 'natureza'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 3 }],
      level: 5,
    },
    {
      name: 'Casca de Madeira Viva',
      category: 'OTHER',
      power: 0,
      energyCost: 24,
      cooldown: 4,
      tags: ['maldicao', 'shield'],
      effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 34, duration: 2 }],
      level: 9,
    },
    {
      name: 'Floração Fatal',
      category: 'OTHER',
      power: 47,
      energyCost: 38,
      cooldown: 6,
      tags: ['maldicao', 'natureza', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 11, duration: 3 }],
      level: 14,
    },
  ],
};

const jujutsuKits = [gojo, yuji, megumi, nobara, sukuna, mahito, jogo, hanami];

module.exports = { jujutsuKits };
