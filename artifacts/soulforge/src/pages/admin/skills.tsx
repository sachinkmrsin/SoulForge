import React, { useState } from 'react';
import { AdminLayout } from '@/components/admin-layout';
import {
  useAdminListSkills, useAdminCreateSkill, useAdminUpdateSkill, useAdminDeleteSkill,
  getAdminListSkillsQueryKey, type SkillDefinition, type SkillDefinitionInput
} from '@workspace/api-client-react';
import { Card } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { Plus, Edit, Trash2, Sparkles } from 'lucide-react';

export function AdminSkills() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [editingSkill, setEditingSkill] = useState<SkillDefinition | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: skills, isLoading } = useAdminListSkills();
  const createSkill = useAdminCreateSkill();
  const updateSkill = useAdminUpdateSkill();
  const deleteSkill = useAdminDeleteSkill();

  const invalidate = () => queryClient.invalidateQueries({ queryKey: getAdminListSkillsQueryKey() });

  const openCreate = () => { setEditingSkill(null); setDialogOpen(true); };
  const openEdit = (skill: SkillDefinition) => { setEditingSkill(skill); setDialogOpen(true); };

  const handleSave = async (data: SkillDefinitionInput) => {
    try {
      if (editingSkill) {
        await updateSkill.mutateAsync({ skillId: editingSkill.id, data });
        toast({ title: 'Skill updated' });
      } else {
        await createSkill.mutateAsync({ data });
        toast({ title: 'Skill created' });
      }
      setDialogOpen(false);
      invalidate();
    } catch (e: any) {
      toast({ title: e?.response?.data?.error || 'Failed to save skill', variant: 'destructive' });
    }
  };

  const handleDelete = async () => {
    if (!editingSkill) return;
    try {
      await deleteSkill.mutateAsync({ skillId: editingSkill.id });
      toast({ title: 'Skill deleted' });
      setDeleteDialogOpen(false);
      setEditingSkill(null);
      invalidate();
    } catch (e: any) {
      toast({ title: e?.response?.data?.error || 'Failed to delete skill', variant: 'destructive' });
    }
  };

  return (
    <AdminLayout>
      <header className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-serif uppercase tracking-wider text-foreground">Skills Management</h1>
          <p className="text-muted-foreground italic font-serif mt-1">Define the powers available to warriors</p>
        </div>
        <Button onClick={openCreate} className="font-serif uppercase tracking-wider">
          <Plus className="w-4 h-4 mr-2" /> New Skill
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
                <TableHead className="text-xs uppercase tracking-widest hidden sm:table-cell">Description</TableHead>
                <TableHead className="text-xs uppercase tracking-widest">Effect</TableHead>
                <TableHead className="text-xs uppercase tracking-widest">Level Req</TableHead>
                <TableHead className="text-xs uppercase tracking-widest text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {skills?.map((s: SkillDefinition) => (
                <TableRow key={s.id}>
                  <TableCell className="font-serif flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-yellow-400" />
                    {s.name}
                  </TableCell>
                  <TableCell className="hidden sm:table-cell text-muted-foreground text-sm max-w-xs truncate">{s.description}</TableCell>
                  <TableCell>
                    <Badge variant="outline" className="font-mono text-xs">{s.effect}</Badge>
                  </TableCell>
                  <TableCell>{s.levelRequired}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(s)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => { setEditingSkill(s); setDeleteDialogOpen(true); }}>
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

      <SkillDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        skill={editingSkill}
        onSave={handleSave}
        isPending={createSkill.isPending || updateSkill.isPending}
      />

      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-card border-border sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-serif">Delete Skill</DialogTitle>
            <DialogDescription className="font-serif italic">
              Are you sure you want to delete "{editingSkill?.name}"? This cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
            <Button variant="destructive" onClick={handleDelete} disabled={deleteSkill.isPending}>
              {deleteSkill.isPending ? 'Deleting...' : 'Delete Skill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </AdminLayout>
  );
}

function SkillDialog({ open, onOpenChange, skill, onSave, isPending }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  skill: SkillDefinition | null;
  onSave: (data: SkillDefinitionInput) => void;
  isPending: boolean;
}) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [effect, setEffect] = useState('');
  const [levelRequired, setLevelRequired] = useState('1');

  React.useEffect(() => {
    if (skill) {
      setName(skill.name);
      setDescription(skill.description);
      setEffect(skill.effect);
      setLevelRequired(String(skill.levelRequired));
    } else {
      setName(''); setDescription(''); setEffect(''); setLevelRequired('1');
    }
  }, [skill, open]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-card border-border sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="font-serif">{skill ? 'Edit Skill' : 'Create Skill'}</DialogTitle>
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
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Effect</Label>
            <Input value={effect} onChange={(e) => setEffect(e.target.value)} placeholder="e.g. boss_damage_+10%" className="bg-black/50 border-border rounded-none mt-1 font-mono" />
          </div>
          <div>
            <Label className="text-xs uppercase tracking-widest text-muted-foreground">Level Required</Label>
            <Input type="number" value={levelRequired} onChange={(e) => setLevelRequired(e.target.value)} className="bg-black/50 border-border rounded-none mt-1" />
          </div>
          <Button
            onClick={() => onSave({ name, description, effect, levelRequired: parseInt(levelRequired) })}
            disabled={isPending || !name}
            className="w-full font-serif uppercase tracking-wider"
          >
            {isPending ? 'Saving...' : skill ? 'Update Skill' : 'Create Skill'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
