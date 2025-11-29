import express from "express";
import moduleRoutes from "./routes/module.routes.js";
import conceptRoutes from "./routes/concept.routes.js";

// 1. Create app
const app = express();

// 2. Add middleware
app.use(express.json());

// ====== 3. Register routes =======

// Use module & concept routes
app.use("/api", moduleRoutes);
app.use("/api", conceptRoutes);

// 4. Start server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
