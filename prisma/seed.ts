import "dotenv/config";
import * as fs from "fs";
import * as path from "path";
import { PrismaClient } from "../generated/prisma/client.js";
import { PrismaPg } from "@prisma/adapter-pg";
import pg from "pg";

const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  console.log("start seeding");

  // Clear existing data (optional for development)
  await clearDatabase();

  // create test user
  const userId = await (async () => {
    // Since User table isn't in your schema,
    // just return a test ID for now
    return 1;
  })();

  // seed module 1
  await seedModule(userId);

  console.log("seed completed!");
}

async function clearDatabase() {
  // Delete in reverse order of dependencies
  await prisma.user_response.deleteMany();
  await prisma.user_concept_progress.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.summary.deleteMany();
  await prisma.tutorial.deleteMany();
  await prisma.reflection.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.module.deleteMany();
  console.log("🗑️ Database cleared");
}

async function seedModule(userId: number) {
  // Load JSON data
  const dataPath = path.join(process.cwd(), "prisma", "seed", "module1.json");
  const data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));

  // 1. Create Module
  const module = await prisma.module.create({
    data: {
      title: data.module.title,
      description: data.module.description,
      order_index: data.module.order_index,
    },
  });
  console.log(`📦 Created module: ${module.title}`);

  // 2. Create Theme
  await prisma.theme.create({
    data: {
      module_id: module.id,
      title: data.theme.title,
      context: data.theme.context,
      media_url: data.theme.media_url || null,
      media_type: data.theme.media_type,
      question: data.theme.question,
    },
  });

  // 3. Create Concepts with related data
  for (const conceptData of data.concepts) {
    const concept = await prisma.concept.create({
      data: {
        module_id: module.id,
        order_index: conceptData.order_index,
        title: conceptData.title,
        definition: conceptData.definition,
        why_it_works: conceptData.why_it_works,
      },
    });

    // 3a. create tutorial
    await prisma.tutorial.create({
      data: {
        concept_id: concept.id,
        order_index: 1,
        good_story: conceptData.tutorial.good_story,
        good_media_url: conceptData.tutorial.good_media_url || null,
        bad_story: conceptData.tutorial.bad_story,
        bad_media_url: conceptData.tutorial.bad_media_url || null,
      },
    });

    // 3b. Create Summary
    await prisma.summary.create({
      data: {
        concept_id: concept.id,
        order_index: 1,
        summary_content: conceptData.summary.summary_content,
        next_chapter_intro: conceptData.summary.next_chapter_intro,
      },
    });

    //  3c. create quizzes
    for (const quizData of conceptData.quizzes || []) {
      await prisma.quiz.create({
        data: {
          concept_id: concept.id,
          order_index: quizData.order_index,
          question: quizData.question,
          question_type: quizData.question_type,
          media_url: quizData.media_url || null,
          options: quizData.options,
          correct_option_index: quizData.correct_option_index,
          explanation: quizData.explanation,
        },
      });
    }

    console.log(`💡 Created concept: ${concept.title}`);
  }

  // 4. Create Reflection
  await prisma.reflection.create({
    data: {
      module_id: module.id,
      order_index: 1,
      user_id: userId,
      module_summary: data.reflection.module_summary,
      module_summary_media_url:
        data.reflection.module_summary_media_url || null,
      learning_advice: data.reflection.learning_advice,
    },
  });
  console.log(`🤔 Created reflection`);
}

// Option 1: Using async/await with try-catch-finally
async function runSeed() {
  try {
    await main();
  } catch (error) {
    console.error("❌ Seed failed:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

runSeed();

// runSeed could write in method chaining on Promise
// main()
//   .catch((error) => {
//     console.error("❌ Seed failed:", error);
//     process.exit(1);
//   })
//   .finally(async () => {
//     await prisma.$disconnect();
//   });
