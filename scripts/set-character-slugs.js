const { PrismaClient } = require('@prisma/client');

const prisma = new PrismaClient();

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

(async () => {
  try {
    const characters = await prisma.character.findMany({ select: { id: true, name: true, slug: true } });
    for (const character of characters) {
      const slug = slugify(character.name);
      if (character.slug !== slug) {
        await prisma.character.update({ where: { id: character.id }, data: { slug } });
        console.log(`Updated ${character.name} -> ${slug}`);
      }
    }
    console.log('Slug sync complete.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
})();
