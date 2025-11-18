import "dotenv/config";
import { defineConfig, env } from "prisma/config";
import { PrismaPg } from "@prisma/adapter-pg";

const connectionString = env("DATABASE_URL");

export default defineConfig({
  experimental: {
    adapter: true,
  },
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "ts-node --project tsconfig.seed.json prisma/seed.ts",
  },
  engine: "js",
  adapter: async () => new PrismaPg({ connectionString }),
});
