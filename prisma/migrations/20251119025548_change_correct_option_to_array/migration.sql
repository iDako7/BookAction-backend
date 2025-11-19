/*
  Warnings:

  - The `correct_option_index` column on the `Quiz` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "Quiz" DROP COLUMN "correct_option_index",
ADD COLUMN     "correct_option_index" INTEGER[];
