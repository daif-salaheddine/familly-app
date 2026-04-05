import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const EMAILS = [
  "salaheddine@family.com",
  "karim@family.com",
  "amina@family.com",
  "yasmine@family.com",
  "omar@family.com",
  "nadia@family.com",
];

async function main() {
  // 1. Generate hash
  const hash = await bcrypt.hash("password123", 10);
  console.log("Generated hash:", hash);

  // 2. Verify hash immediately
  const valid = await bcrypt.compare("password123", hash);
  console.log("bcrypt.compare check:", valid);
  if (!valid) throw new Error("Hash verification failed — aborting.");

  // 3. Update all 6 users
  const result = await prisma.user.updateMany({
    where: { email: { in: EMAILS } },
    data: { password_hash: hash },
  });
  console.log(`Updated ${result.count} users`);

  // 4. Confirm by reading back
  const users = await prisma.user.findMany({
    where: { email: { in: EMAILS } },
    select: { email: true, password_hash: true },
  });

  for (const u of users) {
    const ok = await bcrypt.compare("password123", u.password_hash);
    console.log(`${u.email} → compare: ${ok}`);
  }
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
