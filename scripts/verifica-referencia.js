// Confere se SCALING_REFERENCE ainda é a média do elenco.
//
// POR QUE EXISTE: a referência de energia estava em 165 enquanto a média real
// era 123. As outras três batiam com a média a menos de 2%. O resultado é que
// as três classes que escalam por energia — CONJURADOR, INVOCADOR e SUPORTE,
// metade do elenco — dividiam por um número 34% maior que o das outras, e
// somavam ~9,5 de bônus por golpe onde ATACANTE e VELOZ somavam ~13.
//
// Ninguém errou de propósito: o comentário da constante já mandava revisar os
// números quando o elenco crescesse. Só que revisar exigia abrir o banco e
// fazer a conta à mão, então na prática não acontecia. Isto é essa conta.
//
//   npm run balance:referencia
//
// Sai com código 1 se algum atributo divergir mais que TOLERANCIA, para poder
// entrar no CI depois se valer a pena.

const { PrismaClient } = require('@prisma/client');

const REFERENCIA = { attack: 19.8, defense: 12.4, speed: 13.9, energy: 123 };
const TOLERANCIA = 0.1;

// Qual atributo cada classe usa para escalar as habilidades dela. Espelha
// porClasse em prisma/catalog/skill-scaling.js.
const ESCALA_DA_CLASSE = {
  TANQUE: 'defense',
  ATACANTE: 'attack',
  VELOZ: 'speed',
  SUPORTE: 'energy',
  CONJURADOR: 'energy',
  INVOCADOR: 'energy',
};

async function main() {
  const prisma = new PrismaClient();
  const elenco = await prisma.character.aggregate({
    _avg: { attack: true, defense: true, speed: true, energy: true },
  });

  let divergente = false;
  console.log('\natributo   referência   média do elenco   desvio');
  for (const [stat, ref] of Object.entries(REFERENCIA)) {
    const media = elenco._avg[stat];
    const desvio = (media - ref) / ref;
    if (Math.abs(desvio) > TOLERANCIA) divergente = true;
    console.log(
      '  ' + stat.padEnd(9),
      String(ref).padStart(8),
      media.toFixed(1).padStart(16),
      `${desvio >= 0 ? '+' : ''}${(desvio * 100).toFixed(1)}%`.padStart(9),
      Math.abs(desvio) > TOLERANCIA ? '  <-- fora da tolerância' : ''
    );
  }

  // A conta que importa de verdade: quanto de bônus por golpe cada classe
  // recebe. É isso que a normalização promete equalizar, e é onde o defeito
  // aparecia — as três classes de energia ficavam ~25% abaixo das outras.
  const porClasse = await prisma.character.groupBy({
    by: ['class'],
    _avg: { attack: true, defense: true, speed: true, energy: true },
  });

  console.log('\nbônus de dano que cada classe recebe do atributo de escala:');
  const linhas = porClasse
    .map((c) => {
      const stat = ESCALA_DA_CLASSE[c.class];
      return { classe: c.class, stat, bonus: (10 * c._avg[stat]) / REFERENCIA[stat] };
    })
    .sort((a, b) => b.bonus - a.bonus);

  for (const l of linhas) {
    console.log('  ' + l.classe.padEnd(11), l.stat.padEnd(9), l.bonus.toFixed(1).padStart(5));
  }

  const espalhamento = (linhas[0].bonus - linhas[linhas.length - 1].bonus) / linhas[0].bonus;
  console.log(`\n  distância entre a classe mais e a menos favorecida: ${(espalhamento * 100).toFixed(0)}%`);
  if (espalhamento > TOLERANCIA) {
    divergente = true;
    console.log('  ^ acima da tolerância: alguma classe está escalando pior que as outras.');
  }

  await prisma.$disconnect();
  process.exit(divergente ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
