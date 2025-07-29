import express from "express";
import authRoutes from "./src/routes/auth"; // Express
import studentsRouter from "./src/routes/students"; // Express
import { assignmentsRouter } from "./src/routes/assignments"; // Express
import { assignmentSubmissionsRouter } from "./src/routes/assignmentSubmissions";
import { quizzesRouter } from "./src/routes/quizzes";
import { quizQuestionRouter } from "./src/routes/quizQuestions";
import { quizSubmissionsRouter } from "./src/routes/quizSubmissions";

const app = express();
app.use(express.json());

app.use("/auth", authRoutes);
app.use("/students", studentsRouter);
app.use("/assignments", assignmentsRouter);
app.use("/assignment_submissions", assignmentSubmissionsRouter);
app.use("/quizzes", quizzesRouter);
app.use("/quiz_question", quizQuestionRouter);
app.use("/quiz_submissions", quizSubmissionsRouter);

app.listen(3000, "0.0.0.0", () => {
  console.log("✅ Server running on http://0.0.0.0:3000");
});