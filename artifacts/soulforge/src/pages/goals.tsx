import React, { useState } from 'react';
import { useListGoals, useCreateGoal, useUpdateGoal, useDeleteGoal, GoalPriority, GoalStatus } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Target, Plus, CheckCircle, Circle, Trash2, ShieldAlert } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { getListGoalsQueryKey } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';

export function Goals() {
  const { data: goals = [], isLoading } = useListGoals();
  const createGoal = useCreateGoal();
  const updateGoal = useUpdateGoal();
  const deleteGoal = useDeleteGoal();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<GoalPriority>('medium');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createGoal.mutateAsync({ data: { title, priority } });
    setTitle('');
    queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
  };

  const handleToggle = async (id: number, currentStatus: GoalStatus) => {
    const newStatus = currentStatus === 'completed' ? 'active' : 'completed';
    await updateGoal.mutateAsync({ id, data: { status: newStatus } });
    queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
  };

  const handleDelete = async (id: number) => {
    await deleteGoal.mutateAsync({ id });
    queryClient.invalidateQueries({ queryKey: getListGoalsQueryKey() });
  };

  const getPriorityColor = (p: string) => {
    switch (p) {
      case 'legendary': return 'text-amber-500 shadow-[0_0_10px_rgba(245,158,11,0.5)] border-amber-500/50';
      case 'high': return 'text-red-500 border-red-500/30';
      case 'medium': return 'text-orange-500 border-orange-500/30';
      case 'low': return 'text-muted-foreground border-border';
      default: return 'text-muted-foreground border-border';
    }
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Quests</h1>
          <p className="text-muted-foreground font-serif italic">Your grand ambitions await completion.</p>
        </header>

        <form onSubmit={handleCreate} className="flex gap-4 items-end bg-card p-4 border border-border shadow-md">
          <div className="flex-1 space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">New Quest</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Slay the dragon..."
              className="bg-black/50 border-border focus:border-primary font-serif rounded-none"
            />
          </div>
          <div className="w-40 space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Priority</label>
            <Select value={priority} onValueChange={(v: GoalPriority) => setPriority(v)}>
              <SelectTrigger className="bg-black/50 border-border rounded-none font-serif uppercase tracking-widest">
                <SelectValue placeholder="Priority" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-none">
                <SelectItem value="low">Low</SelectItem>
                <SelectItem value="medium">Medium</SelectItem>
                <SelectItem value="high">High</SelectItem>
                <SelectItem value="legendary">Legendary</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={createGoal.isPending} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-none h-10 px-8 uppercase tracking-widest font-serif">
            <Plus className="w-5 h-5 mr-2" />
            Forge
          </Button>
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Target className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        ) : (
          <div className="space-y-4">
            <AnimatePresence>
              {goals.map(goal => (
                <motion.div 
                  key={goal.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className={`bg-card border p-4 flex items-center justify-between group transition-colors ${goal.status === 'completed' ? 'opacity-50' : ''} ${getPriorityColor(goal.priority)}`}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <button onClick={() => handleToggle(goal.id, goal.status)} className="text-muted-foreground hover:text-primary transition-colors">
                      {goal.status === 'completed' ? <CheckCircle className="w-6 h-6 text-primary" /> : <Circle className="w-6 h-6" />}
                    </button>
                    <div>
                      <h3 className={`font-serif text-lg ${goal.status === 'completed' ? 'line-through text-muted-foreground' : 'text-foreground'}`}>{goal.title}</h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs uppercase tracking-widest font-serif opacity-80">{goal.priority}</span>
                        {goal.priority === 'legendary' && <ShieldAlert className="w-3 h-3 text-amber-500" />}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-primary font-bold font-serif">+{goal.xpReward} XP</span>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(goal.id)} className="opacity-0 group-hover:opacity-100 text-muted-foreground hover:text-destructive transition-opacity">
                      <Trash2 className="w-5 h-5" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
            {goals.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-serif italic border border-dashed border-border">
                No quests recorded. The realm awaits your action.
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
