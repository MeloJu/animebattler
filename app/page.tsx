import Hero from "./components/landing/Hero";
import QuickFeatures from "./components/landing/QuickFeatures";
import LandingFooter from "./components/landing/LandingFooter";
import { getCurrentUser } from "@/app/lib/session";

export default async function Home() {
  const user = await getCurrentUser()
  const authed = !!user
  return (
    <main className="bg-white text-blue-900">
      <Hero authed={authed} />
      <QuickFeatures />
      <LandingFooter />
    </main>
  );
}
