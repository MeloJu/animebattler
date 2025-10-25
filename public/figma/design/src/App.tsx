import { Navigation } from "./components/Navigation";
import { LandingHero } from "./components/LandingHero";
import { QuickFeatures } from "./components/QuickFeatures";
import { LandingFooter } from "./components/LandingFooter";

export default function App() {
  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <LandingHero />
      <QuickFeatures />
      <LandingFooter />
    </div>
  );
}
