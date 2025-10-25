import { Button } from "./ui/button";
import { Swords } from "lucide-react";

export function Hero() {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-white via-blue-50 to-white">
      {/* Decorative elements */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(59,130,246,0.1),transparent_50%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_80%,rgba(147,197,253,0.1),transparent_50%)]" />
      
      <div className="container relative mx-auto px-4 py-24 lg:py-32">
        <div className="mx-auto max-w-4xl text-center">
          {/* Badge */}
          <div className="mb-8 inline-flex items-center gap-2 rounded-full border border-blue-200 bg-white/80 px-4 py-2 backdrop-blur-sm">
            <Swords className="h-4 w-4 text-blue-600" />
            <span className="text-blue-900">Multi-Universe Battle Arena</span>
          </div>

          {/* Main heading */}
          <h1 className="mb-6 bg-gradient-to-br from-blue-900 via-blue-700 to-blue-600 bg-clip-text text-transparent">
            Unleash Epic Battles Across Dimensions
          </h1>

          {/* Description */}
          <p className="mb-10 text-gray-600 max-w-2xl mx-auto">
            Command legendary warriors from countless universes in strategic turn-based combat. 
            Master unique abilities, climb the rankings, and prove your dominance in the ultimate crossover arena.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Start Playing
            </Button>
            <Button size="lg" variant="outline" className="border-blue-200 hover:bg-blue-50">
              View Characters
            </Button>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-8 max-w-2xl mx-auto">
            <div className="space-y-1">
              <div className="text-blue-900">500+</div>
              <div className="text-gray-600">Characters</div>
            </div>
            <div className="space-y-1">
              <div className="text-blue-900">1M+</div>
              <div className="text-gray-600">Battles</div>
            </div>
            <div className="space-y-1">
              <div className="text-blue-900">50K+</div>
              <div className="text-gray-600">Players</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
