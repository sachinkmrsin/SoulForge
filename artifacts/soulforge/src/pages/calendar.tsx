import React, { useState } from 'react';
import { useGetCalendar } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Calendar as CalendarIcon, Flame, Target } from 'lucide-react';
import { DayPicker } from 'react-day-picker';
import "react-day-picker/dist/style.css";

export function Calendar() {
  const [date, setDate] = useState<Date>(new Date());
  
  const { data: calendarData = [], isLoading } = useGetCalendar({
    year: date.getFullYear(),
    month: date.getMonth() + 1
  }, {
    query: {
      enabled: true
    }
  });

  const getDayModifier = (day: Date) => {
    const dateStr = day.toISOString().split('T')[0];
    const dayData = calendarData.find((d: any) => d.date.startsWith(dateStr));
    
    if (!dayData) return 'none';
    if (dayData.habitsCompleted === 0) return 'missed';
    if (dayData.habitsCompleted === dayData.habitsTotal) return 'perfect';
    return 'partial';
  };

  const selectedDayData = calendarData.find((d: any) => 
    d.date.startsWith(date.toISOString().split('T')[0])
  );

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Chronicles</h1>
          <p className="text-muted-foreground font-serif italic">Your history written in embers.</p>
        </header>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 bg-card border border-border p-6 flex justify-center">
            <style>
              {`
                .rdp {
                  --rdp-cell-size: 50px;
                  --rdp-accent-color: hsl(var(--primary));
                  --rdp-background-color: hsl(var(--card));
                  --rdp-outline: 2px solid hsl(var(--primary));
                  --rdp-outline-selected: 2px solid hsl(var(--primary));
                  margin: 0;
                }
                .rdp-day {
                  font-family: var(--font-serif);
                  border-radius: 0;
                  border: 1px solid hsl(var(--border) / 0.3);
                }
                .rdp-day_selected, .rdp-day_selected:focus-visible, .rdp-day_selected:hover {
                  background-color: hsl(var(--primary) / 0.2);
                  color: hsl(var(--primary));
                  font-weight: bold;
                }
                .rdp-button:hover:not([disabled]):not(.rdp-day_selected) {
                  background-color: hsl(var(--secondary));
                }
                .rdp-caption_label {
                  font-family: var(--font-serif);
                  text-transform: uppercase;
                  letter-spacing: 0.1em;
                  font-size: 1.25rem;
                }
                .rdp-head_cell {
                  font-family: var(--font-serif);
                  text-transform: uppercase;
                  color: hsl(var(--muted-foreground));
                  font-weight: normal;
                }
                
                .day-perfect { background-color: hsl(var(--primary) / 0.8) !important; color: black !important; border-color: hsl(var(--primary)) !important; }
                .day-partial { background-color: hsl(var(--primary) / 0.3) !important; }
                .day-missed { background-color: transparent !important; }
              `}
            </style>
            
            {isLoading ? (
              <div className="flex items-center justify-center min-h-[400px]">
                <CalendarIcon className="w-12 h-12 text-muted-foreground animate-pulse" />
              </div>
            ) : (
              <DayPicker
                mode="single"
                selected={date}
                onSelect={(d) => d && setDate(d)}
                onMonthChange={setDate}
                modifiers={{
                  perfect: (d) => getDayModifier(d) === 'perfect',
                  partial: (d) => getDayModifier(d) === 'partial',
                }}
                modifiersClassNames={{
                  perfect: 'day-perfect',
                  partial: 'day-partial'
                }}
              />
            )}
          </div>

          <div className="space-y-6">
            <div className="bg-card border border-border p-6 h-full">
              <h3 className="text-2xl font-serif uppercase tracking-widest mb-6 border-b border-border/50 pb-4">
                {date.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
              </h3>
              
              {selectedDayData ? (
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-primary/10 flex items-center justify-center border border-primary/30">
                      <Flame className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-widest text-muted-foreground font-serif">XP Earned</p>
                      <p className="text-2xl font-serif text-primary">+{selectedDayData.xpEarned}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary flex items-center justify-center border border-border">
                      <CalendarIcon className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-widest text-muted-foreground font-serif">Rituals</p>
                      <p className="text-xl font-serif">{selectedDayData.habitsCompleted} / {selectedDayData.habitsTotal}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-secondary flex items-center justify-center border border-border">
                      <Target className="w-6 h-6 text-foreground" />
                    </div>
                    <div>
                      <p className="text-sm uppercase tracking-widest text-muted-foreground font-serif">Subtasks</p>
                      <p className="text-xl font-serif">{selectedDayData.subtasksCompleted} Completed</p>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-muted-foreground font-serif italic text-center py-12 opacity-70">
                  <CalendarIcon className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  No deeds recorded on this day.
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
}
