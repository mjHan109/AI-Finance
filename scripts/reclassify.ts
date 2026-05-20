import { config } from "dotenv";
config({ path: ".env.local" });

import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { classifyByKeywords, mapBanksaladCategory } from "../src/modules/categories/rules";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL! });
const prisma = new PrismaClient({ adapter } as ConstructorParameters<typeof PrismaClient>[0]);

async function main() {
  const [transactions, categories] = await Promise.all([
    prisma.transaction.findMany({
      where: { isIncome: false },
      select: { id: true, description: true, aiCategory: true },
    }),
    prisma.category.findMany({ select: { id: true, name: true } }),
  ]);

  const catMap = new Map(categories.map((c) => [c.name, c.id]));
  let updated = 0;

  for (const tx of transactions) {
    let categoryId: string | null = null;
    if (tx.aiCategory) {
      const mapped = mapBanksaladCategory(tx.aiCategory);
      if (mapped) categoryId = catMap.get(mapped) ?? null;
    }
    if (!categoryId) {
      const rule = classifyByKeywords(tx.description);
      categoryId = catMap.get(rule.name) ?? catMap.get("기타") ?? null;
    }
    await prisma.transaction.update({ where: { id: tx.id }, data: { categoryId } });
    updated++;
  }
  console.log(`✓ ${updated}건 재분류 완료`);
}

main().catch(console.error).finally(() => prisma.$disconnect());
