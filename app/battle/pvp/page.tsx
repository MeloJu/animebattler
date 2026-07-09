import Link from "next/link";

export default function BattlePvpPage() {
  return (
    <main className="mx-auto max-w-3xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Battle VS Player</h1>
      <div className="card p-6 space-y-3">
        <p className="opacity-70">Em construção: PvP ainda não foi implementado.</p>
        <Link href="/battle" className="btn-primary inline-block rounded-md px-4 py-2 text-sm">Voltar</Link>
      </div>
    </main>
  );
}
