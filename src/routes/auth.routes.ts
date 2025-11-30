import { Router } from "express";
import { AuthController } from "../controller/AuthController.js";

export function createAuthRoutes(authController: AuthController) {
  // why don't write new Router()?
  // because in Express.js, Router is designed as a factory function, not a class constructor.
  const router = Router();

  // public routes
  router.post("/register", (req, res) => authController.register(req, res));
  router.post("/login", (req, res) => authController.login(req, res));
  router.post("/refresh", (req, res) => authController.refreshToken(req, res));
  router.post("/logout", (req, res) => authController.logout(req, res));

  return router;
}
