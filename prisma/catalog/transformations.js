// Transformações, extraídas do seed para virarem catálogo sincronizável.
//
// POR QUE SAIU DO SEED: elas estavam embutidas em prisma/seed.js, que é
// destrutivo e só roda em banco vazio. Isso significava que ajustar uma
// transformação em produção era impossível sem apagar jogador. Como as
// próximas — sharingan, portões, selo amaldiçoado, bankai — são muitas, o
// caminho tinha que ser o mesmo dos outros catálogos.
//
// OS NÍVEIS FORAM CORTADOS PELA METADE. Os originais iam de 10 a 70, contra
// uma economia de XP que terminava no nível 14: doze das quinze eram conteúdo
// que ninguém jamais veria. É o mesmo defeito que já apareceu nas escadas de
// afiliação (iam ao 40) e nos kits de assinatura (iam ao 30).
//
// A conta que sustenta o corte: com os DOIS arcos de história, um jogador que
// termina os dois soma 18.200 XP, o que pela curva 50·L·(L−1) o põe no nível
// 19. Depois do corte, sete das quinze cabem nisso — Super Saiyan no 5, SS2 e
// Wrathful no 10, SS3 no 15, SS4 no 18. As de cima (20 a 35) seguem
// aspiracionais de propósito, e passam a ser alcançáveis conforme entrarem
// mais arcos, PvP e recompensa de batalha contra IA.
//
// A chave natural é (personagem, nome): o mesmo nome não se repete para o
// mesmo personagem, e é o que o sync usa para não duplicar.

const transformations = [
  // ---- Goku ----
  {
    character: 'Goku',
    name: 'Super Saiyan',
    levelRequirement: 5,
    attackModifier: 0.15,
    speedModifier: 0.05,
    energyModifier: -0.05,
  },
  {
    character: 'Goku',
    name: 'Super Saiyan 2',
    levelRequirement: 10,
    attackModifier: 0.25,
    speedModifier: 0.1,
    energyModifier: -0.1,
  },
  {
    character: 'Goku',
    name: 'Super Saiyan 3',
    levelRequirement: 15,
    attackModifier: 0.35,
    speedModifier: 0.15,
    energyModifier: -0.2,
    // Dreno é o preço da forma: ela cai sozinha quando a energia não sustenta
    // mais (ver engine.ts, tickTransformationDrain).
    drainPerTurn: 10,
  },
  {
    character: 'Goku',
    name: 'Super Saiyan God',
    levelRequirement: 23,
    attackModifier: 0.2,
    defenseModifier: 0.2,
    speedModifier: 0.1,
    energyModifier: 0.1,
  },
  {
    character: 'Goku',
    name: 'Super Saiyan Blue',
    levelRequirement: 28,
    attackModifier: 0.25,
    defenseModifier: 0.2,
    speedModifier: 0.15,
    energyModifier: 0.15,
    unlocksSkill: { name: 'Spirit Bomb', category: 'KI' },
  },
  {
    character: 'Goku',
    name: 'Ultra Instinct',
    levelRequirement: 35,
    defenseModifier: 0.25,
    speedModifier: 0.3,
    triggerType: 'LOW_HP',
    triggerPayload: { threshold: 0.35 },
  },

  // ---- Vegeta ----
  {
    character: 'Vegeta',
    name: 'Super Saiyan',
    levelRequirement: 5,
    attackModifier: 0.14,
    speedModifier: 0.04,
    energyModifier: -0.05,
  },
  {
    character: 'Vegeta',
    name: 'Super Saiyan 2',
    levelRequirement: 10,
    attackModifier: 0.24,
    speedModifier: 0.08,
    energyModifier: -0.1,
  },
  {
    character: 'Vegeta',
    name: 'Super Saiyan 4',
    levelRequirement: 18,
    attackModifier: 0.32,
    defenseModifier: 0.1,
    speedModifier: 0.12,
    energyModifier: -0.15,
  },
  {
    character: 'Vegeta',
    name: 'Super Saiyan God',
    levelRequirement: 23,
    attackModifier: 0.22,
    defenseModifier: 0.18,
    speedModifier: 0.1,
    energyModifier: 0.1,
  },
  {
    character: 'Vegeta',
    name: 'Super Saiyan Blue',
    levelRequirement: 28,
    attackModifier: 0.27,
    defenseModifier: 0.2,
    speedModifier: 0.12,
    energyModifier: 0.12,
    unlocksSkill: { name: 'Final Flash', category: 'KI' },
  },
  {
    character: 'Vegeta',
    name: 'Ultra Ego',
    levelRequirement: 33,
    attackModifier: 0.35,
    defenseModifier: 0.05,
    energyModifier: 0.2,
    triggerType: 'ON_DAMAGE_TAKEN',
    triggerPayload: { stacks: 3, bonusPerStack: 0.05 },
    drainPerTurn: 5,
  },

  // ---- Broly ----
  {
    character: 'Broly',
    name: 'Wrathful',
    levelRequirement: 10,
    attackModifier: 0.2,
    defenseModifier: 0.1,
    triggerType: 'ON_DAMAGE_TAKEN',
  },
  {
    character: 'Broly',
    name: 'Legendary Super Saiyan',
    levelRequirement: 20,
    attackModifier: 0.4,
    defenseModifier: 0.2,
    speedModifier: 0.1,
    energyModifier: -0.1,
    drainPerTurn: 8,
  },
  {
    character: 'Broly',
    name: 'Full Power',
    levelRequirement: 28,
    attackModifier: 0.5,
    defenseModifier: 0.25,
    speedModifier: 0.15,
    triggerType: 'LOW_HP',
    triggerPayload: { threshold: 0.3 },
  },
];

module.exports = { transformations };
