import { Card } from "./ui/card";
import { Users, Trophy, Sparkles, BarChart3, Gamepad2, Shield } from "lucide-react";

export function Features() {
  const features = [
    {
      icon: Users,
      title: "Diverse Roster",
      description: "Choose from 500+ characters across countless universes, each with unique abilities and playstyles.",
      color: "bg-blue-100 text-blue-600"
    },
    {
      icon: Gamepad2,
      title: "Strategic Combat",
      description: "Master turn-based tactical battles where every decision matters and skill determines victory.",
      color: "bg-purple-100 text-purple-600"
    },
    {
      icon: Trophy,
      title: "Competitive Rankings",
      description: "Climb the global leaderboards and prove your worth against players from around the world.",
      color: "bg-yellow-100 text-yellow-600"
    },
    {
      icon: Sparkles,
      title: "Character Progression",
      description: "Level up your warriors, unlock new abilities, and customize your ultimate fighting team.",
      color: "bg-pink-100 text-pink-600"
    },
    {
      icon: BarChart3,
      title: "Detailed Statistics",
      description: "Track your wins, losses, and battle performance with comprehensive analytics dashboard.",
      color: "bg-green-100 text-green-600"
    },
    {
      icon: Shield,
      title: "Fair Matchmaking",
      description: "Balanced matchmaking system ensures competitive and enjoyable battles for all skill levels.",
      color: "bg-indigo-100 text-indigo-600"
    }
  ];

  return (
    <section className="py-20 bg-gradient-to-br from-blue-50 via-white to-blue-50">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-blue-900">Why Players Choose Us</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience a battle system designed for both casual players and competitive warriors
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card key={index} className="p-6 border-blue-200 hover:shadow-lg transition-shadow bg-white">
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-lg ${feature.color} flex items-center justify-center`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <div>
                    <h3 className="mb-2 text-blue-900">{feature.title}</h3>
                    <p className="text-gray-600">{feature.description}</p>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </section>
  );
}
