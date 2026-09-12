'use client'

import Image from 'next/image'
import { useCallback, useEffect, useState } from 'react'
import { CharacterMonogram } from '@/app/components/CharacterImage'

export type Fala = { speaker: string | null; text: string }

/**
 * Cena de diálogo: as falas de um estágio, encenadas uma a uma.
 *
 * A narrativa já existia como um parágrafo estático na tela do estágio, o que
 * dava contexto mas não dava presença: era um bloco de texto que se pulava com
 * os olhos. Aqui as falas vêm uma a uma, com quem fala e o retrato, e a luta só
 * começa quando a cena termina.
 *
 * Serve aos dois momentos do estágio. Na ABERTURA o jogador clica para entrar
 * na cena, e a ação final é lutar. No DESFECHO ela abre sozinha assim que o
 * inimigo cai (autoAbrir), e a ação final é voltar à história — o desfecho é
 * o prêmio do momento, não um parágrafo para se ler depois numa tela.
 *
 * A ação final chega por `children`, seja um form com server action ou um
 * link. Ela só aparece na última fala, então quem quer ler não esbarra nela
 * antes da hora.
 *
 * Falas de narração têm speaker nulo e são apresentadas em itálico, sem
 * retrato: distinguir quem fala de quem descreve é o mínimo para a cena ser
 * legível.
 */
export function CenaDeDialogo({
  falas,
  retratos,
  children,
  rotuloAbrir,
  autoAbrir = false,
}: {
  falas: Fala[]
  retratos: Record<string, string | null>
  children: React.ReactNode
  /** Rótulo do botão que abre a cena. Ignorado quando autoAbrir. */
  rotuloAbrir?: string
  /** Abre sozinha ao montar, para o desfecho logo depois da luta. */
  autoAbrir?: boolean
}) {
  const [aberta, setAberta] = useState(autoAbrir)
  const [indice, setIndice] = useState(0)

  const ultima = indice >= falas.length - 1
  const avancar = useCallback(() => {
    setIndice((i) => Math.min(i + 1, falas.length - 1))
  }, [falas.length])

  useEffect(() => {
    if (!aberta) return
    const aoTeclar = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setAberta(false)
      // Espaço e Enter avançam, que é o gesto esperado numa cena; só que não
      // podem sequestrar a tecla quando o foco está no botão de lutar, senão
      // fica impossível iniciar a batalha pelo teclado.
      if ((e.key === ' ' || e.key === 'Enter') && !ultima) {
        const alvo = e.target as HTMLElement | null
        if (alvo?.tagName === 'BUTTON') return
        e.preventDefault()
        avancar()
      }
    }
    window.addEventListener('keydown', aoTeclar)
    return () => window.removeEventListener('keydown', aoTeclar)
  }, [aberta, ultima, avancar])

  if (falas.length === 0) return <>{children}</>

  if (!aberta) {
    // Fechada e sem trigger significa desfecho já dispensado: a ação final
    // continua acessível, senão o jogador ficaria preso na tela da batalha.
    if (autoAbrir) return <>{children}</>
    return (
      <button
        type="button"
        onClick={() => {
          setIndice(0)
          setAberta(true)
        }}
        className="rounded-md bg-accent text-background px-4 py-2 text-sm font-medium hover:opacity-90"
      >
        {rotuloAbrir}
      </button>
    )
  }

  const fala = falas[indice]
  const retrato = fala.speaker ? retratos[fala.speaker] : undefined

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Cena de abertura"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/80 p-4"
      onClick={() => (ultima ? setAberta(false) : avancar())}
    >
      <div
        className="w-full max-w-2xl rounded-lg border border-border bg-surface-raised shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-start gap-4 p-5">
          {fala.speaker && (
            <div className="h-16 w-16 shrink-0 overflow-hidden rounded-md bg-background-alt">
              {retrato ? (
                <Image
                  src={retrato}
                  alt={fala.speaker}
                  width={128}
                  height={128}
                  className="h-full w-full object-cover object-top"
                />
              ) : (
                <CharacterMonogram name={fala.speaker} />
              )}
            </div>
          )}

          <div className="min-w-0 flex-1">
            {fala.speaker && <div className="font-semibold mb-1">{fala.speaker}</div>}
            <p className={`leading-relaxed ${fala.speaker ? '' : 'italic opacity-80'}`}>{fala.text}</p>
          </div>
        </div>

        <div className="flex items-center justify-between gap-3 border-t border-border px-5 py-3">
          <div className="flex items-center gap-1.5" aria-hidden>
            {falas.map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all ${
                  i === indice ? 'w-4 bg-accent' : 'w-1.5 bg-border'
                }`}
              />
            ))}
          </div>

          <div className="flex items-center gap-3">
            {!ultima && (
              <button
                type="button"
                onClick={() => setIndice(falas.length - 1)}
                className="text-xs opacity-60 hover:opacity-100"
              >
                Pular
              </button>
            )}
            {ultima ? (
              children
            ) : (
              <button
                type="button"
                onClick={avancar}
                className="rounded-md border border-border px-3 py-1.5 text-sm hover:opacity-90"
              >
                Continuar
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
