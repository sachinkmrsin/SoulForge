import React from 'react';
import { useListSkills, useEquipSkill, useUnequipSkill, useGetPlayer } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Sparkles, Lock, Shield, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { getListSkillsQueryKey, getGetPlayerQueryKey } from '@workspace/api-client-react';

export function Skills() {
  const { data: skills = [], isLoading: skillsLoading } = useListSkills();
  const { data: player, isLoading: playerLoading } = useGetPlayer();
  const equipSkill = useEquipSkill();
  const unequipSkill = useUnequipSkill();
  const queryClient = useQueryClient();

  const handleToggleEquip = async (skillId: string, isEquipped: boolean) => {
    if (isEquipped) {
      await unequipSkill.mutateAsync({ skillId });
    } else {
      if (player && player.equippedSkills.length >= 3) {
        return;
      }
      await equipSkill.mutateAsync({ skillId });
    }
    queryClient.invalidateQueries({ queryKey: getListSkillsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetPlayerQueryKey() });
  };

  const isLoading = skillsLoading || playerLoading;

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Skills</h1>
          <p className="text-muted-foreground font-serif italic">Unlock the secrets of productivity.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Sparkles className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="bg-card border border-border p-6 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-serif uppercase tracking-widest mb-1">Equipped Abilities</h2>
                <p className="text-sm text-muted-foreground italic font-serif">You may channel up to 3 powers simultaneously.</p>
              </div>
              <div className="text-right">
                <span className="text-3xl font-serif text-primary">{player?.equippedSkills.length || 0}</span>
                <span className="text-xl font-serif text-muted-foreground"> / 3</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {skills.map(skill => (
                <div 
                  key={skill.id} 
                  className={`border p-6 relative transition-all duration-300 ${
                    !skill.isUnlocked ? 'bg-card/30 border-border/30 opacity-60 grayscale' :
                    skill.isEquipped ? 'bg-primary/5 border-primary shadow-[inset_0_0_20px_rgba(255,100,0,0.1)]' :
                    'bg-card border-border hover:border-primary/50'
                  }`}
                >
                  {!skill.isUnlocked && (
                    <div className="absolute top-4 right-4">
                      <Lock className="w-5 h-5 text-muted-foreground" />
                    </div>
                  )}
                  {skill.isEquipped && (
                    <div className="absolute top-4 right-4">
                      <Shield className="w-5 h-5 text-primary" />
                    </div>
                  )}

                  <div className="mb-4">
                    <div className="w-12 h-12 bg-black/50 border border-border flex items-center justify-center mb-4">
                      <Zap className={`w-6 h-6 ${skill.isUnlocked ? 'text-primary' : 'text-muted-foreground'}`} />
                    </div>
                    <h3 className="text-xl font-serif uppercase tracking-widest mb-2">{skill.name}</h3>
                    <p className="text-sm text-muted-foreground italic font-serif h-10 line-clamp-2">{skill.description}</p>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t border-border/50">
                    <p className="text-xs uppercase tracking-widest font-serif text-primary/80 mb-4 h-8 line-clamp-2">
                      Effect: {skill.effect}
                    </p>
                    
                    {!skill.isUnlocked ? (
                      <div className="text-sm font-serif uppercase tracking-widest text-destructive">
                        Requires Level {skill.levelRequired}
                      </div>
                    ) : (
                      <Button 
                        onClick={() => handleToggleEquip(skill.id, skill.isEquipped)}
                        disabled={!skill.isEquipped && (player?.equippedSkills.length || 0) >= 3}
                        className={`w-full rounded-none uppercase tracking-widest font-serif ${
                          skill.isEquipped 
                            ? 'bg-transparent border border-primary text-primary hover:bg-primary/10' 
                            : 'bg-secondary hover:bg-primary text-secondary-foreground hover:text-primary-foreground'
                        }`}
                      >
                        {skill.isEquipped ? 'Unequip' : 'Equip Skill'}
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
