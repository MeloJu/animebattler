import { Card } from "./ui/card";
import { Badge } from "./ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { Progress } from "./ui/progress";
import { Trophy, TrendingUp, Target, Award } from "lucide-react";

export function StatsSection() {
  const topPlayers = [
    { rank: 1, name: "DragonMaster", wins: 1247, winRate: 87, avatar: "DM" },
    { rank: 2, name: "ShadowNinja", wins: 1189, winRate: 85, avatar: "SN" },
    { rank: 3, name: "ThunderFist", wins: 1156, winRate: 83, avatar: "TF" },
    { rank: 4, name: "PhoenixRising", wins: 1098, winRate: 81, avatar: "PR" },
    { rank: 5, name: "StormBreaker", wins: 1045, winRate: 79, avatar: "SB" },
  ];

  const stats = [
    { label: "Total Wins", value: "2,847", change: "+12.5%", icon: Trophy },
    { label: "Win Rate", value: "68%", change: "+5.2%", icon: Target },
    { label: "Current Rank", value: "#142", change: "+23", icon: Award },
    { label: "Season Points", value: "8,942", change: "+156", icon: TrendingUp },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-blue-900">Track Your Progress</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Monitor your performance with detailed statistics and climb the competitive ladder
          </p>
        </div>

        <div className="max-w-6xl mx-auto space-y-8">
          {/* Stats Grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {stats.map((stat, index) => {
              const Icon = stat.icon;
              return (
                <Card key={index} className="p-6 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
                  <div className="flex items-start justify-between mb-4">
                    <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                      <Icon className="h-5 w-5 text-blue-600" />
                    </div>
                    <Badge variant="secondary" className="bg-green-100 text-green-700 border-green-200">
                      {stat.change}
                    </Badge>
                  </div>
                  <div className="text-blue-900">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </Card>
              );
            })}
          </div>

          {/* Leaderboard and Progress */}
          <div className="grid lg:grid-cols-[1fr,400px] gap-6">
            {/* Leaderboard */}
            <Card className="p-6 border-blue-200">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-blue-900 mb-1">Global Leaderboard</h3>
                  <p className="text-gray-600">Top ranked players this season</p>
                </div>
                <Trophy className="h-6 w-6 text-yellow-500" />
              </div>

              <div className="space-y-3">
                {topPlayers.map((player) => (
                  <div 
                    key={player.rank}
                    className="flex items-center gap-4 p-4 rounded-lg border border-blue-100 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex items-center justify-center w-8 h-8 rounded-full bg-blue-600 text-white">
                      {player.rank}
                    </div>
                    <Avatar>
                      <AvatarImage src="" alt={player.name} />
                      <AvatarFallback className="bg-blue-100 text-blue-600">
                        {player.avatar}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="text-blue-900">{player.name}</div>
                      <div className="text-gray-600">{player.wins} wins</div>
                    </div>
                    <div className="text-right">
                      <div className="text-blue-900">{player.winRate}%</div>
                      <div className="text-gray-600">Win Rate</div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Season Progress */}
            <Card className="p-6 border-blue-200 bg-gradient-to-br from-blue-50 via-white to-blue-50">
              <div className="mb-6">
                <h3 className="text-blue-900 mb-1">Season Progress</h3>
                <p className="text-gray-600">Your journey to the top</p>
              </div>

              <div className="space-y-6">
                {/* Current Tier */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Current Tier</span>
                    <Badge className="bg-blue-600">Diamond III</Badge>
                  </div>
                  <Progress value={65} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">8,942 / 12,000 points</span>
                    <span className="text-blue-600">65%</span>
                  </div>
                </div>

                {/* Milestones */}
                <div className="space-y-3">
                  <div className="text-gray-600">Season Milestones</div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                        ✓
                      </div>
                      <div className="flex-1">
                        <div className="text-blue-900">100 Wins</div>
                        <div className="text-gray-600">Completed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-green-50 border border-green-200 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-green-500 flex items-center justify-center text-white">
                        ✓
                      </div>
                      <div className="flex-1">
                        <div className="text-blue-900">Reach Diamond</div>
                        <div className="text-gray-600">Completed</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                      <div className="w-6 h-6 rounded-full bg-blue-200 flex items-center justify-center text-blue-600">
                        ⟳
                      </div>
                      <div className="flex-1">
                        <div className="text-blue-900">Reach Master</div>
                        <div className="text-gray-600">In Progress</div>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 p-3 bg-gray-50 border border-gray-200 rounded-lg opacity-60">
                      <div className="w-6 h-6 rounded-full bg-gray-300 flex items-center justify-center text-gray-600">
                        ○
                      </div>
                      <div className="flex-1">
                        <div className="text-blue-900">200 Wins</div>
                        <div className="text-gray-600">Locked</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </section>
  );
}
