"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var fs = require("fs");
var path = require("path");
var prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function () {
        var userId;
        var _this = this;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    console.log("start seeding");
                    // Clear existing data (optional for development)
                    return [4 /*yield*/, clearDatabase()];
                case 1:
                    // Clear existing data (optional for development)
                    _a.sent();
                    return [4 /*yield*/, (function () { return __awaiter(_this, void 0, void 0, function () {
                            return __generator(this, function (_a) {
                                // Since User table isn't in your schema,
                                // just return a test ID for now
                                return [2 /*return*/, 1];
                            });
                        }); })()];
                case 2:
                    userId = _a.sent();
                    // seed module 1
                    return [4 /*yield*/, seedModule(userId)];
                case 3:
                    // seed module 1
                    _a.sent();
                    console.log("seed completed!");
                    return [2 /*return*/];
            }
        });
    });
}
function clearDatabase() {
    return __awaiter(this, void 0, void 0, function () {
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0: 
                // Delete in reverse order of dependencies
                return [4 /*yield*/, prisma.user_response.deleteMany()];
                case 1:
                    // Delete in reverse order of dependencies
                    _a.sent();
                    return [4 /*yield*/, prisma.user_concept_progress.deleteMany()];
                case 2:
                    _a.sent();
                    return [4 /*yield*/, prisma.quiz.deleteMany()];
                case 3:
                    _a.sent();
                    return [4 /*yield*/, prisma.summary.deleteMany()];
                case 4:
                    _a.sent();
                    return [4 /*yield*/, prisma.tutorial.deleteMany()];
                case 5:
                    _a.sent();
                    return [4 /*yield*/, prisma.reflection.deleteMany()];
                case 6:
                    _a.sent();
                    return [4 /*yield*/, prisma.concept.deleteMany()];
                case 7:
                    _a.sent();
                    return [4 /*yield*/, prisma.theme.deleteMany()];
                case 8:
                    _a.sent();
                    return [4 /*yield*/, prisma.module.deleteMany()];
                case 9:
                    _a.sent();
                    console.log("🗑️ Database cleared");
                    return [2 /*return*/];
            }
        });
    });
}
function seedModule(userId) {
    return __awaiter(this, void 0, void 0, function () {
        var dataPath, data, module, _i, _a, conceptData, concept, _b, _c, quizData;
        return __generator(this, function (_d) {
            switch (_d.label) {
                case 0:
                    dataPath = path.join(process.cwd(), "prisma", "seed", "module1.json");
                    data = JSON.parse(fs.readFileSync(dataPath, "utf-8"));
                    return [4 /*yield*/, prisma.module.create({
                            data: {
                                title: data.module.title,
                                description: data.module.description,
                                order_index: data.module.order_index,
                            },
                        })];
                case 1:
                    module = _d.sent();
                    console.log("\uD83D\uDCE6 Created module: ".concat(module.title));
                    // 2. Create Theme
                    return [4 /*yield*/, prisma.theme.create({
                            data: {
                                module_id: module.id,
                                title: data.theme.title,
                                context: data.theme.context,
                                media_url: data.theme.media_url || null,
                                media_type: data.theme.media_type,
                                question: data.theme.question,
                            },
                        })];
                case 2:
                    // 2. Create Theme
                    _d.sent();
                    _i = 0, _a = data.concepts;
                    _d.label = 3;
                case 3:
                    if (!(_i < _a.length)) return [3 /*break*/, 12];
                    conceptData = _a[_i];
                    return [4 /*yield*/, prisma.concept.create({
                            data: {
                                module_id: module.id,
                                order_index: conceptData.order_index,
                                title: conceptData.title,
                                definition: conceptData.definition,
                                why_it_works: conceptData.why_it_works,
                            },
                        })];
                case 4:
                    concept = _d.sent();
                    // 3a. create tutorial
                    return [4 /*yield*/, prisma.tutorial.create({
                            data: {
                                concept_id: concept.id,
                                order_index: 1,
                                good_story: conceptData.tutorial.good_story,
                                good_media_url: conceptData.tutorial.good_media_url || null,
                                bad_story: conceptData.tutorial.bad_story,
                                bad_media_url: conceptData.tutorial.bad_media_url || null,
                            },
                        })];
                case 5:
                    // 3a. create tutorial
                    _d.sent();
                    // 3b. Create Summary
                    return [4 /*yield*/, prisma.summary.create({
                            data: {
                                concept_id: concept.id,
                                order_index: 1,
                                summary_content: conceptData.summary.summary_content,
                                next_chapter_intro: conceptData.summary.next_chapter_intro,
                            },
                        })];
                case 6:
                    // 3b. Create Summary
                    _d.sent();
                    _b = 0, _c = conceptData.quizzes || [];
                    _d.label = 7;
                case 7:
                    if (!(_b < _c.length)) return [3 /*break*/, 10];
                    quizData = _c[_b];
                    return [4 /*yield*/, prisma.quiz.create({
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
                        })];
                case 8:
                    _d.sent();
                    _d.label = 9;
                case 9:
                    _b++;
                    return [3 /*break*/, 7];
                case 10:
                    console.log("\uD83D\uDCA1 Created concept: ".concat(concept.title));
                    _d.label = 11;
                case 11:
                    _i++;
                    return [3 /*break*/, 3];
                case 12: 
                // 4. Create Reflection
                return [4 /*yield*/, prisma.reflection.create({
                        data: {
                            module_id: module.id,
                            order_index: 1,
                            user_id: userId,
                            time_spent: 0,
                            module_summary: data.reflection.module_summary,
                            module_summary_media_url: data.reflection.module_summary_media_url || null,
                            learning_advice: data.reflection.learning_advice,
                        },
                    })];
                case 13:
                    // 4. Create Reflection
                    _d.sent();
                    console.log("\uD83E\uDD14 Created reflection");
                    return [2 /*return*/];
            }
        });
    });
}
// Option 1: Using async/await with try-catch-finally
function runSeed() {
    return __awaiter(this, void 0, void 0, function () {
        var error_1;
        return __generator(this, function (_a) {
            switch (_a.label) {
                case 0:
                    _a.trys.push([0, 2, 3, 5]);
                    return [4 /*yield*/, main()];
                case 1:
                    _a.sent();
                    return [3 /*break*/, 5];
                case 2:
                    error_1 = _a.sent();
                    console.error("❌ Seed failed:", error_1);
                    process.exit(1);
                    return [3 /*break*/, 5];
                case 3: return [4 /*yield*/, prisma.$disconnect()];
                case 4:
                    _a.sent();
                    return [7 /*endfinally*/];
                case 5: return [2 /*return*/];
            }
        });
    });
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
