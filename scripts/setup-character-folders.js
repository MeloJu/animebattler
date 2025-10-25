const { PrismaClient } = require('@prisma/client');
const fs = require('fs');
const path = require('path');

const prisma = new PrismaClient();

function slugify(name) {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function ensureDir(p) {
  if (!fs.existsSync(p)) {
    fs.mkdirSync(p, { recursive: true });
  }
  const gitkeep = path.join(p, '.gitkeep');
  if (!fs.existsSync(gitkeep)) {
    fs.writeFileSync(gitkeep, '');
  }
}

async function main() {
  try {
    const characters = await prisma.character.findMany({ select: { slug: true, name: true } });
    const root = path.join(process.cwd(), 'public', 'images', 'characters');
    ensureDir(root);

    for (const c of characters) {
      const slug = c.slug ?? slugify(c.name);
      const dir = path.join(root, slug);
      ensureDir(dir);
    }

    // Clean up legacy ID-based directories (without hyphen slug naming)
    const legacyDirs = fs.readdirSync(root, { withFileTypes: true })
      .filter((entry) => entry.isDirectory() && !characters.some((c) => (c.slug ?? slugify(c.name)) === entry.name))
      .filter((entry) => /^cmh[a-z0-9]+/i.test(entry.name));
    for (const dir of legacyDirs) {
      fs.rmSync(path.join(root, dir.name), { recursive: true, force: true });
      console.log(`Removed legacy character folder: ${dir.name}`);
    }

    const transformationMap = {
      goku: ['super-saiyan', 'super-saiyan-2', 'super-saiyan-3', 'super-saiyan-god', 'super-saiyan-blue', 'ultra-instinct'],
      vegeta: ['super-saiyan', 'super-saiyan-2', 'super-saiyan-4', 'super-saiyan-god', 'super-saiyan-blue', 'ultra-ego'],
      broly: ['wrathful', 'legendary-super-saiyan', 'full-power'],
    };

    const tRoot = path.join(process.cwd(), 'public', 'images', 'transformations');
    ensureDir(tRoot);

    for (const [characterSlug, forms] of Object.entries(transformationMap)) {
      const charDir = path.join(tRoot, characterSlug);
      ensureDir(charDir);
      for (const form of forms) {
        const formDir = path.join(charDir, form);
        ensureDir(formDir);
      }
    }

    console.log('Character and transformation folders ensured.');
  } catch (err) {
    console.error(err);
    process.exitCode = 1;
  } finally {
    await prisma.$disconnect();
  }
}

main();
