/**
 * Sincroniza o catálogo (modo história e loja) sem tocar em dado de jogador.
 *
 * Por que existe: o `seed.js` é destrutivo — apaga usuários, batalhas e
 * progresso antes de repovoar. Isso serve para banco novo, mas é inviável
 * assim que existir um jogador de verdade: adicionar um equipamento novo não
 * pode custar a conta de todo mundo.
 *
 * Este script só faz upsert, usando as chaves naturais do schema
 * (Equipment.name, Skill.name+category, StoryChapter.slug,
 * StoryStage.chapterId+order). Rodar duas vezes seguidas tem o mesmo efeito
 * de rodar uma: a segunda execução não reporta nenhuma mudança.
 *
 * Nunca escreve em User, UserCharacter, Battle, UserEquipment,
 * UserStoryProgress nem em nenhuma outra tabela de jogador.
 *
 * NÃO REMOVE NADA, e isso é deliberado: tirar um item do catálogo aqui não o
 * apaga do banco. Um Equipment já comprado tem UserEquipment apontando pra
 * ele — apagar quebraria o inventário de quem pagou. Para aposentar um item,
 * o caminho é deixar de vendê-lo (algo como um campo `available`), não
 * deletar a linha.
 *
 *   node prisma/sync-catalog.js --dry-run   # mostra o que mudaria
 *   node prisma/sync-catalog.js             # aplica
 */
const { PrismaClient } = require('@prisma/client');
const storyCatalog = require('./catalog/story');
const equipmentCatalog = require('./catalog/equipment');

const prisma = new PrismaClient();
const DRY_RUN = process.argv.includes('--dry-run');

/**
 * Serializa com as chaves de objeto ordenadas.
 *
 * Necessário porque colunas Json viram `jsonb` no Postgres, e jsonb não
 * preserva a ordem das chaves: `{type, target}` volta do banco como
 * `{target, type}`. Comparar com JSON.stringify direto acusaria diferença em
 * toda skill com efeitos, em toda execução — o sync passaria a mentir que há
 * algo pra atualizar quando não há.
 */
function canonico(valor) {
  if (valor === null || valor === undefined) return 'null';
  if (Array.isArray(valor)) return '[' + valor.map(canonico).join(',') + ']';
  if (typeof valor === 'object') {
    if (valor instanceof Date) return JSON.stringify(valor);
    const chaves = Object.keys(valor).sort();
    return '{' + chaves.map((k) => JSON.stringify(k) + ':' + canonico(valor[k])).join(',') + '}';
  }
  return JSON.stringify(valor);
}

/** Campos que o catálogo controla — o resto da linha no banco não é tocado. */
function diff(existing, desired) {
  if (!existing) return { acao: 'criar', campos: Object.keys(desired) };
  const campos = Object.keys(desired).filter((k) => {
    const a = existing[k];
    const b = desired[k];
    if (a instanceof Date || b instanceof Date) return false;
    return canonico(a) !== canonico(b);
  });
  return campos.length ? { acao: 'atualizar', campos } : { acao: 'igual', campos: [] };
}

const relatorio = { criados: [], atualizados: [], iguais: 0 };

function registra(tipo, nome, d) {
  if (d.acao === 'igual') relatorio.iguais += 1;
  else if (d.acao === 'criar') relatorio.criados.push(`${tipo}: ${nome}`);
  else relatorio.atualizados.push(`${tipo}: ${nome} (${d.campos.join(', ')})`);
}

async function syncEquipmentSkills(animeId) {
  const idPorNome = {};

  for (const def of equipmentCatalog.equipmentSkills) {
    const desejado = {
      name: def.name,
      category: def.category,
      power: def.power,
      energyCost: def.energyCost,
      cooldown: def.cooldown,
      tags: def.tags,
      effects: def.effects,
    };
    const atual = await prisma.skill.findUnique({
      where: { name_category: { name: def.name, category: def.category } },
    });
    registra('skill', def.name, diff(atual, desejado));

    if (!DRY_RUN) {
      const row = await prisma.skill.upsert({
        where: { name_category: { name: def.name, category: def.category } },
        create: desejado,
        update: desejado,
      });
      idPorNome[def.name] = row.id;
    } else if (atual) {
      idPorNome[def.name] = atual.id;
    }
  }

  void animeId;
  return idPorNome;
}

