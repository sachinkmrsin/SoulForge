import React, { useState } from 'react';
import { useGetPlayer, useUpdatePlayerAvatar } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { User, Shield, Sword, Sparkles, Cross, Edit2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { getGetPlayerQueryKey } from '@workspace/api-client-react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';

export function Profile() {
  const { data: player, isLoading } = useGetPlayer();
  const updateAvatar = useUpdatePlayerAvatar();
  const queryClient = useQueryClient();
  const [isEditingClass, setIsEditingClass] = useState(false);

  const handleClassChange = async (newClass: string) => {
    await updateAvatar.mutateAsync({ data: { avatarClass: newClass } });
    setIsEditingClass(false);
    queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
  };

  const getRadarData = () => {
    if (!player) return [];
    return [
      { subject: 'Strength', A: player.strength, fullMark: 100 },
      { subject: 'Endurance', A: player.endurance, fullMark: 100 },
      { subject: 'Dexterity', A: player.dexterity, fullMark: 100 },
      { subject: 'Faith', A: player.faith, fullMark: 100 },
    ];
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Character</h1>
          <p className="text-muted-foreground font-serif italic">Examine your mortal coil.</p>
        </header>

        {isLoading || !player ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <User className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
              <div className="bg-card border border-border p-8 text-center relative overflow-hidden group">
                <div className="absolute inset-0 bg-primary/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                <div className="w-32 h-32 mx-auto bg-black/50 border border-primary/50 flex items-center justify-center mb-6 relative z-10 shadow-[0_0_30px_rgba(255,100,0,0.15)]">
                  {player.avatarClass === 'Knight' && <Sword className="w-16 h-16 text-primary" />}
                  {player.avatarClass === 'Mage' && <Sparkles className="w-16 h-16 text-primary" />}
                  {player.avatarClass === 'Archer' && <Shield className="w-16 h-16 text-primary" />}
                  {player.avatarClass === 'Cleric' && <Cross className="w-16 h-16 text-primary" />}
                  {!['Knight', 'Mage', 'Archer', 'Cleric'].includes(player.avatarClass) && <User className="w-16 h-16 text-primary" />}
                </div>
                
                <h2 className="text-3xl font-serif uppercase tracking-widest mb-1 relative z-10">{player.username}</h2>
                
                <div className="flex items-center justify-center gap-2 relative z-10 mb-6">
                  {isEditingClass ? (
                    <Select defaultValue={player.avatarClass} onValueChange={handleClassChange}>
                      <SelectTrigger className="w-32 bg-black/50 border-primary rounded-none font-serif uppercase text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="rounded-none font-serif">
                        <SelectItem value="Knight">Knight</SelectItem>
                        <SelectItem value="Mage">Mage</SelectItem>
                        <SelectItem value="Archer">Archer</SelectItem>
                        <SelectItem value="Cleric">Cleric</SelectItem>
                      </SelectContent>
                    </Select>
                  ) : (
                    <>
                      <p className="text-primary font-serif italic text-lg">{player.avatarClass}</p>
                      <button onClick={() => setIsEditingClass(true)} className="text-muted-foreground hover:text-primary transition-colors">
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>

                <div className="w-full bg-black/50 h-2 mb-2 relative z-10">
                  <div 
                    className="h-full bg-primary" 
                    style={{ width: `${(player.xp / player.xpToNextLevel) * 100}%` }} 
                  />
                </div>
                <div className="flex justify-between text-xs font-serif uppercase tracking-widest text-muted-foreground relative z-10">
                  <span>Level {player.level}</span>
                  <span>{player.xp} / {player.xpToNextLevel} XP</span>
                </div>
              </div>

              <div className="bg-card border border-border p-6 space-y-4">
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm font-serif uppercase tracking-widest text-muted-foreground">Total Gold</span>
                  <span className="text-2xl font-serif text-amber-500">{player.gold}</span>
                </div>
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm font-serif uppercase tracking-widest text-muted-foreground">Max HP</span>
                  <span className="text-2xl font-serif text-destructive">{player.maxHp}</span>
                </div>
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm font-serif uppercase tracking-widest text-muted-foreground">Joined</span>
                  <span className="text-lg font-serif">{new Date(player.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-8">
              <div className="bg-card border border-border p-6">
                <h3 className="text-xl font-serif uppercase tracking-widest mb-6">Attributes</h3>
                <div className="h-[400px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart cx="50%" cy="50%" outerRadius="80%" data={getRadarData()}>
                      <PolarGrid stroke="hsl(var(--border))" />
                      <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: "hsl(var(--muted-foreground))", fontFamily: "var(--font-serif)", textTransform: "uppercase", fontSize: 12, letterSpacing: "0.1em" }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 'dataMax + 20']} tick={false} axisLine={false} />
                      <Radar
                        name="Stats"
                        dataKey="A"
                        stroke="hsl(var(--primary))"
                        fill="hsl(var(--primary))"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 text-center">
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Strength</p>
                    <p className="text-2xl font-serif">{player.strength}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Endurance</p>
                    <p className="text-2xl font-serif">{player.endurance}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Dexterity</p>
                    <p className="text-2xl font-serif">{player.dexterity}</p>
                  </div>
                  <div>
                    <p className="text-xs uppercase tracking-widest text-muted-foreground font-serif">Faith</p>
                    <p className="text-2xl font-serif">{player.faith}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
