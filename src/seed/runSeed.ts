import * as fs from "fs";
import * as path from "path";
import bcrypt from "bcrypt";
import { randomUUID } from "crypto";
import type {
  Prisma,
  PrismaClient,
  RefreshToken,
  User,
} from "../../generated/prisma/client.js";

type QuizSeed = {
  order_index: number;
  question: string;
  question_type: string;
  media_url: string;
  options: Prisma.InputJsonValue;
  correct_option_index: number[];
  explanation: string;
};

type ConceptSeed = {
  order_index: number;
  title: string;
  definition: string;
  why_it_works: string;
  tutorial: {
    order_index: number;
    good_story: string;
    good_media_url: string;
    bad_story: string;
    bad_media_url: string;
  };
  summary: {
    order_index: number;
    summary_content: string;
    next_chapter_intro: string;
  };
  quizzes?: QuizSeed[];
};

type CourseContent = {
  module: {
    title: string;
    description: string;
    order_index: number;
  };
  theme: {
    title: string;
    context: string;
    media_url: string;
    media_type: string;
    question: string;
  };
  concepts: ConceptSeed[];
  reflection: {
    module_summary: string;
    module_summary_media_url: string;
    learning_advice: string;
  };
};

export type SeedRunResult = {
  user: User;
  refreshToken: RefreshToken;
  modulesSeeded: number;
  conceptsSeeded: number;
  quizzesSeeded: number;
};

export async function runSeed(prisma: PrismaClient): Promise<SeedRunResult> {
  await clearDatabase(prisma);

  const { user, refreshToken } = await seedUserWithToken(prisma);
  const seedStats = await seedCourseContent(prisma, user.id);

  return {
    user,
    refreshToken,
    modulesSeeded: seedStats.modulesSeeded,
    conceptsSeeded: seedStats.conceptsSeeded,
    quizzesSeeded: seedStats.quizzesSeeded,
  };
}

async function clearDatabase(prisma: PrismaClient): Promise<void> {
  try {
    await prisma.$executeRawUnsafe(`
      TRUNCATE TABLE
        "User_response",
        "User_concept_progress",
        "RefreshToken",
        "Quiz",
        "Summary",
        "Tutorial",
        "Reflection",
        "Concept",
        "Theme",
        "Module",
        "User"
      RESTART IDENTITY CASCADE
    `);
    return;
  } catch (error) {
    console.warn("⚠️ Truncate failed, falling back to deleteMany/reset:", error);
  }

  await prisma.user_response.deleteMany();
  await prisma.user_concept_progress.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.quiz.deleteMany();
  await prisma.summary.deleteMany();
  await prisma.tutorial.deleteMany();
  await prisma.reflection.deleteMany();
  await prisma.concept.deleteMany();
  await prisma.theme.deleteMany();
  await prisma.module.deleteMany();
  await prisma.user.deleteMany();

  await resetSequences(prisma);
}

async function resetSequences(prisma: PrismaClient): Promise<void> {
  const sequences = [
    "User_id_seq",
    "RefreshToken_id_seq",
    "Module_id_seq",
    "Theme_id_seq",
    "Concept_id_seq",
    "Tutorial_id_seq",
    "Summary_id_seq",
    "Quiz_id_seq",
    "Reflection_id_seq",
    "User_concept_progress_id_seq",
    "User_response_id_seq",
  ];

  for (const sequence of sequences) {
    try {
      await prisma.$executeRawUnsafe(
        `ALTER SEQUENCE "${sequence}" RESTART WITH 1`
      );
    } catch (error) {
      console.warn(`⚠️ Could not reset sequence ${sequence}:`, error);
    }
  }
}

async function seedUserWithToken(prisma: PrismaClient): Promise<{
  user: User;
  refreshToken: RefreshToken;
}> {
  const password_hash = await bcrypt.hash("password123", 10);

  const user = await prisma.user.create({
    data: {
      email: "student@example.com",
      username: "demo_student",
      password_hash,
      role: "STUDENT",
      last_login: new Date(),
    },
  });

  const refreshToken = await prisma.refreshToken.create({
    data: {
      token: randomUUID(),
      user_id: user.id,
      expires_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
    },
  });

  return { user, refreshToken };
}

function loadCourseContent(): CourseContent[] {
  const dataPath = path.join(
    process.cwd(),
    "prisma",
    "seed",
    "course_content.json"
  );
  const raw = fs.readFileSync(dataPath, "utf-8");
  const parsed = JSON.parse(raw);

  if (!Array.isArray(parsed)) {
    throw new Error("course_content.json must be an array of modules");
  }

  return parsed as CourseContent[];
}

async function seedCourseContent(
  prisma: PrismaClient,
  userId: number
): Promise<{
  modulesSeeded: number;
  conceptsSeeded: number;
  quizzesSeeded: number;
}> {
  const modules = loadCourseContent();
  let conceptsSeeded = 0;
  let quizzesSeeded = 0;

  for (const moduleData of modules) {
    const result = await seedModule(prisma, moduleData, userId);
    conceptsSeeded += result.conceptsCreated;
    quizzesSeeded += result.quizzesCreated;
  }

  return {
    modulesSeeded: modules.length,
    conceptsSeeded,
    quizzesSeeded,
  };
}

async function seedModule(
  prisma: PrismaClient,
  data: CourseContent,
  userId: number
): Promise<{ conceptsCreated: number; quizzesCreated: number }> {
  const { module: moduleInfo, theme, concepts, reflection } = data;

  const module = await prisma.module.create({
    data: {
      title: moduleInfo.title,
      description: moduleInfo.description,
      order_index: moduleInfo.order_index,
    },
  });

  await prisma.theme.create({
    data: {
      module_id: module.id,
      title: theme.title,
      context: theme.context,
      media_url: theme.media_url,
      media_type: theme.media_type,
      question: theme.question,
    },
  });

  let quizzesCreated = 0;

  for (const conceptData of concepts) {
    const concept = await prisma.concept.create({
      data: {
        module_id: module.id,
        order_index: conceptData.order_index,
        title: conceptData.title,
        definition: conceptData.definition,
        why_it_works: conceptData.why_it_works,
      },
    });

    await prisma.tutorial.create({
      data: {
        concept_id: concept.id,
        order_index: conceptData.tutorial.order_index,
        good_story: conceptData.tutorial.good_story,
        good_media_url: conceptData.tutorial.good_media_url,
        bad_story: conceptData.tutorial.bad_story,
        bad_media_url: conceptData.tutorial.bad_media_url,
      },
    });

    await prisma.summary.create({
      data: {
        concept_id: concept.id,
        order_index: conceptData.summary.order_index,
        summary_content: conceptData.summary.summary_content,
        next_chapter_intro: conceptData.summary.next_chapter_intro,
      },
    });

    for (const quizData of conceptData.quizzes || []) {
      await prisma.quiz.create({
        data: {
          concept_id: concept.id,
          order_index: quizData.order_index,
          question: quizData.question,
          question_type: quizData.question_type,
          media_url: quizData.media_url,
          options: quizData.options,
          correct_option_index: quizData.correct_option_index,
          explanation: quizData.explanation,
        },
      });
      quizzesCreated += 1;
    }
  }

  await prisma.reflection.create({
    data: {
      module_id: module.id,
      order_index: 1,
      user_id: userId,
      module_summary: reflection.module_summary,
      module_summary_media_url: reflection.module_summary_media_url,
      learning_advice: reflection.learning_advice,
    },
  });

  return { conceptsCreated: concepts.length, quizzesCreated };
}