async function syncEquipment(animeId, skillIdPorNome) {
  for (const { grantedSkillName, ...def } of equipmentCatalog.equipment) {
    const grantedSkillId = grantedSkillName ? skillIdPorNome[grantedSkillName] ?? null : null;

    // Num dry-run a skill nova ainda não existe, então o id vem nulo e a
    // comparação apontaria uma diferença falsa. Só é checado de verdade na
    // aplicação.
    if (!DRY_RUN && grantedSkillName && !grantedSkillId) {
      throw new Error(`Equipamento "${def.name}" referencia skill inexistente: ${grantedSkillName}`);
    }

    const desejado = {
      name: def.name,
      description: def.description,
      slot: def.slot,
      rarity: def.rarity,
      price: def.price,
      requiredLevel: def.requiredLevel ?? 1,
      flatHpBonus: def.flatHpBonus ?? 0,
      flatAttackBonus: def.flatAttackBonus ?? 0,
      flatDefenseBonus: def.flatDefenseBonus ?? 0,
      flatSpeedBonus: def.flatSpeedBonus ?? 0,
      animeId,
      grantedSkillId,
    };

    const atual = await prisma.equipment.findUnique({ where: { name: def.name } });
    registra('equipamento', def.name, diff(atual, DRY_RUN && !atual ? { ...desejado, grantedSkillId: undefined } : desejado));

    if (!DRY_RUN) {
      await prisma.equipment.upsert({ where: { name: def.name }, create: desejado, update: desejado });
    }
  }
}

async function syncStory(animeId) {
  const cap = storyCatalog.chapter;
  const desejadoCap = {
    animeId,
    slug: cap.slug,
    title: cap.title,
    description: cap.description,
    order: cap.order,
  };
  const capAtual = await prisma.storyChapter.findUnique({ where: { slug: cap.slug } });
  registra('capítulo', cap.title, diff(capAtual, desejadoCap));

  let chapterId = capAtual?.id;
  if (!DRY_RUN) {
    const row = await prisma.storyChapter.upsert({
      where: { slug: cap.slug },
      create: desejadoCap,
      update: desejadoCap,
    });
    chapterId = row.id;
  }
  if (!chapterId) {
    console.log('  (capítulo ainda não existe — estágios seriam criados junto)');
    return;
  }

  for (const [i, { enemyCharacterName, enemyMonsterName, ...stage }] of storyCatalog.stages.entries()) {
    const order = i + 1;

    // Inimigo vem por nome no catálogo; aqui vira id. Se o personagem não
    // existir neste banco, é melhor falhar alto do que gravar um estágio
    // impossível de jogar.
    let enemyCharacterId = null;
    let enemyMonsterId = null;
    if (enemyCharacterName) {
      const c = await prisma.character.findFirst({ where: { name: enemyCharacterName }, select: { id: true } });
      if (!c) throw new Error(`Estágio "${stage.title}" referencia personagem inexistente: ${enemyCharacterName}`);
      enemyCharacterId = c.id;
    }
    if (enemyMonsterName) {
      const m = await prisma.monster.findUnique({ where: { name: enemyMonsterName }, select: { id: true } });
      if (!m) throw new Error(`Estágio "${stage.title}" referencia monstro inexistente: ${enemyMonsterName}`);
      enemyMonsterId = m.id;
    }

    const desejado = { ...stage, chapterId, order, enemyCharacterId, enemyMonsterId };
    const atual = await prisma.storyStage.findUnique({
      where: { chapterId_order: { chapterId, order } },
    });
    registra('estágio', `${order}. ${stage.title}`, diff(atual, desejado));

    if (!DRY_RUN) {
      await prisma.storyStage.upsert({
        where: { chapterId_order: { chapterId, order } },
        create: desejado,
        update: desejado,
      });
    }
  }
}

async function main() {
  console.log(DRY_RUN ? '— simulação (nada será gravado) —\n' : '— sincronizando catálogo —\n');

  const bleach = await prisma.anime.findUnique({ where: { slug: 'bleach' } });
  if (!bleach) {
    throw new Error(
      'Anime "bleach" não existe neste banco. Este script sincroniza catálogo sobre uma base já povoada — ' +
        'num banco vazio, rode o seed primeiro.'
    );
  }

  const skillIds = await syncEquipmentSkills(bleach.id);
  await syncEquipment(bleach.id, skillIds);
  await syncStory(bleach.id);

  console.log(`sem alteração: ${relatorio.iguais}`);
  if (relatorio.criados.length) {
    console.log(`\ncriar (${relatorio.criados.length}):`);
    relatorio.criados.forEach((l) => console.log('  + ' + l));
  }
  if (relatorio.atualizados.length) {
    console.log(`\natualizar (${relatorio.atualizados.length}):`);
    relatorio.atualizados.forEach((l) => console.log('  ~ ' + l));
  }
  if (!relatorio.criados.length && !relatorio.atualizados.length) {
    console.log('\ncatálogo já está em dia.');
  } else if (DRY_RUN) {
    console.log('\nrode sem --dry-run para aplicar.');
  }

  // Nenhuma tabela de jogador é tocada — dito aqui porque é a garantia que
  // justifica rodar isto em produção.
  console.log('\nnenhum dado de jogador foi lido ou alterado.');
}

main()
  .catch((e) => {
    console.error('\nfalhou:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
