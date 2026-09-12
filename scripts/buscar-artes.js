// Busca retratos de personagem nos wikis de fã, via API do MediaWiki.
//
// POR QUE EXISTE: 13 dos 62 personagens não tinham arte nenhuma, e o resto
// estava em 230x350 — pequeno demais para tela grande. Rodar isto é mais
// rápido e mais consistente que caçar imagem a imagem, e deixa registrado DE
// ONDE cada arte veio (ver relatorio.json ao lado das baixadas).
//
// USO DA ARTE: decisão do dono do projeto, tomada com o risco explicitado —
// projeto educativo, sem fim comercial, com crédito visível em /creditos e no
// rodapé de todas as páginas. Ver app/lib/creditos.ts.
//
// TRÊS ARMADILHAS que este script já resolve, e que custaram uma rodada cada:
//
//   1. DOWNLOAD POR CURL, não pelo fetch do Node: o CDN da Fandom devolve 403
//      para o fetch e 200 para o curl, com o mesmo User-Agent.
//   2. FILTRAR ANTES DE CORTAR: cortar os N primeiros candidatos e só então
//      descartar banner/placeholder deixava personagem sem nenhuma arte.
//   3. _default VEM DA INFOBOX, não do melhor recorte. Ranquear só por
//      proporção elegia "Gojo criança" no lugar do Gojo adulto — a imagem da
//      infobox é a que a wiki trata como retrato canônico.
//
// As variantes (_v1, _v2...) existem para o jogador poder escolher e para o
// modo IA alternar. Instalar com scripts/instalar-artes.js.
const { execFileSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const UA = 'animebattler-educational/1.0 (projeto de estudo; creditos em /creditos)';
const MAX_POR_PERSONAGEM = 4;

const ALVOS = [
  { slug: 'satoru-gojo',      wiki: 'jujutsu-kaisen', titulo: 'Satoru Gojo',       nome: 'Satoru Gojo' },
  { slug: 'yuji-itadori',     wiki: 'jujutsu-kaisen', titulo: 'Yuji Itadori',      nome: 'Yuji Itadori' },
  { slug: 'megumi-fushiguro', wiki: 'jujutsu-kaisen', titulo: 'Megumi Fushiguro',  nome: 'Megumi Fushiguro' },
  { slug: 'nobara-kugisaki',  wiki: 'jujutsu-kaisen', titulo: 'Nobara Kugisaki',   nome: 'Nobara Kugisaki' },
  { slug: 'ryomen-sukuna',    wiki: 'jujutsu-kaisen', titulo: 'Sukuna',            nome: 'Sukuna' },
  { slug: 'suguru-geto',      wiki: 'jujutsu-kaisen', titulo: 'Suguru Geto',       nome: 'Suguru Geto' },
  { slug: 'mahito',           wiki: 'jujutsu-kaisen', titulo: 'Mahito',            nome: 'Mahito' },
  { slug: 'jogo',             wiki: 'jujutsu-kaisen', titulo: 'Jogo',              nome: 'Jogo' },
  { slug: 'hanami',           wiki: 'jujutsu-kaisen', titulo: 'Hanami',            nome: 'Hanami' },
  { slug: 'sung-jin-woo',     wiki: 'solo-leveling',  titulo: 'Sung Jinwoo',       nome: 'Sung Jinwoo' },
  { slug: 'deadpool',         wiki: 'marvel',         titulo: 'Wade Wilson (Earth-616)', nome: 'Wade Wilson' },
  { slug: 'patolino',         wiki: 'looneytunes',    titulo: 'Daffy Duck',        nome: 'Daffy Duck' },
  { slug: 'red',              wiki: 'pokemon',        titulo: 'Red (Origins)',     nome: 'Red' },
];

function curlJson(url) {
  const out = execFileSync('curl', ['-s', '--max-time', '25', '-A', UA, url], { maxBuffer: 20e6 });
  return JSON.parse(out.toString());
}

function baixar(url, destino) {
  execFileSync('curl', ['-s', '--max-time', '40', '-A', UA, '-o', destino, url], { maxBuffer: 60e6 });
  return fs.statSync(destino).size;
}

/** Serve como retrato? .gif é cena em movimento, não pose; ícones e genéricos fora. */
function ehRetrato(titulo, nome) {
  const t = titulo.replace(/^File:/, '');
  if (/\.(gif|svg)$/i.test(t)) return false;
  if (/^(Male|Female|Site-logo|Wiki|Placeholder)/i.test(t)) return false;
  // Cena de luta/técnica costuma vir com verbo no nome; retrato costuma ser
  // "Nome (Anime 2).png", "Nome (Volume 4).png", "Nome (Full).png".
  if (/\b(using|beating|blocks|blows|vs\.|hit by|killing|arrives|targets|poised|healing)\b/i.test(t)) return false;
  const primeiro = nome.split(' ')[0];
  return t.toLowerCase().startsWith(primeiro.toLowerCase());
}

(async () => {
  const destino = path.join(__dirname, 'baixadas');
  fs.mkdirSync(destino, { recursive: true });
  const relatorio = [];

  for (const alvo of ALVOS) {
    try {
      const lista = curlJson(`https://${alvo.wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(alvo.titulo)}&prop=images&format=json&imlimit=60`);
      const pagina = Object.values(lista?.query?.pages ?? {})[0];
      if (!pagina || pagina.missing !== undefined) { relatorio.push({ slug: alvo.slug, erro: 'página não existe: ' + alvo.titulo }); continue; }

      const candidatos = (pagina.images ?? []).map((i) => i.title).filter((t) => ehRetrato(t, alvo.nome)).slice(0, 14);
      if (candidatos.length === 0) { relatorio.push({ slug: alvo.slug, erro: 'nenhum retrato entre ' + (pagina.images?.length ?? 0) + ' imagens' }); continue; }

      // O retrato da INFOBOX é o canônico da página — é ele que vira _default.
      const infobox = curlJson(`https://${alvo.wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(alvo.titulo)}&prop=pageimages&format=json&piprop=name`);
      const nomeInfobox = Object.values(infobox?.query?.pages ?? {})[0]?.pageimage;
      const tituloInfobox = nomeInfobox ? 'File:' + nomeInfobox.replace(/_/g, ' ') : null;
      if (tituloInfobox && !candidatos.includes(tituloInfobox)) candidatos.unshift(tituloInfobox);

      const info = curlJson(`https://${alvo.wiki}.fandom.com/api.php?action=query&titles=${encodeURIComponent(candidatos.join('|'))}&prop=imageinfo&iiprop=url|size&iiurlwidth=1200&format=json`);

      // FILTRA E ORDENA ANTES DE BAIXAR. O card é vertical, então banner 16:9
      // vira uma tira do tronco no object-cover; e arquivo minúsculo em
      // dimensão grande é placeholder do wiki, não arte. Entre os que sobram,
      // o mais perto de 2:3 ganha — é a proporção que o card usa.
      const IDEAL = 0.68;
      const bons = Object.values(info?.query?.pages ?? {})
        .map((p) => {
          const ii = p.imageinfo?.[0];
          if (!ii) return null;
          const larg = ii.thumbwidth ?? ii.width;
          const alt = ii.thumbheight ?? ii.height;
          if (!larg || !alt) return null;
          return { titulo: p.title || '', url: ii.thumburl || ii.url, larg, alt, bytes: ii.size ?? 0, prop: larg / alt };
        })
        .filter((c) => c && c.prop < 0.95 && c.bytes > 25000)
        // Infobox primeiro (é o retrato canônico); o resto por proporção.
        .sort((a, b) => {
          const ai = a.titulo === tituloInfobox ? 0 : 1;
          const bi = b.titulo === tituloInfobox ? 0 : 1;
          if (ai !== bi) return ai - bi;
          return Math.abs(a.prop - IDEAL) - Math.abs(b.prop - IDEAL);
        })
        .slice(0, MAX_POR_PERSONAGEM);

      const arquivos = [];
      for (const c of bons) {
        const nomeArq = c.titulo.replace(/^File:/, '');
        const ext = /\.jpe?g$/i.test(nomeArq) ? 'jpg' : 'png';
        const variante = arquivos.length === 0 ? 'default' : `v${arquivos.length}`;
        const caminho = path.join(destino, `${alvo.slug}_${variante}.${ext}`);
        const bytes = baixar(caminho ? c.url : c.url, caminho);
        if (bytes < 20000) { fs.unlinkSync(caminho); continue; }
        arquivos.push({ variante, arquivo: path.basename(caminho), kb: Math.round(bytes / 1024), origem: nomeArq, dim: `${c.larg}x${c.alt}`, prop: c.prop.toFixed(2) });
      }
      relatorio.push({ slug: alvo.slug, ok: arquivos.length, arquivos });
    } catch (e) {
      relatorio.push({ slug: alvo.slug, erro: e.message.slice(0, 120) });
    }
  }

  fs.writeFileSync(path.join(__dirname, 'relatorio.json'), JSON.stringify(relatorio, null, 2));
  for (const r of relatorio) {
    if (r.erro) { console.log(`FALHA ${r.slug.padEnd(18)} ${r.erro}`); continue; }
    console.log(`${r.ok ? 'OK   ' : 'VAZIO'} ${r.slug.padEnd(18)} ${r.arquivos.map((a) => a.dim + ' (' + a.prop + ') ' + a.kb + 'K').join(', ')}`);
  }
})();
