const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

(async () => {
  const prisma = new PrismaClient();
  try {
    // Map of Character Name -> default filename
    const mapping = {
      'naruto-uzumaki': 'naruto_default.png',
      'vegeta': 'vegeta_default.png',
      'jean-grey': 'jean_default2.png',
    };

    const slugs = Object.keys(mapping);
    const chars = await prisma.character.findMany({ where: { slug: { in: slugs } }, select: { id: true, name: true, slug: true } });

    const charactersRoot = path.join(process.cwd(), 'public', 'images', 'characters');

    function findExistingAsset(filename) {
      if (!fs.existsSync(charactersRoot)) return null;
      const dirs = fs.readdirSync(charactersRoot, { withFileTypes: true });
      for (const dir of dirs) {
        if (!dir.isDirectory()) continue;
        const candidate = path.join(charactersRoot, dir.name, filename);
        if (fs.existsSync(candidate)) return candidate;
      }
      return null;
    }

    for (const c of chars) {
      const file = mapping[c.slug];
      const rel = `/images/characters/${c.slug}/${file}`;
      const targetDir = path.join(charactersRoot, c.slug);
      const abs = path.join(targetDir, file);

      if (!fs.existsSync(abs)) {
        const source = findExistingAsset(file);
        if (source) {
          fs.mkdirSync(targetDir, { recursive: true });
          fs.copyFileSync(source, abs);
          console.log(`Copied ${file} into ${targetDir}`);
        }
      }

      if (fs.existsSync(abs)) {
        await prisma.character.update({ where: { id: c.id }, data: { imageUrl: rel.replace(/\\/g, '/') } });
        console.log(`Set default image for ${c.name}: ${rel}`);
      } else {
        console.warn(`File not found for ${c.name}: ${abs}`);
      }
    }
  } catch (e) {
    console.error(e);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
})();
