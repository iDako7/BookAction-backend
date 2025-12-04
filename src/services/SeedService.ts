import type { PrismaClient } from "../../generated/prisma/client.js";
import { runSeed, type SeedRunResult } from "../seed/runSeed.js";

export class SeedService {
  private prisma: PrismaClient;

  constructor(prismaClient: PrismaClient) {
    this.prisma = prismaClient;
  }

  async seed(): Promise<SeedRunResult> {
    return runSeed(this.prisma);
  }
}
