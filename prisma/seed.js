const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  // Clear existing data (dev only)
  await prisma.turn.deleteMany();
  await prisma.battle.deleteMany();
  await prisma.userSkillUnlock.deleteMany();
  await prisma.userCharacterTransformation.deleteMany();
  await prisma.userCharacter.deleteMany();
  await prisma.session.deleteMany();
  await prisma.user.deleteMany();
  await prisma.skillTreeNode.deleteMany();
  await prisma.characterSkill.deleteMany();
  await prisma.transformation.deleteMany();
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

  const [narutoChar, sasuke, ichigo, rukia, goku, vegeta, broly, daredevil, batman, jeanGrey, emmaFrost, superman, wonderWoman] =
    await Promise.all([
      prisma.character.create({ data: { name: 'Naruto Uzumaki', slug: 'naruto-uzumaki', animeId: naruto.id, affiliationId: leaf.id, hp: 120, attack: 14, defense: 10, speed: 12, energy: 110, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Sasuke Uchiha', slug: 'sasuke-uchiha', animeId: naruto.id, affiliationId: leaf.id, hp: 110, attack: 16, defense: 10, speed: 13, energy: 110, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Ichigo Kurosaki', slug: 'ichigo-kurosaki', animeId: bleach.id, affiliationId: soulSociety.id, hp: 130, attack: 18, defense: 11, speed: 12, energy: 100, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Rukia Kuchiki', slug: 'rukia-kuchiki', animeId: bleach.id, affiliationId: soulSociety.id, hp: 105, attack: 12, defense: 10, speed: 14, energy: 115, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Goku', slug: 'goku', animeId: dbz.id, affiliationId: saiyan.id, hp: 150, attack: 20, defense: 12, speed: 14, energy: 120, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Vegeta', slug: 'vegeta', animeId: dbz.id, affiliationId: saiyan.id, hp: 145, attack: 19, defense: 12, speed: 14, energy: 120, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Broly', slug: 'broly', animeId: dbz.id, affiliationId: saiyan.id, hp: 180, attack: 23, defense: 14, speed: 13, energy: 140, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Daredevil', slug: 'daredevil', animeId: marvel.id, affiliationId: avengers.id, hp: 115, attack: 17, defense: 11, speed: 15, energy: 90, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Batman', slug: 'batman', animeId: dc.id, affiliationId: justiceLeague.id, hp: 125, attack: 16, defense: 12, speed: 13, energy: 95, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Jean Grey', slug: 'jean-grey', animeId: marvel.id, affiliationId: xMen.id, hp: 110, attack: 22, defense: 10, speed: 12, energy: 140, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Emma Frost', slug: 'emma-frost', animeId: marvel.id, affiliationId: xMen.id, hp: 115, attack: 18, defense: 13, speed: 11, energy: 130, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Superman', slug: 'superman', animeId: dc.id, affiliationId: justiceLeague.id, hp: 200, attack: 24, defense: 18, speed: 16, energy: 160, imageUrl: null } }),
      prisma.character.create({ data: { name: 'Wonder Woman', slug: 'wonder-woman', animeId: dc.id, affiliationId: justiceLeague.id, hp: 170, attack: 21, defense: 15, speed: 15, energy: 130, imageUrl: null } }),
    ]);

  // Skills
  const skills = await prisma.$transaction([
    prisma.skill.create({ data: { name: 'Rasengan', category: 'NINJUTSU', power: 24, energyCost: 20, cooldown: 2, tags: ["burst", "knockback"] } }),
    prisma.skill.create({ data: { name: 'Chidori', category: 'NINJUTSU', power: 26, energyCost: 22, cooldown: 2, tags: ["pierce", "crit"] } }),
    prisma.skill.create({ data: { name: 'Hadō #31: Shakkahō', category: 'HADO', power: 22, energyCost: 18, cooldown: 2, tags: ["burn"] } }),
    prisma.skill.create({ data: { name: 'Bakudō #1: Sai', category: 'BAKUDO', power: 0, energyCost: 12, cooldown: 3, tags: ["stun"] } }),
    prisma.skill.create({ data: { name: 'Kamehameha', category: 'KI', power: 28, energyCost: 25, cooldown: 3, tags: ["beam"] } }),
    prisma.skill.create({ data: { name: 'Galick Gun', category: 'KI', power: 27, energyCost: 24, cooldown: 3, tags: ["beam"] } }),
    prisma.skill.create({ data: { name: 'Spirit Bomb', category: 'KI', power: 35, energyCost: 40, cooldown: 5, tags: ["charge", "aoe"] } }),
    prisma.skill.create({ data: { name: 'Final Flash', category: 'KI', power: 34, energyCost: 32, cooldown: 4, tags: ["beam", "armorbreak"] } }),
    prisma.skill.create({ data: { name: 'Radar Sense', category: 'OTHER', power: 0, energyCost: 8, cooldown: 2, tags: ["reveal", "dodge"] } }),
    prisma.skill.create({ data: { name: 'Batarang Volley', category: 'OTHER', power: 18, energyCost: 14, cooldown: 2, tags: ["bleed", "multi-hit"] } }),
    prisma.skill.create({ data: { name: 'Phoenix Surge', category: 'OTHER', power: 32, energyCost: 35, cooldown: 4, tags: ["burn", "aoe"] } }),
    prisma.skill.create({ data: { name: 'Diamond Skin', category: 'OTHER', power: 0, energyCost: 18, cooldown: 3, tags: ["fortify"] } }),
    prisma.skill.create({ data: { name: 'Heat Vision', category: 'OTHER', power: 30, energyCost: 22, cooldown: 3, tags: ["beam", "burn"] } }),
    prisma.skill.create({ data: { name: 'Lasso of Truth', category: 'OTHER', power: 20, energyCost: 20, cooldown: 3, tags: ["stun", "bind"] } }),
  ]);

  const [
    rasengan,
    chidori,
    hado31,
    bakudo1,
    kamehameha,
    galickGun,
    spiritBomb,
    finalFlash,
    radarSense,
    batarangVolley,
    phoenixSurge,
    diamondSkin,
    heatVision,
    lassoOfTruth,
  ] = skills;

  // CharacterSkill links
  await prisma.$transaction([
    prisma.characterSkill.create({ data: { characterId: narutoChar.id, skillId: rasengan.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: sasuke.id, skillId: chidori.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: ichigo.id, skillId: hado31.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: rukia.id, skillId: bakudo1.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: goku.id, skillId: kamehameha.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: goku.id, skillId: spiritBomb.id, requiredLevel: 4 } }),
    prisma.characterSkill.create({ data: { characterId: vegeta.id, skillId: galickGun.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: vegeta.id, skillId: finalFlash.id, requiredLevel: 4 } }),
    prisma.characterSkill.create({ data: { characterId: broly.id, skillId: spiritBomb.id, requiredLevel: 5 } }),
    prisma.characterSkill.create({ data: { characterId: daredevil.id, skillId: radarSense.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: batman.id, skillId: batarangVolley.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: jeanGrey.id, skillId: phoenixSurge.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: emmaFrost.id, skillId: diamondSkin.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: superman.id, skillId: heatVision.id, requiredLevel: 1, learnedByDefault: true } }),
    prisma.characterSkill.create({ data: { characterId: wonderWoman.id, skillId: lassoOfTruth.id, requiredLevel: 1, learnedByDefault: true } }),
  ]);

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
  const nBase = await prisma.skillTreeNode.create({ data: { characterId: narutoChar.id, name: 'Shinobi Basics', description: 'Increase HP by 10', tier: 1, pointCost: 1 } });
  const nRasenganNode = await prisma.skillTreeNode.create({ data: { characterId: narutoChar.id, name: 'Master Rasengan', description: 'Unlock Rasengan', tier: 2, pointCost: 1, skillId: rasengan.id } });
  // Link prerequisites (manual join via updateMany not needed; Prisma handles self-rel many-to-many with explicit connect)
  await prisma.skillTreeNode.update({ where: { id: nRasenganNode.id }, data: { prerequisites: { connect: [{ id: nBase.id }] } } });

  // Dev user and owned character
  const user = await prisma.user.create({ data: { email: 'dev@example.com', username: 'devuser', name: 'Dev', passwordHash: 'dev', role: 'ADMIN' } });
  await prisma.userCharacter.create({ data: { userId: user.id, characterId: narutoChar.id, level: 1, experience: 0, pointsAvailable: 1 } });

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
