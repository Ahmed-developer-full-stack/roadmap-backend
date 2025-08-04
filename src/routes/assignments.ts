import express from "express";
import multer from "multer";
import { supabase } from "../lib/supabase";
import { randomUUID } from "crypto";

export const assignmentsRouter = express.Router();

// إعداد multer لتخزين الملفات مؤقتًا في الذاكرة
const storage = multer.memoryStorage();
const upload = multer({ storage });

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
      .from("assignments") // تأكد إن عندك bucket اسمه assignments
      .upload(fileName, req.file.buffer, {
        contentType: req.file.mimetype,
        upsert: true,
      });

    if (uploadError) {
      return res.status(500).json({ error: "File upload failed." });
    }

    const { data: publicUrl } = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName);

    file_url = publicUrl.publicUrl;
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

  const updatedFields: any = { title, description };

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

    const { data: publicUrl } = supabase.storage
      .from("assignments")
      .getPublicUrl(fileName);

    updatedFields.file_url = publicUrl.publicUrl;
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
