// Linha ofensiva e de controle dos SUPORTE.
//
// POR QUE EXISTE: o teto de dano dos seis suportes era 18 a 22 — a Unohana
// chegava a 32, e travado no nível 5 — contra 52 de um ATACANTE. Medido, a
// Orihime ganhava 0% em quase todos os estágios dos dois arcos.
//
// A CAUSA É DE DESENHO, e vale escrever: suporte em LoL e em Marvel Rivals é
// forte porque a saída dele é MULTIPLICADA por 4 ou 5 aliados — a fórmula de
// balanceamento daqueles jogos é "valor altíssimo por recurso, ameaça quase
// zero sozinho". Este jogo é 1v1. Não existe ninguém para apoiar, então
// escudo e cura só faziam a luta durar mais, e com MAX_ROUNDS a luta longa
// que o suporte não fecha vira EMPATE, não vitória.
//
// A stamina (ver schema.prisma) foi a metade defensiva do conserto e não
// bastou: com ela, a taxa de empate ficou em 1,1%, ou seja, a suporte
// sobrevivia mais e seguia sem conseguir fechar. O gargalo nunca foi recurso.
// Esta é a metade ofensiva.
//
// COMO O SUPORTE CAUSA DANO SEM VIRAR ATACANTE:
//
// 1. DEBUFF é a arma principal, em 18 a 22 — na faixa alta do jogo. O suporte
//    não bate mais que o atacante; ele faz o adversário bater menos e
//    defender pior, e é isso que fecha a luta dentro da janela que a
//    sustentação dele compra.
//
// 2. LIFESTEAL amarra a cura a ATACAR. Antes a sustentação era gratuita e
//    passiva, o que empurrava para turtle — que num 1v1 é empate. Agora ela
//    exige entrar na troca.
//
// 3. O poder sobe, mas fica ABAIXO do atacante: 21 / 27 / 34 / 40, contra o
//    52 do topo de um ATACANTE. Emparelhar seria apagar a diferença entre as
//    classes, que é justamente o que o sistema de classe existe para criar.
//
// OS NÚMEROS ACIMA SÃO A SEGUNDA TENTATIVA. A primeira usava poder
// 24/32/42/48, debuffs de 26 a 30 e lifesteal de 40 a 50 — quatro vantagens
// empilhadas de uma vez, e o resultado medido foi o oposto do problema: a
// Orihime saltou de 0% para 88-100% em todos os estágios, ficando MELHOR que
// Ichigo e Vegeta. Fica registrado porque a lição não é o número, é que
// consertar um arquétipo somando quatro alavancas de uma vez impede saber
// qual delas resolveu.
//
// Medido depois do ajuste, média no arco de Bleach: Orihime 85, Batman 80,
// Unohana 71, contra Ichigo 76 e Vegeta 79 — pau a pau, que era o alvo. E
// zero empates em 1260 batalhas simuladas, ou seja, a sustentação não virou
// luta que não fecha.

const orihime = {
  character: 'Orihime Inoue',
  skills: [
    {
      name: 'Koten Zanshun: Corte Duplo',
      category: 'OTHER',
      power: 21,
      energyCost: 19,
      cooldown: 2,
      tags: ['rejeicao'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 18, duration: 2 }],
      level: 2,
    },
    {
      name: 'Shun Shun Rikka: Retorno',
      category: 'OTHER',
      power: 27,
      energyCost: 26,
      cooldown: 3,
      tags: ['rejeicao', 'dreno'],
      effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 32 }],
      level: 5,
    },
    {
      name: 'Rejeição do Evento',
      category: 'OTHER',
      power: 34,
      energyCost: 33,
      cooldown: 4,
      tags: ['rejeicao'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 22, duration: 3 }],
      level: 9,
    },
    {
      name: 'Sōten Kisshun: Negar o Golpe',
      category: 'OTHER',
      power: 40,
      energyCost: 39,
      cooldown: 6,
      tags: ['rejeicao', 'ultimate'],
      effects: [
        { type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 },
        { type: 'LIFESTEAL', target: 'SELF', magnitude: 28 },
      ],
      level: 14,
    },
  ],
};

const unohana = {
  character: 'Retsu Unohana',
  skills: [
    {
      name: 'Minazuki: Lâmina Serena',
      category: 'OTHER',
      power: 22,
      energyCost: 19,
      cooldown: 2,
      tags: ['espada'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 18, duration: 2 }],
      level: 2,
    },
    {
      name: 'A Primeira Kenpachi',
      category: 'OTHER',
      power: 28,
      energyCost: 27,
      cooldown: 3,
      tags: ['espada', 'dreno'],
      effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 35 }],
      level: 5,
    },
    {
      name: 'Corte que Cura e Mata',
      category: 'OTHER',
      power: 35,
      energyCost: 34,
      cooldown: 4,
      tags: ['espada'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 20, duration: 3 }],
      level: 9,
    },
    {
      name: 'Minazuki: Verdadeira Forma',
      category: 'OTHER',
      power: 40,
      energyCost: 39,
      cooldown: 6,
      tags: ['espada', 'ultimate'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 12, duration: 3 }],
      level: 14,
    },
  ],
};

