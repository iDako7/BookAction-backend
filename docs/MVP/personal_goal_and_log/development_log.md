# Development Log

## Phase 1

- Goal: implement DB using Prisma and basic API system using express
- Result: accomplished goal and deployed the server online using render
- Start from around Nov 8th, finished at Nov 10th

## Phase 2.1 OOP Refactoring

- Goal: using DDD to refactor the controller, model layer logic, to make it more sustainable even more understandable
- Result
  - accomplished the goal and refactor the routes too
  - Use only **two day** learnt everything for front-end and finished the front-end web page from scratch and deployed it online using Figma and Gemini3!
- Time Line
  - Nov 10th--20th, finished backend part
  - Nov 21-23rd, finished frontend part.

### Daily Log

- **Task : finish the post end-point **
- **problem**
  - **AI Overshoot Issue:** I completed one of the POST endpoints and attempted to have an AI model generate the remaining one for me. However, both ChatGPT and Claude produced over-engineered solutions with incorrect request bodies that referenced the wrong IDs. This error should have been easy to avoid, as the inconsistency becomes immediately apparent when compared with the data schema.
  - **Missing Repository File:** I forgot to create a new repository file for handling user_progress queries.
  - **Incorrect Use of Quiz Type in\*\***save_user_for_quiz\***\*:** In the save_user_for_quiz method, I used the quiz type from the incoming request to calculate the quiz score. I extracted quiz_type directly from the request instead of retrieving it from the database using quiz_id. This caused an error when the mock request contained mismatched quiz_id and quiz_type values.

## Phase 2.2 Authentication

Start from Nov 24th
