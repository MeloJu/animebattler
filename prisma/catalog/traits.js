// Traços passivos: o que o personagem É, sempre ligado.
//
// A distinção que justifica a tabela separada: TRANSFORMAÇÃO é estado
// temporário — liga, custa, e cai quando não se sustenta. TRAÇO não se ativa.
// Os Seis Olhos do Gojo não são um botão; ele nasceu com eles. Modelar isso
// como transformação daria a coisa errada na tela e no motor.
//
// energyCostModifier é o que impede o traço de ser só bônus de atributo
// disfarçado: -0.30 significa que TODA habilidade custa 30% menos energia.
// É a leitura correta dos Seis Olhos, que na obra são sobre eficiência de
// energia amaldiçoada, não sobre bater mais forte — o Gojo não vence porque
// dá mais dano, vence porque nunca fica sem gás.
//
// TRAÇO PODE TER LADO RUIM, e o do Kenpachi tem de propósito: reiatsu
// descontrolado dá ataque e tira defesa. Sem nenhum custo em lugar nenhum, o
// sistema vira poder grátis distribuído por gosto.
//
// A maioria é de nível 1 porque nascer com algo não é conquista. As exceções
// são traços que na obra o personagem desenvolve.

const traits = [
  {
    character: 'Satoru Gojo',
    name: 'Seis Olhos',
    description:
      'Enxerga o fluxo de energia amaldiçoada com precisão absoluta, e por isso não desperdiça nem uma gota. Toda técnica custa muito menos.',
    levelRequirement: 1,
    energyCostModifier: -0.3,
    energyModifier: 0.1,
  },
  {
    character: 'Yoruichi Shihoin',
    name: 'Deusa do Shunpo',
    description: 'Ninguém no Seireitei se move mais rápido, e isso não é técnica que se ativa: é como ela anda.',
    levelRequirement: 1,
    speedModifier: 0.12,
  },
  {
    character: 'Kenpachi Zaraki',
    name: 'Reiatsu Descontrolado',
    description:
      'Pressão espiritual bruta demais para ser contida, e ele nunca aprendeu a contê-la. Bate mais forte e se protege pior.',
    levelRequirement: 1,
    attackModifier: 0.12,
    defenseModifier: -0.06,
  },
  {
    character: 'Ulquiorra Cifer',
    name: 'Hierro',
    description: 'A pele de um Arrancar de alto nível já é armadura, sem ele fazer nada para isso.',
    levelRequirement: 1,
    defenseModifier: 0.15,
  },
  {
    character: 'Uryu Ishida',
    name: 'Blut Vene',
    description: 'Reishi corre nas veias e endurece o corpo por dentro. Passivo em um Quincy de sangue.',
    levelRequirement: 1,
    defenseModifier: 0.12,
  },
  {
    character: 'Yuji Itadori',
    name: 'Recipiente de Sukuna',
    description: 'Hospedar o Rei das Maldições regenera o que deveria matar. Ele aguenta o que ninguém aguentaria.',
    levelRequirement: 1,
    // 10, e o número exato importa menos do que parece. Com 18, este traço
    // levava o chefe final do arco de 10% para 82% de vitória; baixar para 10
    // deixou em 82% também. Não é o traço que é forte — é a luta contra o
    // Sukuna que corre no fio, e ali QUALQUER vantagem a decide. Fica
    // registrado porque é fácil olhar o salto e culpar o passivo errado.
    flatHpBonus: 10,
  },
  {
    character: 'Sung Jin Woo',
    name: 'Monarca das Sombras',
    description: 'As sombras respondem sem cobrar o preço cheio. Invocar custa menos para quem manda nelas.',
    levelRequirement: 1,
    energyCostModifier: -0.15,
  },
  {
    character: 'Broly',
    name: 'Fúria Crescente',
    description: 'Quanto mais a luta dura, menos resta do controle. A força vem junto com a perda dele.',
    // Este ele desenvolve, não nasce com: é o descontrole aprendendo a virar arma.
    levelRequirement: 8,
    attackModifier: 0.1,
    flatHpBonus: 10,
  },
];

module.exports = { traits };
