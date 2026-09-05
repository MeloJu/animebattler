import Image from 'next/image'

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
  placeholderClassName = 'h-full w-full flex items-center justify-center text-sm text-muted',
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
        <div className={placeholderClassName}>No Image</div>
      )}
    </div>
  )
}
