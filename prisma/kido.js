// Kidō de Bleach: 99 Hadō + 99 Bakudō.
//
// A escala canônica vai de 1 a 99 em cada ramo (não 100), mas o Kubo só deu
// nome a cerca de 40 no total — o resto dos números nunca foi revelado. Este
// arquivo então tem duas metades:
//
//   1. CANON_* — os nomeados de verdade, com nome, tradução e efeito escritos
//      à mão para bater com o que a obra mostra.
//   2. Os buracos, preenchidos por gerador determinístico. São conteúdo
//      original do jogo, não lore do Bleach; ficam marcados com canon: false
//      pra essa distinção não se perder.
//
// O gerador é determinístico de propósito (nome e stats derivam só do número):
// rodar o seed duas vezes produz exatamente os mesmos 198 registros, então
// dados de jogadores não mudam de significado entre execuções.

// --- escalas -----------------------------------------------------------
// As constantes abaixo são calibradas pela economia que o resto do jogo já
// usa: as skills seedadas à mão vivem em power 20-36, energyCost 12-34 e
// cooldown 2-5. Um kidō #99 tem que ser o topo dessa faixa, não sair dela —
// escala própria transformaria kidō na única escolha racional e aposentaria
// todo o resto do elenco.
//
// Referência de ancoragem: Hadō #31 Shakkahō estava seedado com power 22, e a
// fórmula devolve 16; Hadō #90 Kurohitsugi estava com 34, a fórmula dá 34.
const hadoPower = (n) => Math.round(7 + n * 0.3);
const hadoCost = (n) => Math.round(9 + n * 0.26);
// Bakudō quase não causa dano: o valor dele está no controle (parar, atrasar,
// blindar). Os seedados à mão têm power 0; aqui sobe pouquíssimo com o número.
const bakudoPower = (n) => Math.round(n * 0.08);
const bakudoCost = (n) => Math.round(10 + n * 0.24);
const cooldownFor = (n) => (n >= 85 ? 5 : n >= 65 ? 4 : n >= 40 ? 3 : n >= 15 ? 2 : 1);

// Efeitos seguem o SkillEffect de app/lib/battle/types.ts.
function hadoEffects(n) {
  const effects = [];
  // Kidō de fogo a partir da faixa média deixa queimadura.
  if (n >= 30) {
    effects.push({ type: 'DOT', target: 'ENEMY', magnitude: Math.round(3 + n / 12), duration: n >= 70 ? 3 : 2 });
  }
  // Os de altíssimo nível também abalam a defesa do alvo.
  if (n >= 75) {
    effects.push({ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: Math.min(25, Math.round(n / 4)), duration: 2 });
  }
  return effects;
}

function bakudoEffects(n) {
  const effects = [];
  if (n >= 55) {
    // Prisão de verdade: perde o turno.
    effects.push({ type: 'STUN', target: 'ENEMY', magnitude: 1, duration: n >= 85 ? 2 : 1 });
  } else {
    // Amarras leves só atrasam.
    effects.push({ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: Math.min(30, Math.round(6 + n * 0.3)), duration: 2 });
  }
  // Da metade pra cima o conjurante também ganha barreira.
  if (n >= 45) {
    effects.push({ type: 'SHIELD', target: 'SELF', magnitude: Math.round(12 + n * 0.28), duration: 2 });
  }
  return effects;
}

// --- kidō canônicos ----------------------------------------------------
// Fontes: mangá, anime, databooks e as light novels (o Hadō #99
// Goryūtenmetsu, por exemplo, vem de *Can't Fear Your Own World*).
const CANON_HADO = {
  1: ['Shō', 'Thrust'],
  4: ['Byakurai', 'Pale Lightning'],
  11: ['Tsuzuri Raiden', 'Bound Lightning'],
  31: ['Shakkahō', 'Red Flame Cannon'],
  32: ['Ōkasen', 'Yellow Fire Flash'],
  33: ['Sōkatsui', 'Blue Fire, Crash Down'],
  54: ['Haien', 'Abolishing Flames'],
  57: ['Daichi Tenyō', 'Great Earth Heaven Support'],
  58: ['Tenran', 'Orchid Sky'],
  63: ['Raikōhō', 'Thunder Roar Cannon'],
  73: ['Sōren Sōkatsui', 'Twin Lotus Blue Fire, Crash Down'],
  78: ['Zangerin', 'Slaughtering Wheel'],
  88: ['Hiryū Gekizoku Shinten Raihō', 'Flying Dragon Strike, Heaven Shaking Lightning Cannon'],
  90: ['Kurohitsugi', 'Black Coffin'],
  91: ['Senjū Kōten Taihō', 'Thousand Hand Bright Heaven Culling-Sphere Cannon'],
  96: ['Ittō Kasō', 'Single Blade Cremation'],
  99: ['Goryūtenmetsu', 'Five Swirling Dragons of Destruction'],
};

// Terceiro elemento opcional: efeitos escritos à mão, usados quando a fórmula
// contradiz o que o kidō faz na obra. Bakudō sofre mais com isso porque o ramo
// mistura amarras, barreiras e utilidades — a fórmula só sabe amarrar, e daria
// stun ao Dankū, que é uma parede, e lentidão ao Enkōsen, que é um escudo.
// Magnitudes na mesma faixa dos escudos já seedados à mão (~30).
const shield = (m) => [{ type: 'SHIELD', target: 'SELF', magnitude: m, duration: 2 }];
const stun = (d) => [{ type: 'STUN', target: 'ENEMY', magnitude: 1, duration: d }];
const hasten = (m) => [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: m, duration: 3 }];

