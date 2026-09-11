'use client'

import { useEffect, useState } from 'react'
import { AnimatePresence, motion, useReducedMotion } from 'motion/react'
import type { ImpactoNoLutador } from '@/app/lib/battle/rodada'

/**
 * Encena o golpe que o lutador acabou de levar.
 *
 * POR QUE ENVOLVE a carta em vez de animar dentro dela: FighterCard é
 * componente de servidor e lê o estado do banco. Ele continua sendo a fonte
 * do "depois"; o que falta é o MOMENTO entre um estado e outro, e isso é
 * necessariamente cliente. Envolver mantém a divisão onde ela já estava.
 *
 * A INTENSIDADE VEM DO MOTOR, não de gosto: `severidade` já é calculada em
 * cima da vida máxima do alvo (ver TurnResult), então o mesmo 30 de dano
 * treme pouco num tanque e muito num conjurador — exatamente como o texto do
 * log já narra. Duas telas contando a mesma história.
 *
 * TOCA NA CHEGADA DA PÁGINA, e isso é deliberado: a rodada é resolvida no
 * servidor e a página re-renderiza logo depois do clique, então chegar na
 * tela É o instante em que o golpe aconteceu. Mesma decisão já tomada pela
 * animação de forma liberada em globals.css.
 *
 * SOB prefers-reduced-motion nada se move — o número do dano ainda aparece,
 * porque ele é informação, não enfeite. O que se perde é só o movimento.
 */

/** Quanto a carta se desloca, em pixels, por severidade do pior golpe. */
const DESLOCAMENTO: Record<NonNullable<ImpactoNoLutador['severidade']>, number> = {
  raspao: 3,
  solido: 7,
  pesado: 12,
  devastador: 18,
}

type Golpe = { chave: number; dano: number; deslocamento: number; critico: boolean; guardaQuebrada: boolean }

export function CartaAnimada({
  impacto,
  rodada,
  children,
}: {
  impacto: ImpactoNoLutador
  /** Muda a cada rodada resolvida — é o gatilho da encenação. */
  rodada: number
  children: React.ReactNode
}) {
  const semMovimento = useReducedMotion()
  const [golpe, setGolpe] = useState<Golpe | null>(null)

  useEffect(() => {
    if (impacto.dano <= 0 && !impacto.guardaQuebrada) return
    setGolpe({
      chave: rodada,
      dano: impacto.dano,
      // Dano contínuo chega sem severidade: é a mesma mordida toda rodada, e
      // sacudir a carta por ela diria "você levou um golpe agora" quando não
      // levou. Fica com o mínimo, só para o número subir.
      deslocamento: impacto.severidade ? DESLOCAMENTO[impacto.severidade] : 0,
      critico: impacto.critico,
      guardaQuebrada: impacto.guardaQuebrada,
    })
    // Depende SÓ da rodada: qualquer re-render sem rodada nova (navegação,
    // revalidação) não pode re-encenar um golpe que já passou.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rodada])

  const tremor = golpe && !semMovimento && golpe.deslocamento > 0
  const d = golpe?.deslocamento ?? 0

  return (
    <div className="relative">
      <motion.div
        animate={
          tremor
            ? { x: [0, -d, d, -d * 0.6, d * 0.4, 0] }
            : { x: 0 }
        }
        transition={{ duration: 0.4, ease: 'easeOut' }}
      >
        {children}
      </motion.div>

      {/* Clarão vermelho por cima da carta inteira: diz "foi AQUI" antes de
          qualquer número ser lido. pointer-events-none para não roubar o
          clique dos botões que ficam por baixo em telas estreitas. */}
      <AnimatePresence>
        {golpe && !semMovimento && golpe.dano > 0 && (
          <motion.div
            key={`clarao-${golpe.chave}`}
            className="absolute inset-0 rounded-lg pointer-events-none bg-red-500"
            initial={{ opacity: golpe.critico ? 0.28 : 0.18 }}
            animate={{ opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          />
        )}
      </AnimatePresence>

      {/* O número sobe e some. Aparece mesmo sem movimento: é informação. */}
      <AnimatePresence>
        {golpe && golpe.dano > 0 && (
          <motion.div
            key={`dano-${golpe.chave}`}
            className="absolute inset-x-0 top-12 flex justify-center pointer-events-none"
            initial={semMovimento ? { opacity: 1 } : { opacity: 0, y: 10, scale: 0.8 }}
            animate={semMovimento ? { opacity: 1 } : { opacity: 1, y: -22, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: semMovimento ? 0 : 0.9, ease: 'easeOut' }}
          >
            <span
              className={`font-bold tabular-nums drop-shadow-lg ${
                golpe.critico ? 'text-3xl text-amber-400' : 'text-2xl text-red-400'
              }`}
            >
              −{golpe.dano}
              {golpe.critico && <span className="text-sm ml-1">CRÍTICO</span>}
            </span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Guarda partida é consequência, não dano: quem apanhou perde a rodada
          seguinte. Merece aviso próprio, separado do número. */}
      <AnimatePresence>
        {golpe?.guardaQuebrada && (
          <motion.div
            key={`guarda-${golpe.chave}`}
            className="absolute inset-x-0 top-2 flex justify-center pointer-events-none"
            initial={semMovimento ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: semMovimento ? 0 : 0.3 }}
          >
            <span className="rounded-full bg-amber-500 text-background text-xs font-semibold px-2 py-1 shadow-lg">
              Guarda partida
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
