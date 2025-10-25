import Link from 'next/link'
import { Swords } from 'lucide-react'

export default function LandingFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="bg-gradient-to-br from-[#0b1640] via-[#142867] to-[#1f2d74] py-12 text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="grid gap-10 lg:grid-cols-4">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-white/10">
                <Swords className="h-5 w-5" />
              </div>
              <span className="text-lg font-semibold">Anime Battler</span>
            </div>
            <p className="text-sm text-blue-200/80">
              The ultimate anime crossover battle arena. Assemble legendary heroes and rule the leaderboards.
            </p>
          </div>

          <FooterColumn
            title="Game"
            links={[
              { href: '/characters', label: 'Characters' },
              { href: '/battle', label: 'Battle System' },
              { href: '/leaderboards', label: 'Rankings', disabled: true },
            ]}
          />

          <FooterColumn
            title="Community"
            links={[
              { href: '/community/discord', label: 'Discord', disabled: true },
              { href: '/community/forums', label: 'Forums', disabled: true },
              { href: '/guides', label: 'Guides', disabled: true },
            ]}
          />

          <FooterColumn
            title="Support"
            links={[
              { href: '/support', label: 'Help Center', disabled: true },
              { href: '/contact', label: 'Contact', disabled: true },
              { href: '/terms', label: 'Terms', disabled: true },
            ]}
          />
        </div>

        <div className="mt-12 border-t border-white/10 pt-6 text-center text-sm text-blue-200/80">
          © {year} Anime Battler. All rights reserved.
        </div>
      </div>
    </footer>
  )
}

type FooterColumnProps = {
  title: string
  links: { href: string; label: string; disabled?: boolean }[]
}

function FooterColumn({ title, links }: FooterColumnProps) {
  return (
    <div className="space-y-3 text-sm">
      <div className="text-white/90 font-semibold uppercase tracking-wide text-xs">{title}</div>
      <ul className="space-y-2">
        {links.map(({ href, label, disabled }) => (
          <li key={label}>
            {disabled ? (
              <span className="text-blue-200/60">{label} (soon)</span>
            ) : (
              <Link href={href} className="text-blue-200 transition hover:text-white">
                {label}
              </Link>
            )}
          </li>
        ))}
      </ul>
    </div>
  )
}
