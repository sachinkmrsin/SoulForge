import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import {
  useAdminListItems, useAdminCreateItem, useAdminDeleteItem,
  getAdminListItemsQueryKey, type AdminItemEntry, type AdminItemInput
} from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
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
import { Plus, Trash2, Package } from 'lucide-react';

const RARITIES = ['common', 'uncommon', 'rare', 'epic', 'legendary'];
const RARITY_COLORS: Record<string, string> = {
  common: 'text-gray-400 border-gray-400/30',
  uncommon: 'text-green-400 border-green-400/30',
  rare: 'text-blue-400 border-blue-400/30',
  epic: 'text-purple-400 border-purple-400/30',
  legendary: 'text-yellow-400 border-yellow-400/30',
};
const TYPES = ['weapon', 'armor', 'accessory', 'consumable', 'trophy'];

export function AdminItems() {
  const [page, setPage] = useState(1);
  const [rarityFilter, setRarityFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingItem, setDeletingItem] = useState<AdminItemEntry | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data, isLoading } = useAdminListItems({
    rarity: rarityFilter !== 'all' ? rarityFilter : undefined,
    type: typeFilter !== 'all' ? typeFilter : undefined,
    page,
    limit: 20,
  });

  const createItem = useAdminCreateItem();
  const deleteItem = useAdminDeleteItem();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getAdminListItemsQueryKey() });

  const handleDelete = async () => {
    if (!deletingItem) return;
    try {
      await deleteItem.mutateAsync({ itemId: deletingItem.id });
      toast({ title: 'Item deleted' });
      setDeleteDialogOpen(false);
      setDeletingItem(null);
      invalidate();
    } catch (e: any) {
      toast({ title: e?.response?.data?.error || 'Failed to delete item', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif uppercase tracking-wider text-foreground">Item Management</h1>
          <p className="text-muted-foreground italic font-serif mt-1">Bestow and reclaim artifacts of power</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="font-serif uppercase tracking-wider">
          <Plus className="w-4 h-4 mr-2" /> Grant Item
        </Button>
      </header>

      <Card className="bg-card border-border mb-6">
        <div className="p-4 flex flex-col sm:flex-row gap-4">
          <Select value={rarityFilter} onValueChange={(v) => { setRarityFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-black/50 border-border rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Rarities</SelectItem>
              {RARITIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={typeFilter} onValueChange={(v) => { setTypeFilter(v); setPage(1); }}>
            <SelectTrigger className="w-40 bg-black/50 border-border rounded-none"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
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
                <TableHead className="text-xs uppercase tracking-widest">Item</TableHead>
                <TableHead className="text-xs uppercase tracking-widest">Owner</TableHead>
                <TableHead className="text-xs uppercase tracking-widest">Rarity</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden sm:table-cell">Type</TableHead>
                <TableHead className="text-xs uppercase tracking-widest hidden md:table-cell">Obtained</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {data?.items?.map((item: AdminItemEntry) => (
                <TableRow key={item.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Package className="w-4 h-4 text-muted-foreground" />
                      <div>
                        <span className="font-serif">{item.name}</span>
                        {item.description && <p className="text-xs text-muted-foreground truncate max-w-xs">{item.description}</p>}
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-serif">{item.username}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className={RARITY_COLORS[item.rarity] || ''}>{item.rarity}</Badge>
                  </TableCell>
                  <TableCell className="hidden sm:table-cell">{item.type}</TableCell>
                  <TableCell className="hidden md:table-cell text-muted-foreground text-sm">{new Date(item.obtainedAt).toLocaleDateString()}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setDeletingItem(item); setDeleteDialogOpen(true); }}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
          {data?.pagination && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between p-4 border-t border-border">
              <p className="text-sm text-muted-foreground">
                Page {data.pagination.page} of {data.pagination.totalPages} ({data.pagination.total} items)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>Prev</Button>
                <Button variant="outline" size="sm" disabled={page >= data.pagination.totalPages} onClick={() => setPage(p => p + 1)}>Next</Button>
              </div>
            </div>
          )}
        </Card>
      )}

      <CreateItemDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={async (data) => {
          try {
            await createItem.mutateAsync({ data });
            toast({ title: 'Item granted' });
            setCreateDialogOpen(false);
            invalidate();
          } catch (e: any) {
            toast({ title: e?.response?.data?.error || 'Failed to create item', variant: 'destructive' });
          }
        }}
        isPending={createItem.isPending}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Item</DialogTitle>
            <DialogDescription className="font-serif italic">
              Are you sure you want to delete "{deletingItem?.name}" from {deletingItem?.username}?
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteItem.isPending}>
              {deleteItem.isPending ? 'Deleting...' : 'Delete Item'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function CreateItemDialog({ open, onOpenChange, onCreate, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: AdminItemInput) => void;
  isPending: boolean;
}) {
  const [userId, setUserId] = useState('');
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [rarity, setRarity] = useState('common');
  const [type, setType] = useState('trophy');

  const reset = () => { setUserId(''); setName(''); setDescription(''); setRarity('common'); setType('trophy'); };

  return (
    <Dialog open={open} onOpenChange={(v) => { if (!v) reset(); onOpenChange(v); }}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">Grant Item to User</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">User ID</Label>
            <Input type="text" value={userId} onChange={(e) => setUserId(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" placeholder="Enter user ID" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Item Name</Label>
            <Input value={name} onChange={(e) => setName(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Description</Label>
            <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Rarity</Label>
              <Select value={rarity} onValueChange={setRarity}>
                <SelectTrigger className="bg-black/50 border-border rounded-none mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {RARITIES.map(r => <SelectItem key={r} value={r}>{r}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-xs uppercase tracking-widest text-muted-foreground">Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger className="bg-black/50 border-border rounded-none mt-1"><SelectValue /></SelectTrigger>
                <SelectContent>
                  {TYPES.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button
            onClick={() => onCreate({ userId, name, description, rarity: rarity as any, type: type as any })}
            disabled={isPending || !userId || !name}
            className="w-full font-serif uppercase tracking-wider"
          >
            {isPending ? 'Granting...' : 'Grant Item'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
