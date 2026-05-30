import { AdminLayout } from '@/components/admin-layout';
import { useAdminGetDashboard } from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Users, Target, CheckSquare, Skull, Backpack, Sparkles, Swords, Flame } from 'lucide-react';

export function AdminDashboard() {
  const { data, isLoading } = useAdminGetDashboard();

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <Skeleton className="h-10 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
        </div>
      </AdminLayout>
    );
  }

  const stats = data?.stats;
  const statCards = stats ? [
    { label: 'Total Users', value: stats.totalUsers, icon: Users, color: 'text-primary' },
    { label: 'Active Players', value: stats.totalPlayers, icon: Flame, color: 'text-orange-400' },
    { label: 'Goals', value: stats.totalGoals, icon: Target, color: 'text-green-400' },
    { label: 'Habits', value: stats.totalHabits, icon: CheckSquare, color: 'text-blue-400' },
    { label: 'Bosses', value: stats.totalBosses, icon: Skull, color: 'text-red-400' },
    { label: 'Items', value: stats.totalItems, icon: Backpack, color: 'text-purple-400' },
    { label: 'Skills', value: stats.totalSkills, icon: Sparkles, color: 'text-yellow-400' },
    { label: 'Active Battles', value: stats.activeBattles, icon: Swords, color: 'text-destructive' },
  ] : [];

  return (
    <AdminLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-serif uppercase tracking-wider text-foreground">Sovereign's Overview</h1>
        <p className="text-muted-foreground italic font-serif mt-1">The realm at a glance</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card key={card.label} className="bg-card border-border">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-xs uppercase tracking-widest text-muted-foreground font-serif">{card.label}</CardTitle>
                <Icon className={`w-5 h-5 ${card.color}`} />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-serif font-bold">{card.value}</div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-serif">Recent Signups</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="text-xs uppercase tracking-widest">Username</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest">Role</TableHead>
                  <TableHead className="text-xs uppercase tracking-widest">Joined</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {data?.recentUsers?.map((u) => (
                  <TableRow key={u.id}>
                    <TableCell className="font-serif">{u.username}</TableCell>
                    <TableCell>
                      <Badge variant={u.role === 'admin' ? 'destructive' : 'secondary'}>{u.role}</Badge>
                    </TableCell>
                    <TableCell className="text-muted-foreground text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="text-sm uppercase tracking-widest font-serif">Recent Activity</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {data?.recentActivity?.map((a) => (
                <div key={a.id} className="flex items-start gap-3 border-b border-border pb-3 last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm truncate">{a.description}</p>
                    <p className="text-xs text-muted-foreground">{a.username} &middot; {new Date(a.timestamp).toLocaleString()}</p>
                  </div>
                  {a.xpGained > 0 && (
                    <Badge variant="outline" className="text-primary border-primary/30 shrink-0">+{a.xpGained} XP</Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
