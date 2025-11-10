-- CreateTable
CREATE TABLE "Module" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Theme" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "context" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "media_type" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Theme_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Concept" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "definition" TEXT NOT NULL,
    "why_it_works" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Concept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Reflection" (
    "id" SERIAL NOT NULL,
    "module_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "time_spent" INTEGER NOT NULL,
    "module_summary" TEXT NOT NULL,
    "module_summary_media_url" TEXT NOT NULL,
    "learning_advice" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Reflection_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Tutorial" (
    "id" SERIAL NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "good_story" TEXT NOT NULL,
    "good_media_url" TEXT NOT NULL,
    "bad_story" TEXT NOT NULL,
    "bad_media_url" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Tutorial_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quiz" (
    "id" SERIAL NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "question_type" TEXT NOT NULL,
    "media_url" TEXT NOT NULL,
    "options" JSONB NOT NULL,
    "correct_answer" TEXT NOT NULL,
    "explanation" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Summary" (
    "id" SERIAL NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "summary_content" TEXT NOT NULL,
    "next_chapter_intro" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Summary_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_concept_progress" (
    "id" SERIAL NOT NULL,
    "concept_id" INTEGER NOT NULL,
    "user_id" INTEGER NOT NULL,
    "order_index" INTEGER NOT NULL,
    "completed" BOOLEAN NOT NULL,
    "time_spent" INTEGER NOT NULL,
    "completed_at" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "User_concept_progress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User_response" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER,
    "reflection_id" INTEGER,
    "user_id" INTEGER NOT NULL,
    "response_type" TEXT NOT NULL,
    "answer" JSONB NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "response_text" TEXT,
    "is_correct" BOOLEAN,
    "time_spent" INTEGER,

    CONSTRAINT "User_response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Theme_module_id_key" ON "Theme"("module_id");

-- CreateIndex
CREATE UNIQUE INDEX "Tutorial_concept_id_key" ON "Tutorial"("concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "Summary_concept_id_key" ON "Summary"("concept_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_concept_progress_concept_id_user_id_key" ON "User_concept_progress"("concept_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_response_quiz_id_user_id_key" ON "User_response"("quiz_id", "user_id");

-- CreateIndex
CREATE UNIQUE INDEX "User_response_reflection_id_user_id_key" ON "User_response"("reflection_id", "user_id");

-- AddForeignKey
ALTER TABLE "Theme" ADD CONSTRAINT "Theme_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Concept" ADD CONSTRAINT "Concept_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Reflection" ADD CONSTRAINT "Reflection_module_id_fkey" FOREIGN KEY ("module_id") REFERENCES "Module"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Tutorial" ADD CONSTRAINT "Tutorial_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quiz" ADD CONSTRAINT "Quiz_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Summary" ADD CONSTRAINT "Summary_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_concept_progress" ADD CONSTRAINT "User_concept_progress_concept_id_fkey" FOREIGN KEY ("concept_id") REFERENCES "Concept"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_response" ADD CONSTRAINT "User_response_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "Quiz"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "User_response" ADD CONSTRAINT "User_response_reflection_id_fkey" FOREIGN KEY ("reflection_id") REFERENCES "Reflection"("id") ON DELETE SET NULL ON UPDATE CASCADE;
