import FigmaHero from './FigmaHero'

export default function Hero({ authed }: { authed: boolean }) {
  return <FigmaHero authed={authed} />
}
