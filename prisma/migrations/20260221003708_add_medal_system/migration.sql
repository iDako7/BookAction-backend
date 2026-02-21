-- CreateEnum
CREATE TYPE "MedalTier" AS ENUM ('NONE', 'BRONZE', 'SILVER', 'GOLD');

-- CreateTable
CREATE TABLE "User_concept_medal" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "tier" "MedalTier" NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_concept_medal_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_module_medal" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "module_id" INTEGER NOT NULL,
    "tier" "MedalTier" NOT NULL,
    "accuracy" DOUBLE PRECISION NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_module_medal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "User_concept_medal_user_id_idx" ON "User_concept_medal"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_concept_medal_user_id_concept_id_key" ON "User_concept_medal"("user_id", "concept_id");

-- CreateIndex
CREATE INDEX "User_module_medal_user_id_idx" ON "User_module_medal"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_module_medal_user_id_module_id_key" ON "User_module_medal"("user_id", "module_id");

-- AddForeignKey
ALTER TABLE "User_concept_medal" ADD CONSTRAINT "User_concept_medal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_concept_medal" ADD CONSTRAINT "User_concept_medal_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_module_medal" ADD CONSTRAINT "User_module_medal_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_module_medal" ADD CONSTRAINT "User_module_medal_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;
