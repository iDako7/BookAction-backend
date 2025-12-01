import { Router } from "express";
import { ConceptController } from "../controller/ConceptController.js";

export function createConceptRoutes(conceptController: ConceptController) {
  const router = Router();

  router.get("/:conceptId/tutorial", async (req, res) => {
    conceptController.getConceptTutorial(req, res);
  });

  router.get("/:conceptId/quiz", async (req, res) => {
    conceptController.getConceptQuizzes(req, res);
  });

  router.get("/:conceptId/summary", async (req, res) => {
    conceptController.getConceptSummary(req, res);
  });

  router.post("/quiz/:quizId/answer", async (req, res) => {
    conceptController.saveUserQuizAns(req, res);
  });

  // New Route: Update Progress
  router.post("/:conceptId/progress", async (req, res) => {
    conceptController.updateConceptProgress(req, res);
  });

  return router;
}
