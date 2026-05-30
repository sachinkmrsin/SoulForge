import React from 'react';
import { useGetDashboardSummary } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Shield, Swords, Flame, Skull, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';

export function Dashboard() {
  const { data: summary, isLoading } = useGetDashboardSummary();

  if (isLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center min-h-[50vh]">
          <Flame className="w-12 h-12 text-primary animate-pulse" />
        </div>
      </MainLayout>
    );
  }

  if (!summary) return null;

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">The Bonfire</h1>
          <p className="text-muted-foreground font-serif italic">Rest here, {summary.player.username}. Your journey is long.</p>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Player Stats */}
          <div className="col-span-1 md:col-span-2 bg-card border border-border p-6 relative overflow-hidden group">
            <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -mr-10 -mt-10 transition-transform group-hover:scale-150 duration-700" />
            <div className="flex items-center justify-between mb-6 relative z-10">
              <div>
                <h2 className="text-2xl font-serif text-foreground uppercase tracking-widest">{summary.player.username}</h2>
                <p className="text-primary font-serif italic text-sm">Level {summary.player.level} {summary.player.avatarClass}</p>
              </div>
              <Shield className="w-10 h-10 text-primary opacity-50" />
            </div>

            <div className="space-y-4 relative z-10">
              <div>
                <div className="flex justify-between text-sm mb-1 uppercase tracking-wider font-serif">
                  <span className="text-destructive">HP</span>
                  <span className="text-destructive">{summary.player.hp} / {summary.player.maxHp}</span>
                </div>
                <div className="h-2 bg-black/50 overflow-hidden">
                  <div 
                    className="h-full bg-destructive transition-all duration-1000 ease-out"
                    style={{ width: `${(summary.player.hp / summary.player.maxHp) * 100}%` }}
                  />
                </div>
              </div>
              <div>
                <div className="flex justify-between text-sm mb-1 uppercase tracking-wider font-serif">
                  <span className="text-primary">XP</span>
                  <span className="text-primary">{summary.player.xp} / {summary.player.xpToNextLevel}</span>
                </div>
                <div className="h-2 bg-black/50 overflow-hidden">
                  <div 
                    className="h-full bg-primary transition-all duration-1000 ease-out"
                    style={{ width: `${(summary.player.xp / summary.player.xpToNextLevel) * 100}%` }}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="bg-card border border-border p-6 flex flex-col justify-between">
            <div>
              <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-serif mb-4 flex items-center gap-2">
                <Flame className="w-4 h-4 text-primary" /> Daily Fire
              </h3>
              <div className="space-y-4">
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm font-serif">Streak</span>
                  <span className="text-2xl font-serif text-primary">{summary.streak}</span>
                </div>
                <div className="flex justify-between items-end border-b border-border/50 pb-2">
                  <span className="text-sm font-serif">XP Today</span>
                  <span className="text-2xl font-serif text-primary">+{summary.todayXp}</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Active Boss */}
          {summary.activeBoss ? (
            <div className="bg-card border border-border p-6 relative group overflow-hidden">
               <div className="absolute inset-0 bg-destructive/5 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
               <h3 className="text-sm uppercase tracking-widest text-destructive font-serif mb-4 flex items-center gap-2 relative z-10">
                <Skull className="w-4 h-4" /> Current Target
              </h3>
              <div className="relative z-10">
                <h4 className="text-xl font-serif uppercase tracking-widest mb-1">{summary.activeBoss.boss.name}</h4>
                <p className="text-xs text-muted-foreground font-serif italic mb-4 uppercase tracking-widest">{summary.activeBoss.boss.difficulty}</p>
                <div className="h-1.5 bg-black/50 overflow-hidden mb-6">
                  <div 
                    className="h-full bg-destructive transition-all duration-1000 ease-out"
                    style={{ width: `${(summary.activeBoss.currentHp / summary.activeBoss.boss.maxHp) * 100}%` }}
                  />
                </div>
                <Link href="/boss" className="inline-flex items-center text-sm font-serif uppercase tracking-wider text-destructive hover:text-destructive/80 transition-colors">
                  Engage Boss <ChevronRight className="w-4 h-4 ml-1" />
                </Link>
              </div>
            </div>
          ) : (
            <div className="bg-card border border-border p-6 flex flex-col items-center justify-center text-center opacity-50 hover:opacity-100 transition-opacity">
              <Skull className="w-8 h-8 mb-3 text-muted-foreground" />
              <p className="font-serif uppercase tracking-widest text-sm text-muted-foreground mb-4">No active boss</p>
              <Link href="/boss" className="text-xs border border-border px-4 py-2 hover:bg-border transition-colors font-serif uppercase tracking-widest">
                Seek Challenge
              </Link>
            </div>
          )}

          {/* Activity Feed */}
          <div className="bg-card border border-border p-6">
             <h3 className="text-sm uppercase tracking-widest text-muted-foreground font-serif mb-4 flex items-center gap-2">
                <Swords className="w-4 h-4" /> Recent Deeds
              </h3>
              <div className="space-y-4">
                {summary.recentActivity.map((activity) => (
                  <div key={activity.id} className="flex justify-between items-center text-sm font-serif border-b border-border/30 pb-3 last:border-0 last:pb-0">
                    <span className="text-foreground/80">{activity.description}</span>
                    <span className="text-primary font-bold">+{activity.xpGained} XP</span>
                  </div>
                ))}
                {summary.recentActivity.length === 0 && (
                  <div className="text-muted-foreground text-sm font-serif italic text-center py-4">
                    The annals are empty.
                  </div>
                )}
              </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
