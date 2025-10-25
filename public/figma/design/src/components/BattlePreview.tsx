import { ImageWithFallback } from "./figma/ImageWithFallback";
import { Badge } from "./ui/badge";
import { ScrollArea } from "./ui/scroll-area";
import { Card } from "./ui/card";
import { Swords, Zap, Shield, Heart } from "lucide-react";

export function BattlePreview() {
  const battleLogs = [
    { 
      id: 1, 
      attacker: "Warrior Alpha", 
      action: "Shadow Strike", 
      damage: 450, 
      type: "attack",
      critical: true 
    },
    { 
      id: 2, 
      attacker: "Fighter Beta", 
      action: "Iron Defense", 
      effect: "Defense +30%", 
      type: "buff" 
    },
    { 
      id: 3, 
      attacker: "Warrior Alpha", 
      action: "Lightning Slash", 
      damage: 320, 
      type: "attack",
      critical: false 
    },
    { 
      id: 4, 
      attacker: "Fighter Beta", 
      action: "Phoenix Strike", 
      damage: 580, 
      type: "attack",
      critical: true 
    },
    { 
      id: 5, 
      attacker: "Warrior Alpha", 
      action: "Healing Aura", 
      effect: "HP +250", 
      type: "heal" 
    },
  ];

  return (
    <section className="py-20 bg-white">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h2 className="mb-4 text-blue-900">Experience Strategic Combat</h2>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Every battle is a test of strategy and skill. Choose your moves wisely and watch the action unfold.
          </p>
        </div>

        {/* Battle Arena */}
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-[1fr,380px,1fr] gap-8 items-start">
            {/* Left Character */}
            <Card className="p-6 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <div className="space-y-6">
                {/* Character Image */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-white">
                  <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1667419675013-e5f883eb3bc0?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhbmltZSUyMHdhcnJpb3IlMjBjaGFyYWN0ZXJ8ZW58MXx8fHwxNzYxMjQ3NzIzfDA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Warrior Alpha"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 left-3">
                    <Badge className="bg-blue-600">Level 45</Badge>
                  </div>
                </div>

                {/* Character Info */}
                <div className="space-y-3">
                  <div>
                    <div className="text-blue-900 mb-1">Warrior Alpha</div>
                    <div className="text-gray-600">Shadow Assassin</div>
                  </div>

                  {/* HP Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        HP
                      </span>
                      <span className="text-blue-900">2,450 / 3,200</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-red-500 to-red-600 rounded-full" style={{ width: '76%' }} />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <div className="text-gray-600">Active Skills</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Swords className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-900">Shadow Strike</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-blue-900">Lightning Slash</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Shield className="h-4 w-4 text-green-600" />
                        <span className="text-blue-900">Healing Aura</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Swords className="h-4 w-4 text-purple-600" />
                        <span className="text-blue-900">Final Strike</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </Card>

            {/* Battle Log - Center */}
            <div className="lg:mt-0">
              <Card className="border-2 border-blue-300 bg-gradient-to-br from-blue-50 via-white to-blue-50 shadow-lg">
                <div className="p-4 border-b border-blue-200 bg-blue-600">
                  <h3 className="text-center text-white">Battle Log</h3>
                  <div className="text-center text-blue-100 mt-1">Turn 5 - Round 2</div>
                </div>
                <ScrollArea className="h-[520px] p-4">
                  <div className="space-y-3">
                    {battleLogs.map((log) => (
                      <div 
                        key={log.id}
                        className={`p-4 rounded-lg border-l-4 ${
                          log.type === 'attack' 
                            ? 'bg-red-50 border-red-400' 
                            : log.type === 'buff'
                            ? 'bg-blue-50 border-blue-400'
                            : 'bg-green-50 border-green-400'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <span className="text-blue-900">{log.attacker}</span>
                          {log.critical && (
                            <Badge variant="destructive" className="text-xs">CRITICAL!</Badge>
                          )}
                        </div>
                        <div className="text-gray-700 mb-1">{log.action}</div>
                        {log.damage && (
                          <div className="text-red-600">
                            -{log.damage} damage
                          </div>
                        )}
                        {log.effect && (
                          <div className="text-blue-600">
                            {log.effect}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </ScrollArea>
              </Card>
            </div>

            {/* Right Character */}
            <Card className="p-6 border-blue-200 bg-gradient-to-br from-blue-50 to-white">
              <div className="space-y-6">
                {/* Character Image */}
                <div className="relative aspect-[3/4] rounded-lg overflow-hidden border-2 border-blue-200 bg-gradient-to-br from-blue-100 to-white">
                  <ImageWithFallback 
                    src="https://images.unsplash.com/photo-1658270600988-7e6a66ed253e?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxmYW50YXN5JTIwZmlnaHRlciUyMGNoYXJhY3RlcnxlbnwxfHx8fDE3NjEyNDc3MjN8MA&ixlib=rb-4.1.0&q=80&w=1080"
                    alt="Fighter Beta"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-3 right-3">
                    <Badge className="bg-blue-600">Level 48</Badge>
                  </div>
                </div>

                {/* Character Info */}
                <div className="space-y-3">
                  <div>
                    <div className="text-blue-900 mb-1">Fighter Beta</div>
                    <div className="text-gray-600">Phoenix Guardian</div>
                  </div>

                  {/* HP Bar */}
                  <div className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-gray-600 flex items-center gap-1">
                        <Heart className="h-4 w-4 text-red-500" />
                        HP
                      </span>
                      <span className="text-blue-900">3,100 / 3,500</span>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full" style={{ width: '89%' }} />
                    </div>
                  </div>

                  {/* Skills */}
                  <div className="space-y-2">
                    <div className="text-gray-600">Active Skills</div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Swords className="h-4 w-4 text-orange-600" />
                        <span className="text-blue-900">Phoenix Strike</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Shield className="h-4 w-4 text-blue-600" />
                        <span className="text-blue-900">Iron Defense</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Zap className="h-4 w-4 text-red-600" />
                        <span className="text-blue-900">Flame Burst</span>
                      </div>
                      <div className="flex items-center gap-2 p-2 bg-white rounded-lg border border-blue-100">
                        <Heart className="h-4 w-4 text-pink-600" />
                        <span className="text-blue-900">Rebirth</span>
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
