import { Router } from "express";
import { ConceptRepository } from "../repositories/ConceptRepository.js";
import { UserProgressRepository } from "../repositories/UserProgressRepository.js"; // Import
import { ConceptService } from "../services/ConceptService.js";
import { UserProgressService } from "../services/UserProgressService.js"; // Import
import { ConceptController } from "../controller/ConceptController.js";
import prisma from "../lib/prisma.js";

const router = Router();

// Initialize Repositories
const conceptRepo = new ConceptRepository(prisma);
const userProgressRepo = new UserProgressRepository(prisma); // Init

// Initialize Services
const conceptService = new ConceptService(conceptRepo);
const userProgressService = new UserProgressService(userProgressRepo); // Init

// Initialize Controller with both services
const conceptController = new ConceptController(
  conceptService,
  userProgressService
);

router.get("/concepts/:conceptId/tutorial", async (req, res) => {
  conceptController.getConceptTutorial(req, res);
});

router.get("/concepts/:conceptId/quiz", async (req, res) => {
  conceptController.getConceptQuizzes(req, res);
});

router.get("/concepts/:conceptId/summary", async (req, res) => {
  conceptController.getConceptSummary(req, res);
});

router.post("/quiz/:quizId/answer", async (req, res) => {
  conceptController.saveUserQuizAns(req, res);
});

// New Route: Update Progress
router.post("/concepts/:conceptId/progress", async (req, res) => {
  conceptController.updateConceptProgress(req, res);
});

export default router;
