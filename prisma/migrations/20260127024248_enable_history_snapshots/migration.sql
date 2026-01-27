/*
  Warnings:

  - Made the column `email` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "study_records" DROP CONSTRAINT "study_records_card_id_fkey";

-- AlterTable
ALTER TABLE "study_records" ADD COLUMN     "answer" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "question" TEXT NOT NULL DEFAULT '',
ALTER COLUMN "card_id" DROP NOT NULL;

-- AlterTable
ALTER TABLE "users" ALTER COLUMN "email" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "study_records" ADD CONSTRAINT "study_records_card_id_fkey" FOREIGN KEY ("card_id") REFERENCES "cards"("id") ON DELETE SET NULL ON UPDATE CASCADE;
