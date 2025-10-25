import { Button } from "./ui/button";
import { Swords } from "lucide-react";

export function Navigation() {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-blue-100">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 flex items-center justify-center">
              <Swords className="h-5 w-5 text-white" />
            </div>
            <span className="text-blue-900">Anime Battler</span>
          </div>

          {/* Navigation Links */}
          <div className="hidden md:flex items-center gap-8">
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Home
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Characters
            </a>
            <a href="#" className="text-gray-600 hover:text-blue-600 transition-colors">
              Battle
            </a>
          </div>

          {/* Auth Buttons */}
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="text-gray-600 hover:text-blue-600">
              Login
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              Register
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
