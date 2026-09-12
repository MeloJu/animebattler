import Image from 'next/image'

/**
 * Retrato de fallback para personagem sem arte.
 *
 * Antes, personagem sem imagem mostrava a string "No Image" — em inglês, num
 * jogo todo em português, e com três variações espalhadas por três telas. Com
 * 11 dos 60 personagens ainda sem arquivo de arte, isso aparecia bastante e
 * parecia defeito, não ausência.
 *
 * O monograma é gerado, não baixado: a arte dos personagens é material com
 * direito autoral e este repositório é público. Aqui só há iniciais e uma cor
 * derivada do próprio nome.
 *
 * A cor vem de um hash do nome, então é ESTÁVEL: o mesmo personagem tem sempre
 * a mesma cor, em toda tela e entre recarregamentos, o que faz o placeholder
 * funcionar como identificação em vez de ruído. Saturação e luminosidade são
 * fixas em valores médios para o texto branco ter contraste tanto no tema
 * claro quanto no escuro.
 */
export function CharacterMonogram({ name, className = '' }: { name: string; className?: string }) {
  const iniciais = name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]?.toUpperCase() ?? '')
    .join('')

  let hash = 0
  for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0
  const matiz = hash % 360

  return (
    <div
      className={`retrato-aura relative h-full w-full flex items-center justify-center overflow-hidden font-semibold text-white select-none ${className}`}
      style={{
        background: `linear-gradient(135deg, hsl(${matiz} 45% 42%), hsl(${(matiz + 40) % 360} 45% 28%))`,
        // O contêiner é quem declara containerType; o texto abaixo usa cqw
        // para acompanhar o tamanho do retrato, que varia de 80px na lista a
        // largura cheia na tela de batalha.
        containerType: 'inline-size',
      }}
      aria-hidden
    >
      {/* AURA: brilho radial que pulsa devagar, atrás das iniciais. É o que
          separa "placeholder esquecido" de "personagem cuja arte ainda não
          chegou" — o quadrado chapado parecia defeito. Tudo CSS: nada aqui é
          baixado, pelo mesmo motivo do monograma existir. */}
      <span
        className="retrato-aura-brilho absolute inset-0"
        style={{
          background: `radial-gradient(circle at 50% 58%, hsl(${(matiz + 20) % 360} 85% 62% / .55), transparent 62%)`,
        }}
      />

      {/* Linhas de energia diagonais, bem discretas — a textura de fundo que
          quadrinho e anime usam para dizer "tem pressão aqui". */}
      <span
        className="absolute inset-0 opacity-[0.13]"
        style={{
          backgroundImage:
            'repeating-linear-gradient(112deg, transparent 0 7px, rgba(255,255,255,.9) 7px 8px, transparent 8px 20px)',
        }}
      />

      {/* Vinheta: escurece as bordas e empurra o olho para o centro, onde
          está a inicial. */}
      <span
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 45%, transparent 45%, rgba(0,0,0,.42))' }}
      />

      <span
        className="relative text-[clamp(0.9rem,28cqw,2.5rem)] tracking-wide"
        style={{ textShadow: `0 0 18px hsl(${(matiz + 20) % 360} 90% 70% / .85), 0 2px 6px rgba(0,0,0,.55)` }}
      >
        {iniciais}
      </span>
    </div>
  )
}

// Covers dashboard and characters/[id] — both use next/image's `fill` mode.
// characters/page.tsx (the list) is deliberately NOT folded in here: it uses
// width/height + quality={90} instead of fill, a different enough shape that
// forcing it through this component would either drop the quality tuning or
// need a second rendering branch for one caller.
export function CharacterImage({
  src,
  alt,
  containerClassName,
  sizes,
  placeholderClassName,
}: {
  src: string | null
  alt: string
  containerClassName: string
  sizes?: string
  placeholderClassName?: string
}) {
  return (
    <div className={containerClassName}>
      {src ? (
        <Image src={src} alt={alt} fill className="object-cover" sizes={sizes} />
      ) : (
        <CharacterMonogram name={alt} className={placeholderClassName} />
      )}
    </div>
  )
}
