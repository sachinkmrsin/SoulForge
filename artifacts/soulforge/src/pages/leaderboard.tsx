import React from 'react';
import { useGetLeaderboard } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Trophy, Crown, Medal, Award } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Crown className="w-6 h-6 text-amber-400 drop-shadow-[0_0_8px_rgba(251,191,36,0.6)]" />;
  if (rank === 2) return <Medal className="w-6 h-6 text-zinc-300 drop-shadow-[0_0_6px_rgba(212,212,216,0.5)]" />;
  if (rank === 3) return <Award className="w-6 h-6 text-amber-700 drop-shadow-[0_0_6px_rgba(180,83,9,0.5)]" />;
  return <span className="text-muted-foreground font-serif text-lg w-6 text-center">{rank}</span>;
}

function RankRow({ rank, isTop3 }: { rank: number; isTop3: boolean }) {
  if (!isTop3) return null;
  const colors = {
    1: 'border-l-2 border-amber-400 bg-amber-400/5',
    2: 'border-l-2 border-zinc-400 bg-zinc-400/5',
    3: 'border-l-2 border-amber-700 bg-amber-700/5',
  } as Record<number, string>;
  return <div className={`absolute inset-y-0 left-0 w-1 ${colors[rank]}`} />;
}

export function Leaderboard() {
  const { data, isLoading } = useGetLeaderboard();

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Hall of Champions</h1>
          <p className="text-muted-foreground font-serif italic">The mightiest warriors, ranked by level and experience.</p>
        </header>

        {isLoading || !data ? (
          <div className="space-y-3">
            {Array.from({ length: 10 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full bg-card border border-border" />
            ))}
          </div>
        ) : (
          <div className="space-y-6">
            <div className="bg-card border border-border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow className="border-border hover:bg-transparent">
                    <TableHead className="w-16 font-serif uppercase tracking-widest text-xs">Rank</TableHead>
                    <TableHead className="font-serif uppercase tracking-widest text-xs">Warrior</TableHead>
                    <TableHead className="font-serif uppercase tracking-widest text-xs hidden sm:table-cell">Class</TableHead>
                    <TableHead className="font-serif uppercase tracking-widest text-xs text-right">Level</TableHead>
                    <TableHead className="font-serif uppercase tracking-widest text-xs text-right">XP</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {data.entries.map((entry) => {
                    const isTop3 = entry.rank <= 3;
                    return (
                      <TableRow key={entry.rank} className={`border-border/50 relative ${isTop3 ? 'hover:bg-primary/5' : ''}`}>
                        <RankRow rank={entry.rank} isTop3={isTop3} />
                        <TableCell className="pl-4">
                          <RankBadge rank={entry.rank} />
                        </TableCell>
                        <TableCell>
                          <span className={`font-serif ${isTop3 ? 'text-foreground' : 'text-muted-foreground'}`}>
                            {entry.username}
                          </span>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                          <span className="text-sm font-serif italic text-primary/70">{entry.avatarClass}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-serif text-lg">{entry.level}</span>
                        </TableCell>
                        <TableCell className="text-right">
                          <span className="font-serif text-muted-foreground">{entry.xp.toLocaleString()}</span>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>

            {data.currentRank && data.currentRank.rank > 50 && (
              <div className="bg-card border border-primary/30 p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(255,100,0,0.08)]">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-serif uppercase tracking-widest text-muted-foreground">Your Rank</p>
                  <p className="font-serif text-lg">
                    #{data.currentRank.rank} &mdash; {data.currentRank.username}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-serif uppercase tracking-widest text-muted-foreground">Level</p>
                  <p className="font-serif text-lg">{data.currentRank.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-serif uppercase tracking-widest text-muted-foreground">XP</p>
                  <p className="font-serif text-muted-foreground">{data.currentRank.xp.toLocaleString()}</p>
                </div>
              </div>
            )}

            {data.currentRank && data.currentRank.rank <= 50 && (
              <div className="bg-card border border-primary/30 p-4 flex items-center gap-4 shadow-[0_0_20px_rgba(255,100,0,0.08)]">
                <div className="w-10 h-10 bg-primary/10 flex items-center justify-center">
                  <Trophy className="w-5 h-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-xs font-serif uppercase tracking-widest text-muted-foreground">Your Rank</p>
                  <p className="font-serif text-lg">
                    #{data.currentRank.rank} &mdash; {data.currentRank.username}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-serif uppercase tracking-widest text-muted-foreground">Level</p>
                  <p className="font-serif text-lg">{data.currentRank.level}</p>
                </div>
                <div className="text-right">
                  <p className="text-xs font-serif uppercase tracking-widest text-muted-foreground">XP</p>
                  <p className="font-serif text-muted-foreground">{data.currentRank.xp.toLocaleString()}</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </MainLayout>
  );
}
