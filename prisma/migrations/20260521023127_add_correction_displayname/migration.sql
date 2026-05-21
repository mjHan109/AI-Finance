-- DropForeignKey
ALTER TABLE "Transaction" DROP CONSTRAINT "Transaction_fileId_fkey";

-- AlterTable
ALTER TABLE "UserCorrection" ADD COLUMN     "displayName" TEXT;

-- AddForeignKey
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "UploadedFile"("id") ON DELETE CASCADE ON UPDATE CASCADE;
