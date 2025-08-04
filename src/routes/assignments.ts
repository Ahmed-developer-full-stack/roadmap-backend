import express from "express";
import { upload } from "../middleware/upload";
import { supabase } from "../lib/supabase";
import { randomUUID } from "crypto";

export const assignmentsRouter = express.Router();

assignmentsRouter.get("/", async (req, res) => {
  const { data, error } = await supabase.from("assignments").select("*");
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
});

assignmentsRouter.post("/", upload.single("file"), async (req, res) => {
  const { title, description } = req.body;

  if (!title || !description) {
    return res.status(400).json({ error: "Title and description are required." });
  }

  let file_url = null;

  if (req.file) {
    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `assignment-${randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("assignments")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      console.error("⛔ Supabase Upload Error:", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    const { data: publicUrlData } = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return res.status(500).json({ error: "Failed to retrieve public URL" });
    }

    file_url = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert([{ title, description, file_url }])
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ message: "Assignment added", data });
});

assignmentsRouter.put("/:id", upload.single("file"), async (req, res) => {
  const { id } = req.params;
  const { title, description } = req.body;

  const { data: oldAssignment, error: fetchError } = await supabase
    .from("assignments")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchError) return res.status(404).json({ error: "Assignment not found." });

  const updatedFields: any = {};
  if (title) updatedFields.title = title;
  if (description) updatedFields.description = description;

  if (req.file) {
    // حذف الملف القديم
    if (oldAssignment.file_url) {
      const url = new URL(oldAssignment.file_url);
      const oldFileName = url.pathname.split("/").pop();
      if (oldFileName) {
        await supabase.storage.from("assignments").remove([oldFileName]);
      }
    }

    const fileExt = req.file.originalname.split(".").pop();
    const fileName = `assignment-${randomUUID()}.${fileExt}`;

    const { error: uploadError } = await supabase.storage
      .from("assignments")
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: "File upload failed." });
    }

    const { data: publicUrlData } = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName);

    if (!publicUrlData?.publicUrl) {
      return res.status(500).json({ error: "Failed to retrieve public URL" });
    }

    updatedFields.file_url = publicUrlData.publicUrl;
  }

  const { data, error } = await supabase
    .from("assignments")
    .update(updatedFields)
    .eq("id", id)
    .select("*")
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Assignment not found." });

  return res.status(200).json({ message: "Assignment updated", data });
});

assignmentsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  const { data: assignment, error: fetchError } = await supabase
    .from("assignments")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchError) return res.status(404).json({ error: "Assignment not found." });

  if (assignment.file_url) {
    const url = new URL(assignment.file_url);
    const fileName = url.pathname.split("/").pop();
    if (fileName) {
      await supabase.storage.from("assignments").remove([fileName]);
    }
  }

  const { data, error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: "Assignment deleted", data });
});

assignmentsRouter.use((err, req, res, next) => {
  if (err instanceof multer.MulterError || err.message.includes("Only")) {
    return res.status(400).json({ error: err.message });
  }
  next(err);
});
