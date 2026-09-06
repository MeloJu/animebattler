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
const storyJujutsu = require('./catalog/story-jujutsu');
const equipmentCatalog = require('./catalog/equipment');
const ladderCatalog = require('./catalog/skill-ladders');
const characterCatalog = require('./catalog/characters');
const kitCatalog = require('./catalog/kits');
const scalingCatalog = require('./catalog/skill-scaling');
const summonerCatalog = require('./catalog/summoners');
const signatureCatalog = require('./catalog/signatures');
const jujutsuCatalog = require('./catalog/jujutsu');

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

/**
 * Sincroniza UM arco de história. Recebe o arco como parâmetro em vez de ler
 * um capítulo fixo, porque o jogo passou a ter mais de um: Soul Society
 * (Bleach) e Incidente de Shibuya (Jujutsu Kaisen). A tela de história já
 * iterava capítulos desde sempre; era só o catálogo que era de arco único.
 */
async function syncStory(animeId, arco) {
  const cap = arco.chapter;
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

  for (const [i, { enemyCharacterName, enemyMonsterName, ...stage }] of arco.stages.entries()) {
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

/**
 * Escadas de habilidade por afiliação.
 *
 * Só os shinigami tinham progressão de habilidade (a escada de kidō, 15
 * entradas até o nível 45). Os outros 28 personagens ficavam com as 4 do kit
 * inicial para sempre — o que fazia o mesmo estágio dar 98% de vitória com um
 * e 26% com outro. Ver prisma/catalog/skill-ladders.js.
 *
 * Como o resto do sync, só faz upsert. Se um personagem mudar de afiliação, as
 * habilidades da escada antiga permanecem: apagá-las tiraria do jogador algo
 * que ele já podia equipar.
 */
async function syncSkillLadders() {
  // 1. As linhas de Skill em si, chaveadas por (name, category).
  const idPorNome = {};
  for (const def of ladderCatalog.allSkills()) {
    const { _level, ...skill } = def;
    void _level;
    const atual = await prisma.skill.findUnique({
      where: { name_category: { name: skill.name, category: skill.category } },
    });
    registra('skill', skill.name, diff(atual, skill));
    if (!DRY_RUN) {
      const row = await prisma.skill.upsert({
        where: { name_category: { name: skill.name, category: skill.category } },
        create: skill,
        update: skill,
      });
      idPorNome[skill.name] = row.id;
    } else if (atual) {
      idPorNome[skill.name] = atual.id;
    }
  }

  // 2. Ligar cada escada aos personagens da afiliação alvo.
  for (const ladder of ladderCatalog.ladders) {
    for (const alvo of ladderCatalog.targetsOf(ladder)) {
      const anime = await prisma.anime.findUnique({ where: { slug: alvo.anime }, select: { id: true } });
      if (!anime) throw new Error(`Escada referencia anime inexistente: ${alvo.anime}`);
      const afiliacao = await prisma.affiliation.findUnique({
        where: { animeId_name: { animeId: anime.id, name: alvo.affiliation } },
        select: { id: true },
      });
      if (!afiliacao) throw new Error(`Escada referencia afiliação inexistente: ${alvo.affiliation}`);

      const personagens = await prisma.character.findMany({
        where: { affiliationId: afiliacao.id },
        select: { id: true, name: true },
      });

      for (const c of personagens) {
        for (const def of ladder.skills) {
          const skillId = idPorNome[def.name];
          if (!skillId) {
            if (DRY_RUN) continue; // a skill ainda não existe numa simulação
            throw new Error(`Skill da escada sem id: ${def.name}`);
          }
          const desejado = { characterId: c.id, skillId, requiredLevel: def.level, learnedByDefault: false };
          const atual = await prisma.characterSkill.findUnique({
            where: { characterId_skillId: { characterId: c.id, skillId } },
          });

          // TRAVA: a escada nunca PIORA um vínculo que já existe. Se o
          // personagem já tem essa habilidade no kit inicial, ou já a libera
          // num nível mais baixo, fica como está.
          //
          // Sem isso, uma escada que reuse um nome de golpe de assinatura
          // empurraria esse golpe para um nível alto e o tiraria do
          // personagem — silenciosamente, sem erro nenhum. Aconteceu de
          // verdade ao escrever estas escadas, com três nomes.
          const pioraria = atual && (atual.learnedByDefault || atual.requiredLevel <= def.level);
          if (pioraria) {
            relatorio.iguais += 1;
            continue;
          }

          registra('escada', `${c.name} · ${def.name} (nv ${def.level})`, diff(atual, desejado));
          if (!DRY_RUN) {
            await prisma.characterSkill.upsert({
              where: { characterId_skillId: { characterId: c.id, skillId } },
              create: desejado,
              update: { requiredLevel: def.level },
            });
          }
        }
      }
    }
  }
}

/**
 * Classe e stats base dos personagens.
 *
 * Os stats variavam 1,88x entre o mais forte e a mais fraca, sem custo nem
 * desbloqueio separando os dois — ou seja, havia uma escolha certa e várias
 * erradas. Ver prisma/catalog/characters.js para como os números saíram.
 */
async function syncCharacters() {
  // Animes e afiliações que só existem por causa dos personagens novos.
  for (const a of characterCatalog.novosAnimes) {
    const atual = await prisma.anime.findUnique({ where: { slug: a.slug } });
    registra('anime', a.name, diff(atual, { name: a.name, slug: a.slug }));
    let animeId = atual?.id;
    if (!DRY_RUN) {
      const row = await prisma.anime.upsert({
        where: { slug: a.slug },
        create: { name: a.name, slug: a.slug },
        update: { name: a.name },
      });
      animeId = row.id;
    }
    if (!animeId) continue;
    for (const nome of a.affiliations) {
      const atualAf = await prisma.affiliation.findUnique({
        where: { animeId_name: { animeId, name: nome } },
      });
      registra('afiliação', `${a.name} · ${nome}`, diff(atualAf, { animeId, name: nome }));
      if (!DRY_RUN && !atualAf) await prisma.affiliation.create({ data: { animeId, name: nome } });
    }
  }

  // Classe e stats dos que já existem, casados por nome.
  for (const c of characterCatalog.characters) {
    const atual = await prisma.character.findFirst({ where: { name: c.name } });
    if (!atual) {
      console.log(`  (aviso) personagem do catálogo não existe neste banco: ${c.name}`);
      continue;
    }
    const desejado = {
      class: c.class, hp: c.hp, attack: c.attack,
      defense: c.defense, speed: c.speed, energy: c.energy,
    };
    registra('personagem', c.name, diff(atual, desejado));
    if (!DRY_RUN) await prisma.character.update({ where: { id: atual.id }, data: desejado });
  }

  // Personagens novos.
  for (const c of characterCatalog.novosPersonagens) {
    const atual = await prisma.character.findUnique({ where: { slug: c.slug } });
    const anime = await prisma.anime.findUnique({ where: { slug: c.anime }, select: { id: true } });
    if (!anime) {
      if (DRY_RUN) { registra('personagem', c.name, { acao: 'criar', campos: ['novo'] }); continue; }
      throw new Error(`Personagem novo referencia anime inexistente: ${c.anime}`);
    }
    const af = await prisma.affiliation.findUnique({
      where: { animeId_name: { animeId: anime.id, name: c.affiliation } },
      select: { id: true },
    });
    const desejado = {
      name: c.name, slug: c.slug, animeId: anime.id, affiliationId: af?.id ?? null,
      class: c.class, hp: c.hp, attack: c.attack, defense: c.defense, speed: c.speed, energy: c.energy,
    };
    registra('personagem', c.name, diff(atual, desejado));
    if (!DRY_RUN) {
      await prisma.character.upsert({ where: { slug: c.slug }, create: desejado, update: desejado });
    }
  }
}

/**
 * Kit próprio de cada personagem, escalonado por nível.
 *
 * DIFERENÇA CRÍTICA PARA syncSkillLadders: aqui o sync PODE aumentar o
 * requiredLevel de um vínculo existente. É o objetivo do arquivo — todo kit
 * de assinatura estava inteiramente no nível 1, então a identidade do
 * personagem era entregue de uma vez na primeira batalha e nunca mais
 * crescia. A trava de nunca-piorar da escada existe para proteger o kit;
 * aplicá-la aqui impediria justamente a mudança que se quer.
 *
 * Não é destrutivo para quem já joga: getEligiblePlayerSkills recalcula a
 * elegibilidade a partir do nível a cada batalha, então quem já passou do
 * portão continua com a habilidade.
 */
async function syncKits() {
  for (const kit of kitCatalog.kits) {
    const c = await prisma.character.findFirst({
      where: { name: kit.character },
      select: { id: true, name: true },
    });
    if (!c) throw new Error(`Kit referencia personagem inexistente: ${kit.character}`);

    for (const def of kit.skills) {
      const skill = await prisma.skill.findUnique({
        where: { name_category: { name: def.skill, category: def.category } },
        select: { id: true },
      });
      if (!skill) throw new Error(`Kit referencia habilidade inexistente: ${def.skill} (${def.category})`);

      const atual = await prisma.characterSkill.findUnique({
        where: { characterId_skillId: { characterId: c.id, skillId: skill.id } },
      });
      const desejado = {
        characterId: c.id,
        skillId: skill.id,
        requiredLevel: def.level,
        learnedByDefault: def.level === 1,
      };

      registra('kit', `${c.name} · ${def.skill} (nv ${def.level})`, diff(atual, desejado));
      if (!DRY_RUN) {
        await prisma.characterSkill.upsert({
          where: { characterId_skillId: { characterId: c.id, skillId: skill.id } },
          create: desejado,
          update: { requiredLevel: def.level, learnedByDefault: def.level === 1 },
        });
      }
    }
  }
}

/**
 * Atributo de escala de cada habilidade. Ver prisma/catalog/skill-scaling.js
 * para o raciocínio; aqui só se aplica a regra.
 *
 * Roda por ÚLTIMO de propósito: a regra do kit depende da classe do dono, e
 * a classe é escrita por syncCharacters. Rodar antes leria classe velha.
 */
async function syncSkillScaling() {
  const skills = await prisma.skill.findMany({
    select: {
      id: true,
      name: true,
      category: true,
      scalingStat: true,
      characterLinks: { select: { character: { select: { class: true } } } },
    },
  });

  // Escada declarada vence a regra por classe: escada é compartilhada, então
  // "a classe do dono" não é uma pergunta com resposta.
  const statDaEscada = {};
  for (const ladder of ladderCatalog.ladders) {
    if (!ladder.scalingStat) continue;
    for (const sk of ladder.skills) statDaEscada[sk.name] = ladder.scalingStat;
  }

  for (const sk of skills) {
    const classes = sk.characterLinks.map((l) => l.character.class);
    // Assinatura (um dono) decide pela classe. Técnica compartilhada decide
    // pelo tema: categoria, ou a escada declarada quando a categoria é OTHER
    // e portanto não distingue nada.
    const desejado =
      classes.length === 1
        ? scalingCatalog.scalingStatDe(sk.category, classes)
        : scalingCatalog.porCategoria[sk.category] ||
          statDaEscada[sk.name] ||
          scalingCatalog.scalingStatDe(sk.category, classes);
    if (sk.scalingStat === desejado) {
      relatorio.iguais += 1;
      continue;
    }
    registra('escala', `${sk.name} (${sk.category}) ${sk.scalingStat} -> ${desejado}`, { acao: 'atualizar', campos: ['scalingStat'] });
    if (!DRY_RUN) {
      await prisma.skill.update({ where: { id: sk.id }, data: { scalingStat: desejado } });
    }
  }
}

/**
 * Kits dos invocadores. Ver prisma/catalog/summoners.js para o desenho.
 *
 * Diferente de syncKits, este arquivo CRIA as habilidades além de ligá-las:
 * os três invocadores entraram no elenco sem nenhuma, então não há linha de
 * Skill anterior para reaproveitar.
 */
async function syncSummoners() {
  // Invocadores e ampliações de assinatura passam pelo mesmo caminho: os dois
  // CRIAM habilidades além de ligá-las, ao contrário de syncKits, que só
  // re-escalona vínculos que já existem.
  for (const inv of [...summonerCatalog.summoners, ...signatureCatalog.signatures, ...jujutsuCatalog.jujutsuKits]) {
    const c = await prisma.character.findFirst({
      where: { name: inv.character },
      select: { id: true, name: true },
    });
    if (!c) throw new Error(`Invocador inexistente no banco: ${inv.character}`);

    for (const def of inv.skills) {
      const { level, ...skill } = def;
      const atual = await prisma.skill.findUnique({
        where: { name_category: { name: skill.name, category: skill.category } },
      });
      registra('invocacao', skill.name, diff(atual, skill));

      if (DRY_RUN) continue;

      const row = await prisma.skill.upsert({
        where: { name_category: { name: skill.name, category: skill.category } },
        create: skill,
        update: skill,
      });

      const link = { characterId: c.id, skillId: row.id, requiredLevel: level, learnedByDefault: level === 1 };
      const linkAtual = await prisma.characterSkill.findUnique({
        where: { characterId_skillId: { characterId: c.id, skillId: row.id } },
      });
      registra('invocacao', `${c.name} · ${skill.name} (nv ${level})`, diff(linkAtual, link));
      await prisma.characterSkill.upsert({
        where: { characterId_skillId: { characterId: c.id, skillId: row.id } },
        create: link,
        update: { requiredLevel: level, learnedByDefault: level === 1 },
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
  await syncStory(bleach.id, storyCatalog);

  // Segundo arco. Se o anime não existir ainda (banco antigo), syncCharacters
  // o cria mais abaixo — então numa primeira passada o arco é pulado e entra
  // na seguinte, em vez de derrubar o sync inteiro.
  const jjk = await prisma.anime.findUnique({ where: { slug: storyJujutsu.chapter.animeSlug } });
  if (jjk) {
    await syncStory(jjk.id, storyJujutsu);
  } else {
    console.log('  (Jujutsu Kaisen ainda não existe neste banco — o arco entra na próxima passada)');
  }
  await syncCharacters();
  await syncKits();
  await syncSummoners();
  await syncSkillLadders();
  await syncSkillScaling();

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
