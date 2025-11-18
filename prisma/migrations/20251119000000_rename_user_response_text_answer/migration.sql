-- Rename the column to match the Prisma schema field
ALTER TABLE "User_response" RENAME COLUMN "response_text" TO "text_answer";
