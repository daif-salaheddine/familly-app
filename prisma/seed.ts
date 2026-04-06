import "dotenv/config";
import bcrypt from "bcryptjs";
import { PrismaClient } from "../app/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter });

const MEMBERS = [
  { name: "Salaheddine Daif", email: "salaheddine@family.com", role: "admin" as const },
  { name: "Mostafa Daif",    email: "mostafa@family.com",     role: "member" as const },
  { name: "Yasmine Daif",    email: "yasmine@family.com",     role: "member" as const },
  { name: "Ibtissam Daif",   email: "ibtissam@family.com",   role: "member" as const },
  { name: "Hiba Daif",       email: "hiba@family.com",        role: "member" as const },
  { name: "Aicha Daif",      email: "aicha@family.com",       role: "member" as const },
];

async function main() {
  console.log("Seeding...");

  const passwordHash = await bcrypt.hash("password123", 10);

  // 1. Upsert all 6 users
  const users = await Promise.all(
    MEMBERS.map(({ name, email }) =>
      prisma.user.upsert({
        where: { email },
        update: {},
        create: { name, email, password_hash: passwordHash },
      })
    )
  );
  console.log(`✓ ${users.length} users`);

  // 2. Upsert the Family group (keyed on name + created_by)
  const admin = users[0];
  const group = await prisma.group.upsert({
    where: { id: "00000000-0000-0000-0000-000000000001" },
    update: {},
    create: {
      id: "00000000-0000-0000-0000-000000000001",
      name: "Family",
      created_by: admin.id,
    },
  });
  console.log(`✓ group "${group.name}"`);

  // 3. Upsert group memberships
  await Promise.all(
    users.map((user, i) =>
      prisma.groupMember.upsert({
        where: {
          // no unique constraint on pair — use a stable synthetic id
          id: `00000000-0000-0000-0001-${String(i).padStart(12, "0")}`,
        },
        update: {},
        create: {
          id: `00000000-0000-0000-0001-${String(i).padStart(12, "0")}`,
          group_id: group.id,
          user_id: user.id,
          role: MEMBERS[i].role,
        },
      })
    )
  );
  console.log(`✓ ${users.length} group members`);

  // 4. Upsert the group pot
  await prisma.pot.upsert({
    where: { group_id: group.id },
    update: {},
    create: { group_id: group.id, total_amount: 0 },
  });
  console.log(`✓ pot`);

  console.log("\nDone. Accounts (password: password123):");
  MEMBERS.forEach(({ name, email, role }) =>
    console.log(`  ${role === "admin" ? "[admin]" : "[member]"} ${name} — ${email}`)
  );
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