const CANON_BAKUDO = {
  1: ['Sai', 'Restrain'],
  4: ['Hainawa', 'Crawling Rope'],
  8: ['Seki', 'Repulse', [{ type: 'COUNTER', target: 'SELF', magnitude: 40, duration: 2 }]],
  // O nº 9 tem dois kidō canônicos (Gekī e Hōrin). Mantido Hōrin porque é o
  // mais mostrado; a duplicidade é uma inconsistência da própria obra.
  9: ['Hōrin', 'Disintegrating Circle'],
  12: ['Fushibi', 'Hidden Ambush'],
  21: ['Sekienton', 'Red Smoke Escape', hasten(25)],
  26: ['Kyokkō', 'Curved Light', hasten(20)],
  30: ['Shitotsu Sansen', 'Beak-Piercing Triple Beam'],
  37: ['Tsuriboshi', 'Suspending Star', shield(22)],
  39: ['Enkōsen', 'Round Lock Fan', shield(26)],
  // Rastreamento puro: não tem efeito de combate, e forçar um seria inventar.
  58: ['Kakushitsuijaku', 'Seeker of Concealed Truth', []],
  61: ['Rikujōkōrō', 'Six Rods Prison of Light', stun(1)],
  62: ['Hyapporankan', 'Hundred Steps Fence', stun(1)],
  63: ['Sajō Sabaku', 'Locking Bondage Stripes', stun(2)],
  73: ['Tozanshō', 'Inverse Mountain Crystal', shield(34)],
  75: ['Gochūtekkan', 'Quintet of Iron Pillars', stun(2)],
  // Comunicação a longa distância — também sem efeito de combate.
  77: ['Tenteikūra', 'Heavenly Wind Encirclement', []],
  79: ['Kuyō Shibari', 'Nine Sunlight Traps', stun(2)],
  81: ['Dankū', 'Splitting Void', shield(42)],
  99: ['Kin', 'Seal', stun(3)],
};

// --- gerador dos números não revelados ---------------------------------
// Nomes montados a partir de elementos reais (fogo/raio/luz pra Hadō,
// corrente/muro/selo pra Bakudō) em vez de sílabas aleatórias, pra não
// destoar dos canônicos. Índices derivam do número: mesma entrada sempre.
const HADO_PREFIX = ['Ka', 'Rai', 'Byak', 'Sō', 'Gō', 'Hi', 'Zan', 'Ryū', 'Ten', 'Jin', 'Shak', 'Ei'];
const HADO_SUFFIX = ['hō', 'en', 'rai', 'kō', 'zan', 'sen', 'ha', 'rin', 'tō'];
const HADO_MEANING = ['Cannon', 'Flame', 'Lightning', 'Light', 'Slash', 'Flash', 'Wave', 'Wheel', 'Blade'];

const BAKUDO_PREFIX = ['Sa', 'Jō', 'Kū', 'Tei', 'Rō', 'Heki', 'Ban', 'Kin', 'Shō', 'Tō', 'Gen', 'Retsu'];
const BAKUDO_SUFFIX = ['jō', 'saku', 'heki', 'ryū', 'kan', 'sen', 'bari', 'tei', 'mon'];
const BAKUDO_MEANING = ['Lock', 'Bind', 'Wall', 'Current', 'Ring', 'Line', 'Fetter', 'Seal', 'Gate'];

function generated(n, prefixes, suffixes, meanings) {
  // Os multiplicadores primos evitam que prefixo e sufixo andem em fase e
  // repitam combinações a cada poucos números.
  const name = prefixes[(n * 5) % prefixes.length] + suffixes[(n * 7) % suffixes.length];
  const meaning = meanings[(n * 7) % meanings.length];
  return [name, meaning];
}

function buildBranch({ category, canon, prefixes, suffixes, meanings, power, cost, effects }) {
  const spells = [];
  for (let n = 1; n <= 99; n++) {
    const isCanon = Boolean(canon[n]);
    const [name, translation, effectsOverride] = isCanon ? canon[n] : generated(n, prefixes, suffixes, meanings);
    const label = category === 'HADO' ? 'Hadō' : 'Bakudō';
    spells.push({
      number: n,
      canon: isCanon,
      // O número entra no nome porque os canônicos repetem elementos entre si
      // e Skill tem @@unique([name, category]) — sem ele, colidiriam.
      name: `${label} #${n}: ${name}`,
      description: `${translation}. ${isCanon ? 'Kidō canônico de Bleach.' : 'Kidō original — este número nunca foi revelado na obra.'}`,
      category,
      power: power(n),
      energyCost: cost(n),
      cooldown: cooldownFor(n),
      tags: [category.toLowerCase(), 'kido', isCanon ? 'canon' : 'original'],
      effects: effectsOverride ?? effects(n),
    });
  }
  return spells;
}

const hado = buildBranch({
  category: 'HADO',
  canon: CANON_HADO,
  prefixes: HADO_PREFIX,
  suffixes: HADO_SUFFIX,
  meanings: HADO_MEANING,
  power: hadoPower,
  cost: hadoCost,
  effects: hadoEffects,
});

const bakudo = buildBranch({
  category: 'BAKUDO',
  canon: CANON_BAKUDO,
  prefixes: BAKUDO_PREFIX,
  suffixes: BAKUDO_SUFFIX,
  meanings: BAKUDO_MEANING,
  power: bakudoPower,
  cost: bakudoCost,
  effects: bakudoEffects,
});

module.exports = { hado, bakudo, all: [...hado, ...bakudo] };
