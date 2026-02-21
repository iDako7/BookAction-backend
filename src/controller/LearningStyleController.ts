import { Request, Response } from "express";
import { LearningStyleService } from "../services/LearningStyleService.js";

const LEARNING_STYLE_QUESTIONS = [
  {
    question: "When learning a new skill, you prefer to:",
    options: [
      "Watch a demonstration or diagram",
      "Read instructions or listen to an explanation",
      "Try it out with a real-life example",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
  {
    question: "When you need to remember information, you:",
    options: [
      "Draw a diagram or mind map",
      "Write notes or repeat it aloud",
      "Connect it to a situation you've experienced",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
  {
    question: "In a class or workshop, you learn best from:",
    options: [
      "Slides, charts, and visual displays",
      "Lectures and detailed explanations",
      "Case studies and hands-on activities",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
  {
    question: "When solving a problem, you tend to:",
    options: [
      "Sketch it out or visualize the solution",
      "Talk through the logic step-by-step",
      "Think of a similar real-world situation",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
  {
    question: "When reading a textbook, you find it helpful to:",
    options: [
      "Focus on diagrams, images, and graphs",
      "Highlight key phrases and definitions",
      "Look for examples and application stories",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
  {
    question: "You recall a presentation best when it includes:",
    options: [
      "Charts, graphs, and visual aids",
      "A structured verbal walkthrough",
      "A case study or story",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
  {
    question: "When giving directions, you prefer to:",
    options: [
      "Draw a map or show on a screen",
      "Describe each turn verbally",
      "Give a landmark-based story route",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
  {
    question: "When something isn't working, you first:",
    options: [
      "Look for a visual guide or schematic",
      "Search for written documentation",
      "Think about a time you fixed something similar",
    ],
    styleMap: ["VISUAL", "VERBAL", "SCENARIO"],
  },
];

export class LearningStyleController {
  private learningStyleService: LearningStyleService;

  constructor(learningStyleService: LearningStyleService) {
    this.learningStyleService = learningStyleService;
  }

  async getQuestions(_req: Request, res: Response): Promise<void> {
    const questions = LEARNING_STYLE_QUESTIONS.map((q) => ({
      question: q.question,
      options: q.options,
    }));
    res.status(200).json(questions);
  }

  async submitQuiz(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId as number;
    const { responses } = req.body as { responses: string[] };

    const result = await this.learningStyleService.saveProfile(userId, responses);
    res.status(200).json(result);
  }

  async getProfile(req: Request, res: Response): Promise<void> {
    const userId = req.user!.userId as number;
    const profile = await this.learningStyleService.getProfile(userId);
    res.status(200).json(profile);
  }
}
