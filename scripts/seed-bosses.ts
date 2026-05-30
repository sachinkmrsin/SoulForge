import { execSync } from "child_process";

const BOSSES = [
  ["The Hollow King", "A forgotten ruler whose crown still burns with ambition.", "easy", 500, 200, 40, '["Hollow Shard", "Tarnished Ring"]'],
  ["Ember Wraith", "Born from the ashes of a thousand failed quests.", "easy", 750, 300, 60, '["Ember Stone", "Knights Sigil"]'],
  ["The Ashen Champion", "A warrior who never learned to rest.", "medium", 1000, 500, 100, '["Ashen Blade", "Soul Vessel"]'],
  ["Void Sentinel", "Guardian of the threshold between effort and mastery.", "medium", 1500, 750, 150, '["Undying Vow", "Knights Sigil"]'],
  ["The Procrastination Hydra", "Cut one distraction, two more take its place.", "hard", 2000, 1000, 200, '["Ashen Blade", "Undying Vow"]'],
  ["Soul Devourer", "Feeds on abandoned goals and broken promises.", "hard", 3000, 1500, 300, '["Legendary Soul", "Soul Vessel"]'],
  ["The Eternal Deadline", "Time itself bends to its will.", "legendary", 5000, 2500, 500, '["Legendary Soul", "Ashen Blade", "Undying Vow"]'],
  ["Abyssal Overlord", "The final test of all who dare to persist.", "legendary", 8000, 4000, 800, '["Legendary Soul", "Legendary Soul"]'],
];

const values = BOSSES.map(([name, desc, difficulty, maxHp, xpReward, goldReward, lootTable]) =>
  `('${name}', '${desc}', '${difficulty}', ${maxHp}, ${xpReward}, ${goldReward}, '${lootTable}', false)`
).join(",\n");

const sql = `INSERT INTO bosses (name, description, difficulty, max_hp, xp_reward, gold_reward, loot_table, is_custom) VALUES\n${values}\nON CONFLICT DO NOTHING;`;

try {
  execSync(`psql "$DATABASE_URL" -c "${sql.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
  console.log("Bosses seeded.");
} catch {
  process.exit(1);
}
