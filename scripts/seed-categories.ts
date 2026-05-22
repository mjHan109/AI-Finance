import { config } from "dotenv";
config({ path: ".env.local" });
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { CATEGORY_RULES } from "../src/modules/categories/rules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  for (const rule of CATEGORY_RULES) {
    await prisma.category.upsert({
      where: { name: rule.name },
      update: { icon: rule.icon, color: rule.color, flowType: rule.flowType },
      create: { name: rule.name, icon: rule.icon, color: rule.color, isSystem: true, flowType: rule.flowType },
    });
    console.log(`✓ ${rule.icon} ${rule.name} [${rule.flowType}]`);
  }
  console.log("\n카테고리 시드 완료!");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
