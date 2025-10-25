import { Swords } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-12">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Swords className="h-5 w-5" />
                </div>
                <span className="text-white">Anime Battler</span>
              </div>
              <p className="text-blue-200">
                The ultimate anime crossover battle arena.
              </p>
            </div>

            {/* Quick Links */}
            <div className="space-y-3">
              <div className="text-white">Game</div>
              <div className="space-y-2">
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Characters
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Battle System
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Rankings
                </a>
              </div>
            </div>

            {/* Community */}
            <div className="space-y-3">
              <div className="text-white">Community</div>
              <div className="space-y-2">
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Discord
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Forums
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Guides
                </a>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-3">
              <div className="text-white">Support</div>
              <div className="space-y-2">
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Help Center
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Contact
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Terms
                </a>
              </div>
            </div>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 text-center text-blue-200">
            <p>© 2025 Anime Battler. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
