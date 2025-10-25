import { Button } from "./ui/button";
import { Swords } from "lucide-react";

export function Footer() {
  return (
    <footer className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-900 text-white py-16">
      <div className="container mx-auto px-4">
        <div className="max-w-6xl mx-auto">
          {/* Main Footer Content */}
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
            {/* Brand */}
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
                  <Swords className="h-5 w-5" />
                </div>
                <span className="text-white">Battle Arena</span>
              </div>
              <p className="text-blue-200">
                Command legendary warriors in strategic turn-based combat across multiple dimensions.
              </p>
            </div>

            {/* Game */}
            <div className="space-y-4">
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
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Updates
                </a>
              </div>
            </div>

            {/* Community */}
            <div className="space-y-4">
              <div className="text-white">Community</div>
              <div className="space-y-2">
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Discord
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Forums
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Tournaments
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Guides
                </a>
              </div>
            </div>

            {/* Support */}
            <div className="space-y-4">
              <div className="text-white">Support</div>
              <div className="space-y-2">
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Help Center
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Contact Us
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Terms of Service
                </a>
                <a href="#" className="block text-blue-200 hover:text-white transition-colors">
                  Privacy Policy
                </a>
              </div>
            </div>
          </div>

          {/* CTA Section */}
          <div className="py-8 px-6 bg-white/10 rounded-lg backdrop-blur-sm mb-8 text-center">
            <h3 className="mb-2 text-white">Ready to Begin Your Journey?</h3>
            <p className="text-blue-200 mb-4">Join thousands of players in the ultimate battle arena</p>
            <Button size="lg" className="bg-white text-blue-900 hover:bg-blue-50">
              Start Playing Now
            </Button>
          </div>

          {/* Bottom Bar */}
          <div className="pt-8 border-t border-white/10 text-center text-blue-200">
            <p>© 2025 Battle Arena. All rights reserved.</p>
          </div>
        </div>
      </div>
    </footer>
  );
}
