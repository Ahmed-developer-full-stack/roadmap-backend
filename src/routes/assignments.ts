import express from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";
import { randomUUID } from "crypto";

export const assignmentsRouter = express.Router();

// إعداد multer بتقييد النوع والحجم
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const allowedTypes = ["image/", "application/pdf"];
    if (!allowedTypes.some(type => file.mimetype.startsWith(type))) {
      return cb(new Error("Only images and PDF files are allowed."));
    }
    cb(null, true);
  },
});

// ------------------- [GET] كل الواجبات -------------------
assignmentsRouter.get("/", async (req, res) => {
  const { data, error } = await supabase.from("assignments").select("*");
  if (error) return res.status(500).json({ error: error.message });
  return res.status(200).json({ data });
});

// ------------------- [POST] إضافة واجب مع صورة -------------------
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
      return res.status(500).json({ error: "File upload failed." });
    }

    const publicUrl = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName).data?.publicUrl;

    file_url = publicUrl;
  }

  const { data, error } = await supabase
    .from("assignments")
    .insert([{ title, description, file_url }])
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(201).json({ message: "Assignment added", data });
});

// ------------------- [PUT] تعديل واجب -------------------
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
    if (oldAssignment.file_url) {
      const oldFileName = oldAssignment.file_url.split("/").pop();
      await supabase.storage.from("assignments").remove([oldFileName]);
    }

    // رفع الجديد
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

    const publicUrl = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName).data?.publicUrl;

    updatedFields.file_url = publicUrl;
  }

  const { data, error } = await supabase
    .from("assignments")
    .update(updatedFields)
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });
  if (!data) return res.status(404).json({ error: "Assignment not found." });

  return res.status(200).json({ message: "Assignment updated", data });
});

// ------------------- [DELETE] حذف واجب -------------------
assignmentsRouter.delete("/:id", async (req, res) => {
  const { id } = req.params;

  // نحذف الملف من التخزين أولًا (لو موجود)
  const { data: assignment, error: fetchError } = await supabase
    .from("assignments")
    .select("file_url")
    .eq("id", id)
    .single();

  if (fetchError) return res.status(404).json({ error: "Assignment not found." });

  if (assignment.file_url) {
    const fileName = assignment.file_url.split("/").pop();
    await supabase.storage.from("assignments").remove([fileName]);
  }

  // نحذف الواجب من القاعدة
  const { data, error } = await supabase
    .from("assignments")
    .delete()
    .eq("id", id)
    .select()
    .single();

  if (error) return res.status(500).json({ error: error.message });

  return res.status(200).json({ message: "Assignment deleted", data });
});
