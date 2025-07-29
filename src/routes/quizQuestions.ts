  import express from "express";
  import { supabase } from "../lib/supabase";

  export const quizQuestionRouter = express.Router();

  // ✅ Get All Questions
  quizQuestionRouter.get("/", async (_, res) => {
    const { data, error } = await supabase.from("quiz_question").select("*");
    if (error) return res.status(500).json({ error: error.message });
    res.json({ data });
  });

  // ✅ Create New Question
  quizQuestionRouter.post("/", async (req, res) => {
    const { quiz_id, question, options, correct_option, explanation } = req.body;
    const { data, error } = await supabase
      .from("quiz_question")
      .insert([{ quiz_id, question, options, correct_option, explanation }]);

    if (error) return res.status(500).json({ error: error.message });
    res.status(201).json({ message: "Question added", data });
  });

  // ✅ Update Question
  quizQuestionRouter.patch("/:id", async (req, res) => {
    const { id } = req.params;
    const { quiz_id, question, options, correct_option, explanation } = req.body;

    const { data, error } = await supabase
      .from("quiz_question")
      .update({ quiz_id, question, options, correct_option, explanation })
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: "Question updated", data });
  });

  // ✅ Delete Question
  quizQuestionRouter.delete("/:id", async (req, res) => {
    const { id } = req.params;

    const { error } = await supabase
      .from("quiz_question")
      .delete()
      .eq("id", id);

    if (error) return res.status(500).json({ error: error.message });
    res.status(200).json({ message: "Question deleted successfully" });
  });
