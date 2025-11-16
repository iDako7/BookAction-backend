import { Router } from "express";
import { PrismaClient } from "@prisma/client";
import { ConceptRepository } from "../repositories/ConceptRepository";
import { ConceptService } from "../services/ConceptService";
import { TutorialController } from "../controller/ConceptController";

const router = Router();

const prisma = new PrismaClient();
const conceptRepo = new ConceptRepository(prisma);
const conceptService = new ConceptService(conceptRepo);
const tutorialController = new TutorialController(conceptService);

router.get("/concepts/:conceptId/tutorial", async (req, res) => {
  tutorialController.getConceptTutorial(req, res);
});

export default router;
