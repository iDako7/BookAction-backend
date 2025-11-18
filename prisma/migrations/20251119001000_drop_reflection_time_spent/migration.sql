-- Drop the unused time_spent column to align the database with the Prisma schema
ALTER TABLE "Reflection" DROP COLUMN IF EXISTS "time_spent";
