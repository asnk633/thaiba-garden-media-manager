import { db } from "@/db";
import { users } from "@/db/schema";

async function main() {
  await db.insert(users).values({
    email: "admin@thaiba.com",
    fullName: "Admin User",
    role: "admin",
  });
  console.log("✅ Seed data inserted");
  process.exit(0);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
