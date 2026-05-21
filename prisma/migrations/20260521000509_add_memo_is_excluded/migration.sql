-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "isExcluded" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "memo" TEXT;
