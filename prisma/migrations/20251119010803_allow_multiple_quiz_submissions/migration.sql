-- DropIndex
DROP INDEX "User_response_quiz_id_user_id_key";

-- DropIndex
DROP INDEX "User_response_reflection_id_user_id_key";

-- CreateIndex
CREATE INDEX "User_response_quiz_id_user_id_idx" ON "User_response"("quiz_id", "user_id");

-- CreateIndex
CREATE INDEX "User_response_reflection_id_user_id_idx" ON "User_response"("reflection_id", "user_id");
