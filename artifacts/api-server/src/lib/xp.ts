import { db, players, inventoryItems, activityLog, bossBattles } from "@workspace/db";
import { eq, and, isNull } from "drizzle-orm";

export function xpForLevel(level: number): number {
  return Math.floor(100 * Math.pow(level, 1.5));
}

const LOOT_POOL = [
  { name: "Hollow Shard", description: "A fragment of a felled enemy's soul.", rarity: "common", type: "trophy" },
  { name: "Ember Stone", description: "Still warm from battle.", rarity: "uncommon", type: "consumable" },
  { name: "Tarnished Ring", description: "Its inscription has long faded.", rarity: "uncommon", type: "accessory" },
  { name: "Knight's Sigil", description: "Proof of a worthy challenger.", rarity: "rare", type: "trophy" },
  { name: "Soul Vessel", description: "Contains the echoes of a great victory.", rarity: "rare", type: "consumable" },
  { name: "Ashen Blade", description: "Forged from the ashes of a defeated champion.", rarity: "epic", type: "weapon" },
  { name: "Undying Vow", description: "A covenant with something ancient and powerful.", rarity: "epic", type: "accessory" },
  { name: "Legendary Soul", description: "The compressed will of a true champion.", rarity: "legendary", type: "trophy" },
];

export function rollLoot(count: number = 1): Array<{ name: string; description: string; rarity: string; type: string }> {
  const results = [];
  for (let i = 0; i < count; i++) {
    const roll = Math.random();
    let pool: typeof LOOT_POOL;
    if (roll < 0.005) pool = LOOT_POOL.filter(l => l.rarity === "legendary");
    else if (roll < 0.03) pool = LOOT_POOL.filter(l => l.rarity === "epic");
    else if (roll < 0.12) pool = LOOT_POOL.filter(l => l.rarity === "rare");
    else if (roll < 0.35) pool = LOOT_POOL.filter(l => l.rarity === "uncommon");
    else pool = LOOT_POOL.filter(l => l.rarity === "common");
    results.push(pool[Math.floor(Math.random() * pool.length)]);
  }
  return results;
}

export async function awardXP(
  userId: string,
  xpGained: number,
  description: string,
  activityType: string,
  withLoot: boolean = false,
  bossDamage: number = 0
): Promise<{
  player: typeof players.$inferSelect;
  leveledUp: boolean;
  loot: typeof inventoryItems.$inferSelect[];
  bossHpReduced: number | null;
}> {
  const [player] = await db.select().from(players).where(eq(players.userId, userId));
  if (!player) throw new Error("Player not found");

  let newXp = player.xp + xpGained;
  let newLevel = player.level;
  let leveledUp = false;
  let newMaxHp = player.maxHp;
  let newStrength = player.strength;
  let newEndurance = player.endurance;
  let newDexterity = player.dexterity;
  let newFaith = player.faith;
  let newGold = player.gold;

  while (newXp >= xpForLevel(newLevel)) {
    newXp -= xpForLevel(newLevel);
    newLevel++;
    leveledUp = true;
    newMaxHp += 10;
    newStrength += 1;
    newEndurance += 1;
    newDexterity += 1;
    newFaith += 1;
    newGold += 50;
  }

  const [updatedPlayer] = await db
    .update(players)
    .set({
      xp: newXp,
      level: newLevel,
      hp: Math.min(player.hp + (leveledUp ? 10 : 0), newMaxHp),
      maxHp: newMaxHp,
      strength: newStrength,
      endurance: newEndurance,
      dexterity: newDexterity,
      faith: newFaith,
      gold: newGold,
    })
    .where(eq(players.userId, userId))
    .returning();

  await db.insert(activityLog).values({ userId, type: activityType, description, xpGained });

  const loot: typeof inventoryItems.$inferSelect[] = [];
  if (withLoot) {
    const lootItems = rollLoot(1);
    for (const item of lootItems) {
      const [inserted] = await db
        .insert(inventoryItems)
        .values({ userId, name: item.name, description: item.description, rarity: item.rarity, type: item.type })
        .returning();
      loot.push(inserted);
    }
  }

  // Apply boss damage
  let bossHpReduced: number | null = null;
  if (bossDamage > 0) {
    const [activeBattle] = await db
      .select()
      .from(bossBattles)
      .where(and(eq(bossBattles.userId, userId), isNull(bossBattles.defeatedAt)));
    if (activeBattle) {
      const newHp = Math.max(0, activeBattle.currentHp - bossDamage);
      bossHpReduced = bossDamage;
      await db.update(bossBattles).set({ currentHp: newHp }).where(eq(bossBattles.id, activeBattle.id));
    }
  }

  return { player: updatedPlayer, leveledUp, loot, bossHpReduced };
}
