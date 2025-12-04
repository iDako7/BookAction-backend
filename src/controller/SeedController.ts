import type { Request, Response } from "express";
import { SeedService } from "../services/SeedService.js";

export class SeedController {
  private seedService: SeedService;

  constructor(seedService: SeedService) {
    this.seedService = seedService;
  }

  async run(req: Request, res: Response): Promise<void> {
    try {
      if (process.env.ENABLE_SEED_ENDPOINT !== "true") {
        res.status(403).json({
          error: "Seed endpoint disabled. Set ENABLE_SEED_ENDPOINT=true.",
        });
        return;
      }

      const configuredToken = process.env.SEED_ENDPOINT_TOKEN;
      if (!configuredToken) {
        res.status(500).json({ error: "Seed token not configured" });
        return;
      }

      const headerToken = getHeaderValue(req.headers["x-seed-token"]);
      const bearerToken = getBearerToken(req.headers.authorization);
      const providedToken = headerToken || bearerToken;

      if (!providedToken || providedToken !== configuredToken) {
        res.status(401).json({ error: "Unauthorized seed request" });
        return;
      }

      const result = await this.seedService.seed();

      res.status(201).json({
        message: "Database seeded",
        user: {
          id: result.user.id,
          email: result.user.email,
          refreshToken: result.refreshToken.token,
        },
        stats: {
          modules: result.modulesSeeded,
          concepts: result.conceptsSeeded,
          quizzes: result.quizzesSeeded,
        },
      });
    } catch (error: any) {
      console.error("Seed endpoint error:", error);
      res.status(500).json({ error: "Seeding failed" });
    }
  }
}

function getBearerToken(header?: string): string | null {
  if (!header) {
    return null;
  }

  const [scheme, token] = header.split(" ");
  if (scheme !== "Bearer" || !token) {
    return null;
  }

  return token;
}

function getHeaderValue(value: string | string[] | undefined): string | null {
  if (!value) {
    return null;
  }
  return Array.isArray(value) ? value[0] : value;
}
