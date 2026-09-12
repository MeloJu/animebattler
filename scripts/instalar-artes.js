// Instala as artes baixadas em public/images/characters/<slug>/, detectando o
// formato REAL pelos bytes: a CDN da Fandom devolve WebP mesmo quando a URL
// termina em .png, e salvar WebP com nome .png é mentira que quebra na frente.
const fs = require('fs');
const path = require('path');

const origem = path.join(__dirname, 'baixadas');
const destinoRaiz = path.join(__dirname, '..', 'public', 'images', 'characters');

// Depois de instalar, rodar `npm run catalog:sync` para o banco apontar para
// os arquivos novos (ver syncCharacterImages em prisma/sync-catalog.js).

function formatoReal(b) {
  if (b[0] === 0x89 && b.toString('ascii', 1, 4) === 'PNG') return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpg';
  if (b.toString('ascii', 0, 4) === 'RIFF' && b.toString('ascii', 8, 12) === 'WEBP') return 'webp';
  if (b.toString('ascii', 0, 3) === 'GIF') return 'gif';
  return null;
}

let instalados = 0;
const porSlug = {};

for (const arquivo of fs.readdirSync(origem)) {
  const m = arquivo.match(/^(.+?)_(default|v\d+)\.[a-z]+$/i);
  if (!m) { console.log('  (ignorado) ' + arquivo); continue; }
  const [, slug, variante] = m;

  const buf = fs.readFileSync(path.join(origem, arquivo));
  const fmt = formatoReal(buf);
  if (!fmt || fmt === 'gif') { console.log('  (formato inválido) ' + arquivo); continue; }

  const pasta = path.join(destinoRaiz, slug);
  fs.mkdirSync(pasta, { recursive: true });
  const nomeFinal = `${slug}_${variante}.${fmt}`;
  fs.writeFileSync(path.join(pasta, nomeFinal), buf);
  (porSlug[slug] ??= []).push(nomeFinal);
  instalados++;
}

for (const [slug, arqs] of Object.entries(porSlug)) {
  console.log(`${slug.padEnd(18)} ${arqs.sort().join(', ')}`);
}
console.log(`\n${instalados} arquivos instalados em ${Object.keys(porSlug).length} personagens.`);
