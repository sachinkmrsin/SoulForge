import React, { useState } from 'react';
import { useListHabits, useCreateHabit, useCheckinHabit, HabitFrequency, HabitTimeOfDay } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Flame, Check, Plus, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQueryClient } from '@tanstack/react-query';
import { getListHabitsQueryKey, getGetDashboardSummaryQueryKey } from '@workspace/api-client-react';
import { motion } from 'framer-motion';

export function Habits() {
  const { data: habits = [], isLoading } = useListHabits();
  const createHabit = useCreateHabit();
  const checkinHabit = useCheckinHabit();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<HabitTimeOfDay>('anytime');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    await createHabit.mutateAsync({ data: { title, timeOfDay, frequency: 'daily' } });
    setTitle('');
    queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
  };

  const [animatingId, setAnimatingId] = useState<string | null>(null);

  const handleCheckin = async (id: string) => {
    setAnimatingId(id);
    await checkinHabit.mutateAsync({ habitId: id });
    queryClient.invalidateQueries({ queryKey: getListHabitsQueryKey() });
    queryClient.invalidateQueries({ queryKey: getGetDashboardSummaryQueryKey() });
    setTimeout(() => setAnimatingId(null), 1000);
  };

  const groupedHabits = habits.reduce((acc, habit) => {
    const time = habit.timeOfDay;
    if (!acc[time]) acc[time] = [];
    acc[time].push(habit);
    return acc;
  }, {} as Record<string, typeof habits>);

  const timeOrder = ['morning', 'afternoon', 'evening', 'anytime'];

  return (
    <MainLayout>
      <div className="space-y-8 relative">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Rituals</h1>
          <p className="text-muted-foreground font-serif italic">Consistency forged in fire.</p>
        </header>

        <form onSubmit={handleCreate} className="flex gap-4 items-end bg-card p-4 border border-border shadow-md">
          <div className="flex-1 space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">New Ritual</label>
            <Input 
              value={title} 
              onChange={e => setTitle(e.target.value)} 
              placeholder="Read ancient tomes..."
              className="bg-black/50 border-border focus:border-primary font-serif rounded-none"
            />
          </div>
          <div className="w-40 space-y-2">
            <label className="text-xs uppercase tracking-widest text-muted-foreground">Time</label>
            <Select value={timeOfDay} onValueChange={(v: HabitTimeOfDay) => setTimeOfDay(v)}>
              <SelectTrigger className="bg-black/50 border-border rounded-none font-serif uppercase tracking-widest">
                <SelectValue placeholder="Time" />
              </SelectTrigger>
              <SelectContent className="bg-card border-border rounded-none">
                <SelectItem value="morning">Morning</SelectItem>
                <SelectItem value="afternoon">Afternoon</SelectItem>
                <SelectItem value="evening">Evening</SelectItem>
                <SelectItem value="anytime">Anytime</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={createHabit.isPending} className="bg-primary hover:bg-primary/80 text-primary-foreground rounded-none h-10 px-8 uppercase tracking-widest font-serif">
            <Plus className="w-5 h-5 mr-2" />
            Bind
          </Button>
        </form>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Flame className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            {timeOrder.map(time => {
              const items = groupedHabits[time];
              if (!items || items.length === 0) return null;
              return (
                <div key={time} className="space-y-4">
                  <h2 className="text-xl font-serif text-muted-foreground uppercase tracking-widest border-b border-border/30 pb-2">
                    {time === 'anytime' ? 'Timeless' : time} Rites
                  </h2>
                  <div className="grid gap-4">
                    {items.map(habit => (
                      <motion.div 
                        key={habit.id}
                        layout
                        className={`bg-card border p-4 flex items-center justify-between transition-colors relative overflow-hidden ${habit.completedToday ? 'border-primary/30 opacity-70' : 'border-border'}`}
                      >
                        {animatingId === habit.id && (
                          <motion.div 
                            initial={{ scale: 0, opacity: 0.8 }}
                            animate={{ scale: 2, opacity: 0 }}
                            transition={{ duration: 0.8, ease: "easeOut" }}
                            className="absolute inset-0 bg-primary/20 pointer-events-none rounded-full blur-xl"
                            style={{ originX: 0.5, originY: 0.5 }}
                          />
                        )}
                        <div className="flex flex-col">
                          <h3 className="font-serif text-lg text-foreground">{habit.title}</h3>
                          <div className="flex items-center gap-4 mt-1 text-sm">
                            <span className="flex items-center gap-1 text-primary">
                              <Flame className="w-4 h-4" /> {habit.streak} Streak
                            </span>
                            <span className="text-muted-foreground font-serif uppercase tracking-widest text-xs">
                              +{habit.xpReward} XP
                            </span>
                          </div>
                        </div>
                        <Button 
                          onClick={() => handleCheckin(habit.id)}
                          disabled={habit.completedToday || checkinHabit.isPending}
                          className={`rounded-none h-12 w-12 p-0 ${habit.completedToday ? 'bg-primary/20 text-primary hover:bg-primary/20 cursor-default' : 'bg-secondary hover:bg-primary hover:text-primary-foreground text-secondary-foreground border border-secondary-border'}`}
                        >
                          {checkinHabit.isPending && animatingId === habit.id ? <Loader2 className="w-6 h-6 animate-spin" /> : <Check className="w-6 h-6" />}
                        </Button>
                      </motion.div>
                    ))}
                  </div>
                </div>
              );
            })}
            {habits.length === 0 && (
              <div className="text-center py-12 text-muted-foreground font-serif italic border border-dashed border-border">
                No rituals established.
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
