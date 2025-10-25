import Link from "next/link";

export default function BattlePage() {
  return (
    <main className="mx-auto max-w-7xl p-6">
      <h1 className="text-2xl font-semibold mb-4">Battle</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Link href="/battle/ai" className="card p-6 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold">Battle VS AI</h3>
          <p className="text-sm mt-1 opacity-70">Quick battle against a computer-controlled opponent.</p>
        </Link>
        <Link href="/battle/pvp" className="card p-6 hover:shadow-lg transition-shadow">
          <h3 className="font-semibold">Battle VS Player</h3>
          <p className="text-sm mt-1 opacity-70">Challenge other players (coming soon).</p>
        </Link>
      </div>
    </main>
  );
}
