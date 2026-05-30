import React from 'react';
import { useGetActiveBoss, useListBosses, useAttackBoss } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Flame, Skull, Sword, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { getGetActiveBossQueryKey, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Boss() {
  const { data: activeBoss, isLoading: activeLoading } = useGetActiveBoss();
  const { data: bosses = [], isLoading: bossesLoading } = useListBosses();
  const attackBoss = useAttackBoss();
  const queryClient = useQueryClient();
  const [damageText, setDamageText] = React.useState<number | null>(null);

  const handleAttack = async () => {
    if (!activeBoss) return;
    try {
      const result = await attackBoss.mutateAsync({ id: activeBoss.id });
      setDamageText(result.damage);
      setTimeout(() => setDamageText(null), 1000);
      queryClient.invalidateQueries({ queryKey: getGetActiveBossQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    } catch (err) {
      console.error(err);
    }
  };

  const isLoading = activeLoading || bossesLoading;

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-destructive/90">Boss Fights</h1>
          <p className="text-muted-foreground font-serif italic">Conquer your ultimate foes.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Flame className="w-8 h-8 text-destructive animate-pulse" />
          </div>
        ) : activeBoss ? (
          <div className="bg-card border border-destructive/30 p-8 relative overflow-hidden flex flex-col items-center justify-center min-h-[50vh]">
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-destructive/10 via-background to-background pointer-events-none" />
            
            <AnimatePresence>
              {damageText !== null && (
                <motion.div 
                  initial={{ opacity: 1, y: 0, scale: 1.5 }}
                  animate={{ opacity: 0, y: -50, scale: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.8 }}
                  className="absolute top-1/3 text-4xl font-serif font-bold text-destructive z-20 drop-shadow-[0_0_10px_rgba(255,0,0,0.8)]"
                >
                  -{damageText}
                </motion.div>
              )}
            </AnimatePresence>

            <div className="relative z-10 text-center w-full max-w-2xl">
              <Skull className="w-24 h-24 mx-auto mb-6 text-destructive drop-shadow-[0_0_15px_rgba(255,0,0,0.3)] animate-pulse" />
              <h2 className="text-5xl font-serif uppercase tracking-widest text-foreground drop-shadow-md mb-2">{activeBoss.boss.name}</h2>
              <p className="text-muted-foreground font-serif italic mb-8">{activeBoss.boss.description}</p>
              
              <div className="w-full mb-8 relative">
                <div className="flex justify-between text-sm uppercase tracking-widest font-serif mb-2 text-destructive">
                  <span>HP</span>
                  <span>{activeBoss.currentHp} / {activeBoss.boss.maxHp}</span>
                </div>
                <div className="h-4 bg-black/80 border border-destructive/20 relative overflow-hidden">
                  <motion.div 
                    className="absolute top-0 left-0 h-full bg-destructive shadow-[0_0_10px_rgba(255,0,0,0.5)]"
                    initial={{ width: `${(activeBoss.currentHp / activeBoss.boss.maxHp) * 100}%` }}
                    animate={{ width: `${(activeBoss.currentHp / activeBoss.boss.maxHp) * 100}%` }}
                    transition={{ duration: 0.5, ease: "easeOut" }}
                  />
                </div>
              </div>

              <div className="flex flex-col items-center gap-4">
                <Button 
                  onClick={handleAttack}
                  disabled={attackBoss.isPending || activeBoss.attackPoints <= 0}
                  className="bg-destructive hover:bg-destructive/80 text-destructive-foreground font-serif uppercase tracking-widest text-xl h-16 px-12 rounded-none shadow-[0_0_20px_rgba(255,0,0,0.2)] hover:shadow-[0_0_30px_rgba(255,0,0,0.5)] transition-all"
                >
                  <Sword className="w-6 h-6 mr-3" />
                  Attack
                </Button>
                <p className="text-sm font-serif uppercase tracking-widest text-muted-foreground">
                  Available Attacks: <span className="text-primary">{activeBoss.attackPoints}</span>
                </p>
                <p className="text-xs text-muted-foreground/60 italic font-serif">Complete rituals and quests to earn attacks.</p>
              </div>
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <h2 className="text-xl font-serif text-muted-foreground uppercase tracking-widest border-b border-border/30 pb-2">
              Available Foes
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {bosses.map((boss) => (
                <div key={boss.id} className="bg-card border border-border p-6 hover:border-destructive/50 transition-colors group">
                  <div className="flex justify-between items-start mb-4">
                    <Skull className="w-8 h-8 text-muted-foreground group-hover:text-destructive transition-colors" />
                    <span className="text-xs uppercase tracking-widest font-serif text-destructive px-2 py-1 bg-destructive/10 border border-destructive/20">{boss.difficulty}</span>
                  </div>
                  <h3 className="text-2xl font-serif uppercase tracking-wider mb-2">{boss.name}</h3>
                  <p className="text-sm text-muted-foreground italic font-serif mb-6 line-clamp-2">{boss.description}</p>
                  
                  <div className="flex justify-between items-center text-sm font-serif mb-6">
                    <span className="text-muted-foreground">HP: {boss.maxHp}</span>
                    <span className="text-primary">XP: {boss.xpReward}</span>
                  </div>

                  <Button className="w-full bg-secondary hover:bg-destructive text-secondary-foreground hover:text-destructive-foreground rounded-none uppercase tracking-widest font-serif">
                    Challenge
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
