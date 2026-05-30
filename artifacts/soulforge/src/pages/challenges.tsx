import React from 'react';
import { useListChallenges, useCompleteChallenge } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Swords, Check, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { getListChallengesQueryKey, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { motion } from 'framer-motion';

export function Challenges() {
  const { data: challenges = [], isLoading } = useListChallenges();
  const completeChallenge = useCompleteChallenge();
  const queryClient = useQueryClient();

  const handleComplete = async (id: string) => {
    await completeChallenge.mutateAsync({ challengeId: id });
    queryClient.invalidateQueries({ queryKey: getListChallengesQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
  };

  const activeChallenges = challenges.filter(c => c.status === 'active');
  const completedChallenges = challenges.filter(c => c.status === 'completed');

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4 flex justify-between items-end">
          <div>
            <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Trials</h1>
            <p className="text-muted-foreground font-serif italic">Tests of endurance decreed by the old gods.</p>
          </div>
          <Button variant="outline" className="border-primary/50 text-primary hover:bg-primary/10 rounded-none uppercase tracking-widest font-serif">
            <RefreshCw className="w-4 h-4 mr-2" />
            Seek New Trials
          </Button>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Swords className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        ) : (
          <div className="space-y-12">
            <section>
              <h2 className="text-xl font-serif text-muted-foreground uppercase tracking-widest border-b border-border/30 pb-2 mb-6">
                Active Trials
              </h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {activeChallenges.map(challenge => (
                  <motion.div 
                    key={challenge.id}
                    layout
                    className="bg-card border border-border p-6 relative overflow-hidden group"
                  >
                    <div className="absolute top-0 right-0 p-4">
                      <span className="text-xs uppercase tracking-widest font-serif text-primary border border-primary/30 px-2 py-1 bg-primary/5">
                        {challenge.duration}
                      </span>
                    </div>
                    <div className="mb-4">
                      <h3 className="text-2xl font-serif text-foreground pr-24">{challenge.title}</h3>
                      <p className="text-sm text-muted-foreground mt-2 italic font-serif">{challenge.description}</p>
                    </div>
                    <div className="flex items-center justify-between mt-6 pt-4 border-t border-border/50">
                      <div className="flex items-center gap-4 text-sm font-serif">
                        <span className="text-muted-foreground uppercase tracking-widest">Difficulty: <span className="text-foreground">{challenge.difficulty}</span></span>
                        <span className="text-primary font-bold">+{challenge.xpReward} XP</span>
                      </div>
                      <Button 
                        onClick={() => handleComplete(challenge.id)}
                        disabled={completeChallenge.isPending}
                        className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-none uppercase tracking-widest font-serif h-10 px-6"
                      >
                        {completeChallenge.isPending ? 'Completing...' : 'Complete'}
                        {!completeChallenge.isPending && <Check className="w-4 h-4 ml-2" />}
                      </Button>
                    </div>
                  </motion.div>
                ))}
                {activeChallenges.length === 0 && (
                  <div className="col-span-full text-center py-12 text-muted-foreground font-serif italic border border-dashed border-border">
                    No active trials. The gods are silent.
                  </div>
                )}
              </div>
            </section>

            {completedChallenges.length > 0 && (
              <section>
                <h2 className="text-xl font-serif text-muted-foreground uppercase tracking-widest border-b border-border/30 pb-2 mb-6">
                  Conquered
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedChallenges.slice(0, 6).map(challenge => (
                    <div key={challenge.id} className="bg-card/50 border border-border/50 p-4 opacity-70">
                      <div className="flex items-start justify-between">
                        <h4 className="font-serif line-through text-muted-foreground">{challenge.title}</h4>
                        <Check className="w-4 h-4 text-primary" />
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
