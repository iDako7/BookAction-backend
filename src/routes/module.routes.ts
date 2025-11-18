import { Router } from "express";
import { ModuleRepository } from "../repositories/ModuleRepository";
import { ModuleService } from "../services/ModuleService";
import { ModuleController } from "../controller/ModuleController";
import prisma from "../lib/prisma";

const router = Router();

const moduleRepo = new ModuleRepository(prisma);
const moduleService = new ModuleService(moduleRepo);
const moduleController = new ModuleController(moduleService);

router.get("/modules/:moduleId/theme", async (req, res) => {
  moduleController.getModuleTheme(req, res);
});

router.get("/modules/:moduleId/reflection", async (req, res) => {
  moduleController.getModuleReflection(req, res);
});

router.get("/modules/overview", async (req, res) => {
  moduleController.getModulesOverview(req, res);
});

router.post("/modules/:moduleId/reflection", async (req, res) => {
  moduleController.saveModuleReflection(req, res);
});

export default router;
