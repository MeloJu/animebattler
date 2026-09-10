const { PrismaClient } = require('@prisma/client');
const storyCatalog = require('./catalog/story');
const equipmentCatalog = require('./catalog/equipment');
const crypto = require('crypto');
const characterImages = require('./character-images');
const kido = require('./kido');
const prisma = new PrismaClient();

// Mirrors app/lib/password.ts's hashPassword format (scrypt:salt:hash) so seeded
// accounts can log in through the normal verifyPassword() path.
async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString('hex');
  const derivedKey = await new Promise((resolve, reject) => {
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) reject(err);
      else resolve(derivedKey);
    });
  });
  return `scrypt:${salt}:${derivedKey.toString('hex')}`;
}

async function main() {
  // ⚠️ Este seed é DESTRUTIVO: os deleteMany() abaixo apagam usuários, sessões,
  // batalhas e todo o progresso antes de repovoar o catálogo. Em dev é o
  // comportamento desejado (banco limpo a cada seed). Em produção seria perda
  // total dos dados dos jogadores — por isso ele se recusa a rodar lá.
  //
  // O caso legítimo em produção é um só: popular o catálogo logo após o
  // primeiro deploy, com o banco ainda vazio. Aí sim, conscientemente:
  //   docker compose -f docker-compose.prod.yml exec -e SEED_FORCE=true app npm run prisma:seed
  if (process.env.NODE_ENV === 'production' && process.env.SEED_FORCE !== 'true') {
    console.error(
      '\n✖ Seed abortado: NODE_ENV=production.\n' +
      '  Este script apaga TODOS os usuários, sessões e batalhas antes de repovoar.\n' +
      '  Se o banco está vazio (primeiro deploy) e você quer mesmo rodar, use SEED_FORCE=true.\n'
    );
    process.exit(1);
  }

  const doomedUsers = await prisma.user.count();
  if (doomedUsers > 0) {
    console.warn(`⚠ Apagando ${doomedUsers} usuário(s) existente(s) e todo o progresso associado.`);
  }

  // Clear existing data (dev only)
  await prisma.userEquipment.deleteMany();
  await prisma.userStoryProgress.deleteMany();
  await prisma.turn.deleteMany();
  await prisma.battle.deleteMany();
  await prisma.userSkillUnlock.deleteMany();
  await prisma.userCharacterTransformation.deleteMany();
  await prisma.userCharacterEquippedSkill.deleteMany();
  await prisma.userCharacterSkill.deleteMany();
  await prisma.userCharacter.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skillTreeNode.deleteMany();
  await prisma.characterSkill.deleteMany();
  await prisma.transformation.deleteMany();
  await prisma.monsterSkill.deleteMany();
  // Antes de monster/skill/character: StoryStage aponta pros três.
  await prisma.storyStage.deleteMany();
  await prisma.storyChapter.deleteMany();
  await prisma.monster.deleteMany();
  await prisma.equipment.deleteMany();
  await prisma.skill.deleteMany();
  await prisma.character.deleteMany();
  await prisma.affiliation.deleteMany();
  await prisma.anime.deleteMany();

  const naruto = await prisma.anime.create({ data: { name: 'Naruto', slug: 'naruto' } });
  const bleach = await prisma.anime.create({ data: { name: 'Bleach', slug: 'bleach' } });
  const dbz = await prisma.anime.create({ data: { name: 'Dragon Ball Z', slug: 'dragon-ball-z' } });
  const marvel = await prisma.anime.create({ data: { name: 'Marvel Universe', slug: 'marvel-universe' } });
  const dc = await prisma.anime.create({ data: { name: 'DC Universe', slug: 'dc-universe' } });

  const leaf = await prisma.affiliation.create({ data: { name: 'Leaf', animeId: naruto.id } });
  const soulSociety = await prisma.affiliation.create({ data: { name: 'Soul Society', animeId: bleach.id } });
  const saiyan = await prisma.affiliation.create({ data: { name: 'Saiyan', animeId: dbz.id } });
  const avengers = await prisma.affiliation.create({ data: { name: 'Avengers', animeId: marvel.id } });
  const xMen = await prisma.affiliation.create({ data: { name: 'X-Men', animeId: marvel.id } });
  const justiceLeague = await prisma.affiliation.create({ data: { name: 'Justice League', animeId: dc.id } });
  const quincy = await prisma.affiliation.create({ data: { name: 'Quincy', animeId: bleach.id } });
  const karakuraTown = await prisma.affiliation.create({ data: { name: 'Karakura Town', animeId: bleach.id } });
  const espadaAffiliation = await prisma.affiliation.create({ data: { name: 'Espada', animeId: bleach.id } });

  const [narutoChar, sasuke, ichigo, rukia, goku, vegeta, broly, daredevil, batman, jeanGrey, emmaFrost, superman, wonderWoman] =
    await Promise.all([
      prisma.character.create({ data: { name: 'Naruto Uzumaki', slug: 'naruto-uzumaki', animeId: naruto.id, affiliationId: leaf.id, hp: 120, attack: 14, defense: 10, speed: 12, energy: 110, imageUrl: characterImages['naruto-uzumaki'] || null } }),
      prisma.character.create({ data: { name: 'Sasuke Uchiha', slug: 'sasuke-uchiha', animeId: naruto.id, affiliationId: leaf.id, hp: 110, attack: 16, defense: 10, speed: 13, energy: 110, imageUrl: characterImages['sasuke-uchiha'] || null } }),
      prisma.character.create({ data: { name: 'Ichigo Kurosaki', slug: 'ichigo-kurosaki', animeId: bleach.id, affiliationId: soulSociety.id, hp: 130, attack: 18, defense: 11, speed: 12, energy: 100, imageUrl: characterImages['ichigo-kurosaki'] || null } }),
      prisma.character.create({ data: { name: 'Rukia Kuchiki', slug: 'rukia-kuchiki', animeId: bleach.id, affiliationId: soulSociety.id, hp: 105, attack: 12, defense: 10, speed: 14, energy: 115, imageUrl: characterImages['rukia-kuchiki'] || null } }),
      prisma.character.create({ data: { name: 'Goku', slug: 'goku', animeId: dbz.id, affiliationId: saiyan.id, hp: 150, attack: 20, defense: 12, speed: 14, energy: 120, imageUrl: characterImages['goku'] || null } }),
      prisma.character.create({ data: { name: 'Vegeta', slug: 'vegeta', animeId: dbz.id, affiliationId: saiyan.id, hp: 145, attack: 19, defense: 12, speed: 14, energy: 120, imageUrl: characterImages['vegeta'] || null } }),
      prisma.character.create({ data: { name: 'Broly', slug: 'broly', animeId: dbz.id, affiliationId: saiyan.id, hp: 180, attack: 23, defense: 14, speed: 13, energy: 140, imageUrl: characterImages['broly'] || null } }),
      prisma.character.create({ data: { name: 'Daredevil', slug: 'daredevil', animeId: marvel.id, affiliationId: avengers.id, hp: 115, attack: 17, defense: 11, speed: 15, energy: 90, imageUrl: characterImages['daredevil'] || null } }),
      prisma.character.create({ data: { name: 'Batman', slug: 'batman', animeId: dc.id, affiliationId: justiceLeague.id, hp: 125, attack: 16, defense: 12, speed: 13, energy: 95, imageUrl: characterImages['batman'] || null } }),
      prisma.character.create({ data: { name: 'Jean Grey', slug: 'jean-grey', animeId: marvel.id, affiliationId: xMen.id, hp: 110, attack: 22, defense: 10, speed: 12, energy: 140, imageUrl: characterImages['jean-grey'] || null } }),
      prisma.character.create({ data: { name: 'Emma Frost', slug: 'emma-frost', animeId: marvel.id, affiliationId: xMen.id, hp: 115, attack: 18, defense: 13, speed: 11, energy: 130, imageUrl: characterImages['emma-frost'] || null } }),
      prisma.character.create({ data: { name: 'Superman', slug: 'superman', animeId: dc.id, affiliationId: justiceLeague.id, hp: 200, attack: 24, defense: 18, speed: 16, energy: 160, imageUrl: characterImages['superman'] || null } }),
      prisma.character.create({ data: { name: 'Wonder Woman', slug: 'wonder-woman', animeId: dc.id, affiliationId: justiceLeague.id, hp: 170, attack: 21, defense: 15, speed: 15, energy: 130, imageUrl: characterImages['wonder-woman'] || null } }),
    ]);

  // Full Bleach roster expansion: Gotei 13 captains/lieutenants, human allies,
  // all 10 Espada, and the main Quincy cast. Each gets a themed 4-skill kit
  // (the "flagship" ones below keep the richer 5-skill kits already designed).
  const bleachCharacterDefs = [
    // Gotei 13 captains & lieutenants (Soul Society)
    { name: 'Yamamoto Genryūsai', slug: 'yamamoto-genryusai', animeId: bleach.id, affiliationId: soulSociety.id, hp: 150, attack: 28, defense: 18, speed: 10, energy: 140 },
    { name: 'Shunsui Kyōraku', slug: 'shunsui-kyoraku', animeId: bleach.id, affiliationId: soulSociety.id, hp: 120, attack: 20, defense: 13, speed: 15, energy: 115 },
    { name: 'Jūshirō Ukitake', slug: 'jushiro-ukitake', animeId: bleach.id, affiliationId: soulSociety.id, hp: 110, attack: 19, defense: 12, speed: 14, energy: 115 },
    { name: 'Suì-Fēng', slug: 'sui-feng', animeId: bleach.id, affiliationId: soulSociety.id, hp: 100, attack: 20, defense: 10, speed: 18, energy: 100 },
    { name: 'Mayuri Kurotsuchi', slug: 'mayuri-kurotsuchi', animeId: bleach.id, affiliationId: soulSociety.id, hp: 105, attack: 17, defense: 11, speed: 11, energy: 120 },
    { name: 'Sajin Komamura', slug: 'sajin-komamura', animeId: bleach.id, affiliationId: soulSociety.id, hp: 155, attack: 21, defense: 20, speed: 9, energy: 110 },
    { name: 'Gin Ichimaru', slug: 'gin-ichimaru', animeId: bleach.id, affiliationId: soulSociety.id, hp: 110, attack: 21, defense: 11, speed: 16, energy: 105 },
    { name: 'Kaname Tosen', slug: 'kaname-tosen', animeId: bleach.id, affiliationId: soulSociety.id, hp: 108, attack: 19, defense: 13, speed: 13, energy: 110 },
    { name: 'Rangiku Matsumoto', slug: 'rangiku-matsumoto', animeId: bleach.id, affiliationId: soulSociety.id, hp: 112, attack: 18, defense: 11, speed: 14, energy: 110 },
    { name: 'Momo Hinamori', slug: 'momo-hinamori', animeId: bleach.id, affiliationId: soulSociety.id, hp: 95, attack: 16, defense: 9, speed: 13, energy: 130 },
    { name: 'Izuru Kira', slug: 'izuru-kira', animeId: bleach.id, affiliationId: soulSociety.id, hp: 100, attack: 17, defense: 11, speed: 12, energy: 105 },
    { name: 'Kisuke Urahara', slug: 'kisuke-urahara', animeId: bleach.id, affiliationId: soulSociety.id, hp: 120, attack: 22, defense: 13, speed: 15, energy: 130 },
    { name: 'Retsu Unohana', slug: 'retsu-unohana', animeId: bleach.id, affiliationId: soulSociety.id, hp: 130, attack: 22, defense: 14, speed: 13, energy: 120 },
    { name: 'Sosuke Aizen', slug: 'sosuke-aizen', animeId: bleach.id, affiliationId: soulSociety.id, hp: 140, attack: 25, defense: 16, speed: 15, energy: 150 },
    { name: 'Byakuya Kuchiki', slug: 'byakuya-kuchiki', animeId: bleach.id, affiliationId: soulSociety.id, hp: 115, attack: 20, defense: 14, speed: 16, energy: 120 },
    { name: 'Toshiro Hitsugaya', slug: 'toshiro-hitsugaya', animeId: bleach.id, affiliationId: soulSociety.id, hp: 105, attack: 18, defense: 12, speed: 17, energy: 125 },
    { name: 'Kenpachi Zaraki', slug: 'kenpachi-zaraki', animeId: bleach.id, affiliationId: soulSociety.id, hp: 160, attack: 26, defense: 8, speed: 11, energy: 90 },
    { name: 'Renji Abarai', slug: 'renji-abarai', animeId: bleach.id, affiliationId: soulSociety.id, hp: 120, attack: 19, defense: 12, speed: 13, energy: 105 },
    { name: 'Yoruichi Shihoin', slug: 'yoruichi-shihoin', animeId: bleach.id, affiliationId: soulSociety.id, hp: 110, attack: 19, defense: 11, speed: 20, energy: 115 },

    // Human allies (Karakura Town)
    { name: 'Orihime Inoue', slug: 'orihime-inoue', animeId: bleach.id, affiliationId: karakuraTown.id, hp: 100, attack: 10, defense: 9, speed: 11, energy: 130 },
    { name: 'Chad', slug: 'chad', animeId: bleach.id, affiliationId: karakuraTown.id, hp: 135, attack: 23, defense: 16, speed: 10, energy: 85 },

    // Quincy
    { name: 'Uryu Ishida', slug: 'uryu-ishida', animeId: bleach.id, affiliationId: quincy.id, hp: 105, attack: 21, defense: 10, speed: 15, energy: 110 },
    { name: 'Yhwach', slug: 'yhwach', animeId: bleach.id, affiliationId: quincy.id, hp: 160, attack: 28, defense: 18, speed: 16, energy: 150 },
    { name: 'Ryuken Ishida', slug: 'ryuken-ishida', animeId: bleach.id, affiliationId: quincy.id, hp: 108, attack: 22, defense: 13, speed: 15, energy: 110 },
    { name: 'Bazz-B', slug: 'bazz-b', animeId: bleach.id, affiliationId: quincy.id, hp: 115, attack: 23, defense: 11, speed: 16, energy: 115 },
    { name: 'As Nödt', slug: 'as-nodt', animeId: bleach.id, affiliationId: quincy.id, hp: 100, attack: 18, defense: 10, speed: 14, energy: 115 },

    // Espada (all 10)
    { name: 'Coyote Starrk', slug: 'coyote-starrk', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 140, attack: 23, defense: 14, speed: 16, energy: 130 },
    { name: 'Baraggan Luisenbarn', slug: 'baraggan-luisenbarn', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 145, attack: 20, defense: 17, speed: 8, energy: 115 },
    { name: 'Tia Harribel', slug: 'tia-harribel', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 125, attack: 22, defense: 16, speed: 15, energy: 120 },
    { name: 'Ulquiorra Cifer', slug: 'ulquiorra-cifer', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 135, attack: 25, defense: 15, speed: 14, energy: 120 },
    { name: 'Nnoitra Gilga', slug: 'nnoitra-gilga', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 130, attack: 27, defense: 10, speed: 15, energy: 100 },
    { name: 'Grimmjow Jaegerjaquez', slug: 'grimmjow-jaegerjaquez', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 130, attack: 24, defense: 11, speed: 17, energy: 110 },
    { name: 'Zommari Rureaux', slug: 'zommari-rureaux', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 115, attack: 20, defense: 13, speed: 19, energy: 105 },
    { name: 'Szayelaporro Granz', slug: 'szayelaporro-granz', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 110, attack: 18, defense: 12, speed: 13, energy: 130 },
    { name: 'Aaroniero Arruruerie', slug: 'aaroniero-arruruerie', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 150, attack: 19, defense: 15, speed: 10, energy: 120 },
    { name: 'Yammy Llargo', slug: 'yammy-llargo', animeId: bleach.id, affiliationId: espadaAffiliation.id, hp: 175, attack: 25, defense: 14, speed: 8, energy: 100 },
  ];
  const createdBleachChars = await prisma.$transaction(
    bleachCharacterDefs.map((c) => prisma.character.create({ data: { ...c, imageUrl: characterImages[c.slug] || null } }))
  );
  const charByName = Object.fromEntries(createdBleachChars.map((c, i) => [bleachCharacterDefs[i].name, c]));

  // Skills. Each character gets a small kit spanning damage, buff, debuff/DOT/stun
  // and (mostly) a counter or heal, so every build has options beyond "attack".
  // Effect shape: { type: BUFF|DEBUFF|DOT|STUN|COUNTER|SHIELD|HEAL|LIFESTEAL, target: SELF|ENEMY, stat?, magnitude, duration? }
  const skillDefs = [
    // Naruto Uzumaki
    { name: 'Rasengan', category: 'NINJUTSU', power: 24, energyCost: 20, cooldown: 2, tags: ['burst', 'knockback'], effects: [] },
    { name: 'Shadow Clone Barrage', category: 'NINJUTSU', power: 20, energyCost: 18, cooldown: 2, tags: ['multi-hit'], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 20 }] },
    { name: 'Nine-Tails Chakra Cloak', category: 'NINJUTSU', power: 0, energyCost: 20, cooldown: 4, tags: ['chakra'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 15, duration: 3 }] },
    { name: 'Uzumaki Barrier', category: 'NINJUTSU', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 35, duration: 3 }] },

    // Sasuke Uchiha
    { name: 'Chidori', category: 'NINJUTSU', power: 26, energyCost: 22, cooldown: 2, tags: ['pierce', 'crit'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 6, duration: 2 }] },
    { name: 'Sharingan Insight', category: 'GENJUTSU', power: 0, energyCost: 14, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Fire Style: Fireball', category: 'NINJUTSU', power: 18, energyCost: 16, cooldown: 2, tags: ['burn'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 3 }] },
    { name: 'Amaterasu', category: 'NINJUTSU', power: 32, energyCost: 34, cooldown: 5, tags: ['burn', 'ultimate'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 3 }] },

    // Ichigo Kurosaki
    { name: 'Getsuga Tenshō', category: 'OTHER', power: 30, energyCost: 26, cooldown: 3, tags: ['ultimate'], effects: [] },
    { name: 'Bankai Focus', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 2 }, { type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 15, duration: 2 }] },
    { name: 'Zangetsu Parry', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },

    // Rukia Kuchiki
    { name: 'Sode no Shirayuki: Some Snow', category: 'OTHER', power: 0, energyCost: 14, cooldown: 3, tags: ['ice', 'debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 20, duration: 3 }] },
    { name: 'Dance of the White Moon', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['ice', 'shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 30, duration: 3 }] },

    // Goku
    { name: 'Kamehameha', category: 'KI', power: 28, energyCost: 25, cooldown: 3, tags: ['beam'], effects: [] },
    { name: 'Spirit Bomb', category: 'KI', power: 35, energyCost: 40, cooldown: 5, tags: ['charge', 'aoe'], effects: [] },
    { name: 'Power Up', category: 'KI', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: 'Instant Transmission Counter', category: 'KI', power: 0, energyCost: 18, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 50, duration: 2 }] },

    // Vegeta
    { name: 'Galick Gun', category: 'KI', power: 27, energyCost: 24, cooldown: 3, tags: ['beam'], effects: [] },
    { name: 'Saiyan Onslaught', category: 'KI', power: 18, energyCost: 16, cooldown: 2, tags: ['ruthless'], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 20 }] },
    { name: 'Final Flash', category: 'KI', power: 34, energyCost: 32, cooldown: 4, tags: ['beam', 'armorbreak'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 2 }] },
    { name: "Prince's Pride", category: 'KI', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 15, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 15, duration: 3 }] },

    // Broly (previously only had a borrowed Spirit Bomb — now has a real kit)
    { name: 'Rampage Smash', category: 'KI', power: 26, energyCost: 20, cooldown: 2, tags: ['smash'], effects: [] },
    { name: 'Unstoppable Rage', category: 'KI', power: 0, energyCost: 20, cooldown: 4, tags: ['rage', 'buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 30, duration: 3 }, { type: 'DEBUFF', target: 'SELF', stat: 'defense', magnitude: 10, duration: 3 }] },
    { name: 'Wrathful Roar', category: 'KI', power: 0, energyCost: 16, cooldown: 4, tags: ['stun', 'intimidate'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },

    // Daredevil
    { name: 'Radar Sense', category: 'OTHER', power: 0, energyCost: 10, cooldown: 3, tags: ['dodge', 'buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Billy Club Strike', category: 'OTHER', power: 18, energyCost: 14, cooldown: 2, tags: [], effects: [] },
    { name: 'Counter Strike', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },
    { name: 'Adrenaline Surge', category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 18 }] },

    // Batman
    { name: 'Batarang Volley', category: 'OTHER', power: 18, energyCost: 14, cooldown: 2, tags: ['bleed', 'multi-hit'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 3 }] },
    { name: 'Smoke Bomb Escape', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 30, duration: 3 }] },
    { name: 'Grapple Counter', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },
    { name: 'Detective Analysis', category: 'OTHER', power: 0, energyCost: 14, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 18, duration: 3 }] },

    // Jean Grey
    { name: 'Phoenix Surge', category: 'OTHER', power: 32, energyCost: 35, cooldown: 4, tags: ['burn', 'aoe'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 9, duration: 3 }] },
    { name: 'Telekinetic Slam', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Mind Link Weaken', category: 'OTHER', power: 0, energyCost: 14, cooldown: 3, tags: ['psychic', 'debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: 'Phoenix Rebirth', category: 'OTHER', power: 0, energyCost: 24, cooldown: 5, tags: ['heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 22 }] },

    // Emma Frost
    { name: 'Diamond Skin', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['fortify', 'shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 32, duration: 3 }] },
    { name: 'Psychic Blast', category: 'OTHER', power: 20, energyCost: 18, cooldown: 2, tags: ['psychic'], effects: [] },
    { name: 'Mental Domination', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['psychic', 'stun'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },
    { name: 'Diamond Form Counter', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },

    // Superman
    { name: 'Heat Vision', category: 'OTHER', power: 30, energyCost: 22, cooldown: 3, tags: ['beam', 'burn'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 3 }] },
    { name: 'Super Strength Slam', category: 'OTHER', power: 28, energyCost: 20, cooldown: 2, tags: [], effects: [] },
    { name: 'Kryptonian Resolve', category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Unbreakable', category: 'OTHER', power: 0, energyCost: 22, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 45, duration: 3 }] },

    // Wonder Woman
    { name: 'Lasso of Truth', category: 'OTHER', power: 10, energyCost: 18, cooldown: 3, tags: ['stun', 'bind'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },
    { name: 'Sword Strike', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Bracelets of Submission', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 60, duration: 2 }] },
    { name: 'Amazonian Fury', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 25, duration: 3 }] },

    // --- Bleach roster expansion ---

    // Ichigo Kurosaki (extra)
    { name: 'Getsuga Jūjishō', category: 'OTHER', power: 22, energyCost: 18, cooldown: 3, tags: ['combo'], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 15 }] },
    { name: 'Tensa Zangetsu: Final Getsuga', category: 'OTHER', power: 34, energyCost: 32, cooldown: 5, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'SELF', stat: 'defense', magnitude: 15, duration: 3 }] },

    // Rukia Kuchiki (extra)

    // Yamamoto Genryūsai
    { name: 'Ryūjin Jakka: Flame Strike', category: 'OTHER', power: 26, energyCost: 22, cooldown: 2, tags: ['fire'], effects: [] },
    { name: 'Zanka no Tachi: Cremation', category: 'OTHER', power: 36, energyCost: 34, cooldown: 5, tags: ['fire', 'ultimate'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 3 }] },
    { name: "Commander's Will", category: 'OTHER', power: 0, energyCost: 22, cooldown: 4, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 20, duration: 3 }] },

    // Shunsui Kyōraku
    { name: 'Katen Kyōkotsu: Twin Strike', category: 'OTHER', power: 21, energyCost: 17, cooldown: 2, tags: [], effects: [] },
    { name: 'Bushōgoma', category: 'OTHER', power: 27, energyCost: 24, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 18, duration: 3 }] },
    { name: "Lazy Confidence", category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },
    { name: 'Flower Wind Rondo', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 20, duration: 3 }] },

    // Jūshirō Ukitake
    { name: 'Sōgyo no Kotowari: Twin Blade', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Dual Strike Barrage', category: 'OTHER', power: 22, energyCost: 18, cooldown: 3, tags: ['combo'], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 20 }] },
    { name: 'Resilient Spirit', category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 20 }] },
    { name: 'Twin Blade Guard', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 28, duration: 3 }] },

    // Suì-Fēng
    { name: 'Suzumebachi Sting', category: 'OTHER', power: 19, energyCost: 15, cooldown: 2, tags: [], effects: [] },
    { name: 'Nigeki Kessatsu: Death Sting', category: 'OTHER', power: 16, energyCost: 18, cooldown: 3, tags: ['poison'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 9, duration: 3 }] },
    { name: 'Shunkō Assault', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 20, duration: 2 }, { type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 15, duration: 2 }] },
    { name: "Assassin's Debuff", category: 'OTHER', power: 0, energyCost: 14, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 18, duration: 3 }] },

    // Mayuri Kurotsuchi
    { name: 'Ashisogi Jizō Spores', category: 'OTHER', power: 8, energyCost: 16, cooldown: 2, tags: ['poison'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 3 }] },
    { name: 'Konjiki Ashisogi Jizō', category: 'OTHER', power: 26, energyCost: 26, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Toxic Experiment', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['poison', 'debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 18, duration: 3 }] },
    { name: 'Regenerative Formula', category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 18 }] },

    // Sajin Komamura
    { name: 'Tenken Strike', category: 'OTHER', power: 22, energyCost: 18, cooldown: 2, tags: [], effects: [] },
    { name: 'Kokujō Tengen Myōō', category: 'OTHER', power: 28, energyCost: 26, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 40, duration: 3 }] },
    { name: 'Iron Wall', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 30, duration: 3 }] },
    { name: "Guardian's Resolve", category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 32, duration: 3 }] },

    // Gin Ichimaru
    { name: 'Shinsō Extension', category: 'OTHER', power: 21, energyCost: 17, cooldown: 2, tags: [], effects: [] },
    { name: 'Kamishini no Yari', category: 'OTHER', power: 27, energyCost: 26, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },
    { name: 'Deceptive Smile', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 18, duration: 3 }] },
    { name: 'Sly Counter', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 50, duration: 2 }] },

    // Kaname Tosen
    { name: 'Suzumushi Strike', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Suzumushi Tsuishiki: Enma Kōrogi', category: 'OTHER', power: 22, energyCost: 24, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },
    { name: 'Blind Justice', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 18, duration: 3 }] },
    { name: 'Righteous Guard', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },

    // Rangiku Matsumoto
    { name: 'Haineko: Ash Slash', category: 'OTHER', power: 19, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Growl, Haineko', category: 'OTHER', power: 21, energyCost: 18, cooldown: 3, tags: ['ash'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 6, duration: 2 }] },
    { name: 'Flashy Confidence', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 15, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 15, duration: 3 }] },
    { name: 'Ash Veil', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 26, duration: 3 }] },

    // Momo Hinamori
    { name: 'Tobiume: Plum Blossom Fire', category: 'OTHER', power: 18, energyCost: 16, cooldown: 2, tags: ['fire'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 6, duration: 2 }] },
    { name: 'Kido Focus', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }] },

    // Izuru Kira
    { name: 'Wabisuke: Heavy Blow', category: 'OTHER', power: 18, energyCost: 16, cooldown: 2, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 18, duration: 3 }] },
    { name: 'Despairing Slash', category: 'OTHER', power: 19, energyCost: 17, cooldown: 3, tags: ['poison'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 3 }] },
    { name: 'Quiet Resolve', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 26, duration: 3 }] },

    // Kisuke Urahara
    { name: 'Benihime: Crimson Strike', category: 'OTHER', power: 23, energyCost: 19, cooldown: 2, tags: [], effects: [] },
    { name: 'Kageyoshi: Shield Wall', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 34, duration: 3 }] },
    { name: "Shopkeeper's Trick", category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Calculated Counter', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },

    // Retsu Unohana
    { name: 'Healing Touch', category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 25 }] },
    { name: 'Minazuki: Mist Balm', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 32, duration: 3 }] },
    { name: 'Calm Composure', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Glimpse of the True Blade', category: 'OTHER', power: 32, energyCost: 30, cooldown: 5, tags: ['ultimate'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 2 }] },

    // Sosuke Aizen
    { name: 'Kyōka Suigetsu: Complete Hypnosis', category: 'OTHER', power: 0, energyCost: 20, cooldown: 3, tags: ['illusion', 'debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 25, duration: 3 }] },
    { name: 'Shattered Shield', category: 'OTHER', power: 26, energyCost: 22, cooldown: 3, tags: [], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 2 }] },
    { name: 'Perfect Anticipation', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 60, duration: 2 }] },

    // Byakuya Kuchiki
    { name: 'Senbonzakura', category: 'OTHER', power: 24, energyCost: 20, cooldown: 2, tags: ['blades'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 3 }] },
    { name: 'Senbonzakura Kageyoshi', category: 'OTHER', power: 30, energyCost: 28, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Shukumei', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Noble Resolve', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 15, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 15, duration: 3 }] },

    // Toshiro Hitsugaya
    { name: 'Hyōrinmaru: Ice Blade', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: ['ice'], effects: [] },
    { name: 'Sōten ni Zase', category: 'OTHER', power: 22, energyCost: 20, cooldown: 3, tags: ['ice'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 6, duration: 3 }, { type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 20, duration: 3 }] },
    { name: 'Hyōten Hyakkasō', category: 'OTHER', power: 28, energyCost: 30, cooldown: 5, tags: ['ultimate', 'ice'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },
    { name: 'Frost Armor', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['ice', 'shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 28, duration: 3 }] },

    // Kenpachi Zaraki
    { name: 'Golpe Bruto', category: 'OTHER', power: 24, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Nozarashi', category: 'OTHER', power: 34, energyCost: 28, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'SELF', stat: 'defense', magnitude: 15, duration: 3 }] },
    { name: 'Remover o Tapa-Olho', category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 30, duration: 3 }] },
    { name: 'Teimosia de Kenpachi', category: 'OTHER', power: 20, energyCost: 18, cooldown: 3, tags: [], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 25 }] },
    { name: 'Pressão Assassina', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['stun'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },

    // Renji Abarai
    { name: 'Zabimaru Strike', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Hihio Zabimaru', category: 'OTHER', power: 26, energyCost: 26, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 3 }] },
    { name: 'Fierce Resolve', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: 'Tenacious Guard', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 26, duration: 3 }] },

    // Orihime Inoue
    { name: 'Tsubaki: Koten Zanshun', category: 'OTHER', power: 18, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Santen Kesshun', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 35, duration: 3 }] },
    { name: 'Sōten Kisshun', category: 'OTHER', power: 0, energyCost: 24, cooldown: 4, tags: ['heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 28 }] },
    { name: 'Dance of the Heavens: Full Reject', category: 'OTHER', power: 0, energyCost: 34, cooldown: 6, tags: ['ultimate', 'heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 45 }] },
    { name: 'Encouraging Words', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 20, duration: 3 }] },

    // Uryu Ishida
    { name: 'Hirenkyaku Shot', category: 'OTHER', power: 20, energyCost: 16, cooldown: 2, tags: [], effects: [] },
    { name: 'Ginrei Kojaku: Licht Regen', category: 'OTHER', power: 28, energyCost: 26, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Seele Schneider', category: 'OTHER', power: 18, energyCost: 16, cooldown: 2, tags: [], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 3 }] },
    { name: 'Quincy Focus', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: 'Blut Vene', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },

    // Yoruichi Shihoin
    { name: 'Flash Step Strike', category: 'OTHER', power: 19, energyCost: 15, cooldown: 2, tags: [], effects: [] },
    { name: 'Shunkō', category: 'OTHER', power: 26, energyCost: 28, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 20, duration: 2 }] },
    { name: 'Utsusemi', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 60, duration: 2 }] },
    { name: 'Goddess of Flash', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 25, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 15, duration: 3 }] },
    { name: 'Vital Point Strike', category: 'OTHER', power: 18, energyCost: 16, cooldown: 2, tags: [], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 20 }] },

    // Chad
    { name: 'El Directo', category: 'OTHER', power: 26, energyCost: 20, cooldown: 2, tags: [], effects: [] },
    { name: 'Brazo Izquierda del Diablo: Guard', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 36, duration: 3 }] },
    { name: 'Iron Resolve', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Overwhelming Force', category: 'OTHER', power: 24, energyCost: 20, cooldown: 3, tags: [], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 15, duration: 2 }] },

    // Yhwach
    { name: "The Almighty's Strike", category: 'OTHER', power: 28, energyCost: 22, cooldown: 2, tags: [], effects: [] },
    { name: 'Auswählen: Absolute Judgment', category: 'OTHER', power: 38, energyCost: 36, cooldown: 5, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 25, duration: 3 }] },
    { name: 'Der Sarg: Distortion', category: 'OTHER', power: 0, energyCost: 20, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 25, duration: 3 }] },
    { name: "The Almighty's Foresight", category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 65, duration: 2 }] },

    // Ryuken Ishida
    { name: 'Precision Shot', category: 'OTHER', power: 22, energyCost: 18, cooldown: 2, tags: [], effects: [] },
    { name: 'Cold Calculation', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: "Doctor's Composure", category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['counter'], effects: [{ type: 'COUNTER', target: 'SELF', magnitude: 55, duration: 2 }] },
    { name: 'Silver Arrow Barrage', category: 'OTHER', power: 20, energyCost: 18, cooldown: 3, tags: [], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 2 }] },

    // Bazz-B
    { name: 'Burner Finger', category: 'OTHER', power: 22, energyCost: 18, cooldown: 2, tags: ['fire'], effects: [] },
    { name: 'Burner Finger 1: Max', category: 'OTHER', power: 24, energyCost: 26, cooldown: 4, tags: ['ultimate', 'fire'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 12, duration: 3 }] },
    { name: 'Heat Wave', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: 'Scorching Strike', category: 'OTHER', power: 19, energyCost: 17, cooldown: 2, tags: ['fire'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 7, duration: 2 }] },

    // As Nödt
    { name: 'Arrow of Fear', category: 'OTHER', power: 18, energyCost: 17, cooldown: 2, tags: ['fear'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 15, duration: 2 }] },
    { name: 'Angstroem: Terror Incarnate', category: 'OTHER', power: 10, energyCost: 24, cooldown: 4, tags: ['ultimate', 'fear'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 25, duration: 3 }, { type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Paralyzing Screech', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['fear', 'stun'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 1 }] },
    { name: "Predator's Patience", category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 20, duration: 3 }] },

    // Coyote Starrk (Primera Espada)
    { name: 'Cero Metralleta', category: 'OTHER', power: 22, energyCost: 18, cooldown: 2, tags: ['cero'], effects: [] },
    { name: 'Los Lobos', category: 'OTHER', power: 30, energyCost: 28, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 20 }] },
    { name: "Lone Wolf's Focus", category: 'OTHER', power: 0, energyCost: 20, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 18, duration: 3 }, { type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 15, duration: 3 }] },
    { name: 'Pack Tactics', category: 'OTHER', power: 20, energyCost: 18, cooldown: 2, tags: [], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 15, duration: 2 }] },

    // Baraggan Luisenbarn (Segunda Espada)
    { name: 'Decaying Touch', category: 'OTHER', power: 8, energyCost: 18, cooldown: 2, tags: ['decay'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 3 }] },
    { name: 'Respira: Decay', category: 'OTHER', power: 18, energyCost: 26, cooldown: 4, tags: ['ultimate', 'decay'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 12, duration: 3 }, { type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 15, duration: 3 }] },
    { name: "King's Authority", category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 25, duration: 3 }] },
    { name: 'Ancient Malice', category: 'OTHER', power: 21, energyCost: 17, cooldown: 2, tags: [], effects: [] },

    // Tia Harribel (Tercera Espada)
    { name: 'Ola Azul', category: 'OTHER', power: 22, energyCost: 18, cooldown: 2, tags: ['water'], effects: [] },
    { name: 'Tiburón: Sawing Sharks', category: 'OTHER', power: 28, energyCost: 26, cooldown: 4, tags: ['ultimate', 'water'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 8, duration: 3 }] },
    { name: 'Glacial Barrier', category: 'OTHER', power: 0, energyCost: 18, cooldown: 4, tags: ['ice', 'shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 32, duration: 3 }] },
    { name: 'Tidal Focus', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 18, duration: 3 }] },

    // Ulquiorra Cifer (Cuarta Espada)
    { name: 'Lanza del Relámpago', category: 'OTHER', power: 23, energyCost: 18, cooldown: 2, tags: [], effects: [] },
    { name: 'Cero Oscuras', category: 'OTHER', power: 34, energyCost: 30, cooldown: 5, tags: ['ultimate', 'cero'], effects: [] },
    { name: 'Emotionless Precision', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: 'Hierro Skin', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 30, duration: 3 }] },

    // Nnoitra Gilga (Quinta Espada)
    { name: 'Santa Teresa: Scythe Slash', category: 'OTHER', power: 25, energyCost: 19, cooldown: 2, tags: [], effects: [] },
    { name: 'Gran Caída', category: 'OTHER', power: 33, energyCost: 28, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'SELF', stat: 'defense', magnitude: 15, duration: 2 }] },
    { name: 'Arrogant Pressure', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 20, duration: 3 }] },
    { name: 'Bloodlust', category: 'OTHER', power: 20, energyCost: 18, cooldown: 2, tags: [], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 22 }] },

    // Grimmjow Jaegerjaquez (Sexta Espada)
    { name: 'Desgarrón', category: 'OTHER', power: 24, energyCost: 19, cooldown: 2, tags: [], effects: [] },
    { name: 'Gran Rey Cero', category: 'OTHER', power: 32, energyCost: 28, cooldown: 4, tags: ['ultimate', 'cero'], effects: [] },
    { name: "Predator's Instinct", category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 25, duration: 3 }] },
    { name: 'Reckless Assault', category: 'OTHER', power: 22, energyCost: 18, cooldown: 2, tags: [], effects: [{ type: 'DEBUFF', target: 'SELF', stat: 'defense', magnitude: 12, duration: 2 }] },

    // Zommari Rureaux (Séptima Espada)
    { name: 'Brujería: Multi-Strike', category: 'OTHER', power: 21, energyCost: 17, cooldown: 2, tags: [], effects: [] },
    { name: 'Amor: Paralysis', category: 'OTHER', power: 16, energyCost: 24, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'STUN', target: 'ENEMY', magnitude: 0, duration: 2 }] },
    { name: 'All-Seeing Focus', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'speed', magnitude: 25, duration: 3 }] },
    { name: 'Binding Gaze', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'speed', magnitude: 20, duration: 3 }] },

    // Szayelaporro Granz (Octava Espada)
    { name: 'Fornicarás: Toxic Spore', category: 'OTHER', power: 8, energyCost: 17, cooldown: 2, tags: ['poison'], effects: [{ type: 'DOT', target: 'ENEMY', magnitude: 10, duration: 3 }] },
    { name: 'Gabriel: Resurrection Experiment', category: 'OTHER', power: 26, energyCost: 26, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Analytical Mind', category: 'OTHER', power: 0, energyCost: 16, cooldown: 3, tags: ['debuff'], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'attack', magnitude: 18, duration: 3 }] },
    { name: 'Self-Regeneration', category: 'OTHER', power: 0, energyCost: 20, cooldown: 4, tags: ['heal'], effects: [{ type: 'HEAL', target: 'SELF', magnitude: 22 }] },

    // Aaroniero Arruruerie (Novena Espada)
    { name: 'Soul Devour', category: 'OTHER', power: 20, energyCost: 18, cooldown: 2, tags: [], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 30 }] },
    { name: 'Nejibana no Kioku: Twin Cauldron', category: 'OTHER', power: 26, energyCost: 26, cooldown: 4, tags: ['ultimate'], effects: [{ type: 'LIFESTEAL', target: 'SELF', magnitude: 25 }] },
    { name: 'Absorbed Mass', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'defense', magnitude: 20, duration: 3 }] },
    { name: 'Cauldron Shield', category: 'OTHER', power: 0, energyCost: 16, cooldown: 4, tags: ['shield'], effects: [{ type: 'SHIELD', target: 'SELF', magnitude: 30, duration: 3 }] },

    // Yammy Llargo (Décima Espada)
    { name: 'Gigantic Fist', category: 'OTHER', power: 25, energyCost: 18, cooldown: 2, tags: [], effects: [] },
    { name: 'Ira: Rampage', category: 'OTHER', power: 34, energyCost: 28, cooldown: 4, tags: ['ultimate'], effects: [] },
    { name: 'Overwhelming Size', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ['buff'], effects: [{ type: 'BUFF', target: 'SELF', stat: 'attack', magnitude: 25, duration: 3 }] },
    { name: 'Crushing Blow', category: 'OTHER', power: 22, energyCost: 18, cooldown: 2, tags: [], effects: [{ type: 'DEBUFF', target: 'ENEMY', stat: 'defense', magnitude: 15, duration: 2 }] },
  ];

  const createdSkills = await prisma.$transaction(skillDefs.map((s) => prisma.skill.create({ data: s })));
  const skillByName = Object.fromEntries(createdSkills.map((s, i) => [skillDefs[i].name, s]));
  const skillId = (name) => skillByName[name].id;

  // Kidō completo: 99 Hadō + 99 Bakudō, gerados em prisma/kido.js (canônicos
  // escritos à mão, números nunca revelados preenchidos por fórmula). Ficam
  // fora do skillDefs acima justamente por serem gerados — e são a única fonte
  // de verdade dos kidō, inclusive dos que antes estavam soltos aqui.
  const createdKido = await prisma.$transaction(
    kido.all.map((k) =>
      prisma.skill.create({
        data: {
          name: k.name,
          description: k.description,
          category: k.category,
          power: k.power,
          energyCost: k.energyCost,
          cooldown: k.cooldown,
          tags: k.tags,
          effects: k.effects,
        },
      })
    )
  );
  // Precisa entrar no mapa antes dos characterSkillDefs abaixo: os kits de
  // Ichigo e Rukia referenciam kidō por nome.
  for (const k of createdKido) skillByName[k.name] = k;

  // CharacterSkill links. Everything defaults to requiredLevel 1 / learnedByDefault
  // so kits are fully usable right away; Spirit Bomb/Final Flash keep their original
  // higher-level gating for Goku/Vegeta.
  const characterSkillDefs = [
    { character: narutoChar, skills: ['Rasengan', 'Shadow Clone Barrage', 'Nine-Tails Chakra Cloak', 'Uzumaki Barrier'] },
    { character: sasuke, skills: ['Chidori', 'Sharingan Insight', 'Fire Style: Fireball', 'Amaterasu'] },
    { character: ichigo, skills: ['Hadō #31: Shakkahō', 'Getsuga Tenshō', 'Bankai Focus', 'Zangetsu Parry'] },
    { character: rukia, skills: ['Bakudō #1: Sai', 'Hadō #4: Byakurai', 'Sode no Shirayuki: Some Snow', 'Dance of the White Moon'] },
    { character: goku, skills: ['Kamehameha', 'Power Up', 'Instant Transmission Counter'] },
    { character: vegeta, skills: ['Galick Gun', 'Saiyan Onslaught', "Prince's Pride"] },
    { character: broly, skills: ['Rampage Smash', 'Unstoppable Rage', 'Wrathful Roar'] },
    { character: daredevil, skills: ['Radar Sense', 'Billy Club Strike', 'Counter Strike', 'Adrenaline Surge'] },
    { character: batman, skills: ['Batarang Volley', 'Smoke Bomb Escape', 'Grapple Counter', 'Detective Analysis'] },
    { character: jeanGrey, skills: ['Phoenix Surge', 'Telekinetic Slam', 'Mind Link Weaken', 'Phoenix Rebirth'] },
    { character: emmaFrost, skills: ['Diamond Skin', 'Psychic Blast', 'Mental Domination', 'Diamond Form Counter'] },
    { character: superman, skills: ['Heat Vision', 'Super Strength Slam', 'Kryptonian Resolve', 'Unbreakable'] },
    { character: wonderWoman, skills: ['Lasso of Truth', 'Sword Strike', 'Bracelets of Submission', 'Amazonian Fury'] },

    // Ichigo/Rukia extra skills (protagonist treatment: 6 total each)
    { character: ichigo, skills: ['Getsuga Jūjishō', 'Tensa Zangetsu: Final Getsuga'] },
    { character: rukia, skills: ['Hadō #33: Sōkatsui', 'Bakudō #61: Rikujōkōrō'] },

    // Bleach roster expansion
    { character: charByName['Yamamoto Genryūsai'], skills: ['Ryūjin Jakka: Flame Strike', 'Zanka no Tachi: Cremation', "Commander's Will", 'Hadō #96: Ittō Kasō'] },
    { character: charByName['Shunsui Kyōraku'], skills: ['Katen Kyōkotsu: Twin Strike', 'Bushōgoma', 'Lazy Confidence', 'Flower Wind Rondo'] },
    { character: charByName['Jūshirō Ukitake'], skills: ['Sōgyo no Kotowari: Twin Blade', 'Dual Strike Barrage', 'Resilient Spirit', 'Twin Blade Guard'] },
    { character: charByName['Suì-Fēng'], skills: ['Suzumebachi Sting', 'Nigeki Kessatsu: Death Sting', 'Shunkō Assault', "Assassin's Debuff"] },
    { character: charByName['Mayuri Kurotsuchi'], skills: ['Ashisogi Jizō Spores', 'Konjiki Ashisogi Jizō', 'Toxic Experiment', 'Regenerative Formula'] },
    { character: charByName['Sajin Komamura'], skills: ['Tenken Strike', 'Kokujō Tengen Myōō', 'Iron Wall', "Guardian's Resolve"] },
    { character: charByName['Gin Ichimaru'], skills: ['Shinsō Extension', 'Kamishini no Yari', 'Deceptive Smile', 'Sly Counter'] },
    { character: charByName['Kaname Tosen'], skills: ['Suzumushi Strike', 'Suzumushi Tsuishiki: Enma Kōrogi', 'Blind Justice', 'Righteous Guard'] },
    { character: charByName['Rangiku Matsumoto'], skills: ['Haineko: Ash Slash', 'Growl, Haineko', 'Flashy Confidence', 'Ash Veil'] },
    { character: charByName['Momo Hinamori'], skills: ['Hadō #4: Byakurai', 'Hadō #63: Raikōhō', 'Tobiume: Plum Blossom Fire', 'Kido Focus'] },
    { character: charByName['Izuru Kira'], skills: ['Hadō #4: Byakurai', 'Wabisuke: Heavy Blow', 'Despairing Slash', 'Quiet Resolve'] },
    { character: charByName['Kisuke Urahara'], skills: ['Benihime: Crimson Strike', 'Kageyoshi: Shield Wall', "Shopkeeper's Trick", 'Calculated Counter'] },
    { character: charByName['Retsu Unohana'], skills: ['Healing Touch', 'Minazuki: Mist Balm', 'Calm Composure', 'Glimpse of the True Blade'] },
    { character: charByName['Sosuke Aizen'], skills: ['Kyōka Suigetsu: Complete Hypnosis', 'Shattered Shield', 'Perfect Anticipation', 'Hadō #90: Kurohitsugi'] },
    { character: charByName['Byakuya Kuchiki'], skills: ['Senbonzakura', 'Senbonzakura Kageyoshi', 'Shukumei', 'Hadō #4: Byakurai', 'Noble Resolve'] },
    { character: charByName['Toshiro Hitsugaya'], skills: ['Hyōrinmaru: Ice Blade', 'Sōten ni Zase', 'Hyōten Hyakkasō', 'Hadō #4: Byakurai', 'Frost Armor'] },
    { character: charByName['Kenpachi Zaraki'], skills: ['Golpe Bruto', 'Nozarashi', 'Remover o Tapa-Olho', 'Teimosia de Kenpachi', 'Pressão Assassina'] },
    { character: charByName['Renji Abarai'], skills: ['Zabimaru Strike', 'Hihio Zabimaru', 'Hadō #4: Byakurai', 'Fierce Resolve', 'Tenacious Guard'] },
    { character: charByName['Orihime Inoue'], skills: ['Tsubaki: Koten Zanshun', 'Santen Kesshun', 'Sōten Kisshun', 'Dance of the Heavens: Full Reject', 'Encouraging Words'] },
    { character: charByName['Uryu Ishida'], skills: ['Hirenkyaku Shot', 'Ginrei Kojaku: Licht Regen', 'Seele Schneider', 'Quincy Focus', 'Blut Vene'] },
    { character: charByName['Yoruichi Shihoin'], skills: ['Flash Step Strike', 'Shunkō', 'Utsusemi', 'Goddess of Flash', 'Vital Point Strike'] },
    { character: charByName['Chad'], skills: ['El Directo', 'Brazo Izquierda del Diablo: Guard', 'Iron Resolve', 'Overwhelming Force'] },
    { character: charByName['Yhwach'], skills: ["The Almighty's Strike", 'Auswählen: Absolute Judgment', 'Der Sarg: Distortion', "The Almighty's Foresight"] },
    { character: charByName['Ryuken Ishida'], skills: ['Precision Shot', 'Cold Calculation', "Doctor's Composure", 'Silver Arrow Barrage'] },
    { character: charByName['Bazz-B'], skills: ['Burner Finger', 'Burner Finger 1: Max', 'Heat Wave', 'Scorching Strike'] },
    { character: charByName['As Nödt'], skills: ['Arrow of Fear', 'Angstroem: Terror Incarnate', 'Paralyzing Screech', "Predator's Patience"] },
    { character: charByName['Coyote Starrk'], skills: ['Cero Metralleta', 'Los Lobos', "Lone Wolf's Focus", 'Pack Tactics'] },
    { character: charByName['Baraggan Luisenbarn'], skills: ['Decaying Touch', 'Respira: Decay', "King's Authority", 'Ancient Malice'] },
    { character: charByName['Tia Harribel'], skills: ['Ola Azul', 'Tiburón: Sawing Sharks', 'Glacial Barrier', 'Tidal Focus'] },
    { character: charByName['Ulquiorra Cifer'], skills: ['Lanza del Relámpago', 'Cero Oscuras', 'Emotionless Precision', 'Hierro Skin'] },
    { character: charByName['Nnoitra Gilga'], skills: ['Santa Teresa: Scythe Slash', 'Gran Caída', 'Arrogant Pressure', 'Bloodlust'] },
    { character: charByName['Grimmjow Jaegerjaquez'], skills: ['Desgarrón', 'Gran Rey Cero', "Predator's Instinct", 'Reckless Assault'] },
    { character: charByName['Zommari Rureaux'], skills: ['Brujería: Multi-Strike', 'Amor: Paralysis', 'All-Seeing Focus', 'Binding Gaze'] },
    { character: charByName['Szayelaporro Granz'], skills: ['Fornicarás: Toxic Spore', 'Gabriel: Resurrection Experiment', 'Analytical Mind', 'Self-Regeneration'] },
    { character: charByName['Aaroniero Arruruerie'], skills: ['Soul Devour', 'Nejibana no Kioku: Twin Cauldron', 'Absorbed Mass', 'Cauldron Shield'] },
    { character: charByName['Yammy Llargo'], skills: ['Gigantic Fist', 'Ira: Rampage', 'Overwhelming Size', 'Crushing Blow'] },
  ];

  await prisma.$transaction(
    characterSkillDefs.flatMap((cs) =>
      cs.skills.map((name) =>
        prisma.characterSkill.create({ data: { characterId: cs.character.id, skillId: skillId(name), requiredLevel: 1, learnedByDefault: true } })
      )
    )
  );

  // Spirit Bomb / Final Flash keep their original higher-level gating on top of the base link above.
  await prisma.$transaction([
    prisma.characterSkill.create({ data: { characterId: goku.id, skillId: skillId('Spirit Bomb'), requiredLevel: 4 } }),
    prisma.characterSkill.create({ data: { characterId: vegeta.id, skillId: skillId('Final Flash'), requiredLevel: 4 } }),
    prisma.characterSkill.create({ data: { characterId: broly.id, skillId: skillId('Spirit Bomb'), requiredLevel: 5 } }),
  ]);

  const rasengan = skillByName['Rasengan'];
  const spiritBomb = skillByName['Spirit Bomb'];
  const finalFlash = skillByName['Final Flash'];

  // Saiyan transformations
  const gokuForms = await prisma.transformation.createManyAndReturn({
    data: [
      { characterId: goku.id, name: 'Super Saiyan', levelRequirement: 10, attackModifier: 0.15, speedModifier: 0.05, energyModifier: -0.05, imageUrl: null },
      { characterId: goku.id, name: 'Super Saiyan 2', levelRequirement: 20, attackModifier: 0.25, speedModifier: 0.1, energyModifier: -0.1, imageUrl: null },
      { characterId: goku.id, name: 'Super Saiyan 3', levelRequirement: 30, attackModifier: 0.35, speedModifier: 0.15, energyModifier: -0.2, drainPerTurn: 10, imageUrl: null },
      { characterId: goku.id, name: 'Super Saiyan God', levelRequirement: 45, attackModifier: 0.2, defenseModifier: 0.2, speedModifier: 0.1, energyModifier: 0.1, imageUrl: null },
      { characterId: goku.id, name: 'Super Saiyan Blue', levelRequirement: 55, attackModifier: 0.25, defenseModifier: 0.2, speedModifier: 0.15, energyModifier: 0.15, unlocksSkillId: spiritBomb.id, imageUrl: null },
      { characterId: goku.id, name: 'Ultra Instinct', levelRequirement: 70, defenseModifier: 0.25, speedModifier: 0.3, triggerType: 'LOW_HP', triggerPayload: { threshold: 0.35 }, imageUrl: null },
    ]
  });

  const vegetaForms = await prisma.transformation.createManyAndReturn({
    data: [
      { characterId: vegeta.id, name: 'Super Saiyan', levelRequirement: 10, attackModifier: 0.14, speedModifier: 0.04, energyModifier: -0.05 },
      { characterId: vegeta.id, name: 'Super Saiyan 2', levelRequirement: 20, attackModifier: 0.24, speedModifier: 0.08, energyModifier: -0.1 },
      { characterId: vegeta.id, name: 'Super Saiyan 4', levelRequirement: 35, attackModifier: 0.32, defenseModifier: 0.1, speedModifier: 0.12, energyModifier: -0.15 },
      { characterId: vegeta.id, name: 'Super Saiyan God', levelRequirement: 45, attackModifier: 0.22, defenseModifier: 0.18, speedModifier: 0.1, energyModifier: 0.1 },
      { characterId: vegeta.id, name: 'Super Saiyan Blue', levelRequirement: 55, attackModifier: 0.27, defenseModifier: 0.2, speedModifier: 0.12, energyModifier: 0.12, unlocksSkillId: finalFlash.id },
      { characterId: vegeta.id, name: 'Ultra Ego', levelRequirement: 65, attackModifier: 0.35, defenseModifier: 0.05, energyModifier: 0.2, triggerType: 'ON_DAMAGE_TAKEN', triggerPayload: { stacks: 3, bonusPerStack: 0.05 }, drainPerTurn: 5 },
    ]
  });

  const brolyForms = await prisma.transformation.createManyAndReturn({
    data: [
      { characterId: broly.id, name: 'Wrathful', levelRequirement: 20, attackModifier: 0.2, defenseModifier: 0.1, triggerType: 'ON_DAMAGE_TAKEN', triggerPayload: { damageThreshold: 50 } },
      { characterId: broly.id, name: 'Legendary Super Saiyan', levelRequirement: 40, attackModifier: 0.4, defenseModifier: 0.2, speedModifier: 0.1, energyModifier: 0.15, drainPerTurn: 8 },
      { characterId: broly.id, name: 'Full Power', levelRequirement: 55, attackModifier: 0.5, defenseModifier: 0.25, speedModifier: 0.15, triggerType: 'LOW_HP', triggerPayload: { threshold: 0.4 } },
    ]
  });

  // Simple skill tree for Naruto
  const nBase = await prisma.skillTreeNode.create({ data: { characterId: narutoChar.id, name: 'Shinobi Basics', description: 'Increase HP by 10', tier: 1, pointCost: 1, flatHpBonus: 10 } });
  const nRasenganNode = await prisma.skillTreeNode.create({ data: { characterId: narutoChar.id, name: 'Master Rasengan', description: 'Unlock Rasengan', tier: 2, pointCost: 1, skillId: rasengan.id } });
  // Link prerequisites (manual join via updateMany not needed; Prisma handles self-rel many-to-many with explicit connect)
  await prisma.skillTreeNode.update({ where: { id: nRasenganNode.id }, data: { prerequisites: { connect: [{ id: nBase.id }] } } });

  // Baseline tier-1 stat node for every other character, so the skill tree
  // isn't empty for everyone except Naruto.
  const otherCharacters = [sasuke, ichigo, rukia, goku, vegeta, broly, daredevil, batman, jeanGrey, emmaFrost, superman, wonderWoman];
  await prisma.$transaction(
    otherCharacters.map((c) =>
      prisma.skillTreeNode.create({
        data: { characterId: c.id, name: 'Combat Fundamentals', description: 'Increase HP by 10 and Attack by 2', tier: 1, pointCost: 1, flatHpBonus: 10, flatAttackBonus: 2 },
      })
    )
  );

  // Monster: foundation for future raid/dungeon content. Not used by any battle
  // logic or UI yet - just proves the model out with Bleach's own Hollow
  // evolution ladder as a natural "generic enemy" tier system.
  const basicClaw = await prisma.skill.create({
    data: { name: 'Hollow Claw', category: 'OTHER', power: 12, energyCost: 8, cooldown: 1, tags: ['claw'], effects: [] },
  });
  const monsterDefs = [
    { name: 'Hollow', description: 'A lost soul consumed by despair, wearing a bone-white mask.', tier: 1, hp: 60, attack: 10, defense: 6, speed: 8, energy: 60 },
    { name: 'Menos Grande', description: 'Hundreds of Hollows fused into one towering giant.', tier: 2, hp: 140, attack: 16, defense: 10, speed: 6, energy: 90 },
    { name: 'Adjuchas', description: 'A Menos that devoured its own kind to gain intelligence and form.', tier: 3, hp: 220, attack: 22, defense: 14, speed: 12, energy: 110 },
    { name: 'Vasto Lorde', description: 'The rarest and most powerful Hollow evolution, nearly Shinigami in power.', tier: 4, hp: 320, attack: 28, defense: 18, speed: 15, energy: 140 },
  ];
  const createdMonsters = await prisma.$transaction(monsterDefs.map((m) => prisma.monster.create({ data: m })));
  await prisma.$transaction(createdMonsters.map((m) => prisma.monsterSkill.create({ data: { monsterId: m.id, skillId: basicClaw.id } })));

  // Dev user and owned character
  const user = await prisma.user.create({ data: { email: 'dev@example.com', username: 'devuser', name: 'Dev', passwordHash: await hashPassword('dev'), role: 'ADMIN' } });
  const devUserCharacter = await prisma.userCharacter.create({ data: { userId: user.id, characterId: narutoChar.id, level: 1, experience: 0, pointsAvailable: 1 } });

  // Initial loadout: Naruto's whole starter kit is requiredLevel 1, so this
  // fills all 4 slots immediately (mirrors autoFillLoadout(), which runs at
  // creation time for characters made through the app - the dev user is
  // created directly here instead, so it's replicated manually).
  const narutoStarterSkills = ['Rasengan', 'Shadow Clone Barrage', 'Nine-Tails Chakra Cloak', 'Uzumaki Barrier'];
  await prisma.$transaction(
    narutoStarterSkills.map((name, slot) =>
      prisma.userCharacterEquippedSkill.create({ data: { userCharacterId: devUserCharacter.id, skillId: skillId(name), slot } })
    )
  );

  // --- Kidō liberados por nível ------------------------------------------
  // Escada de kidō canônicos disponível pra todo personagem da Soul Society,
  // já que kidō é treinamento padrão de shinigami. Usa o requiredLevel do
  // CharacterSkill, que é o mecanismo de progressão que já existia — os kidō
  // mais fortes e os 161 gerados ficam pra loja, comprados com moeda.
  const kidoLadder = [
    ['Hadō #1: Shō', 1],
    ['Bakudō #1: Sai', 1],
    ['Hadō #4: Byakurai', 3],
    ['Bakudō #4: Hainawa', 4],
    ['Hadō #31: Shakkahō', 6],
    ['Bakudō #9: Hōrin', 8],
    ['Hadō #33: Sōkatsui', 10],
    ['Bakudō #39: Enkōsen', 12],
    ['Hadō #63: Raikōhō', 16],
    ['Bakudō #61: Rikujōkōrō', 18],
    ['Hadō #73: Sōren Sōkatsui', 22],
    ['Bakudō #81: Dankū', 26],
    ['Hadō #90: Kurohitsugi', 32],
    ['Bakudō #99: Kin', 38],
    ['Hadō #99: Goryūtenmetsu', 45],
  ];

  const shinigami = [ichigo, rukia, ...createdBleachChars.filter((c) => c.affiliationId === soulSociety.id)];
  // skipDuplicates porque Ichigo e Rukia já recebem alguns destes kidō no kit
  // inicial acima, e CharacterSkill é unique em (characterId, skillId).
  await prisma.characterSkill.createMany({
    data: shinigami.flatMap((c) =>
      kidoLadder.map(([name, requiredLevel]) => ({
        characterId: c.id,
        skillId: skillId(name),
        requiredLevel,
        learnedByDefault: false,
      }))
    ),
    skipDuplicates: true,
  });

  // --- Modo história: arco Soul Society ----------------------------------
  // Estágios lineares — o de ordem N só libera depois de concluir o N-1.
  // A curva de dificuldade é a da própria obra: um Hollow de treino, depois
  // tenentes, depois capitães, e Aizen no fim. A recompensa de cada estágio é
  // um kidō, subindo junto com o inimigo.
  const monsterByName = Object.fromEntries(createdMonsters.map((m) => [m.name, m]));
  const bleachCharId = (name) => charByName[name].id;

  const soulSocietyChapter = await prisma.storyChapter.create({
    data: {
      animeId: bleach.id,
      slug: storyCatalog.chapter.slug,
      title: storyCatalog.chapter.title,
      description: storyCatalog.chapter.description,
      order: storyCatalog.chapter.order,
    },
  });

  // Os estagios vem com o inimigo por nome (ver catalog/story.js); aqui e o
  // ponto onde nome vira id, com o catalogo ja gravado acima.
  await prisma.$transaction(
    storyCatalog.stages.map(({ enemyCharacterName, enemyMonsterName, ...stage }, i) =>
      prisma.storyStage.create({
        data: {
          ...stage,
          chapterId: soulSocietyChapter.id,
          order: i + 1,
          enemyCharacterId: enemyCharacterName ? bleachCharId(enemyCharacterName) : null,
          enemyMonsterId: enemyMonsterName ? monsterByName[enemyMonsterName].id : null,
        },
      })
    )
  );

  // ---------------------------------------------------------------------
  // Loja / equipamentos (Bleach)
  //
  // Primeiro sumidouro das moedas do modo história. Os preços acompanham a
  // curva de recompensa do arco: o arco inteiro paga 1560 moedas, então um
  // lendário (900-1000) é uma decisão de verdade, não compra de rotina.
  //
  // Só raridade RARO pra cima concede skill; os comuns dão stat puro — assim
  // a progressão de poder vem em dois degraus perceptíveis.
  // ---------------------------------------------------------------------
  const equipSkills = await prisma.$transaction(
    equipmentCatalog.equipmentSkills.map((d) => prisma.skill.create({ data: d }))
  );
  const equipSkillId = (name) => equipSkills.find((sk) => sk.name === name).id;

  await prisma.$transaction(
    equipmentCatalog.equipment.map(({ grantedSkillName, ...e }) =>
      prisma.equipment.create({
        data: { ...e, animeId: bleach.id, grantedSkillId: grantedSkillName ? equipSkillId(grantedSkillName) : null },
      })
    )
  );

  console.log(`Seeded ${kido.all.length} kidō, ${storyCatalog.stages.length} story stages and ${equipmentCatalog.equipment.length} equipment.`);
  console.log('Seed completed.');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
