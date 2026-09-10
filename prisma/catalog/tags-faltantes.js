// Tags que faltavam em habilidades antigas.
//
// POR QUE ESTE ARQUIVO EXISTE. A natureza do dano contínuo — queimadura,
// veneno, sangramento, maldição, congelamento, energia espiritual — é lida das
// TAGS da habilidade (ver saborDoDot em app/lib/battle/engine.ts). Habilidade
// sem tag nenhuma cai no ícone genérico, e o jogador vê o mesmo símbolo para
// coisas diferentes.
//
// Estas seis vêm de prisma/seed.js e prisma/catalog/skill-ladders.js e
// nasceram com `tags: []` ou com tags que só descrevem raridade ('ultimate',
// 'meta'), que não dizem nada sobre o que o golpe FAZ. Quatro delas só
// existem no seed, que é destrutivo e nunca roda em banco com jogador — sem
// esta passagem elas ficariam sem sabor para sempre em produção.
//
// AS TAGS SÃO ACRESCENTADAS, NUNCA SUBSTITUÍDAS. Uma habilidade pode ter
// ganhado tags por outro caminho desde então, e apagá-las aqui seria trocar um
// dado ausente por um dado errado.

const tagsFaltantes = [
  // COMBO-TAGS: marcam uma habilidade como CARGA de uma sequência de duas
  // ações. Ver prisma/catalog/mecanicas-de-dano.js para a finalização de
  // cada uma e o porquê da dupla.
  { name: 'Brazo Derecho del Gigante: Carga', category: 'OTHER', tags: ['combo:braco-direito-gigante'] },
  { name: 'Desgarrón', category: 'OTHER', tags: ['combo:desgarron'] },
  { name: 'Suzumushi: Grito', category: 'OTHER', tags: ['combo:suzumushi'] },
  { name: 'Bankai Focus', category: 'OTHER', tags: ['combo:bankai'] },
  { name: 'Ola Azul', category: 'OTHER', tags: ['combo:ola-azul'] },

  // Lâmina e flecha: o dano que continua depois do golpe é sangue.
  { name: 'Glimpse of the True Blade', category: 'OTHER', tags: ['espada'] },
  { name: 'Hihio Zabimaru', category: 'OTHER', tags: ['espada'] },
  { name: 'Senbonzakura: Chire', category: 'OTHER', tags: ['espada'] },
  { name: 'Silver Arrow Barrage', category: 'OTHER', tags: ['quincy', 'pierce'] },
  { name: 'Seele Schneider', category: 'OTHER', tags: ['quincy', 'espada'] },

  // Limite Rompido é o ultimate genérico da escada: quem rompe o próprio
  // limite está se queimando por dentro, que é o que o dano contínuo dele
  // representa.
  { name: 'Limite Rompido', category: 'OTHER', tags: ['ki'] },
];

module.exports = { tagsFaltantes };
