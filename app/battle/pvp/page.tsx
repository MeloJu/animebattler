import Link from 'next/link'
import { redirect } from 'next/navigation'
import { requireUser } from '@/app/lib/session'
import { getSelectedCharacter } from '@/app/lib/progression/queries'
import { getQueueStatus, getActivePvpBattle } from '@/app/lib/pvp/queries'
import { joinPvpQueue, leavePvpQueue } from '@/app/lib/pvp/actions'
import { resolveErrorMessage } from '@/app/lib/error-messages'
import { QueuePoller } from '@/app/components/pvp/QueuePoller'

const PVP_ERRORS: Record<string, string> = {
  no_character: 'Selecione um personagem antes de entrar na fila.',
  not_found: 'Batalha não encontrada.',
}

export default async function PvpLobbyPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; waiting?: string }>
}) {
  const { error, waiting } = await searchParams
  const errorMessage = resolveErrorMessage(PVP_ERRORS, error, 'Algo deu errado.')

  const user = await requireUser()

  // Se o adversário pareou enquanto esta página estava aberta, a batalha já
  // existe — vai direto pra ela em vez de deixar o jogador na fila fantasma.
  const active = await getActivePvpBattle(user.id)
  if (active) redirect(`/battle/pvp/${active.id}`)

  const [selected, queue] = await Promise.all([getSelectedCharacter(user.id), getQueueStatus(user.id)])

  return (
    <main className="mx-auto max-w-3xl p-6 space-y-6">
      <div>
        <div className="kicker">Batalha contra jogador</div>
        <h1 className="heading text-3xl mt-1">PvP em tempo real</h1>
      </div>

      {errorMessage && <div className="card p-3 text-sm border-danger/40 text-danger">{errorMessage}</div>}

      {!selected ? (
        <div className="card p-6 space-y-3">
          <p className="text-muted">Você precisa de um personagem selecionado para lutar.</p>
          <Link href="/select" className="btn-primary inline-block px-4 py-2 text-sm">Selecionar personagem</Link>
        </div>
      ) : queue.mine ? (
        <div className="card card-accent p-6 pl-7 space-y-4">
          {/* Quem espera não tem batalha ainda, então não há canal SSE pra
              escutar — a espera na fila é o único ponto que sonda. */}
          <QueuePoller />
          <div>
            <div className="heading text-lg">Procurando adversário…</div>
            <p className="text-sm text-muted mt-1">
              Lutando com <span className="text-foreground font-bold">{queue.mine.userCharacter.nickname}</span>
              {' '}({queue.mine.userCharacter.character.name}). Assim que alguém entrar, a batalha começa sozinha.
            </p>
          </div>
          <div className="text-sm text-muted">
            {queue.total > 1 ? `${queue.total} jogadores na fila` : 'Você é o único na fila'}
          </div>
          <form action={leavePvpQueue}>
            <button type="submit" className="btn-ghost px-4 py-2 text-sm">Sair da fila</button>
          </form>
        </div>
      ) : (
        <div className="card p-6 space-y-4">
          <div>
            <div className="heading text-lg">Pronto para lutar</div>
            <p className="text-sm text-muted mt-1">
              Você vai lutar com <span className="text-foreground font-bold">{selected.nickname}</span>
              {' '}({selected.character.name}, nível {selected.level}), usando o loadout e o equipamento atuais.
            </p>
          </div>
          {waiting && !errorMessage && (
            <p className="text-sm text-muted">A fila mudou enquanto você entrava — tente de novo.</p>
          )}
          <form action={joinPvpQueue}>
            <button type="submit" className="btn-primary px-5 py-2.5 text-sm">Entrar na fila</button>
          </form>
          <p className="text-xs text-muted border-t border-border pt-3">
            Turno simultâneo: os dois escolhem a ação ao mesmo tempo e a rodada resolve quando as duas
            chegam — ninguém joga vendo a escolha do outro.
          </p>
        </div>
      )}
    </main>
  )
}
