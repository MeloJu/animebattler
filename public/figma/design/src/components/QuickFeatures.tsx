import { Card } from "./ui/card";
import { Gamepad2, Users, BarChart3, Sparkles } from "lucide-react";

export function QuickFeatures() {
  const features = [
    {
      icon: Gamepad2,
      title: "Strategic Battles",
      description: "Turn-based combat with unique character abilities",
      gradient: "from-blue-600 to-blue-700"
    },
    {
      icon: Users,
      title: "Diverse Roster",
      description: "500+ characters from your favorite anime series",
      gradient: "from-purple-600 to-pink-600"
    },
    {
      icon: BarChart3,
      title: "Global Rankings",
      description: "Compete and climb the competitive leaderboards",
      gradient: "from-blue-600 to-cyan-600"
    },
    {
      icon: Sparkles,
      title: "Level Up",
      description: "Unlock new abilities and power up your warriors",
      gradient: "from-indigo-600 to-purple-600"
    }
  ];

  return (
    <section className="py-20 bg-white relative">
      <div className="container mx-auto px-4">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="mb-4 text-blue-900">
            Why Choose Anime Battler?
          </h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Experience the ultimate crossover battle arena with features designed for both casual and competitive players
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <Card 
                key={index} 
                className="p-6 border-blue-100 hover:border-blue-300 hover:shadow-lg transition-all duration-300 bg-gradient-to-br from-white to-blue-50/50"
              >
                <div className="space-y-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center shadow-lg`}>
                    <Icon className="h-6 w-6 text-white" />
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

        {/* CTA Section */}
        <div className="mt-16 text-center">
          <div className="inline-flex flex-col items-center gap-4 p-8 rounded-2xl bg-gradient-to-br from-blue-600 to-blue-700 shadow-2xl shadow-blue-600/30">
            <h3 className="text-white max-w-md">
              Ready to Enter the Arena?
            </h3>
            <p className="text-blue-100 max-w-md">
              Join thousands of players battling it out right now. Create your free account and start your journey.
            </p>
            <button className="px-8 py-3 bg-white text-blue-600 rounded-lg hover:bg-blue-50 transition-colors shadow-lg">
              Get Started - It's Free
            </button>
          </div>
        </div>
      </div>
    </section>
  );
}
