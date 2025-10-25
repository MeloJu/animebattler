import Image from 'next/image'
import Link from 'next/link'

type FigmaHeroProps = {
  authed: boolean
}

const stats = [
  { label: 'Active Players', value: '50K+', icon: '👥' },
  { label: 'Characters', value: '500+', icon: '🏆' },
]

export default function FigmaHero({ authed }: FigmaHeroProps) {
  return (
    <section className="relative overflow-hidden bg-[#0b1640] text-white pt-20 pb-24">
      <div className="absolute inset-0 -z-20">
        <Image
          src="/landing/wallpaper/wallpaper.png"
          alt="Anime battle background"
          fill
          priority
          className="object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-[#0b1640]/45 via-[#1b2d6b]/35 to-[#321d6e]/40" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.08),_transparent_60%)]" />
      </div>

      <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
        <div className="floating-orb top-20 left-[8%] animate-float" />
        <div className="floating-orb top-36 right-[14%] animate-float-delayed bg-red-500/80" />
        <div className="floating-card bottom-24 left-[16%] animate-float" />
        <div className="floating-orb bottom-28 right-[6%] animate-float bg-orange-400/90" />
        <div className="floating-orb top-[60%] left-[6%] animate-float-delayed bg-yellow-400/90" />
        <div className="floating-ring top-[32%] right-[24%] animate-float" />
      </div>

      <div className="relative z-10 mx-auto flex max-w-6xl flex-col gap-16 px-4 sm:px-6 lg:px-8 lg:flex-row lg:items-center">
        <div className="max-w-xl space-y-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/10 px-4 py-2 shadow-lg backdrop-blur-md">
            <span className="text-lg">✨</span>
            <span className="text-sm font-medium tracking-wide">Epic Anime Battle Arena</span>
          </div>

          <div className="space-y-4">
            <h1 className="text-4xl font-semibold leading-tight sm:text-5xl lg:text-6xl">
              Battle with Your Favourite Anime Legends
            </h1>
            <p className="max-w-xl text-base text-blue-100 sm:text-lg">
              Enter the crossover arena, assemble iconic heroes, and unleash signature abilities. Build your team, climb the ranks, and rule every universe.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            {authed ? (
              <>
                <Link href="/dashboard" className="btn-primary inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium shadow-xl shadow-blue-900/40">
                  Continue Adventure
                </Link>
                <Link href="/battle" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15">
                  Enter Battle Hub
                </Link>
              </>
            ) : (
              <>
                <Link href="/register" className="btn-primary inline-flex items-center justify-center rounded-lg px-6 py-3 text-sm font-medium shadow-xl shadow-blue-900/40">
                  Start Playing Free
                </Link>
                <Link href="/login" className="inline-flex items-center justify-center rounded-lg border border-white/40 px-6 py-3 text-sm font-medium text-white transition hover:bg-white/15">
                  Login to Account
                </Link>
              </>
            )}
          </div>

          <div className="flex gap-8 pt-6">
            {stats.map((stat) => (
              <div key={stat.label} className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/90 text-2xl shadow-lg shadow-blue-900/30">
                  {stat.icon}
                </div>
                <div>
                  <div className="text-lg font-semibold text-white">{stat.value}</div>
                  <div className="text-sm text-blue-100">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="relative hidden w-full max-w-md rounded-2xl border border-white/20 bg-white/10 p-6 text-blue-100 shadow-2xl shadow-blue-900/40 backdrop-blur-md lg:block">
          <div className="space-y-6">
            {['Dragon Ball', 'Pokémon', 'Bleach', 'Naruto'].map((franchise, idx) => (
              <div
                key={franchise}
                className={`transform rounded-xl border border-white/15 bg-white/80 p-4 text-blue-900 shadow-lg transition will-change-transform hover:scale-[1.02] ${idx % 2 === 1 ? 'ml-8' : ''}`}
              >
                <div className="flex items-center gap-4">
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-orange-400 to-orange-500 text-2xl text-white shadow-inner">
                    {franchise === 'Pokémon' ? '⚡' : franchise === 'Bleach' ? '🗡️' : franchise === 'Naruto' ? '🍃' : '⭐'}
                  </div>
                  <div>
                    <div className="text-base font-semibold">{franchise}</div>
                    <div className="text-sm text-blue-600/80">{idx === 1 ? '100+ Characters' : idx === 0 ? '50+ Characters' : idx === 2 ? '40+ Characters' : '80+ Characters'}</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
          <div className="absolute -top-5 -right-5 h-20 w-20 rounded-full bg-gradient-to-br from-white/40 to-transparent" />
        </div>
      </div>
    </section>
  )
}
