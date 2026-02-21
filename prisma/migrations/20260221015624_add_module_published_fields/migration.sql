-- AlterTable
ALTER TABLE "Module" ADD COLUMN     "created_by" INTEGER,
ADD COLUMN     "is_published" BOOLEAN NOT NULL DEFAULT true;
