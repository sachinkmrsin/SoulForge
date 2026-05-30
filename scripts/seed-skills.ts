import { execSync } from "child_process";

const SKILLS = [
  ["Soul Link", "Your completed tasks deal 10% more damage to bosses.", "boss_damage_+10%", 1],
  ["Iron Will", "Habit streaks now give double XP bonus.", "streak_xp_x2", 3],
  ["Ember Ward", "Once per day, gain 20% more XP from any action.", "xp_boost_daily", 5],
  ["Cursed Focus", "Legendary goals award 50% more XP.", "legendary_xp_+50%", 8],
  ["Undead Resolve", "Never lose your habit streak on missed days.", "streak_preserve", 10],
  ["Dark Covenant", "All boss loot has improved rarity.", "loot_rarity_up", 12],
  ["Estus Surge", "Complete 5 habits in a day to gain a full HP restore.", "hp_restore_5habits", 15],
  ["Soul Ascension", "Gain a free daily challenge every week.", "free_challenge_weekly", 20],
];

const values = SKILLS.map(([name, desc, effect, level]) =>
  `('${name}', '${desc}', '${effect}', ${level})`
).join(",\n");

const sql = `INSERT INTO skill_definitions (name, description, effect, level_required) VALUES\n${values}\nON CONFLICT DO NOTHING;`;

try {
  execSync(`psql "$DATABASE_URL" -c "${sql.replace(/"/g, '\\"')}"`, { stdio: "inherit" });
  console.log("Skills seeded.");
} catch {
  process.exit(1);
}
