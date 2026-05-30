import React from 'react';
import { useListInventory, useDiscardItem, InventoryItemType, InventoryItemRarity } from '@workspace/api-client-react';
import { MainLayout } from '@/components/layout';
import { Backpack, Sword, Shield, Gem, FlaskConical, Trophy, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useQueryClient } from '@tanstack/react-query';
import { getListInventoryQueryKey } from '@workspace/api-client-react';
import { motion, AnimatePresence } from 'framer-motion';

const RarityGlow = {
  common: 'border-muted-foreground/30 hover:border-muted-foreground shadow-[inset_0_0_10px_rgba(255,255,255,0.05)]',
  uncommon: 'border-green-500/30 hover:border-green-500 shadow-[inset_0_0_10px_rgba(34,197,94,0.1)]',
  rare: 'border-blue-500/30 hover:border-blue-500 shadow-[inset_0_0_15px_rgba(59,130,246,0.15)] text-blue-400',
  epic: 'border-purple-500/40 hover:border-purple-500 shadow-[inset_0_0_20px_rgba(168,85,247,0.2)] text-purple-400',
  legendary: 'border-amber-500/50 hover:border-amber-500 shadow-[inset_0_0_30px_rgba(245,158,11,0.3)] text-amber-500',
};

const RarityColors = {
  common: 'text-muted-foreground',
  uncommon: 'text-green-500',
  rare: 'text-blue-500',
  epic: 'text-purple-500',
  legendary: 'text-amber-500',
};

const TypeIcons: Record<string, React.ElementType> = {
  weapon: Sword,
  armor: Shield,
  accessory: Gem,
  consumable: FlaskConical,
  trophy: Trophy,
};

export function Inventory() {
  const { data: inventory = [], isLoading } = useListInventory();
  const discardItem = useDiscardItem();
  const queryClient = useQueryClient();

  const handleDiscard = async (id: string) => {
    await discardItem.mutateAsync({ itemId: id });
    queryClient.invalidateQueries({ queryKey: getListInventoryQueryKey() });
  };

  const stats = {
    total: inventory.length,
    legendary: inventory.filter(i => i.rarity === 'legendary').length,
    epic: inventory.filter(i => i.rarity === 'epic').length,
    weapons: inventory.filter(i => i.type === 'weapon').length,
    armor: inventory.filter(i => i.type === 'armor').length,
  };

  return (
    <MainLayout>
      <div className="space-y-8">
        <header className="mb-8 border-b border-border/50 pb-4">
          <h1 className="text-4xl font-serif tracking-wider uppercase mb-2 text-primary/90">Inventory</h1>
          <p className="text-muted-foreground font-serif italic">Spoils of your victories.</p>
        </header>

        {isLoading ? (
          <div className="flex items-center justify-center min-h-[30vh]">
            <Backpack className="w-8 h-8 text-muted-foreground animate-pulse" />
          </div>
        ) : (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-card border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-serif mb-1">Total Items</p>
                <p className="text-2xl font-serif">{stats.total}</p>
              </div>
              <div className="bg-card border border-amber-500/20 p-4 text-center">
                <p className="text-xs text-amber-500/80 uppercase tracking-widest font-serif mb-1">Legendary</p>
                <p className="text-2xl font-serif text-amber-500">{stats.legendary}</p>
              </div>
              <div className="bg-card border border-purple-500/20 p-4 text-center">
                <p className="text-xs text-purple-500/80 uppercase tracking-widest font-serif mb-1">Epic</p>
                <p className="text-2xl font-serif text-purple-500">{stats.epic}</p>
              </div>
              <div className="bg-card border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-serif mb-1">Weapons</p>
                <p className="text-2xl font-serif">{stats.weapons}</p>
              </div>
              <div className="bg-card border border-border p-4 text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-widest font-serif mb-1">Armor</p>
                <p className="text-2xl font-serif">{stats.armor}</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              <AnimatePresence>
                {inventory.map((item) => {
                  const Icon = TypeIcons[item.type] || Gem;
                  return (
                    <motion.div
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.9 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.9 }}
                      className={`bg-card border p-4 relative group transition-all duration-300 ${RarityGlow[item.rarity]}`}
                    >
                      <div className="flex justify-between items-start mb-4">
                        <Icon className={`w-8 h-8 ${RarityColors[item.rarity]}`} />
                        <span className={`text-[10px] uppercase tracking-widest font-serif px-2 py-1 border bg-black/50 ${RarityColors[item.rarity]} border-current opacity-70`}>
                          {item.rarity}
                        </span>
                      </div>
                      
                      <h3 className={`text-lg font-serif mb-2 leading-tight ${item.rarity === 'legendary' || item.rarity === 'epic' ? RarityColors[item.rarity] : 'text-foreground'}`}>
                        {item.name}
                      </h3>
                      
                      <p className="text-xs text-muted-foreground italic font-serif mb-6 line-clamp-2">
                        {item.description}
                      </p>

                      <div className="flex items-center justify-between mt-auto">
                        <span className="text-[10px] uppercase tracking-widest font-serif text-muted-foreground">
                          {item.type}
                        </span>
                        
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => handleDiscard(item.id)}
                          className="opacity-0 group-hover:opacity-100 hover:text-destructive hover:bg-destructive/10 transition-all h-8 w-8 rounded-none"
                          title="Discard Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              {inventory.length === 0 && (
                <div className="col-span-full text-center py-12 text-muted-foreground font-serif italic border border-dashed border-border">
                  Your bags are empty. Claim victory to earn spoils.
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </MainLayout>
  );
}
