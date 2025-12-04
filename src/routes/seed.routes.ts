import { Router } from "express";
import { SeedController } from "../controller/SeedController.js";

export function createSeedRoutes(seedController: SeedController) {
  const router = Router();

  router.post("/seed", async (req, res) => {
    await seedController.run(req, res);
  });

  return router;
}
