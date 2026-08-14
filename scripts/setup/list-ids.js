const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
  const names = process.argv.slice(2);
  const where = names.length ? { name: { in: names } } : {};
  const chars = await prisma.character.findMany({ where, select: { id: true, name: true } });
  for (const c of chars) console.log(`${c.name}: ${c.id}`);
  await prisma.$disconnect();
})();
