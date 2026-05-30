import { execSync } from "child_process";

const username = process.argv[2];
if (!username) {
  console.error("Usage: tsx scripts/promote-admin.ts <username>");
  process.exit(1);
}

try {
  execSync(`psql "$DATABASE_URL" -c "UPDATE users SET role = 'admin' WHERE username = '${username}';"`, { stdio: "inherit" });
  console.log(`User "${username}" promoted to admin.`);
} catch {
  process.exit(1);
}
