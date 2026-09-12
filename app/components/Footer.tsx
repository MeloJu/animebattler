import Link from 'next/link'
import { AVISO_CURTO } from '@/app/lib/creditos'

/**
 * Rodapé com o aviso de direitos, em TODAS as páginas.
 *
 * Existe porque o jogo passou a usar arte e personagens de obras com dono. A
 * decisão de usar foi tomada com o risco explicitado; o crédito visível é a
 * contrapartida, e contrapartida que só aparece numa página escondida não é
 * visível. Por isso o aviso curto fica no rodapé de tudo, com link para a
 * lista completa em /creditos.
 */
export function Footer() {
  return (
    <footer className="border-t border-border mt-12">
      <div className="mx-auto max-w-6xl px-6 py-6 text-xs text-muted flex flex-wrap items-center justify-between gap-3">
        <p className="max-w-2xl leading-relaxed">{AVISO_CURTO}</p>
        <Link href="/creditos" className="underline shrink-0 hover:text-foreground">
          Créditos e direitos
        </Link>
      </div>
    </footer>
  )
}
