"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const fs = __importStar(require("fs"));
const path = __importStar(require("path"));
const prisma = new client_1.PrismaClient();
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
async function seedModule(userId) {
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
                    correct_answer: quizData.correct_answer,
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
            time_spent: 0,
            module_summary: data.reflection.module_summary,
            module_summary_media_url: data.reflection.module_summary_media_url || null,
            learning_advice: data.reflection.learning_advice,
        },
    });
    console.log(`🤔 Created reflection`);
}
// Option 1: Using async/await with try-catch-finally
async function runSeed() {
    try {
        await main();
    }
    catch (error) {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    }
    finally {
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
//# sourceMappingURL=seed.js.map