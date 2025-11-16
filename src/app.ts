import express from "express";
import { getLearnHomepage, getResource } from "./services/LearnHomepage";
import type {
  Theme,
  Concept,
  Tutorial,
  Quiz,
  Summary,
  Reflection,
} from "@prisma/client";

import { PrismaClient } from "@prisma/client";
import { ModuleRepository } from "./repositories/ModuleRepository";
import { ModuleService } from "./services/ModuleService";
import { ModuleController } from "./controller/ModuleController";

// 1. Create app
const app = express();

// 2. Add middleware
app.use(express.json());

// ====== 3. Register routes =======

app.get("/api/users/:userId/learning_homepage", async (req, res) => {
  // use method chaining
  getLearnHomepage(parseInt(req.params.userId))
    .then((data) => res.json(data))
    .catch(() => res.status(500).json({ err: "server error" }));
});

const prsisma = new PrismaClient();
const moduleRepo = new ModuleRepository(prsisma);
const moduleService = new ModuleService(moduleRepo);
const moduleController = new ModuleController(moduleService);

app.get("/api/modules/:moduleId/theme", async (req, res) => {
  moduleController.getTheme(req, res);
});

// old version of "/api/modules/:moduleId/theme"
// app.get("/api/modules/:moduleId/theme", async (req, res) => {
//   try {
//     const moduleId = Number.parseInt(req.params.moduleId, 10);
//     if (Number.isNaN(moduleId)) {
//       return res.status(400).json({ err: "invalid module id" });
//     }

//     const theme = (await getResource("theme", moduleId)) as Theme | null;
//     if (!theme) {
//       return res.status(404).json({ err: "theme not found" });
//     }

//     return res.json({
//       title: theme.title,
//       context: theme.context,
//       mediaUrl: theme.media_url,
//       mediaType: theme.media_type,
//       question: theme.question,
//     });
//   } catch (err) {
//     res.status(500).json({ err: "server error" });
//   }
// });

// Get concept tutorial
app.get("/api/concepts/:conceptId/tutorial", async (req, res) => {
  try {
    const conceptId = Number.parseInt(req.params.conceptId, 10);
    if (Number.isNaN(conceptId)) {
      return res.status(400).json({ err: "invalid concept id" });
    }

    const concept = (await getResource("concept", conceptId)) as
      | (Concept & { tutorial: Tutorial | null })
      | null;
    if (!concept) {
      return res.status(404).json({ err: "concept not found" });
    }

    const { tutorial, title, definition, why_it_works } = concept;

    return res.json({
      title,
      definition,
      whyItWorks: why_it_works,
      tutorial: tutorial
        ? {
            goodExample: {
              story: tutorial.good_story,
              mediaUrl: tutorial.good_media_url,
            },
            badExample: {
              story: tutorial.bad_story,
              mediaUrl: tutorial.bad_media_url,
            },
          }
        : null,
    });
  } catch (err) {
    res.status(500).json({ err: "server error" });
  }
});

app.get("/api/concepts/:conceptId/quiz", async (req, res) => {
  try {
    const conceptId = Number.parseInt(req.params.conceptId, 10);
    if (Number.isNaN(conceptId)) {
      return res.status(400).json({ err: "invalid concept id" });
    }

    const quizzes = (await getResource("quiz", conceptId)) as Quiz[];
    return res.json({
      questions: quizzes.map((quiz) => ({
        id: quiz.id,
        question: quiz.question,
        type: quiz.question_type,
        options: quiz.options,
        mediaUrl: quiz.media_url,
      })),
    });
  } catch (err) {
    res.status(500).json({ err: "server error" });
  }
});

app.get("/api/concepts/:conceptId/summary", async (req, res) => {
  try {
    const conceptId = Number.parseInt(req.params.conceptId, 10);
    if (Number.isNaN(conceptId)) {
      return res.status(400).json({ err: "invalid concept id" });
    }

    const summary = (await getResource("summary", conceptId)) as Summary | null;
    if (!summary) {
      return res.status(404).json({ err: "summary not found" });
    }

    res.json({
      summaryContent: summary.summary_content,
      nextConceptIntro: summary.next_chapter_intro,
    });
  } catch (err) {
    res.status(500).json({ err: "server error" });
  }
});

app.get("/api/modules/:moduleId/reflection", async (req, res) => {
  try {
    const moduleId = Number.parseInt(req.params.moduleId, 10);
    if (Number.isNaN(moduleId)) {
      return res.status(400).json({ err: "invalid module id" });
    }

    const reflection = (await getResource(
      "reflection",
      moduleId
    )) as Reflection | null;

    if (!reflection) {
      return res.status(404).json({ err: "reflection not found" });
    }

    return res.json({
      type: "text",
      prompt: reflection.module_summary,
      mediaUrl: reflection.module_summary_media_url,
    });
  } catch (err) {
    res.status(500).json({ err: "server error" });
  }
});

// POST endpoints - just return success
app.post("/api/quiz/:quizId/submit", (req, res) => {
  res.json({
    isCorrect: true,
    explanation: "Great job!",
    conceptProgress: { completed: true },
  });
});

// 4. Start server
app.post("/api/modules/:moduleId/reflection/submit", (req, res) => {
  res.json({
    feedback: "Thank you for your reflection. Practice these skills daily.",
    moduleComplete: true,
  });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
