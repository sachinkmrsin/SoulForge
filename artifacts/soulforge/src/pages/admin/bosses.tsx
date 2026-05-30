import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import {
  useAdminListBosses, useAdminCreateBoss, useAdminUpdateBoss, useAdminDeleteBoss,
  getAdminListBossesQueryKey, type Boss, type AdminBossInput
} from '@workspace/api-client-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Skull } from 'lucide-react';

const DIFFICULTIES = ['easy', 'medium', 'hard', 'legendary'];
const DIFFICULTY_COLORS: Record<string, string> = {
  easy: 'text-green-400 border-green-400/30',
  medium: 'text-yellow-400 border-yellow-400/30',
  hard: 'text-orange-400 border-orange-400/30',
  legendary: 'text-purple-400 border-purple-400/30',
};

export function AdminBosses() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingBoss, setEditingBoss] = useState<Boss | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: bosses, isLoading } = useAdminListBosses();
  const createBoss = useAdminCreateBoss();
  const updateBoss = useAdminUpdateBoss();
  const deleteBoss = useAdminDeleteBoss();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getAdminListBossesQueryKey() });

  const openCreate = () => { setEditingBoss(null); setDialogOpen(true); };
  const openEdit = (boss: Boss) => { setEditingBoss(boss); setDialogOpen(true); };

  const handleSave = async (data: AdminBossInput) => {
    try {
      if (editingBoss) {
        await updateBoss.mutateAsync({ bossId: editingBoss.id, data });
        toast({ title: 'Boss updated' });
      } else {
        await createBoss.mutateAsync({ data });
        toast({ title: 'Boss created' });
      }
      setDialogOpen(false);
      invalidate();
    } catch (e: any) {
      toast({ title: e?.response?.data?.error || 'Failed to save boss', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!editingBoss) return;
    try {
      await deleteBoss.mutateAsync({ bossId: editingBoss.id });
      toast({ title: 'Boss deleted' });
      setDeleteDialogOpen(false);
      setEditingBoss(null);
      invalidate();
    } catch (e: any) {
      toast({ title: e?.response?.data?.error || 'Failed to delete boss', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif uppercase tracking-wider text-foreground">Boss Management</h1>
          <p className="text-muted-foreground italic font-serif mt-1">Forge and vanquish the realm's adversaries</p>
        </div>
        <Button onClick={openCreate} className="font-serif uppercase tracking-wider">
          <Plus className="w-4 h-4 mr-2" /> New Boss
        </Button>
      </header>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <Skeleton key={i} className="h-12" />)}
        </div>
      ) : (
        <Card className="bg-card border-border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="text-xs uppercase tracking-widest">Name</TableHead>
                <TableHead className="text-xs uppercase tracking-widest">Difficulty</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden sm:table-cell">Max HP</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden sm:table-cell">XP Reward</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden md:table-cell">Gold</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {bosses?.map((b: Boss) => (
                <TableRow key={b.id}>
                  <TableCell className="font-serif flex items-center gap-2">
                    <Skull className="w-4 h-4 text-muted-foreground" />
                    {b.name}
                    {b.isCustom && <Badge variant="outline" className="text-[10px]">Custom</Badge>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={DIFFICULTY_COLORS[b.difficulty] || ''}>{b.difficulty}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{b.maxHp}</TableCell>
                  <TableCell className="hidden sm:table-cell">{b.xpReward}</TableCell>
                  <TableCell className="hidden md:table-cell">{b.goldReward}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(b)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setEditingBoss(b); setDeleteDialogOpen(true); }}>
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </Card>
      )}

      <BossDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        boss={editingBoss}
        onSave={handleSave}
        isPending={createBoss.isPending || updateBoss.isPending}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Boss</DialogTitle>
            <DialogDescription className="font-serif italic">
              Are you sure you want to delete "{editingBoss?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteBoss.isPending}>
              {deleteBoss.isPending ? 'Deleting...' : 'Delete Boss'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function BossDialog({ open, onOpenChange, boss, onSave, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  boss: Boss | null;
  onSave: (data: AdminBossInput) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [difficulty, setDifficulty] = useState('medium');
  const [maxHp, setMaxHp] = useState('1000');
  const [xpReward, setXpReward] = useState('500');
  const [goldReward, setGoldReward] = useState('100');
  const [lootTable, setLootTable] = useState('');
  const [imageUrl, setImageUrl] = useState('');

  React.useEffect(() => {
    if (boss) {
      setName(boss.name);
      setDescription(boss.description);
      setDifficulty(boss.difficulty);
      setMaxHp(String(boss.maxHp));
      setXpReward(String(boss.xpReward));
      setGoldReward(String(boss.goldReward));
      setLootTable(Array.isArray(boss.lootTable) ? boss.lootTable.join(', ') : '');
      setImageUrl(boss.imageUrl || '');
    } else {
      setName(''); setDescription(''); setDifficulty('medium');
      setMaxHp('1000'); setXpReward('500'); setGoldReward('100');
      setLootTable(''); setImageUrl('');
    }
  }, [boss, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg max-h-[85vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">{boss ? 'Edit Boss' : 'Create Boss'}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
            <Textarea value={description} onChange={(e) => setDescription(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" rows={3} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Difficulty</Label>
              <Select value={difficulty} onValueChange={setDifficulty}>
                <SelectTrigger className="bg-black/50 border-border rounded-none mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {DIFFICULTIES.map(d => <SelectItem key={d} value={d}>{d}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Max HP</Label>
              <Input type="number" value={maxHp} onChange={(e) => setMaxHp(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">XP Reward</Label>
              <Input type="number" value={xpReward} onChange={(e) => setXpReward(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Gold Reward</Label>
              <Input type="number" value={goldReward} onChange={(e) => setGoldReward(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
            </div>
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Loot Table (comma-separated)</Label>
            <Input value={lootTable} onChange={(e) => setLootTable(e.target.value)} placeholder="item1, item2, item3" className="bg-black/50 border-border rounded-none mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Image URL</Label>
            <Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
          </div>
          <Button
            onClick={() => onSave({
              name,
              description,
              difficulty: difficulty as AdminBossInput['difficulty'],
              maxHp: parseInt(maxHp),
              xpReward: parseInt(xpReward),
              goldReward: parseInt(goldReward),
              lootTable: lootTable ? lootTable.split(',').map(s => s.trim()).filter(Boolean) : [],
              imageUrl: imageUrl || null,
            })}
            disabled={isPending || !name}
            className="w-full font-serif uppercase tracking-wider"
          >
            {isPending ? 'Saving...' : boss ? 'Update Boss' : 'Create Boss'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
