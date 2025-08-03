import express from "express";
import { supabase } from "../lib/supabase";

export const assignmentsRouter = express.Router();

// 📥 Get all assignments
assignmentsRouter.get("/", async (req, res) => {
  const { data, error } = await supabase
    .from("assignments")
    .select("*")

  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
});

// ➕ Add new assignment
assignmentsRouter.post("/", async (req, res) => {
  const { title, description, file_url } = req.body;

  if (!title || !description )
    return res.status(400).json({ error: "Missing fields." });

  const { data, error } = await supabase
    .from("assignments")
    .insert([{ title, description }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ message: "Assignment added", data });
});

// ✏️ Update assignment by ID
assignmentsRouter.put("/:id", async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const { data, error } = await supabase
    .from("assignments")
    .update({ title, description })
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Assignment not found." });

  return res.status(200).json({ message: "Assignment updated", data });
});

// 🗑️ Delete assignment by ID
assignmentsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Assignment not found." });

  return res.status(200).json({ message: "Assignment deleted", data });
});
