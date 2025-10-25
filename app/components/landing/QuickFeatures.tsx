import Link from 'next/link'
import { Gamepad2, Users, BarChart3, Sparkles } from 'lucide-react'

const features = [
  {
    icon: Gamepad2,
    title: 'Strategic Battles',
    description: 'Turn-based combat with unique character abilities',
    gradient: 'from-blue-600 to-blue-700',
  },
  {
    icon: Users,
    title: 'Diverse Roster',
    description: '500+ characters from your favorite anime series',
    gradient: 'from-purple-600 to-pink-500',
  },
  {
    icon: BarChart3,
    title: 'Global Rankings',
    description: 'Compete and climb the competitive leaderboards',
    gradient: 'from-blue-600 to-cyan-500',
  },
  {
    icon: Sparkles,
    title: 'Level Up',
    description: 'Unlock new abilities and power up your warriors',
    gradient: 'from-indigo-600 to-purple-600',
  },
]

export default function QuickFeatures() {
  return (
    <section className="relative bg-white py-20 text-blue-900">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(59,130,246,0.1),_transparent_65%)]" />
      <div className="relative mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-blue-200 bg-blue-50/70 px-4 py-2 text-xs font-semibold uppercase tracking-widest text-blue-700">
            Why Choose Anime Battler?
          </div>
          <h2 className="mt-6 text-3xl font-semibold sm:text-4xl">Build your dream team and conquer every universe</h2>
          <p className="mt-4 text-base text-blue-600 sm:text-lg">
            Experience the ultimate crossover arena with features designed for both casual fighters and competitive champions.
          </p>
        </div>

        <div className="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          {features.map(({ icon: Icon, title, description, gradient }) => (
            <div
              key={title}
              className="rounded-2xl border border-blue-100 bg-gradient-to-br from-white to-blue-50/40 p-6 shadow-lg shadow-blue-500/10 transition duration-300 hover:-translate-y-1 hover:shadow-xl"
            >
              <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${gradient} text-white shadow-lg`}>
                <Icon className="h-6 w-6" />
              </div>
              <h3 className="mt-6 text-xl font-semibold">{title}</h3>
              <p className="mt-2 text-sm text-blue-700/80">{description}</p>
            </div>
          ))}
        </div>

        <div className="mt-16 flex flex-col items-center gap-6">
          <div className="text-center text-blue-700">
            <h3 className="text-2xl font-semibold">Ready to enter the arena?</h3>
            <p className="mt-2 max-w-2xl text-sm text-blue-600 sm:text-base">
              Join thousands of players battling right now. Create your free account, unlock iconic skills, and start climbing the leaderboards today.
            </p>
          </div>
          <Link
            href="/register"
            className="inline-flex items-center justify-center rounded-xl bg-blue-600 px-7 py-3 text-sm font-semibold text-white shadow-xl shadow-blue-500/30 transition hover:bg-blue-700"
          >
            Get Started — It’s Free
          </Link>
        </div>
      </div>
    </section>
  )
}
