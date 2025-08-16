import express from "express";
import { supabase } from "../lib/supabase";
import multer from "multer";
import { v4 as uuidv4 } from "uuid";

export const assignmentSubmissionsRouter = express.Router();

// إعداد multer للتخزين في الذاكرة
const storage = multer.memoryStorage();
const upload = multer({ storage });

// ✅ Get all submissions
assignmentSubmissionsRouter.get("/", async (_, res) => {
  try {
    const { data, error } = await supabase.from("assignment_submissions").select(`
      *,
      students (
        name
      )
    `);

    if (error) throw error;

    res.json({ data });
  } catch (err: any) {
    console.error("❌ GET /submissions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Check if submitted
assignmentSubmissionsRouter.get("/check", async (req, res) => {
  try {
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

    if (error) throw error;

    if (!data) {
      return res.status(404).json({ status: "not_found" });
    }

    res.json({ status: "submitted", data });
  } catch (err: any) {
    console.error("❌ GET /submissions/check error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Submit new assignment
assignmentSubmissionsRouter.post("/", upload.single("file"), async (req, res) => {
  try {
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
        console.error("❌ Supabase upload error:", uploadError.message);
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
        content,
        file_url,
        submitted_at: new Date().toISOString(),
      },
    ]);

    if (error) throw error;

    res.status(201).json({ message: "Submission added", data });
  } catch (err: any) {
    console.error("❌ POST /submissions error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Update grade
assignmentSubmissionsRouter.patch("/:id/grade", async (req, res) => {
  try {
    const { id } = req.params;
    const { grade } = req.body;

    if (grade === undefined) {
      return res.status(400).json({ error: "Missing grade value" });
    }

    const { data, error } = await supabase
      .from("assignment_submissions")
      .update({ grade })
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ message: "Grade updated successfully", data });
  } catch (err: any) {
    console.error("❌ PATCH /submissions/:id/grade error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

// ✅ Delete grade
assignmentSubmissionsRouter.delete("/:id/grade", async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from("assignment_submissions")
      .update({ grade: null })
      .eq("id", id);

    if (error) throw error;

    res.status(200).json({ message: "Grade deleted successfully", data });
  } catch (err: any) {
    console.error("❌ DELETE /submissions/:id/grade error:", err.message);
    res.status(500).json({ error: err.message });
  }
});
