import express from "express";
import moduleRoutes from "./routes/module.routes";
import conceptRoutes from "./routes/concept.routes";

// 1. Create app
const app = express();

// 2. Add middleware
app.use(express.json());

// ====== 3. Register routes =======

// Use module & concept routes
app.use("/api", moduleRoutes);
app.use("/api", conceptRoutes);

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
