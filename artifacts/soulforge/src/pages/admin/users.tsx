import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import {
  useAdminListUsers, useAdminGetUser, useAdminUpdateUser, useAdminDeleteUser,
  useAdminUpdatePlayer, getAdminListUsersQueryKey,
  type AdminUserListEntry, type AdminUserDetail
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Search, Edit, Trash2, Eye, Shield, Crown } from 'lucide-react';

export function AdminUsers() {
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [playerDialogOpen, setPlayerDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminListUsers({
    search: search || undefined,
    role: roleFilter !== 'all' ? roleFilter : undefined,
    page,
    limit: 20,
  });

  const { data: userDetail } = useAdminGetUser(selectedUserId!, {
    query: { enabled: !!selectedUserId, queryKey: ['admin-user', selectedUserId] },
  });

  const updateUser = useAdminUpdateUser();
  const updatePlayer = useAdminUpdatePlayer();
  const deleteUser = useAdminDeleteUser();

  const invalidate = () => {
    queryClient.invalidateQueries({ queryKey: getAdminListUsersQueryKey() });
  };

  const handleDelete = async () => {
    if (!selectedUserId) return;
    try {
      await deleteUser.mutateAsync({ userId: selectedUserId });
      toast({ title: 'User deleted' });
      setDeleteDialogOpen(false);
      setSelectedUserId(null);
      invalidate();
    } catch (e: any) {
      toast({ title: e?.response?.data?.error || 'Failed to delete user', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <header className="mb-8">
        <h1 className="text-3xl font-serif uppercase tracking-wider text-foreground">User Management</h1>
        <p className="text-muted-foreground italic font-serif mt-1">Oversee the souls within the realm</p>
      </header>

      <Card className="bg-card border-border mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search by username..."
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                className="pl-10 bg-black/50 border-border rounded-none"
              />
            </div>
            <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v); setPage(1); }}>
              <SelectTrigger className="w-40 bg-black/50 border-border rounded-none">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Roles</SelectItem>
                <SelectItem value="user">User</SelectItem>
                <SelectItem value="admin">Admin</SelectItem>
                <SelectItem value="moderator">Moderator</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-widest">User</TableHead>
                <TableHead className="text-xs uppercase tracking-widest">Role</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden sm:table-cell">Level</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden sm:table-cell">Gold</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden md:table-cell">Joined</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.users?.map((u: AdminUserListEntry) => (
                <TableRow key={u.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <span className="font-serif">{u.username}</span>
                      {u.isPro && <Badge variant="outline" className="text-primary border-primary/30 text-[10px]">PRO</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant={u.role === 'admin' ? 'destructive' : u.role === 'moderator' ? 'default' : 'secondary'}>
                      {u.role === 'admin' && <Crown className="w-3 h-3 mr-1" />}
                      {u.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{u.level}</TableCell>
                  <TableCell className="hidden sm:table-cell">{u.gold}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{new Date(u.createdAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => { setSelectedUserId(u.id); setEditDialogOpen(true); }}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setSelectedUserId(u.id); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} users)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <UserEditDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        userDetail={userDetail}
        onUpdateUser={async (data) => {
          if (!selectedUserId) return;
          try {
            await updateUser.mutateAsync({ userId: selectedUserId, data: data as any });
            toast({ title: 'User updated' });
            invalidate();
          } catch (e: any) {
            toast({ title: e?.response?.data?.error || 'Failed to update', variant: 'destructive' });
          }
        }}
        onUpdatePlayer={async (data) => {
          if (!selectedUserId) return;
          try {
            await updatePlayer.mutateAsync({ userId: selectedUserId, data });
            toast({ title: 'Player stats updated' });
            invalidate();
          } catch (e: any) {
            toast({ title: e?.response?.data?.error || 'Failed to update player', variant: 'destructive' });
          }
        }}
        isPending={updateUser.isPending || updatePlayer.isPending}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete User</DialogTitle>
            <DialogDescription className="font-serif italic">
              This action cannot be undone. All data for this user will be permanently removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteUser.isPending}>
              {deleteUser.isPending ? 'Deleting...' : 'Delete User'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function UserEditDialog({
  open, onOpenChange, userDetail, onUpdateUser, onUpdatePlayer, isPending
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userDetail: AdminUserDetail | undefined;
  onUpdateUser: (data: { username?: string; role?: string; isPro?: boolean }) => void;
  onUpdatePlayer: (data: Record<string, any>) => void;
  isPending: boolean;
}) {
  const [tab, setTab] = useState<'user' | 'player'>('user');
  const [username, setUsername] = useState('');
  const [role, setRole] = useState('user');
  const [isPro, setIsPro] = useState(false);
  const [level, setLevel] = useState('1');
  const [xp, setXp] = useState('0');
  const [gold, setGold] = useState('0');
  const [hp, setHp] = useState('100');
  const [maxHp, setMaxHp] = useState('100');
  const [strength, setStrength] = useState('10');
  const [endurance, setEndurance] = useState('10');
  const [dexterity, setDexterity] = useState('10');
  const [faith, setFaith] = useState('10');

  React.useEffect(() => {
    if (userDetail) {
      setUsername(userDetail.user.username);
      setRole(userDetail.user.role);
      setIsPro(userDetail.user.isPro);
      if (userDetail.player) {
        setLevel(String(userDetail.player.level));
        setXp(String(userDetail.player.xp));
        setGold(String(userDetail.player.gold));
        setHp(String(userDetail.player.hp));
        setMaxHp(String(userDetail.player.maxHp));
        setStrength(String(userDetail.player.strength));
        setEndurance(String(userDetail.player.endurance));
        setDexterity(String(userDetail.player.dexterity));
        setFaith(String(userDetail.player.faith));
      }
    }
  }, [userDetail]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif flex items-center gap-2">
            <Shield className="w-5 h-5" />
            Edit: {userDetail?.user.username}
          </DialogTitle>
        </DialogHeader>

        <div className="flex gap-2 mb-4">
          <Button variant={tab === 'user' ? 'default' : 'outline'} size="sm" onClick={() => setTab('user')}>User Info</Button>
          <Button variant={tab === 'player' ? 'default' : 'outline'} size="sm" onClick={() => setTab('player')}>Player Stats</Button>
        </div>

        {tab === 'user' ? (
          <div className="space-y-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Username</Label>
              <Input value={username} onChange={(e) => setUsername(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Role</Label>
              <Select value={role} onValueChange={setRole}>
                <SelectTrigger className="bg-black/50 border-border rounded-none mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">User</SelectItem>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="moderator">Moderator</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" id="isPro" checked={isPro} onChange={(e) => setIsPro(e.target.checked)} className="accent-primary" />
              <Label htmlFor="isPro" className="text-xs uppercase tracking-widest text-muted-foreground cursor-pointer">Pro User</Label>
            </div>
            <Button onClick={() => onUpdateUser({ username, role, isPro })} disabled={isPending} className="w-full font-serif uppercase tracking-wider">
              {isPending ? 'Saving...' : 'Save User'}
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <StatInput label="Level" value={level} onChange={setLevel} />
              <StatInput label="XP" value={xp} onChange={setXp} />
              <StatInput label="Gold" value={gold} onChange={setGold} />
              <StatInput label="HP" value={hp} onChange={setHp} />
              <StatInput label="Max HP" value={maxHp} onChange={setMaxHp} />
              <StatInput label="Strength" value={strength} onChange={setStrength} />
              <StatInput label="Endurance" value={endurance} onChange={setEndurance} />
              <StatInput label="Dexterity" value={dexterity} onChange={setDexterity} />
              <StatInput label="Faith" value={faith} onChange={setFaith} />
            </div>
            <Button
              onClick={() => onUpdatePlayer({
                level: parseInt(level), xp: parseInt(xp), gold: parseInt(gold),
                hp: parseInt(hp), maxHp: parseInt(maxHp),
                strength: parseInt(strength), endurance: parseInt(endurance),
                dexterity: parseInt(dexterity), faith: parseInt(faith),
              })}
              disabled={isPending}
              className="w-full font-serif uppercase tracking-wider"
            >
              {isPending ? 'Saving...' : 'Save Stats'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function StatInput({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) {
  return (
    <div>
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      <Input type="number" value={value} onChange={(e) => onChange(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
    </div>
  );
}
