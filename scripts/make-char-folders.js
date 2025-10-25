const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

(async () => {
  const prisma = new PrismaClient();
  try {
    const names = process.argv.slice(2);
    if (names.length === 0) {
      console.error('Usage: node scripts/make-char-folders.js "Name A" "Name B"');
      process.exit(1);
    }
    const chars = await prisma.character.findMany({ where: { name: { in: names } }, select: { id: true, name: true } });
    const missing = names.filter(n => !chars.find(c => c.name === n));
    if (missing.length) {
      console.warn('Not found:', missing.join(', '));
    }
    const base = path.join(process.cwd(), 'public', 'images', 'characters');
    for (const c of chars) {
      const dir = path.join(base, c.id);
      fs.mkdirSync(dir, { recursive: true });
      const keep = path.join(dir, '.gitkeep');
      if (!fs.existsSync(keep)) fs.writeFileSync(keep, '');
      console.log('Ensured folder:', dir);
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
