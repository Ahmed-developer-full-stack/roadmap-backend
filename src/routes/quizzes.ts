import express from "express";
import { supabase } from "../lib/supabase";

export const quizzesRouter = express.Router();

quizzesRouter.get("/", async (_, res) => {
  const { data, error } = await supabase.from("quizzes").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});

quizzesRouter.post("/", async (req, res) => {
  const { title, description, time_limit } = req.body;
  const { data, error } = await supabase
    .from("quizzes")
    .insert([{ title, description, time_limit }])
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: "Quiz created", data });
});

quizzesRouter.patch("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description, time_limit } = req.body;

  const { data, error } = await supabase
    .from("quizzes")
    .update({ title, description, time_limit })
    .eq("id", id)
    .select("*");

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: "Quiz updated", data });
});

quizzesRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { error } = await supabase.from("quizzes").delete().eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: "Quiz deleted successfully" });
});
