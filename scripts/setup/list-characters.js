const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

(async () => {
  try {
    const characters = await prisma.character.findMany({ select: { id: true, name: true }, orderBy: { name: 'asc' } });
    for (const c of characters) {
      console.log(`${c.id} ${c.name}`);
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
})();
