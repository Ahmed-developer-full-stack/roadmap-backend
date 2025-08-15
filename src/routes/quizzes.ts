import express from "express";
import { supabase } from "../lib/supabase";

export const quizzesRouter = express.Router();

// Get all quizzes
quizzesRouter.get("/", async (_, res) => {
  const { data, error } = await supabase.from("quizzes").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

// Create quiz
quizzesRouter.post("/", async (req, res) => {
  const { title, description, time_limit, is_active = true } = req.body;
  const { data, error } = await supabase
    .from("quizzes")
    .insert([{ title, description, time_limit, is_active }])
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: "Quiz created", data });
});

// Update quiz
quizzesRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, time_limit, is_active } = req.body;

  const { data, error } = await supabase
    .from("quizzes")
    .update({ title, description, time_limit, is_active })
    .eq("id", id)
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: "Quiz updated", data });
});

// Toggle active status only
quizzesRouter.patch("/:id/toggle", async (req, res) => {
  const { id } = req.params;
  const { is_active } = req.body;

  const { data, error } = await supabase
    .from("quizzes")
    .update({ is_active })
    .eq("id", id)
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: "Quiz status updated", data });
});

// Delete quiz
quizzesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: "Quiz deleted successfully" });
});
