import express from "express";
import { supabase } from "../lib/supabase";

export const assignmentSubmissionsRouter = express.Router();

assignmentSubmissionsRouter.get("/", async (_, res) => {
  const { data, error } = await supabase.from("assignment_submissions").select(`
      *,
      students (
        name
      )
    `);

  if (error) return res.status(500).json({ error: error.message });
  res.json({ data });
});


assignmentSubmissionsRouter.get("/check", async (req, res) => {
  const { assignment_id, student_id } = req.query;

  if (!assignment_id || !student_id) {
    return res.status(400).json({ error: "assignment_id and student_id are required" });
  }

  const { data, error } = await supabase
    .from("assignment_submissions")
    .select("*")
    .eq("assignment_id", assignment_id)
    .eq("student_id", student_id)
    .maybeSingle();

  if (error) return res.status(500).json({ error: error.message });

  if (!data) {
    return res.status(404).json({ status: "not_found" });
  }

  res.json({
    status: "submitted",
    data
  });
});


assignmentSubmissionsRouter.post("/", async (req, res) => {
  const { assignment_id, student_id, content, submitted_at } = req.body;

  if (!assignment_id || !student_id || !content) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const { data, error } = await supabase.from("assignment_submissions").insert([
    {
      assignment_id,
      student_id,
      content,
      submitted_at,
    },
  ]);

  if (error) return res.status(500).json({ error: error.message });
  res.status(201).json({ message: "Submission added", data });
});

assignmentSubmissionsRouter.patch("/:id/grade", async (req, res) => {
  const { id } = req.params;
  const { grade } = req.body;

  if (grade === undefined) {
    return res.status(400).json({ error: "Missing grade value" });
  }

  const { data, error } = await supabase
    .from("assignment_submissions")
    .update({ grade })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });
  res.status(200).json({ message: "Grade updated successfully", data });
});
