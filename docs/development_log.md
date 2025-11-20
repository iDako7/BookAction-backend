# Development Log

1. **Record yesterday's histroy**
2. **Record I forget to start a new repo class**

## Phase 2.1

- **Task : finish the post end-point **
- **problem**
  - **AI Overshoot Issue:** I completed one of the POST endpoints and attempted to have an AI model generate the remaining one for me. However, both ChatGPT and Claude produced over-engineered solutions with incorrect request bodies that referenced the wrong IDs. This error should have been easy to avoid, as the inconsistency becomes immediately apparent when compared with the data schema.
  - **Missing Repository File:** I forgot to create a new repository file for handling user_progress queries.
  - **Incorrect Use of Quiz Type in\*\***save_user_for_quiz\***\*:** In the save_user_for_quiz method, I used the quiz type from the incoming request to calculate the quiz score. I extracted quiz_type directly from the request instead of retrieving it from the database using quiz_id. This caused an error when the mock request contained mismatched quiz_id and quiz_type values.