const batman = {
  character: 'Batman',
  skills: [
    {
      name: 'Análise de Padrão',
      category: 'OTHER',
      power: 21,
      energyCost: 18,
      cooldown: 2,
      tags: ['preparo'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 18, duration: 2 }],
      level: 2,
    },
    {
      name: 'Gancho e Queda',
      category: 'OTHER',
      power: 27,
      energyCost: 26,
      cooldown: 3,
      tags: ['preparo'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 20, duration: 2 }],
      level: 5,
    },
    {
      name: 'Plano de Contingência',
      category: 'OTHER',
      power: 34,
      energyCost: 33,
      cooldown: 4,
      tags: ['preparo'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 22, duration: 3 }],
      level: 9,
    },
    {
      name: 'Protocolo Torre de Vigia',
      category: 'OTHER',
      power: 39,
      energyCost: 38,
      cooldown: 6,
      tags: ['preparo', 'ultimate'],
      effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 1, duration: 1 }],
      level: 14,
    },
  ],
};

const wonderWoman = {
  character: 'Wonder Woman',
  skills: [
    {
      name: 'Laço da Verdade: Prender',
      category: 'OTHER',
      power: 21,
      energyCost: 19,
      cooldown: 2,
      tags: ['amazona'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 19, duration: 2 }],
      level: 2,
    },
    {
      name: 'Investida de Themyscira',
      category: 'OTHER',
      power: 28,
      energyCost: 27,
      cooldown: 3,
      tags: ['amazona', 'dreno'],
      effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 28 }],
      level: 5,
    },
    {
      name: 'Golpe da Deusa da Guerra',
      category: 'OTHER',
      power: 35,
      energyCost: 34,
      cooldown: 4,
      tags: ['amazona'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 20, duration: 3 }],
      level: 9,
    },
    {
      name: 'Julgamento das Amazonas',
      category: 'OTHER',
      power: 40,
      energyCost: 39,
      cooldown: 6,
      tags: ['amazona', 'ultimate'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 22, duration: 3 }],
      level: 14,
    },
  ],
};

const rangiku = {
  character: 'Rangiku Matsumoto',
  skills: [
    {
      name: 'Haineko: Cinza nos Olhos',
      category: 'OTHER',
      power: 21,
      energyCost: 19,
      cooldown: 2,
      tags: ['cinza'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 19, duration: 2 }],
      level: 2,
    },
    {
      name: 'Haineko: Tempestade',
      category: 'OTHER',
      power: 27,
      energyCost: 26,
      cooldown: 3,
      tags: ['cinza'],
      effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 9, duration: 3 }],
      level: 5,
    },
    {
      name: 'Haineko: Lâmina de Pó',
      category: 'OTHER',
      power: 34,
      energyCost: 33,
      cooldown: 4,
      tags: ['cinza'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 21, duration: 3 }],
      level: 9,
    },
    {
      name: 'Haineko: Corrosão Total',
      category: 'OTHER',
      power: 39,
      energyCost: 38,
      cooldown: 6,
      tags: ['cinza', 'ultimate'],
      effects: [
        { type: 'DOT', target: 'ENEMY', magnitude: 11, duration: 3 },
        { type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 18, duration: 2 },
      ],
      level: 14,
    },
  ],
};

const ukitake = {
  character: 'Jūshirō Ukitake',
  skills: [
    {
      name: 'Sōgyo no Kotowari: Devolver',
      category: 'OTHER',
      power: 22,
      energyCost: 19,
      cooldown: 2,
      tags: ['gemeas'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 18, duration: 2 }],
      level: 2,
    },
    {
      name: 'Absorver e Retornar',
      category: 'OTHER',
      power: 27,
      energyCost: 26,
      cooldown: 3,
      tags: ['gemeas', 'dreno'],
      effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 32 }],
      level: 5,
    },
    {
      name: 'Corte das Lâminas Gêmeas',
      category: 'OTHER',
      power: 34,
      energyCost: 33,
      cooldown: 4,
      tags: ['gemeas'],
      effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }],
      level: 9,
    },
    {
      name: 'Vontade de Quem Sobrevive',
      category: 'OTHER',
      power: 39,
      energyCost: 38,
      cooldown: 6,
      tags: ['gemeas', 'ultimate'],
      effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 35 }],
      level: 14,
    },
  ],
};

const supportKits = [orihime, unohana, batman, wonderWoman, rangiku, ukitake];

module.exports = { supportKits };
