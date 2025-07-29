import express from "express";
import { supabase } from "../lib/supabase";

export const quizSubmissionsRouter = express.Router();

// ✅ Get all submissions
quizSubmissionsRouter.get("/", async (_, res) => {
  const { data, error } = await supabase.from("quiz_submissions").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

quizSubmissionsRouter.post("/", async (req, res) => {
  const { quiz_id, student_id, name, answers } = req.body;

  if (!quiz_id || !student_id || !answers) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  // Get correct answers from quiz
  const { data: questions, error: fetchError } = await supabase
    .from("quiz_question")
    .select("correct_option")
    .eq("quiz_id", quiz_id);

  if (fetchError) return res.status(500).json({ error: fetchError.message });

  const correctAnswers = questions.map((q) => q.correct_option);

  // Calculate score
  let score = 0;
  for (let i = 0; i < answers.length; i++) {
    if (answers[i] === correctAnswers[i]) {
      score++;
    }
  }

  const submitted_at = new Date().toISOString();

  // Insert submission
  const { data, error } = await supabase.from("quiz_submissions").insert([
    {
      quiz_id,
      student_id,
      name,
      answers,
      score,
      submitted_at,
    },
  ]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: "Quiz submitted", data });
});
