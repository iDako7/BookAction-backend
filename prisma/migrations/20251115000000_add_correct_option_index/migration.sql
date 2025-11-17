-- Add the correct_option_index column to store the index of the correct quiz option
ALTER TABLE "Quiz"
ADD COLUMN "correct_option_index" INTEGER;
