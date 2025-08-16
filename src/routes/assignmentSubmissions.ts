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


assignmentSubmissionsRouter.post("/", upload.single("file"), async (req, res) => {
  const { assignment_id, student_id, content } = req.body;

  if (!assignment_id || !student_id) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  let file_url = null;

  if (req.file) {
    const fileName = `${uuidv4()}-${req.file.originalname}`;

    const { error: uploadError } = await supabase.storage
      .from("submissions")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
      });

    if (uploadError) {
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: publicUrl } = supabase.storage
      .from("submissions")
      .getPublicUrl(fileName);

    file_url = publicUrl.publicUrl;
  }

  const { data, error } = await supabase.from("assignment_submissions").insert([
    {
      assignment_id,
      student_id,
      content, // نص عادي
      file_url, // رابط الملف لو موجود
      submitted_at: new Date().toISOString(),
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

assignmentSubmissionsRouter.delete("/:id/grade", async (req, res) => {
  const { id } = req.params;

  const { data, error } = await supabase
    .from("assignment_submissions")
    .update({ grade: null })
    .eq("id", id);

  if (error) return res.status(500).json({ error: error.message });

  res.status(200).json({ message: "Grade deleted successfully", data });
});

