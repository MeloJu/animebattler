import { Button } from "./ui/button";
import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Sparkles, Users, Trophy } from "lucide-react";
import wallpaper from "figma:asset/7921dca86b860d19974a23b63d7ed8d8751bf79a.png";

export function LandingHero() {
  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden pt-16">
      {/* Anime Wallpaper Background */}
      <div className="absolute inset-0 z-0">
        <img 
          src={wallpaper} 
          alt="Anime Background" 
          className="w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/70 via-blue-800/60 to-purple-900/70" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
      </div>

      {/* Floating Anime Icons */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {/* Dragon Ball - 7 star ball */}
        <div className="absolute top-20 left-[10%] w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center animate-float">
          <div className="flex gap-0.5">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
          </div>
        </div>

        {/* Pokemon - Pokeball */}
        <div className="absolute top-40 right-[15%] w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 shadow-lg animate-float-delayed">
          <div className="absolute inset-0 flex flex-col">
            <div className="flex-1 bg-gradient-to-b from-red-500 to-red-600 rounded-t-full" />
            <div className="h-3 bg-white flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-gray-800 border-2 border-white" />
            </div>
            <div className="flex-1 bg-gradient-to-t from-white to-gray-100 rounded-b-full" />
          </div>
        </div>

        {/* Bleach - Symbol inspired */}
        <div className="absolute bottom-32 left-[20%] w-12 h-12 animate-float">
          <div className="w-full h-full bg-white/20 backdrop-blur-sm rounded-lg border-2 border-blue-300 flex items-center justify-center shadow-lg">
            <svg viewBox="0 0 24 24" className="w-8 h-8 text-blue-200" fill="currentColor">
              <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.72l7 3.5v7.6l-7-3.5v-7.6zm16 0v7.6l-7 3.5v-7.6l7-3.5z"/>
            </svg>
          </div>
        </div>

        {/* Dragon Ball - 4 star ball */}
        <div className="absolute bottom-40 right-[8%] w-14 h-14 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center animate-float">
          <div className="grid grid-cols-2 gap-0.5">
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
            <div className="w-1.5 h-1.5 bg-red-600 rounded-full" />
          </div>
        </div>

        {/* Pokemon - Pikachu inspired */}
        <div className="absolute top-[60%] left-[8%] w-12 h-12 bg-yellow-400 rounded-full shadow-lg animate-float-delayed flex items-center justify-center">
          <div className="text-xl">⚡</div>
        </div>

        {/* Naruto - Leaf village symbol inspired */}
        <div className="absolute top-[30%] right-[25%] w-14 h-14 animate-float">
          <div className="w-full h-full bg-white/20 backdrop-blur-sm rounded-full border-2 border-orange-300 flex items-center justify-center shadow-lg">
            <div className="text-2xl text-orange-200">🍃</div>
          </div>
        </div>
      </div>

      <div className="container relative mx-auto px-4 py-20 z-10">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left Content */}
          <div className="space-y-8">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-blue-300/50 bg-white/90 backdrop-blur-md shadow-lg">
              <Sparkles className="h-4 w-4 text-blue-600" />
              <span className="text-blue-900">Epic Anime Battle Arena</span>
            </div>

            {/* Main Heading */}
            <div className="space-y-4">
              <h1 className="text-white drop-shadow-lg leading-tight">
                Battle with Your Favorite Anime Characters
              </h1>
              <p className="text-blue-100 max-w-xl drop-shadow-md">
                Enter the ultimate crossover arena where legendary warriors from different universes clash. 
                Build your dream team, master unique abilities, and dominate the leaderboards.
              </p>
            </div>

            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50 shadow-xl">
                Start Playing Free
              </Button>
              <Button size="lg" variant="outline" className="border-white/50 text-white hover:bg-white/20 backdrop-blur-sm">
                Watch Trailer
              </Button>
            </div>

            {/* Quick Stats */}
            <div className="flex items-center gap-8 pt-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Users className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-white drop-shadow-md">50K+</div>
                  <div className="text-blue-200">Active Players</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-lg bg-white/90 backdrop-blur-sm flex items-center justify-center shadow-lg">
                  <Trophy className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <div className="text-white drop-shadow-md">500+</div>
                  <div className="text-blue-200">Characters</div>
                </div>
              </div>
            </div>
          </div>

          {/* Right Content - Feature Cards */}
          <div className="relative hidden lg:block">
            {/* Anime Franchise Icons */}
            <div className="space-y-4">
              {/* Dragon Ball Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-blue-200/50 p-6 hover:scale-105 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center">
                    <div className="grid grid-cols-2 gap-0.5">
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                      <div className="w-2 h-2 bg-red-600 rounded-full" />
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-900">Dragon Ball</div>
                    <div className="text-gray-600">50+ Characters</div>
                  </div>
                </div>
              </div>

              {/* Pokemon Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-blue-200/50 p-6 hover:scale-105 transition-transform ml-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full shadow-lg relative overflow-hidden">
                    <div className="absolute inset-0 flex flex-col">
                      <div className="flex-1 bg-gradient-to-b from-red-500 to-red-600" />
                      <div className="h-4 bg-white flex items-center justify-center">
                        <div className="w-4 h-4 rounded-full bg-gray-800 border-2 border-white" />
                      </div>
                      <div className="flex-1 bg-gradient-to-t from-white to-gray-100" />
                    </div>
                  </div>
                  <div>
                    <div className="text-blue-900">Pokemon</div>
                    <div className="text-gray-600">100+ Characters</div>
                  </div>
                </div>
              </div>

              {/* Bleach Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-blue-200/50 p-6 hover:scale-105 transition-transform">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-lg bg-gradient-to-br from-blue-400 to-blue-600 shadow-lg flex items-center justify-center">
                    <svg viewBox="0 0 24 24" className="w-10 h-10 text-white" fill="currentColor">
                      <path d="M12 2L2 7v10l10 5 10-5V7L12 2zm0 2.18L19.82 8 12 11.82 4.18 8 12 4.18zM4 9.72l7 3.5v7.6l-7-3.5v-7.6zm16 0v7.6l-7 3.5v-7.6l7-3.5z"/>
                    </svg>
                  </div>
                  <div>
                    <div className="text-blue-900">Bleach</div>
                    <div className="text-gray-600">40+ Characters</div>
                  </div>
                </div>
              </div>

              {/* Naruto Card */}
              <div className="bg-white/90 backdrop-blur-md rounded-xl shadow-xl border border-blue-200/50 p-6 hover:scale-105 transition-transform ml-8">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-br from-orange-400 to-orange-600 shadow-lg flex items-center justify-center text-3xl">
                    🍃
                  </div>
                  <div>
                    <div className="text-blue-900">Naruto</div>
                    <div className="text-gray-600">80+ Characters</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
