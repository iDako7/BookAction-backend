import { Router } from "express";
import { PracticeController } from "../controller/PracticeController.js";
import { authMiddleware } from "../middleware/authMiddleware.js";

export function createPracticeRoutes(controller: PracticeController): Router {
  const router = Router();

  // POST /api/practice/generate — generate AI practice questions
  router.post("/generate", authMiddleware, (req, res) =>
    controller.generatePractice(req, res)
  );

  // POST /api/practice/check — check practice answers
  router.post("/check", authMiddleware, (req, res) =>
    controller.checkAnswers(req, res)
  );

  return router;
}
