import Hero from "./components/landing/Hero";
import QuickFeatures from "./components/landing/QuickFeatures";
import LandingFooter from "./components/landing/LandingFooter";
import { getCurrentUser } from "@/app/lib/session";
import { getLandingStats } from "@/app/lib/landing/queries";

export default async function Home() {
  const [user, stats] = await Promise.all([getCurrentUser(), getLandingStats()]);
  const authed = !!user;

  return (
    <main>
      <Hero authed={authed} stats={stats} />
      <QuickFeatures authed={authed} />
      <LandingFooter />
    </main>
  );
}
