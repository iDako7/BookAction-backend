import { Router } from "express";
import { LearningStyleController } from "../controller/LearningStyleController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createLearningStyleRoutes(
  controller: LearningStyleController
): Router {
  const router = Router();

  // GET /api/learning-style/questions — returns hardcoded questions
  router.get("/questions", authMiddleware, (req, res) =>
    controller.getQuestions(req, res)
  );

  // POST /api/learning-style/submit — submit quiz responses
  router.post("/submit", authMiddleware, (req, res) =>
    controller.submitQuiz(req, res)
  );

  // GET /api/learning-style/profile — get saved profile
  router.get("/profile", authMiddleware, (req, res) =>
    controller.getProfile(req, res)
  );

  return router;
}
