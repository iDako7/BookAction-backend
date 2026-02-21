-- CreateEnum
CREATE TYPE "LearningStyle" AS ENUM ('VISUAL', 'VERBAL', 'SCENARIO');

-- CreateTable
CREATE TABLE "User_learning_profile" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "primary_style" "LearningStyle" NOT NULL,
    "style_scores" JSONB NOT NULL,
    "quiz_responses" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_learning_profile_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AI_practice_cache" (
    "id" SERIAL NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "learning_style" "LearningStyle" NOT NULL,
    "generated_content" JSONB NOT NULL,
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "AI_practice_cache_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_learning_profile_user_id_key" ON "User_learning_profile"("user_id");

-- CreateIndex
CREATE UNIQUE INDEX "AI_practice_cache_concept_id_learning_style_key" ON "AI_practice_cache"("concept_id", "learning_style");

-- AddForeignKey
ALTER TABLE "User_learning_profile" ADD CONSTRAINT "User_learning_profile_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
